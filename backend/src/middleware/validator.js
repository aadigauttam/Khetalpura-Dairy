const { body, param, query, validationResult } = require('express-validator');
const { validateIndianPhone } = require('../config/phone');
const { ROLES, CATEGORIES, ORDER_STATUS, SUBSCRIPTION_PLANS } = require('../config/constants');

/**
 * Handle validation results
 */
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => e.msg)
    });
  }
  next();
};

/**
 * Indian phone number validator for express-validator
 */
const indianPhoneValidator = (fieldName = 'phone') =>
  body(fieldName)
    .notEmpty().withMessage('Phone number is required')
    .custom((value) => {
      if (!validateIndianPhone(value)) {
        throw new Error('Only Indian mobile numbers (+91) are accepted. Enter a valid 10-digit number starting with 6-9.');
      }
      return true;
    });

// ============================================
// Auth Validators
// ============================================
const validateSendOTP = [
  indianPhoneValidator('phone'),
  handleValidation
];

const validateVerifyOTP = [
  indianPhoneValidator('phone'),
  body('otp')
    .notEmpty().withMessage('OTP is required')
    .isLength({ min: 4, max: 6 }).withMessage('OTP must be 4-6 digits')
    .isNumeric().withMessage('OTP must be numeric'),
  handleValidation
];

const validateSignup = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  indianPhoneValidator('phone'),
  body('address')
    .notEmpty().withMessage('Address is required')
    .isLength({ min: 5, max: 500 }).withMessage('Address must be 5-500 characters'),
  handleValidation
];

const validateStaffLogin = [
  indianPhoneValidator('phone'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidation
];

// ============================================
// Product Validators
// ============================================
const validateProduct = [
  body('name').notEmpty().withMessage('Product name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('unit').notEmpty().withMessage('Unit is required (e.g., ltr, kg, piece)'),
  body('category').isIn(Object.values(CATEGORIES)).withMessage('Invalid category'),
  handleValidation
];

// ============================================
// Order Validators
// ============================================
const validateCreateOrder = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product').notEmpty().withMessage('Product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('paymentMethod').isIn(['upi', 'cod', 'whatsapp']).withMessage('Invalid payment method'),
  handleValidation
];

const validateUpdateStatus = [
  body('status')
    .isIn(Object.values(ORDER_STATUS))
    .withMessage('Invalid order status'),
  handleValidation
];

// ============================================
// Subscription Validators
// ============================================
const validateSubscription = [
  body('products').isArray({ min: 1 }).withMessage('At least one product is required'),
  body('plan').isIn(Object.values(SUBSCRIPTION_PLANS)).withMessage('Invalid subscription plan'),
  handleValidation
];

// ============================================
// Settings Validators
// ============================================
const validateSettings = [
  body('dairyName').optional().isLength({ min: 2 }).withMessage('Dairy name too short'),
  body('ownerPhone').optional().custom((value) => {
    if (value && !validateIndianPhone(value)) {
      throw new Error('Owner phone must be a valid Indian number');
    }
    return true;
  }),
  body('adminPhone').optional().custom((value) => {
    if (value && !validateIndianPhone(value)) {
      throw new Error('Admin phone must be a valid Indian number');
    }
    return true;
  }),
  body('staffPhone').optional().custom((value) => {
    if (value && !validateIndianPhone(value)) {
      throw new Error('Staff phone must be a valid Indian number');
    }
    return true;
  }),
  handleValidation
];

// ============================================
// Pagination Validator
// ============================================
const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  handleValidation
];

module.exports = {
  handleValidation,
  indianPhoneValidator,
  validateSendOTP,
  validateVerifyOTP,
  validateSignup,
  validateStaffLogin,
  validateProduct,
  validateCreateOrder,
  validateUpdateStatus,
  validateSubscription,
  validateSettings,
  validatePagination
};
