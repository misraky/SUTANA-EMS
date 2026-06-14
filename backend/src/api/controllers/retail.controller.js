const { db, transaction } = require('../../config/database');
const AppError = require('../../utils/AppError');
const { catchAsync } = require('../../utils/catchAsync');
const { generateOrderNumber } = require('../../utils/orderNumber');

const imgUrl = (file) => file ? `/uploads/products/${file.filename}` : null;

// ── Helpers ────────────────────────────────────────────────────

const getCartForUser = async (userId) => {
  return db('retail_cart_items')
    .select('retail_cart_items.*', 'retail_products.name', 'retail_products.price', 'retail_products.stock_quantity', 'retail_products.product_image', 'retail_products.sku')
    .join('retail_products', 'retail_cart_items.product_id', 'retail_products.id')
    .where('retail_cart_items.user_id', userId);
};

// =============================================================
// PUBLIC Endpoints (No login required)
// =============================================================

exports.getProducts = catchAsync(async (req, res) => {
  const { category_id, search, page = 1, limit = 30 } = req.query;
  const offset = (page - 1) * limit;
  let query = db('retail_products')
    .select('retail_products.*', 'retail_categories.name as category_name')
    .leftJoin('retail_categories', 'retail_products.category_id', 'retail_categories.id')
    .where('retail_products.is_active', true);
  if (category_id) query = query.andWhere('retail_products.category_id', category_id);
  if (search) {
    query = query.andWhere(q => {
      q.where('retail_products.name', 'like', `%${search}%`)
       .orWhere('retail_products.sku', 'like', `%${search}%`)
       .orWhere('retail_products.description', 'like', `%${search}%`);
    });
  }
  const total = await query.clone().clearSelect().count('retail_products.id as count').first();
  const products = await query.orderBy('retail_products.name').limit(parseInt(limit)).offset(offset);
  res.json({ status: 'success', data: { products, pagination: { page: parseInt(page), limit: parseInt(limit), total: parseInt(total.count) } } });
});

exports.getProductById = catchAsync(async (req, res) => {
  const product = await db('retail_products')
    .select('retail_products.*', 'retail_categories.name as category_name')
    .leftJoin('retail_categories', 'retail_products.category_id', 'retail_categories.id')
    .where('retail_products.id', req.params.id)
    .first();
  if (!product) throw new AppError('Product not found', 404);
  res.json({ status: 'success', data: product });
});

exports.getCategories = catchAsync(async (req, res) => {
  const categories = await db('retail_categories').where({ is_active: true }).orderBy('name');
  res.json({ status: 'success', data: categories });
});

exports.trackOrder = catchAsync(async (req, res) => {
  const { invoice_number } = req.body || req.query;
  if (!invoice_number) throw new AppError('Invoice number is required', 400);
  const order = await db('retail_orders').where({ invoice_number }).first();
  if (!order) throw new AppError('Order not found', 404);
  order.items = await db('retail_order_items')
    .select('retail_order_items.*', 'retail_products.name as product_name')
    .join('retail_products', 'retail_order_items.product_id', 'retail_products.id')
    .where('order_id', order.id);
  res.json({ status: 'success', data: order });
});

// =============================================================
// CUSTOMER Endpoints (Login required)
// =============================================================

exports.getCart = catchAsync(async (req, res) => {
  const items = await getCartForUser(req.user.id);
  const subtotal = items.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);
  const tax = subtotal * 0.15;
  res.json({ status: 'success', data: { items, subtotal, tax, total: subtotal + tax } });
});

exports.addToCart = catchAsync(async (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  const product = await db('retail_products').where({ id: product_id, is_active: true }).first();
  if (!product) throw new AppError('Product not found', 404);

  const existing = await db('retail_cart_items').where({ user_id: req.user.id, product_id }).first();
  if (existing) {
    const newQty = existing.quantity + parseInt(quantity);
    if (newQty > product.stock_quantity) throw new AppError(`Only ${product.stock_quantity} available`, 400);
    await db('retail_cart_items').where({ id: existing.id }).update({ quantity: newQty });
  } else {
    if (parseInt(quantity) > product.stock_quantity) throw new AppError(`Only ${product.stock_quantity} available`, 400);
    await db('retail_cart_items').insert({ user_id: req.user.id, product_id, quantity: parseInt(quantity) });
  }
  const items = await getCartForUser(req.user.id);
  res.json({ status: 'success', message: 'Added to cart', data: { items } });
});

exports.updateCartItem = catchAsync(async (req, res) => {
  const { quantity } = req.body;
  const item = await db('retail_cart_items').where({ id: req.params.id, user_id: req.user.id }).first();
  if (!item) throw new AppError('Cart item not found', 404);
  const product = await db('retail_products').where({ id: item.product_id }).first();
  if (parseInt(quantity) > product.stock_quantity) throw new AppError(`Only ${product.stock_quantity} available`, 400);
  await db('retail_cart_items').where({ id: item.id }).update({ quantity: parseInt(quantity) });
  res.json({ status: 'success', message: 'Cart updated' });
});

exports.removeCartItem = catchAsync(async (req, res) => {
  await db('retail_cart_items').where({ id: req.params.id, user_id: req.user.id }).delete();
  res.json({ status: 'success', message: 'Item removed from cart' });
});

exports.clearCart = catchAsync(async (req, res) => {
  await db('retail_cart_items').where({ user_id: req.user.id }).delete();
  res.json({ status: 'success', message: 'Cart cleared' });
});

exports.placeOrder = catchAsync(async (req, res) => {
  const { delivery_type, delivery_address, delivery_fee = 0, notes } = req.body;
  const cartItems = await getCartForUser(req.user.id);
  if (cartItems.length === 0) throw new AppError('Cart is empty', 400);

  const subtotal = cartItems.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);
  const tax = subtotal * 0.15; // 15% VAT
  const total = subtotal + tax + parseFloat(delivery_fee);

  const result = await transaction(async (trx) => {
    for (const item of cartItems) {
      const updated = await trx('retail_products')
        .where({ id: item.product_id })
        .where('stock_quantity', '>=', item.quantity)
        .decrement('stock_quantity', item.quantity);
      if (!updated) throw new AppError(`Insufficient stock for "${item.name}"`, 400);
    }

    const invoice_number = await generateOrderNumber('RET');
    const [orderId] = await trx('retail_orders').insert({
      customer_id: req.user.id,
      invoice_number, subtotal, tax, delivery_fee, total_amount: total,
      status: 'PROCESSING', payment_status: 'AWAITING_PAYMENT',
      delivery_type: delivery_type || 'pickup',
      delivery_address: delivery_address || null,
      notes: notes || null,
      created_at: db.fn.now(), updated_at: db.fn.now()
    });

    for (const item of cartItems) {
      await trx('retail_order_items').insert({
        order_id: orderId, product_id: item.product_id,
        quantity: item.quantity, unit_price: item.price, subtotal: parseFloat(item.price) * item.quantity
      });
    }

    await trx('retail_cart_items').where({ user_id: req.user.id }).delete();
    return { orderId, invoice_number, total_amount: total };
  });

  res.status(201).json({ status: 'success', message: 'Order placed!', data: result });
});

exports.getMyOrders = catchAsync(async (req, res) => {
  const orders = await db('retail_orders').where({ customer_id: req.user.id }).orderBy('created_at', 'desc');
  for (const order of orders) {
    order.items = await db('retail_order_items')
      .select('retail_order_items.*', 'retail_products.name as product_name', 'retail_products.product_image')
      .join('retail_products', 'retail_order_items.product_id', 'retail_products.id')
      .where('order_id', order.id);
  }
  res.json({ status: 'success', data: orders });
});

// =============================================================
// CASHIER Endpoints
// =============================================================

exports.openShift = catchAsync(async (req, res) => {
  const { opening_float, shift_type } = req.body;
  const existing = await db('retail_shifts').where({ cashier_id: req.user.id, status: 'OPEN' }).first();
  if (existing) return res.status(400).json({ status: 'error', message: 'You already have an open shift' });

  const [id] = await db('retail_shifts').insert({
    cashier_id: req.user.id, shift_type: shift_type || 'morning',
    opening_float: parseFloat(opening_float || 0), status: 'OPEN',
    opened_at: db.fn.now(), created_at: db.fn.now(), updated_at: db.fn.now()
  });
  const shift = await db('retail_shifts').where({ id }).first();
  res.status(201).json({ status: 'success', data: shift });
});

exports.getCurrentShift = catchAsync(async (req, res) => {
  const shift = await db('retail_shifts').where({ cashier_id: req.user.id, status: 'OPEN' }).first();
  res.json({ status: 'success', data: shift || null });
});

exports.getShiftHistory = catchAsync(async (req, res) => {
  const shifts = await db('retail_shifts').where({ cashier_id: req.user.id }).orderBy('created_at', 'desc').limit(20);
  res.json({ status: 'success', data: shifts });
});

exports.posCheckout = catchAsync(async (req, res) => {
  const { items, payment_method, payment_ref, discount_percent = 0, customer_phone } = req.body;
  if (!items || items.length === 0) throw new AppError('Cart items are required', 400);

  const shift = await db('retail_shifts').where({ cashier_id: req.user.id, status: 'OPEN' }).first();
  if (!shift) throw new AppError('No open shift. Open a shift first.', 400);

  if (parseFloat(discount_percent) > 5) throw new AppError('Discounts above 5% require manager approval', 400);

  const result = await transaction(async (trx) => {
    let total_amount = 0;
    const resolvedItems = [];

    for (const item of items) {
      const product = await trx('retail_products').where({ id: item.product_id }).forUpdate().first();
      if (!product) throw new AppError(`Product ID ${item.product_id} not found`, 404);
      if (product.stock_quantity < item.quantity) throw new AppError(`Insufficient stock for "${product.name}"`, 400);
      total_amount += product.price * item.quantity;
      resolvedItems.push({ product, quantity: item.quantity });
    }

    const discountAmount = total_amount * (parseFloat(discount_percent) / 100);
    const finalTotal = total_amount - discountAmount;
    const invoice_number = await generateOrderNumber('POS');

    const [txId] = await trx('retail_transactions').insert({
      shift_id: shift.id, invoice_number, total_amount: finalTotal,
      payment_method, payment_ref: payment_ref || null,
      discount_percent: parseFloat(discount_percent),
      discount_amount: discountAmount, customer_phone: customer_phone || null,
      created_at: db.fn.now()
    });

    for (const { product, quantity } of resolvedItems) {
      const updated = await trx('retail_products')
        .where({ id: product.id }).where('stock_quantity', '>=', quantity)
        .decrement('stock_quantity', quantity);
      if (!updated) throw new AppError(`Race condition for "${product.name}"`, 409);
    }

    return { txId, invoice_number, total_amount: finalTotal, discount_amount: discountAmount };
  });

  // Update shift totals
  const payments = { cash: 0, telebirr: 0, bank_transfer: 0, credit: 0 };
  payments[payment_method] = parseFloat(result.total_amount);
  await db('retail_shifts').where({ id: shift.id }).increment({
    total_sales: result.total_amount, transaction_count: 1,
    cash_collected: payments.cash, telebirr_collected: payments.telebirr,
    transfer_collected: payments.bank_transfer, credit_collected: payments.credit
  });

  res.status(201).json({ status: 'success', message: 'Sale completed!', data: result });
});

exports.closeShift = catchAsync(async (req, res) => {
  const { physical_cash_counted, difference_reason } = req.body;
  const shift = await db('retail_shifts').where({ cashier_id: req.user.id, status: 'OPEN' }).first();
  if (!shift) throw new AppError('No open shift found', 404);

  const expectedCash = parseFloat(shift.opening_float) + parseFloat(shift.cash_collected);
  const counted = parseFloat(physical_cash_counted || 0);
  const difference = counted - expectedCash;

  await db('retail_shifts').where({ id: shift.id }).update({
    physical_cash_counted: counted, difference_amount: difference,
    difference_reason: difference_reason || null,
    status: 'CLOSED', closed_at: db.fn.now(), updated_at: db.fn.now()
  });

  res.json({ status: 'success', message: 'Shift closed', data: { opening_float: shift.opening_float, cash_collected: shift.cash_collected, expected_cash: expectedCash, physical_cash_counted: counted, difference, cash_to_handover: shift.cash_collected } });
});

exports.getTransactions = catchAsync(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const shift = await db('retail_shifts').where({ cashier_id: req.user.id, status: 'OPEN' }).first();
  if (!shift) return res.json({ status: 'success', data: { transactions: [] } });
  const transactions = await db('retail_transactions').where({ shift_id: shift.id }).orderBy('created_at', 'desc');
  res.json({ status: 'success', data: { transactions } });
});

// =============================================================
// INVENTORY / STORE KEEPER Endpoints
// =============================================================

exports.getInventory = catchAsync(async (req, res) => {
  const { search, category_id, low_stock } = req.query;
  let query = db('retail_products as rp')
    .select('rp.*', 'rc.name as category_name')
    .leftJoin('retail_categories as rc', 'rp.category_id', 'rc.id');
  if (search) query = query.where(q => q.where('rp.name', 'like', `%${search}%`).orWhere('rp.sku', 'like', `%${search}%`));
  if (category_id) query = query.where('rp.category_id', category_id);
  if (low_stock === 'true') query = query.whereRaw('rp.stock_quantity <= rp.reorder_level');
  const products = await query.orderBy('rp.name');
  res.json({ status: 'success', data: products });
});

exports.updateStock = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { quantity, operation = 'set' } = req.body;
  const product = await db('retail_products').where({ id }).first();
  if (!product) throw new AppError('Product not found', 404);

  let newQty;
  if (operation === 'add') newQty = product.stock_quantity + parseInt(quantity);
  else if (operation === 'subtract') newQty = Math.max(0, product.stock_quantity - parseInt(quantity));
  else newQty = parseInt(quantity);

  await db('retail_products').where({ id }).update({ stock_quantity: newQty, updated_at: db.fn.now() });
  res.json({ status: 'success', message: `Stock updated to ${newQty}`, data: { id, new_quantity: newQty, previous: product.stock_quantity } });
});

exports.createProduct = catchAsync(async (req, res) => {
  const { name, sku, category_id, description, price, cost_price, stock_quantity, reorder_level } = req.body;
  if (!name || !sku || !price) throw new AppError('Name, SKU, and price are required', 400);
  const existing = await db('retail_products').where({ sku }).first();
  if (existing) throw new AppError('SKU already exists', 400);
  const [id] = await db('retail_products').insert({
    name, sku, category_id: category_id || null, description: description || null,
    price: parseFloat(price), cost_price: parseFloat(cost_price || 0),
    stock_quantity: parseInt(stock_quantity || 0), reorder_level: parseInt(reorder_level || 10),
    product_image: imgUrl(req.file), is_active: true,
    created_at: db.fn.now(), updated_at: db.fn.now()
  });
  const product = await db('retail_products').where({ id }).first();
  res.status(201).json({ status: 'success', message: 'Product created', data: product });
});

exports.updateProduct = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updates = {};
  ['name', 'sku', 'category_id', 'description', 'price', 'cost_price', 'reorder_level', 'is_active'].forEach(k => {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  });
  if (req.file) updates.product_image = imgUrl(req.file);
  if (Object.keys(updates).length === 0) throw new AppError('No fields to update', 400);
  updates.updated_at = db.fn.now();
  await db('retail_products').where({ id }).update(updates);
  const product = await db('retail_products').where({ id }).first();
  res.json({ status: 'success', message: 'Product updated', data: product });
});

// =============================================================
// RETAIL MANAGER Endpoints
// =============================================================

exports.getManagerDashboard = catchAsync(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const transactions = await db('retail_transactions').whereRaw(`DATE(created_at) = ?`, [today]);
  const total = transactions.reduce((s, t) => s + parseFloat(t.total_amount), 0);
  const byMethod = { cash: 0, bank_transfer: 0, telebirr: 0, credit: 0 };
  transactions.forEach(t => { byMethod[t.payment_method] = (byMethod[t.payment_method] || 0) + parseFloat(t.total_amount); });
  const openShifts = await db('retail_shifts').where({ status: 'OPEN' }).count('id as count').first();
  const lowStock = await db('retail_products').whereRaw('stock_quantity <= reorder_level').where('is_active', true).count('id as count').first();
  const criticalStock = await db('retail_products').whereRaw('stock_quantity <= reorder_level * 0.5').where('is_active', true).count('id as count').first();

  res.json({ status: 'success', data: {
    totalSales: total, transactionCount: transactions.length, cashSales: byMethod.cash,
    creditSales: byMethod.credit, transferSales: byMethod.bank_transfer + byMethod.telebirr,
    avgTransaction: transactions.length > 0 ? total / transactions.length : 0,
    openShifts: parseInt(openShifts.count), lowStockItems: parseInt(lowStock.count), criticalStockItems: parseInt(criticalStock.count)
  }});
});

exports.getSalesTrends = catchAsync(async (req, res) => {
  const { period = 'daily' } = req.query;
  let groupBy, dateFormat;
  if (period === 'weekly') { groupBy = db.raw("DATE_FORMAT(created_at, '%x-W%v')"); dateFormat = 'YYYY-WW'; }
  else if (period === 'monthly') { groupBy = db.raw("DATE_FORMAT(created_at, '%Y-%m')"); dateFormat = 'YYYY-MM'; }
  else { groupBy = db.raw("DATE(created_at)"); dateFormat = 'YYYY-MM-DD'; }

  const trends = await db('retail_transactions')
    .select(groupBy, db.raw('SUM(total_amount) as revenue'), db.raw('COUNT(*) as count'))
    .groupBy(groupBy).orderBy('created_at', 'desc').limit(30);
  res.json({ status: 'success', data: { trends, period, dateFormat } });
});

exports.getCashierActivity = catchAsync(async (req, res) => {
  const cashiers = await db('retail_shifts as rs')
    .select('rs.*', 'u.full_name as cashier_name')
    .leftJoin('users as u', 'rs.cashier_id', 'u.id')
    .whereRaw('DATE(rs.created_at) = CURDATE()')
    .orderBy('rs.created_at', 'desc');
  res.json({ status: 'success', data: cashiers });
});

exports.approveDiscount = catchAsync(async (req, res) => {
  const { transaction_id, approval_code } = req.body;
  if (approval_code !== 'MGR-APPROVE') throw new AppError('Invalid approval code', 400);
  res.json({ status: 'success', message: 'Discount approved' });
});

exports.approveRefund = catchAsync(async (req, res) => {
  const { transaction_id, amount, reason } = req.body;
  const tx = await db('retail_transactions').where({ id: transaction_id }).first();
  if (!tx) throw new AppError('Transaction not found', 404);
  res.json({ status: 'success', message: `Refund of ${amount} ETB approved for transaction ${tx.invoice_number}` });
});

exports.verifyShift = catchAsync(async (req, res) => {
  const { shift_id, verified } = req.body;
  const status = verified ? 'VERIFIED' : 'CLOSED';
  await db('retail_shifts').where({ id: shift_id }).update({ status, updated_at: db.fn.now() });
  res.json({ status: 'success', message: `Shift ${verified ? 'verified' : 'rejected'}` });
});

// =============================================================
// FINANCE Endpoints
// =============================================================

exports.getReconciliation = catchAsync(async (req, res) => {
  const { date } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];
  const shifts = await db('retail_shifts').whereRaw(`DATE(created_at) = ?`, [targetDate]).where('status', '!=', 'OPEN');
  const transactions = await db('retail_transactions').whereRaw(`DATE(created_at) = ?`, [targetDate]);
  const totalSystem = transactions.reduce((s, t) => s + parseFloat(t.total_amount), 0);
  const byMethod = { cash: 0, bank_transfer: 0, telebirr: 0, credit: 0 };
  transactions.forEach(t => { byMethod[t.payment_method] = (byMethod[t.payment_method] || 0) + parseFloat(t.total_amount); });
  res.json({ status: 'success', data: {
    date: targetDate, totalSystemSales: totalSystem, byMethod,
    shifts, transactionCount: transactions.length,
    totalCashCollected: shifts.reduce((s, sh) => s + parseFloat(sh.cash_collected), 0),
    totalCashCounted: shifts.reduce((s, sh) => s + parseFloat(sh.physical_cash_counted || 0), 0),
    totalDifference: shifts.reduce((s, sh) => s + parseFloat(sh.difference_amount || 0), 0)
  }});
});

exports.recordDeposit = catchAsync(async (req, res) => {
  const { amount, bank_account, reference, notes } = req.body;
  res.status(201).json({ status: 'success', message: `Deposit of ${amount} ETB recorded to ${bank_account}`, data: { amount, bank_account, reference, notes, recorded_at: new Date().toISOString() } });
});

exports.getAuditLog = catchAsync(async (req, res) => {
  const logs = await db('retail_transactions')
    .select('retail_transactions.*', 'u.full_name as cashier_name')
    .leftJoin('users as u', 'retail_transactions.cashier_id', 'u.id')
    .orderBy('retail_transactions.created_at', 'desc').limit(100);
  res.json({ status: 'success', data: logs });
});

exports.approveVoid = catchAsync(async (req, res) => {
  const { transaction_id, reason } = req.body;
  const tx = await db('retail_transactions').where({ id: transaction_id }).first();
  if (!tx) throw new AppError('Transaction not found', 404);
  res.json({ status: 'success', message: `Transaction ${tx.invoice_number} voided. Reason: ${reason || 'No reason given'}` });
});

// =============================================================
// ADMIN: Products & Categories management
// =============================================================

exports.createCategory = catchAsync(async (req, res) => {
  const { name, description, icon_class } = req.body;
  if (!name) throw new AppError('Category name is required', 400);
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const [id] = await db('retail_categories').insert({ name, slug, description: description || null, icon_class: icon_class || null });
  const cat = await db('retail_categories').where({ id }).first();
  res.status(201).json({ status: 'success', data: cat });
});
