const Notification = require('../models/Notification');
const { broadcastNotification } = require('../services/notification.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

/**
 * @route GET /api/notifications/my
 * @desc Get notifications for current user
 */
const getMyNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const filter = {
    isActive: true,
    $or: [
      { targetUsers: { $size: 0 } }, // Broadcast
      { targetUsers: req.user._id }   // Targeted
    ]
  };

  const total = await Notification.countDocuments(filter);
  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  // Add read status
  const enriched = notifications.map(n => ({
    ...n.toJSON(),
    isRead: n.readBy.includes(req.user._id)
  }));

  ApiResponse.paginate(res, enriched, total, page, limit);
});

/**
 * @route PATCH /api/notifications/:id/read
 * @desc Mark notification as read
 */
const markRead = asyncHandler(async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, {
    $addToSet: { readBy: req.user._id }
  });
  ApiResponse.success(res, null, 'Marked as read');
});

/**
 * @route POST /api/notifications/broadcast
 * @desc Send broadcast notification (Admin)
 */
const sendBroadcast = asyncHandler(async (req, res) => {
  const notification = await broadcastNotification(req.body);
  ApiResponse.created(res, { notification }, 'Notification sent to all users');
});

/**
 * @route GET /api/notifications
 * @desc Get all notifications (Admin)
 */
const getAllNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const total = await Notification.countDocuments();
  const notifications = await Notification.find()
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  ApiResponse.paginate(res, notifications, total, page, limit);
});

/**
 * @route DELETE /api/notifications/:id
 */
const deleteNotification = asyncHandler(async (req, res) => {
  await Notification.findByIdAndDelete(req.params.id);
  ApiResponse.success(res, null, 'Notification deleted');
});

module.exports = { getMyNotifications, markRead, sendBroadcast, getAllNotifications, deleteNotification };
