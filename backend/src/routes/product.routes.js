const router = require('express').Router();
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct, toggleAvailability, getCategories } = require('../controllers/product.controller');
const { authenticate, requireRole, optionalAuth } = require('../middleware/auth');
const { uploadProduct } = require('../middleware/upload');
const { validateProduct } = require('../middleware/validator');

// Public routes
router.get('/', optionalAuth, getProducts);
router.get('/categories', getCategories);
router.get('/:id', getProduct);

// Admin only
router.post('/', authenticate, requireRole('admin'), uploadProduct, validateProduct, createProduct);
router.put('/:id', authenticate, requireRole('admin'), uploadProduct, updateProduct);
router.delete('/:id', authenticate, requireRole('admin'), deleteProduct);
router.patch('/:id/availability', authenticate, requireRole('admin'), toggleAvailability);

module.exports = router;
