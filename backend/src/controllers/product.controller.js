const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const { getFileUrl } = require('../middleware/upload');

/**
 * @route GET /api/products
 * @desc Get all products (public)
 */
const getProducts = asyncHandler(async (req, res) => {
  const { category, search, available, page = 1, limit = 50 } = req.query;
  
  const filter = { isDeleted: false };
  if (category) filter.category = category;
  if (available !== undefined) filter.isAvailable = available === 'true';
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { nameHi: { $regex: search, $options: 'i' } }
    ];
  }

  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .sort({ category: 1, name: 1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  ApiResponse.paginate(res, products, total, page, limit);
});

/**
 * @route GET /api/products/:id
 * @desc Get single product
 */
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, isDeleted: false });
  if (!product) {
    return ApiResponse.notFound(res, 'Product not found');
  }
  ApiResponse.success(res, { product });
});

/**
 * @route POST /api/products
 * @desc Create product (Admin)
 */
const createProduct = asyncHandler(async (req, res) => {
  const { name, nameHi, description, descriptionHi, category, price, unit, stock, minStock } = req.body;

  const productData = {
    name, nameHi, description, descriptionHi, category, price, unit,
    stock: stock || 0,
    minStock: minStock || 10
  };

  // Handle image upload
  if (req.file) {
    productData.image = getFileUrl(req.file);
  }

  const product = await Product.create(productData);

  // Create inventory record
  await Inventory.create({
    product: product._id,
    currentStock: product.stock,
    minThreshold: product.minStock,
    updatedBy: req.user.id
  });

  ApiResponse.created(res, { product }, 'Product created successfully');
});

/**
 * @route PUT /api/products/:id
 * @desc Update product (Admin)
 */
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, isDeleted: false });
  if (!product) {
    return ApiResponse.notFound(res, 'Product not found');
  }

  const allowedUpdates = ['name', 'nameHi', 'description', 'descriptionHi', 'category', 'price', 'unit', 'stock', 'minStock', 'isAvailable'];
  
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      product[field] = req.body[field];
    }
  });

  // Handle image upload
  if (req.file) {
    product.image = getFileUrl(req.file);
  }

  await product.save();

  // Sync inventory
  await Inventory.findOneAndUpdate(
    { product: product._id },
    { currentStock: product.stock, minThreshold: product.minStock, lastUpdated: new Date(), updatedBy: req.user.id },
    { upsert: true }
  );

  ApiResponse.success(res, { product }, 'Product updated successfully');
});

/**
 * @route DELETE /api/products/:id
 * @desc Soft delete product (Admin)
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return ApiResponse.notFound(res, 'Product not found');
  }

  product.isDeleted = true;
  product.isAvailable = false;
  await product.save();

  ApiResponse.success(res, null, 'Product deleted successfully');
});

/**
 * @route PATCH /api/products/:id/availability
 * @desc Toggle product availability (Admin)
 */
const toggleAvailability = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, isDeleted: false });
  if (!product) {
    return ApiResponse.notFound(res, 'Product not found');
  }

  product.isAvailable = !product.isAvailable;
  await product.save();

  ApiResponse.success(res, { product }, `Product ${product.isAvailable ? 'enabled' : 'disabled'}`);
});

/**
 * @route GET /api/products/categories
 * @desc Get all categories with product counts
 */
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Product.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);

  ApiResponse.success(res, { categories });
});

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleAvailability,
  getCategories
};
