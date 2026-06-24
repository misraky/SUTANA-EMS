const BaseRepository = require('./base.repository');
const { db } = require('../config/database');
const { logger } = require('../config/logger');

class ClosePeriodRepository extends BaseRepository {
  constructor() {
    super('month_end_closes', 'id');
  }

  async getCurrentPeriod() {
    try {
      const now = new Date();
      const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      let record = await this.findOne({ close_period: period });
      if (!record) {
        const [id] = await db('month_end_closes').insert({
          close_period: period,
          close_date: now,
          status: 'open'
        });
        record = await this.findById(id);
      }
      return record;
    } catch (error) {
      logger.error('ClosePeriodRepository.getCurrentPeriod error:', error.message);
      throw error;
    }
  }

  async getPeriodHistory(limit = 12) {
    try {
      return await this.query()
        .orderBy('close_period', 'desc')
        .limit(limit);
    } catch (error) {
      logger.error('ClosePeriodRepository.getPeriodHistory error:', error.message);
      throw error;
    }
  }

  async closePeriod(period, userId, notes) {
    try {
      const existing = await this.findOne({ close_period: period });
      if (existing && existing.status === 'closed') {
        throw new Error(`Period ${period} is already closed`);
      }
      const checklistResults = JSON.stringify({
        expensesReconciled: true,
        bankStatementsMatched: true,
        taxDeclarationsFiled: true,
        encumbrancesReviewed: true,
        pettyCashReconciled: true,
        arApAged: true
      });
      if (existing) {
        await db('month_end_closes')
          .where('close_period', period)
          .update({
            status: 'closed',
            closed_at: db.fn.now(),
            closed_by: userId,
            checklist_results: checklistResults,
            notes: notes || '',
            updated_at: db.fn.now()
          });
      } else {
        await db('month_end_closes').insert({
          close_period: period,
          close_date: new Date(),
          status: 'closed',
          closed_at: db.fn.now(),
          closed_by: userId,
          checklist_results: checklistResults,
          notes: notes || ''
        });
      }
      return true;
    } catch (error) {
      logger.error('ClosePeriodRepository.closePeriod error:', error.message);
      throw error;
    }
  }

  async reopenPeriod(period, userId, reason) {
    try {
      await db('month_end_closes')
        .where('close_period', period)
        .update({
          status: 'reopened',
          reopened_by: userId,
          reopened_at: db.fn.now(),
          notes: db.raw("CONCAT(IFNULL(notes, ''), ' | Reopened: ', ?)", [reason]),
          updated_at: db.fn.now()
        });
      return true;
    } catch (error) {
      logger.error('ClosePeriodRepository.reopenPeriod error:', error.message);
      throw error;
    }
  }
}

module.exports = ClosePeriodRepository;
