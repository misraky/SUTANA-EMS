const { db, transaction } = require('../../config/database');
const { audit } = require('../../config/logger');
const { sendEmail } = require('../../services/email.service');
const { sendSMS } = require('../../services/sms.service');
const AppError = require('../../utils/AppError');
const { catchAsync } = require('../../utils/catchAsync');
const ExcelJS = require('exceljs');
exports.getProducts = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 25,
    categoryId,
    search,
    isActive,
    lowStock = false
  } = req.query;
  const offset = (page - 1) * limit;
  const cacheKey = `products:${page}:${limit}:${categoryId}:${search}:${isActive}:${lowStock}`;
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
  const total = await query.clone().clearSelect().count('p.id as total').first();
  const products = await query
    .orderBy('p.created_at', 'desc')
    .limit(limit)
    .offset(offset);
  const result = {
    products,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(total.total),
      totalPages: Math.ceil(total.total / limit)
    }
  };
  res.json({
    status: 'success',
    data: result
  });
});
exports.getLowStockProducts = catchAsync(async (req, res) => {
  const { thresholdPercent = 20 } = req.query;
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
  res.json({
    status: 'success',
    data: {
      products,
      summary: {
        totalLowStock: products.length,
        critical: criticalCount,
        warning: warningCount,
        thresholdPercent: parseInt(thresholdPercent)
      }
    }
  });
});
exports.getExpiringProducts = catchAsync(async (req, res) => {
  const { days = 30 } = req.query;
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
    res.json({
      status: 'success',
      data: {
        products,
        summary: {
          totalExpiring: products.length,
          expiringSoon: expiringSoon.length,
          expiringLater: expiringLater.length,
          expired: expired.length,
          thresholdDays: parseInt(days)
        }
      }
    });
  });
  exports.getProductById = catchAsync(async (req, res) => {
    const { id } = req.params;
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
      .where('p.id', id)
      .whereNull('p.deleted_at')
      .first();
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    const recentMovements = await db('inventory_movements')
      .where('product_id', id)
      .orderBy('created_at', 'desc')
      .limit(10);
    res.json({
      status: 'success',
      data: {
        product,
        recentMovements
      }
    });
  });
  exports.createProduct = catchAsync(async (req, res) => {
    const {
      name,
      sku,
      categoryId,
      unitId,
      sellingPrice,
      reorderLevel = 0,
      expiryDate,
      supplierId
    } = req.body;
    const userId = req.user.id;
    const ip = req.ip;
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
    await audit('PRODUCT_CREATED', productId, {
      ip,
      details: { name, sku, categoryId, sellingPrice }
    });
    res.status(201).json({
      status: 'success',
      message: 'Product created successfully',
      data: { productId }
    });
  });
  exports.updateProduct = catchAsync(async (req, res) => {
    const { id } = req.params;
    const {
      name,
      sku,
      categoryId,
      unitId,
      sellingPrice,
      reorderLevel,
      expiryDate,
      supplierId,
      isActive
    } = req.body;
    const userId = req.user.id;
    const ip = req.ip;
    const product = await db('products')
      .where('id', id)
      .whereNull('deleted_at')
      .first();
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    if (sku && sku !== product.sku) {
      const existingProduct = await db('products')
        .where('sku', sku.toUpperCase())
        .where('id', '!=', id)
        .whereNull('deleted_at')
        .first();
      if (existingProduct) {
        throw new AppError('Product with this SKU already exists', 400);
      }
    }
    const updateData = {};
    if (name) updateData.name = name;
    if (sku) updateData.sku = sku.toUpperCase();
    if (categoryId) updateData.category_id = categoryId;
    if (unitId) updateData.unit_id = unitId;
    if (sellingPrice) updateData.selling_price = sellingPrice;
    if (reorderLevel !== undefined) updateData.reorder_level = reorderLevel;
    if (expiryDate !== undefined) updateData.expiry_date = expiryDate || null;
    if (supplierId !== undefined) updateData.supplier_id = supplierId || null;
    if (isActive !== undefined) updateData.is_active = isActive;
    updateData.updated_at = db.fn.now();
    await db('products')
      .where('id', id)
      .update(updateData);
    await audit('PRODUCT_UPDATED', id, {
      ip,
      details: { updates: Object.keys(updateData) }
    });
    res.json({
      status: 'success',
      message: 'Product updated successfully'
    });
  });
  exports.deleteProduct = catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const ip = req.ip;
    const product = await db('products')
      .where('id', id)
      .whereNull('deleted_at')
      .first();
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    const hasSales = await db('pos_items')
      .where('product_id', id)
      .first();
    if (hasSales) {
      throw new AppError('Cannot delete product with existing sales history. Deactivate instead.', 400);
    }
    await db('products')
      .where('id', id)
      .update({
        is_active: false,
        deleted_at: db.fn.now(),
        updated_at: db.fn.now()
      });
    await audit('PRODUCT_DELETED', id, {
      ip,
      details: { name: product.name, sku: product.sku }
    });
    res.json({
      status: 'success',
      message: 'Product deleted successfully'
    });
  });
  exports.restoreProduct = catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const ip = req.ip;
    const product = await db('products')
      .where('id', id)
      .whereNotNull('deleted_at')
      .first();
    if (!product) {
      throw new AppError('Product not found or not deleted', 404);
    }
    await db('products')
      .where('id', id)
      .update({
        is_active: true,
        deleted_at: null,
        updated_at: db.fn.now()
      });
    await audit('PRODUCT_RESTORED', id, { ip });
    res.json({
      status: 'success',
      message: 'Product restored successfully'
    });
  });
  exports.getCurrentStock = catchAsync(async (req, res) => {
    const { productId } = req.params;
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
    res.json({
      status: 'success',
      data: {
        ...stock,
        isLowStock,
        stockPercentage: Math.min(stockPercentage, 100),
        status: isLowStock ? 'low_stock' : stock.quantity === 0 ? 'out_of_stock' : 'in_stock'
      }
    });
  });
  exports.adjustStock = catchAsync(async (req, res) => {
    const { productId, quantityChange, reason, referenceType, referenceId } = req.body;
    const userId = req.user.id;
    const ip = req.ip;
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
    await audit('STOCK_ADJUSTED', productId, {
      ip,
      details: {
        quantityChange,
        reason,
        oldQuantity: currentStock.quantity,
        newQuantity
      }
    });
    const product = await db('products').where('id', productId).first();
    if (newQuantity <= product.reorder_level && newQuantity > 0) {
      await sendLowStockAlert(product, newQuantity);
    }
    res.json({
      status: 'success',
      message: `Stock adjusted by ${quantityChange > 0 ? '+' : ''}${quantityChange}`,
      data: {
        productId,
        previousQuantity: currentStock.quantity,
        newQuantity,
        change: quantityChange
      }
    });
  });
  exports.markDamaged = catchAsync(async (req, res) => {
    const { productId, quantity, reason, photoUrl } = req.body;
    const userId = req.user.id;
    const ip = req.ip;
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
        reason: photoUrl ? `${reason} | Photo: ${photoUrl}` : reason,
        performed_by: userId,
        created_at: db.fn.now()
      });
    });
    await audit('DAMAGED_ITEMS_RECORDED', productId, {
      ip,
      details: { quantity, reason }
    });
    res.json({
      status: 'success',
      message: `${quantity} item(s) marked as damaged`,
      data: {
        productId,
        damagedQuantity: quantity,
        remainingStock: newQuantity
      }
    });
  });
  exports.markLost = catchAsync(async (req, res) => {
    const { productId, quantity, reason } = req.body;
    const userId = req.user.id;
    const ip = req.ip;
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
    await audit('LOST_ITEMS_RECORDED', productId, {
      ip,
      details: { quantity, reason }
    });
    res.json({
      status: 'success',
      message: `${quantity} item(s) marked as lost`,
      data: {
        productId,
        lostQuantity: quantity,
        remainingStock: newQuantity
      }
    });
  });
  exports.getMovementHistory = catchAsync(async (req, res) => {
    const {
      productId,
      type,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;
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
    const total = await query.clone().clearSelect().count('im.id as total').first();
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
    res.json({
      status: 'success',
      data: {
        movements,
        summary,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total.total),
          totalPages: Math.ceil(total.total / limit)
        }
      }
    });
  });
  exports.recordInventoryCount = catchAsync(async (req, res) => {
    const { productId, countedQuantity, notes } = req.body;
    const userId = req.user.id;
    const ip = req.ip;
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
    await audit('INVENTORY_COUNT_RECORDED', productId, {
      ip,
      details: {
        systemQuantity: currentStock.quantity,
        countedQuantity,
        variance
      }
    });
    res.json({
      status: 'success',
      message: variance === 0 
        ? 'Inventory count recorded. No adjustment needed.'
        : `Inventory count recorded. Stock adjusted by ${variance > 0 ? '+' : ''}${variance}`,
      data: {
        productId,
        previousQuantity: currentStock.quantity,
        newQuantity: countedQuantity,
        variance
      }
    });
  });
  exports.getInventoryStatistics = catchAsync(async (req, res) => {
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
    res.json({
      status: 'success',
      data: {
        totalProducts: parseInt(totalProducts.count),
        totalInventoryValue: parseFloat(totalValue.total_value || 0),
        lowStockCount: parseInt(lowStockCount.count),
        outOfStockCount: parseInt(outOfStockCount.count),
        expiringCount: parseInt(expiringCount.count),
        recentMovements: parseInt(recentMovements.count),
        topMovingProducts
      }
    });
  });
  exports.importProducts = catchAsync(async (req, res) => {
    if (!req.file) {
      throw new AppError('No import file provided', 400);
    }
    res.json({
      status: 'success',
      message: 'File uploaded successfully. Processing will begin shortly.',
      data: { file: req.file.filename }
    });
  });
  exports.exportInventory = catchAsync(async (req, res) => {
    res.json({
      status: 'success',
      message: 'Export initiated',
      data: { url: '/uploads/temp/export.csv' }
    });
  });
  exports.getCategories = catchAsync(async (req, res) => {
    const categories = await db('product_categories')
      .select('id', 'name', 'is_active')
      .orderBy('name');
    res.json({
      status: 'success',
      data: { categories }
    });
  });
  exports.createCategory = catchAsync(async (req, res) => {
    const { name } = req.body;
    const userId = req.user.id;
    const ip = req.ip;
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
    await audit('CATEGORY_CREATED', categoryId, { ip, details: { name } });
    res.status(201).json({
      status: 'success',
      message: 'Category created successfully',
      data: { categoryId, name }
    });
  });
  exports.getUnits = catchAsync(async (req, res) => {
    const units = await db('units')
      .select('id', 'name', 'abbreviation')
      .orderBy('name');
    res.json({
      status: 'success',
      data: { units }
    });
  });
  exports.importProducts = catchAsync(async (req, res) => {
    if (!req.file) {
      throw new AppError('Please upload a CSV or Excel file', 400);
    }
    const userId = req.user.id;
    const ip = req.ip;
    let products = [];
    const fileExt = req.file.originalname.split('.').pop().toLowerCase();
    if (fileExt === 'csv') {
      const csv = require('csv-parser');
      const fs = require('fs');
      const results = [];
      await new Promise((resolve, reject) => {
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', resolve)
          .on('error', reject);
      });
      products = results;
    } else {
      const XLSX = require('xlsx');
      const workbook = XLSX.readFile(req.file.path);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      products = XLSX.utils.sheet_to_json(sheet);
    }
    let imported = 0;
    let failed = 0;
    const errors = [];
    for (const product of products) {
      try {
        if (!product.name || !product.sku || !product.category || !product.unit || !product.selling_price) {
          failed++;
          errors.push(`Missing required fields for product: ${product.name || 'unknown'}`);
          continue;
        }
        let category = await db('product_categories').where('name', product.category).first();
        if (!category) {
          const [catId] = await db('product_categories').insert({ name: product.category, is_active: true });
          category = { id: catId };
        }
        const unit = await db('units').where('name', product.unit).first();
        if (!unit) {
          failed++;
          errors.push(`Invalid unit '${product.unit}' for product: ${product.name}`);
          continue;
        }
        const existing = await db('products').where('sku', product.sku).whereNull('deleted_at').first();
        if (existing) {
          await db('products')
            .where('id', existing.id)
            .update({
              name: product.name,
              category_id: category.id,
              unit_id: unit.id,
              selling_price: product.selling_price,
              reorder_level: product.reorder_level || 0,
              updated_at: db.fn.now()
            });
        } else {
          await db('products').insert({
            name: product.name,
            sku: product.sku,
            category_id: category.id,
            unit_id: unit.id,
            selling_price: product.selling_price,
            reorder_level: product.reorder_level || 0,
            is_active: true,
            created_at: db.fn.now()
          });
        }
        imported++;
      } catch (error) {
        failed++;
        errors.push(`Error for product ${product.name}: ${error.message}`);
      }
    }
    deleteFile(req.file.path);
    await audit('PRODUCTS_IMPORTED', null, {
      ip,
      details: { imported, failed, filename: req.file.originalname }
    });
    res.json({
      status: 'success',
      message: `Import completed. ${imported} products imported, ${failed} failed.`,
      data: { imported, failed, errors: errors.slice(0, 10) } 
    });
  });
  exports.exportInventory = catchAsync(async (req, res) => {
    const { format = 'excel' } = req.query;
    const userId = req.user.id;
    const ip = req.ip;
    const products = await db('products as p')
      .leftJoin('product_categories as pc', 'p.category_id', 'pc.id')
      .leftJoin('units as u', 'p.unit_id', 'u.id')
      .leftJoin('inventory as i', 'p.id', 'i.product_id')
      .leftJoin('suppliers as s', 'p.supplier_id', 's.id')
      .select(
        'p.id',
        'p.name',
        'p.sku',
        'pc.name as category',
        'u.name as unit',
        'p.selling_price',
        'p.reorder_level',
        db.raw('COALESCE(i.quantity, 0) as current_stock'),
        db.raw('COALESCE(i.unit_cost, 0) as average_cost'),
        's.name as supplier',
        'p.is_active',
        'p.created_at'
      )
      .whereNull('p.deleted_at');
    await audit('INVENTORY_EXPORTED', userId, { ip, details: { format } });
    if (format === 'csv') {
      const json2csv = require('json2csv').parse;
      const csv = json2csv(products);
      res.header('Content-Type', 'text/csv');
      res.attachment(`inventory_export_${Date.now()}.csv`);
      return res.send(csv);
    }
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventory');
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Product Name', key: 'name', width: 30 },
      { header: 'SKU', key: 'sku', width: 15 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Unit', key: 'unit', width: 10 },
      { header: 'Selling Price', key: 'selling_price', width: 15 },
      { header: 'Reorder Level', key: 'reorder_level', width: 15 },
      { header: 'Current Stock', key: 'current_stock', width: 15 },
      { header: 'Average Cost', key: 'average_cost', width: 15 },
      { header: 'Supplier', key: 'supplier', width: 25 },
      { header: 'Status', key: 'is_active', width: 10 },
      { header: 'Created At', key: 'created_at', width: 20 }
    ];
    worksheet.addRows(products);
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.attachment(`inventory_export_${Date.now()}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  });
  async function sendLowStockAlert(product, currentStock) {
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
        }).catch(err => console.error('Failed to send low stock email:', err.message));
      }
      if (admin.phone) {
        await sendSMS({
          to: admin.phone,
          message: `ALERT: ${product.name} is low on stock! Current: ${currentStock}, Reorder level: ${product.reorder_level}. Please restock immediately.`
        }).catch(err => console.error('Failed to send low stock SMS:', err.message));
      }
    }
  }
  exports.getUnits = catchAsync(async (req, res) => {
    const units = await db('units').select('*');
    res.json({
      status: 'success',
      data: { units }
    });
  });
  module.exports = exports;
