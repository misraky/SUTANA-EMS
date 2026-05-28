const backupJob = require('./backup.job');
const cleanupJob = require('./cleanup.job');
const reminderJob = require('./reminder.job');
const reportJob = require('./report.job');
const cacheWarmupJob = require('./cacheWarmup.job');
const healthCheckJob = require('./healthCheck.job');
const initJobs = async () => {
  console.log('🔄 Initializing scheduled jobs...');
  backupJob.init();
  cleanupJob.init();
  reminderJob.init();
  reportJob.init();
  cacheWarmupJob.init();
  healthCheckJob.init();
  console.log('✅ Scheduled jobs initialized');
};
const stopJobs = async () => {
  console.log('🛑 Stopping scheduled jobs...');
  backupJob.stop();
  cleanupJob.stop();
  reminderJob.stop();
  reportJob.stop();
  cacheWarmupJob.stop();
  healthCheckJob.stop();
  console.log('✅ Scheduled jobs stopped');
};
module.exports = {
  initJobs,
  stopJobs,
  backupJob,
  cleanupJob,
  reminderJob,
  reportJob,
  cacheWarmupJob,
  healthCheckJob
};
