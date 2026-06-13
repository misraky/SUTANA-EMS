const { db, transaction } = require('../../config/database');
const AppError = require('../../utils/AppError');

const generateInvoiceNumber = async (prefix, trx, table) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const lastRecord = await trx(table)
    .where('invoice_number', 'like', `${prefix}-${dateStr}-%`)
    .orderBy('invoice_number', 'desc')
    .first();
  let counter = 1;
  if (lastRecord) {
    const parts = lastRecord.invoice_number.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) counter = lastSeq + 1;
  }
  return `${prefix}-${dateStr}-${counter.toString().padStart(4, '0')}`;
};

const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// =============================================================
// PUBLIC Endpoints (No login required)
// =============================================================

exports.getCategories = catchAsync(async (req, res) => {
  const categories = await db('farming_categories').where({ is_active: true }).orderBy('name');
  res.json({ status: 'success', data: categories });
});

exports.getProducts = catchAsync(async (req, res) => {
  const { category_id, search } = req.query;
  let query = db('farming_products')
    .select('farming_products.*', 'farming_categories.name as category_name')
    .leftJoin('farming_categories', 'farming_products.category_id', 'farming_categories.id')
    .where('farming_products.is_active', true);
  if (category_id) query = query.andWhere('farming_products.category_id', category_id);
  if (search) {
    query = query.andWhere((q) => {
      q.where('farming_products.name', 'like', `%${search}%`)
       .orWhere('farming_products.description', 'like', `%${search}%`);
    });
  }
  const products = await query.orderBy('farming_products.name');
  res.json({ status: 'success', data: products });
});

// =============================================================
// CUSTOMER Endpoints (Login required)
// =============================================================

exports.createOrder = catchAsync(async (req, res) => {
  const { items, delivery_type, delivery_address, delivery_fee } = req.body;
  const customer_id = req.user.id;
  if (!items || items.length === 0) {
    return res.status(400).json({ status: 'error', message: 'Order items are required' });
  }

  const result = await transaction(async (trx) => {
    let total_amount = 0;
    const resolvedItems = [];

    for (const item of items) {
      // Lock the row to prevent double-selling
      const product = await trx('farming_products').where({ id: item.product_id }).forUpdate().first();
      if (!product) throw new AppError(`Product ${item.product_id} not found`, 404);
      if (product.stock_quantity < item.quantity) {
        throw new AppError(`Insufficient stock for "${product.name}". Available: ${product.stock_quantity}`, 400);
      }
      total_amount += (product.price * item.quantity);
      resolvedItems.push({ product, quantity: item.quantity });
    }

    total_amount += parseFloat(delivery_fee || 0);
    const invoice_number = await generateInvoiceNumber('FRM', trx, 'farming_orders');

    const [orderId] = await trx('farming_orders').insert({
      customer_id,
      invoice_number,
      total_amount,
      status: 'AWAITING_PAYMENT',
      payment_method: 'awaiting',
      delivery_type: delivery_type || 'pickup',
      delivery_address: delivery_address || null,
      delivery_fee: delivery_fee || 0,
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    });

    for (const { product, quantity } of resolvedItems) {
      await trx('farming_order_items').insert({
        order_id: orderId,
        product_id: product.id,
        quantity,
        unit_price: product.price,
        subtotal: product.price * quantity
      });
      // Atomic stock decrement with safety check
      const updated = await trx('farming_products')
        .where({ id: product.id })
        .where('stock_quantity', '>=', quantity)
        .decrement('stock_quantity', quantity);
      if (!updated) throw new AppError(`Race condition detected for "${product.name}". Please retry.`, 409);
    }

    return { orderId, invoice_number, total_amount };
  });

  res.status(201).json({ status: 'success', message: 'Order created. Please proceed to payment.', data: result });
});

exports.getCustomerOrders = catchAsync(async (req, res) => {
  const customer_id = req.user.id;
  const orders = await db('farming_orders').where({ customer_id }).orderBy('created_at', 'desc');
  for (let order of orders) {
    order.items = await db('farming_order_items')
      .select('farming_order_items.*', 'farming_products.name as product_name', 'farming_products.product_image')
      .join('farming_products', 'farming_order_items.product_id', 'farming_products.id')
      .where('order_id', order.id);
  }
  res.json({ status: 'success', data: orders });
});

// =============================================================
// FARMING MANAGER / WORKER Endpoints
// =============================================================

// --- Product Management ---

exports.getAllProductsAdmin = catchAsync(async (req, res) => {
  const { category_id, search, include_inactive } = req.query;
  let query = db('farming_products')
    .select('farming_products.*', 'farming_categories.name as category_name')
    .leftJoin('farming_categories', 'farming_products.category_id', 'farming_categories.id');
  if (!include_inactive) query = query.where('farming_products.is_active', true);
  if (category_id) query = query.andWhere('farming_products.category_id', category_id);
  if (search) {
    query = query.andWhere((q) => {
      q.where('farming_products.name', 'like', `%${search}%`)
       .orWhere('farming_products.description', 'like', `%${search}%`);
    });
  }
  const products = await query.orderBy('farming_products.name');
  res.json({ status: 'success', data: products });
});

exports.createProduct = catchAsync(async (req, res) => {
  const { name, category_id, description, usage_instructions, price, stock_quantity, reorder_level } = req.body;
  if (!name || !price) throw new AppError('Product name and price are required', 400);

  const [id] = await db('farming_products').insert({
    name,
    category_id: category_id || null,
    description: description || null,
    usage_instructions: usage_instructions || null,
    price: parseFloat(price),
    stock_quantity: parseInt(stock_quantity || 0),
    reorder_level: parseInt(reorder_level || 10),
    is_active: true,
    created_at: db.fn.now(),
    updated_at: db.fn.now()
  });
  const product = await db('farming_products').where({ id }).first();
  res.status(201).json({ status: 'success', message: 'Product created', data: product });
});

exports.updateProduct = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, category_id, description, usage_instructions, price, reorder_level, is_active } = req.body;
  const product = await db('farming_products').where({ id }).first();
  if (!product) throw new AppError('Product not found', 404);

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (category_id !== undefined) updates.category_id = category_id;
  if (description !== undefined) updates.description = description;
  if (usage_instructions !== undefined) updates.usage_instructions = usage_instructions;
  if (price !== undefined) updates.price = parseFloat(price);
  if (reorder_level !== undefined) updates.reorder_level = parseInt(reorder_level);
  if (is_active !== undefined) updates.is_active = is_active;
  updates.updated_at = db.fn.now();

  await db('farming_products').where({ id }).update(updates);
  const updated = await db('farming_products').where({ id }).first();
  res.json({ status: 'success', message: 'Product updated', data: updated });
});

exports.updateStock = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { quantity, operation, notes } = req.body; // operation: 'add' | 'subtract' | 'set'
  const product = await db('farming_products').where({ id }).first();
  if (!product) throw new AppError('Product not found', 404);

  let newStock;
  if (operation === 'set') {
    newStock = parseInt(quantity);
  } else if (operation === 'subtract') {
    newStock = product.stock_quantity - parseInt(quantity);
    if (newStock < 0) throw new AppError('Stock cannot go below zero', 400);
  } else {
    // default: add
    newStock = product.stock_quantity + parseInt(quantity);
  }

  await db('farming_products').where({ id }).update({
    stock_quantity: newStock,
    updated_at: db.fn.now()
  });

  res.json({
    status: 'success',
    message: `Stock updated. New quantity: ${newStock}`,
    data: { id: parseInt(id), previous: product.stock_quantity, new: newStock, operation, notes }
  });
});

exports.createCategory = catchAsync(async (req, res) => {
  const { name, description, icon_class } = req.body;
  if (!name) throw new AppError('Category name is required', 400);
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const existing = await db('farming_categories').where({ slug }).first();
  if (existing) throw new AppError('Category with this name already exists', 400);

  const [id] = await db('farming_categories').insert({
    name, slug, description: description || null,
    icon_class: icon_class || null, is_active: true, created_at: db.fn.now()
  });
  const category = await db('farming_categories').where({ id }).first();
  res.status(201).json({ status: 'success', message: 'Category created', data: category });
});

// --- Orders Management ---

exports.getAllOrders = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 30, search } = req.query;
  const offset = (page - 1) * limit;

  let query = db('farming_orders')
    .leftJoin('users', 'farming_orders.customer_id', 'users.id')
    .select(
      'farming_orders.*',
      'users.full_name as customer_name',
      'users.phone as customer_phone'
    );

  if (status) query = query.where('farming_orders.status', status);
  if (search) {
    query = query.andWhere((q) => {
      q.where('farming_orders.invoice_number', 'like', `%${search}%`)
       .orWhere('users.full_name', 'like', `%${search}%`);
    });
  }

  const total = await query.clone().clearSelect().count('farming_orders.id as total').first();
  const orders = await query.orderBy('farming_orders.created_at', 'desc').limit(limit).offset(offset);

  for (let order of orders) {
    order.items = await db('farming_order_items')
      .select('farming_order_items.*', 'farming_products.name as product_name')
      .join('farming_products', 'farming_order_items.product_id', 'farming_products.id')
      .where('order_id', order.id);
  }

  res.json({
    status: 'success',
    data: {
      orders,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: parseInt(total.total) }
    }
  });
});

exports.updateOrderStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status, payment_method } = req.body;

  const validStatuses = ['PROCESSING', 'AWAITING_PAYMENT', 'CONFIRMED', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED'];
  if (!validStatuses.includes(status)) throw new AppError('Invalid status', 400);

  const order = await db('farming_orders').where({ id }).first();
  if (!order) throw new AppError('Order not found', 404);

  const updates = { status, updated_at: db.fn.now() };
  if (payment_method) updates.payment_method = payment_method;

  await db('farming_orders').where({ id }).update(updates);

  // If cancelled and was not yet completed, restore stock
  if (status === 'CANCELLED' && order.status !== 'COMPLETED') {
    const items = await db('farming_order_items').where('order_id', id);
    await transaction(async (trx) => {
      for (const item of items) {
        await trx('farming_products').where({ id: item.product_id }).increment('stock_quantity', item.quantity);
      }
    });
  }

  res.json({ status: 'success', message: `Order status updated to ${status}` });
});

// --- POS (Walk-in Sales) ---

exports.posCheckout = catchAsync(async (req, res) => {
  const { items, payment_method } = req.body;
  if (!items || items.length === 0) {
    return res.status(400).json({ status: 'error', message: 'Cart items are required' });
  }
  if (!['cash', 'telebirr', 'bank_transfer'].includes(payment_method)) {
    return res.status(400).json({ status: 'error', message: 'Invalid payment method' });
  }

  const result = await transaction(async (trx) => {
    let total_amount = 0;
    const resolvedItems = [];

    for (const item of items) {
      // FOR UPDATE lock prevents double-selling
      const product = await trx('farming_products').where({ id: item.product_id }).forUpdate().first();
      if (!product) throw new AppError(`Product ID ${item.product_id} not found`, 404);
      if (product.stock_quantity < item.quantity) {
        throw new AppError(`Insufficient stock for "${product.name}". Only ${product.stock_quantity} remaining.`, 400);
      }
      total_amount += (product.price * item.quantity);
      resolvedItems.push({ product, quantity: item.quantity });
    }

    const invoice_number = await generateInvoiceNumber('FRM', trx, 'farming_orders');
    const [orderId] = await trx('farming_orders').insert({
      invoice_number,
      total_amount,
      status: 'COMPLETED',
      payment_method,
      delivery_type: 'pickup',
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    });

    for (const { product, quantity } of resolvedItems) {
      await trx('farming_order_items').insert({
        order_id: orderId,
        product_id: product.id,
        quantity,
        unit_price: product.price,
        subtotal: product.price * quantity
      });
      const updated = await trx('farming_products')
        .where({ id: product.id })
        .where('stock_quantity', '>=', quantity)
        .decrement('stock_quantity', quantity);
      if (!updated) throw new AppError(`Race condition for "${product.name}". Please retry.`, 409);
    }

    return { orderId, invoice_number, total_amount };
  });

  res.status(201).json({ status: 'success', message: 'Sale completed!', data: result });
});

// --- Finance Report ---

exports.getDailySalesSummary = catchAsync(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const sales = await db('farming_orders')
    .where('status', 'COMPLETED')
    .whereRaw(`DATE(created_at) = ?`, [today]);

  const summary = {
    totalSales: sales.reduce((sum, o) => sum + parseFloat(o.total_amount), 0),
    transactionCount: sales.length,
    byPayment: {
      cash: sales.filter(o => o.payment_method === 'cash').reduce((sum, o) => sum + parseFloat(o.total_amount), 0),
      telebirr: sales.filter(o => o.payment_method === 'telebirr').reduce((sum, o) => sum + parseFloat(o.total_amount), 0),
      bank_transfer: sales.filter(o => o.payment_method === 'bank_transfer').reduce((sum, o) => sum + parseFloat(o.total_amount), 0)
    }
  };

  res.json({ status: 'success', data: summary });
});

exports.submitFinanceReport = catchAsync(async (req, res) => {
  const worker_id = req.user.id;
  const {
    total_system_sales, cash_collected, telebirr_collected, transfer_collected,
    physical_cash_counted, difference_amount, difference_reason,
    refunds_given, expenses_transport, expenses_loading, notes, report_date
  } = req.body;

  const [reportId] = await db('farming_finance_reports').insert({
    farming_worker_id: worker_id,
    report_date: report_date || new Date().toISOString().split('T')[0],
    total_system_sales, cash_collected, telebirr_collected, transfer_collected,
    physical_cash_counted, difference_amount: difference_amount || 0,
    difference_reason: difference_reason || null,
    refunds_given: refunds_given || 0,
    expenses_transport: expenses_transport || 0,
    expenses_loading: expenses_loading || 0,
    notes: notes || null,
    status: 'SUBMITTED',
    created_at: db.fn.now()
  });

  res.status(201).json({ status: 'success', message: 'Report submitted to Finance successfully', data: { id: reportId } });
});

// --- Overview Stats ---
exports.getOverviewStats = catchAsync(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const [todaySales] = await db('farming_orders')
    .where('status', 'COMPLETED')
    .whereRaw(`DATE(created_at) = ?`, [today])
    .sum('total_amount as total');

  const [pendingOrders] = await db('farming_orders')
    .whereIn('status', ['AWAITING_PAYMENT', 'CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'])
    .count('id as total');

  const lowStock = await db('farming_products')
    .whereRaw('stock_quantity <= reorder_level')
    .where('is_active', true)
    .select('id', 'name', 'stock_quantity', 'reorder_level');

  const [totalProducts] = await db('farming_products').where('is_active', true).count('id as total');

  res.json({
    status: 'success',
    data: {
      todaySales: parseFloat(todaySales?.total || 0),
      pendingOrders: parseInt(pendingOrders?.total || 0),
      lowStockProducts: lowStock,
      totalProducts: parseInt(totalProducts?.total || 0)
    }
  });
});
