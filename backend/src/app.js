const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const { globalErrorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();

// ============================================
// Security Middleware
// ============================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));

// ============================================
// CORS Configuration
// ============================================
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ============================================
// Request Parsing
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// ============================================
// Request Logging
// ============================================
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ============================================
// Rate Limiting
// ============================================
app.use('/api/', apiLimiter);

// ============================================
// Serve Uploaded Files (Local Storage)
// ============================================
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ============================================
// API Routes
// ============================================
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/subscriptions', require('./routes/subscription.routes'));
app.use('/api/payments', require('./routes/payment.routes'));
app.use('/api/inventory', require('./routes/inventory.routes'));
app.use('/api/offers', require('./routes/offer.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));
app.use('/api/settings', require('./routes/settings.routes'));
app.use('/api/upload', require('./routes/upload.routes'));

// ============================================
// Health Check
// ============================================
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '🥛 Khetalpura Dairy API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ============================================
// 404 Handler
// ============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// ============================================
// Global Error Handler
// ============================================
app.use(globalErrorHandler);

module.exports = app;
