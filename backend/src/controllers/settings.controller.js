const Settings = require('../models/Settings');
const { formatIndianPhone } = require('../config/phone');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const { getFileUrl } = require('../middleware/upload');

/**
 * @route GET /api/settings
 * @desc Get app settings (public)
 */
const getSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.getSettings();
  ApiResponse.success(res, { settings });
});

/**
 * @route PUT /api/settings
 * @desc Update settings (Admin only)
 */
const updateSettings = asyncHandler(async (req, res) => {
  const updates = { ...req.body };

  // Format phone numbers
  if (updates.ownerPhone) updates.ownerPhone = formatIndianPhone(updates.ownerPhone) || updates.ownerPhone;
  if (updates.adminPhone) updates.adminPhone = formatIndianPhone(updates.adminPhone) || updates.adminPhone;
  if (updates.staffPhone) updates.staffPhone = formatIndianPhone(updates.staffPhone) || updates.staffPhone;
  if (updates.contactPhone) updates.contactPhone = formatIndianPhone(updates.contactPhone) || updates.contactPhone;

  const settings = await Settings.updateSettings(updates);
  ApiResponse.success(res, { settings }, 'Settings updated successfully');
});

/**
 * @route POST /api/settings/logo
 * @desc Upload logo (Admin only)
 */
const uploadLogo = asyncHandler(async (req, res) => {
  if (!req.file) {
    return ApiResponse.error(res, 'No logo file provided', 400);
  }

  const logoUrl = getFileUrl(req.file);
  const settings = await Settings.updateSettings({ logo: logoUrl });
  
  ApiResponse.success(res, { settings, logoUrl }, 'Logo uploaded successfully');
});

/**
 * @route POST /api/settings/upi-qr
 * @desc Upload UPI QR code (Admin only)
 */
const uploadUPIQR = asyncHandler(async (req, res) => {
  if (!req.file) {
    return ApiResponse.error(res, 'No QR code file provided', 400);
  }

  const qrUrl = getFileUrl(req.file);
  const settings = await Settings.updateSettings({ upiQr: qrUrl });
  
  ApiResponse.success(res, { settings, qrUrl }, 'UPI QR code uploaded');
});

module.exports = { getSettings, updateSettings, uploadLogo, uploadUPIQR };
