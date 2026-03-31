const router = require('express').Router();
const { createSubscription, getSubscriptions, getSubscription, pauseSubscription, resumeSubscription, updateSubscription, cancelSubscription } = require('../controllers/subscription.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { validateSubscription } = require('../middleware/validator');

router.use(authenticate);

router.post('/', requireRole('customer'), validateSubscription, createSubscription);
router.get('/', getSubscriptions);
router.get('/:id', getSubscription);
router.patch('/:id/pause', pauseSubscription);
router.patch('/:id/resume', resumeSubscription);
router.put('/:id', requireRole('admin'), updateSubscription);
router.delete('/:id', cancelSubscription);

module.exports = router;
