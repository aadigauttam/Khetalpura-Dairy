const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sanitizeFilename } = require('../utils/helpers');
const { UPLOAD_CATEGORIES } = require('../config/constants');

/**
 * Create multer storage for local file uploads
 */
const createStorage = (category = 'misc') => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, '..', '..', 'uploads', category);
      
      // Ensure directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const name = sanitizeFilename(path.basename(file.originalname, ext));
      cb(null, `${name}-${uniqueSuffix}${ext}`);
    }
  });
};

/**
 * File filter - only images
 */
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only image files (JPEG, PNG, WebP, GIF) are allowed.'));
};

/**
 * Max file size (in bytes)
 */
const maxSize = (parseInt(process.env.MAX_FILE_SIZE_MB) || 5) * 1024 * 1024;

// ============================================
// Upload Middleware for Different Categories
// ============================================

const uploadProduct = multer({
  storage: createStorage('products'),
  fileFilter: imageFilter,
  limits: { fileSize: maxSize }
}).single('image');

const uploadPayment = multer({
  storage: createStorage('payments'),
  fileFilter: imageFilter,
  limits: { fileSize: maxSize }
}).single('screenshot');

const uploadDelivery = multer({
  storage: createStorage('deliveries'),
  fileFilter: imageFilter,
  limits: { fileSize: maxSize }
}).single('proof');

const uploadLogo = multer({
  storage: createStorage('logos'),
  fileFilter: imageFilter,
  limits: { fileSize: maxSize }
}).single('logo');

const uploadQRCode = multer({
  storage: createStorage('qrcodes'),
  fileFilter: imageFilter,
  limits: { fileSize: maxSize }
}).single('qrcode');

const uploadGeneric = multer({
  storage: createStorage('misc'),
  fileFilter: imageFilter,
  limits: { fileSize: maxSize }
}).single('file');

/**
 * Error handling wrapper for multer
 */
const handleUpload = (uploadFn) => (req, res, next) => {
  uploadFn(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: `File too large. Max size is ${process.env.MAX_FILE_SIZE_MB || 5}MB.`
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

/**
 * Get the URL path for an uploaded file
 */
const getFileUrl = (file) => {
  if (!file) return null;
  // Convert absolute path to relative URL
  const uploadsIndex = file.path.indexOf('uploads');
  if (uploadsIndex === -1) return null;
  return '/' + file.path.substring(uploadsIndex).replace(/\\/g, '/');
};

module.exports = {
  uploadProduct: handleUpload(uploadProduct),
  uploadPayment: handleUpload(uploadPayment),
  uploadDelivery: handleUpload(uploadDelivery),
  uploadLogo: handleUpload(uploadLogo),
  uploadQRCode: handleUpload(uploadQRCode),
  uploadGeneric: handleUpload(uploadGeneric),
  getFileUrl
};
