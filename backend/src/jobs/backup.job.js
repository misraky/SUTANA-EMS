const cron = require('node-cron');
const { createBackup, getBackupStats } = require('../services/backup.service');
const { logger } = require('../config/logger');
const { sendEmail } = require('../services/email.service');
const config = require('../config/env');
const JOB_CONFIG = {
  schedule: '0 */6 * * *', 
  name: 'database-backup',
  enabled: true
};
let scheduledTask = null;
const executeBackup = async () => {
  const startTime = Date.now();
  logger.info('[Backup Job] Starting database backup...');
  try {
    const result = await createBackup();
    const duration = Date.now() - startTime;
    logger.info(`[Backup Job] Backup completed successfully in ${duration}ms`, {
      filename: result.filename,
      size: result.fileSize,
      duration: `${duration}ms`
    });
    await sendBackupNotification(true, result, duration);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('[Backup Job] Backup failed:', {
      error: error.message,
      duration: `${duration}ms`
    });
    await sendBackupNotification(false, null, duration, error.message);
    throw error;
  }
};
const sendBackupNotification = async (success, result, duration, error = null) => {
  try {
    const admins = await getAdminEmails();
    for (const admin of admins) {
      await sendEmail({
        to: admin.email,
        subject: `Database Backup ${success ? 'Completed' : 'Failed'}`,
        template: success ? 'backup-completed' : 'backup-failed',
        data: {
          adminName: admin.full_name,
          filename: result?.filename,
          fileSize: result?.fileSize ? formatBytes(result.fileSize) : 'N/A',
          duration: `${duration}ms`,
          timestamp: new Date().toISOString(),
          error: error,
          cloudUploaded: result?.cloudUpload?.success || false
        }
      }).catch(err => logger.error('Failed to send backup notification email:', err.message));
    }
  } catch (err) {
    logger.error('Failed to send backup notification:', err.message);
  }
};
const getAdminEmails = async () => {
  const { db } = require('../config/database');
  const admins = await db('users')
    .leftJoin('user_roles', 'users.id', 'user_roles.user_id')
    .leftJoin('roles', 'user_roles.role_id', 'roles.id')
    .where('roles.name', 'Admin')
    .orWhere('roles.name', 'CEO')
    .select('users.email', 'users.full_name')
    .groupBy('users.id');
  return admins;
};
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
const logBackupStats = async () => {
  try {
    const stats = await getBackupStats();
    logger.info('[Backup Job] Current backup statistics:', stats);
  } catch (error) {
    logger.error('[Backup Job] Failed to get backup stats:', error.message);
  }
};
const init = () => {
  if (!JOB_CONFIG.enabled) {
    logger.info('[Backup Job] Disabled by configuration');
    return;
  }
  if (scheduledTask) {
    logger.warn('[Backup Job] Already initialized');
    return;
  }
  scheduledTask = cron.schedule(JOB_CONFIG.schedule, async () => {
    await executeBackup();
  }, {
    scheduled: true,
    timezone: config.timezone || 'Africa/Addis_Ababa'
  });
  logger.info(`[Backup Job] Initialized with schedule: ${JOB_CONFIG.schedule}`);
  logger.info(`[Backup Job] Next execution: ${scheduledTask.nextDates().toISOString()}`);
  logBackupStats();
};
const stop = () => {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    logger.info('[Backup Job] Stopped');
  }
};
const runNow = async () => {
  logger.info('[Backup Job] Manual execution triggered');
  return await executeBackup();
};
const getStatus = () => {
  return {
    name: JOB_CONFIG.name,
    schedule: JOB_CONFIG.schedule,
    enabled: JOB_CONFIG.enabled,
    running: !!scheduledTask,
    nextRun: scheduledTask ? scheduledTask.nextDates().toISOString() : null
  };
};
module.exports = {
  init,
  stop,
  runNow,
  getStatus,
  executeBackup,
  JOB_CONFIG
};
