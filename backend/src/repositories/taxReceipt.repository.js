const BaseRepository = require('./base.repository');
const { db } = require('../config/database');
const { logger } = require('../config/logger');
class TaxReceiptRepository extends BaseRepository {
  constructor() {
    super('tax_receipts', 'id');
  }
  async findBySerialNumber(serialNumber) {
    try {
      const receipt = await this.query()
        .where('serial_number', serialNumber)
        .whereNull('deleted_at')
        .first();
      return receipt || null;
    } catch (error) {
      logger.error('TaxReceiptRepository.findBySerialNumber error:', error.message);
      throw error;
    }
  }
  async findByOrderId(orderId) {
    try {
      const receipt = await this.query()
        .where('order_id', orderId)
        .whereNull('deleted_at')
        .first();
      return receipt || null;
    } catch (error) {
      logger.error('TaxReceiptRepository.findByOrderId error:', error.message);
      throw error;
    }
  }
  async getReceiptWithDetails(receiptId) {
    try {
      const receipt = await db('tax_receipts as tr')
        .leftJoin('printing_orders as po', 'tr.order_id', 'po.id')
        .leftJoin('customers as c', 'po.customer_id', 'c.id')
        .leftJoin('customer_types as ct', 'tr.customer_type_id', 'ct.id')
        .leftJoin('users as u', 'tr.printed_by', 'u.id')
        .select(
          'tr.*',
          'po.order_number',
          'po.product_type as order_product_type',
          'po.quantity as order_quantity',
          'c.name as customer_name',
          'c.phone as customer_phone',
          'c.email as customer_email',
          'c.tax_id as customer_tax_id',
          'ct.name as customer_type_name',
          'ct.color_code as customer_type_color',
          'u.full_name as printed_by_name'
        )
        .where('tr.id', receiptId)
        .whereNull('tr.deleted_at')
        .first();
      return receipt || null;
    } catch (error) {
      logger.error('TaxReceiptRepository.getReceiptWithDetails error:', error.message);
      throw error;
    }
  }
  async findAllWithFilters(options = {}) {
    const {
      page = 1,
      limit = 25,
      startDate,
      endDate,
      customerTypeId
    } = options;
    const offset = (page - 1) * limit;
    try {
      let query = db('tax_receipts as tr')
        .leftJoin('printing_orders as po', 'tr.order_id', 'po.id')
        .leftJoin('customers as c', 'po.customer_id', 'c.id')
        .leftJoin('customer_types as ct', 'tr.customer_type_id', 'ct.id')
        .leftJoin('users as u', 'tr.printed_by', 'u.id')
        .select(
          'tr.id',
          'tr.serial_number',
          'po.order_number',
          'c.name as customer_name',
          'ct.name as customer_type_name',
          'tr.approval_amount_total',
          'tr.used_count',
          'tr.remaining',
          'tr.approved_date',
          'tr.printed_at',
          'u.full_name as printed_by_name'
        )
        .whereNull('tr.deleted_at');
      if (startDate && endDate) {
        query = query.whereBetween('tr.printed_at', [startDate, endDate]);
      }
      if (customerTypeId) {
        query = query.where('tr.customer_type_id', customerTypeId);
      }
      const total = await query.clone().count('tr.id as total').first();
      const receipts = await query
        .orderBy('tr.printed_at', 'desc')
        .limit(limit)
        .offset(offset);
      const summary = await db('tax_receipts')
        .where(function() {
          if (startDate && endDate) {
            this.whereBetween('printed_at', [startDate, endDate]);
          }
          if (customerTypeId) {
            this.where('customer_type_id', customerTypeId);
          }
        })
        .whereNull('deleted_at')
        .select(
          db.raw('COUNT(*) as total_receipts'),
          db.raw('SUM(approval_amount_total) as total_approved_quantity'),
          db.raw('SUM(used_count) as total_used'),
          db.raw('SUM(remaining) as total_remaining')
        )
        .first();
      return {
        data: receipts,
        summary: {
          totalReceipts: parseInt(summary?.total_receipts || 0),
          totalApprovedQuantity: parseInt(summary?.total_approved_quantity || 0),
          totalUsed: parseInt(summary?.total_used || 0),
          totalRemaining: parseInt(summary?.total_remaining || 0)
        },
        pagination: {
          page,
          limit,
          total: parseInt(total?.total || 0),
          totalPages: Math.ceil((total?.total || 0) / limit)
        }
      };
    } catch (error) {
      logger.error('TaxReceiptRepository.findAllWithFilters error:', error.message);
      throw error;
    }
  }
  async createReceipt(receiptData) {
    try {
      const [id] = await this.query().insert({
        serial_number: receiptData.serialNumber,
        order_id: receiptData.orderId,
        customer_name: receiptData.customerName,
        customer_type_id: receiptData.customerTypeId,
        approval_amount_total: receiptData.approvalAmountTotal,
        used_count: receiptData.usedCount || 0,
        remaining: receiptData.approvalAmountTotal,
        approved_date: receiptData.approvedDate,
        approval_document: receiptData.approvalDocument || null,
        printed_by: receiptData.printedBy,
        ip_address: receiptData.ipAddress,
        printed_at: db.fn.now()
      });
      return id;
    } catch (error) {
      logger.error('TaxReceiptRepository.createReceipt error:', error.message);
      throw error;
    }
  }
  async incrementUsage(receiptId, printedBy, ipAddress) {
    try {
      const receipt = await this.findById(receiptId);
      if (!receipt) {
        throw new Error('Receipt not found');
      }
      if (receipt.remaining <= 0) {
        throw new Error('No remaining allowance for this tax receipt');
      }
      await this.update(receiptId, {
        used_count: receipt.used_count + 1,
        remaining: receipt.remaining - 1,
        printed_by: printedBy,
        ip_address: ipAddress,
        printed_at: db.fn.now(),
        updated_at: db.fn.now()
      });
      return true;
    } catch (error) {
      logger.error('TaxReceiptRepository.incrementUsage error:', error.message);
      throw error;
    }
  }
  async getRemainingAllowance(orderId) {
    try {
      const receipt = await this.findByOrderId(orderId);
      if (!receipt) {
        return {
          exists: false,
          remaining: 0,
          usedCount: 0,
          totalApproved: 0
        };
      }
      return {
        exists: true,
        receiptId: receipt.id,
        serialNumber: receipt.serial_number,
        totalApproved: receipt.approval_amount_total,
        usedCount: receipt.used_count,
        remaining: receipt.remaining,
        canPrintMore: receipt.remaining > 0
      };
    } catch (error) {
      logger.error('TaxReceiptRepository.getRemainingAllowance error:', error.message);
      throw error;
    }
  }
  async getUsageSummary(startDate, endDate) {
    try {
      const summary = await this.query()
        .whereBetween('printed_at', [startDate, endDate])
        .whereNull('deleted_at')
        .select(
          db.raw('COUNT(*) as total_receipts'),
          db.raw('SUM(approval_amount_total) as total_approved'),
          db.raw('SUM(used_count) as total_used'),
          db.raw('SUM(remaining) as total_remaining'),
          db.raw('AVG(used_count) as avg_usage')
        )
        .first();
      const byCustomerType = await db('tax_receipts as tr')
        .leftJoin('customer_types as ct', 'tr.customer_type_id', 'ct.id')
        .whereBetween('tr.printed_at', [startDate, endDate])
        .whereNull('tr.deleted_at')
        .select(
          'ct.name as customer_type',
          db.raw('COUNT(*) as receipt_count'),
          db.raw('SUM(tr.approval_amount_total) as total_approved'),
          db.raw('SUM(tr.used_count) as total_used')
        )
        .groupBy('tr.customer_type_id', 'ct.name')
        .orderBy('total_used', 'desc');
      const monthlyTrend = await this.query()
        .select(
          db.raw('DATE_FORMAT(printed_at, "%Y-%m") as month'),
          db.raw('COUNT(*) as receipt_count'),
          db.raw('SUM(used_count) as total_used')
        )
        .whereBetween('printed_at', [startDate, endDate])
        .whereNull('deleted_at')
        .groupByRaw('DATE_FORMAT(printed_at, "%Y-%m")')
        .orderBy('month', 'asc');
      return {
        summary: {
          totalReceipts: parseInt(summary?.total_receipts || 0),
          totalApprovedQuantity: parseInt(summary?.total_approved || 0),
          totalUsed: parseInt(summary?.total_used || 0),
          totalRemaining: parseInt(summary?.total_remaining || 0),
          averageUsage: parseFloat(summary?.avg_usage || 0)
        },
        byCustomerType,
        monthlyTrend
      };
    } catch (error) {
      logger.error('TaxReceiptRepository.getUsageSummary error:', error.message);
      throw error;
    }
  }
  async getByCustomerType(customerTypeId, options = {}) {
    const { page = 1, limit = 25 } = options;
    const offset = (page - 1) * limit;
    try {
      const query = this.query()
        .where('customer_type_id', customerTypeId)
        .whereNull('deleted_at')
        .orderBy('printed_at', 'desc');
      const total = await query.clone().count('id as total').first();
      const receipts = await query.limit(limit).offset(offset);
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
      logger.error('TaxReceiptRepository.getByCustomerType error:', error.message);
      throw error;
    }
  }
  async getByDateRange(startDate, endDate) {
    try {
      const receipts = await this.query()
        .whereBetween('printed_at', [startDate, endDate])
        .whereNull('deleted_at')
        .orderBy('printed_at', 'desc');
      return receipts;
    } catch (error) {
      logger.error('TaxReceiptRepository.getByDateRange error:', error.message);
      throw error;
    }
  }
  async getDashboardStats() {
    try {
      const totalStats = await this.query()
        .whereNull('deleted_at')
        .select(
          db.raw('COUNT(*) as total_receipts'),
          db.raw('SUM(approval_amount_total) as total_approved'),
          db.raw('SUM(used_count) as total_used'),
          db.raw('SUM(remaining) as total_remaining')
        )
        .first();
      const thisMonth = await this.query()
        .whereRaw('MONTH(printed_at) = MONTH(CURDATE())')
        .whereRaw('YEAR(printed_at) = YEAR(CURDATE())')
        .whereNull('deleted_at')
        .select(
          db.raw('COUNT(*) as receipt_count'),
          db.raw('SUM(used_count) as used_count')
        )
        .first();
      const byCustomerType = await db('tax_receipts as tr')
        .leftJoin('customer_types as ct', 'tr.customer_type_id', 'ct.id')
        .whereNull('tr.deleted_at')
        .select(
          'ct.name',
          'ct.color_code',
          db.raw('COUNT(*) as count'),
          db.raw('SUM(tr.used_count) as total_used')
        )
        .groupBy('tr.customer_type_id', 'ct.name', 'ct.color_code')
        .orderBy('total_used', 'desc');
      const recentReceipts = await this.query()
        .leftJoin('printing_orders', 'tax_receipts.order_id', 'printing_orders.id')
        .select(
          'tax_receipts.serial_number',
          'printing_orders.order_number',
          'tax_receipts.used_count',
          'tax_receipts.approval_amount_total',
          'tax_receipts.printed_at'
        )
        .whereNull('tax_receipts.deleted_at')
        .orderBy('tax_receipts.printed_at', 'desc')
        .limit(10);
      return {
        total: {
          receipts: parseInt(totalStats?.total_receipts || 0),
          approvedQuantity: parseInt(totalStats?.total_approved || 0),
          used: parseInt(totalStats?.total_used || 0),
          remaining: parseInt(totalStats?.total_remaining || 0),
          utilizationRate: totalStats?.total_approved > 0
            ? ((totalStats.total_used / totalStats.total_approved) * 100).toFixed(1)
            : 0
        },
        thisMonth: {
          receipts: parseInt(thisMonth?.receipt_count || 0),
          used: parseInt(thisMonth?.used_count || 0)
        },
        byCustomerType,
        recentReceipts
      };
    } catch (error) {
      logger.error('TaxReceiptRepository.getDashboardStats error:', error.message);
      throw error;
    }
  }
  async isSerialNumberUnique(serialNumber) {
    try {
      const existing = await this.findBySerialNumber(serialNumber);
      return !existing;
    } catch (error) {
      logger.error('TaxReceiptRepository.isSerialNumberUnique error:', error.message);
      return false;
    }
  }
  async generateSerialNumber() {
    try {
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const lastReceipt = await this.query()
        .where('serial_number', 'like', `TR-${date}%`)
        .orderBy('serial_number', 'desc')
        .first();
      let sequence = 1;
      if (lastReceipt) {
        const lastSeq = parseInt(lastReceipt.serial_number.split('-')[2]);
        if (!isNaN(lastSeq)) {
          sequence = lastSeq + 1;
        }
      }
      return `TR-${date}-${sequence.toString().padStart(4, '0')}`;
    } catch (error) {
      logger.error('TaxReceiptRepository.generateSerialNumber error:', error.message);
      return `TR-${Date.now()}`;
    }
  }
  async softDelete(receiptId) {
    try {
      await this.update(receiptId, {
        deleted_at: db.fn.now(),
        updated_at: db.fn.now()
      });
      return true;
    } catch (error) {
      logger.error('TaxReceiptRepository.softDelete error:', error.message);
      throw error;
    }
  }
  async restore(receiptId) {
    try {
      await this.update(receiptId, {
        deleted_at: null,
        updated_at: db.fn.now()
      });
      return true;
    } catch (error) {
      logger.error('TaxReceiptRepository.restore error:', error.message);
      throw error;
    }
  }
  async exportReceipts(filters = {}) {
    const { startDate, endDate, customerTypeId } = filters;
    try {
      let query = db('tax_receipts as tr')
        .leftJoin('printing_orders as po', 'tr.order_id', 'po.id')
        .leftJoin('customers as c', 'po.customer_id', 'c.id')
        .leftJoin('customer_types as ct', 'tr.customer_type_id', 'ct.id')
        .leftJoin('users as u', 'tr.printed_by', 'u.id')
        .select(
          'tr.serial_number',
          'po.order_number',
          'c.name as customer_name',
          'c.phone as customer_phone',
          'ct.name as customer_type',
          'tr.approval_amount_total',
          'tr.used_count',
          'tr.remaining',
          'tr.approved_date',
          'tr.printed_at',
          'u.full_name as printed_by'
        )
        .whereNull('tr.deleted_at');
      if (startDate && endDate) {
        query = query.whereBetween('tr.printed_at', [startDate, endDate]);
      }
      if (customerTypeId) {
        query = query.where('tr.customer_type_id', customerTypeId);
      }
      const receipts = await query.orderBy('tr.printed_at', 'desc');
      return receipts;
    } catch (error) {
      logger.error('TaxReceiptRepository.exportReceipts error:', error.message);
      throw error;
    }
  }
}
module.exports = TaxReceiptRepository;
