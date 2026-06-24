const BaseRepository = require('./base.repository');
const { db } = require('../config/database');
const { logger } = require('../config/logger');

class BudgetRepository extends BaseRepository {
  constructor() {
    super('budget_periods', 'id');
  }

  async getActiveBudgets() {
    try {
      return await this.query()
        .where('status', 'active')
        .orderBy('start_date', 'desc');
    } catch (error) {
      logger.error('BudgetRepository.getActiveBudgets error:', error.message);
      throw error;
    }
  }

  async getBudgetWithItems(budgetId) {
    try {
      const budget = await this.findById(budgetId);
      if (!budget) return null;
      const items = await db('budget_items')
        .leftJoin('expense_categories', 'budget_items.category_id', 'expense_categories.id')
        .leftJoin('chart_of_accounts', 'budget_items.coa_id', 'chart_of_accounts.id')
        .select(
          'budget_items.*',
          'expense_categories.name as category_name',
          'chart_of_accounts.account_code',
          'chart_of_accounts.account_name'
        )
        .where('budget_items.budget_period_id', budgetId);
      return { ...budget, items };
    } catch (error) {
      logger.error('BudgetRepository.getBudgetWithItems error:', error.message);
      throw error;
    }
  }

  async createBudgetItem(data) {
    try {
      const [id] = await db('budget_items').insert(data);
      return id;
    } catch (error) {
      logger.error('BudgetRepository.createBudgetItem error:', error.message);
      throw error;
    }
  }

  async getEncumbrances(budgetItemId) {
    try {
      return await db('budget_encumbrances')
        .where('budget_item_id', budgetItemId)
        .orderBy('encumbered_at', 'desc');
    } catch (error) {
      logger.error('BudgetRepository.getEncumbrances error:', error.message);
      throw error;
    }
  }

  async createEncumbrance(data) {
    try {
      const [id] = await db('budget_encumbrances').insert(data);
      return id;
    } catch (error) {
      logger.error('BudgetRepository.createEncumbrance error:', error.message);
      throw error;
    }
  }

  async releaseEncumbrance(encumbranceId) {
    try {
      await db('budget_encumbrances')
        .where('id', encumbranceId)
        .update({ status: 'released', released_at: db.fn.now() });
      return true;
    } catch (error) {
      logger.error('BudgetRepository.releaseEncumbrance error:', error.message);
      throw error;
    }
  }

  async getBudgetUtilizationReport(budgetPeriodId) {
    try {
      return await db('budget_items')
        .leftJoin('expense_categories', 'budget_items.category_id', 'expense_categories.id')
        .select(
          'budget_items.*',
          'expense_categories.name as category_name',
          db.raw('(budget_items.allocated_amount - budget_items.encumbered_amount - budget_items.spent_amount) as available'),
          db.raw('ROUND(((budget_items.encumbered_amount + budget_items.spent_amount) / budget_items.allocated_amount) * 100, 2) as utilization_pct')
        )
        .where('budget_items.budget_period_id', budgetPeriodId);
    } catch (error) {
      logger.error('BudgetRepository.getBudgetUtilizationReport error:', error.message);
      throw error;
    }
  }
}

module.exports = BudgetRepository;
