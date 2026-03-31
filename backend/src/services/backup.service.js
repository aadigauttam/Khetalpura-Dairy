const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

/**
 * Initialize daily backup scheduler
 */
function initBackupScheduler() {
  const cronSchedule = process.env.BACKUP_CRON || '0 2 * * *'; // Default: 2 AM daily
  
  cron.schedule(cronSchedule, () => {
    logger.info('🔄 Starting scheduled database backup...');
    performBackup();
  });

  logger.info(`📦 Backup scheduler initialized. Schedule: ${cronSchedule}`);
}

/**
 * Perform MongoDB backup using mongodump
 */
function performBackup() {
  const backupDir = path.resolve(process.env.BACKUP_DIR || './backups');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `backup-${timestamp}`);

  // Ensure backup directory exists
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/khetalpura_dairy';
  const command = `mongodump --uri="${mongoUri}" --out="${backupPath}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      logger.error('Backup failed:', error.message);
      return;
    }
    
    logger.info(`✅ Backup completed: ${backupPath}`);
    
    // Clean old backups
    cleanOldBackups(backupDir);
  });
}

/**
 * Remove backups older than retention period
 */
function cleanOldBackups(backupDir) {
  const retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  try {
    const entries = fs.readdirSync(backupDir);
    
    entries.forEach(entry => {
      const entryPath = path.join(backupDir, entry);
      const stats = fs.statSync(entryPath);
      
      if (stats.isDirectory() && stats.mtime < cutoffDate) {
        fs.rmSync(entryPath, { recursive: true, force: true });
        logger.info(`🗑️ Removed old backup: ${entry}`);
      }
    });
  } catch (error) {
    logger.error('Error cleaning old backups:', error.message);
  }
}

module.exports = { initBackupScheduler, performBackup };
