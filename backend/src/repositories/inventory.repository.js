const BaseRepository = require('./base.repository');
const { db } = require('../config/database');
const { logger } = require('../config/logger');
class InventoryRepository extends BaseRepository {
  constructor() {
    super('inventory', 'product_id');
    this.primaryKey = 'product_id';
  }
  async getInventoryByProductId(productId) {
    try {
      const inventory = await db('inventory')
        .leftJoin('products', 'inventory.product_id', 'products.id')
        .leftJoin('product_categories', 'products.category_id', 'product_categories.id')
        .leftJoin('units', 'products.unit_id', 'units.id')
        .select(
          'inventory.*',
          'products.name as product_name',
          'products.sku',
          'products.selling_price',
          'products.reorder_level',
          'product_categories.name as category_name',
          'units.name as unit_name',
          'units.abbreviation as unit_abbr'
        )
        .where('inventory.product_id', productId)
        .first();
      return inventory || null;
    } catch (error) {
      logger.error('InventoryRepository.getInventoryByProductId error:', error.message);
      throw error;
    }
  }
  async getAllInventoryWithDetails(options = {}) {
    const {
      page = 1,
      limit = 25,
      search,
      categoryId,
      lowStock = false
    } = options;
    const offset = (page - 1) * limit;
    try {
      let query = db('inventory as i')
        .leftJoin('products as p', 'i.product_id', 'p.id')
        .leftJoin('product_categories as pc', 'p.category_id', 'pc.id')
        .leftJoin('units as u', 'p.unit_id', 'u.id')
        .select(
          'i.product_id',
          'i.quantity as current_stock',
          'i.unit_cost',
          'i.location',
          'i.last_updated',
          'i.last_counted',
          'p.name as product_name',
          'p.sku',
          'p.selling_price',
          'p.reorder_level',
          'p.is_active',
          'pc.name as category_name',
          'u.name as unit_name',
          'u.abbreviation as unit_abbr'
        )
        .whereNull('p.deleted_at');
      if (search) {
        query = query.where(function() {
          this.where('p.name', 'like', `%${search}%`)
            .orWhere('p.sku', 'like', `%${search}%`);
        });
      }
      if (categoryId) {
        query = query.where('p.category_id', categoryId);
      }
      if (lowStock) {
        query = query.whereRaw('i.quantity <= p.reorder_level');
      }
      query = query.where('p.is_active', true);
      const total = await query.clone().count('i.product_id as total').first();
      const inventory = await query
        .orderBy('p.name', 'asc')
        .limit(limit)
        .offset(offset);
      return {
        data: inventory,
        pagination: {
          page,
          limit,
          total: parseInt(total?.total || 0),
          totalPages: Math.ceil((total?.total || 0) / limit)
        }
      };
    } catch (error) {
      logger.error('InventoryRepository.getAllInventoryWithDetails error:', error.message);
      throw error;
    }
  }
  async getLowStockItems() {
    try {
      const items = await db('inventory as i')
        .leftJoin('products as p', 'i.product_id', 'p.id')
        .leftJoin('product_categories as pc', 'p.category_id', 'pc.id')
        .leftJoin('units as u', 'p.unit_id', 'u.id')
        .select(
          'i.product_id',
          'i.quantity as current_stock',
          'i.unit_cost',
          'p.name as product_name',
          'p.sku',
          'p.selling_price',
          'p.reorder_level',
          'pc.name as category_name',
          'u.abbreviation as unit',
          db.raw('ROUND((i.quantity / NULLIF(p.reorder_level, 0)) * 100, 1) as stock_percentage')
        )
        .whereRaw('i.quantity <= p.reorder_level')
        .whereNull('p.deleted_at')
        .where('p.is_active', true)
        .orderByRaw('(i.quantity / NULLIF(p.reorder_level, 0)) ASC')
        .limit(100);
      return items;
    } catch (error) {
      logger.error('InventoryRepository.getLowStockItems error:', error.message);
      throw error;
    }
  }
  async getOutOfStockItems() {
    try {
      const items = await db('inventory as i')
        .leftJoin('products as p', 'i.product_id', 'p.id')
        .leftJoin('product_categories as pc', 'p.category_id', 'pc.id')
        .select(
          'i.product_id',
          'p.name as product_name',
          'p.sku',
          'p.selling_price',
          'pc.name as category_name'
        )
        .where('i.quantity', 0)
        .whereNull('p.deleted_at')
        .where('p.is_active', true)
        .orderBy('p.name', 'asc');
      return items;
    } catch (error) {
      logger.error('InventoryRepository.getOutOfStockItems error:', error.message);
      throw error;
    }
  }
  async updateQuantity(productId, newQuantity, unitCost = null) {
    try {
      const updateData = {
        quantity: newQuantity,
        last_updated: db.fn.now()
      };
      if (unitCost !== undefined) {
        updateData.unit_cost = unitCost;
      }
      const result = await db('inventory')
        .where('product_id', productId)
        .update(updateData);
      return result > 0;
    } catch (error) {
      logger.error('InventoryRepository.updateQuantity error:', error.message);
      throw error;
    }
  }
  async adjustQuantity(productId, quantityChange) {
    try {
      const current = await db('inventory')
        .where('product_id', productId)
        .first();
      if (!current) {
        await db('inventory').insert({
          product_id: productId,
          quantity: Math.max(0, quantityChange),
          unit_cost: 0,
          last_updated: db.fn.now()
        });
        return { previousQuantity: 0, newQuantity: quantityChange, change: quantityChange };
      }
      const newQuantity = current.quantity + quantityChange;
      if (newQuantity < 0) {
        throw new Error('Insufficient stock');
      }
      await db('inventory')
        .where('product_id', productId)
        .update({
          quantity: newQuantity,
          last_updated: db.fn.now()
        });
      return {
        previousQuantity: current.quantity,
        newQuantity,
        change: quantityChange
      };
    } catch (error) {
      logger.error('InventoryRepository.adjustQuantity error:', error.message);
      throw error;
    }
  }
  async recordMovement(movementData) {
    try {
      const [id] = await db('inventory_movements').insert({
        product_id: movementData.productId,
        transaction_type: movementData.transactionType,
        quantity_change: movementData.quantityChange,
        quantity_before: movementData.quantityBefore,
        quantity_after: movementData.quantityAfter,
        reference_type: movementData.referenceType || null,
        reference_id: movementData.referenceId || null,
        reason: movementData.reason || null,
        performed_by: movementData.performedBy,
        approved_by: movementData.approvedBy || null,
        created_at: db.fn.now()
      });
      return id;
    } catch (error) {
      logger.error('InventoryRepository.recordMovement error:', error.message);
      throw error;
    }
  }
  async getMovementHistory(productId, options = {}) {
    const {
      page = 1,
      limit = 50,
      transactionType,
      startDate,
      endDate
    } = options;
    const offset = (page - 1) * limit;
    try {
      let query = db('inventory_movements as im')
        .leftJoin('users as u', 'im.performed_by', 'u.id')
        .select(
          'im.*',
          'u.full_name as performed_by_name'
        )
        .where('im.product_id', productId);
      if (transactionType) {
        query = query.where('im.transaction_type', transactionType);
      }
      if (startDate && endDate) {
        query = query.whereBetween('im.created_at', [startDate, endDate]);
      }
      const total = await query.clone().count('im.id as total').first();
      const movements = await query
        .orderBy('im.created_at', 'desc')
        .limit(limit)
        .offset(offset);
      const summary = await db('inventory_movements')
        .where('product_id', productId)
        .select(
          db.raw('SUM(CASE WHEN quantity_change > 0 THEN quantity_change ELSE 0 END) as total_in'),
          db.raw('SUM(CASE WHEN quantity_change < 0 THEN ABS(quantity_change) ELSE 0 END) as total_out')
        )
        .first();
      return {
        data: movements,
        summary: {
          totalIn: parseInt(summary?.total_in || 0),
          totalOut: parseInt(summary?.total_out || 0),
          netChange: (summary?.total_in || 0) - (summary?.total_out || 0)
        },
        pagination: {
          page,
          limit,
          total: parseInt(total?.total || 0),
          totalPages: Math.ceil((total?.total || 0) / limit)
        }
      };
    } catch (error) {
      logger.error('InventoryRepository.getMovementHistory error:', error.message);
      throw error;
    }
  }
  async getAllMovementsWithFilters(options = {}) {
    const {
      productId,
      transactionType,
      startDate,
      endDate,
      limit = 100
    } = options;
    try {
      let query = db('inventory_movements as im')
        .leftJoin('products as p', 'im.product_id', 'p.id')
        .leftJoin('users as u', 'im.performed_by', 'u.id')
        .select(
          'im.*',
          'p.name as product_name',
          'p.sku',
          'u.full_name as performed_by_name'
        );
      if (productId) {
        query = query.where('im.product_id', productId);
      }
      if (transactionType) {
        query = query.where('im.transaction_type', transactionType);
      }
      if (startDate && endDate) {
        query = query.whereBetween('im.created_at', [startDate, endDate]);
      }
      const movements = await query
        .orderBy('im.created_at', 'desc')
        .limit(limit);
      return movements;
    } catch (error) {
      logger.error('InventoryRepository.getAllMovementsWithFilters error:', error.message);
      throw error;
    }
  }
  async getInventoryValuationByCategory() {
    try {
      const valuation = await db('inventory as i')
        .leftJoin('products as p', 'i.product_id', 'p.id')
        .leftJoin('product_categories as pc', 'p.category_id', 'pc.id')
        .select(
          'pc.id as category_id',
          'pc.name as category_name',
          db.raw('COUNT(DISTINCT p.id) as product_count'),
          db.raw('SUM(i.quantity) as total_units'),
          db.raw('SUM(i.quantity * i.unit_cost) as total_value')
        )
        .whereNull('p.deleted_at')
        .where('p.is_active', true)
        .groupBy('p.category_id', 'pc.id', 'pc.name')
        .orderBy('total_value', 'desc');
      return valuation;
    } catch (error) {
      logger.error('InventoryRepository.getInventoryValuationByCategory error:', error.message);
      throw error;
    }
  }
  async getTotalInventoryValue() {
    try {
      const result = await db('inventory as i')
        .leftJoin('products as p', 'i.product_id', 'p.id')
        .select(db.raw('SUM(i.quantity * i.unit_cost) as total_value'))
        .whereNull('p.deleted_at')
        .where('p.is_active', true)
        .first();
      return parseFloat(result?.total_value || 0);
    } catch (error) {
      logger.error('InventoryRepository.getTotalInventoryValue error:', error.message);
      throw error;
    }
  }
  async recordInventoryCount(countData) {
    try {
      const [id] = await db('inventory_counts').insert({
        product_id: countData.productId,
        counted_quantity: countData.countedQuantity,
        system_quantity: countData.systemQuantity,
        variance: countData.variance,
        notes: countData.notes,
        counted_by: countData.countedBy,
        created_at: db.fn.now()
      });
      return id;
    } catch (error) {
      logger.error('InventoryRepository.recordInventoryCount error:', error.message);
      throw error;
    }
  }
  async updateLastCounted(productId) {
    try {
      await db('inventory')
        .where('product_id', productId)
        .update({ last_counted: db.fn.now() });
      return true;
    } catch (error) {
      logger.error('InventoryRepository.updateLastCounted error:', error.message);
      throw error;
    }
  }
  async getUncountedProducts(days = 90) {
    try {
      const cutoffDate = db.raw(`DATE_SUB(NOW(), INTERVAL ${days} DAY)`);
      const products = await db('inventory as i')
        .leftJoin('products as p', 'i.product_id', 'p.id')
        .select('i.product_id', 'p.name', 'p.sku', 'i.last_counted', 'i.quantity')
        .whereNull('p.deleted_at')
        .where(function() {
          this.where('i.last_counted', '<', cutoffDate)
            .orWhereNull('i.last_counted');
        })
        .orderBy('i.last_counted', 'asc')
        .limit(100);
      return products;
    } catch (error) {
      logger.error('InventoryRepository.getUncountedProducts error:', error.message);
      throw error;
    }
  }
  async getInventoryTurnoverRate(days = 365) {
    try {
      const cogs = await db('inventory_movements')
        .where('transaction_type', 'Sale')
        .where('created_at', '>=', db.raw(`DATE_SUB(NOW(), INTERVAL ${days} DAY)`))
        .select(db.raw('SUM(ABS(quantity_change)) as total_quantity'))
        .first();
      const avgInventory = await db('inventory')
        .select(db.raw('AVG(quantity) as avg_quantity'))
        .first();
      if (!avgInventory?.avg_quantity || avgInventory.avg_quantity === 0) {
        return 0;
      }
      return (parseFloat(cogs?.total_quantity || 0) / parseFloat(avgInventory.avg_quantity));
    } catch (error) {
      logger.error('InventoryRepository.getInventoryTurnoverRate error:', error.message);
      throw error;
    }
  }
  async getDashboardStatistics() {
    try {
      const totalProducts = await db('products')
        .whereNull('deleted_at')
        .where('is_active', true)
        .count('id as count')
        .first();
      const totalValue = await this.getTotalInventoryValue();
      const lowStockCount = await db('inventory as i')
        .leftJoin('products as p', 'i.product_id', 'p.id')
        .whereRaw('i.quantity <= p.reorder_level')
        .whereNull('p.deleted_at')
        .where('p.is_active', true)
        .count('i.product_id as count')
        .first();
      const outOfStockCount = await db('inventory')
        .where('quantity', 0)
        .count('product_id as count')
        .first();
      const recentMovements = await db('inventory_movements')
        .where('created_at', '>=', db.raw('DATE_SUB(NOW(), INTERVAL 7 DAY)'))
        .count('id as count')
        .first();
      return {
        totalProducts: parseInt(totalProducts?.count || 0),
        totalInventoryValue: totalValue,
        lowStockCount: parseInt(lowStockCount?.count || 0),
        outOfStockCount: parseInt(outOfStockCount?.count || 0),
        recentMovements: parseInt(recentMovements?.count || 0)
      };
    } catch (error) {
      logger.error('InventoryRepository.getDashboardStatistics error:', error.message);
      throw error;
    }
  }
}
module.exports = InventoryRepository;
