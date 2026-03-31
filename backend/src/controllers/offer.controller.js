const Offer = require('../models/Offer');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

/**
 * @route GET /api/offers
 * @desc Get all active offers (public)
 */
const getOffers = asyncHandler(async (req, res) => {
  const { active, page = 1, limit = 20 } = req.query;
  
  const filter = {};
  if (active === 'true') {
    const now = new Date();
    filter.isActive = true;
    filter.validFrom = { $lte: now };
    filter.validTo = { $gte: now };
  }

  const total = await Offer.countDocuments(filter);
  const offers = await Offer.find(filter)
    .populate('applicableProducts', 'name nameHi')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  ApiResponse.paginate(res, offers, total, page, limit);
});

/**
 * @route POST /api/offers
 * @desc Create offer (Admin)
 */
const createOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.create(req.body);
  ApiResponse.created(res, { offer }, 'Offer created successfully');
});

/**
 * @route PUT /api/offers/:id
 * @desc Update offer (Admin)
 */
const updateOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!offer) return ApiResponse.notFound(res, 'Offer not found');
  ApiResponse.success(res, { offer }, 'Offer updated');
});

/**
 * @route DELETE /api/offers/:id
 * @desc Delete offer (Admin)
 */
const deleteOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findByIdAndDelete(req.params.id);
  if (!offer) return ApiResponse.notFound(res, 'Offer not found');
  ApiResponse.success(res, null, 'Offer deleted');
});

module.exports = { getOffers, createOffer, updateOffer, deleteOffer };
