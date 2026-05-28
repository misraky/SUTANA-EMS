const BaseRepository = require('./base.repository');
const { db } = require('../config/database');
const { logger } = require('../config/logger');
class PurchaseRepository extends BaseRepository {
  constructor() {
    super('purchase_orders', 'id');
  }
  async findByPoNumber(poNumber) {
    try {
      const po = await this.query()
        .where('po_number', poNumber)
        .whereNull('deleted_at')
        .first();
      return po || null;
    } catch (error) {
      logger.error('PurchaseRepository.findByPoNumber error:', error.message);
      throw error;
    }
  }
  async getPurchaseOrderWithDetails(poId) {
    try {
      const purchaseOrder = await db('purchase_orders as po')
        .leftJoin('suppliers as s', 'po.supplier_id', 's.id')
        .leftJoin('sectors as sec', 'po.sector_id', 'sec.id')
        .leftJoin('po_statuses as ps', 'po.status_id', 'ps.id')
        .leftJoin('users as u', 'po.created_by', 'u.id')
        .leftJoin('users as a', 'po.approved_by', 'a.id')
        .select(
          'po.*',
          's.name as supplier_name',
          's.phone as supplier_phone',
          's.email as supplier_email',
          's.address as supplier_address',
          'sec.name as sector_name',
          'ps.status_name as status_name',
          'ps.color_hex as status_color',
          'u.full_name as created_by_name',
          'a.full_name as approved_by_name'
        )
        .where('po.id', poId)
        .whereNull('po.deleted_at')
        .first();
      if (purchaseOrder) {
        const items = await db('po_items as pi')
          .leftJoin('products as p', 'pi.product_id', 'p.id')
          .select(
            'pi.*',
            'p.name as product_name',
            'p.sku'
          )
          .where('pi.po_id', poId);
        purchaseOrder.items = items;
      }
      return purchaseOrder || null;
    } catch (error) {
      logger.error('PurchaseRepository.getPurchaseOrderWithDetails error:', error.message);
      throw error;
    }
  }
  async findAllWithFilters(options = {}) {
    const {
      page = 1,
      limit = 25,
      status,
      supplierId,
      startDate,
      endDate
    } = options;
    const offset = (page - 1) * limit;
    try {
      let query = db('purchase_orders as po')
        .leftJoin('suppliers as s', 'po.supplier_id', 's.id')
        .leftJoin('sectors as sec', 'po.sector_id', 'sec.id')
        .leftJoin('po_statuses as ps', 'po.status_id', 'ps.id')
        .leftJoin('users as u', 'po.created_by', 'u.id')
        .select(
          'po.*',
          's.name as supplier_name',
          'sec.name as sector_name',
          'ps.status_name as status_name',
          'ps.color_hex as status_color',
          'u.full_name as created_by_name'
        )
        .whereNull('po.deleted_at');
      if (status) {
        const statusRecord = await db('po_statuses').where('status_code', status).first();
        if (statusRecord) {
          query = query.where('po.status_id', statusRecord.id);
        }
      }
      if (supplierId) {
        query = query.where('po.supplier_id', supplierId);
      }
      if (startDate && endDate) {
        query = query.whereBetween('po.created_at', [startDate, endDate]);
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
      logger.error('PurchaseRepository.findAllWithFilters error:', error.message);
      throw error;
    }
  }
  async findBySupplier(supplierId, options = {}) {
    const { page = 1, limit = 25 } = options;
    const offset = (page - 1) * limit;
    try {
      const query = this.query()
        .where('supplier_id', supplierId)
        .whereNull('deleted_at');
      const total = await query.clone().count('id as total').first();
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
      logger.error('PurchaseRepository.findBySupplier error:', error.message);
      throw error;
    }
  }
  async getPendingApprovals() {
    try {
      const pendingStatus = await db('po_statuses')
        .where('status_code', 'pending')
        .first();
      const orders = await this.query()
        .leftJoin('suppliers as s', 'purchase_orders.supplier_id', 's.id')
        .select(
          'purchase_orders.*',
          's.name as supplier_name'
        )
        .where('purchase_orders.status_id', pendingStatus?.id)
        .whereNull('purchase_orders.deleted_at')
        .orderBy('purchase_orders.created_at', 'asc');
      return orders;
    } catch (error) {
      logger.error('PurchaseRepository.getPendingApprovals error:', error.message);
      throw error;
    }
  }
  async updateStatus(poId, statusCode, approvedBy = null, rejectionReason = null) {
    try {
      const statusRecord = await db('po_statuses')
        .where('status_code', statusCode)
        .first();
      if (!statusRecord) {
        throw new Error(`Invalid status code: ${statusCode}`);
      }
      const updateData = {
        status_id: statusRecord.id,
        updated_at: db.fn.now()
      };
      if (approvedBy && (statusCode === 'approved' || statusCode === 'rejected')) {
        updateData.approved_by = approvedBy;
        updateData.approved_at = db.fn.now();
      }
      if (rejectionReason && statusCode === 'rejected') {
        updateData.rejection_reason = rejectionReason;
      }
      await this.update(poId, updateData);
      return true;
    } catch (error) {
      logger.error('PurchaseRepository.updateStatus error:', error.message);
      throw error;
    }
  }
  async getPoItems(poId) {
    try {
      const items = await db('po_items as pi')
        .leftJoin('products as p', 'pi.product_id', 'p.id')
        .select(
          'pi.*',
          'p.name as product_name',
          'p.sku'
        )
        .where('pi.po_id', poId);
      return items;
    } catch (error) {
      logger.error('PurchaseRepository.getPoItems error:', error.message);
      throw error;
    }
  }
  async updatePoItemReceiving(poItemId, quantityReceived, quantityDamaged, qualityPass) {
    try {
      const item = await db('po_items').where('id', poItemId).first();
      if (!item) {
        throw new Error('PO item not found');
      }
      const newReceived = (item.quantity_received || 0) + quantityReceived;
      const newDamaged = (item.quantity_damaged || 0) + quantityDamaged;
      await db('po_items')
        .where('id', poItemId)
        .update({
          quantity_received: newReceived,
          quantity_damaged: newDamaged,
          quality_pass: qualityPass,
          updated_at: db.fn.now()
        });
      return true;
    } catch (error) {
      logger.error('PurchaseRepository.updatePoItemReceiving error:', error.message);
      throw error;
    }
  }
  async getPendingReceiving() {
    try {
      const pendingReceiving = await db('purchase_orders as po')
        .leftJoin('suppliers as s', 'po.supplier_id', 's.id')
        .leftJoin('po_statuses as ps', 'po.status_id', 'ps.id')
        .leftJoin('po_items as pi', 'po.id', 'pi.po_id')
        .select(
          'po.id as po_id',
          'po.po_number',
          's.name as supplier_name',
          'po.expected_delivery_date',
          'ps.status_name as po_status',
          db.raw('COUNT(pi.id) as total_items'),
          db.raw('SUM(CASE WHEN pi.quantity_received < pi.quantity_ordered THEN 1 ELSE 0 END) as pending_items')
        )
        .whereIn('ps.status_code', ['approved', 'sent', 'partial_received'])
        .whereNull('po.deleted_at')
        .groupBy('po.id', 'po.po_number', 's.name', 'po.expected_delivery_date', 'ps.status_name')
        .havingRaw('COUNT(CASE WHEN pi.quantity_received < pi.quantity_ordered THEN 1 ELSE NULL END) > 0')
        .orderBy('po.expected_delivery_date', 'asc');
      return pendingReceiving;
    } catch (error) {
      logger.error('PurchaseRepository.getPendingReceiving error:', error.message);
      throw error;
    }
  }
  async isFullyReceived(poId) {
    try {
      const items = await db('po_items')
        .where('po_id', poId)
        .select('quantity_ordered', 'quantity_received');
      if (items.length === 0) return false;
      const allReceived = items.every(item => 
        item.quantity_received >= item.quantity_ordered
      );
      return allReceived;
    } catch (error) {
      logger.error('PurchaseRepository.isFullyReceived error:', error.message);
      throw error;
    }
  }
  async getPurchaseStatistics() {
    try {
      const startOfMonth = db.raw('DATE_FORMAT(NOW(), "%Y-%m-01")');
      const startOfYear = db.raw('DATE_FORMAT(NOW(), "%Y-01-01")');
      const monthlyPOs = await this.query()
        .where('created_at', '>=', startOfMonth)
        .count('id as count')
        .first();
      const pendingStatus = await db('po_statuses').where('status_code', 'pending').first();
      const pendingApprovals = await this.query()
        .where('status_id', pendingStatus?.id)
        .count('id as count')
        .first();
      const totalSpend = await this.query()
        .where('created_at', '>=', startOfYear)
        .sum('total_amount as total')
        .first();
      const averageOrderValue = await this.query()
        .where('created_at', '>=', startOfYear)
        .avg('total_amount as avg')
        .first();
      const byStatus = await this.query()
        .leftJoin('po_statuses as ps', 'purchase_orders.status_id', 'ps.id')
        .select('ps.status_name', db.raw('COUNT(*) as count'), db.raw('SUM(total_amount) as amount'))
        .groupBy('purchase_orders.status_id', 'ps.status_name');
      return {
        monthlyPOs: parseInt(monthlyPOs?.count || 0),
        pendingApprovals: parseInt(pendingApprovals?.count || 0),
        totalSpendThisYear: parseFloat(totalSpend?.total || 0),
        averageOrderValue: parseFloat(averageOrderValue?.avg || 0),
        byStatus
      };
    } catch (error) {
      logger.error('PurchaseRepository.getPurchaseStatistics error:', error.message);
      throw error;
    }
  }
  async getSectors() {
    try {
      const sectors = await db('sectors')
        .select('id', 'name', 'description')
        .orderBy('name', 'asc');
      return sectors;
    } catch (error) {
      logger.error('PurchaseRepository.getSectors error:', error.message);
      throw error;
    }
  }
  async getPoStatuses() {
    try {
      const statuses = await db('po_statuses')
        .select('id', 'status_code', 'status_name', 'color_hex', 'sort_order')
        .orderBy('sort_order', 'asc');
      return statuses;
    } catch (error) {
      logger.error('PurchaseRepository.getPoStatuses error:', error.message);
      throw error;
    }
  }
  async getPoItemsByProduct(productId) {
    try {
      const items = await db('po_items as pi')
        .leftJoin('purchase_orders as po', 'pi.po_id', 'po.id')
        .select(
          'pi.*',
          'po.po_number',
          'po.created_at as po_date'
        )
        .where('pi.product_id', productId)
        .whereNull('po.deleted_at')
        .orderBy('po.created_at', 'desc');
      return items;
    } catch (error) {
      logger.error('PurchaseRepository.getPoItemsByProduct error:', error.message);
      throw error;
    }
  }
  async cancelPoItems(poId) {
    try {
      await db('po_items')
        .where('po_id', poId)
        .update({
          quantity_received: 0,
          quantity_damaged: 0,
          updated_at: db.fn.now()
        });
      return true;
    } catch (error) {
      logger.error('PurchaseRepository.cancelPoItems error:', error.message);
      throw error;
    }
  }
  async addNote(poId, note) {
    try {
      const currentNotes = await this.query()
        .where('id', poId)
        .select('notes')
        .first();
      const newNotes = currentNotes?.notes 
        ? `${currentNotes.notes}\n\n[${new Date().toISOString()}] ${note}`
        : `[${new Date().toISOString()}] ${note}`;
      await this.update(poId, {
        notes: newNotes,
        updated_at: db.fn.now()
      });
      return true;
    } catch (error) {
      logger.error('PurchaseRepository.addNote error:', error.message);
      throw error;
    }
  }
  async getDashboardSummary() {
    try {
      const thisMonth = this.query()
        .whereRaw('MONTH(created_at) = MONTH(CURDATE())')
        .whereRaw('YEAR(created_at) = YEAR(CURDATE())');
      const totalThisMonth = await this.query()
        .whereRaw('MONTH(created_at) = MONTH(CURDATE())')
        .whereRaw('YEAR(created_at) = YEAR(CURDATE())')
        .sum('total_amount as total')
        .first();
      const averageLeadTime = await this.query()
        .whereNotNull('expected_delivery_date')
        .select(db.raw('AVG(DATEDIFF(expected_delivery_date, order_date)) as avg_lead_time'))
        .first();
      const pendingReceivingCount = await this.getPendingReceiving();
      const lateDeliveries = await this.query()
        .where('expected_delivery_date', '<', db.fn.now())
        .whereNotIn('status_id', (await db('po_statuses').where('status_code', 'complete').select('id')).map(s => s.id))
        .count('id as count')
        .first();
      return {
        totalThisMonth: parseFloat(totalThisMonth?.total || 0),
        averageLeadTime: parseInt(averageLeadTime?.avg_lead_time || 0),
        pendingReceiving: pendingReceivingCount.length,
        lateDeliveries: parseInt(lateDeliveries?.count || 0)
      };
    } catch (error) {
      logger.error('PurchaseRepository.getDashboardSummary error:', error.message);
      throw error;
    }
  }
}
module.exports = PurchaseRepository;
