const BaseRepository = require('./base.repository');
const { db } = require('../config/database');
const { logger } = require('../config/logger');

class ApprovalRepository extends BaseRepository {
  constructor() {
    super('expense_approval_requests', 'id');
  }

  async getPendingForApprover(approverId) {
    try {
      return await db('expense_approval_requests as ear')
        .join('expenses as e', 'ear.expense_id', 'e.id')
        .join('expense_categories as ec', 'e.category_id', 'ec.id')
        .join('users as u', 'e.entered_by', 'u.id')
        .select(
          'ear.*',
          'e.amount',
          'e.description',
          'e.date',
          'ec.name as category_name',
          'u.full_name as entered_by_name'
        )
        .where('ear.approver_id', approverId)
        .where('ear.status', 'pending')
        .orderBy('ear.created_at', 'asc');
    } catch (error) {
      logger.error('ApprovalRepository.getPendingForApprover error:', error.message);
      throw error;
    }
  }

  async getApprovalHistory(expenseId) {
    try {
      return await db('expense_approval_requests as ear')
        .leftJoin('users as u', 'ear.approver_id', 'u.id')
        .select('ear.*', 'u.full_name as approver_name')
        .where('ear.expense_id', expenseId)
        .orderBy('ear.created_at', 'asc');
    } catch (error) {
      logger.error('ApprovalRepository.getApprovalHistory error:', error.message);
      throw error;
    }
  }

  async determineApprovalTier(amount) {
    try {
      const approver = await db('expense_approvers')
        .where('min_amount', '<=', amount)
        .where('max_amount', '>=', amount)
        .where('is_active', true)
        .orderBy('priority', 'asc')
        .first();
      return approver ? approver.approval_tier : 'manager';
    } catch (error) {
      logger.error('ApprovalRepository.determineApprovalTier error:', error.message);
      throw error;
    }
  }

  async getApproversForTier(tier, amount) {
    try {
      return await db('expense_approvers as ea')
        .join('users as u', 'ea.user_id', 'u.id')
        .select('ea.*', 'u.full_name', 'u.email')
        .where('ea.approval_tier', tier)
        .where('ea.min_amount', '<=', amount)
        .where('ea.max_amount', '>=', amount)
        .where('ea.is_active', true)
        .orderBy('ea.priority', 'asc');
    } catch (error) {
      logger.error('ApprovalRepository.getApproversForTier error:', error.message);
      throw error;
    }
  }

  async createApprovalRequest(data) {
    try {
      const [id] = await db('expense_approval_requests').insert(data);
      return id;
    } catch (error) {
      logger.error('ApprovalRepository.createApprovalRequest error:', error.message);
      throw error;
    }
  }

  async updateApprovalStatus(id, status, comments, userId) {
    try {
      await db('expense_approval_requests')
        .where('id', id)
        .update({
          status,
          comments,
          approver_id: userId,
          actioned_at: db.fn.now(),
          updated_at: db.fn.now()
        });
      return true;
    } catch (error) {
      logger.error('ApprovalRepository.updateApprovalStatus error:', error.message);
      throw error;
    }
  }
}

module.exports = ApprovalRepository;
