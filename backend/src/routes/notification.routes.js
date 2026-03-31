const router = require('express').Router();
const { getMyNotifications, markRead, sendBroadcast, getAllNotifications, deleteNotification } = require('../controllers/notification.controller');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

router.get('/my', getMyNotifications);
router.patch('/:id/read', markRead);

// Admin only
router.get('/', requireRole('admin'), getAllNotifications);
router.post('/broadcast', requireRole('admin'), sendBroadcast);
router.delete('/:id', requireRole('admin'), deleteNotification);

module.exports = router;
