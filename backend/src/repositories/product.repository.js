const BaseRepository = require('./base.repository');
const { db } = require('../config/database');
const { logger } = require('../config/logger');
class ProductRepository extends BaseRepository {
  constructor() {
    super('products', 'id');
  }
  async findBySku(sku) {
    try {
      const product = await this.query()
        .where('sku', sku.toUpperCase())
        .whereNull('deleted_at')
        .first();
      return product || null;
    } catch (error) {
      logger.error('ProductRepository.findBySku error:', error.message);
      throw error;
    }
  }
  async getProductWithInventory(productId) {
    try {
      const product = await this.query()
        .leftJoin('inventory', 'products.id', 'inventory.product_id')
        .leftJoin('product_categories', 'products.category_id', 'product_categories.id')
        .leftJoin('units', 'products.unit_id', 'units.id')
        .leftJoin('suppliers', 'products.supplier_id', 'suppliers.id')
        .select(
          'products.*',
          'inventory.quantity as current_stock',
          'inventory.unit_cost as average_cost',
          'inventory.location as storage_location',
          'inventory.last_counted',
          'product_categories.name as category_name',
          'units.name as unit_name',
          'units.abbreviation as unit_abbr',
          'suppliers.name as supplier_name',
          'suppliers.phone as supplier_phone',
          'suppliers.email as supplier_email'
        )
        .where('products.id', productId)
        .whereNull('products.deleted_at')
        .first();
      return product || null;
    } catch (error) {
      logger.error('ProductRepository.getProductWithInventory error:', error.message);
      throw error;
    }
  }
  async findAllWithInventory(options = {}) {
    const {
      page = 1,
      limit = 25,
      categoryId,
      search,
      isActive,
      lowStock = false
    } = options;
    const offset = (page - 1) * limit;
    try {
      let query = this.query()
        .leftJoin('inventory', 'products.id', 'inventory.product_id')
        .leftJoin('product_categories', 'products.category_id', 'product_categories.id')
        .leftJoin('units', 'products.unit_id', 'units.id')
        .leftJoin('suppliers', 'products.supplier_id', 'suppliers.id')
        .select(
          'products.*',
          'product_categories.name as category_name',
          'units.name as unit_name',
          'units.abbreviation as unit_abbr',
          'suppliers.name as supplier_name',
          db.raw('COALESCE(inventory.quantity, 0) as current_stock'),
          db.raw('COALESCE(inventory.unit_cost, 0) as average_cost'),
          db.raw('CASE WHEN COALESCE(inventory.quantity, 0) <= products.reorder_level THEN true ELSE false END as is_low_stock')
        )
        .whereNull('products.deleted_at');
      if (categoryId) {
        query = query.where('products.category_id', categoryId);
      }
      if (search) {
        query = query.where(function() {
          this.where('products.name', 'like', `%${search}%`)
            .orWhere('products.sku', 'like', `%${search}%`);
        });
      }
      if (isActive !== undefined) {
        query = query.where('products.is_active', isActive);
      }
      if (lowStock) {
        query = query.whereRaw('COALESCE(inventory.quantity, 0) <= products.reorder_level');
      }
      const countQuery = query.clone();
      const total = await countQuery.count('products.id as total').first();
      const products = await query
        .orderBy('products.created_at', 'desc')
        .limit(limit)
        .offset(offset);
      return {
        data: products,
        pagination: {
          page,
          limit,
          total: parseInt(total?.total || 0),
          totalPages: Math.ceil((total?.total || 0) / limit)
        }
      };
    } catch (error) {
      logger.error('ProductRepository.findAllWithInventory error:', error.message);
      throw error;
    }
  }
  async getLowStockProducts(thresholdPercent = 20) {
    try {
      const products = await this.query()
        .leftJoin('inventory', 'products.id', 'inventory.product_id')
        .leftJoin('product_categories', 'products.category_id', 'product_categories.id')
        .leftJoin('units', 'products.unit_id', 'units.id')
        .select(
          'products.id',
          'products.name',
          'products.sku',
          'products.reorder_level',
          'product_categories.name as category_name',
          'units.abbreviation as unit',
          db.raw('COALESCE(inventory.quantity, 0) as current_stock'),
          db.raw('ROUND((COALESCE(inventory.quantity, 0) / NULLIF(products.reorder_level, 0)) * 100, 1) as stock_percentage')
        )
        .whereNull('products.deleted_at')
        .where('products.is_active', true)
        .whereRaw('COALESCE(inventory.quantity, 0) <= products.reorder_level')
        .orderByRaw('(COALESCE(inventory.quantity, 0) / NULLIF(products.reorder_level, 0)) ASC')
        .limit(50);
      return products;
    } catch (error) {
      logger.error('ProductRepository.getLowStockProducts error:', error.message);
      throw error;
    }
  }
  async getExpiringProducts(days = 30) {
    try {
      const products = await this.query()
        .leftJoin('inventory', 'products.id', 'inventory.product_id')
        .leftJoin('product_categories', 'products.category_id', 'product_categories.id')
        .leftJoin('units', 'products.unit_id', 'units.id')
        .select(
          'products.id',
          'products.name',
          'products.sku',
          'products.expiry_date',
          'product_categories.name as category_name',
          'units.abbreviation as unit',
          db.raw('COALESCE(inventory.quantity, 0) as current_stock'),
          db.raw('DATEDIFF(products.expiry_date, CURDATE()) as days_until_expiry')
        )
        .whereNull('products.deleted_at')
        .where('products.is_active', true)
        .whereNotNull('products.expiry_date')
        .whereRaw('DATEDIFF(products.expiry_date, CURDATE()) <= ?', [days])
        .whereRaw('DATEDIFF(products.expiry_date, CURDATE()) > 0')
        .orderBy('days_until_expiry', 'asc');
      return products;
    } catch (error) {
      logger.error('ProductRepository.getExpiringProducts error:', error.message);
      throw error;
    }
  }
  async findByCategory(categoryId) {
    try {
      const products = await this.query()
        .where('category_id', categoryId)
        .whereNull('deleted_at')
        .orderBy('name', 'asc');
      return products;
    } catch (error) {
      logger.error('ProductRepository.findByCategory error:', error.message);
      throw error;
    }
  }
  async findBySupplier(supplierId) {
    try {
      const products = await this.query()
        .where('supplier_id', supplierId)
        .whereNull('deleted_at')
        .orderBy('name', 'asc');
      return products;
    } catch (error) {
      logger.error('ProductRepository.findBySupplier error:', error.message);
      throw error;
    }
  }
  async searchProducts(query, limit = 20) {
    try {
      const products = await this.query()
        .leftJoin('inventory', 'products.id', 'inventory.product_id')
        .select(
          'products.id',
          'products.name',
          'products.sku',
          'products.selling_price',
          db.raw('COALESCE(inventory.quantity, 0) as stock_quantity')
        )
        .where(function() {
          this.where('products.name', 'like', `%${query}%`)
            .orWhere('products.sku', 'like', `%${query}%`);
        })
        .where('products.is_active', true)
        .whereNull('products.deleted_at')
        .limit(limit)
        .orderBy('products.name', 'asc');
      return products;
    } catch (error) {
      logger.error('ProductRepository.searchProducts error:', error.message);
      throw error;
    }
  }
  async getAllCategories() {
    try {
      const categories = await db('product_categories')
        .select('id', 'name', 'is_active')
        .orderBy('name', 'asc');
      return categories;
    } catch (error) {
      logger.error('ProductRepository.getAllCategories error:', error.message);
      throw error;
    }
  }
  async createCategory(name) {
    try {
      const [id] = await db('product_categories').insert({
        name,
        is_active: true
      });
      return id;
    } catch (error) {
      logger.error('ProductRepository.createCategory error:', error.message);
      throw error;
    }
  }
  async getAllUnits() {
    try {
      const units = await db('units')
        .select('id', 'name', 'abbreviation')
        .orderBy('name', 'asc');
      return units;
    } catch (error) {
      logger.error('ProductRepository.getAllUnits error:', error.message);
      throw error;
    }
  }
  async updateStock(productId, quantityChange, unitCost = null) {
    try {
      const currentStock = await db('inventory')
        .where('product_id', productId)
        .first();
      if (!currentStock) {
        await db('inventory').insert({
          product_id: productId,
          quantity: quantityChange > 0 ? quantityChange : 0,
          unit_cost: unitCost || 0,
          last_updated: db.fn.now()
        });
        return { previousQuantity: 0, newQuantity: quantityChange > 0 ? quantityChange : 0 };
      }
      const newQuantity = currentStock.quantity + quantityChange;
      const updateData = {
        quantity: newQuantity,
        last_updated: db.fn.now()
      };
      if (unitCost !== null && quantityChange > 0) {
        const totalCost = (currentStock.quantity * currentStock.unit_cost) + (quantityChange * unitCost);
        updateData.unit_cost = totalCost / newQuantity;
      }
      await db('inventory')
        .where('product_id', productId)
        .update(updateData);
      return {
        previousQuantity: currentStock.quantity,
        newQuantity,
        change: quantityChange
      };
    } catch (error) {
      logger.error('ProductRepository.updateStock error:', error.message);
      throw error;
    }
  }
  async getProductStatistics() {
    try {
      const totalProducts = await this.query()
        .whereNull('deleted_at')
        .where('is_active', true)
        .count('id as count')
        .first();
      const totalValue = await db('inventory as i')
        .leftJoin('products as p', 'i.product_id', 'p.id')
        .select(db.raw('SUM(i.quantity * i.unit_cost) as total_value'))
        .first();
      const lowStockCount = await this.query()
        .leftJoin('inventory', 'products.id', 'inventory.product_id')
        .whereNull('products.deleted_at')
        .where('products.is_active', true)
        .whereRaw('COALESCE(inventory.quantity, 0) <= products.reorder_level')
        .count('products.id as count')
        .first();
      const outOfStockCount = await db('inventory as i')
        .leftJoin('products as p', 'i.product_id', 'p.id')
        .whereNull('p.deleted_at')
        .where('p.is_active', true)
        .where('i.quantity', 0)
        .count('i.product_id as count')
        .first();
      const categoriesCount = await db('product_categories')
        .count('id as count')
        .first();
      return {
        totalProducts: parseInt(totalProducts?.count || 0),
        totalInventoryValue: parseFloat(totalValue?.total_value || 0),
        lowStockCount: parseInt(lowStockCount?.count || 0),
        outOfStockCount: parseInt(outOfStockCount?.count || 0),
        categoriesCount: parseInt(categoriesCount?.count || 0)
      };
    } catch (error) {
      logger.error('ProductRepository.getProductStatistics error:', error.message);
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
          db.raw('SUM(pi.total) as total_revenue')
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
      logger.error('ProductRepository.getTopSellingProducts error:', error.message);
      throw error;
    }
  }
  async bulkUpdatePrices(updates) {
    try {
      let updated = 0;
      for (const update of updates) {
        await this.update(update.productId, {
          selling_price: update.newPrice,
          updated_at: db.fn.now()
        });
        updated++;
      }
      return updated;
    } catch (error) {
      logger.error('ProductRepository.bulkUpdatePrices error:', error.message);
      throw error;
    }
  }
  async getOutOfStockProducts() {
    try {
      const products = await this.query()
        .leftJoin('inventory', 'products.id', 'inventory.product_id')
        .select('products.*', db.raw('COALESCE(inventory.quantity, 0) as current_stock'))
        .whereNull('products.deleted_at')
        .where('products.is_active', true)
        .whereRaw('COALESCE(inventory.quantity, 0) <= 0')
        .orderBy('products.name', 'asc');
      return products;
    } catch (error) {
      logger.error('ProductRepository.getOutOfStockProducts error:', error.message);
      throw error;
    }
  }
}
module.exports = ProductRepository;
