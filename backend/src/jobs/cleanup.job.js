const cron = require('node-cron');
const { db } = require('../config/database');
const { logger } = require('../config/logger');
const { cleanupTempFiles } = require('../config/multer');
const { cleanupOldExports } = require('../utils/exportHelper');
const config = require('../config/env');
const fs = require('fs');
const path = require('path');
const JOB_CONFIG = {
  schedule: '0 2 * * *', 
  name: 'system-cleanup',
  enabled: true,
  retention: {
    sessions: 7, 
    auditLogs: 2555, 
    communicationLogs: 90, 
    passwordResets: 1, 
    tempFiles: 1, 
    exports: 7 
  }
};
let scheduledTask = null;
const cleanupExpiredSessions = async () => {
  try {
    const cutoffDate = db.raw(`DATE_SUB(NOW(), INTERVAL ${JOB_CONFIG.retention.sessions} DAY)`);
    const result = await db('sessions')
      .where('expires_at', '<', cutoffDate)
      .delete();
    if (result > 0) {
      logger.info(`[Cleanup Job] Deleted ${result} expired sessions`);
    }
    return result;
  } catch (error) {
    logger.error('[Cleanup Job] Failed to cleanup expired sessions:', error.message);
    return 0;
  }
};
const cleanupPasswordResets = async () => {
  try {
    const cutoffDate = db.raw(`DATE_SUB(NOW(), INTERVAL ${JOB_CONFIG.retention.passwordResets} DAY)`);
    const result = await db('password_resets')
      .where('created_at', '<', cutoffDate)
      .orWhere('used', true)
      .delete();
    if (result > 0) {
      logger.info(`[Cleanup Job] Deleted ${result} old password reset tokens`);
    }
    return result;
  } catch (error) {
    logger.error('[Cleanup Job] Failed to cleanup password resets:', error.message);
    return 0;
  }
};
const cleanupCommunicationLogs = async () => {
  try {
    const cutoffDate = db.raw(`DATE_SUB(NOW(), INTERVAL ${JOB_CONFIG.retention.communicationLogs} DAY)`);
    const result = await db('communication_logs')
      .where('created_at', '<', cutoffDate)
      .delete();
    if (result > 0) {
      logger.info(`[Cleanup Job] Deleted ${result} old communication logs`);
    }
    return result;
  } catch (error) {
    logger.error('[Cleanup Job] Failed to cleanup communication logs:', error.message);
    return 0;
  }
};
const archiveOldAuditLogs = async () => {
  try {
    const cutoffDate = db.raw(`DATE_SUB(NOW(), INTERVAL ${JOB_CONFIG.retention.auditLogs} DAY)`);
    const logsToArchive = await db('audit_logs')
      .where('created_at', '<', cutoffDate)
      .select('*');
    if (logsToArchive.length === 0) {
      return 0;
    }
    const batchSize = 1000;
    for (let i = 0; i < logsToArchive.length; i += batchSize) {
      const batch = logsToArchive.slice(i, i + batchSize);
      await db('audit_logs_archive').insert(batch);
    }
    const deleted = await db('audit_logs')
      .where('created_at', '<', cutoffDate)
      .delete();
    logger.info(`[Cleanup Job] Archived ${deleted} audit logs (older than ${JOB_CONFIG.retention.auditLogs} days)`);
    return deleted;
  } catch (error) {
    logger.error('[Cleanup Job] Failed to archive audit logs:', error.message);
    return 0;
  }
};
const cleanupRedisCache = async () => {
  try {
    let deletedCount = 0;
    const patterns = [
      'session:*',
      'failed_attempts:*',
      'lockout:*',
      '2fa:*',
      '2fa_temp:*',
      'password_reset:*',
      'rate_limit:*'
    ];
    for (const pattern of patterns) {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          const deleted = await redisClient.del(keys);
          deletedCount += deleted;
        }
      } while (cursor !== '0');
    }
    if (deletedCount > 0) {
      logger.info(`[Cleanup Job] Deleted ${deletedCount} Redis cache keys`);
    }
    return deletedCount;
  } catch (error) {
    logger.error('[Cleanup Job] Failed to cleanup Redis cache:', error.message);
    return 0;
  }
};
const cleanupOrderCounters = async () => {
  try {
    let deletedCount = 0;
    let cursor = '0';
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7); 
    do {
      const [nextCursor, keys] = await redisClient.scan(cursor, 'MATCH', 'order_counter:*', 'COUNT', 100);
      cursor = nextCursor;
      for (const key of keys) {
        const parts = key.split(':');
        if (parts.length === 3) {
          const dateStr = parts[2];
          const year = parseInt(dateStr.substring(0, 4));
          const month = parseInt(dateStr.substring(4, 6));
          const day = parseInt(dateStr.substring(6, 8));
          const keyDate = new Date(year, month - 1, day);
          if (keyDate < cutoffDate) {
            deletedCount++;
          }
        }
      }
    } while (cursor !== '0');
    if (deletedCount > 0) {
      logger.info(`[Cleanup Job] Deleted ${deletedCount} old order counters`);
    }
    return deletedCount;
  } catch (error) {
    logger.error('[Cleanup Job] Failed to cleanup order counters:', error.message);
    return 0;
  }
};
const cleanupExportFiles = async () => {
  try {
    const exportsDir = path.join(process.cwd(), 'exports');
    const deleted = await cleanupOldExports(exportsDir, JOB_CONFIG.retention.exports * 24);
    if (deleted > 0) {
      logger.info(`[Cleanup Job] Deleted ${deleted} old export files`);
    }
    return deleted;
  } catch (error) {
    logger.error('[Cleanup Job] Failed to cleanup export files:', error.message);
    return 0;
  }
};
const cleanupOldBackups = async () => {
  try {
    const backupDir = config.backup.path || './backups';
    const retentionDays = config.backup.retentionDays || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    let deletedCount = 0;
    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir);
      for (const file of files) {
        if (file.endsWith('.sql.gz') || file.endsWith('.sql') || file.endsWith('.zip')) {
          const filePath = path.join(backupDir, file);
          const stats = fs.statSync(filePath);
          if (stats.mtime < cutoffDate) {
            fs.unlinkSync(filePath);
            deletedCount++;
          }
        }
      }
    }
    if (deletedCount > 0) {
      logger.info(`[Cleanup Job] Deleted ${deletedCount} old backup files (older than ${retentionDays} days)`);
    }
    return deletedCount;
  } catch (error) {
    logger.error('[Cleanup Job] Failed to cleanup old backups:', error.message);
    return 0;
  }
};
const cleanupOrphanedCarts = async () => {
  try {
    return 0;
  } catch (error) {
    logger.error('[Cleanup Job] Failed to cleanup orphaned carts:', error.message);
    return 0;
  }
};
const executeCleanup = async () => {
  const startTime = Date.now();
  logger.info('[Cleanup Job] Starting system cleanup...');
  const results = {
    sessions: 0,
    passwordResets: 0,
    communicationLogs: 0,
    auditLogsArchived: 0,
    redisKeys: 0,
    orderCounters: 0,
    exportFiles: 0,
    backupFiles: 0,
    tempFiles: 0
  };
  try {
    const [
      sessions,
      passwordResets,
      communicationLogs,
      auditLogsArchived,
      redisKeys,
      orderCounters,
      exportFiles,
      backupFiles
    ] = await Promise.all([
      cleanupExpiredSessions(),
      cleanupPasswordResets(),
      cleanupCommunicationLogs(),
      archiveOldAuditLogs(),
      cleanupRedisCache(),
      cleanupOrderCounters(),
      cleanupExportFiles(),
      cleanupOldBackups()
    ]);
    results.sessions = sessions;
    results.passwordResets = passwordResets;
    results.communicationLogs = communicationLogs;
    results.auditLogsArchived = auditLogsArchived;
    results.redisKeys = redisKeys;
    results.orderCounters = orderCounters;
    results.exportFiles = exportFiles;
    results.backupFiles = backupFiles;
    cleanupTempFiles();
    results.tempFiles = 1; 
    const duration = Date.now() - startTime;
    logger.info('[Cleanup Job] Cleanup completed', {
      ...results,
      duration: `${duration}ms`
    });
    const totalCleaned = Object.values(results).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
    logger.info(`[Cleanup Job] Total items cleaned: ${totalCleaned}`);
    return results;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('[Cleanup Job] Cleanup failed:', {
      error: error.message,
      duration: `${duration}ms`
    });
    throw error;
  }
};
const init = () => {
  if (!JOB_CONFIG.enabled) {
    logger.info('[Cleanup Job] Disabled by configuration');
    return;
  }
  if (scheduledTask) {
    logger.warn('[Cleanup Job] Already initialized');
    return;
  }
  scheduledTask = cron.schedule(JOB_CONFIG.schedule, async () => {
    await executeCleanup();
  }, {
    scheduled: true,
    timezone: config.timezone || 'Africa/Addis_Ababa'
  });
  logger.info(`[Cleanup Job] Initialized with schedule: ${JOB_CONFIG.schedule}`);
  logger.info(`[Cleanup Job] Next execution: ${scheduledTask.nextDates().toISOString()}`);
};
const stop = () => {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    logger.info('[Cleanup Job] Stopped');
  }
};
const runNow = async () => {
  logger.info('[Cleanup Job] Manual execution triggered');
  return await executeCleanup();
};
const getStatus = () => {
  return {
    name: JOB_CONFIG.name,
    schedule: JOB_CONFIG.schedule,
    enabled: JOB_CONFIG.enabled,
    running: !!scheduledTask,
    nextRun: scheduledTask ? scheduledTask.nextDates().toISOString() : null,
    retention: JOB_CONFIG.retention
  };
};
module.exports = {
  init,
  stop,
  runNow,
  getStatus,
  executeCleanup,
  JOB_CONFIG
};
