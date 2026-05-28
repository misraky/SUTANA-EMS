const { db, transaction } = require('../config/database');
const config = require('../config/env');
const { audit } = require('../config/logger');
const { sendEmail } = require('./email.service');
const { sendSMS } = require('./sms.service');
const { AppError } = require('../utils/AppError');
const ExcelJS = require('exceljs');
const getProducts = async (filters) => {
  const { page = 1, limit = 25, categoryId, search, isActive, lowStock = false } = filters;
  const offset = (page - 1) * limit;
  const cacheKey = `products:${page}:${limit}:${categoryId}:${search}:${isActive}:${lowStock}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    return cached;
  }
  let query = db('products as p')
    .leftJoin('product_categories as pc', 'p.category_id', 'pc.id')
    .leftJoin('units as u', 'p.unit_id', 'u.id')
    .leftJoin('suppliers as s', 'p.supplier_id', 's.id')
    .leftJoin('inventory as i', 'p.id', 'i.product_id')
    .select(
      'p.*',
      'pc.name as category_name',
      'u.name as unit_name',
      'u.abbreviation as unit_abbr',
      's.name as supplier_name',
      db.raw('COALESCE(i.quantity, 0) as current_stock'),
      db.raw('COALESCE(i.unit_cost, 0) as average_cost'),
      db.raw('CASE WHEN COALESCE(i.quantity, 0) <= p.reorder_level THEN true ELSE false END as is_low_stock')
    )
    .whereNull('p.deleted_at');
  if (categoryId) {
    query = query.where('p.category_id', categoryId);
  }
  if (search) {
    query = query.where(function() {
      this.where('p.name', 'like', `%${search}%`)
        .orWhere('p.sku', 'like', `%${search}%`);
    });
  }
  if (isActive !== undefined) {
    query = query.where('p.is_active', isActive === 'true');
  }
  if (lowStock === 'true') {
    query = query.whereRaw('COALESCE(i.quantity, 0) <= p.reorder_level');
  }
  const total = await query.clone().count('p.id as total').first();
  const products = await query
    .orderBy('p.created_at', 'desc')
    .limit(limit)
    .offset(offset);
  const result = {
    products,
    pagination: {
      page,
      limit,
      total: parseInt(total.total),
      totalPages: Math.ceil(total.total / limit)
    }
  };
  return result;
};
const getLowStockProducts = async (thresholdPercent = 20) => {
  const products = await db('products as p')
    .leftJoin('inventory as i', 'p.id', 'i.product_id')
    .leftJoin('product_categories as pc', 'p.category_id', 'pc.id')
    .leftJoin('units as u', 'p.unit_id', 'u.id')
    .select(
      'p.id',
      'p.name',
      'p.sku',
      'p.reorder_level',
      'pc.name as category_name',
      'u.abbreviation as unit',
      db.raw('COALESCE(i.quantity, 0) as current_stock'),
      db.raw('ROUND((COALESCE(i.quantity, 0) / NULLIF(p.reorder_level, 0)) * 100, 1) as stock_percentage')
    )
    .whereNull('p.deleted_at')
    .where('p.is_active', true)
    .whereRaw('COALESCE(i.quantity, 0) <= p.reorder_level')
    .orderByRaw('(COALESCE(i.quantity, 0) / NULLIF(p.reorder_level, 0)) ASC')
    .limit(50);
  const criticalCount = products.filter(p => p.stock_percentage < (thresholdPercent / 2)).length;
  const warningCount = products.filter(p => p.stock_percentage >= (thresholdPercent / 2) && p.stock_percentage < thresholdPercent).length;
  return {
    products,
    summary: {
      totalLowStock: products.length,
      critical: criticalCount,
      warning: warningCount,
      thresholdPercent
    }
  };
};
const getExpiringProducts = async (days = 30) => {
  const products = await db('products as p')
    .leftJoin('inventory as i', 'p.id', 'i.product_id')
    .leftJoin('product_categories as pc', 'p.category_id', 'pc.id')
    .leftJoin('units as u', 'p.unit_id', 'u.id')
    .select(
      'p.id',
      'p.name',
      'p.sku',
      'p.expiry_date',
      'pc.name as category_name',
      'u.abbreviation as unit',
      db.raw('COALESCE(i.quantity, 0) as current_stock'),
      db.raw('DATEDIFF(p.expiry_date, CURDATE()) as days_until_expiry')
    )
    .whereNull('p.deleted_at')
    .where('p.is_active', true)
    .whereNotNull('p.expiry_date')
    .whereRaw('DATEDIFF(p.expiry_date, CURDATE()) <= ?', [days])
    .whereRaw('DATEDIFF(p.expiry_date, CURDATE()) > 0')
    .orderBy('days_until_expiry', 'asc');
  const expiringSoon = products.filter(p => p.days_until_expiry <= 7);
  const expiringLater = products.filter(p => p.days_until_expiry > 7 && p.days_until_expiry <= 30);
  const expired = products.filter(p => p.days_until_expiry < 0);
  return {
    products,
    summary: {
      totalExpiring: products.length,
      expiringSoon: expiringSoon.length,
      expiringLater: expiringLater.length,
      expired: expired.length,
      thresholdDays: days
    }
  };
};
const getProductById = async (productId) => {
  const product = await db('products as p')
    .leftJoin('product_categories as pc', 'p.category_id', 'pc.id')
    .leftJoin('units as u', 'p.unit_id', 'u.id')
    .leftJoin('suppliers as s', 'p.supplier_id', 's.id')
    .leftJoin('inventory as i', 'p.id', 'i.product_id')
    .select(
      'p.*',
      'pc.name as category_name',
      'pc.id as category_id',
      'u.name as unit_name',
      'u.abbreviation as unit_abbr',
      's.name as supplier_name',
      's.id as supplier_id',
      's.phone as supplier_phone',
      's.email as supplier_email',
      db.raw('COALESCE(i.quantity, 0) as current_stock'),
      db.raw('COALESCE(i.unit_cost, 0) as average_cost'),
      db.raw('COALESCE(i.location, "") as storage_location'),
      db.raw('COALESCE(i.last_counted, NULL) as last_counted')
    )
    .where('p.id', productId)
    .whereNull('p.deleted_at')
    .first();
  if (!product) {
    throw new AppError('Product not found', 404);
  }
  const recentMovements = await db('inventory_movements')
    .where('product_id', productId)
    .orderBy('created_at', 'desc')
    .limit(10);
  return { product, recentMovements };
};
const createProduct = async (productData, userId) => {
  const { name, sku, categoryId, unitId, sellingPrice, reorderLevel = 0, expiryDate, supplierId } = productData;
  const existingProduct = await db('products')
    .where('sku', sku)
    .whereNull('deleted_at')
    .first();
  if (existingProduct) {
    throw new AppError('Product with this SKU already exists', 400);
  }
  const [productId] = await db('products').insert({
    name,
    sku: sku.toUpperCase(),
    category_id: categoryId,
    unit_id: unitId,
    selling_price: sellingPrice,
    reorder_level: reorderLevel,
    expiry_date: expiryDate || null,
    supplier_id: supplierId || null,
    is_active: true,
    created_at: db.fn.now()
  });
  await db('inventory').insert({
    product_id: productId,
    quantity: 0,
    unit_cost: 0,
    last_updated: db.fn.now()
  });
  return productId;
};
const updateProduct = async (productId, updateData, userId) => {
  const { name, sku, categoryId, unitId, sellingPrice, reorderLevel, expiryDate, supplierId, isActive } = updateData;
  const product = await db('products')
    .where('id', productId)
    .whereNull('deleted_at')
    .first();
  if (!product) {
    throw new AppError('Product not found', 404);
  }
  if (sku && sku !== product.sku) {
    const existingProduct = await db('products')
      .where('sku', sku.toUpperCase())
      .where('id', '!=', productId)
      .whereNull('deleted_at')
      .first();
    if (existingProduct) {
      throw new AppError('Product with this SKU already exists', 400);
    }
  }
  const updateFields = {};
  if (name) updateFields.name = name;
  if (sku) updateFields.sku = sku.toUpperCase();
  if (categoryId) updateFields.category_id = categoryId;
  if (unitId) updateFields.unit_id = unitId;
  if (sellingPrice) updateFields.selling_price = sellingPrice;
  if (reorderLevel !== undefined) updateFields.reorder_level = reorderLevel;
  if (expiryDate !== undefined) updateFields.expiry_date = expiryDate || null;
  if (supplierId !== undefined) updateFields.supplier_id = supplierId || null;
  if (isActive !== undefined) updateFields.is_active = isActive;
  updateFields.updated_at = db.fn.now();
  await db('products')
    .where('id', productId)
    .update(updateFields);
  return true;
};
const deleteProduct = async (productId) => {
  const product = await db('products')
    .where('id', productId)
    .whereNull('deleted_at')
    .first();
  if (!product) {
    throw new AppError('Product not found', 404);
  }
  const hasSales = await db('pos_items')
    .where('product_id', productId)
    .first();
  if (hasSales) {
    throw new AppError('Cannot delete product with existing sales history. Deactivate instead.', 400);
  }
  await db('products')
    .where('id', productId)
    .update({
      is_active: false,
      deleted_at: db.fn.now(),
      updated_at: db.fn.now()
    });
  return true;
};
const restoreProduct = async (productId) => {
  const product = await db('products')
    .where('id', productId)
    .whereNotNull('deleted_at')
    .first();
  if (!product) {
    throw new AppError('Product not found or not deleted', 404);
  }
  await db('products')
    .where('id', productId)
    .update({
      is_active: true,
      deleted_at: null,
      updated_at: db.fn.now()
    });
  return true;
};
const getCurrentStock = async (productId) => {
  const stock = await db('inventory')
    .leftJoin('products', 'inventory.product_id', 'products.id')
    .select(
      'inventory.*',
      'products.name as product_name',
      'products.sku',
      'products.reorder_level'
    )
    .where('inventory.product_id', productId)
    .first();
  if (!stock) {
    throw new AppError('Product not found', 404);
  }
  const isLowStock = stock.quantity <= stock.reorder_level;
  const stockPercentage = stock.reorder_level > 0 
    ? (stock.quantity / stock.reorder_level) * 100 
    : 100;
  return {
    ...stock,
    isLowStock,
    stockPercentage: Math.min(stockPercentage, 100),
    status: isLowStock ? 'low_stock' : stock.quantity === 0 ? 'out_of_stock' : 'in_stock'
  };
};
const adjustStock = async (productId, quantityChange, reason, referenceType, referenceId, userId) => {
  const currentStock = await db('inventory')
    .where('product_id', productId)
    .first();
  if (!currentStock) {
    throw new AppError('Product not found', 404);
  }
  const newQuantity = currentStock.quantity + quantityChange;
  if (newQuantity < 0) {
    throw new AppError('Insufficient stock. Cannot reduce below zero.', 400);
  }
  await transaction(async (trx) => {
    await trx('inventory')
      .where('product_id', productId)
      .update({
        quantity: newQuantity,
        last_updated: db.fn.now()
      });
    await trx('inventory_movements').insert({
      product_id: productId,
      transaction_type: referenceType || 'Adjustment',
      quantity_change: quantityChange,
      quantity_before: currentStock.quantity,
      quantity_after: newQuantity,
      reference_type: referenceType || null,
      reference_id: referenceId || null,
      reason: reason,
      performed_by: userId,
      created_at: db.fn.now()
    });
  });
  const product = await db('products').where('id', productId).first();
  if (newQuantity <= product.reorder_level && newQuantity > 0) {
    await sendLowStockAlert(product, newQuantity);
  }
  return {
    productId,
    previousQuantity: currentStock.quantity,
    newQuantity,
    change: quantityChange
  };
};
const markDamaged = async (productId, quantity, reason, photoUrl, userId) => {
  if (quantity <= 0) {
    throw new AppError('Quantity must be greater than 0', 400);
  }
  const currentStock = await db('inventory')
    .where('product_id', productId)
    .first();
  if (!currentStock) {
    throw new AppError('Product not found', 404);
  }
  if (currentStock.quantity < quantity) {
    throw new AppError(`Insufficient stock. Available: ${currentStock.quantity}`, 400);
  }
  const newQuantity = currentStock.quantity - quantity;
  await transaction(async (trx) => {
    await trx('inventory')
      .where('product_id', productId)
      .update({
        quantity: newQuantity,
        last_updated: db.fn.now()
      });
    await trx('inventory_movements').insert({
      product_id: productId,
      transaction_type: 'Damaged',
      quantity_change: -quantity,
      quantity_before: currentStock.quantity,
      quantity_after: newQuantity,
      reason: reason,
      performed_by: userId,
      created_at: db.fn.now()
    });
    if (photoUrl) {
      await trx('damage_reports').insert({
        product_id: productId,
        quantity,
        reason,
        photo_url: photoUrl,
        reported_by: userId,
        created_at: db.fn.now()
      });
    }
  });
  return {
    productId,
    damagedQuantity: quantity,
    remainingStock: newQuantity
  };
};
const markLost = async (productId, quantity, reason, userId) => {
  if (quantity <= 0) {
    throw new AppError('Quantity must be greater than 0', 400);
  }
  const currentStock = await db('inventory')
    .where('product_id', productId)
    .first();
  if (!currentStock) {
    throw new AppError('Product not found', 404);
  }
  if (currentStock.quantity < quantity) {
    throw new AppError(`Insufficient stock. Available: ${currentStock.quantity}`, 400);
  }
  const newQuantity = currentStock.quantity - quantity;
  await transaction(async (trx) => {
    await trx('inventory')
      .where('product_id', productId)
      .update({
        quantity: newQuantity,
        last_updated: db.fn.now()
      });
    await trx('inventory_movements').insert({
      product_id: productId,
      transaction_type: 'Lost',
      quantity_change: -quantity,
      quantity_before: currentStock.quantity,
      quantity_after: newQuantity,
      reason: reason,
      performed_by: userId,
      created_at: db.fn.now()
    });
  });
  return {
    productId,
    lostQuantity: quantity,
    remainingStock: newQuantity
  };
};
const getMovementHistory = async (filters) => {
  const { productId, type, startDate, endDate, page = 1, limit = 50 } = filters;
  const offset = (page - 1) * limit;
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
  if (type) {
    query = query.where('im.transaction_type', type);
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
    .where(function() {
      if (productId) this.where('product_id', productId);
      if (startDate && endDate) this.whereBetween('created_at', [startDate, endDate]);
    })
    .select(
      db.raw('SUM(CASE WHEN quantity_change > 0 THEN quantity_change ELSE 0 END) as total_in'),
      db.raw('SUM(CASE WHEN quantity_change < 0 THEN ABS(quantity_change) ELSE 0 END) as total_out'),
      db.raw('COUNT(*) as total_movements')
    )
    .first();
  return {
    movements,
    summary,
    pagination: {
      page,
      limit,
      total: parseInt(total.total),
      totalPages: Math.ceil(total.total / limit)
    }
  };
};
const recordInventoryCount = async (productId, countedQuantity, notes, userId) => {
  const currentStock = await db('inventory')
    .where('product_id', productId)
    .first();
  if (!currentStock) {
    throw new AppError('Product not found', 404);
  }
  const variance = countedQuantity - currentStock.quantity;
  await transaction(async (trx) => {
    await trx('inventory')
      .where('product_id', productId)
      .update({
        quantity: countedQuantity,
        last_counted: db.fn.now(),
        last_updated: db.fn.now()
      });
    if (variance !== 0) {
      await trx('inventory_movements').insert({
        product_id: productId,
        transaction_type: 'Adjustment',
        quantity_change: variance,
        quantity_before: currentStock.quantity,
        quantity_after: countedQuantity,
        reason: notes || `Physical count adjustment`,
        performed_by: userId,
        created_at: db.fn.now()
      });
    }
    await trx('inventory_counts').insert({
      product_id: productId,
      counted_quantity: countedQuantity,
      system_quantity: currentStock.quantity,
      variance: variance,
      notes: notes,
      counted_by: userId,
      created_at: db.fn.now()
    });
  });
  return {
    productId,
    previousQuantity: currentStock.quantity,
    newQuantity: countedQuantity,
    variance
  };
};
const getInventoryStatistics = async () => {
  const totalProducts = await db('products')
    .whereNull('deleted_at')
    .where('is_active', true)
    .count('id as count')
    .first();
  const totalValue = await db('inventory as i')
    .leftJoin('products as p', 'i.product_id', 'p.id')
    .select(db.raw('SUM(i.quantity * i.unit_cost) as total_value'))
    .first();
  const lowStockCount = await db('products as p')
    .leftJoin('inventory as i', 'p.id', 'i.product_id')
    .whereNull('p.deleted_at')
    .where('p.is_active', true)
    .whereRaw('COALESCE(i.quantity, 0) <= p.reorder_level')
    .count('p.id as count')
    .first();
  const outOfStockCount = await db('inventory as i')
    .leftJoin('products as p', 'i.product_id', 'p.id')
    .whereNull('p.deleted_at')
    .where('p.is_active', true)
    .where('i.quantity', 0)
    .count('i.product_id as count')
    .first();
  const expiringCount = await db('products')
    .whereNull('deleted_at')
    .where('is_active', true)
    .whereNotNull('expiry_date')
    .whereRaw('DATEDIFF(expiry_date, CURDATE()) <= 30')
    .whereRaw('DATEDIFF(expiry_date, CURDATE()) > 0')
    .count('id as count')
    .first();
  const recentMovements = await db('inventory_movements')
    .where('created_at', '>=', db.raw('DATE_SUB(NOW(), INTERVAL 7 DAY)'))
    .count('id as count')
    .first();
  const topMovingProducts = await db('inventory_movements as im')
    .leftJoin('products as p', 'im.product_id', 'p.id')
    .select('p.id', 'p.name', 'p.sku', db.raw('SUM(ABS(im.quantity_change)) as total_movement'))
    .where('im.created_at', '>=', db.raw('DATE_SUB(NOW(), INTERVAL 30 DAY)'))
    .groupBy('im.product_id', 'p.id', 'p.name', 'p.sku')
    .orderBy('total_movement', 'desc')
    .limit(10);
  return {
    totalProducts: parseInt(totalProducts.count),
    totalInventoryValue: parseFloat(totalValue.total_value || 0),
    lowStockCount: parseInt(lowStockCount.count),
    outOfStockCount: parseInt(outOfStockCount.count),
    expiringCount: parseInt(expiringCount.count),
    recentMovements: parseInt(recentMovements.count),
    topMovingProducts
  };
};
const getCategories = async () => {
  const categories = await db('product_categories')
    .select('id', 'name', 'is_active')
    .orderBy('name');
  return categories;
};
const createCategory = async (name) => {
  const existing = await db('product_categories')
    .where('name', name)
    .first();
  if (existing) {
    throw new AppError('Category already exists', 400);
  }
  const [categoryId] = await db('product_categories').insert({
    name,
    is_active: true
  });
  return categoryId;
};
const getUnits = async () => {
  const units = await db('units')
    .select('id', 'name', 'abbreviation')
    .orderBy('name');
  return units;
};
const sendLowStockAlert = async (product, currentStock) => {
  const admins = await db('users')
    .leftJoin('user_roles', 'users.id', 'user_roles.user_id')
    .leftJoin('roles', 'user_roles.role_id', 'roles.id')
    .where('roles.name', 'Store Worker')
    .orWhere('roles.name', 'Admin')
    .select('users.email', 'users.phone', 'users.full_name')
    .groupBy('users.id');
  for (const admin of admins) {
    if (admin.email) {
      await sendEmail({
        to: admin.email,
        subject: `Low Stock Alert: ${product.name}`,
        template: 'low-stock-alert',
        data: {
          adminName: admin.full_name,
          productName: product.name,
          sku: product.sku,
          currentStock,
          reorderLevel: product.reorder_level,
          threshold: product.reorder_level
        }
      }).catch(() => {});
    }
    if (admin.phone) {
      await sendSMS({
        to: admin.phone,
        message: `ALERT: ${product.name} is low on stock! Current: ${currentStock}, Reorder level: ${product.reorder_level}. Please restock immediately.`
      }).catch(() => {});
    }
  }
};
module.exports = {
  getProducts,
  getLowStockProducts,
  getExpiringProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
  getCurrentStock,
  adjustStock,
  markDamaged,
  markLost,
  getMovementHistory,
  recordInventoryCount,
  getInventoryStatistics,
  getCategories,
  createCategory,
  getUnits
};
