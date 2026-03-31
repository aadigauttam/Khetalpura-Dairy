const User = require('../models/User');
const { formatIndianPhone } = require('../config/phone');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const bcrypt = require('bcryptjs');

/**
 * @route GET /api/users
 * @desc Get all users (Admin only)
 */
const getUsers = asyncHandler(async (req, res) => {
  const { role, search, page = 1, limit = 20 } = req.query;
  
  const filter = {};
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { address: { $regex: search, $options: 'i' } }
    ];
  }

  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  ApiResponse.paginate(res, users, total, page, limit);
});

/**
 * @route GET /api/users/customers
 * @desc Get all customers (Admin/Staff)
 */
const getCustomers = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  
  const filter = { role: 'customer' };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { address: { $regex: search, $options: 'i' } }
    ];
  }

  const total = await User.countDocuments(filter);
  const customers = await User.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  ApiResponse.paginate(res, customers, total, page, limit);
});

/**
 * @route GET /api/users/:id
 * @desc Get user by ID
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return ApiResponse.notFound(res, 'User not found');
  }
  ApiResponse.success(res, { user });
});

/**
 * @route PUT /api/users/:id
 * @desc Update user (Admin)
 */
const updateUser = asyncHandler(async (req, res) => {
  const { name, address, role, isActive } = req.body;
  
  const user = await User.findById(req.params.id);
  if (!user) {
    return ApiResponse.notFound(res, 'User not found');
  }

  if (name) user.name = name;
  if (address) user.address = address;
  if (role) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;

  await user.save();
  ApiResponse.success(res, { user }, 'User updated successfully');
});

/**
 * @route PUT /api/users/profile
 * @desc Update own profile (Customer)
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, address } = req.body;
  
  const user = await User.findById(req.user.id);
  if (!user) {
    return ApiResponse.notFound(res, 'User not found');
  }

  if (name) user.name = name;
  if (address) user.address = address;

  await user.save();
  ApiResponse.success(res, { user }, 'Profile updated successfully');
});

/**
 * @route POST /api/users/create-staff
 * @desc Create staff/delivery user (Admin only)
 */
const createStaff = asyncHandler(async (req, res) => {
  const { name, phone, password, role, address } = req.body;

  const formattedPhone = formatIndianPhone(phone);
  if (!formattedPhone) {
    return ApiResponse.validationError(res, ['Only Indian mobile numbers (+91) are accepted.']);
  }

  // Check if phone already exists
  const existing = await User.findOne({ phone: formattedPhone });
  if (existing) {
    return ApiResponse.error(res, 'Phone number already registered.', 400);
  }

  if (!['admin', 'staff', 'delivery'].includes(role)) {
    return ApiResponse.validationError(res, ['Role must be admin, staff, or delivery.']);
  }

  const user = await User.create({
    name,
    phone: formattedPhone,
    password,
    role,
    address,
    isVerified: true,
    isActive: true
  });

  ApiResponse.created(res, { user: user.toJSON() }, 'Staff user created successfully');
});

/**
 * @route DELETE /api/users/:id
 * @desc Deactivate user (Admin only)
 */
const deactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return ApiResponse.notFound(res, 'User not found');
  }

  user.isActive = false;
  await user.save();
  ApiResponse.success(res, null, 'User deactivated successfully');
});

/**
 * @route GET /api/users/delivery-boys
 * @desc Get all delivery boys
 */
const getDeliveryBoys = asyncHandler(async (req, res) => {
  const deliveryBoys = await User.find({ role: 'delivery', isActive: true })
    .select('name phone')
    .sort({ name: 1 });
  
  ApiResponse.success(res, { deliveryBoys });
});

module.exports = {
  getUsers,
  getCustomers,
  getUserById,
  updateUser,
  updateProfile,
  createStaff,
  deactivateUser,
  getDeliveryBoys
};
