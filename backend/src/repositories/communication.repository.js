const BaseRepository = require('./base.repository');
const { db } = require('../config/database');
const { logger } = require('../config/logger');
class CommunicationRepository extends BaseRepository {
  constructor() {
    super('communication_logs', 'id');
  }
  async log(logData) {
    try {
      const [id] = await this.query().insert({
        type: logData.type, 
        recipient: logData.recipient,
        subject: logData.subject || null,
        content: logData.content,
        status: logData.status || 'pending',
        provider_response: logData.providerResponse || null,
        retry_count: logData.retryCount || 0,
        created_at: db.fn.now(),
        sent_at: logData.status === 'sent' ? db.fn.now() : null
      });
      return id;
    } catch (error) {
      logger.error('CommunicationRepository.log error:', error.message);
      throw error;
    }
  }
  async updateStatus(logId, status, providerResponse = null) {
    try {
      const updateData = {
        status,
        provider_response: providerResponse,
        updated_at: db.fn.now()
      };
      if (status === 'sent') {
        updateData.sent_at = db.fn.now();
      }
      await this.update(logId, updateData);
      return true;
    } catch (error) {
      logger.error('CommunicationRepository.updateStatus error:', error.message);
      throw error;
    }
  }
  async incrementRetryCount(logId) {
    try {
      const log = await this.findById(logId);
      if (!log) {
        throw new Error('Communication log not found');
      }
      const newRetryCount = (log.retry_count || 0) + 1;
      await this.update(logId, {
        retry_count: newRetryCount,
        updated_at: db.fn.now()
      });
      return newRetryCount;
    } catch (error) {
      logger.error('CommunicationRepository.incrementRetryCount error:', error.message);
      throw error;
    }
  }
  async getPendingRetries(maxRetries = 5) {
    try {
      const pending = await this.query()
        .where('status', 'failed')
        .where('retry_count', '<', maxRetries)
        .orderBy('created_at', 'asc')
        .limit(100);
      return pending;
    } catch (error) {
      logger.error('CommunicationRepository.getPendingRetries error:', error.message);
      throw error;
    }
  }
  async getByRecipient(recipient, options = {}) {
    const { page = 1, limit = 25, type = null } = options;
    const offset = (page - 1) * limit;
    try {
      let query = this.query()
        .where('recipient', recipient)
        .orderBy('created_at', 'desc');
      if (type) {
        query = query.where('type', type);
      }
      const total = await query.clone().count('id as total').first();
      const logs = await query.limit(limit).offset(offset);
      return {
        data: logs,
        pagination: {
          page,
          limit,
          total: parseInt(total?.total || 0),
          totalPages: Math.ceil((total?.total || 0) / limit)
        }
      };
    } catch (error) {
      logger.error('CommunicationRepository.getByRecipient error:', error.message);
      throw error;
    }
  }
  async getByType(type, options = {}) {
    const { page = 1, limit = 25, startDate, endDate, status } = options;
    const offset = (page - 1) * limit;
    try {
      let query = this.query()
        .where('type', type)
        .orderBy('created_at', 'desc');
      if (startDate && endDate) {
        query = query.whereBetween('created_at', [startDate, endDate]);
      }
      if (status) {
        query = query.where('status', status);
      }
      const total = await query.clone().count('id as total').first();
      const logs = await query.limit(limit).offset(offset);
      const summary = await this.query()
        .where('type', type)
        .where(function() {
          if (startDate && endDate) {
            this.whereBetween('created_at', [startDate, endDate]);
          }
        })
        .select(
          db.raw('COUNT(*) as total'),
          db.raw('SUM(CASE WHEN status = "sent" THEN 1 ELSE 0 END) as sent'),
          db.raw('SUM(CASE WHEN status = "failed" THEN 1 ELSE 0 END) as failed'),
          db.raw('SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending')
        )
        .first();
      return {
        data: logs,
        summary: {
          total: parseInt(summary?.total || 0),
          sent: parseInt(summary?.sent || 0),
          failed: parseInt(summary?.failed || 0),
          pending: parseInt(summary?.pending || 0),
          successRate: summary?.total > 0 ? ((summary.sent / summary.total) * 100).toFixed(1) : 0
        },
        pagination: {
          page,
          limit,
          total: parseInt(total?.total || 0),
          totalPages: Math.ceil((total?.total || 0) / limit)
        }
      };
    } catch (error) {
      logger.error('CommunicationRepository.getByType error:', error.message);
      throw error;
    }
  }
  async getStatistics(days = 30) {
    try {
      const startDate = db.raw(`DATE_SUB(NOW(), INTERVAL ${days} DAY)`);
      const emailStats = await this.query()
        .where('type', 'email')
        .where('created_at', '>=', startDate)
        .select(
          db.raw('COUNT(*) as total'),
          db.raw('SUM(CASE WHEN status = "sent" THEN 1 ELSE 0 END) as sent'),
          db.raw('SUM(CASE WHEN status = "failed" THEN 1 ELSE 0 END) as failed')
        )
        .first();
      const smsStats = await this.query()
        .where('type', 'sms')
        .where('created_at', '>=', startDate)
        .select(
          db.raw('COUNT(*) as total'),
          db.raw('SUM(CASE WHEN status = "sent" THEN 1 ELSE 0 END) as sent'),
          db.raw('SUM(CASE WHEN status = "failed" THEN 1 ELSE 0 END) as failed')
        )
        .first();
      const dailyTrend = await this.query()
        .where('created_at', '>=', startDate)
        .select(
          db.raw('DATE(created_at) as date'),
          db.raw('COUNT(*) as total'),
          db.raw('SUM(CASE WHEN status = "sent" THEN 1 ELSE 0 END) as sent'),
          db.raw('SUM(CASE WHEN status = "failed" THEN 1 ELSE 0 END) as failed')
        )
        .groupByRaw('DATE(created_at)')
        .orderBy('date', 'asc');
      const retryNeeded = await this.query()
        .where('status', 'failed')
        .where('retry_count', '<', 5)
        .count('id as count')
        .first();
      return {
        period: `${days} days`,
        email: {
          total: parseInt(emailStats?.total || 0),
          sent: parseInt(emailStats?.sent || 0),
          failed: parseInt(emailStats?.failed || 0),
          successRate: emailStats?.total > 0 ? ((emailStats.sent / emailStats.total) * 100).toFixed(1) : 0
        },
        sms: {
          total: parseInt(smsStats?.total || 0),
          sent: parseInt(smsStats?.sent || 0),
          failed: parseInt(smsStats?.failed || 0),
          successRate: smsStats?.total > 0 ? ((smsStats.sent / smsStats.total) * 100).toFixed(1) : 0
        },
        combined: {
          total: (parseInt(emailStats?.total || 0) + parseInt(smsStats?.total || 0)),
          sent: (parseInt(emailStats?.sent || 0) + parseInt(smsStats?.sent || 0)),
          failed: (parseInt(emailStats?.failed || 0) + parseInt(smsStats?.failed || 0))
        },
        dailyTrend,
        pendingRetries: parseInt(retryNeeded?.count || 0)
      };
    } catch (error) {
      logger.error('CommunicationRepository.getStatistics error:', error.message);
      throw error;
    }
  }
  async getFailedCommunications(hours = 24) {
    try {
      const startDate = db.raw(`DATE_SUB(NOW(), INTERVAL ${hours} HOUR)`);
      const failed = await this.query()
        .where('status', 'failed')
        .where('created_at', '>=', startDate)
        .orderBy('created_at', 'desc')
        .limit(100);
      return failed;
    } catch (error) {
      logger.error('CommunicationRepository.getFailedCommunications error:', error.message);
      throw error;
    }
  }
  async cleanupOldLogs(daysToKeep = 90) {
    try {
      const cutoffDate = db.raw(`DATE_SUB(NOW(), INTERVAL ${daysToKeep} DAY)`);
      const deleted = await this.query()
        .where('created_at', '<', cutoffDate)
        .delete();
      return deleted;
    } catch (error) {
      logger.error('CommunicationRepository.cleanupOldLogs error:', error.message);
      throw error;
    }
  }
  async getByDateRange(startDate, endDate, type = null) {
    try {
      let query = this.query()
        .whereBetween('created_at', [startDate, endDate])
        .orderBy('created_at', 'desc');
      if (type) {
        query = query.where('type', type);
      }
      const logs = await query.limit(1000);
      return logs;
    } catch (error) {
      logger.error('CommunicationRepository.getByDateRange error:', error.message);
      throw error;
    }
  }
  async getRecipientSummary(recipient) {
    try {
      const summary = await this.query()
        .where('recipient', recipient)
        .select(
          db.raw('COUNT(*) as total'),
          db.raw('SUM(CASE WHEN status = "sent" THEN 1 ELSE 0 END) as sent'),
          db.raw('SUM(CASE WHEN status = "failed" THEN 1 ELSE 0 END) as failed'),
          db.raw('MAX(created_at) as last_communication')
        )
        .first();
      const lastSuccess = await this.query()
        .where('recipient', recipient)
        .where('status', 'sent')
        .orderBy('created_at', 'desc')
        .first();
      const lastFailed = await this.query()
        .where('recipient', recipient)
        .where('status', 'failed')
        .orderBy('created_at', 'desc')
        .first();
      return {
        total: parseInt(summary?.total || 0),
        sent: parseInt(summary?.sent || 0),
        failed: parseInt(summary?.failed || 0),
        successRate: summary?.total > 0 ? ((summary.sent / summary.total) * 100).toFixed(1) : 0,
        lastCommunication: summary?.last_communication,
        lastSuccessAt: lastSuccess?.created_at,
        lastFailedAt: lastFailed?.created_at,
        lastFailedReason: lastFailed?.provider_response
      };
    } catch (error) {
      logger.error('CommunicationRepository.getRecipientSummary error:', error.message);
      throw error;
    }
  }
  async markPermanentlyFailed(logId) {
    try {
      await this.update(logId, {
        status: 'permanently_failed',
        provider_response: db.raw(`CONCAT(provider_response, ' - Max retries exceeded')`),
        updated_at: db.fn.now()
      });
      return true;
    } catch (error) {
      logger.error('CommunicationRepository.markPermanentlyFailed error:', error.message);
      throw error;
    }
  }
  async getPendingCount() {
    try {
      const result = await this.query()
        .where('status', 'pending')
        .count('id as count')
        .first();
      return parseInt(result?.count || 0);
    } catch (error) {
      logger.error('CommunicationRepository.getPendingCount error:', error.message);
      return 0;
    }
  }
  async getDashboardSummary() {
    try {
      const today = db.raw('DATE(NOW())');
      const thisWeek = db.raw('DATE_SUB(NOW(), INTERVAL 7 DAY)');
      const todayStats = await this.query()
        .where('created_at', '>=', today)
        .select(
          db.raw('COUNT(*) as total'),
          db.raw('SUM(CASE WHEN status = "sent" THEN 1 ELSE 0 END) as sent'),
          db.raw('SUM(CASE WHEN status = "failed" THEN 1 ELSE 0 END) as failed')
        )
        .first();
      const weekStats = await this.query()
        .where('created_at', '>=', thisWeek)
        .select(
          db.raw('COUNT(*) as total'),
          db.raw('SUM(CASE WHEN type = "email" THEN 1 ELSE 0 END) as emails'),
          db.raw('SUM(CASE WHEN type = "sms" THEN 1 ELSE 0 END) as sms')
        )
        .first();
      return {
        today: {
          total: parseInt(todayStats?.total || 0),
          sent: parseInt(todayStats?.sent || 0),
          failed: parseInt(todayStats?.failed || 0),
          successRate: todayStats?.total > 0 ? ((todayStats.sent / todayStats.total) * 100).toFixed(1) : 0
        },
        thisWeek: {
          total: parseInt(weekStats?.total || 0),
          emails: parseInt(weekStats?.emails || 0),
          sms: parseInt(weekStats?.sms || 0)
        },
        pendingRetries: await this.getPendingCount()
      };
    } catch (error) {
      logger.error('CommunicationRepository.getDashboardSummary error:', error.message);
      throw error;
    }
  }
}
module.exports = CommunicationRepository;
