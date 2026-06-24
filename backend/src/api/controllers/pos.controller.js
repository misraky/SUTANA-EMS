const { db } = require('../../config/database');
const { catchAsync } = require('../../utils/catchAsync');
const posService = require('../../services/pos.service');
exports.getProducts = catchAsync(async (req, res) => {
  const { page = 1, limit = 50, categoryId } = req.query;
  const offset = (page - 1) * limit;
  let query = db('products as p')
    .leftJoin('product_categories as pc', 'p.category_id', 'pc.id')
    .leftJoin('units as u', 'p.unit_id', 'u.id')
    .leftJoin('inventory as i', 'p.id', 'i.product_id')
    .select(
      'p.id',
      'p.name',
      'p.sku',
      'p.selling_price',
      'pc.name as category_name',
      'u.abbreviation as unit',
      db.raw('COALESCE(i.quantity, 0) as stock_quantity')
    )
    .where('p.is_active', true)
    .whereNull('p.deleted_at');
  if (categoryId) {
    query = query.where('p.category_id', categoryId);
  }
  const total = await query.clone().clearSelect().count('p.id as total').first();
  const products = await query
    .orderBy('p.name', 'asc')
    .limit(limit)
    .offset(offset);
  res.json({
    status: 'success',
    data: {
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.total),
        totalPages: Math.ceil(total.total / limit)
      }
    }
  });
});
exports.searchProducts = catchAsync(async (req, res) => {
  const { q, type = 'name', categoryId, limit = 20 } = req.query;
  if (!q || q.length < 2) {
    return res.json({
      status: 'success',
      data: { products: [] }
    });
  }
  let query = db('products as p')
    .leftJoin('product_categories as pc', 'p.category_id', 'pc.id')
    .leftJoin('units as u', 'p.unit_id', 'u.id')
    .leftJoin('inventory as i', 'p.id', 'i.product_id')
    .select(
      'p.id',
      'p.name',
      'p.sku',
      'p.selling_price',
      'pc.name as category_name',
      'u.abbreviation as unit',
      db.raw('COALESCE(i.quantity, 0) as stock_quantity')
    )
    .where('p.is_active', true)
    .whereNull('p.deleted_at');
  if (type === 'barcode') {
    query = query.where('p.sku', 'like', `%${q}%`);
  } else {
    query = query.where('p.name', 'like', `%${q}%`);
  }
  if (categoryId) {
    query = query.where('p.category_id', categoryId);
  }
  const products = await query.limit(limit);
  res.json({
    status: 'success',
    data: { products }
  });
});
exports.getProductByBarcode = catchAsync(async (req, res) => {
  const { barcode } = req.params;
  const product = await db('products as p')
    .leftJoin('inventory as i', 'p.id', 'i.product_id')
    .select(
      'p.id',
      'p.name',
      'p.sku',
      'p.selling_price',
      db.raw('COALESCE(i.quantity, 0) as stock_quantity')
    )
    .where('p.sku', barcode)
    .where('p.is_active', true)
    .whereNull('p.deleted_at')
    .first();
  if (!product) {
    throw new AppError('Product not found', 404);
  }
  if (product.stock_quantity <= 0) {
    throw new AppError('Product is out of stock', 400);
  }
  res.json({
    status: 'success',
    data: { product }
  });
});
exports.getCart = catchAsync(async (req, res) => {
  const cart = await posService.getCart(req.user.id);
  let customerLoyalty = null;
  if (cart.customerId) {
    try { customerLoyalty = await posService.getCustomerLoyalty(cart.customerId); } catch (_) {}
  }
  res.json({ status: 'success', data: { ...cart, customerLoyalty } });
});
exports.addToCart = catchAsync(async (req, res) => {
  const { productId, quantity, customerId } = req.body;
  const result = await posService.addToCart(req.user.id, productId, quantity, customerId || null);
  res.json({
    status: 'success',
    message: 'Item added to cart',
    data: result
  });
});
exports.updateCartItem = catchAsync(async (req, res) => {
  await posService.updateCartItem(req.user.id, req.params.itemId, req.body.quantity);
  res.json({ status: 'success', message: 'Cart item updated' });
});
exports.removeCartItem = catchAsync(async (req, res) => {
  await posService.removeCartItem(req.user.id, req.params.itemId);
  res.json({ status: 'success', message: 'Item removed from cart' });
});
exports.clearCart = catchAsync(async (req, res) => {
  await posService.clearCart(req.user.id);
  res.json({ status: 'success', message: 'Cart cleared' });
});
exports.applyCartDiscount = catchAsync(async (req, res) => {
  await posService.applyCartDiscount(req.user.id, req.body.type, req.body.value, req.body.reason, req.user.roles || [], req.ip);
  res.json({
    status: 'success',
    message: `Discount of ${req.body.value}${req.body.type === 'percentage' ? '%' : ' ETB'} applied`
  });
});
exports.removeCartDiscount = catchAsync(async (req, res) => {
  await posService.removeCartDiscount(req.user.id);
  res.json({ status: 'success', message: 'Discount removed' });
});
exports.setCartCustomer = catchAsync(async (req, res) => {
  await posService.setCartCustomer(req.user.id, req.body.customerId);
  res.json({
    status: 'success',
    message: req.body.customerId ? 'Customer assigned to cart' : 'Customer removed from cart'
  });
});

exports.checkout = catchAsync(async (req, res) => {
  const result = await posService.checkout(req.user.id, req.body, req.ip);
  res.status(201).json({ status: 'success', message: 'Sale completed successfully', data: result });
});
exports.getSalesHistory = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 25,
    startDate,
    endDate,
    customerId
  } = req.query;
  const offset = (page - 1) * limit;
  let query = db('pos_sales as ps')
    .leftJoin('customers as c', 'ps.customer_id', 'c.id')
    .leftJoin('users as u', 'ps.cashier_id', 'u.id')
    .leftJoin('sale_statuses as ss', 'ps.status_id', 'ss.id')
    .select(
      'ps.id',
      'ps.invoice_number',
      'c.name as customer_name',
      'ps.total_amount',
      'ps.payment_method_id',
      'ps.sale_date',
      'ss.status_name as status',
      'u.full_name as cashier_name'
    );
  if (startDate && endDate) {
    query = query.whereBetween('ps.sale_date', [startDate, endDate]);
  }
  if (customerId) {
    query = query.where('ps.customer_id', customerId);
  }
  const total = await query.clone().clearSelect().count('ps.id as total').first();
  const sales = await query
    .orderBy('ps.sale_date', 'desc')
    .limit(limit)
    .offset(offset);
  res.json({
    status: 'success',
    data: {
      sales,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.total),
        totalPages: Math.ceil(total.total / limit)
      }
    }
  });
});
exports.getCustomers = catchAsync(async (req, res) => {
  const { page = 1, limit = 50, search } = req.query;
  const offset = (page - 1) * limit;
  let query = db('customers')
    .leftJoin('customer_types', 'customers.customer_type_id', 'customer_types.id')
    .select(
      'customers.*',
      'customer_types.name as customer_type_name'
    )
    .whereNull('customers.deleted_at');
  if (search) {
    query = query.where(function() {
      this.where('customers.name', 'like', `%${search}%`)
        .orWhere('customers.phone', 'like', `%${search}%`)
        .orWhere('customers.email', 'like', `%${search}%`);
    });
  }
  const total = await query.clone().clearSelect().count('customers.id as total').first();
  const customersList = await query
    .orderBy('customers.name', 'asc')
    .limit(limit)
    .offset(offset);
  for (const customer of customersList) {
    const stats = await db('pos_sales')
      .where('customer_id', customer.id)
      .select(
        db.raw('COUNT(id) as total_orders'),
        db.raw('COALESCE(SUM(total_amount), 0) as total_spent')
      )
      .first();
    customer.total_orders = parseInt(stats.total_orders || 0);
    customer.total_spent = parseFloat(stats.total_spent || 0);
  }
  res.json({
    status: 'success',
    data: {
      customers: customersList,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.total),
        totalPages: Math.ceil(total.total / limit)
      }
    }
  });
});
exports.getCustomerProfile = catchAsync(async (req, res) => {
  const { customerId } = req.params;
  const customer = await db('customers')
    .leftJoin('customer_types', 'customers.customer_type_id', 'customer_types.id')
    .select('customers.*', 'customer_types.name as customer_type_name')
    .where('customers.id', customerId)
    .whereNull('customers.deleted_at')
    .first();
  if (!customer) throw new AppError('Customer not found', 404);
  const sales = await db('pos_sales as ps')
    .leftJoin('sale_statuses as ss', 'ps.status_id', 'ss.id')
    .leftJoin('payment_methods as pm', 'ps.payment_method_id', 'pm.id')
    .select(
      'ps.id', 'ps.invoice_number', 'ps.total_amount', 'ps.sale_date',
      'ss.status_name as status', 'pm.name as payment_method'
    )
    .where('ps.customer_id', customerId)
    .orderBy('ps.sale_date', 'desc')
    .limit(20);
  const returns = await db('pos_returns')
    .where('customer_id', customerId)
    .select('id', 'return_number', 'total_refund', 'created_at')
    .orderBy('created_at', 'desc')
    .limit(10);
  const stats = await db('pos_sales')
    .where('customer_id', customerId)
    .select(
      db.raw('COUNT(*) as total_orders'),
      db.raw('COALESCE(SUM(total_amount), 0) as total_spent'),
      db.raw('COALESCE(AVG(total_amount), 0) as avg_order_value'),
      db.raw('MAX(sale_date) as last_purchase_date'),
      db.raw('MIN(sale_date) as first_purchase_date')
    )
    .first();
  const totalReturns = await db('pos_returns')
    .where('customer_id', customerId)
    .select(
      db.raw('COUNT(*) as return_count'),
      db.raw('COALESCE(SUM(total_refund), 0) as total_refunded')
    )
    .first();
  const daysSinceLastPurchase = stats.last_purchase_date
    ? Math.floor((new Date() - new Date(stats.last_purchase_date)) / (1000 * 60 * 60 * 24))
    : null;
  res.json({
    status: 'success',
    data: {
      customer: {
        ...customer,
        totalOrders: parseInt(stats.total_orders || 0),
        totalSpent: parseFloat(stats.total_spent || 0),
        avgOrderValue: parseFloat(stats.avg_order_value || 0),
        lastPurchaseDate: stats.last_purchase_date,
        firstPurchaseDate: stats.first_purchase_date,
        daysSinceLastPurchase,
        returnCount: parseInt(totalReturns.return_count || 0),
        totalRefunded: parseFloat(totalReturns.total_refunded || 0)
      },
      recentSales: sales,
      recentReturns: returns
    }
  });
});

exports.createCustomer = catchAsync(async (req, res) => {
  const { name, phone, email } = req.body;
  const userId = req.user.id;
  const [newCustomerId] = await db('customers').insert({
    name,
    phone: phone || null,
    email: email || null,
    customer_type_id: 5, 
    created_by: userId,
    created_at: db.fn.now()
  });
  const newCustomer = await db('customers').where('id', newCustomerId).first();
  await audit('CUSTOMER_CREATED_POS', newCustomerId, {
    ip: req.ip,
    details: { name, phone }
  });
  res.status(201).json({
    status: 'success',
    message: 'Customer created successfully',
    data: { customer: newCustomer }
  });
});
exports.getSalesReports = catchAsync(async (req, res) => {
  const { range = 'month' } = req.query;
  let startDate = new Date();
  if (range === 'today') {
    startDate.setHours(0,0,0,0);
  } else if (range === 'week') {
    startDate.setDate(startDate.getDate() - 7);
  } else if (range === 'month') {
    startDate.setMonth(startDate.getMonth() - 1);
  } else if (range === 'year') {
    startDate.setFullYear(startDate.getFullYear() - 1);
  }
  const stats = await db('pos_sales')
    .where('sale_date', '>=', startDate)
    .select(
      db.raw('COUNT(id) as total_transactions'),
      db.raw('COALESCE(SUM(total_amount), 0) as total_revenue'),
      db.raw('COUNT(DISTINCT customer_id) as unique_customers')
    )
    .first();
  const totalRevenue = parseFloat(stats.total_revenue || 0);
  const totalTransactions = parseInt(stats.total_transactions || 0);
  const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
  const uniqueCustomers = parseInt(stats.unique_customers || 0);
  const topProducts = await db('pos_items')
    .leftJoin('pos_sales', 'pos_items.sale_id', 'pos_sales.id')
    .leftJoin('products', 'pos_items.product_id', 'products.id')
    .where('pos_sales.sale_date', '>=', startDate)
    .select(
      'products.name',
      db.raw('SUM(pos_items.quantity) as quantity'),
      db.raw('SUM(pos_items.total) as revenue')
    )
    .groupBy('products.id', 'products.name')
    .orderBy('revenue', 'desc')
    .limit(5);
  const salesByMethod = await db('pos_sales')
    .leftJoin('payment_methods', 'pos_sales.payment_method_id', 'payment_methods.id')
    .where('pos_sales.sale_date', '>=', startDate)
    .select(
      'payment_methods.name',
      db.raw('SUM(pos_sales.total_amount) as amount')
    )
    .groupBy('payment_methods.id', 'payment_methods.name')
    .orderBy('amount', 'desc');
  for (const method of salesByMethod) {
    method.percentage = totalRevenue > 0 ? (parseFloat(method.amount) / totalRevenue) * 100 : 0;
  }
  res.json({
    status: 'success',
    data: {
      totalRevenue,
      totalTransactions,
      averageOrderValue,
      uniqueCustomers,
      topProducts: topProducts.map(p => ({
        name: p.name,
        quantity: parseInt(p.quantity || 0),
        revenue: parseFloat(p.revenue || 0)
      })),
      salesByMethod: salesByMethod.map(m => ({
        name: m.name,
        amount: parseFloat(m.amount || 0),
        percentage: parseFloat(m.percentage || 0)
      }))
    }
  });
});
exports.getSaleById = catchAsync(async (req, res) => {
  const { saleId } = req.params;
  const sale = await db('pos_sales as ps')
    .leftJoin('customers as c', 'ps.customer_id', 'c.id')
    .leftJoin('users as u', 'ps.cashier_id', 'u.id')
    .leftJoin('sale_statuses as ss', 'ps.status_id', 'ss.id')
    .leftJoin('payment_methods as pm', 'ps.payment_method_id', 'pm.id')
    .select(
      'ps.*',
      'c.name as customer_name',
      'c.phone as customer_phone',
      'u.full_name as cashier_name',
      'ss.status_name as status_name',
      'pm.name as payment_method_name'
    )
    .where('ps.id', saleId)
    .first();
  if (!sale) {
    throw new AppError('Sale not found', 404);
  }
  const items = await db('pos_items as pi')
    .leftJoin('products as p', 'pi.product_id', 'p.id')
    .select('pi.*', 'p.name as product_name', 'p.sku')
    .where('pi.sale_id', saleId);
  res.json({
    status: 'success',
    data: { sale, items }
  });
});
exports.getReceipt = catchAsync(async (req, res) => {
  const { saleId } = req.params;
  const sale = await db('pos_sales as ps')
    .leftJoin('customers as c', 'ps.customer_id', 'c.id')
    .leftJoin('users as u', 'ps.cashier_id', 'u.id')
    .select(
      'ps.*',
      'c.name as customer_name',
      'c.phone as customer_phone',
      'u.full_name as cashier_name'
    )
    .where('ps.id', saleId)
    .first();
  if (!sale) {
    throw new AppError('Sale not found', 404);
  }
  const items = await db('pos_items as pi')
    .leftJoin('products as p', 'pi.product_id', 'p.id')
    .select('pi.*', 'p.name as product_name')
    .where('pi.sale_id', saleId);
  res.json({
    status: 'success',
    data: {
      receipt: {
        invoiceNumber: sale.invoice_number,
        date: sale.sale_date,
        customer: sale.customer_name || 'Walk-in Customer',
        cashier: sale.cashier_name,
        items,
        subtotal: sale.subtotal,
        discount: sale.discount_amount,
        tax: sale.tax_amount,
        total: sale.total_amount,
        paymentMethod: sale.payment_method,
        amountPaid: sale.amount_paid,
        change: sale.change_amount
      }
    }
  });
});
exports.voidSale = catchAsync(async (req, res) => {
  const { saleId } = req.params;
  const { reason } = req.body;
  const userId = req.user.id;
  const ip = req.ip;
  const sale = await db('pos_sales')
    .where('id', saleId)
    .first();
  if (!sale) {
    throw new AppError('Sale not found', 404);
  }
  if (sale.status !== 'Completed') {
    throw new AppError('Sale cannot be voided in its current status', 400);
  }
  const voidedStatus = await db('sale_statuses').where('status_code', 'voided').first();
  await transaction(async (trx) => {
    await trx('pos_sales')
      .where('id', saleId)
      .update({
        status_id: voidedStatus.id,
        voided_by: userId,
        void_reason: reason,
        updated_at: db.fn.now()
      });
    const items = await trx('pos_items').where('sale_id', saleId);
    for (const item of items) {
      const currentStock = await trx('inventory')
        .where('product_id', item.product_id)
        .first();
      if (currentStock) {
        const newQuantity = currentStock.quantity + item.quantity;
        await trx('inventory')
          .where('product_id', item.product_id)
          .update({
            quantity: newQuantity,
            last_updated: db.fn.now()
          });
        await trx('inventory_movements').insert({
          product_id: item.product_id,
          transaction_type: 'Adjustment',
          quantity_change: item.quantity,
          quantity_before: currentStock.quantity,
          quantity_after: newQuantity,
          reference_type: 'VOID',
          reference_id: saleId,
          reason: `Void sale: ${reason}`,
          performed_by: userId,
          created_at: db.fn.now()
        });
      }
    }
  });
  await audit('SALE_VOIDED', saleId, {
    ip,
    details: { reason, invoiceNumber: sale.invoice_number }
  });
  res.json({
    status: 'success',
    message: 'Sale voided successfully'
  });
});
exports.getDailyStatistics = catchAsync(async (req, res) => {
  const { date = new Date().toISOString().split('T')[0] } = req.query;
  const stats = await db('pos_sales')
    .whereRaw('DATE(sale_date) = ?', [date])
    .where('status_id', 1)
    .select(
      db.raw('COUNT(*) as total_transactions'),
      db.raw('SUM(total_amount) as total_revenue'),
      db.raw('AVG(total_amount) as average_transaction'),
      db.raw('SUM(tax_amount) as total_tax'),
      db.raw('SUM(discount_amount) as total_discount')
    )
    .first();
  const paymentBreakdown = await db('pos_sales')
    .leftJoin('payment_methods', 'pos_sales.payment_method_id', 'payment_methods.id')
    .whereRaw('DATE(sale_date) = ?', [date])
    .where('status_id', 1)
    .select('payment_methods.name as method', db.raw('COUNT(*) as count'), db.raw('SUM(total_amount) as amount'))
    .groupBy('pos_sales.payment_method_id', 'payment_methods.name');
  res.json({
    status: 'success',
    data: {
      date,
      statistics: {
        totalTransactions: parseInt(stats.total_transactions || 0),
        totalRevenue: parseFloat(stats.total_revenue || 0),
        averageTransaction: parseFloat(stats.average_transaction || 0),
        totalTax: parseFloat(stats.total_tax || 0),
        totalDiscount: parseFloat(stats.total_discount || 0)
      },
      paymentBreakdown
    }
  });
});
exports.getSaleItems = catchAsync(async (req, res) => {
  const { saleId } = req.params;
  const sale = await db('pos_sales as ps')
    .leftJoin('sale_statuses as ss', 'ps.status_id', 'ss.id')
    .select('ps.*', 'ss.status_name', 'ss.status_code')
    .where('ps.id', saleId)
    .first();
  if (!sale) throw new AppError('Sale not found', 404);
  const items = await db('pos_items as pi')
    .leftJoin('products as p', 'pi.product_id', 'p.id')
    .select(
      'pi.*',
      'p.name as product_name',
      'p.sku',
      db.raw('COALESCE(i.quantity, 0) as current_stock')
    )
    .leftJoin('inventory as i', 'pi.product_id', 'i.product_id')
    .where('pi.sale_id', saleId);
  const returnableItems = items.map(item => ({
    ...item,
    maxReturnQty: item.quantity,
    returnable: item.quantity > 0
  }));
  res.json({
    status: 'success',
    data: { sale, items: returnableItems }
  });
});

exports.processReturn = catchAsync(async (req, res) => {
  const { saleId, items, refundMethod = 'original', notes } = req.body;
  const userId = req.user.id;
  const ip = req.ip;
  const sale = await db('pos_sales').where('id', saleId).first();
  if (!sale) throw new AppError('Sale not found', 404);
  if (sale.status_id === 2) throw new AppError('Cannot return a voided sale', 400);
  let totalRefund = 0;
  const returnItems = [];
  for (const returnItem of items) {
    const originalItem = await db('pos_items')
      .where('id', returnItem.itemId || 0)
      .where('sale_id', saleId)
      .first();
    if (!originalItem) {
      const productInSale = await db('pos_items')
        .where('sale_id', saleId)
        .where('product_id', returnItem.productId)
        .first();
      if (!productInSale) throw new AppError(`Product ${returnItem.productId} not found in sale ${saleId}`, 400);
      const refundAmount = productInSale.unit_price * returnItem.quantity;
      totalRefund += refundAmount;
      returnItems.push({
        product_id: productInSale.product_id,
        quantity: returnItem.quantity,
        unit_price: productInSale.unit_price,
        refund_amount: refundAmount,
        reason_code: returnItem.reasonCode || 'customer_return'
      });
    } else {
      if (returnItem.quantity > originalItem.quantity) {
        throw new AppError(`Return quantity exceeds original quantity for item`, 400);
      }
      const refundAmount = (originalItem.unit_price / originalItem.quantity) * returnItem.quantity;
      totalRefund += refundAmount;
      returnItems.push({
        product_id: originalItem.product_id,
        quantity: returnItem.quantity,
        unit_price: originalItem.unit_price,
        refund_amount: refundAmount,
        reason_code: returnItem.reasonCode || 'customer_return'
      });
    }
  }
  const refundMethodResolved = refundMethod === 'original'
    ? 'original'
    : refundMethod;
  const returnNumber = 'RET-' + Date.now();
  const result = await transaction(async (trx) => {
    const [returnId] = await trx('pos_returns').insert({
      return_number: returnNumber,
      sale_id: saleId,
      customer_id: sale.customer_id,
      total_refund: totalRefund,
      refund_method: refundMethodResolved,
      reason: notes || 'Customer return',
      processed_by: userId,
      status: 'completed',
      created_at: trx.fn.now()
    });
    for (const ri of returnItems) {
      await trx('pos_return_items').insert({
        return_id: returnId,
        product_id: ri.product_id,
        quantity: ri.quantity,
        unit_price: ri.unit_price,
        refund_amount: ri.refund_amount,
        reason_code: ri.reason_code
      });
      const currentStock = await trx('inventory')
        .where('product_id', ri.product_id)
        .first();
      if (currentStock) {
        const newQuantity = currentStock.quantity + ri.quantity;
        await trx('inventory')
          .where('product_id', ri.product_id)
          .update({ quantity: newQuantity, last_updated: trx.fn.now() });
        await trx('inventory_movements').insert({
          product_id: ri.product_id,
          transaction_type: 'Return',
          quantity_change: ri.quantity,
          quantity_before: currentStock.quantity,
          quantity_after: newQuantity,
          reference_type: 'Return',
          reference_id: returnId,
          reason: `Return from sale ${sale.invoice_number}: ${ri.reason_code}`,
          performed_by: userId,
          created_at: trx.fn.now()
        });
      }
    }
    const refundedStatus = await trx('sale_statuses').where('status_code', 'refunded').first();
    if (refundedStatus) {
      await trx('pos_sales').where('id', saleId).update({ status_id: refundedStatus.id });
    }
    return returnId;
  });
  await audit('RETURN_PROCESSED', result, {
    ip, details: { returnNumber, saleId, totalRefund, itemsCount: items.length }
  });
  res.status(201).json({
    status: 'success',
    message: 'Return processed successfully',
    data: { returnId: result, returnNumber, totalRefund }
  });
});

exports.getReturnHistory = catchAsync(async (req, res) => {
  const { page = 1, limit = 25, startDate, endDate } = req.query;
  const offset = (page - 1) * limit;
  let query = db('pos_returns as pr')
    .leftJoin('pos_sales as ps', 'pr.sale_id', 'ps.id')
    .leftJoin('customers as c', 'pr.customer_id', 'c.id')
    .leftJoin('users as u', 'pr.processed_by', 'u.id')
    .select(
      'pr.*',
      'ps.invoice_number',
      'c.name as customer_name',
      'u.full_name as processed_by_name'
    );
  if (startDate && endDate) {
    query = query.whereBetween('pr.created_at', [startDate, endDate]);
  }
  const total = await query.clone().clearSelect().count('pr.id as total').first();
  const returns = await query.orderBy('pr.created_at', 'desc').limit(limit).offset(offset);
  res.json({
    status: 'success',
    data: {
      returns,
      pagination: {
        page: parseInt(page), limit: parseInt(limit),
        total: parseInt(total.total),
        totalPages: Math.ceil(total.total / limit)
      }
    }
  });
});

exports.getZReport = catchAsync(async (req, res) => {
  const { date = new Date().toISOString().split('T')[0] } = req.query;
  const completedStatus = await db('sale_statuses').where('status_code', 'completed').first();
  const statusId = completedStatus ? completedStatus.id : 1;
  const sales = await db('pos_sales')
    .whereRaw('DATE(sale_date) = ?', [date])
    .where('status_id', statusId);
  const totalSales = sales.length;
  const totalRevenue = sales.reduce((s, r) => s + parseFloat(r.total_amount || 0), 0);
  const totalTax = sales.reduce((s, r) => s + parseFloat(r.tax_amount || 0), 0);
  const totalDiscount = sales.reduce((s, r) => s + parseFloat(r.discount_amount || 0), 0);
  const totalCash = sales.filter(r => r.payment_method_id === 1).reduce((s, r) => s + parseFloat(r.total_amount || 0), 0);
  const totalCredit = sales.filter(r => r.payment_method_id === 2).reduce((s, r) => s + parseFloat(r.total_amount || 0), 0);
  const totalTransfer = sales.filter(r => r.payment_method_id === 3).reduce((s, r) => s + parseFloat(r.total_amount || 0), 0);
  const totalTelebirr = sales.filter(r => r.payment_method_id === 4).reduce((s, r) => s + parseFloat(r.total_amount || 0), 0);
  const voidedSales = await db('pos_sales')
    .whereRaw('DATE(sale_date) = ?', [date])
    .where('status_id', 2)
    .count('id as count').first();
  const refunds = await db('pos_returns')
    .whereRaw('DATE(created_at) = ?', [date])
    .select(
      db.raw('COUNT(*) as return_count'),
      db.raw('COALESCE(SUM(total_refund), 0) as total_refund_amount')
    ).first();
  const cashierStats = await db('pos_sales')
    .whereRaw('DATE(sale_date) = ?', [date])
    .where('status_id', statusId)
    .select(
      'cashier_id',
      db.raw('COUNT(*) as transaction_count'),
      db.raw('SUM(total_amount) as total_amount')
    )
    .groupBy('cashier_id');
  const cashierNames = await db('users')
    .whereIn('id', cashierStats.map(c => c.cashier_id))
    .select('id', 'full_name');
  const cashierBreakdown = cashierStats.map(cs => ({
    cashierId: cs.cashier_id,
    cashierName: (cashierNames.find(n => n.id === cs.cashier_id) || {}).full_name || 'Unknown',
    transactions: parseInt(cs.transaction_count),
    total: parseFloat(cs.total_amount || 0)
  }));
  const paymentBreakdown = await db('pos_sales')
    .leftJoin('payment_methods', 'pos_sales.payment_method_id', 'payment_methods.id')
    .whereRaw('DATE(sale_date) = ?', [date])
    .where('pos_sales.status_id', statusId)
    .select(
      'payment_methods.name as method',
      db.raw('COUNT(*) as count'),
      db.raw('SUM(total_amount) as amount')
    )
    .groupBy('pos_sales.payment_method_id', 'payment_methods.name');
  res.json({
    status: 'success',
    data: {
      date,
      generatedAt: new Date().toISOString(),
      summary: {
        totalSales,
        totalRevenue,
        totalTax,
        totalDiscount,
        totalCash,
        totalCredit,
        totalTransfer,
        totalTelebirr,
        voidedCount: parseInt(voidedSales.count || 0),
        returnCount: parseInt(refunds.return_count || 0),
        totalRefundAmount: parseFloat(refunds.total_refund_amount || 0)
      },
      cashierBreakdown,
      paymentBreakdown
    }
  });
});

exports.validateDiscount = catchAsync(async (req, res) => {
  const { discountPercent, subtotal } = req.query;
  const userRole = req.user.roles || [];
  const config = require('../../config/env');
  let maxDiscount = config.businessRules.cashierMaxDiscount;
  if (userRole.includes('CEO') || userRole.includes('Admin')) {
    maxDiscount = config.businessRules.ceoMaxDiscount;
  } else if (userRole.includes('Finance') || userRole.includes('Manager')) {
    maxDiscount = config.businessRules.managerMaxDiscount;
  }
  const isValid = discountPercent <= maxDiscount;
  const requiresApproval = discountPercent > config.businessRules.cashierMaxDiscount && 
                           discountPercent <= config.businessRules.managerMaxDiscount;
  res.json({
    status: 'success',
    data: {
      isValid,
      maxAllowed: maxDiscount,
      requested: parseFloat(discountPercent),
      requiresApproval,
      approvalRole: requiresApproval ? 'Manager' : null
    }
  });
});
