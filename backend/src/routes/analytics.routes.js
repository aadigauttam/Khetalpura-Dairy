const router = require('express').Router();
const { getDashboard, getBestSelling, getSubscriptionAnalytics } = require('../controllers/analytics.controller');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.use(requireRole('admin'));

router.get('/dashboard', getDashboard);
router.get('/products', getBestSelling);
router.get('/subscriptions', getSubscriptionAnalytics);

module.exports = router;
