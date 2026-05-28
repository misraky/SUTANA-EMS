const { db, transaction } = require('../config/database');
const config = require('../config/env');
const { audit } = require('../config/logger');
const { sendEmail } = require('./email.service');
const { sendSMS } = require('./sms.service');
const { AppError } = require('../utils/AppError');
const { generateOrderNumber } = require('../utils/orderNumber');
const carts = new Map();
const getProducts = async (filters) => {
  const { page = 1, limit = 50, categoryId } = filters;
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
  const total = await query.clone().count('p.id as total').first();
  const products = await query
    .orderBy('p.name', 'asc')
    .limit(limit)
    .offset(offset);
  return {
    products,
    pagination: {
      page,
      limit,
      total: parseInt(total.total),
      totalPages: Math.ceil(total.total / limit)
    }
  };
};
const searchProducts = async (query, type = 'name', categoryId = null, limit = 20) => {
  if (!query || query.length < 2) {
    return [];
  }
  let dbQuery = db('products as p')
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
    dbQuery = dbQuery.where('p.sku', 'like', `%${query}%`);
  } else {
    dbQuery = dbQuery.where('p.name', 'like', `%${query}%`);
  }
  if (categoryId) {
    dbQuery = dbQuery.where('p.category_id', categoryId);
  }
  const products = await dbQuery.limit(limit);
  return products;
};
const getProductByBarcode = async (barcode) => {
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
  return product;
};
const getCart = async (userId) => {
  const cart = carts.get(userId) || { items: [], discount: { type: null, value: 0 }, createdAt: new Date() };
  let subtotal = 0;
  for (const item of cart.items) {
    item.total = item.quantity * item.unitPrice;
    subtotal += item.total;
  }
  const taxRate = config.businessRules.taxRate / 100;
  let discountAmount = 0;
  if (cart.discount.type === 'percentage') {
    discountAmount = subtotal * (cart.discount.value / 100);
  } else if (cart.discount.type === 'fixed') {
    discountAmount = Math.min(cart.discount.value, subtotal);
  }
  const taxAmount = (subtotal - discountAmount) * taxRate;
  const totalAmount = subtotal - discountAmount + taxAmount;
  return {
    items: cart.items,
    subtotal: parseFloat(subtotal.toFixed(2)),
    discountAmount: parseFloat(discountAmount.toFixed(2)),
    taxAmount: parseFloat(taxAmount.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    discount: cart.discount,
    itemCount: cart.items.length
  };
};
const addToCart = async (userId, productId, quantity) => {
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
  return { cartItem: cart.items[cart.items.length - 1] };
};
const updateCartItem = async (userId, itemId, quantity) => {
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
  return true;
};
const removeCartItem = async (userId, itemId) => {
  const cart = carts.get(userId);
  if (!cart) {
    throw new AppError('Cart is empty', 400);
  }
  cart.items = cart.items.filter(i => i.id !== itemId);
  carts.set(userId, cart);
  return true;
};
const clearCart = async (userId) => {
  carts.delete(userId);
  return true;
};
const applyCartDiscount = async (userId, type, value, reason, userRoles) => {
  let maxDiscount = config.businessRules.cashierMaxDiscount;
  if (userRoles.includes('CEO') || userRoles.includes('Admin')) {
    maxDiscount = config.businessRules.ceoMaxDiscount;
  } else if (userRoles.includes('Finance') || userRoles.includes('Manager')) {
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
  return cart.discount;
};
const removeCartDiscount = async (userId) => {
  const cart = carts.get(userId);
  if (cart) {
    cart.discount = { type: null, value: 0 };
    carts.set(userId, cart);
  }
  return true;
};
const checkout = async (userId, checkoutData, ip) => {
  const {
    customerId,
    customer,
    paymentMethod,
    amountPaid,
    paymentReference,
    notes
  } = checkoutData;
  const cart = carts.get(userId);
  if (!cart || cart.items.length === 0) {
    throw new AppError('Cart is empty', 400);
  }
  let subtotal = 0;
  for (const item of cart.items) {
    subtotal += item.quantity * item.unitPrice;
  }
  const taxRate = config.businessRules.taxRate / 100;
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
  const completedStatus = await db('sale_statuses').where('status_code', 'completed').first();
  const paymentMethodRecord = await db('payment_methods').where('name', paymentMethod).first();
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
      amount_paid: amountPaid,
      change_amount: changeAmount,
      cashier_id: userId,
      sale_date: db.fn.now(),
      status_id: completedStatus.id,
      notes: notes || null
    });
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
  if (finalCustomerId) {
    const customerRecord = await db('customers').where('id', finalCustomerId).first();
    if (customerRecord && customerRecord.phone) {
      await sendSMS({
        to: customerRecord.phone,
        message: `Receipt: ${invoiceNumber} | Amount: ${totalAmount} ETB | Thank you for your purchase!`
      }).catch(() => {});
    }
  }
  return {
    saleId: result,
    invoiceNumber,
    totalAmount,
    changeAmount,
    paymentMethod,
    itemsSold: cart.items.length
  };
};
const getSalesHistory = async (filters) => {
  const { page = 1, limit = 25, startDate, endDate, customerId } = filters;
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
  const total = await query.clone().count('ps.id as total').first();
  const sales = await query
    .orderBy('ps.sale_date', 'desc')
    .limit(limit)
    .offset(offset);
  return {
    sales,
    pagination: {
      page,
      limit,
      total: parseInt(total.total),
      totalPages: Math.ceil(total.total / limit)
    }
  };
};
const getSaleById = async (saleId) => {
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
  return { sale, items };
};
const getReceipt = async (saleId) => {
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
  return {
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
  };
};
const voidSale = async (saleId, reason, userId, ip) => {
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
  return true;
};
const getDailyStatistics = async (date) => {
  const stats = await db('pos_sales')
    .whereDate('sale_date', date)
    .where('status', 'Completed')
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
    .whereDate('sale_date', date)
    .where('status', 'Completed')
    .select('payment_methods.name as method', db.raw('COUNT(*) as count'), db.raw('SUM(total_amount) as amount'))
    .groupBy('pos_sales.payment_method_id', 'payment_methods.name');
  return {
    date,
    statistics: {
      totalTransactions: parseInt(stats.total_transactions || 0),
      totalRevenue: parseFloat(stats.total_revenue || 0),
      averageTransaction: parseFloat(stats.average_transaction || 0),
      totalTax: parseFloat(stats.total_tax || 0),
      totalDiscount: parseFloat(stats.total_discount || 0)
    },
    paymentBreakdown
  };
};
const validateDiscount = async (discountPercent, subtotal, userRoles) => {
  let maxDiscount = config.businessRules.cashierMaxDiscount;
  if (userRoles.includes('CEO') || userRoles.includes('Admin')) {
    maxDiscount = config.businessRules.ceoMaxDiscount;
  } else if (userRoles.includes('Finance') || userRoles.includes('Manager')) {
    maxDiscount = config.businessRules.managerMaxDiscount;
  }
  const isValid = discountPercent <= maxDiscount;
  const requiresApproval = discountPercent > config.businessRules.cashierMaxDiscount && 
                           discountPercent <= config.businessRules.managerMaxDiscount;
  return {
    isValid,
    maxAllowed: maxDiscount,
    requested: discountPercent,
    requiresApproval,
    approvalRole: requiresApproval ? 'Manager' : null
  };
};
module.exports = {
  getProducts,
  searchProducts,
  getProductByBarcode,
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  applyCartDiscount,
  removeCartDiscount,
  checkout,
  getSalesHistory,
  getSaleById,
  getReceipt,
  voidSale,
  getDailyStatistics,
  validateDiscount
};
