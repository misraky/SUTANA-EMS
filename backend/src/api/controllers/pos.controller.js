const { db, transaction } = require('../../config/database');
const { audit } = require('../../config/logger');
const AppError = require('../../utils/AppError');
const { catchAsync } = require('../../utils/catchAsync');
const { generateOrderNumber } = require('../../utils/orderNumber');
const { sendEmail } = require('../../services/email.service');
const { sendSMS } = require('../../services/sms.service');
const carts = new Map();
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
  const userId = req.user.id;
  const cart = carts.get(userId) || { items: [], discount: { type: null, value: 0 }, createdAt: new Date() };
  let subtotal = 0;
  for (const item of cart.items) {
    item.total = item.quantity * item.unitPrice;
    subtotal += item.total;
  }
  const taxRate = 0.15; 
  let discountAmount = 0;
  if (cart.discount.type === 'percentage') {
    discountAmount = subtotal * (cart.discount.value / 100);
  } else if (cart.discount.type === 'fixed') {
    discountAmount = Math.min(cart.discount.value, subtotal);
  }
  const taxAmount = (subtotal - discountAmount) * taxRate;
  const totalAmount = subtotal - discountAmount + taxAmount;
  res.json({
    status: 'success',
    data: {
      items: cart.items,
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      discount: cart.discount,
      itemCount: cart.items.length
    }
  });
});
exports.addToCart = catchAsync(async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user.id;
  const product = await db('products as p')
    .leftJoin('inventory as i', 'p.id', 'i.product_id')
    .select(
      'p.id',
      'p.name',
      'p.selling_price',
      db.raw('COALESCE(i.quantity, 0) as stock_quantity')
    )
    .where('p.id', productId)
    .where('p.is_active', true)
    .whereNull('p.deleted_at')
    .first();
  if (!product) {
    throw new AppError('Product not found', 404);
  }
  if (product.stock_quantity < quantity) {
    throw new AppError(`Insufficient stock. Available: ${product.stock_quantity}`, 400);
  }
  let cart = carts.get(userId);
  if (!cart) {
    cart = { items: [], discount: { type: null, value: 0 }, createdAt: new Date() };
  }
  const existingItem = cart.items.find(item => item.productId === productId);
  if (existingItem) {
    existingItem.quantity += quantity;
    existingItem.total = existingItem.quantity * existingItem.unitPrice;
  } else {
    cart.items.push({
      id: Date.now().toString(),
      productId: product.id,
      productName: product.name,
      quantity,
      unitPrice: parseFloat(product.selling_price),
      total: quantity * parseFloat(product.selling_price)
    });
  }
  carts.set(userId, cart);
  res.json({
    status: 'success',
    message: 'Item added to cart',
    data: { cartItem: cart.items[cart.items.length - 1] }
  });
});
exports.updateCartItem = catchAsync(async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;
  const userId = req.user.id;
  const cart = carts.get(userId);
  if (!cart) {
    throw new AppError('Cart is empty', 400);
  }
  const item = cart.items.find(i => i.id === itemId);
  if (!item) {
    throw new AppError('Item not found in cart', 404);
  }
  const product = await db('products')
    .leftJoin('inventory', 'products.id', 'inventory.product_id')
    .select(db.raw('COALESCE(inventory.quantity, 0) as stock_quantity'))
    .where('products.id', item.productId)
    .first();
  if (product && product.stock_quantity < quantity) {
    throw new AppError(`Insufficient stock. Available: ${product.stock_quantity}`, 400);
  }
  item.quantity = quantity;
  item.total = quantity * item.unitPrice;
  carts.set(userId, cart);
  res.json({
    status: 'success',
    message: 'Cart item updated'
  });
});
exports.removeCartItem = catchAsync(async (req, res) => {
  const { itemId } = req.params;
  const userId = req.user.id;
  const cart = carts.get(userId);
  if (!cart) {
    throw new AppError('Cart is empty', 400);
  }
  cart.items = cart.items.filter(i => i.id !== itemId);
  carts.set(userId, cart);
  res.json({
    status: 'success',
    message: 'Item removed from cart'
  });
});
exports.clearCart = catchAsync(async (req, res) => {
  const userId = req.user.id;
  carts.delete(userId);
  res.json({
    status: 'success',
    message: 'Cart cleared'
  });
});
exports.applyCartDiscount = catchAsync(async (req, res) => {
  const { type, value, reason } = req.body;
  const userId = req.user.id;
  const userRole = req.user.roles || [];
  const config = require('../../config/env');
  let maxDiscount = config.businessRules.cashierMaxDiscount;
  if (userRole.includes('CEO') || userRole.includes('Admin')) {
    maxDiscount = config.businessRules.ceoMaxDiscount;
  } else if (userRole.includes('Finance') || userRole.includes('Manager')) {
    maxDiscount = config.businessRules.managerMaxDiscount;
  }
  if (type === 'percentage' && value > maxDiscount) {
    throw new AppError(`Discount percentage exceeds your limit of ${maxDiscount}%`, 403);
  }
  const cart = carts.get(userId);
  if (!cart || cart.items.length === 0) {
    throw new AppError('Cart is empty', 400);
  }
  cart.discount = { type, value, reason: reason || null };
  carts.set(userId, cart);
  await audit('CART_DISCOUNT_APPLIED', userId, {
    ip: req.ip,
    details: { type, value, reason }
  });
  res.json({
    status: 'success',
    message: `Discount of ${value}${type === 'percentage' ? '%' : ' ETB'} applied`
  });
});
exports.removeCartDiscount = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const cart = carts.get(userId);
  if (cart) {
    cart.discount = { type: null, value: 0 };
    carts.set(userId, cart);
  }
  res.json({
    status: 'success',
    message: 'Discount removed'
  });
});
exports.checkout = catchAsync(async (req, res) => {
  const {
    customerId,
    customer,
    paymentMethod,
    amountPaid,
    paymentReference,
    notes
  } = req.body;
  const userId = req.user.id;
  const ip = req.ip;
  const cart = carts.get(userId);
  if (!cart || cart.items.length === 0) {
    throw new AppError('Cart is empty', 400);
  }
  let subtotal = 0;
  for (const item of cart.items) {
    subtotal += item.quantity * item.unitPrice;
  }
  const taxRate = 0.15;
  let discountAmount = 0;
  if (cart.discount.type === 'percentage') {
    discountAmount = subtotal * (cart.discount.value / 100);
  } else if (cart.discount.type === 'fixed') {
    discountAmount = Math.min(cart.discount.value, subtotal);
  }
  const taxAmount = (subtotal - discountAmount) * taxRate;
  const totalAmount = subtotal - discountAmount + taxAmount;
  if (paymentMethod === 'Cash' && amountPaid < totalAmount) {
    throw new AppError(`Amount paid (${amountPaid} ETB) is less than total (${totalAmount} ETB)`, 400);
  }
  if (paymentMethod === 'Credit' && !customerId) {
    throw new AppError('A customer must be selected for credit sales', 400);
  }
  // FR validation: paymentReference is mandatory for electronic/non-cash payment methods
  const referencedMethods = ['Bank Transfer', 'Telebirr', 'Check'];
  if (referencedMethods.includes(paymentMethod) && !paymentReference) {
    throw new AppError(
      `A payment reference number is required for ${paymentMethod} transactions.`,
      400
    );
  }
  const changeAmount = paymentMethod === 'Cash' ? amountPaid - totalAmount : 0;
  let finalCustomerId = customerId;
  if (!finalCustomerId && customer) {
    const [newCustomerId] = await db('customers').insert({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || null,
      customer_type_id: 5, 
      created_by: userId,
      created_at: db.fn.now()
    });
    finalCustomerId = newCustomerId;
  }
  const invoiceNumber = await generateOrderNumber('INV');
  const saleStatusCode = paymentMethod === 'Credit' ? 'pending_payment' : 'completed';
  let completedStatus = await db('sale_statuses').where('status_code', saleStatusCode).first();
  if (!completedStatus) {
    completedStatus = await db('sale_statuses').where('status_code', 'completed').first();
  }
  const paymentMethodRecord = await db('payment_methods').where('name', paymentMethod).first();
  if (!paymentMethodRecord) {
    throw new AppError(`Payment method '${paymentMethod}' is not configured in the database`, 400);
  }
  const result = await transaction(async (trx) => {
    const [saleId] = await trx('pos_sales').insert({
      invoice_number: invoiceNumber,
      customer_id: finalCustomerId || null,
      subtotal: subtotal,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      payment_method_id: paymentMethodRecord.id,
      payment_reference: paymentReference || null,
      amount_paid: paymentMethod === 'Credit' ? 0 : amountPaid,
      change_amount: changeAmount,
      cashier_id: userId,
      sale_date: db.fn.now(),
      status_id: completedStatus.id,
      notes: notes || null
    });
    if (paymentMethod === 'Credit' && finalCustomerId) {
      await trx('customers')
        .where('id', finalCustomerId)
        .increment('current_balance', totalAmount);
    }
    for (const item of cart.items) {
      await trx('pos_items').insert({
        sale_id: saleId,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount_percent: 0,
        subtotal: item.quantity * item.unitPrice,
        total: item.quantity * item.unitPrice
      });
      const currentStock = await trx('inventory')
        .where('product_id', item.productId)
        .first();
      if (currentStock) {
        const newQuantity = currentStock.quantity - item.quantity;
        await trx('inventory')
          .where('product_id', item.productId)
          .update({
            quantity: newQuantity,
            last_updated: db.fn.now()
          });
        await trx('inventory_movements').insert({
          product_id: item.productId,
          transaction_type: 'Sale',
          quantity_change: -item.quantity,
          quantity_before: currentStock.quantity,
          quantity_after: newQuantity,
          reference_type: 'POS',
          reference_id: saleId,
          performed_by: userId,
          created_at: db.fn.now()
        });
      }
    }
    return saleId;
  });
  carts.delete(userId);
  await audit('SALE_COMPLETED', result, {
    ip,
    details: {
      invoiceNumber,
      totalAmount,
      paymentMethod,
      itemCount: cart.items.length
    }
  });
  if (finalCustomerId) {
    const customerRecord = await db('customers').where('id', finalCustomerId).first();
    if (customerRecord && customerRecord.phone) {
      await sendSMS({
        to: customerRecord.phone,
        message: `Receipt: ${invoiceNumber} | Amount: ${totalAmount} ETB | Thank you for your purchase!`
      }).catch(err => console.error('Failed to send SMS receipt:', err.message));
    }
  }
  res.status(201).json({
    status: 'success',
    message: 'Sale completed successfully',
    data: {
      saleId: result,
      invoiceNumber,
      totalAmount,
      changeAmount,
      paymentMethod,
      itemsSold: cart.items.length
    }
  });
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
