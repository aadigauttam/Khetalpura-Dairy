const router = require('express').Router();
const { sendOTPController, verifyOTPController, signup, staffLogin, getMe, refreshToken } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { otpLimiter, authLimiter } = require('../middleware/rateLimiter');
const { validateSendOTP, validateVerifyOTP, validateSignup, validateStaffLogin } = require('../middleware/validator');

// Customer OTP flow
router.post('/send-otp', otpLimiter, validateSendOTP, sendOTPController);
router.post('/verify-otp', otpLimiter, validateVerifyOTP, verifyOTPController);
router.post('/signup', validateSignup, signup);

// Staff/Admin/Delivery login
router.post('/login', authLimiter, validateStaffLogin, staffLogin);

// Authenticated routes
router.get('/me', authenticate, getMe);
router.post('/refresh', authenticate, refreshToken);

module.exports = router;
