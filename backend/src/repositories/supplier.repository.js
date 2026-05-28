const BaseRepository = require('./base.repository');
const { db } = require('../config/database');
const { logger } = require('../config/logger');
class SupplierRepository extends BaseRepository {
  constructor() {
    super('suppliers', 'id');
  }
  async findByName(name) {
    try {
      const supplier = await this.query()
        .where('name', name)
        .whereNull('deleted_at')
        .first();
      return supplier || null;
    } catch (error) {
      logger.error('SupplierRepository.findByName error:', error.message);
      throw error;
    }
  }
  async findByEmail(email) {
    try {
      const supplier = await this.query()
        .where('email', email.toLowerCase())
        .whereNull('deleted_at')
        .first();
      return supplier || null;
    } catch (error) {
      logger.error('SupplierRepository.findByEmail error:', error.message);
      throw error;
    }
  }
  async getSupplierWithDetails(supplierId) {
    try {
      const supplier = await this.query()
        .leftJoin('payment_terms', 'suppliers.payment_terms_id', 'payment_terms.id')
        .select(
          'suppliers.*',
          'payment_terms.name as payment_terms_name',
          'payment_terms.days_net',
          db.raw('(SELECT COUNT(*) FROM purchase_orders WHERE supplier_id = suppliers.id AND deleted_at IS NULL) as po_count'),
          db.raw('(SELECT SUM(total_amount) FROM purchase_orders WHERE supplier_id = suppliers.id AND deleted_at IS NULL) as total_spent'),
          db.raw('(SELECT SUM(total_amount - paid_amount) FROM purchase_orders WHERE supplier_id = suppliers.id AND paid_amount < total_amount AND deleted_at IS NULL) as outstanding_balance')
        )
        .where('suppliers.id', supplierId)
        .whereNull('suppliers.deleted_at')
        .first();
      if (supplier) {
        const recentPOs = await db('purchase_orders')
          .where('supplier_id', supplierId)
          .orderBy('created_at', 'desc')
          .limit(10)
          .select('id', 'po_number', 'total_amount', 'status', 'created_at');
        supplier.recentPOs = recentPOs;
      }
      return supplier || null;
    } catch (error) {
      logger.error('SupplierRepository.getSupplierWithDetails error:', error.message);
      throw error;
    }
  }
  async findAllWithFilters(options = {}) {
    const {
      page = 1,
      limit = 25,
      search,
      isActive
    } = options;
    const offset = (page - 1) * limit;
    try {
      let query = this.query()
        .leftJoin('payment_terms', 'suppliers.payment_terms_id', 'payment_terms.id')
        .select(
          'suppliers.*',
          'payment_terms.name as payment_terms_name',
          'payment_terms.days_net',
          db.raw('(SELECT COUNT(*) FROM purchase_orders WHERE supplier_id = suppliers.id AND deleted_at IS NULL) as po_count')
        )
        .whereNull('suppliers.deleted_at');
      if (search) {
        query = query.where(function() {
          this.where('suppliers.name', 'like', `%${search}%`)
            .orWhere('suppliers.contact_person', 'like', `%${search}%`)
            .orWhere('suppliers.email', 'like', `%${search}%`)
            .orWhere('suppliers.phone', 'like', `%${search}%`);
        });
      }
      if (isActive !== undefined) {
        query = query.where('suppliers.is_active', isActive);
      }
      const total = await query.clone().count('suppliers.id as total').first();
      const suppliers = await query
        .orderBy('suppliers.name', 'asc')
        .limit(limit)
        .offset(offset);
      return {
        data: suppliers,
        pagination: {
          page,
          limit,
          total: parseInt(total?.total || 0),
          totalPages: Math.ceil((total?.total || 0) / limit)
        }
      };
    } catch (error) {
      logger.error('SupplierRepository.findAllWithFilters error:', error.message);
      throw error;
    }
  }
  async getActiveSuppliers() {
    try {
      const suppliers = await this.query()
        .where('is_active', true)
        .whereNull('deleted_at')
        .orderBy('name', 'asc');
      return suppliers;
    } catch (error) {
      logger.error('SupplierRepository.getActiveSuppliers error:', error.message);
      throw error;
    }
  }
  async getSuppliersWithPendingPayments() {
    try {
      const suppliers = await this.query()
        .leftJoin('purchase_orders', 'suppliers.id', 'purchase_orders.supplier_id')
        .select(
          'suppliers.id',
          'suppliers.name',
          'suppliers.contact_person',
          'suppliers.phone',
          'suppliers.email',
          db.raw('SUM(purchase_orders.total_amount - purchase_orders.paid_amount) as outstanding_balance')
        )
        .whereRaw('purchase_orders.paid_amount < purchase_orders.total_amount')
        .whereNull('purchase_orders.deleted_at')
        .groupBy('suppliers.id', 'suppliers.name', 'suppliers.contact_person', 'suppliers.phone', 'suppliers.email')
        .having('outstanding_balance', '>', 0)
        .orderBy('outstanding_balance', 'desc');
      return suppliers;
    } catch (error) {
      logger.error('SupplierRepository.getSuppliersWithPendingPayments error:', error.message);
      throw error;
    }
  }
  async getPurchaseOrderHistory(supplierId, options = {}) {
    const { page = 1, limit = 25, status } = options;
    const offset = (page - 1) * limit;
    try {
      let query = db('purchase_orders as po')
        .leftJoin('po_statuses as ps', 'po.status_id', 'ps.id')
        .select(
          'po.id',
          'po.po_number',
          'po.order_date',
          'po.expected_delivery_date',
          'po.total_amount',
          'po.paid_amount',
          'ps.status_name as status_name',
          'ps.color_hex as status_color'
        )
        .where('po.supplier_id', supplierId)
        .whereNull('po.deleted_at');
      if (status) {
        const statusRecord = await db('po_statuses').where('status_code', status).first();
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
      logger.error('SupplierRepository.getPurchaseOrderHistory error:', error.message);
      throw error;
    }
  }
  async getSupplierStatistics() {
    try {
      const totalSuppliers = await this.query()
        .whereNull('deleted_at')
        .count('id as count')
        .first();
      const activeSuppliers = await this.query()
        .where('is_active', true)
        .whereNull('deleted_at')
        .count('id as count')
        .first();
      const totalSpent = await db('purchase_orders')
        .whereNull('deleted_at')
        .sum('total_amount as total')
        .first();
      const totalOutstanding = await db('purchase_orders')
        .whereRaw('paid_amount < total_amount')
        .whereNull('deleted_at')
        .select(db.raw('SUM(total_amount - paid_amount) as total'))
        .first();
      const topSuppliers = await db('purchase_orders as po')
        .leftJoin('suppliers as s', 'po.supplier_id', 's.id')
        .select('s.id', 's.name', db.raw('SUM(po.total_amount) as total_spent'))
        .whereNull('po.deleted_at')
        .groupBy('po.supplier_id', 's.id', 's.name')
        .orderBy('total_spent', 'desc')
        .limit(10);
      return {
        totalSuppliers: parseInt(totalSuppliers?.count || 0),
        activeSuppliers: parseInt(activeSuppliers?.count || 0),
        totalSpent: parseFloat(totalSpent?.total || 0),
        totalOutstanding: parseFloat(totalOutstanding?.total || 0),
        topSuppliers
      };
    } catch (error) {
      logger.error('SupplierRepository.getSupplierStatistics error:', error.message);
      throw error;
    }
  }
  async searchSuppliers(query, limit = 20) {
    try {
      const suppliers = await this.query()
        .select('id', 'name', 'contact_person', 'phone', 'email', 'is_active')
        .where(function() {
          this.where('name', 'like', `%${query}%`)
            .orWhere('contact_person', 'like', `%${query}%`)
            .orWhere('email', 'like', `%${query}%`)
            .orWhere('phone', 'like', `%${query}%`);
        })
        .whereNull('deleted_at')
        .limit(limit)
        .orderBy('name', 'asc');
      return suppliers;
    } catch (error) {
      logger.error('SupplierRepository.searchSuppliers error:', error.message);
      throw error;
    }
  }
  async getPaymentTerms() {
    try {
      const terms = await db('payment_terms')
        .select('id', 'name', 'days_net')
        .orderBy('days_net', 'asc');
      return terms;
    } catch (error) {
      logger.error('SupplierRepository.getPaymentTerms error:', error.message);
      throw error;
    }
  }
  async updateActiveStatus(supplierId, isActive) {
    try {
      await this.update(supplierId, {
        is_active: isActive,
        updated_at: db.fn.now()
      });
      return true;
    } catch (error) {
      logger.error('SupplierRepository.updateActiveStatus error:', error.message);
      throw error;
    }
  }
  async getByPaymentTerms(paymentTermsId) {
    try {
      const suppliers = await this.query()
        .where('payment_terms_id', paymentTermsId)
        .where('is_active', true)
        .whereNull('deleted_at')
        .orderBy('name', 'asc');
      return suppliers;
    } catch (error) {
      logger.error('SupplierRepository.getByPaymentTerms error:', error.message);
      throw error;
    }
  }
  async exportSuppliers(filters = {}) {
    const { search, isActive } = filters;
    try {
      let query = this.query()
        .leftJoin('payment_terms', 'suppliers.payment_terms_id', 'payment_terms.id')
        .select(
          'suppliers.id',
          'suppliers.name',
          'suppliers.contact_person',
          'suppliers.phone',
          'suppliers.email',
          'suppliers.address',
          'payment_terms.name as payment_terms',
          'suppliers.lead_time_days',
          'suppliers.tax_id',
          'suppliers.is_active',
          'suppliers.created_at'
        )
        .whereNull('suppliers.deleted_at');
      if (search) {
        query = query.where(function() {
          this.where('suppliers.name', 'like', `%${search}%`)
            .orWhere('suppliers.contact_person', 'like', `%${search}%`);
        });
      }
      if (isActive !== undefined) {
        query = query.where('suppliers.is_active', isActive);
      }
      const suppliers = await query.orderBy('suppliers.name', 'asc');
      return suppliers;
    } catch (error) {
      logger.error('SupplierRepository.exportSuppliers error:', error.message);
      throw error;
    }
  }
  async findByTaxId(taxId) {
    try {
      const supplier = await this.query()
        .where('tax_id', taxId)
        .whereNull('deleted_at')
        .first();
      return supplier || null;
    } catch (error) {
      logger.error('SupplierRepository.findByTaxId error:', error.message);
      throw error;
    }
  }
  async findByBankAccount(bankAccount) {
    try {
      const supplier = await this.query()
        .where('bank_account', bankAccount)
        .whereNull('deleted_at')
        .first();
      return supplier || null;
    } catch (error) {
      logger.error('SupplierRepository.findByBankAccount error:', error.message);
      throw error;
    }
  }
}
module.exports = SupplierRepository;
