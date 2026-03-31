const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { uploadGeneric, getFileUrl } = require('../middleware/upload');
const ApiResponse = require('../utils/apiResponse');

/**
 * @route POST /api/upload
 * @desc Generic file upload (authenticated)
 */
router.post('/', authenticate, uploadGeneric, (req, res) => {
  if (!req.file) {
    return ApiResponse.error(res, 'No file uploaded', 400);
  }

  const fileUrl = getFileUrl(req.file);
  ApiResponse.success(res, {
    url: fileUrl,
    filename: req.file.filename,
    size: req.file.size,
    mimetype: req.file.mimetype
  }, 'File uploaded successfully');
});

module.exports = router;
