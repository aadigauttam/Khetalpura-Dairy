const router = require('express').Router();
const { getOffers, createOffer, updateOffer, deleteOffer } = require('../controllers/offer.controller');
const { authenticate, requireRole, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, getOffers);
router.post('/', authenticate, requireRole('admin'), createOffer);
router.put('/:id', authenticate, requireRole('admin'), updateOffer);
router.delete('/:id', authenticate, requireRole('admin'), deleteOffer);

module.exports = router;
