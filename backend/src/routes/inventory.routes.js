const router = require('express').Router();
const { getInventory, updateStock, getLowStockAlerts } = require('../controllers/inventory.controller');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.use(requireRole('admin', 'staff'));

router.get('/', getInventory);
router.get('/alerts', getLowStockAlerts);
router.patch('/:productId', updateStock);

module.exports = router;
