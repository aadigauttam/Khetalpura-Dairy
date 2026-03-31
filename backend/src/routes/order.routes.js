const router = require('express').Router();
const { createOrder, getOrders, getOrder, updateOrderStatus, assignDeliveryBoy, markDelivered, repeatOrder, fixFailedOrders } = require('../controllers/order.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { uploadDelivery } = require('../middleware/upload');
const { validateCreateOrder, validateUpdateStatus } = require('../middleware/validator');

router.use(authenticate);

router.post('/', requireRole('customer'), validateCreateOrder, createOrder);
router.get('/', getOrders);
router.get('/:id', getOrder);

// Staff/Admin
router.patch('/:id/status', requireRole('admin', 'staff'), validateUpdateStatus, updateOrderStatus);
router.patch('/:id/assign', requireRole('admin', 'staff'), assignDeliveryBoy);

// Delivery boy
router.patch('/:id/deliver', requireRole('delivery'), uploadDelivery, markDelivered);

// Customer
router.post('/repeat/:id', requireRole('customer'), repeatOrder);

// Admin only
router.post('/fix-failed', requireRole('admin'), fixFailedOrders);

module.exports = router;
