const axios = require('axios');
const logger = require('../utils/logger');
const { generateOTP } = require('../utils/helpers');
const { validateIndianPhone, formatIndianPhone } = require('../config/phone');

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

/**
 * Send OTP via MSG91 (or mock in development)
 */
async function sendOTP(phone, retryCount = 0) {
  // Validate Indian phone
  if (!validateIndianPhone(phone)) {
    throw new Error('Only Indian mobile numbers (+91) are accepted.');
  }

  const formattedPhone = formatIndianPhone(phone);
  const otp = generateOTP(parseInt(process.env.OTP_LENGTH) || 6);

  // Mock OTP in development
  if (process.env.MOCK_OTP === 'true') {
    logger.info(`📱 [MOCK OTP] Sent OTP ${otp} to ${formattedPhone}`);
    return { success: true, otp, message: 'OTP sent (mock mode)' };
  }

  // Production: Send via MSG91
  try {
    const response = await axios.post(
      `https://control.msg91.com/api/v5/otp?template_id=${process.env.MSG91_FLOW_ID}&mobile=${formattedPhone}`,
      { otp },
      {
        headers: {
          'authkey': process.env.MSG91_AUTH_KEY,
          'content-type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );

    if (response.data && response.data.type === 'success') {
      logger.info(`📱 OTP sent to ${formattedPhone}`);
      return { success: true, otp, message: 'OTP sent successfully' };
    }

    throw new Error(response.data?.message || 'Failed to send OTP');
  } catch (error) {
    logger.error(`OTP send failed (attempt ${retryCount + 1}):`, error.message);

    if (retryCount < MAX_RETRIES - 1) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
      return sendOTP(phone, retryCount + 1);
    }

    throw new Error('Failed to send OTP. Please try again later.');
  }
}

/**
 * Verify OTP via MSG91 (or mock in development)
 */
async function verifyOTP(phone, otp, storedOTP, otpExpiry) {
  const formattedPhone = formatIndianPhone(phone);

  // Mock verification in development
  if (process.env.MOCK_OTP === 'true') {
    // In mock mode, accept the stored OTP or any 6-digit code
    if (otp === storedOTP || /^\d{4,6}$/.test(otp)) {
      logger.info(`✅ [MOCK] OTP verified for ${formattedPhone}`);
      return { success: true, message: 'OTP verified (mock mode)' };
    }
    return { success: false, message: 'Invalid OTP' };
  }

  // Check stored OTP and expiry
  if (!storedOTP || !otpExpiry) {
    return { success: false, message: 'No OTP found. Please request a new one.' };
  }

  if (new Date() > new Date(otpExpiry)) {
    return { success: false, message: 'OTP has expired. Please request a new one.' };
  }

  if (otp !== storedOTP) {
    return { success: false, message: 'Invalid OTP. Please try again.' };
  }

  logger.info(`✅ OTP verified for ${formattedPhone}`);
  return { success: true, message: 'OTP verified successfully' };
}

module.exports = { sendOTP, verifyOTP };
