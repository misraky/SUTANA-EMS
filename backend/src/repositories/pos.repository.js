const BaseRepository = require('./base.repository');
const { db } = require('../config/database');
const { logger } = require('../config/logger');
class PosRepository extends BaseRepository {
  constructor() {
    super('pos_sales', 'id');
  }
  async findByInvoiceNumber(invoiceNumber) {
    try {
      const sale = await this.query()
        .where('invoice_number', invoiceNumber)
        .first();
      return sale || null;
    } catch (error) {
      logger.error('PosRepository.findByInvoiceNumber error:', error.message);
      throw error;
    }
  }
  async getSaleWithDetails(saleId) {
    try {
      const sale = await db('pos_sales as ps')
        .leftJoin('customers as c', 'ps.customer_id', 'c.id')
        .leftJoin('users as u', 'ps.cashier_id', 'u.id')
        .leftJoin('sale_statuses as ss', 'ps.status_id', 'ss.id')
        .leftJoin('payment_methods as pm', 'ps.payment_method_id', 'pm.id')
        .select(
          'ps.*',
          'c.name as customer_name',
          'c.phone as customer_phone',
          'c.email as customer_email',
          'u.full_name as cashier_name',
          'ss.status_name as status_name',
          'ss.color_hex as status_color',
          'pm.name as payment_method_name'
        )
        .where('ps.id', saleId)
        .first();
      if (sale) {
        const items = await db('pos_items as pi')
          .leftJoin('products as p', 'pi.product_id', 'p.id')
          .select(
            'pi.*',
            'p.name as product_name',
            'p.sku'
          )
          .where('pi.sale_id', saleId);
        sale.items = items;
      }
      return sale || null;
    } catch (error) {
      logger.error('PosRepository.getSaleWithDetails error:', error.message);
      throw error;
    }
  }
  async findAllWithFilters(options = {}) {
    const {
      page = 1,
      limit = 25,
      customerId,
      cashierId,
      startDate,
      endDate,
      status
    } = options;
    const offset = (page - 1) * limit;
    try {
      let query = db('pos_sales as ps')
        .leftJoin('customers as c', 'ps.customer_id', 'c.id')
        .leftJoin('users as u', 'ps.cashier_id', 'u.id')
        .leftJoin('sale_statuses as ss', 'ps.status_id', 'ss.id')
        .select(
          'ps.id',
          'ps.invoice_number',
          'c.name as customer_name',
          'ps.total_amount',
          'ps.subtotal',
          'ps.tax_amount',
          'ps.discount_amount',
          'ps.payment_method_id',
          'ps.sale_date',
          'ss.status_name as status',
          'ss.color_hex as status_color',
          'u.full_name as cashier_name'
        );
      if (customerId) {
        query = query.where('ps.customer_id', customerId);
      }
      if (cashierId) {
        query = query.where('ps.cashier_id', cashierId);
      }
      if (startDate && endDate) {
        query = query.whereBetween('ps.sale_date', [startDate, endDate]);
      }
      if (status) {
        const statusRecord = await db('sale_statuses').where('status_code', status).first();
        if (statusRecord) {
          query = query.where('ps.status_id', statusRecord.id);
        }
      }
      const total = await query.clone().count('ps.id as total').first();
      const sales = await query
        .orderBy('ps.sale_date', 'desc')
        .limit(limit)
        .offset(offset);
      return {
        data: sales,
        pagination: {
          page,
          limit,
          total: parseInt(total?.total || 0),
          totalPages: Math.ceil((total?.total || 0) / limit)
        }
      };
    } catch (error) {
      logger.error('PosRepository.findAllWithFilters error:', error.message);
      throw error;
    }
  }
  async getDailySalesSummary(date) {
    try {
      const summary = await db('pos_sales')
        .whereDate('sale_date', date)
        .where('status', 'Completed')
        .select(
          db.raw('COUNT(*) as total_transactions'),
          db.raw('SUM(total_amount) as total_revenue'),
          db.raw('AVG(total_amount) as average_transaction'),
          db.raw('SUM(tax_amount) as total_tax'),
          db.raw('SUM(discount_amount) as total_discount'),
          db.raw('MAX(total_amount) as max_transaction'),
          db.raw('MIN(total_amount) as min_transaction')
        )
        .first();
      const paymentBreakdown = await db('pos_sales as ps')
        .leftJoin('payment_methods as pm', 'ps.payment_method_id', 'pm.id')
        .whereDate('sale_date', date)
        .where('ps.status', 'Completed')
        .select('pm.name as method', db.raw('COUNT(*) as count'), db.raw('SUM(ps.total_amount) as amount'))
        .groupBy('ps.payment_method_id', 'pm.name');
      const hourlyBreakdown = await db('pos_sales')
        .whereDate('sale_date', date)
        .where('status', 'Completed')
        .select(
          db.raw('HOUR(sale_date) as hour'),
          db.raw('COUNT(*) as count'),
          db.raw('SUM(total_amount) as amount')
        )
        .groupByRaw('HOUR(sale_date)')
        .orderBy('hour', 'asc');
      return {
        summary: {
          totalTransactions: parseInt(summary?.total_transactions || 0),
          totalRevenue: parseFloat(summary?.total_revenue || 0),
          averageTransaction: parseFloat(summary?.average_transaction || 0),
          totalTax: parseFloat(summary?.total_tax || 0),
          totalDiscount: parseFloat(summary?.total_discount || 0),
          maxTransaction: parseFloat(summary?.max_transaction || 0),
          minTransaction: parseFloat(summary?.min_transaction || 0)
        },
        paymentBreakdown,
        hourlyBreakdown
      };
    } catch (error) {
      logger.error('PosRepository.getDailySalesSummary error:', error.message);
      throw error;
    }
  }
  async getSalesByDateRange(startDate, endDate, groupBy = 'day') {
    try {
      let dateFormat;
      switch (groupBy) {
        case 'day':
          dateFormat = '%Y-%m-%d';
          break;
        case 'week':
          dateFormat = '%Y-%u';
          break;
        case 'month':
          dateFormat = '%Y-%m';
          break;
        default:
          dateFormat = '%Y-%m-%d';
      }
      const sales = await db('pos_sales')
        .select(
          db.raw(`DATE_FORMAT(sale_date, '${dateFormat}') as period`),
          db.raw('COUNT(*) as transaction_count'),
          db.raw('SUM(total_amount) as total_revenue'),
          db.raw('AVG(total_amount) as average_value'),
          db.raw('SUM(tax_amount) as total_tax'),
          db.raw('SUM(discount_amount) as total_discount')
        )
        .whereBetween('sale_date', [startDate, endDate])
        .where('status', 'Completed')
        .groupByRaw(`DATE_FORMAT(sale_date, '${dateFormat}')`)
        .orderBy('period', 'asc');
      return sales;
    } catch (error) {
      logger.error('PosRepository.getSalesByDateRange error:', error.message);
      throw error;
    }
  }
  async getSalesByCustomer(customerId, options = {}) {
    const { page = 1, limit = 25 } = options;
    const offset = (page - 1) * limit;
    try {
      const query = this.query()
        .where('customer_id', customerId)
        .where('status', 'Completed')
        .orderBy('sale_date', 'desc');
      const total = await query.clone().count('id as total').first();
      const sales = await query.limit(limit).offset(offset);
      const customerSummary = await this.query()
        .where('customer_id', customerId)
        .where('status', 'Completed')
        .select(
          db.raw('COUNT(*) as total_orders'),
          db.raw('SUM(total_amount) as total_spent'),
          db.raw('AVG(total_amount) as average_order_value'),
          db.raw('MAX(sale_date) as last_purchase_date')
        )
        .first();
      return {
        data: sales,
        customerSummary,
        pagination: {
          page,
          limit,
          total: parseInt(total?.total || 0),
          totalPages: Math.ceil((total?.total || 0) / limit)
        }
      };
    } catch (error) {
      logger.error('PosRepository.getSalesByCustomer error:', error.message);
      throw error;
    }
  }
  async getTopSellingProducts(limit = 10, startDate = null, endDate = null) {
    try {
      let query = db('pos_items as pi')
        .leftJoin('products as p', 'pi.product_id', 'p.id')
        .leftJoin('pos_sales as ps', 'pi.sale_id', 'ps.id')
        .select(
          'p.id',
          'p.name',
          'p.sku',
          db.raw('SUM(pi.quantity) as total_quantity'),
          db.raw('SUM(pi.total) as total_revenue'),
          db.raw('COUNT(DISTINCT pi.sale_id) as order_count')
        )
        .where('ps.status', 'Completed')
        .groupBy('pi.product_id', 'p.id', 'p.name', 'p.sku')
        .orderBy('total_revenue', 'desc')
        .limit(limit);
      if (startDate && endDate) {
        query = query.whereBetween('ps.sale_date', [startDate, endDate]);
      }
      const products = await query;
      return products;
    } catch (error) {
      logger.error('PosRepository.getTopSellingProducts error:', error.message);
      throw error;
    }
  }
  async getSalesStatistics(days = 30) {
    try {
      const startDate = db.raw(`DATE_SUB(NOW(), INTERVAL ${days} DAY)`);
      const stats = await this.query()
        .where('created_at', '>=', startDate)
        .where('status', 'Completed')
        .select(
          db.raw('COUNT(*) as total_transactions'),
          db.raw('SUM(total_amount) as total_revenue'),
          db.raw('AVG(total_amount) as average_transaction'),
          db.raw('SUM(tax_amount) as total_tax'),
          db.raw('SUM(discount_amount) as total_discount')
        )
        .first();
      const today = await this.getDailySalesSummary(new Date().toISOString().split('T')[0]);
      const yesterday = await this.getDailySalesSummary(
        new Date(Date.now() - 86400000).toISOString().split('T')[0]
      );
      const dailyTrend = await this.getSalesByDateRange(
        db.raw(`DATE_SUB(NOW(), INTERVAL ${days} DAY)`),
        db.raw('NOW()'),
        'day'
      );
      return {
        period: `${days} days`,
        total: {
          transactions: parseInt(stats?.total_transactions || 0),
          revenue: parseFloat(stats?.total_revenue || 0),
          averageTransaction: parseFloat(stats?.average_transaction || 0),
          tax: parseFloat(stats?.total_tax || 0),
          discount: parseFloat(stats?.total_discount || 0)
        },
        today: today.summary,
        yesterday: yesterday.summary,
        dailyTrend
      };
    } catch (error) {
      logger.error('PosRepository.getSalesStatistics error:', error.message);
      throw error;
    }
  }
  async voidSale(saleId, voidedBy, reason) {
    try {
      const voidedStatus = await db('sale_statuses')
        .where('status_code', 'voided')
        .first();
      await this.update(saleId, {
        status_id: voidedStatus.id,
        voided_by: voidedBy,
        void_reason: reason,
        updated_at: db.fn.now()
      });
      return true;
    } catch (error) {
      logger.error('PosRepository.voidSale error:', error.message);
      throw error;
    }
  }
  async getSaleItems(saleId) {
    try {
      const items = await db('pos_items')
        .where('sale_id', saleId);
      return items;
    } catch (error) {
      logger.error('PosRepository.getSaleItems error:', error.message);
      throw error;
    }
  }
  async getSalesByPaymentMethod(startDate, endDate) {
    try {
      const sales = await db('pos_sales as ps')
        .leftJoin('payment_methods as pm', 'ps.payment_method_id', 'pm.id')
        .select('pm.name as method', db.raw('COUNT(*) as count'), db.raw('SUM(ps.total_amount) as amount'))
        .whereBetween('ps.sale_date', [startDate, endDate])
        .where('ps.status', 'Completed')
        .groupBy('ps.payment_method_id', 'pm.name')
        .orderBy('amount', 'desc');
      return sales;
    } catch (error) {
      logger.error('PosRepository.getSalesByPaymentMethod error:', error.message);
      throw error;
    }
  }
  async getSalesByCashier(cashierId, startDate, endDate) {
    try {
      const sales = await this.query()
        .where('cashier_id', cashierId)
        .whereBetween('sale_date', [startDate, endDate])
        .where('status', 'Completed')
        .select(
          db.raw('COUNT(*) as transaction_count'),
          db.raw('SUM(total_amount) as total_revenue'),
          db.raw('AVG(total_amount) as average_transaction')
        )
        .first();
      return {
        transactionCount: parseInt(sales?.transaction_count || 0),
        totalRevenue: parseFloat(sales?.total_revenue || 0),
        averageTransaction: parseFloat(sales?.average_transaction || 0)
      };
    } catch (error) {
      logger.error('PosRepository.getSalesByCashier error:', error.message);
      throw error;
    }
  }
  async getTodayVsYesterday() {
    try {
      const today = await this.getDailySalesSummary(new Date().toISOString().split('T')[0]);
      const yesterday = await this.getDailySalesSummary(
        new Date(Date.now() - 86400000).toISOString().split('T')[0]
      );
      const revenueChange = yesterday.summary.totalRevenue > 0
        ? ((today.summary.totalRevenue - yesterday.summary.totalRevenue) / yesterday.summary.totalRevenue) * 100
        : 0;
      const transactionsChange = yesterday.summary.totalTransactions > 0
        ? ((today.summary.totalTransactions - yesterday.summary.totalTransactions) / yesterday.summary.totalTransactions) * 100
        : 0;
      return {
        today: today.summary,
        yesterday: yesterday.summary,
        changes: {
          revenue: {
            absolute: today.summary.totalRevenue - yesterday.summary.totalRevenue,
            percentage: revenueChange.toFixed(1)
          },
          transactions: {
            absolute: today.summary.totalTransactions - yesterday.summary.totalTransactions,
            percentage: transactionsChange.toFixed(1)
          }
        }
      };
    } catch (error) {
      logger.error('PosRepository.getTodayVsYesterday error:', error.message);
      throw error;
    }
  }
  async getCustomerPurchaseSummary(customerId) {
    try {
      const summary = await this.query()
        .where('customer_id', customerId)
        .where('status', 'Completed')
        .select(
          db.raw('COUNT(*) as total_orders'),
          db.raw('SUM(total_amount) as total_spent'),
          db.raw('AVG(total_amount) as average_order'),
          db.raw('MAX(sale_date) as last_purchase'),
          db.raw('MIN(sale_date) as first_purchase')
        )
        .first();
      return {
        totalOrders: parseInt(summary?.total_orders || 0),
        totalSpent: parseFloat(summary?.total_spent || 0),
        averageOrder: parseFloat(summary?.average_order || 0),
        lastPurchase: summary?.last_purchase,
        firstPurchase: summary?.first_purchase
      };
    } catch (error) {
      logger.error('PosRepository.getCustomerPurchaseSummary error:', error.message);
      throw error;
    }
  }
}
module.exports = PosRepository;
