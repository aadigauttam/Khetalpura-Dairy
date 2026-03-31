const { formatIndianPhone } = require('../config/phone');
const { generateWhatsAppMessage, generateWhatsAppLink } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Generate WhatsApp order link for customer
 */
function generateOrderWhatsAppLink(order, targetPhone, settings = {}) {
  const formattedPhone = formatIndianPhone(targetPhone);
  if (!formattedPhone) {
    logger.warn('Invalid WhatsApp target phone:', targetPhone);
    return null;
  }

  const message = generateWhatsAppMessage(order, settings);
  return generateWhatsAppLink(formattedPhone, message);
}

/**
 * Generate WhatsApp location sharing link
 */
function generateLocationLink(phone) {
  const formattedPhone = formatIndianPhone(phone);
  if (!formattedPhone) return null;
  
  // This will be used as a template - actual lat/lng will be added client-side
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent('📍 Live Location: ')}`;
}

/**
 * Generate delivery notification message
 */
function generateDeliveryNotification(order, type = 'assigned') {
  const messages = {
    assigned: `🚚 Your order ${order.orderId} has been assigned to a delivery boy. It will reach you soon!`,
    out_for_delivery: `📦 Your order ${order.orderId} is out for delivery!`,
    delivered: `✅ Your order ${order.orderId} has been delivered. Thank you! 🙏`,
    rejected: `❌ Your order ${order.orderId} has been rejected. Reason: ${order.rejectionReason || 'Contact support'}`
  };

  return messages[type] || '';
}

/**
 * Generate delivery boy assignment message
 */
function generateDeliveryBoyMessage(order) {
  let message = `🚚 *New Delivery Assignment*\n\n`;
  message += `📦 Order: ${order.orderId}\n`;
  message += `👤 Customer: ${order.customerName}\n`;
  message += `📞 Phone: ${order.customerPhone}\n`;
  message += `📍 Address: ${order.deliveryAddress}\n\n`;
  message += `🛒 *Items:*\n`;
  
  if (order.items) {
    order.items.forEach((item, i) => {
      message += `${i + 1}. ${item.name} x ${item.quantity} ${item.unit}\n`;
    });
  }
  
  message += `\n💰 Total: ₹${order.totalAmount}`;
  return message;
}

module.exports = {
  generateOrderWhatsAppLink,
  generateLocationLink,
  generateDeliveryNotification,
  generateDeliveryBoyMessage
};
