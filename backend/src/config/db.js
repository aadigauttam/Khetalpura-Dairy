const mongoose = require('mongoose');
const logger = require('../utils/logger');

const MAX_RETRIES = 2;
const RETRY_DELAY_BASE = 2000;

let mongoServer = null; // Keep reference for cleanup

const connectDB = async (retryCount = 0) => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/khetalpura_dairy';
    
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
      socketTimeoutMS: 45000,
    });

    logger.info(`💾 MongoDB Connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
    setupEventHandlers();
    return conn;
  } catch (error) {
    logger.warn(`MongoDB connection attempt ${retryCount + 1} failed: ${error.message}`);

    if (retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAY_BASE * Math.pow(2, retryCount);
      logger.info(`Retrying in ${delay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return connectDB(retryCount + 1);
    }

    // Fallback: Use MongoDB Memory Server (no installation needed)
    logger.info('🔄 Local MongoDB not found. Starting in-memory MongoDB...');
    return startMemoryServer();
  }
};

async function startMemoryServer() {
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    
    mongoServer = await MongoMemoryServer.create({
      instance: { dbName: 'khetalpura_dairy' }
    });

    const uri = mongoServer.getUri();
    const conn = await mongoose.connect(uri);

    logger.info(`💾 In-Memory MongoDB started: ${uri}`);
    logger.info('⚠️  Data will be lost when server stops. Install MongoDB for persistent storage.');
    
    setupEventHandlers();
    return conn;
  } catch (error) {
    logger.error('Failed to start in-memory MongoDB:', error.message);
    logger.error('Please install MongoDB Community Edition from: https://www.mongodb.com/try/download/community');
    process.exit(1);
  }
}

function setupEventHandlers() {
  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected.');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected successfully.');
  });
}

// Cleanup function for graceful shutdown
const cleanupDB = async () => {
  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
    logger.info('In-memory MongoDB stopped.');
  }
};

module.exports = connectDB;
module.exports.cleanupDB = cleanupDB;
