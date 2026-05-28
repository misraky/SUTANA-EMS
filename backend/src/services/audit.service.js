const { db } = require('../config/database');
const { logger, audit: auditLogger } = require('../config/logger');
const { AppError } = require('../utils/AppError');
const AUDIT_CONFIG = {
  retentionDays: 2555, 
  batchSize: 1000,
  asyncLogging: true
};
const logAudit = async (auditData) => {
  const {
    userId,
    action,
    resource,
    resourceId,
    beforeState,
    afterState,
    ipAddress,
    userAgent,
    status = 'success',
    errorMessage
  } = auditData;
  try {
    const sanitizedBefore = beforeState ? sanitizeAuditState(beforeState) : null;
    const sanitizedAfter = afterState ? sanitizeAuditState(afterState) : null;
    const [logId] = await db('audit_logs').insert({
      user_id: userId,
      action,
      resource,
      resource_id: resourceId ? String(resourceId) : null,
      before_state: sanitizedBefore,
      after_state: sanitizedAfter,
      ip_address: ipAddress,
      user_agent: userAgent,
      status,
      error_message: errorMessage,
      created_at: db.fn.now()
    });
    auditLogger(action, userId, {
      resource,
      resourceId,
      ip: ipAddress,
      userAgent,
      status,
      error: errorMessage
    });
    if (AUDIT_CONFIG.asyncLogging) {
      await cacheRecentAudit(logId, auditData);
    }
    return logId;
  } catch (error) {
    logger.error('Failed to log audit event:', error.message);
    return null;
  }
};
const sanitizeAuditState = (state) => {
  if (!state) return null;
  const sensitiveFields = ['password', 'token', 'refreshToken', 'two_factor_secret', 'apiKey', 'secret'];
  const sanitized = { ...state };
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  return sanitized;
};
const cacheRecentAudit = async (logId, auditData) => {
  try {
    const key = `audit:recent:${logId}`;
  } catch (error) {
    logger.error('Failed to cache audit entry:', error.message);
  }
};
const getAuditLogs = async (filters) => {
  const {
    page = 1,
    limit = 50,
    userId,
    action,
    resource,
    startDate,
    endDate,
    search
  } = filters;
  const offset = (page - 1) * limit;
  let query = db('audit_logs')
    .leftJoin('users', 'audit_logs.user_id', 'users.id')
    .select(
      'audit_logs.*',
      'users.full_name as user_name',
      'users.email as user_email'
    );
  if (userId) {
    query = query.where('audit_logs.user_id', userId);
  }
  if (action) {
    query = query.where('audit_logs.action', action);
  }
  if (resource) {
    query = query.where('audit_logs.resource', resource);
  }
  if (startDate && endDate) {
    query = query.whereBetween('audit_logs.created_at', [startDate, endDate]);
  }
  if (search) {
    query = query.where(function() {
      this.where('audit_logs.action', 'like', `%${search}%`)
        .orWhere('audit_logs.resource', 'like', `%${search}%`)
        .orWhere('audit_logs.resource_id', 'like', `%${search}%`)
        .orWhere('users.full_name', 'like', `%${search}%`)
        .orWhere('users.email', 'like', `%${search}%`);
    });
  }
  const total = await query.clone().count('audit_logs.id as total').first();
  const logs = await query
    .orderBy('audit_logs.created_at', 'desc')
    .limit(limit)
    .offset(offset);
  const actions = await db('audit_logs').distinct('action').pluck('action');
  const resources = await db('audit_logs').distinct('resource').pluck('resource');
  return {
    logs,
    filters: { actions, resources },
    pagination: {
      page,
      limit,
      total: parseInt(total.total),
      totalPages: Math.ceil(total.total / limit)
    }
  };
};
const getAuditLogById = async (logId) => {
  const cached = await cache.get(`audit:recent:${logId}`);
  if (cached) {
    return cached;
  }
  const log = await db('audit_logs')
    .leftJoin('users', 'audit_logs.user_id', 'users.id')
    .select(
      'audit_logs.*',
      'users.full_name as user_name',
      'users.email as user_email'
    )
    .where('audit_logs.id', logId)
    .first();
  if (!log) {
    throw new AppError('Audit log not found', 404);
  }
  return log;
};
const getUserActivitySummary = async (userId, days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const activities = await db('audit_logs')
    .where('user_id', userId)
    .where('created_at', '>=', startDate)
    .select(
      db.raw('DATE(created_at) as date'),
      db.raw('COUNT(*) as count'),
      db.raw('COUNT(CASE WHEN status = "success" THEN 1 END) as success_count'),
      db.raw('COUNT(CASE WHEN status = "failure" THEN 1 END) as failure_count')
    )
    .groupByRaw('DATE(created_at)')
    .orderBy('date', 'desc');
  const actionBreakdown = await db('audit_logs')
    .where('user_id', userId)
    .where('created_at', '>=', startDate)
    .select('action', db.raw('COUNT(*) as count'))
    .groupBy('action')
    .orderBy('count', 'desc');
  const resourceBreakdown = await db('audit_logs')
    .where('user_id', userId)
    .where('created_at', '>=', startDate)
    .select('resource', db.raw('COUNT(*) as count'))
    .groupBy('resource')
    .orderBy('count', 'desc');
  const lastActivity = await db('audit_logs')
    .where('user_id', userId)
    .orderBy('created_at', 'desc')
    .first();
  return {
    userId,
    period: `${days} days`,
    totalActivities: activities.reduce((sum, a) => sum + parseInt(a.count), 0),
    successRate: activities.reduce((sum, a) => sum + parseInt(a.success_count), 0) / 
                 (activities.reduce((sum, a) => sum + parseInt(a.count), 0) || 1) * 100,
    dailyBreakdown: activities,
    actionBreakdown,
    resourceBreakdown,
    lastActivity: lastActivity?.created_at,
    mostFrequentAction: actionBreakdown[0]?.action,
    mostFrequentResource: resourceBreakdown[0]?.resource
  };
};
const getSystemAuditSummary = async (days = 7) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const totalActivities = await db('audit_logs')
    .where('created_at', '>=', startDate)
    .count('id as count')
    .first();
  const successRate = await db('audit_logs')
    .where('created_at', '>=', startDate)
    .select(
      db.raw('SUM(CASE WHEN status = "success" THEN 1 ELSE 0 END) as success'),
      db.raw('SUM(CASE WHEN status = "failure" THEN 1 ELSE 0 END) as failure')
    )
    .first();
  const topUsers = await db('audit_logs')
    .leftJoin('users', 'audit_logs.user_id', 'users.id')
    .where('audit_logs.created_at', '>=', startDate)
    .select('users.id', 'users.full_name', 'users.email', db.raw('COUNT(*) as activity_count'))
    .groupBy('audit_logs.user_id', 'users.id', 'users.full_name', 'users.email')
    .orderBy('activity_count', 'desc')
    .limit(10);
  const topActions = await db('audit_logs')
    .where('created_at', '>=', startDate)
    .select('action', db.raw('COUNT(*) as count'))
    .groupBy('action')
    .orderBy('count', 'desc')
    .limit(10);
  const hourlyPattern = await db('audit_logs')
    .where('created_at', '>=', startDate)
    .select(
      db.raw('HOUR(created_at) as hour'),
      db.raw('COUNT(*) as count')
    )
    .groupByRaw('HOUR(created_at)')
    .orderBy('hour', 'asc');
  return {
    period: `${days} days`,
    totalActivities: parseInt(totalActivities.count),
    successRate: (successRate.success / (successRate.success + successRate.failure) * 100).toFixed(1),
    topUsers,
    topActions,
    hourlyPattern,
    peakHour: hourlyPattern.reduce((peak, h) => parseInt(h.count) > parseInt(peak.count) ? h : peak, hourlyPattern[0])?.hour
  };
};
const exportAuditLogs = async (filters, format = 'csv') => {
  const {
    userId,
    action,
    resource,
    startDate,
    endDate,
    search
  } = filters;
  let query = db('audit_logs')
    .leftJoin('users', 'audit_logs.user_id', 'users.id')
    .select(
      'audit_logs.id',
      'users.full_name as user_name',
      'users.email as user_email',
      'audit_logs.action',
      'audit_logs.resource',
      'audit_logs.resource_id',
      'audit_logs.ip_address',
      'audit_logs.status',
      'audit_logs.error_message',
      'audit_logs.created_at'
    );
  if (userId) {
    query = query.where('audit_logs.user_id', userId);
  }
  if (action) {
    query = query.where('audit_logs.action', action);
  }
  if (resource) {
    query = query.where('audit_logs.resource', resource);
  }
  if (startDate && endDate) {
    query = query.whereBetween('audit_logs.created_at', [startDate, endDate]);
  }
  if (search) {
    query = query.where(function() {
      this.where('audit_logs.action', 'like', `%${search}%`)
        .orWhere('audit_logs.resource', 'like', `%${search}%`)
        .orWhere('users.full_name', 'like', `%${search}%`);
    });
  }
  const logs = await query.orderBy('audit_logs.created_at', 'desc');
  if (format === 'csv') {
    return logs;
  }
  return logs;
};
const archiveOldAuditLogs = async (olderThanDays = AUDIT_CONFIG.retentionDays) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
  const logsToArchive = await db('audit_logs')
    .where('created_at', '<', cutoffDate)
    .select('*');
  if (logsToArchive.length === 0) {
    return 0;
  }
  for (let i = 0; i < logsToArchive.length; i += AUDIT_CONFIG.batchSize) {
    const batch = logsToArchive.slice(i, i + AUDIT_CONFIG.batchSize);
    await db('audit_logs_archive').insert(batch);
  }
  const deleted = await db('audit_logs')
    .where('created_at', '<', cutoffDate)
    .delete();
  logger.info(`Archived ${deleted} audit logs older than ${olderThanDays} days`);
  return deleted;
};
const cleanupAuditCache = async () => {
  const keys = await redisClient.keys('audit:recent:*');
  if (keys.length > 0) {
    logger.info(`Cleaned up ${keys.length} audit cache entries`);
  }
  return keys.length;
};
const getRetentionPolicy = () => {
  return {
    retentionDays: AUDIT_CONFIG.retentionDays,
    retentionYears: (AUDIT_CONFIG.retentionDays / 365).toFixed(1),
    autoArchiveEnabled: true,
    archiveTableExists: true
  };
};
const updateAuditConfig = async (config) => {
  if (config.retentionDays) {
    AUDIT_CONFIG.retentionDays = config.retentionDays;
    await db('settings')
      .insert({
        setting_key: 'audit_retention_days',
        setting_value: config.retentionDays.toString(),
        category: 'Security'
      })
      .onConflict('setting_key')
      .merge();
  }
  if (config.batchSize) {
    AUDIT_CONFIG.batchSize = config.batchSize;
  }
  if (config.asyncLogging !== undefined) {
    AUDIT_CONFIG.asyncLogging = config.asyncLogging;
  }
  logger.info('Audit configuration updated', AUDIT_CONFIG);
  return AUDIT_CONFIG;
};
if (typeof setInterval !== 'undefined') {
  setInterval(async () => {
    try {
      await archiveOldAuditLogs();
      await cleanupAuditCache();
    } catch (error) {
      logger.error('Audit archive job failed:', error.message);
    }
  }, 30 * 24 * 60 * 60 * 1000);
}
module.exports = {
  logAudit,
  getAuditLogs,
  getAuditLogById,
  getUserActivitySummary,
  getSystemAuditSummary,
  exportAuditLogs,
  archiveOldAuditLogs,
  cleanupAuditCache,
  getRetentionPolicy,
  updateAuditConfig,
  sanitizeAuditState,
  AUDIT_CONFIG
};
