const logger = require('../utils/logger');
const Log = require('../models/Log');

/**
 * Custom error class with status code
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 */
const globalErrorHandler = async (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;

  // Log error
  logger.error({
    message: err.message,
    statusCode: err.statusCode,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id
  });

  // Store error in DB logs (non-blocking)
  try {
    await Log.create({
      action: 'error',
      userId: req.user?.id,
      details: err.message,
      level: 'error',
      metadata: {
        url: req.originalUrl,
        method: req.method,
        statusCode: err.statusCode,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      }
    });
  } catch (logError) {
    logger.error('Failed to log error to DB:', logError.message);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  // Default error response
  res.status(err.statusCode).json({
    success: false,
    message: err.message || 'Something went wrong. Please try again.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { AppError, globalErrorHandler };
