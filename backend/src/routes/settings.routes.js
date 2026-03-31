const router = require('express').Router();
const { getSettings, updateSettings, uploadLogo, uploadUPIQR } = require('../controllers/settings.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { uploadLogo: uploadLogoMiddleware, uploadQRCode } = require('../middleware/upload');
const { validateSettings } = require('../middleware/validator');

// Public: get settings
router.get('/', getSettings);

// Admin only
router.put('/', authenticate, requireRole('admin'), validateSettings, updateSettings);
router.post('/logo', authenticate, requireRole('admin'), uploadLogoMiddleware, uploadLogo);
router.post('/upi-qr', authenticate, requireRole('admin'), uploadQRCode, uploadUPIQR);

module.exports = router;
