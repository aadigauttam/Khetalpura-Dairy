const Notification = require('../models/Notification');
const logger = require('../utils/logger');

/**
 * Create a notification
 */
async function createNotification({ title, titleHi, body, bodyHi, type, targetUsers, relatedOrder, relatedOffer, image }) {
  try {
    const notification = await Notification.create({
      title,
      titleHi: titleHi || title,
      body,
      bodyHi: bodyHi || body,
      type: type || 'system',
      targetUsers: targetUsers || [],
      relatedOrder,
      relatedOffer,
      image
    });

    logger.info(`🔔 Notification created: ${title}`);
    return notification;
  } catch (error) {
    logger.error('Failed to create notification:', error.message);
    return null;
  }
}

/**
 * Send order status notification
 */
async function sendOrderNotification(order, status) {
  const statusMessages = {
    approved: {
      title: 'Order Approved',
      titleHi: 'ऑर्डर स्वीकृत',
      body: `Your order ${order.orderId} has been approved!`,
      bodyHi: `आपका ऑर्डर ${order.orderId} स्वीकृत हो गया है!`
    },
    out_for_delivery: {
      title: 'Out for Delivery',
      titleHi: 'डिलीवरी के लिए निकला',
      body: `Your order ${order.orderId} is on the way!`,
      bodyHi: `आपका ऑर्डर ${order.orderId} रास्ते में है!`
    },
    delivered: {
      title: 'Order Delivered',
      titleHi: 'ऑर्डर डिलीवर हो गया',
      body: `Your order ${order.orderId} has been delivered. Thank you!`,
      bodyHi: `आपका ऑर्डर ${order.orderId} डिलीवर हो गया है। धन्यवाद!`
    },
    rejected: {
      title: 'Order Rejected',
      titleHi: 'ऑर्डर अस्वीकृत',
      body: `Your order ${order.orderId} has been rejected. ${order.rejectionReason || ''}`,
      bodyHi: `आपका ऑर्डर ${order.orderId} अस्वीकृत हो गया है। ${order.rejectionReason || ''}`
    }
  };

  const msg = statusMessages[status];
  if (!msg) return null;

  return createNotification({
    ...msg,
    type: 'order',
    targetUsers: [order.customer],
    relatedOrder: order._id
  });
}

/**
 * Broadcast notification to all users
 */
async function broadcastNotification({ title, titleHi, body, bodyHi, type, image }) {
  return createNotification({
    title,
    titleHi,
    body,
    bodyHi,
    type: type || 'system',
    targetUsers: [], // Empty = broadcast
    image
  });
}

module.exports = {
  createNotification,
  sendOrderNotification,
  broadcastNotification
};
