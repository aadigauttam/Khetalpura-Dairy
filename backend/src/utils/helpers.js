const { formatIndianPhone, displayPhone } = require('../config/phone');

/**
 * Generate a random N-digit OTP
 */
function generateOTP(length = 6) {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
}

/**
 * Generate a unique order ID
 * Format: KD-YYYYMMDD-XXXX
 */
function generateOrderId() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `KD-${dateStr}-${random}`;
}

/**
 * Generate WhatsApp order message
 */
function generateWhatsAppMessage(order, settings = {}) {
  const dairyName = settings.dairyName || 'Khetalpura Dairy';
  let message = `🥛 *${dairyName}* - New Order\n\n`;
  message += `📦 Order ID: ${order.orderId}\n`;
  message += `👤 Customer: ${order.customerName}\n`;
  message += `📞 Phone: ${displayPhone(order.customerPhone)}\n`;
  message += `📍 Address: ${order.address}\n\n`;
  message += `🛒 *Items:*\n`;
  
  if (order.items && order.items.length > 0) {
    order.items.forEach((item, index) => {
      message += `${index + 1}. ${item.name} x ${item.quantity} ${item.unit} - ₹${item.price * item.quantity}\n`;
    });
  }
  
  message += `\n💰 *Total: ₹${order.totalAmount}*\n`;
  message += `\n📅 ${new Date().toLocaleDateString('en-IN')}\n`;
  message += `\nThank you for ordering! 🙏`;
  
  return message;
}

/**
 * Generate WhatsApp deep link
 */
function generateWhatsAppLink(phone, message) {
  const formattedPhone = formatIndianPhone(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}

/**
 * Calculate subscription end date based on plan
 */
function calculateSubscriptionEndDate(startDate, plan) {
  const start = new Date(startDate);
  const end = new Date(startDate);

  switch (plan) {
    case 'daily':
      end.setDate(start.getDate() + 1);
      break;
    case 'weekly':
      end.setDate(start.getDate() + 7);
      break;
    case '15days':
      end.setDate(start.getDate() + 15);
      break;
    case 'monthly':
      end.setMonth(start.getMonth() + 1);
      break;
    case '3months':
      end.setMonth(start.getMonth() + 3);
      break;
    case '6months':
      end.setMonth(start.getMonth() + 6);
      break;
    case 'yearly':
      end.setFullYear(start.getFullYear() + 1);
      break;
    default:
      end.setMonth(start.getMonth() + 1);
  }

  return end;
}

/**
 * Sanitize filename for upload
 */
function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

module.exports = {
  generateOTP,
  generateOrderId,
  generateWhatsAppMessage,
  generateWhatsAppLink,
  calculateSubscriptionEndDate,
  sanitizeFilename
};
