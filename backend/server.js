require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { cleanupDB } = require('./src/config/db');
const logger = require('./src/utils/logger');
const { initBackupScheduler } = require('./src/services/backup.service');

const PORT = process.env.PORT || 5000;

// ============================================
// Create required upload directories
// ============================================
const uploadDirs = [
  'uploads/products',
  'uploads/payments',
  'uploads/deliveries',
  'uploads/logos',
  'uploads/qrcodes',
  'uploads/misc',
  'backups',
  'logs'
];

uploadDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    logger.info(`Created directory: ${dir}`);
  }
});

// ============================================
// Auto-seed database if empty
// ============================================
async function autoSeed() {
  try {
    const User = require('./src/models/User');
    const Product = require('./src/models/Product');
    const Inventory = require('./src/models/Inventory');
    const Settings = require('./src/models/Settings');

    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      logger.info('📦 Database already seeded.');
      return;
    }

    logger.info('🌱 First run detected. Auto-seeding database...');

    // Create Admin
    await User.create({ name: 'Admin', phone: '919999999999', password: 'admin123', role: 'admin', isActive: true, isVerified: true, address: 'Khetalpura Dairy Farm' });
    // Create Staff
    await User.create({ name: 'Staff User', phone: '918888888888', password: 'staff123', role: 'staff', isActive: true, isVerified: true, address: 'Khetalpura Dairy Farm' });
    // Create Delivery Boy
    await User.create({ name: 'Delivery Boy', phone: '917777777777', password: 'delivery123', role: 'delivery', isActive: true, isVerified: true, address: 'Khetalpura Village' });

    const products = [
      { name: 'Full Cream Milk', nameHi: 'फुल क्रीम दूध', category: 'milk', price: 70, unit: '1 ltr', stock: 100, minStock: 20, description: 'Fresh full cream milk', descriptionHi: 'ताज़ा फुल क्रीम दूध' },
      { name: 'Toned Milk', nameHi: 'टोंड दूध', category: 'milk', price: 55, unit: '1 ltr', stock: 100, minStock: 20 },
      { name: 'Buffalo Milk', nameHi: 'भैंस का दूध', category: 'milk', price: 80, unit: '1 ltr', stock: 80, minStock: 15 },
      { name: 'Cow Milk (A2)', nameHi: 'गाय का दूध (A2)', category: 'milk', price: 60, unit: '1 ltr', stock: 80, minStock: 15 },
      { name: 'Milk 500ml', nameHi: 'दूध 500ml', category: 'milk', price: 35, unit: '500 ml', stock: 50, minStock: 10 },
      { name: 'Fresh Curd', nameHi: 'ताज़ा दही', category: 'curd', price: 50, unit: '500g', stock: 50, minStock: 10 },
      { name: 'Curd 1kg', nameHi: 'दही 1 kg', category: 'curd', price: 90, unit: '1 kg', stock: 40, minStock: 10 },
      { name: 'Sweet Lassi', nameHi: 'मीठी लस्सी', category: 'lassi', price: 40, unit: '300 ml', stock: 40, minStock: 10 },
      { name: 'Salt Lassi', nameHi: 'नमकीन लस्सी', category: 'lassi', price: 35, unit: '300 ml', stock: 40, minStock: 10 },
      { name: 'Mango Lassi', nameHi: 'आम लस्सी', category: 'lassi', price: 50, unit: '300 ml', stock: 30, minStock: 5 },
      { name: 'Desi Ghee', nameHi: 'देसी घी', category: 'ghee', price: 650, unit: '500g', stock: 30, minStock: 5 },
      { name: 'Desi Ghee 1kg', nameHi: 'देसी घी 1 kg', category: 'ghee', price: 1200, unit: '1 kg', stock: 20, minStock: 5 },
      { name: 'Buffalo Ghee', nameHi: 'भैंस का घी', category: 'ghee', price: 600, unit: '500g', stock: 25, minStock: 5 },
      { name: 'Vanilla Ice Cream', nameHi: 'वनिला आइसक्रीम', category: 'ice_cream', price: 100, unit: '500 ml', stock: 20, minStock: 5 },
      { name: 'Mango Ice Cream', nameHi: 'आम आइसक्रीम', category: 'ice_cream', price: 120, unit: '500 ml', stock: 15, minStock: 5 },
      { name: 'Kulfi', nameHi: 'कुल्फी', category: 'ice_cream', price: 30, unit: 'piece', stock: 50, minStock: 10 },
    ];

    const created = await Product.insertMany(products);
    await Inventory.insertMany(created.map(p => ({ product: p._id, currentStock: p.stock, minThreshold: p.minStock })));
    await Settings.getSettings();

    logger.info('✅ Database seeded with 3 users + 16 products!');
    logger.info('📋 Admin: 9999999999 / admin123');
    logger.info('📋 Staff: 8888888888 / staff123');
    logger.info('📋 Delivery: 7777777777 / delivery123');
  } catch (error) {
    logger.error('Auto-seed error:', error.message);
  }
}

// ============================================
// Start Server
// ============================================
async function startServer() {
  try {
    await connectDB();
    await autoSeed();

    const server = http.createServer(app);

    server.listen(PORT, () => {
      logger.info(`🥛 Khetalpura Dairy API running on port ${PORT}`);
      logger.info(`📁 Environment: ${process.env.NODE_ENV}`);
      logger.info(`📂 Uploads: ${path.resolve(process.env.UPLOAD_DIR || './uploads')}`);
      logger.info(`🌐 Frontend: http://localhost:3000`);
      logger.info(`🔗 API: http://localhost:${PORT}/api/health`);
    });

    initBackupScheduler();

    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received. Shutting down...`);
      server.close(async () => {
        logger.info('HTTP server closed.');
        await cleanupDB();
        process.exit(0);
      });
      setTimeout(() => { process.exit(1); }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('uncaughtException', (err) => { logger.error('Uncaught Exception:', err); gracefulShutdown('UNCAUGHT_EXCEPTION'); });
    process.on('unhandledRejection', (reason) => { logger.error('Unhandled Rejection:', reason); });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
