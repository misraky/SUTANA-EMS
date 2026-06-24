const BaseRepository = require('./base.repository');
const { db } = require('../config/database');
const { logger } = require('../config/logger');

class PettyCashRepository extends BaseRepository {
  constructor() {
    super('petty_cash_funds', 'id');
  }

  async getFundWithCustodian(fundId) {
    try {
      const fund = await db('petty_cash_funds')
        .leftJoin('users', 'petty_cash_funds.custodian_id', 'users.id')
        .select('petty_cash_funds.*', 'users.full_name as custodian_name')
        .where('petty_cash_funds.id', fundId)
        .first();
      return fund || null;
    } catch (error) {
      logger.error('PettyCashRepository.getFundWithCustodian error:', error.message);
      throw error;
    }
  }

  async getActiveFunds() {
    try {
      return await db('petty_cash_funds')
        .leftJoin('users', 'petty_cash_funds.custodian_id', 'users.id')
        .select('petty_cash_funds.*', 'users.full_name as custodian_name')
        .where('petty_cash_funds.status', 'active');
    } catch (error) {
      logger.error('PettyCashRepository.getActiveFunds error:', error.message);
      throw error;
    }
  }

  async getTransactions(fundId, options = {}) {
    const { page = 1, limit = 50, status } = options;
    try {
      const baseQuery = () => db('petty_cash_transactions')
        .leftJoin('expense_categories', 'petty_cash_transactions.category_id', 'expense_categories.id')
        .leftJoin('users as req', 'petty_cash_transactions.requested_by', 'req.id')
        .leftJoin('users as appr', 'petty_cash_transactions.approved_by', 'appr.id')
        .where('petty_cash_transactions.fund_id', fundId);
      const applyFilters = (q) => {
        if (status) q = q.where('petty_cash_transactions.status', status);
        return q;
      };
      const [{ count }] = await applyFilters(baseQuery()).count('id as count');
      const transactions = await applyFilters(baseQuery())
        .select(
          'petty_cash_transactions.*',
          'expense_categories.name as category_name',
          'req.full_name as requested_by_name',
          'appr.full_name as approved_by_name'
        )
        .orderBy('petty_cash_transactions.created_at', 'desc')
        .limit(limit)
        .offset((page - 1) * limit);
      return {
        data: transactions,
        pagination: {
          page,
          limit,
          total: parseInt(count || 0),
          totalPages: Math.ceil(parseInt(count || 0) / limit)
        }
      };
    } catch (error) {
      logger.error('PettyCashRepository.getTransactions error:', error.message);
      throw error;
    }
  }

  async createTransaction(data) {
    try {
      const [id] = await db('petty_cash_transactions').insert(data);
      return id;
    } catch (error) {
      logger.error('PettyCashRepository.createTransaction error:', error.message);
      throw error;
    }
  }

  async updateFundBalance(fundId, newBalance) {
    try {
      await this.update(fundId, { current_balance: newBalance, updated_at: db.fn.now() });
      return true;
    } catch (error) {
      logger.error('PettyCashRepository.updateFundBalance error:', error.message);
      throw error;
    }
  }

  async getFundSummary() {
    try {
      const funds = await this.getActiveFunds();
      const totalImprest = funds.reduce((s, f) => s + parseFloat(f.imprest_amount || 0), 0);
      const totalBalance = funds.reduce((s, f) => s + parseFloat(f.current_balance || 0), 0);
      const pendingCount = await db('petty_cash_transactions')
        .where('status', 'pending')
        .count('id as count')
        .first();
      return {
        totalFunds: funds.length,
        totalImprest,
        totalBalance,
        outstandingAmount: totalImprest - totalBalance,
        pendingTransactions: parseInt(pendingCount?.count || 0)
      };
    } catch (error) {
      logger.error('PettyCashRepository.getFundSummary error:', error.message);
      throw error;
    }
  }
}

module.exports = PettyCashRepository;
