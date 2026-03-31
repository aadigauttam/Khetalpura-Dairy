// ============================================
// Indian Phone Number Validation & Formatting
// ============================================
// Only Indian mobile numbers are accepted
// Format: 91XXXXXXXXXX (country code 91 + 10 digits)
// Valid Indian mobile numbers start with 6, 7, 8, or 9

/**
 * Validate if a phone number is a valid Indian mobile number
 * @param {string} phone - Phone number in any format
 * @returns {boolean} True if valid Indian mobile number
 */
function validateIndianPhone(phone) {
  if (!phone) return false;

  // Clean the number - remove spaces, dashes, parentheses
  const cleaned = String(phone).replace(/[\s\-\(\)\+]/g, '');

  // Check various formats
  let digits;
  
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    // Format: 91XXXXXXXXXX
    digits = cleaned.substring(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    // Format: 0XXXXXXXXXX
    digits = cleaned.substring(1);
  } else if (cleaned.length === 10) {
    // Format: XXXXXXXXXX
    digits = cleaned;
  } else {
    return false;
  }

  // Must be exactly 10 digits and start with 6-9
  if (digits.length !== 10) return false;
  if (!/^[6-9]/.test(digits)) return false;
  if (!/^\d+$/.test(digits)) return false;

  return true;
}

/**
 * Format any valid Indian phone number to standard format: 91XXXXXXXXXX
 * @param {string} phone - Phone number in any format
 * @returns {string|null} Formatted phone number or null if invalid
 */
function formatIndianPhone(phone) {
  if (!validateIndianPhone(phone)) return null;

  const cleaned = String(phone).replace(/[\s\-\(\)\+]/g, '');

  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return cleaned;
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    return '91' + cleaned.substring(1);
  } else if (cleaned.length === 10) {
    return '91' + cleaned;
  }

  return null;
}

/**
 * Get display format for phone number: +91 XXXXX XXXXX
 * @param {string} phone - Phone in standard format (91XXXXXXXXXX)
 * @returns {string} Display formatted phone
 */
function displayPhone(phone) {
  const formatted = formatIndianPhone(phone);
  if (!formatted) return phone;
  
  const digits = formatted.substring(2);
  return `+91 ${digits.substring(0, 5)} ${digits.substring(5)}`;
}

module.exports = {
  validateIndianPhone,
  formatIndianPhone,
  displayPhone
};
