const BaseRepository = require('./base.repository');
const { db } = require('../config/database');
const { logger } = require('../config/logger');
class PrintingRepository extends BaseRepository {
  constructor() {
    super('printing_orders', 'id');
  }
  async findAllWithDetails(options = {}) {
    const {
      page = 1,
      limit = 25,
      status,
      search,
      startDate,
      endDate
    } = options;
    const offset = (page - 1) * limit;
    try {
      let query = db('printing_orders as po')
        .leftJoin('customers as c', 'po.customer_id', 'c.id')
        .leftJoin('customer_types as ct', 'po.customer_type_id', 'ct.id')
        .leftJoin('order_statuses as os', 'po.status_id', 'os.id')
        .select(
          'po.*',
          'c.name as customer_name',
          'c.phone as customer_phone',
          'c.email as customer_email',
          'ct.name as customer_type_name',
          'ct.color_code as customer_type_color',
          'os.status_name as status_name',
          'os.color_hex as status_color'
        )
        .whereNull('po.deleted_at');
      if (status) {
        const statusRecord = await db('order_statuses')
          .where('status_code', status)
          .first();
        if (statusRecord) {
          query = query.where('po.status_id', statusRecord.id);
        }
      }
      if (search) {
        query = query.where(function() {
          this.where('po.order_number', 'like', `%${search}%`)
            .orWhere('c.name', 'like', `%${search}%`)
            .orWhere('c.phone', 'like', `%${search}%`);
        });
      }
      if (startDate && endDate) {
        query = query.whereBetween('po.created_at', [startDate, endDate]);
      }
      const countQuery = query.clone();
      const total = await countQuery.count('po.id as total').first();
      const orders = await query
        .orderBy('po.due_date', 'asc')
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
      logger.error('PrintingRepository.findAllWithDetails error:', error.message);
      throw error;
    }
  }
  async getPendingOrders() {
    try {
      const deliveredStatus = await db('order_statuses')
        .where('status_code', 'delivered')
        .first();
      const orders = await db('printing_orders as po')
        .leftJoin('customers as c', 'po.customer_id', 'c.id')
        .leftJoin('order_statuses as os', 'po.status_id', 'os.id')
        .select(
          'po.id',
          'po.order_number',
          'c.name as customer_name',
          'po.due_date',
          'po.status_id',
          'os.status_name as status_name',
          'os.color_hex as status_color',
          db.raw('DATEDIFF(po.due_date, CURDATE()) as days_remaining'),
          db.raw('DATEDIFF(CURDATE(), po.created_at) as days_pending')
        )
        .whereNot('po.status_id', deliveredStatus?.id)
        .whereNull('po.deleted_at')
        .orderBy('po.due_date', 'asc')
        .limit(50);
      return orders;
    } catch (error) {
      logger.error('PrintingRepository.getPendingOrders error:', error.message);
      throw error;
    }
  }
  async getOrderWithDetails(orderId) {
    try {
      const order = await db('printing_orders as po')
        .leftJoin('customers as c', 'po.customer_id', 'c.id')
        .leftJoin('customer_types as ct', 'po.customer_type_id', 'ct.id')
        .leftJoin('order_statuses as os', 'po.status_id', 'os.id')
        .leftJoin('users as u', 'po.created_by', 'u.id')
        .select(
          'po.*',
          'c.name as customer_name',
          'c.phone as customer_phone',
          'c.email as customer_email',
          'ct.name as customer_type_name',
          'ct.color_code as customer_type_color',
          'os.status_name as status_name',
          'os.color_hex as status_color',
          'u.full_name as created_by_name'
        )
        .where('po.id', orderId)
        .whereNull('po.deleted_at')
        .first();
      if (order && order.attachments && typeof order.attachments === 'string') {
        order.attachments = JSON.parse(order.attachments);
      }
      return order || null;
    } catch (error) {
      logger.error('PrintingRepository.getOrderWithDetails error:', error.message);
      throw error;
    }
  }
  async findByOrderNumber(orderNumber) {
    try {
      const order = await this.query()
        .where('order_number', orderNumber)
        .whereNull('deleted_at')
        .first();
      return order || null;
    } catch (error) {
      logger.error('PrintingRepository.findByOrderNumber error:', error.message);
      throw error;
    }
  }
  async findByCustomer(customerId, options = {}) {
    const { page = 1, limit = 25 } = options;
    const offset = (page - 1) * limit;
    try {
      const query = this.query()
        .leftJoin('order_statuses as os', 'printing_orders.status_id', 'os.id')
        .select(
          'printing_orders.*',
          'os.status_name as status_name',
          'os.color_hex as status_color'
        )
        .where('customer_id', customerId)
        .whereNull('printing_orders.deleted_at');
      const countQuery = query.clone();
      const total = await countQuery.count('id as total').first();
      const orders = await query
        .orderBy('created_at', 'desc')
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
      logger.error('PrintingRepository.findByCustomer error:', error.message);
      throw error;
    }
  }
  async updateStatus(orderId, statusCode, reason = null) {
    try {
      const statusRecord = await db('order_statuses')
        .where('status_code', statusCode)
        .first();
      if (!statusRecord) {
        throw new Error(`Invalid status code: ${statusCode}`);
      }
      await this.update(orderId, {
        status_id: statusRecord.id,
        updated_at: db.fn.now()
      });
      return true;
    } catch (error) {
      logger.error('PrintingRepository.updateStatus error:', error.message);
      throw error;
    }
  }
  async addStatusHistory(historyData) {
    try {
      const [id] = await db('order_status_history').insert({
        order_id: historyData.orderId,
        from_status: historyData.fromStatus,
        to_status: historyData.toStatus,
        note: historyData.note,
        changed_by: historyData.changedBy,
        ip_address: historyData.ipAddress,
        changed_at: db.fn.now()
      });
      return id;
    } catch (error) {
      logger.error('PrintingRepository.addStatusHistory error:', error.message);
      throw error;
    }
  }
  async getStatusHistory(orderId) {
    try {
      const history = await db('order_status_history as osh')
        .leftJoin('users as u', 'osh.changed_by', 'u.id')
        .select(
          'osh.*',
          'u.full_name as changed_by_name'
        )
        .where('osh.order_id', orderId)
        .orderBy('osh.changed_at', 'desc');
      return history;
    } catch (error) {
      logger.error('PrintingRepository.getStatusHistory error:', error.message);
      throw error;
    }
  }
  async getOrdersByDateRange(startDate, endDate) {
    try {
      const orders = await this.query()
        .whereBetween('created_at', [startDate, endDate])
        .whereNull('deleted_at')
        .orderBy('created_at', 'desc');
      return orders;
    } catch (error) {
      logger.error('PrintingRepository.getOrdersByDateRange error:', error.message);
      throw error;
    }
  }
  async getOrdersDueBy(dueDate) {
    try {
      const orders = await this.query()
        .leftJoin('order_statuses', 'printing_orders.status_id', 'order_statuses.id')
        .select('printing_orders.*', 'order_statuses.status_name')
        .where('due_date', '<=', dueDate)
        .whereNot('order_statuses.status_code', 'delivered')
        .whereNull('printing_orders.deleted_at')
        .orderBy('due_date', 'asc');
      return orders;
    } catch (error) {
      logger.error('PrintingRepository.getOrdersDueBy error:', error.message);
      throw error;
    }
  }
  async getOrderStatisticsByStatus() {
    try {
      const stats = await db('printing_orders as po')
        .leftJoin('order_statuses as os', 'po.status_id', 'os.id')
        .select('os.status_name', 'os.status_code', 'os.color_hex', db.raw('COUNT(*) as count'))
        .whereNull('po.deleted_at')
        .groupBy('po.status_id', 'os.status_name', 'os.status_code', 'os.color_hex');
      return stats;
    } catch (error) {
      logger.error('PrintingRepository.getOrderStatisticsByStatus error:', error.message);
      throw error;
    }
  }
  async getMonthlyRevenue(months = 6) {
    try {
      const revenue = await this.query()
        .select(
          db.raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
          db.raw('SUM(total_price) as revenue'),
          db.raw('COUNT(*) as order_count')
        )
        .whereNull('deleted_at')
        .groupBy(db.raw('DATE_FORMAT(created_at, "%Y-%m")'))
        .orderBy('month', 'desc')
        .limit(months);
      return revenue;
    } catch (error) {
      logger.error('PrintingRepository.getMonthlyRevenue error:', error.message);
      throw error;
    }
  }
  async getOrdersByCustomerType() {
    try {
      const breakdown = await db('printing_orders as po')
        .leftJoin('customer_types as ct', 'po.customer_type_id', 'ct.id')
        .select('ct.name', 'ct.color_code', db.raw('COUNT(*) as count'), db.raw('SUM(po.total_price) as total_revenue'))
        .whereNull('po.deleted_at')
        .groupBy('po.customer_type_id', 'ct.name', 'ct.color_code')
        .orderBy('count', 'desc');
      return breakdown;
    } catch (error) {
      logger.error('PrintingRepository.getOrdersByCustomerType error:', error.message);
      throw error;
    }
  }
  async getTaxReceiptByOrderId(orderId) {
    try {
      const receipt = await db('tax_receipts')
        .where('order_id', orderId)
        .whereNull('deleted_at')
        .first();
      return receipt || null;
    } catch (error) {
      logger.error('PrintingRepository.getTaxReceiptByOrderId error:', error.message);
      throw error;
    }
  }
  async upsertTaxReceipt(receiptData) {
    try {
      const existing = await this.getTaxReceiptByOrderId(receiptData.orderId);
      if (existing) {
        await db('tax_receipts')
          .where('id', existing.id)
          .update({
            used_count: receiptData.usedCount,
            remaining: receiptData.remaining,
            printed_by: receiptData.printedBy,
            ip_address: receiptData.ipAddress,
            printed_at: db.fn.now()
          });
        return existing.id;
      } else {
        const [id] = await db('tax_receipts').insert({
          serial_number: receiptData.serialNumber,
          order_id: receiptData.orderId,
          customer_name: receiptData.customerName,
          customer_type_id: receiptData.customerTypeId,
          approval_amount_total: receiptData.approvalAmountTotal,
          used_count: receiptData.usedCount || 0,
          remaining: receiptData.approvalAmountTotal,
          approved_date: receiptData.approvedDate,
          approval_document: receiptData.approvalDocument,
          printed_by: receiptData.printedBy,
          ip_address: receiptData.ipAddress,
          printed_at: db.fn.now()
        });
        return id;
      }
    } catch (error) {
      logger.error('PrintingRepository.upsertTaxReceipt error:', error.message);
      throw error;
    }
  }
  async getAllTaxReceipts(options = {}) {
    const { page = 1, limit = 25, startDate, endDate } = options;
    const offset = (page - 1) * limit;
    try {
      let query = db('tax_receipts as tr')
        .leftJoin('printing_orders as po', 'tr.order_id', 'po.id')
        .leftJoin('customers as c', 'po.customer_id', 'c.id')
        .leftJoin('customer_types as ct', 'tr.customer_type_id', 'ct.id')
        .leftJoin('users as u', 'tr.printed_by', 'u.id')
        .select(
          'tr.*',
          'po.order_number',
          'c.name as customer_name',
          'c.phone as customer_phone',
          'ct.name as customer_type_name',
          'u.full_name as printed_by_name'
        )
        .whereNull('tr.deleted_at');
      if (startDate && endDate) {
        query = query.whereBetween('tr.printed_at', [startDate, endDate]);
      }
      const countQuery = query.clone();
      const total = await countQuery.count('tr.id as total').first();
      const receipts = await query
        .orderBy('tr.printed_at', 'desc')
        .limit(limit)
        .offset(offset);
      return {
        data: receipts,
        pagination: {
          page,
          limit,
          total: parseInt(total?.total || 0),
          totalPages: Math.ceil((total?.total || 0) / limit)
        }
      };
    } catch (error) {
      logger.error('PrintingRepository.getAllTaxReceipts error:', error.message);
      throw error;
    }
  }
  async getDashboardStatistics() {
    try {
      const deliveredStatus = await db('order_statuses')
        .where('status_code', 'delivered')
        .first();
      const pendingCount = await this.query()
        .whereNot('status_id', deliveredStatus?.id)
        .whereNull('deleted_at')
        .count('id as count')
        .first();
      const pastDueCount = await this.query()
        .where('due_date', '<', db.fn.now())
        .whereNot('status_id', deliveredStatus?.id)
        .whereNull('deleted_at')
        .count('id as count')
        .first();
      const totalRevenue = await this.query()
        .sum('total_price as total')
        .first();
      const thisMonthRevenue = await this.query()
        .whereRaw('MONTH(created_at) = MONTH(CURDATE())')
        .whereRaw('YEAR(created_at) = YEAR(CURDATE())')
        .sum('total_price as total')
        .first();
      return {
        pendingOrders: parseInt(pendingCount?.count || 0),
        pastDueOrders: parseInt(pastDueCount?.count || 0),
        totalRevenue: parseFloat(totalRevenue?.total || 0),
        thisMonthRevenue: parseFloat(thisMonthRevenue?.total || 0)
      };
    } catch (error) {
      logger.error('PrintingRepository.getDashboardStatistics error:', error.message);
      throw error;
    }
  }
}
module.exports = PrintingRepository;
