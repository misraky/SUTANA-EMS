const BaseRepository = require('./base.repository');
const { db } = require('../config/database');
const { logger } = require('../config/logger');
class AuditRepository extends BaseRepository {
  constructor() {
    super('audit_logs', 'id');
  }
  async log(auditData) {
    try {
      const [id] = await this.query().insert({
        user_id: auditData.userId,
        action: auditData.action,
        resource: auditData.resource,
        resource_id: auditData.resourceId ? String(auditData.resourceId) : null,
        before_state: auditData.beforeState ? JSON.stringify(auditData.beforeState) : null,
        after_state: auditData.afterState ? JSON.stringify(auditData.afterState) : null,
        ip_address: auditData.ipAddress,
        user_agent: auditData.userAgent,
        status: auditData.status || 'success',
        error_message: auditData.errorMessage || null,
        created_at: db.fn.now()
      });
      return id;
    } catch (error) {
      logger.error('AuditRepository.log error:', error.message);
      throw error;
    }
  }
  async findAllWithFilters(options = {}) {
    const {
      page = 1,
      limit = 50,
      userId,
      action,
      resource,
      startDate,
      endDate,
      search
    } = options;
    const offset = (page - 1) * limit;
    try {
      let query = this.query()
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
      const actions = await this.query().distinct('action').pluck('action');
      const resources = await this.query().distinct('resource').pluck('resource');
      return {
        data: logs,
        filters: { actions, resources },
        pagination: {
          page,
          limit,
          total: parseInt(total?.total || 0),
          totalPages: Math.ceil((total?.total || 0) / limit)
        }
      };
    } catch (error) {
      logger.error('AuditRepository.findAllWithFilters error:', error.message);
      throw error;
    }
  }
  async getLogWithDetails(logId) {
    try {
      const log = await this.query()
        .leftJoin('users', 'audit_logs.user_id', 'users.id')
        .select(
          'audit_logs.*',
          'users.full_name as user_name',
          'users.email as user_email'
        )
        .where('audit_logs.id', logId)
        .first();
      if (log) {
        if (log.before_state && typeof log.before_state === 'string') {
          log.before_state = JSON.parse(log.before_state);
        }
        if (log.after_state && typeof log.after_state === 'string') {
          log.after_state = JSON.parse(log.after_state);
        }
      }
      return log || null;
    } catch (error) {
      logger.error('AuditRepository.getLogWithDetails error:', error.message);
      throw error;
    }
  }
  async getUserActivitySummary(userId, days = 30) {
    try {
      const startDate = db.raw(`DATE_SUB(NOW(), INTERVAL ${days} DAY)`);
      const activities = await this.query()
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
      const actionBreakdown = await this.query()
        .where('user_id', userId)
        .where('created_at', '>=', startDate)
        .select('action', db.raw('COUNT(*) as count'))
        .groupBy('action')
        .orderBy('count', 'desc');
      const resourceBreakdown = await this.query()
        .where('user_id', userId)
        .where('created_at', '>=', startDate)
        .select('resource', db.raw('COUNT(*) as count'))
        .groupBy('resource')
        .orderBy('count', 'desc');
      const lastActivity = await this.query()
        .where('user_id', userId)
        .orderBy('created_at', 'desc')
        .first();
      const totalActivities = activities.reduce((sum, a) => sum + parseInt(a.count), 0);
      const totalSuccess = activities.reduce((sum, a) => sum + parseInt(a.success_count), 0);
      return {
        userId,
        period: `${days} days`,
        totalActivities,
        successRate: totalActivities > 0 ? (totalSuccess / totalActivities) * 100 : 0,
        dailyBreakdown: activities,
        actionBreakdown,
        resourceBreakdown,
        lastActivity: lastActivity?.created_at,
        lastActivityAction: lastActivity?.action,
        mostFrequentAction: actionBreakdown[0]?.action,
        mostFrequentResource: resourceBreakdown[0]?.resource
      };
    } catch (error) {
      logger.error('AuditRepository.getUserActivitySummary error:', error.message);
      throw error;
    }
  }
  async getSystemAuditSummary(days = 7) {
    try {
      const startDate = db.raw(`DATE_SUB(NOW(), INTERVAL ${days} DAY)`);
      const totalActivities = await this.query()
        .where('created_at', '>=', startDate)
        .count('id as count')
        .first();
      const successRate = await this.query()
        .where('created_at', '>=', startDate)
        .select(
          db.raw('SUM(CASE WHEN status = "success" THEN 1 ELSE 0 END) as success'),
          db.raw('SUM(CASE WHEN status = "failure" THEN 1 ELSE 0 END) as failure')
        )
        .first();
      const topUsers = await this.query()
        .leftJoin('users', 'audit_logs.user_id', 'users.id')
        .where('audit_logs.created_at', '>=', startDate)
        .select('users.id', 'users.full_name', 'users.email', db.raw('COUNT(*) as activity_count'))
        .groupBy('audit_logs.user_id', 'users.id', 'users.full_name', 'users.email')
        .orderBy('activity_count', 'desc')
        .limit(10);
      const topActions = await this.query()
        .where('created_at', '>=', startDate)
        .select('action', db.raw('COUNT(*) as count'))
        .groupBy('action')
        .orderBy('count', 'desc')
        .limit(10);
      const topResources = await this.query()
        .where('created_at', '>=', startDate)
        .select('resource', db.raw('COUNT(*) as count'))
        .groupBy('resource')
        .orderBy('count', 'desc')
        .limit(10);
      const hourlyPattern = await this.query()
        .where('created_at', '>=', startDate)
        .select(
          db.raw('HOUR(created_at) as hour'),
          db.raw('COUNT(*) as count')
        )
        .groupByRaw('HOUR(created_at)')
        .orderBy('hour', 'asc');
      const dailyPattern = await this.query()
        .where('created_at', '>=', startDate)
        .select(
          db.raw('DAYOFWEEK(created_at) as day'),
          db.raw('COUNT(*) as count')
        )
        .groupByRaw('DAYOFWEEK(created_at)')
        .orderBy('day', 'asc');
      return {
        period: `${days} days`,
        totalActivities: parseInt(totalActivities?.count || 0),
        successRate: (successRate?.success || 0) + (successRate?.failure || 0) > 0
          ? ((successRate?.success || 0) / ((successRate?.success || 0) + (successRate?.failure || 0))) * 100
          : 0,
        topUsers,
        topActions,
        topResources,
        hourlyPattern,
        dailyPattern,
        peakHour: hourlyPattern.reduce((peak, h) => parseInt(h.count) > parseInt(peak.count) ? h : peak, hourlyPattern[0])?.hour,
        busiestDay: dailyPattern.reduce((busiest, d) => parseInt(d.count) > parseInt(busiest.count) ? d : busiest, dailyPattern[0])?.day
      };
    } catch (error) {
      logger.error('AuditRepository.getSystemAuditSummary error:', error.message);
      throw error;
    }
  }
  async getByResource(resource, resourceId, limit = 50) {
    try {
      const logs = await this.query()
        .where('resource', resource)
        .where('resource_id', String(resourceId))
        .orderBy('created_at', 'desc')
        .limit(limit);
      return logs;
    } catch (error) {
      logger.error('AuditRepository.getByResource error:', error.message);
      throw error;
    }
  }
  async exportLogs(startDate, endDate, filters = {}) {
    const { userId, action, resource } = filters;
    try {
      let query = this.query()
        .leftJoin('users', 'audit_logs.user_id', 'users.id')
        .select(
          'audit_logs.id',
          'users.email as user_email',
          'users.full_name as user_name',
          'audit_logs.action',
          'audit_logs.resource',
          'audit_logs.resource_id',
          'audit_logs.ip_address',
          'audit_logs.user_agent',
          'audit_logs.status',
          'audit_logs.error_message',
          'audit_logs.created_at'
        )
        .whereBetween('audit_logs.created_at', [startDate, endDate]);
      if (userId) {
        query = query.where('audit_logs.user_id', userId);
      }
      if (action) {
        query = query.where('audit_logs.action', action);
      }
      if (resource) {
        query = query.where('audit_logs.resource', resource);
      }
      const logs = await query.orderBy('audit_logs.created_at', 'desc');
      return logs;
    } catch (error) {
      logger.error('AuditRepository.exportLogs error:', error.message);
      throw error;
    }
  }
  async archiveOldLogs(olderThanDays = 2555) { 
    try {
      const cutoffDate = db.raw(`DATE_SUB(NOW(), INTERVAL ${olderThanDays} DAY)`);
      const logsToArchive = await this.query()
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
      const deleted = await this.query()
        .where('created_at', '<', cutoffDate)
        .delete();
      logger.info(`Archived ${deleted} audit logs older than ${olderThanDays} days`);
      return deleted;
    } catch (error) {
      logger.error('AuditRepository.archiveOldLogs error:', error.message);
      throw error;
    }
  }
  async getRetentionInfo() {
    try {
      const oldestLog = await this.query()
        .orderBy('created_at', 'asc')
        .first();
      const totalCount = await this.query().count('id as count').first();
      const archiveCount = await db('audit_logs_archive').count('id as count').first();
      return {
        mainTableCount: parseInt(totalCount?.count || 0),
        archiveTableCount: parseInt(archiveCount?.count || 0),
        oldestLogDate: oldestLog?.created_at,
        retentionDays: 2555, 
        retentionYears: 7
      };
    } catch (error) {
      logger.error('AuditRepository.getRetentionInfo error:', error.message);
      throw error;
    }
  }
  async getDistinctActions() {
    try {
      const actions = await this.query().distinct('action').pluck('action');
      return actions;
    } catch (error) {
      logger.error('AuditRepository.getDistinctActions error:', error.message);
      throw error;
    }
  }
  async getDistinctResources() {
    try {
      const resources = await this.query().distinct('resource').pluck('resource');
      return resources;
    } catch (error) {
      logger.error('AuditRepository.getDistinctResources error:', error.message);
      throw error;
    }
  }
  async cleanupOldCache(olderThanHours = 24) {
    return 0;
  }
  async getUserLoginHistory(userId, limit = 50) {
    try {
      const history = await this.query()
        .where('user_id', userId)
        .where('action', 'LOGIN_SUCCESS')
        .orWhere('action', 'LOGIN_FAILED')
        .orderBy('created_at', 'desc')
        .limit(limit);
      return history;
    } catch (error) {
      logger.error('AuditRepository.getUserLoginHistory error:', error.message);
      throw error;
    }
  }
  async getFailedLoginCount(userId, hours = 24) {
    try {
      const startDate = db.raw(`DATE_SUB(NOW(), INTERVAL ${hours} HOUR)`);
      const result = await this.query()
        .where('user_id', userId)
        .where('action', 'LOGIN_FAILED')
        .where('created_at', '>=', startDate)
        .count('id as count')
        .first();
      return parseInt(result?.count || 0);
    } catch (error) {
      logger.error('AuditRepository.getFailedLoginCount error:', error.message);
      throw error;
    }
  }
}
module.exports = AuditRepository;
