const cron = require('node-cron');
const os = require('os');
const { db } = require('../config/database');
const { logger } = require('../config/logger');
const { sendEmail } = require('../services/email.service');
const config = require('../config/env');
const JOB_CONFIG = {
  schedule: '*/5 * * * *', 
  name: 'health-check',
  enabled: true,
  thresholds: {
    cpu: 80,           
    memory: 85,        
    disk: 85,          
    responseTime: 5000, 
    dbConnections: 80   
  }
};
let scheduledTask = null;
let lastHealthStatus = 'healthy';
let consecutiveFailures = 0;
const checkDatabase = async () => {
  const startTime = Date.now();
  try {
    await db.raw('SELECT 1');
    const responseTime = Date.now() - startTime;
    const pool = db.client.pool;
    const poolStats = {
      used: pool.numUsed(),
      free: pool.numFree(),
      pending: pool.numPending(),
      total: pool.numUsed() + pool.numFree()
    };
    const poolUsagePercent = (poolStats.used / (poolStats.total || 1)) * 100;
    const isHealthy = responseTime < config.database.slowQueryThreshold || 5000;
    return {
      healthy: isHealthy,
      responseTime,
      poolStats,
      isPoolExhausted: poolStats.pending > 0,
      isOverloaded: poolUsagePercent > JOB_CONFIG.thresholds.dbConnections
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
};
const checkRedis = async () => {
  const startTime = Date.now();
  try {
    const responseTime = Date.now() - startTime;
    const info = await redisClient.info();
    const usedMemory = info.match(/used_memory_human:(\S+)/)?.[1] || 'Unknown';
    const connectedClients = info.match(/connected_clients:(\d+)/)?.[1] || '0';
    return {
      healthy: true,
      responseTime,
      usedMemory,
      connectedClients: parseInt(connectedClients)
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
};
const checkCpu = async () => {
  const cpus = os.cpus();
  const loadAvg = os.loadavg();
  let totalIdle = 0;
  let totalTick = 0;
  for (const cpu of cpus) {
    for (const type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  }
  const idlePercent = (totalIdle / totalTick) * 100;
  const usagePercent = 100 - idlePercent;
  const isHigh = usagePercent > JOB_CONFIG.thresholds.cpu;
  return {
    healthy: !isHigh,
    usagePercent: usagePercent.toFixed(2),
    loadAvg: {
      '1min': loadAvg[0].toFixed(2),
      '5min': loadAvg[1].toFixed(2),
      '15min': loadAvg[2].toFixed(2)
    },
    cores: cpus.length
  };
};
const checkMemory = async () => {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const usagePercent = (usedMemory / totalMemory) * 100;
  const isHigh = usagePercent > JOB_CONFIG.thresholds.memory;
  return {
    healthy: !isHigh,
    usagePercent: usagePercent.toFixed(2),
    total: formatBytes(totalMemory),
    free: formatBytes(freeMemory),
    used: formatBytes(usedMemory)
  };
};
const checkDisk = async () => {
  const { default: disk } = await import('diskusage');
  try {
    const path = process.cwd();
    const { total, free } = await disk.check(path);
    const used = total - free;
    const usagePercent = (used / total) * 100;
    const isHigh = usagePercent > JOB_CONFIG.thresholds.disk;
    return {
      healthy: !isHigh,
      usagePercent: usagePercent.toFixed(2),
      total: formatBytes(total),
      free: formatBytes(free),
      used: formatBytes(used)
    };
  } catch (error) {
    return {
      healthy: true, 
      error: error.message,
      usagePercent: 0
    };
  }
};
const checkApiResponse = async () => {
  const startTime = Date.now();
  try {
    const http = require('http');
    const url = `http://localhost:${config.port}/health`;
    await new Promise((resolve, reject) => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', reject);
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
    });
    const responseTime = Date.now() - startTime;
    const isSlow = responseTime > JOB_CONFIG.thresholds.responseTime;
    return {
      healthy: !isSlow,
      responseTime,
      isSlow
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
};
const checkErrorRate = async () => {
  try {
    return {
      healthy: true,
      errorRate: 0,
      recentErrors: 0
    };
  } catch (error) {
    return {
      healthy: true,
      error: error.message
    };
  }
};
const sendHealthAlert = async (healthStatus, issues) => {
  try {
    const admins = await db('users')
      .leftJoin('user_roles', 'users.id', 'user_roles.user_id')
      .leftJoin('roles', 'user_roles.role_id', 'roles.id')
      .where('roles.name', 'Admin')
      .select('users.email', 'users.full_name')
      .groupBy('users.id');
    const alertLevel = healthStatus.status === 'critical' ? 'CRITICAL' : 'WARNING';
    for (const admin of admins) {
      await sendEmail({
        to: admin.email,
        subject: `[${alertLevel}] System Health Alert - Sutana EMS`,
        template: 'health-alert',
        data: {
          adminName: admin.full_name,
          status: healthStatus.status,
          issues,
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          environment: config.env
        }
      }).catch(err => logger.error(`Failed to send health alert to ${admin.email}:`, err.message));
    }
    logger.warn(`[Health Check] Sent ${alertLevel} alert to ${admins.length} admins`, { issues });
  } catch (error) {
    logger.error('[Health Check] Failed to send health alert:', error.message);
  }
};
const recordHealthResult = async (healthStatus) => {
  try {
    await db('health_checks').insert({
      status: healthStatus.status,
      details: JSON.stringify(healthStatus),
      checked_at: db.fn.now()
    });
    await db('health_checks')
      .where('checked_at', '<', db.raw('DATE_SUB(NOW(), INTERVAL 7 DAY)'))
      .delete();
  } catch (error) {
    logger.error('[Health Check] Failed to record health result:', error.message);
  }
};
const executeHealthCheck = async () => {
  const startTime = Date.now();
  logger.debug('[Health Check] Running health check...');
  const results = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    cpu: await checkCpu(),
    memory: await checkMemory(),
    disk: await checkDisk(),
    api: await checkApiResponse(),
    errorRate: await checkErrorRate()
  };
  const issues = [];
  let overallStatus = 'healthy';
  for (const [service, result] of Object.entries(results)) {
    if (!result.healthy) {
      issues.push({
        service,
        error: result.error,
        details: result
      });
    }
  }
  if (issues.length > 0) {
    const hasCritical = issues.some(i => 
      i.service === 'database' || 
      i.service === 'redis' || 
      (i.service === 'disk' && results.disk.usagePercent > 95)
    );
    overallStatus = hasCritical ? 'critical' : 'degraded';
  }
  const healthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
    services: results,
    issues,
    responseTime: Date.now() - startTime
  };
  if (overallStatus === 'healthy') {
    logger.debug('[Health Check] System healthy', {
      responseTime: `${healthStatus.responseTime}ms`,
      uptime: `${Math.floor(process.uptime())}s`
    });
  } else {
    logger.warn('[Health Check] System health degraded', {
      status: overallStatus,
      issues: issues.map(i => `${i.service}: ${i.error || 'unhealthy'}`)
    });
  }
  if (overallStatus !== 'healthy' && lastHealthStatus === 'healthy') {
    await sendHealthAlert(healthStatus, issues);
    consecutiveFailures = 0;
  } else if (overallStatus !== 'healthy') {
    consecutiveFailures++;
    if (consecutiveFailures % 10 === 0) {
      await sendHealthAlert(healthStatus, issues);
    }
  } else {
    consecutiveFailures = 0;
  }
  lastHealthStatus = overallStatus;
  await recordHealthResult(healthStatus);
  return healthStatus;
};
const init = () => {
  if (!JOB_CONFIG.enabled) {
    logger.info('[Health Check] Disabled by configuration');
    return;
  }
  if (scheduledTask) {
    logger.warn('[Health Check] Already initialized');
    return;
  }
  scheduledTask = cron.schedule(JOB_CONFIG.schedule, async () => {
    await executeHealthCheck();
  }, {
    scheduled: true,
    timezone: config.timezone || 'Africa/Addis_Ababa'
  });
  logger.info(`[Health Check] Initialized with schedule: ${JOB_CONFIG.schedule}`);
  logger.info(`[Health Check] Next execution: ${scheduledTask.nextDates().toISOString()}`);
  setTimeout(() => {
    executeHealthCheck().catch(err => {
      logger.error('[Health Check] Initial health check failed:', err.message);
    });
  }, 10000);
};
const stop = () => {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    logger.info('[Health Check] Stopped');
  }
};
const runNow = async () => {
  logger.info('[Health Check] Manual execution triggered');
  return await executeHealthCheck();
};
const getStatus = () => {
  return {
    name: JOB_CONFIG.name,
    schedule: JOB_CONFIG.schedule,
    enabled: JOB_CONFIG.enabled,
    running: !!scheduledTask,
    nextRun: scheduledTask ? scheduledTask.nextDates().toISOString() : null,
    lastStatus: lastHealthStatus,
    consecutiveFailures
  };
};
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
module.exports = {
  init,
  stop,
  runNow,
  getStatus,
  executeHealthCheck,
  JOB_CONFIG
};
