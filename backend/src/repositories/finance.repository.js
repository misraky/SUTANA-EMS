const BaseRepository = require('./base.repository');
const { db } = require('../config/database');
const { logger } = require('../config/logger');
class FinanceRepository extends BaseRepository {
  constructor() {
    super('expenses', 'id');
  }
  async findAllWithFilters(options = {}) {
    const {
      page = 1,
      limit = 25,
      categoryId,
      startDate,
      endDate,
      status = 'all'
    } = options;
    const offset = (page - 1) * limit;
    try {
      let query = db('expenses as e')
        .leftJoin('expense_categories as ec', 'e.category_id', 'ec.id')
        .leftJoin('payment_methods as pm', 'e.payment_method_id', 'pm.id')
        .leftJoin('users as u', 'e.entered_by', 'u.id')
        .leftJoin('users as a', 'e.approved_by', 'a.id')
        .select(
          'e.*',
          'ec.name as category_name',
          'ec.requires_approval',
          'pm.name as payment_method_name',
          'u.full_name as entered_by_name',
          'a.full_name as approved_by_name'
        )
        .whereNull('e.deleted_at');
      if (categoryId) {
        query = query.where('e.category_id', categoryId);
      }
      if (startDate && endDate) {
        query = query.whereBetween('e.date', [startDate, endDate]);
      }
      if (status === 'pending') {
        query = query.whereNull('e.approved_at');
      } else if (status === 'approved') {
        query = query.whereNotNull('e.approved_at');
      }
      const total = await query.clone().count('e.id as total').first();
      const expenses = await query
        .orderBy('e.date', 'desc')
        .limit(limit)
        .offset(offset);
      const totals = await db('expenses')
        .where(function() {
          if (categoryId) this.where('category_id', categoryId);
          if (startDate && endDate) this.whereBetween('date', [startDate, endDate]);
        })
        .whereNull('deleted_at')
        .select(
          db.raw('SUM(amount) as total_amount'),
          db.raw('COUNT(*) as total_count'),
          db.raw('SUM(CASE WHEN approved_at IS NOT NULL THEN amount ELSE 0 END) as approved_amount'),
          db.raw('SUM(CASE WHEN approved_at IS NULL THEN amount ELSE 0 END) as pending_amount')
        )
        .first();
      return {
        data: expenses,
        summary: {
          totalAmount: parseFloat(totals?.total_amount || 0),
          totalCount: parseInt(totals?.total_count || 0),
          approvedAmount: parseFloat(totals?.approved_amount || 0),
          pendingAmount: parseFloat(totals?.pending_amount || 0)
        },
        pagination: {
          page,
          limit,
          total: parseInt(total?.total || 0),
          totalPages: Math.ceil((total?.total || 0) / limit)
        }
      };
    } catch (error) {
      logger.error('FinanceRepository.findAllWithFilters error:', error.message);
      throw error;
    }
  }
  async getExpenseWithDetails(expenseId) {
    try {
      const expense = await db('expenses as e')
        .leftJoin('expense_categories as ec', 'e.category_id', 'ec.id')
        .leftJoin('payment_methods as pm', 'e.payment_method_id', 'pm.id')
        .leftJoin('users as u', 'e.entered_by', 'u.id')
        .leftJoin('users as a', 'e.approved_by', 'a.id')
        .select(
          'e.*',
          'ec.name as category_name',
          'ec.requires_approval',
          'ec.approval_limit',
          'pm.name as payment_method_name',
          'u.full_name as entered_by_name',
          'a.full_name as approved_by_name'
        )
        .where('e.id', expenseId)
        .whereNull('e.deleted_at')
        .first();
      return expense || null;
    } catch (error) {
      logger.error('FinanceRepository.getExpenseWithDetails error:', error.message);
      throw error;
    }
  }
  async getExpensesByCategory(categoryId, startDate, endDate) {
    try {
      const expenses = await this.query()
        .where('category_id', categoryId)
        .whereBetween('date', [startDate, endDate])
        .whereNotNull('approved_at')
        .whereNull('deleted_at')
        .select('amount', 'date', 'description')
        .orderBy('date', 'desc');
      return expenses;
    } catch (error) {
      logger.error('FinanceRepository.getExpensesByCategory error:', error.message);
      throw error;
    }
  }
  async getExpenseSummaryByCategory(startDate, endDate) {
    try {
      const summary = await db('expenses as e')
        .leftJoin('expense_categories as ec', 'e.category_id', 'ec.id')
        .select('ec.name as category', db.raw('SUM(e.amount) as total'), db.raw('COUNT(*) as count'))
        .whereBetween('e.date', [startDate, endDate])
        .whereNotNull('e.approved_at')
        .whereNull('e.deleted_at')
        .groupBy('e.category_id', 'ec.name')
        .orderBy('total', 'desc');
      return summary;
    } catch (error) {
      logger.error('FinanceRepository.getExpenseSummaryByCategory error:', error.message);
      throw error;
    }
  }
  async getPendingApprovals() {
    try {
      const pending = await db('expenses as e')
        .leftJoin('expense_categories as ec', 'e.category_id', 'ec.id')
        .leftJoin('users as u', 'e.entered_by', 'u.id')
        .select(
          'e.id',
          'e.amount',
          'e.date',
          'e.description',
          'ec.name as category_name',
          'u.full_name as entered_by_name'
        )
        .whereNull('e.approved_at')
        .whereNull('e.deleted_at')
        .orderBy('e.date', 'asc');
      return pending;
    } catch (error) {
      logger.error('FinanceRepository.getPendingApprovals error:', error.message);
      throw error;
    }
  }
  async approveExpense(expenseId, approvedBy) {
    try {
      await this.update(expenseId, {
        approved_by: approvedBy,
        approved_at: db.fn.now(),
        updated_at: db.fn.now()
      });
      return true;
    } catch (error) {
      logger.error('FinanceRepository.approveExpense error:', error.message);
      throw error;
    }
  }
  async rejectExpense(expenseId, rejectedBy, reason) {
    try {
      await this.update(expenseId, {
        approved_by: rejectedBy,
        rejection_reason: reason,
        updated_at: db.fn.now()
      });
      return true;
    } catch (error) {
      logger.error('FinanceRepository.rejectExpense error:', error.message);
      throw error;
    }
  }
  async getExpenseCategories() {
    try {
      const categories = await db('expense_categories')
        .select('id', 'name', 'requires_approval', 'approval_limit')
        .orderBy('name', 'asc');
      return categories;
    } catch (error) {
      logger.error('FinanceRepository.getExpenseCategories error:', error.message);
      throw error;
    }
  }
  async getPaymentMethods() {
    try {
      const methods = await db('payment_methods')
        .select('id', 'name', 'requires_reference', 'is_active')
        .where('is_active', true)
        .orderBy('name', 'asc');
      return methods;
    } catch (error) {
      logger.error('FinanceRepository.getPaymentMethods error:', error.message);
      throw error;
    }
  }
  async getPoPayments(poId) {
    try {
      const payments = await db('po_payments as pp')
        .leftJoin('payment_methods as pm', 'pp.payment_method_id', 'pm.id')
        .leftJoin('payment_statuses as ps', 'pp.status_id', 'ps.id')
        .leftJoin('users as u', 'pp.processed_by', 'u.id')
        .select(
          'pp.*',
          'pm.name as payment_method_name',
          'ps.status_name as status_name',
          'u.full_name as processed_by_name'
        )
        .where('pp.po_id', poId)
        .orderBy('pp.processed_at', 'desc');
      return payments;
    } catch (error) {
      logger.error('FinanceRepository.getPoPayments error:', error.message);
      throw error;
    }
  }
  async getInvoicePayments(saleId) {
    try {
      const payments = await db('invoice_payments as ip')
        .leftJoin('payment_methods as pm', 'ip.payment_method_id', 'pm.id')
        .leftJoin('payment_statuses as ps', 'ip.status_id', 'ps.id')
        .leftJoin('users as u', 'ip.processed_by', 'u.id')
        .select(
          'ip.*',
          'pm.name as payment_method_name',
          'ps.status_name as status_name',
          'u.full_name as processed_by_name'
        )
        .where('ip.sale_id', saleId)
        .orderBy('ip.processed_at', 'desc');
      return payments;
    } catch (error) {
      logger.error('FinanceRepository.getInvoicePayments error:', error.message);
      throw error;
    }
  }
  async recordPoPayment(paymentData) {
    try {
      const [id] = await db('po_payments').insert({
        po_id: paymentData.poId,
        amount: paymentData.amount,
        payment_method_id: paymentData.paymentMethodId,
        reference_number: paymentData.referenceNumber || null,
        status_id: paymentData.statusId,
        processed_by: paymentData.processedBy,
        processed_at: db.fn.now(),
        notes: paymentData.notes || null
      });
      return id;
    } catch (error) {
      logger.error('FinanceRepository.recordPoPayment error:', error.message);
      throw error;
    }
  }
  async recordInvoicePayment(paymentData) {
    try {
      const [id] = await db('invoice_payments').insert({
        sale_id: paymentData.saleId,
        customer_id: paymentData.customerId,
        amount: paymentData.amount,
        payment_method_id: paymentData.paymentMethodId,
        reference_number: paymentData.referenceNumber || null,
        status_id: paymentData.statusId,
        processed_by: paymentData.processedBy,
        processed_at: db.fn.now(),
        notes: paymentData.notes || null
      });
      return id;
    } catch (error) {
      logger.error('FinanceRepository.recordInvoicePayment error:', error.message);
      throw error;
    }
  }
  async getPaymentStatuses() {
    try {
      const statuses = await db('payment_statuses')
        .select('id', 'status_code', 'status_name', 'color_hex', 'sort_order')
        .orderBy('sort_order', 'asc');
      return statuses;
    } catch (error) {
      logger.error('FinanceRepository.getPaymentStatuses error:', error.message);
      throw error;
    }
  }
  async getFinancialDashboardStats() {
    try {
      const startOfMonth = db.raw('DATE_FORMAT(NOW(), "%Y-%m-01")');
      const startOfYear = db.raw('DATE_FORMAT(NOW(), "%Y-01-01")');
      const monthlyExpenses = await this.query()
        .where('created_at', '>=', startOfMonth)
        .whereNotNull('approved_at')
        .sum('amount as total')
        .first();
      const yearlyExpenses = await this.query()
        .where('created_at', '>=', startOfYear)
        .whereNotNull('approved_at')
        .sum('amount as total')
        .first();
      const pendingApprovals = await this.query()
        .whereNull('approved_at')
        .whereNull('deleted_at')
        .count('id as count')
        .first();
      const pendingAmount = await this.query()
        .whereNull('approved_at')
        .whereNull('deleted_at')
        .sum('amount as total')
        .first();
      const expenseByCategory = await this.getExpenseSummaryByCategory(
        db.raw('DATE_SUB(NOW(), INTERVAL 30 DAY)'),
        db.raw('NOW()')
      );
      return {
        monthlyExpenses: parseFloat(monthlyExpenses?.total || 0),
        yearlyExpenses: parseFloat(yearlyExpenses?.total || 0),
        pendingApprovals: parseInt(pendingApprovals?.count || 0),
        pendingApprovalAmount: parseFloat(pendingAmount?.total || 0),
        expenseByCategory
      };
    } catch (error) {
      logger.error('FinanceRepository.getFinancialDashboardStats error:', error.message);
      throw error;
    }
  }
  async createExpenseCategory(name, requiresApproval = false, approvalLimit = null) {
    try {
      const [id] = await db('expense_categories').insert({
        name,
        requires_approval: requiresApproval,
        approval_limit: approvalLimit
      });
      return id;
    } catch (error) {
      logger.error('FinanceRepository.createExpenseCategory error:', error.message);
      throw error;
    }
  }
  async updateExpenseCategory(categoryId, updateData) {
    try {
      await db('expense_categories')
        .where('id', categoryId)
        .update({
          ...updateData,
          updated_at: db.fn.now()
        });
      return true;
    } catch (error) {
      logger.error('FinanceRepository.updateExpenseCategory error:', error.message);
      throw error;
    }
  }
  async deleteExpenseCategory(categoryId) {
    try {
      const hasExpenses = await this.query()
        .where('category_id', categoryId)
        .first();
      if (hasExpenses) {
        throw new Error('Cannot delete category with linked expenses');
      }
      await db('expense_categories')
        .where('id', categoryId)
        .delete();
      return true;
    } catch (error) {
      logger.error('FinanceRepository.deleteExpenseCategory error:', error.message);
      throw error;
    }
  }
}
module.exports = FinanceRepository;
