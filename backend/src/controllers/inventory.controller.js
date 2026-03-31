const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

/**
 * @route GET /api/inventory
 * @desc Get all inventory
 */
const getInventory = asyncHandler(async (req, res) => {
  const inventory = await Inventory.find()
    .populate('product', 'name nameHi category price unit image isAvailable')
    .populate('updatedBy', 'name')
    .sort({ 'product.category': 1 });

  ApiResponse.success(res, { inventory });
});

/**
 * @route PATCH /api/inventory/:productId
 * @desc Update stock (Staff/Admin)
 */
const updateStock = asyncHandler(async (req, res) => {
  const { quantity, type, reason } = req.body;
  // type: 'add', 'deduct', 'adjust'

  let inventory = await Inventory.findOne({ product: req.params.productId });
  
  if (!inventory) {
    // Create inventory if doesn't exist
    inventory = await Inventory.create({
      product: req.params.productId,
      currentStock: 0,
      updatedBy: req.user._id
    });
  }

  const previousStock = inventory.currentStock;

  switch (type) {
    case 'add':
      inventory.currentStock += Math.abs(quantity);
      break;
    case 'deduct':
      inventory.currentStock = Math.max(0, inventory.currentStock - Math.abs(quantity));
      break;
    case 'adjust':
      inventory.currentStock = Math.max(0, quantity);
      break;
    default:
      return ApiResponse.error(res, 'Invalid type. Use add, deduct, or adjust.', 400);
  }

  // Add movement log
  inventory.movements.push({
    type,
    quantity: Math.abs(quantity),
    reason: reason || `Stock ${type} by ${req.user.name}`,
    performedBy: req.user._id
  });

  inventory.lastUpdated = new Date();
  inventory.updatedBy = req.user._id;
  await inventory.save();

  // Sync Product stock
  await Product.findByIdAndUpdate(req.params.productId, {
    stock: inventory.currentStock
  });

  ApiResponse.success(res, {
    inventory,
    previousStock,
    newStock: inventory.currentStock
  }, 'Stock updated successfully');
});

/**
 * @route GET /api/inventory/alerts
 * @desc Get low stock alerts
 */
const getLowStockAlerts = asyncHandler(async (req, res) => {
  const alerts = await Inventory.find({
    $expr: { $lte: ['$currentStock', '$minThreshold'] }
  })
    .populate('product', 'name nameHi category unit image')
    .sort({ currentStock: 1 });

  ApiResponse.success(res, { alerts, count: alerts.length });
});

module.exports = { getInventory, updateStock, getLowStockAlerts };
