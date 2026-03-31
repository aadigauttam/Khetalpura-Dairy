const router = require('express').Router();
const { uploadScreenshot, verifyPayment, getPayments } = require('../controllers/payment.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { uploadPayment } = require('../middleware/upload');

router.use(authenticate);

router.post('/upload-screenshot', requireRole('customer'), uploadPayment, uploadScreenshot);
router.patch('/:id/verify', requireRole('admin', 'staff'), verifyPayment);
router.get('/', requireRole('admin', 'staff'), getPayments);

module.exports = router;
