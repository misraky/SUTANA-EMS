const BaseRepository = require('./base.repository');
const { db } = require('../config/database');
const { logger } = require('../config/logger');
class CustomerRepository extends BaseRepository {
  constructor() {
    super('customers', 'id');
  }
  async findByPhone(phone) {
    try {
      const customer = await this.query()
        .where('phone', phone)
        .whereNull('deleted_at')
        .first();
      return customer || null;
    } catch (error) {
      logger.error('CustomerRepository.findByPhone error:', error.message);
      throw error;
    }
  }
  async findByEmail(email) {
    try {
      const customer = await this.query()
        .where('email', email.toLowerCase())
        .whereNull('deleted_at')
        .first();
      return customer || null;
    } catch (error) {
      logger.error('CustomerRepository.findByEmail error:', error.message);
      throw error;
    }
  }
  async findByUserId(userId) {
    try {
      const customer = await this.query()
        .where('user_id', userId)
        .whereNull('deleted_at')
        .first();
      return customer || null;
    } catch (error) {
      logger.error('CustomerRepository.findByUserId error:', error.message);
      throw error;
    }
  }
  async getCustomerWithDetails(customerId) {
    try {
      const customer = await this.query()
        .leftJoin('customer_types', 'customers.customer_type_id', 'customer_types.id')
        .leftJoin('users', 'customers.created_by', 'users.id')
        .select(
          'customers.*',
          'customer_types.name as customer_type_name',
          'customer_types.color_code as customer_type_color',
          'users.full_name as created_by_name'
        )
        .where('customers.id', customerId)
        .whereNull('customers.deleted_at')
        .first();
      if (customer) {
        const orderCount = await db('printing_orders')
          .where('customer_id', customerId)
          .whereNull('deleted_at')
          .count('id as count')
          .first();
        customer.order_count = parseInt(orderCount?.count || 0);
        const totalSpent = await db('pos_sales')
          .where('customer_id', customerId)
          .where('status', 'Completed')
          .sum('total_amount as total')
          .first();
        customer.total_spent = parseFloat(totalSpent?.total || 0);
        const lastOrder = await db('printing_orders')
          .where('customer_id', customerId)
          .whereNull('deleted_at')
          .orderBy('created_at', 'desc')
          .first();
        customer.last_order_date = lastOrder?.created_at;
      }
      return customer || null;
    } catch (error) {
      logger.error('CustomerRepository.getCustomerWithDetails error:', error.message);
      throw error;
    }
  }
  async findAllWithFilters(options = {}) {
    const {
      page = 1,
      limit = 25,
      search,
      customerTypeId,
      hasBalance = false
    } = options;
    const offset = (page - 1) * limit;
    try {
      let query = this.query()
        .leftJoin('customer_types', 'customers.customer_type_id', 'customer_types.id')
        .select(
          'customers.*',
          'customer_types.name as customer_type_name',
          'customer_types.color_code as customer_type_color',
          db.raw('(SELECT COUNT(*) FROM printing_orders WHERE customer_id = customers.id AND deleted_at IS NULL) as order_count'),
          db.raw('(SELECT SUM(total_amount) FROM pos_sales WHERE customer_id = customers.id AND status = "Completed") as total_spent')
        )
        .whereNull('customers.deleted_at');
      if (search) {
        query = query.where(function() {
          this.where('customers.name', 'like', `%${search}%`)
            .orWhere('customers.phone', 'like', `%${search}%`)
            .orWhere('customers.email', 'like', `%${search}%`);
        });
      }
      if (customerTypeId) {
        query = query.where('customers.customer_type_id', customerTypeId);
      }
      if (hasBalance) {
        query = query.where('customers.current_balance', '>', 0);
      }
      const total = await query.clone().count('customers.id as total').first();
      const customers = await query
        .orderBy('customers.name', 'asc')
        .limit(limit)
        .offset(offset);
      return {
        data: customers,
        pagination: {
          page,
          limit,
          total: parseInt(total?.total || 0),
          totalPages: Math.ceil((total?.total || 0) / limit)
        }
      };
    } catch (error) {
      logger.error('CustomerRepository.findAllWithFilters error:', error.message);
      throw error;
    }
  }
  async updateBalance(customerId, amountChange) {
    try {
      const customer = await this.findById(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }
      const newBalance = customer.current_balance + amountChange;
      await this.update(customerId, {
        current_balance: newBalance,
        updated_at: db.fn.now()
      });
      return {
        previousBalance: customer.current_balance,
        newBalance,
        change: amountChange
      };
    } catch (error) {
      logger.error('CustomerRepository.updateBalance error:', error.message);
      throw error;
    }
  }
  async getCustomersWithBalance(minBalance = 0) {
    try {
      const customers = await this.query()
        .where('current_balance', '>', minBalance)
        .whereNull('deleted_at')
        .orderBy('current_balance', 'desc');
      return customers;
    } catch (error) {
      logger.error('CustomerRepository.getCustomersWithBalance error:', error.message);
      throw error;
    }
  }
  async getCustomerOrders(customerId, options = {}) {
    const { page = 1, limit = 25, status } = options;
    const offset = (page - 1) * limit;
    try {
      let query = db('printing_orders as po')
        .leftJoin('order_statuses as os', 'po.status_id', 'os.id')
        .select(
          'po.*',
          'os.status_name as status_name',
          'os.color_hex as status_color'
        )
        .where('po.customer_id', customerId)
        .whereNull('po.deleted_at');
      if (status) {
        const statusRecord = await db('order_statuses').where('status_code', status).first();
        if (statusRecord) {
          query = query.where('po.status_id', statusRecord.id);
        }
      }
      const total = await query.clone().count('po.id as total').first();
      const orders = await query
        .orderBy('po.created_at', 'desc')
        .limit(limit)
        .offset(offset);
      return {
        data: orders,
        pagination: {
          page,
          limit,
          total: parseInt(total?.total || 0),
          totalPages: Math.ceil((total?.total || 0) / limit)
        }
      };
    } catch (error) {
      logger.error('CustomerRepository.getCustomerOrders error:', error.message);
      throw error;
    }
  }
  async getCustomerPayments(customerId, options = {}) {
    const { page = 1, limit = 25 } = options;
    const offset = (page - 1) * limit;
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
        .where('ip.customer_id', customerId)
        .orderBy('ip.processed_at', 'desc')
        .limit(limit)
        .offset(offset);
      const total = await db('invoice_payments')
        .where('customer_id', customerId)
        .count('id as total')
        .first();
      return {
        data: payments,
        pagination: {
          page,
          limit,
          total: parseInt(total?.total || 0),
          totalPages: Math.ceil((total?.total || 0) / limit)
        }
      };
    } catch (error) {
      logger.error('CustomerRepository.getCustomerPayments error:', error.message);
      throw error;
    }
  }
  async getCustomerInvoices(customerId) {
    try {
      const invoices = await db('pos_sales')
        .select('id', 'invoice_number', 'total_amount', 'amount_paid', 'sale_date')
        .where('customer_id', customerId)
        .where('payment_method', 'Credit')
        .orderBy('sale_date', 'desc');
      const processedInvoices = invoices.map(inv => ({
        ...inv,
        balance: inv.total_amount - (inv.amount_paid || 0),
        status: inv.balance <= 0 ? 'paid' : 
                inv.balance > 0 && new Date(inv.sale_date) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) ? 'overdue' : 'pending'
      }));
      return processedInvoices;
    } catch (error) {
      logger.error('CustomerRepository.getCustomerInvoices error:', error.message);
      throw error;
    }
  }
  async getCustomerStatistics() {
    try {
      const totalCustomers = await this.query()
        .whereNull('deleted_at')
        .count('id as count')
        .first();
      const customersByType = await db('customers as c')
        .leftJoin('customer_types as ct', 'c.customer_type_id', 'ct.id')
        .select('ct.name', 'ct.color_code', db.raw('COUNT(*) as count'))
        .whereNull('c.deleted_at')
        .groupBy('c.customer_type_id', 'ct.name', 'ct.color_code')
        .orderBy('count', 'desc');
      const totalReceivable = await this.query()
        .whereNull('deleted_at')
        .sum('current_balance as total')
        .first();
      const newCustomersThisMonth = await this.query()
        .whereRaw('MONTH(created_at) = MONTH(CURDATE())')
        .whereRaw('YEAR(created_at) = YEAR(CURDATE())')
        .whereNull('deleted_at')
        .count('id as count')
        .first();
      const topCustomers = await db('pos_sales as ps')
        .leftJoin('customers as c', 'ps.customer_id', 'c.id')
        .select('c.id', 'c.name', 'c.phone', 'c.email', db.raw('SUM(ps.total_amount) as total_spent'))
        .whereNotNull('ps.customer_id')
        .where('ps.status', 'Completed')
        .groupBy('ps.customer_id', 'c.id', 'c.name', 'c.phone', 'c.email')
        .orderBy('total_spent', 'desc')
        .limit(10);
      return {
        totalCustomers: parseInt(totalCustomers?.count || 0),
        customersByType,
        totalAccountsReceivable: parseFloat(totalReceivable?.total || 0),
        newCustomersThisMonth: parseInt(newCustomersThisMonth?.count || 0),
        topCustomers
      };
    } catch (error) {
      logger.error('CustomerRepository.getCustomerStatistics error:', error.message);
      throw error;
    }
  }
  async getCustomerWithBalance(customerId) {
    try {
      const customer = await this.findById(customerId);
      if (!customer) return null;
      const unpaidInvoices = await db('pos_sales')
        .where('customer_id', customerId)
        .where('payment_method', 'Credit')
        .whereRaw('total_amount > COALESCE(amount_paid, 0)')
        .select('id', 'invoice_number', 'total_amount', 'amount_paid', 'sale_date');
      const aging = {
        current: 0,
        days30_60: 0,
        days60_90: 0,
        daysOver90: 0
      };
      const now = new Date();
      for (const invoice of unpaidInvoices) {
        const balance = invoice.total_amount - (invoice.amount_paid || 0);
        const daysOverdue = Math.floor((now - new Date(invoice.sale_date)) / (1000 * 60 * 60 * 24));
        if (daysOverdue > 90) aging.daysOver90 += balance;
        else if (daysOverdue > 60) aging.days60_90 += balance;
        else if (daysOverdue > 30) aging.days30_60 += balance;
        else aging.current += balance;
      }
      return {
        ...customer,
        aging,
        unpaidInvoicesCount: unpaidInvoices.length
      };
    } catch (error) {
      logger.error('CustomerRepository.getCustomerWithBalance error:', error.message);
      throw error;
    }
  }
  async searchCustomers(query, limit = 20) {
    try {
      const customers = await this.query()
        .leftJoin('customer_types', 'customers.customer_type_id', 'customer_types.id')
        .select(
          'customers.id',
          'customers.name',
          'customers.phone',
          'customers.email',
          'customer_types.name as customer_type',
          'customers.current_balance'
        )
        .where(function() {
          this.where('customers.name', 'like', `%${query}%`)
            .orWhere('customers.phone', 'like', `%${query}%`)
            .orWhere('customers.email', 'like', `%${query}%`);
        })
        .whereNull('customers.deleted_at')
        .limit(limit)
        .orderBy('customers.name', 'asc');
      return customers;
    } catch (error) {
      logger.error('CustomerRepository.searchCustomers error:', error.message);
      throw error;
    }
  }
  async getAllCustomerTypes() {
    try {
      const types = await db('customer_types')
        .select('id', 'name', 'color_code', 'icon_name', 'sort_order')
        .orderBy('sort_order', 'asc');
      return types;
    } catch (error) {
      logger.error('CustomerRepository.getAllCustomerTypes error:', error.message);
      throw error;
    }
  }
  async exportCustomers(filters = {}) {
    const { search, customerTypeId, hasBalance } = filters;
    try {
      let query = this.query()
        .leftJoin('customer_types', 'customers.customer_type_id', 'customer_types.id')
        .select(
          'customers.id',
          'customers.name',
          'customers.phone',
          'customers.email',
          'customer_types.name as customer_type',
          'customers.address',
          'customers.credit_limit',
          'customers.current_balance',
          'customers.created_at'
        )
        .whereNull('customers.deleted_at');
      if (search) {
        query = query.where(function() {
          this.where('customers.name', 'like', `%${search}%`)
            .orWhere('customers.phone', 'like', `%${search}%`)
            .orWhere('customers.email', 'like', `%${search}%`);
        });
      }
      if (customerTypeId) {
        query = query.where('customers.customer_type_id', customerTypeId);
      }
      if (hasBalance) {
        query = query.where('customers.current_balance', '>', 0);
      }
      const customers = await query.orderBy('customers.name', 'asc');
      return customers;
    } catch (error) {
      logger.error('CustomerRepository.exportCustomers error:', error.message);
      throw error;
    }
  }
}
module.exports = CustomerRepository;
