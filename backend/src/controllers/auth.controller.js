const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendOTP, verifyOTP } = require('../services/otp.service');
const { formatIndianPhone } = require('../config/phone');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });
};

/**
 * @route POST /api/auth/send-otp
 * @desc Send OTP to Indian mobile number
 */
const sendOTPController = asyncHandler(async (req, res) => {
  const phone = formatIndianPhone(req.body.phone);
  
  if (!phone) {
    return ApiResponse.validationError(res, ['Only Indian mobile numbers (+91) are accepted.']);
  }

  // Send OTP
  const result = await sendOTP(phone);
  
  if (!result.success) {
    return ApiResponse.error(res, 'Failed to send OTP. Please try again.', 500);
  }

  // Store OTP in user record (create if not exists)
  const otpExpiry = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES) || 5) * 60 * 1000);
  
  let user = await User.findOne({ phone });
  
  if (user) {
    user.otp = result.otp;
    user.otpExpiry = otpExpiry;
    await user.save();
  } else {
    // Store OTP temporarily - user will be fully created during signup
    await User.findOneAndUpdate(
      { phone },
      { phone, otp: result.otp, otpExpiry, role: 'customer' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  ApiResponse.success(res, { 
    phone: phone,
    otpSent: true,
    expiresIn: `${process.env.OTP_EXPIRY_MINUTES || 5} minutes`,
    ...(process.env.MOCK_OTP === 'true' && { otp: result.otp }) // Only in dev
  }, 'OTP sent successfully');
});

/**
 * @route POST /api/auth/verify-otp
 * @desc Verify OTP and login/register customer
 */
const verifyOTPController = asyncHandler(async (req, res) => {
  const phone = formatIndianPhone(req.body.phone);
  const { otp } = req.body;

  if (!phone) {
    return ApiResponse.validationError(res, ['Only Indian mobile numbers (+91) are accepted.']);
  }

  // Find user with OTP fields
  const user = await User.findOne({ phone }).select('+otp +otpExpiry');
  
  if (!user) {
    return ApiResponse.notFound(res, 'No OTP request found for this number. Please request OTP first.');
  }

  // Verify OTP
  const verification = await verifyOTP(phone, otp, user.otp, user.otpExpiry);
  
  if (!verification.success) {
    return ApiResponse.error(res, verification.message, 400);
  }

  // Clear OTP fields
  user.otp = undefined;
  user.otpExpiry = undefined;
  user.isVerified = true;
  user.lastLogin = new Date();
  await user.save();

  // Check if user has completed signup (has name)
  const isNewUser = !user.name || user.name === '';
  
  // Generate token
  const token = generateToken(user._id);

  ApiResponse.success(res, {
    token,
    user: user.toJSON(),
    isNewUser,
    message: isNewUser ? 'Please complete your profile' : 'Login successful'
  }, isNewUser ? 'OTP verified. Please complete signup.' : 'Login successful');
});

/**
 * @route POST /api/auth/signup
 * @desc Complete customer signup after OTP verification
 */
const signup = asyncHandler(async (req, res) => {
  const phone = formatIndianPhone(req.body.phone);
  const { name, address } = req.body;

  if (!phone) {
    return ApiResponse.validationError(res, ['Only Indian mobile numbers (+91) are accepted.']);
  }

  let user = await User.findOne({ phone });
  
  if (!user) {
    return ApiResponse.error(res, 'Please verify OTP first.', 400);
  }

  if (!user.isVerified) {
    return ApiResponse.error(res, 'Phone number not verified. Please verify OTP first.', 400);
  }

  // Update user profile
  user.name = name;
  user.address = address;
  user.role = 'customer';
  await user.save();

  const token = generateToken(user._id);

  ApiResponse.created(res, {
    token,
    user: user.toJSON()
  }, 'Signup completed successfully');
});

/**
 * @route POST /api/auth/login
 * @desc Staff/Admin/Delivery login with credentials
 */
const staffLogin = asyncHandler(async (req, res) => {
  const phone = formatIndianPhone(req.body.phone);
  const { password } = req.body;

  if (!phone) {
    return ApiResponse.validationError(res, ['Only Indian mobile numbers (+91) are accepted.']);
  }

  const user = await User.findOne({ 
    phone, 
    role: { $in: ['admin', 'staff', 'delivery'] } 
  }).select('+password');

  if (!user) {
    return ApiResponse.unauthorized(res, 'Invalid credentials.');
  }

  if (!user.isActive) {
    return ApiResponse.forbidden(res, 'Account deactivated. Contact admin.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return ApiResponse.unauthorized(res, 'Invalid credentials.');
  }

  user.lastLogin = new Date();
  await user.save();

  const token = generateToken(user._id);

  ApiResponse.success(res, {
    token,
    user: user.toJSON()
  }, 'Login successful');
});

/**
 * @route GET /api/auth/me
 * @desc Get current user profile
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  ApiResponse.success(res, { user });
});

/**
 * @route POST /api/auth/refresh
 * @desc Refresh JWT token
 */
const refreshToken = asyncHandler(async (req, res) => {
  const token = generateToken(req.user.id);
  ApiResponse.success(res, { token }, 'Token refreshed');
});

module.exports = {
  sendOTPController,
  verifyOTPController,
  signup,
  staffLogin,
  getMe,
  refreshToken
};
