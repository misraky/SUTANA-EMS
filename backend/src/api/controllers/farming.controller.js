const { db, transaction } = require('../../config/database');
const AppError = require('../../utils/AppError');
const { hasPermission } = require('../middleware/auth.middleware');
const notificationRepository = require('../../repositories/notification.repository');
const settingsRepository = new (require('../../repositories/settings.repository'))();

const imgUrl = (file) => file ? `/uploads/products/${file.filename}` : null;

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
  const categories = await db('product_categories as pc')
    .select('pc.*', 'fc.type')
    .leftJoin('farming_categories as fc', 'pc.name', 'fc.name')
    .where(function () {
      this.where('pc.business_unit', 'farming').orWhere('pc.business_unit', 'all');
    })
    .where('pc.is_active', true)
    .orderBy('pc.name');
  res.json({ status: 'success', data: categories });
});

exports.getProducts = catchAsync(async (req, res) => {
  const { category_id, search } = req.query;
  let query = db('products as p')
    .select(
      'p.id', 'p.name', 'p.sku',
      db.raw('p.selling_price as price'),
      'p.category_id', 'p.product_image', 'p.description',
      'p.stock_quantity', 'p.reorder_level',
      'p.is_active', 'pc.name as category_name'
    )
    .leftJoin('product_categories as pc', 'p.category_id', 'pc.id')
    .where('p.business_unit', 'farming')
    .where('p.is_active', true)
    .whereNull('p.deleted_at');
  if (category_id) query = query.andWhere('p.category_id', category_id);
  if (search) {
    query = query.andWhere((q) => {
      q.where('p.name', 'like', `%${search}%`)
       .orWhere('p.description', 'like', `%${search}%`);
    });
  }
  const products = await query.orderBy('p.name');
  res.json({ status: 'success', data: products });
});

// =============================================================
// CUSTOMER Endpoints (Login required)
// =============================================================

exports.createOrder = catchAsync(async (req, res) => {
  const { items, customer_name, customer_phone, delivery_type, delivery_address, delivery_fee } = req.body;
  const customer_id = req.user.id;
  if (!items || items.length === 0) {
    return res.status(400).json({ status: 'error', message: 'Order items are required' });
  }

  const result = await transaction(async (trx) => {
    let total_amount = 0;
    const resolvedItems = [];

    for (const item of items) {
      const product = await trx('products')
        .where({ id: item.product_id, business_unit: 'farming' })
        .forUpdate()
        .first();
      if (!product) throw new AppError(`Product ${item.product_id} not found`, 404);
      if (product.stock_quantity < item.quantity) {
        throw new AppError(`Insufficient stock for "${product.name}". Available: ${product.stock_quantity}`, 400);
      }
      total_amount += (product.selling_price * item.quantity);
      // Map to legacy farming_products id via SKU (format: FARM-{old_id})
      const oldId = parseInt((product.sku || '').replace('FARM-', ''), 10);
      const farmingProduct = oldId ? await trx('farming_products').where({ id: oldId }).first() : null;
      resolvedItems.push({ product, quantity: item.quantity, farmingProductId: farmingProduct ? farmingProduct.id : null });
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
      contact_name: customer_name || null,
      contact_phone: customer_phone || null,
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    });

    for (const { product, quantity, farmingProductId } of resolvedItems) {
      // Use legacy farming_products.id for FK constraint compatibility
      const fkId = farmingProductId || product.id;
      await trx('farming_order_items').insert({
        order_id: orderId,
        product_id: fkId,
        quantity,
        unit_price: product.selling_price,
        subtotal: product.selling_price * quantity
      });
      // Stock is NOT decremented here — it will be decremented when the
      // order is marked CONFIRMED (paid) in updateOrderStatus.
    }

    return { orderId, invoice_number, total_amount };
  });

  await notificationRepository.create({
    roleTarget: 'MANAGER',
    type: 'farming',
    title: 'New Online Order (Farming)',
    message: `Order ${result.invoice_number} received from customer.`
  });

  res.status(201).json({ status: 'success', message: 'Order created. Please proceed to payment.', data: result });
});

exports.getCustomerOrders = catchAsync(async (req, res) => {
  const customer_id = req.user.id;
  const orders = await db('farming_orders').where({ customer_id }).orderBy('created_at', 'desc');
  for (let order of orders) {
    order.items = await db('farming_order_items')
      .select('farming_order_items.*', db.raw('COALESCE(fp.name, p.name) as product_name'), db.raw('COALESCE(fp.product_image, p.product_image) as product_image'))
      .leftJoin('farming_products as fp', 'farming_order_items.product_id', 'fp.id')
      .leftJoin('products as p', 'farming_order_items.product_id', 'p.id')
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
  const workerAdd = await settingsRepository.getValue('farming_worker_can_add_products', true);
  if (req.user.roles.includes('Farming Worker') && !workerAdd) {
    throw new AppError('Product creation is disabled for workers by the manager', 403);
  }

  let product_image = imgUrl(req.file);

  const [id] = await db('farming_products').insert({
    name,
    category_id: category_id || null,
    description: description || null,
    usage_instructions: usage_instructions || null,
    product_image,
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
  const workerAdd = await settingsRepository.getValue('farming_worker_can_add_products', true);
  if (req.user.roles.includes('Farming Worker') && !workerAdd) {
    throw new AppError('Product editing is disabled for workers by the manager', 403);
  }

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (category_id !== undefined) updates.category_id = category_id;
  if (description !== undefined) updates.description = description;
  if (usage_instructions !== undefined) updates.usage_instructions = usage_instructions;
  if (price !== undefined) updates.price = parseFloat(price);
  if (reorder_level !== undefined) updates.reorder_level = parseInt(reorder_level);
  if (is_active !== undefined) updates.is_active = is_active;
  if (req.file) {
    const { deleteFile } = require('../../config/multer');
    if (product.product_image) deleteFile(product.product_image);
    updates.product_image = imgUrl(req.file);
  }
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
  // Sync to unified products table
  const unified = await db('products').where('sku', `FARM-${id}`).first();
  if (unified) {
    await db('products').where('id', unified.id).update({ stock_quantity: newStock, updated_at: db.fn.now() });
  }

  res.json({
    status: 'success',
    message: `Stock updated. New quantity: ${newStock}`,
    data: { id: parseInt(id), previous: product.stock_quantity, new: newStock, operation, notes }
  });
});

exports.createCategory = catchAsync(async (req, res) => {
  const { name, description, icon_class, type } = req.body;
  if (!name) throw new AppError('Category name is required', 400);
  const workerCat = await settingsRepository.getValue('farming_worker_can_add_products', true);
  if (req.user.roles.includes('Farming Worker') && !workerCat) {
    throw new AppError('Category creation is disabled for workers by the manager', 403);
  }
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const existing = await db('farming_categories').where({ slug }).first();
  if (existing) throw new AppError('Category with this name already exists', 400);

  let cover_image = imgUrl(req.file);

  const [id] = await db('farming_categories').insert({
    name, slug, description: description || null,
    icon_class: icon_class || null, cover_image,
    type: type || 'general', is_active: true, created_at: db.fn.now()
  });
  const category = await db('farming_categories').where({ id }).first();
  res.status(201).json({ status: 'success', message: 'Category created', data: category });
});

// --- Worker Permissions ---
exports.getWorkerAddProductSetting = catchAsync(async (req, res) => {
  const val = await settingsRepository.getValue('farming_worker_can_add_products', true);
  res.json({ status: 'success', data: { enabled: val } });
});

exports.updateWorkerAddProductSetting = catchAsync(async (req, res) => {
  const { enabled } = req.body;
  if (typeof enabled !== 'boolean') throw new AppError('enabled must be boolean', 400);
  const isManager = req.user.roles.some(r => ['Farming Manager', 'Admin', 'CEO'].includes(r));
  if (!isManager) throw new AppError('Only managers can change this setting', 403);
  await settingsRepository.setValue('farming_worker_can_add_products', enabled, 'Farming', 'Allow workers to add/edit products and categories', req.user.id);
  res.json({ status: 'success', data: { enabled } });
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
      .select('farming_order_items.*', db.raw('COALESCE(fp.name, p.name) as product_name'))
      .leftJoin('farming_products as fp', 'farming_order_items.product_id', 'fp.id')
      .leftJoin('products as p', 'farming_order_items.product_id', 'p.id')
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
  const { status, payment_method, payment_reference } = req.body;

  const validStatuses = ['PROCESSING', 'AWAITING_PAYMENT', 'CONFIRMED', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED'];
  if (!validStatuses.includes(status)) throw new AppError('Invalid status', 400);

  const order = await db('farming_orders').where({ id }).first();
  if (!order) throw new AppError('Order not found', 404);

  const updates = { status, updated_at: db.fn.now() };
  if (payment_method) updates.payment_method = payment_method;
  if (payment_reference) updates.payment_reference = payment_reference;

  try {
    await db.transaction(async (trx) => {
      await trx('farming_orders').where({ id }).update(updates);

      // Record online payments into POS logs and decrement stock on CONFIRMED
      if (order.status === 'AWAITING_PAYMENT' && (status === 'CONFIRMED' || status === 'READY_FOR_PICKUP')) {
        const shift = await trx('pos_shifts').where({ cashier_id: req.user.id, status: 'OPEN' }).first();
        if (shift) {
          let completedStatus = await trx('sale_statuses').where('status_code', 'completed').first();
          const pMethodName = payment_method === 'bank_transfer' ? 'Bank Transfer' : (payment_method === 'telebirr' ? 'Telebirr' : 'Cash');
          const pMethodRec = await trx('payment_methods').where('name', pMethodName).first();

          if (completedStatus && pMethodRec) {
            // Skip if pos_sales already exists for this order (e.g. from posCheckout)
            const existingSale = await trx('pos_sales')
              .where({ order_source: 'farming_orders', order_id: id })
              .first();

            let saleId, isNewSale;
            if (existingSale) {
              saleId = existingSale.id;
              isNewSale = false;
            } else {
              const [newId] = await trx('pos_sales').insert({
                invoice_number: `ONL-F-${order.invoice_number}`,
                customer_id: order.customer_id || null,
                subtotal: order.total_amount,
                tax_amount: 0,
                discount_amount: 0,
                total_amount: order.total_amount,
                payment_method_id: pMethodRec.id,
                payment_reference: payment_reference || null,
                amount_paid: order.total_amount,
                change_amount: 0,
                cashier_id: req.user.id,
                sale_date: trx.fn.now(),
                status_id: completedStatus.id,
                sale_type: 'online',
                order_source: 'farming_orders',
                order_id: id,
                notes: `Online Farming Order #${order.invoice_number}`
              });
              saleId = newId;
              isNewSale = true;
            }

            // Only insert pos_items if this sale doesn't have them yet
            const existingItems = await trx('pos_items').where('sale_id', saleId);
            if (existingItems.length === 0) {
              const orderItems = await trx('farming_order_items').where('order_id', id);
              for (const oi of orderItems) {
                await trx('pos_items').insert({
                  sale_id: saleId,
                  product_id: oi.product_id,
                  source: 'farming',
                  quantity: oi.quantity,
                  unit_price: oi.unit_price,
                  discount_percent: 0,
                  subtotal: oi.subtotal,
                  total: oi.subtotal
                });
              }
            }

            // Only update shift totals if pos_sales was newly created (avoid double-count)
            if (isNewSale) {
              await trx('pos_shifts').where({ id: shift.id }).update({
                transaction_count: trx.raw('transaction_count + 1'),
                total_sales: trx.raw('COALESCE(total_sales,0) + ?', [order.total_amount]),
                cash_collected: payment_method === 'cash' ? trx.raw('COALESCE(cash_collected,0) + ?', [order.total_amount]) : trx.raw('cash_collected'),
                telebirr_collected: payment_method === 'telebirr' ? trx.raw('COALESCE(telebirr_collected,0) + ?', [order.total_amount]) : trx.raw('telebirr_collected'),
                transfer_collected: payment_method === 'bank_transfer' ? trx.raw('COALESCE(transfer_collected,0) + ?', [order.total_amount]) : trx.raw('transfer_collected')
              });
            }
          }
        }

        // Decrement stock on CONFIRMED (not on order creation)
        const items = await trx('farming_order_items').where('order_id', id);
        for (const item of items) {
          const prod = await trx('products').where('sku', `FARM-${item.product_id}`).first();
          if (prod) {
            const updated = await trx('products')
              .where({ id: prod.id, business_unit: 'farming' })
              .where('stock_quantity', '>=', item.quantity)
              .decrement('stock_quantity', item.quantity);
            if (!updated) throw new AppError(`Insufficient stock for product #${item.product_id}`, 409);
          }
          await trx('farming_products')
            .where({ id: item.product_id })
            .where('stock_quantity', '>=', item.quantity)
            .decrement('stock_quantity', item.quantity);
        }
      }

      // If cancelled after being paid/confirmed, restore stock
      if (status === 'CANCELLED' && order.status !== 'AWAITING_PAYMENT' && order.status !== 'PROCESSING' && order.status !== 'COMPLETED') {
        const items = await trx('farming_order_items').where('order_id', id);
        for (const item of items) {
          await trx('farming_products').where({ id: item.product_id }).increment('stock_quantity', item.quantity);
          const prod = await trx('products').where('sku', `FARM-${item.product_id}`).first();
          if (prod) {
            await trx('products').where({ id: prod.id }).increment('stock_quantity', item.quantity);
          }
        }
      }
    });
  } catch (err) {
    console.error('updateOrderStatus error:', { message: err.message, stack: err.stack, code: err.code, sql: err.sql });
    throw err;
  }

  const updatedOrder = await db('farming_orders')
    .leftJoin('users', 'farming_orders.customer_id', 'users.id')
    .select(
      'farming_orders.*',
      'users.full_name as customer_name',
      'users.phone as customer_phone'
    )
    .where('farming_orders.id', id)
    .first();
  res.json({
    status: 'success',
    message: `Order status updated to ${status}`,
    data: { order: updatedOrder }
  });
});

// --- POS (Walk-in Sales) ---

exports.posCheckout = catchAsync(async (req, res) => {
  const { items, payment_method, online_order_id } = req.body;
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
      const product = await trx('products')
        .where({ id: item.product_id, business_unit: 'farming' })
        .forUpdate()
        .first();
      if (!product) throw new AppError(`Product ID ${item.product_id} not found`, 404);
      if (!online_order_id && product.stock_quantity < item.quantity) {
        throw new AppError(`Insufficient stock for "${product.name}". Only ${product.stock_quantity} remaining.`, 400);
      }
      total_amount += (product.selling_price * item.quantity);
      const oldId = parseInt((product.sku || '').replace('FARM-', ''), 10);
      const farmingProduct = oldId ? await trx('farming_products').where({ id: oldId }).first() : null;
      resolvedItems.push({ product, quantity: item.quantity, farmingProductId: farmingProduct ? farmingProduct.id : null });
    }

    let orderId = online_order_id;
    let invoice_number;
    
    if (orderId) {
      const existingOrder = await trx('farming_orders').where({ id: orderId }).first();
      if (!existingOrder) throw new AppError('Online order not found', 404);
      invoice_number = existingOrder.invoice_number;
      await trx('farming_orders').where({ id: orderId }).update({
        status: 'READY_FOR_PICKUP',
        payment_method,
        updated_at: db.fn.now()
      });
      // We do not re-insert items since they were inserted during createOrder.
    } else {
      invoice_number = await generateInvoiceNumber('FRM', trx, 'farming_orders');
      const [newOrderId] = await trx('farming_orders').insert({
        invoice_number,
        total_amount,
        status: 'COMPLETED',
        payment_method,
        delivery_type: 'pickup',
        created_at: db.fn.now(),
        updated_at: db.fn.now()
      });
      orderId = newOrderId;

      for (const { product, quantity, farmingProductId } of resolvedItems) {
        const fkId = farmingProductId || product.id;
        await trx('farming_order_items').insert({
          order_id: orderId,
          product_id: fkId,
          quantity,
          unit_price: product.selling_price,
          subtotal: product.selling_price * quantity
        });
        const updatedProducts = await trx('products')
          .where({ id: product.id, business_unit: 'farming' })
          .where('stock_quantity', '>=', quantity)
          .decrement('stock_quantity', quantity);
        if (!updatedProducts) throw new AppError(`Race condition on stock for "${product.name}".`, 409);
        if (farmingProductId) {
          await trx('farming_products')
            .where({ id: farmingProductId })
            .where('stock_quantity', '>=', quantity)
            .decrement('stock_quantity', quantity);
        }
      }
    }

    // Record in pos_sales so it appears in the audit log
    const pMethodName = payment_method === 'cash' ? 'Cash' : payment_method === 'telebirr' ? 'Telebirr' : 'Bank Transfer';
    const pMethodRec = await trx('payment_methods').where('name', pMethodName).first();
    const completedStatus = await trx('sale_statuses').where('status_code', 'completed').first();
    const isOnline = orderId === online_order_id;

    // Skip pos_sales creation for online orders already recorded by updateOrderStatus
    let posSaleId, isNewPosSale;
    if (isOnline) {
      const existing = await trx('pos_sales')
        .where({ order_source: 'farming_orders', order_id: orderId })
        .first();
      if (existing) {
        posSaleId = existing.id;
        isNewPosSale = false;
      }
    }

    if (!posSaleId && pMethodRec && completedStatus) {
      const posInvoice = await generateInvoiceNumber('POS', trx, 'pos_sales');
      const [newId] = await trx('pos_sales').insert({
        invoice_number: posInvoice,
        sale_type: isOnline ? 'online' : 'walk_in',
        order_source: isOnline ? 'farming_orders' : null,
        order_id: isOnline ? orderId : null,
        subtotal: total_amount,
        tax_amount: 0,
        discount_amount: 0,
        total_amount,
        payment_method_id: pMethodRec.id,
        amount_paid: total_amount,
        cashier_id: req.user.id,
        sale_date: trx.fn.now(),
        status_id: completedStatus.id,
        notes: isOnline ? `Online Farming Order #${invoice_number}` : 'Walk-in Farming POS'
      });
      posSaleId = newId;
      isNewPosSale = true;
    }

    if (posSaleId && isNewPosSale) {
      for (const { product, quantity } of resolvedItems) {
        await trx('pos_items').insert({
          sale_id: posSaleId,
          product_id: product.id,
          source: 'farming',
          quantity,
          unit_price: product.selling_price,
          subtotal: product.selling_price * quantity,
          total: product.selling_price * quantity
        });
      }
    }

    // Only update shift if pos_sales was newly created (avoid double-count)
    if (isNewPosSale) {
      const shift = await trx('pos_shifts')
        .where({ cashier_id: req.user.id, status: 'OPEN' })
        .first();
      if (shift) {
        await trx('pos_shifts')
          .where({ id: shift.id })
          .increment({
            total_sales: total_amount,
            transaction_count: 1
          });
      }
    }

    return { orderId, invoice_number, total_amount };
  });

  res.status(201).json({ status: 'success', message: 'Sale completed!', data: result });
});

// --- Reorder Requests ---

exports.createReorderRequest = catchAsync(async (req, res) => {
  const { product_id, quantity_requested, notes } = req.body;
  const requested_by = req.user.id;
  if (!product_id || !quantity_requested) {
    return res.status(400).json({ status: 'error', message: 'Product and quantity are required' });
  }
  const product = await db('farming_products').where({ id: product_id, is_active: true }).first();
  if (!product) throw new AppError('Product not found', 404);

  const [id] = await db('farming_reorder_requests').insert({
    product_id, requested_by, quantity_requested: parseInt(quantity_requested),
    notes: notes || null, status: 'PENDING', created_at: db.fn.now(), updated_at: db.fn.now()
  });
  const request = await db('farming_reorder_requests').where({ id }).first();
  res.status(201).json({ status: 'success', message: 'Reorder request submitted', data: request });
});

exports.getTopProductsToday = catchAsync(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const products = await db('farming_order_items')
    .join('farming_orders', 'farming_order_items.order_id', 'farming_orders.id')
    .join('farming_products', 'farming_order_items.product_id', 'farming_products.id')
    .whereRaw('DATE(farming_orders.created_at) = ?', [today])
    .whereNotIn('farming_orders.status', ['CANCELLED'])
    .select(
      'farming_products.id',
      'farming_products.name',
      db.raw('SUM(farming_order_items.quantity) as total_qty'),
      db.raw('SUM(farming_order_items.subtotal) as total_revenue')
    )
    .groupBy('farming_products.id', 'farming_products.name')
    .orderBy('total_qty', 'desc')
    .limit(5);

  res.json({ status: 'success', data: products });
});

exports.getReorderRequests = catchAsync(async (req, res) => {
  const { status } = req.query;
  let query = db('farming_reorder_requests')
    .select(
      'farming_reorder_requests.*',
      'farming_products.name as product_name',
      'farming_products.stock_quantity as current_stock',
      'requesters.full_name as requester_name'
    )
    .leftJoin('farming_products', 'farming_reorder_requests.product_id', 'farming_products.id')
    .leftJoin('users as requesters', 'farming_reorder_requests.requested_by', 'requesters.id');
  if (status) query = query.where('farming_reorder_requests.status', status);
  const requests = await query.orderBy('farming_reorder_requests.created_at', 'desc');
  res.json({ status: 'success', data: requests });
});

exports.approveReorderRequest = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ status: 'error', message: 'Status must be APPROVED or REJECTED' });
  }
  const request = await db('farming_reorder_requests').where({ id }).first();
  if (!request) throw new AppError('Request not found', 404);
  if (request.status !== 'PENDING') throw new AppError('Request already processed', 400);

  await db('farming_reorder_requests').where({ id }).update({
    status, approved_by: req.user.id, notes: notes || request.notes, updated_at: db.fn.now()
  });
  const updated = await db('farming_reorder_requests').where({ id }).first();
  res.json({ status: 'success', message: `Request ${status.toLowerCase()}`, data: updated });
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

// --- Shift Management ---

exports.openShift = catchAsync(async (req, res) => {
  const { opening_float, shift_type } = req.body;
  const worker_id = req.user.id;

  const existing = await db('farming_shifts').where({ worker_id, status: 'OPEN' }).first();
  if (existing) return res.status(400).json({ status: 'error', message: 'You already have an open shift. Close it first.' });

  const shift_type_val = shift_type || 'morning';
  const today = new Date().toISOString().split('T')[0];

  const [id] = await db('farming_shifts').insert({
    worker_id, shift_type: shift_type_val,
    opening_float: parseFloat(opening_float || 0),
    total_sales: 0, transaction_count: 0,
    cash_collected: 0, telebirr_collected: 0, transfer_collected: 0,
    status: 'OPEN',
    opened_at: db.fn.now(), clocked_in_at: db.fn.now(),
    created_at: db.fn.now(), updated_at: db.fn.now()
  });

  const shift = await db('farming_shifts').where({ id }).first();

  // Record CLOCK_IN in attendance_records using raw SQL
  const now = new Date();
  const workDate = now.toISOString().split('T')[0];
  const ts = now.toISOString().slice(0, 19).replace('T', ' ');
  let empId = null;
  const emp = await db('employees').where('user_id', worker_id).first();
  if (emp) {
    empId = emp.employee_id;
  } else {
    // Auto-create employee record from user data
    const user = await db('users').where('id', worker_id).first();
    if (user) {
      const newEmpId = `EMP${String(worker_id).padStart(4, '0')}`;
      await db.raw(`INSERT IGNORE INTO employees (employee_id, user_id, full_name, email, phone, department, status, created_at) VALUES (?, ?, ?, ?, ?, 'Farming', 'Active', NOW())`, [newEmpId, worker_id, user.full_name || user.username || user.email, user.email || '', user.phone || '']);
      empId = newEmpId;
    }
  }
  if (empId) {
    await db.raw(`INSERT IGNORE INTO attendance_records (employee_id, action, status, timestamp, ip_address, work_date, recorded_by, created_at) VALUES (?, 'CLOCK_IN', 'Present', ?, ?, ?, ?, NOW())`, [empId, ts, req.ip || '127.0.0.1', workDate, worker_id]);
  }

  res.status(201).json({ status: 'success', message: 'Shift opened', data: shift });
});

exports.closeShift = catchAsync(async (req, res) => {
  const { physical_cash_counted, difference_reason, refunds_given, expenses_transport, expenses_loading, notes } = req.body;
  const worker_id = req.user.id;

  const shift = await db('farming_shifts').where({ worker_id, status: 'OPEN' }).first();
  if (!shift) return res.status(404).json({ status: 'error', message: 'No open shift found.' });

  const today = new Date().toISOString().split('T')[0];

  // Online orders (farming_orders)
  const onlineSales = await db('farming_orders')
    .where('status', 'COMPLETED')
    .whereRaw(`DATE(created_at) = ?`, [today]);

  // Walk-in POS sales by this worker
  const walkinSales = await db('pos_sales')
    .where('order_source', 'farming_orders')
    .where('cashier_id', worker_id)
    .whereRaw('DATE(sale_date) = ?', [today]);

  const allSales = [...onlineSales, ...walkinSales];

  const totalSales = allSales.reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
  const cashCollected = allSales.filter(o => o.payment_method === 'cash' || o.payment_method_id === 1).reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
  const telebirrCollected = allSales.filter(o => o.payment_method === 'telebirr' || o.payment_method_id === 3).reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
  const transferCollected = allSales.filter(o => o.payment_method === 'bank_transfer' || o.payment_method_id === 2).reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
  const transactionCount = allSales.length;

  const counted = parseFloat(physical_cash_counted || 0);
  const expectedCash = parseFloat(shift.opening_float) + cashCollected;
  const difference = counted - expectedCash;
  const cashToHandover = cashCollected; // sales cash only (float excluded)

  await db('farming_shifts').where({ id: shift.id }).update({
    total_sales: totalSales, transaction_count: transactionCount,
    cash_collected: cashCollected, telebirr_collected: telebirrCollected,
    transfer_collected: transferCollected,
    physical_cash_counted: counted, difference_amount: difference,
    difference_reason: difference_reason || null,
    status: 'CLOSED', closed_at: db.fn.now(), clocked_out_at: db.fn.now(),
    updated_at: db.fn.now()
  });

  // Also submit a finance report entry
  await db('farming_finance_reports').insert({
    farming_worker_id: worker_id,
    report_date: today,
    total_system_sales: totalSales,
    cash_collected: cashCollected,
    telebirr_collected: telebirrCollected,
    transfer_collected: transferCollected,
    physical_cash_counted: counted,
    difference_amount: difference,
    difference_reason: difference_reason || null,
    refunds_given: parseFloat(refunds_given || 0),
    expenses_transport: parseFloat(expenses_transport || 0),
    expenses_loading: parseFloat(expenses_loading || 0),
    notes: notes || null,
    status: 'SUBMITTED',
    created_at: db.fn.now()
  });

  // Create cash handover for Finance
  // Assume Finance user has ID 3 (or we fetch it dynamically). We'll set a default of 3 if not found.
  const financeUser = await db('users')
    .join('user_roles', 'users.id', 'user_roles.user_id')
    .join('roles', 'user_roles.role_id', 'roles.id')
    .where('roles.name', 'Finance').first() || { user_id: 3 };
    
  await db('cash_handovers').insert({
    from_user_id: worker_id,
    to_user_id: financeUser.user_id,
    handover_type: 'FARMING_TO_FINANCE',
    total_cash: cashCollected,
    total_telebirr: telebirrCollected,
    total_transfer: transferCollected,
    total_amount: totalSales,
    notes: `Shift closed by Farming Worker. Notes: ${notes || ''}`,
    status: 'PENDING',
    created_at: db.fn.now(),
    updated_at: db.fn.now()
  });

  await notificationRepository.create({
    roleTarget: 'MANAGER',
    type: 'farming',
    title: 'Shift Closed (Farming)',
    message: `Cashier has closed their shift and submitted the finance report. Please verify.`
  });

  // Record CLOCK_OUT in attendance_records using raw SQL
  const now = new Date();
  const workDate = now.toISOString().split('T')[0];
  const ts = now.toISOString().slice(0, 19).replace('T', ' ');
  let empId = null;
  const emp = await db('employees').where('user_id', worker_id).first();
  if (emp) {
    empId = emp.employee_id;
  } else {
    const user = await db('users').where('id', worker_id).first();
    if (user) {
      const newEmpId = `EMP${String(worker_id).padStart(4, '0')}`;
      await db.raw(`INSERT IGNORE INTO employees (employee_id, user_id, full_name, email, phone, department, status, created_at) VALUES (?, ?, ?, ?, ?, 'Farming', 'Active', NOW())`, [newEmpId, worker_id, user.full_name || user.username || user.email, user.email || '', user.phone || '']);
      empId = newEmpId;
    }
  }
  if (empId) {
    await db.raw(`INSERT IGNORE INTO attendance_records (employee_id, action, status, timestamp, ip_address, work_date, recorded_by, created_at) VALUES (?, 'CLOCK_OUT', 'Present', ?, ?, ?, ?, NOW())`, [empId, ts, req.ip || '127.0.0.1', workDate, worker_id]);
  }

  res.json({
    status: 'success',
    message: 'Shift closed successfully. Report submitted to Finance.',
    data: {
      shift_id: shift.id, total_sales: totalSales, cash_collected: cashCollected,
      telebirr_collected: telebirrCollected, transfer_collected: transferCollected,
      transaction_count: transactionCount, physical_cash_counted: counted,
      expected_cash: expectedCash, difference, cash_to_handover: cashToHandover,
      opening_float: shift.opening_float
    }
  });
});

exports.getCurrentShift = catchAsync(async (req, res) => {
  const worker_id = req.user.id;
  const shift = await db('farming_shifts').where({ worker_id, status: 'OPEN' }).first();
  res.json({ status: 'success', data: shift || null });
});

exports.getShiftHistory = catchAsync(async (req, res) => {
  const worker_id = req.user.id;
  const limit = parseInt(req.query.limit || 200);
  const isManager = req.user.roles.some(r => ['Farming Manager', 'Admin', 'CEO'].includes(r));
  let query = db('farming_shifts')
    .leftJoin('users', 'farming_shifts.worker_id', 'users.id')
    .select('farming_shifts.*', 'users.full_name as worker_name')
    .orderBy('farming_shifts.created_at', 'desc')
    .limit(limit);
  if (!isManager) query = query.where('farming_shifts.worker_id', worker_id);
  const shifts = await query;
  res.json({ status: 'success', data: shifts });
});

exports.verifyShift = catchAsync(async (req, res) => {
  if (!hasPermission(req.user, 'pos:verify')) throw new AppError('Insufficient permissions to verify shifts', 403);
  const { shiftId } = req.params;
  const { status } = req.body;
  const shift = await db('farming_shifts').where({ id: shiftId }).first();
  if (!shift) throw new AppError('Shift not found', 404);
  if (shift.status !== 'CLOSED') throw new AppError('Only closed shifts can be verified', 400);
  await db('farming_shifts').where({ id: shiftId }).update({
    status, verified_by: req.user.id, verified_at: db.fn.now(), updated_at: db.fn.now()
  });
  const updated = await db('farming_shifts').where({ id: shiftId }).first();
  res.json({ status: 'success', message: `Shift ${status === 'VERIFIED' ? 'verified' : 'rejected'}`, data: updated });
});

// --- Overview Stats ---
exports.getOverviewStats = catchAsync(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartStr = monthStart.toISOString().split('T')[0];

  // 1 & 2. Today's Revenue & Monthly Revenue (farming_orders COMPLETED + pos_sales from farming)
  const [todayFarmingRevenue] = await db('farming_orders')
    .where('status', 'COMPLETED')
    .whereRaw('DATE(created_at) = ?', [today])
    .sum('total_amount as total');

  const [monthFarmingRevenue] = await db('farming_orders')
    .where('status', 'COMPLETED')
    .whereRaw('DATE(created_at) >= ?', [monthStartStr])
    .sum('total_amount as total');

  const [todayPosFarmingRevenue] = await db('pos_sales')
    .where('order_source', 'farming_orders')
    .whereRaw('DATE(sale_date) = ?', [today])
    .sum('total_amount as total');

  const [monthPosFarmingRevenue] = await db('pos_sales')
    .where('order_source', 'farming_orders')
    .whereRaw('DATE(sale_date) >= ?', [monthStartStr])
    .sum('total_amount as total');

  const todayRevenue = parseFloat(todayFarmingRevenue?.total || 0) + parseFloat(todayPosFarmingRevenue?.total || 0);
  const monthlyRevenue = parseFloat(monthFarmingRevenue?.total || 0) + parseFloat(monthPosFarmingRevenue?.total || 0);

  // 3. Active Workers (distinct workers clocked in)
  const [activeWorkers] = await db('farming_shifts')
    .where('status', 'OPEN')
    .countDistinct('worker_id as total');

  // 4. Low Stock Items
  const lowStock = await db('farming_products')
    .whereRaw('stock_quantity <= reorder_level')
    .where('is_active', true)
    .select('id', 'name', 'stock_quantity', 'reorder_level');

  const [lowStockCount] = await db('farming_products')
    .whereRaw('stock_quantity <= reorder_level')
    .where('is_active', true)
    .count('id as total');

  // 5. Pending Reorders
  let pendingReorders = 0;
  try {
    const [pr] = await db('farming_reorder_requests')
      .where('status', 'PENDING')
      .count('id as total');
    pendingReorders = parseInt(pr?.total || 0);
  } catch (_) {}

  // 6. Open Shifts
  const [openShifts] = await db('farming_shifts')
    .where('status', 'OPEN')
    .count('id as total');

  // 7. Today's Orders
  const [todayOrders] = await db('farming_orders')
    .whereRaw('DATE(created_at) = ?', [today])
    .count('id as total');

  // 8. Budget Used
  let monthlyBudget = 0;
  let monthlyExpenses = 0;
  try {
    const budgetSetting = await db('settings')
      .where('setting_key', 'farming_monthly_budget')
      .first();
    if (budgetSetting) monthlyBudget = parseFloat(budgetSetting.setting_value) || 0;

    const farmingDept = await db('finance_departments').where('name', 'Farming').first();
    if (farmingDept) {
      const [expenses] = await db('finance_expenses')
        .where('department_id', farmingDept.id)
        .where('status', 'APPROVED')
        .whereRaw('DATE(expense_date) >= ?', [monthStartStr])
        .sum('amount as total');
      monthlyExpenses = parseFloat(expenses?.total || 0);
    }
  } catch (_) {}

  const budgetPercent = monthlyBudget > 0 ? Math.min(100, Math.round((monthlyExpenses / monthlyBudget) * 100)) : 0;

  // Legacy compat
  const [pendingOrders] = await db('farming_orders')
    .whereIn('status', ['AWAITING_PAYMENT', 'CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'])
    .count('id as total');

  const [totalProducts] = await db('farming_products').where('is_active', true).count('id as total');

  res.json({
    status: 'success',
    data: {
      todayRevenue,
      monthlyRevenue,
      activeWorkers: parseInt(activeWorkers?.total || 0),
      lowStockProducts: lowStock,
      lowStockCount: parseInt(lowStockCount?.total || 0),
      pendingReorders,
      openShifts: parseInt(openShifts?.total || 0),
      todayOrders: parseInt(todayOrders?.total || 0),
      budgetPercent,
      monthlyBudget,
      monthlyExpenses,
      todaySales: todayRevenue,
      pendingOrders: parseInt(pendingOrders?.total || 0),
      totalProducts: parseInt(totalProducts?.total || 0),
    }
  });
});

exports.getManagerAuditData = catchAsync(async (req, res) => {
  const { startDate, endDate, worker_id } = req.query;
  const sd = startDate || new Date().toISOString().split('T')[0];
  const ed = endDate || sd;
  const bindings = [sd, ed];

  let workerClause = '';
  if (worker_id) {
    workerClause = ' AND fs.worker_id = ?';
    bindings.push(parseInt(worker_id));
  }

  // All farming shifts with worker info (raw SQL for exact data)
  const shifts = await db.raw(`
    SELECT fs.*, u.full_name AS worker_name, u.email AS worker_email, u.phone AS worker_phone,
           e.employee_id, e.department,
           fs.clocked_in_at, fs.clocked_out_at
    FROM farming_shifts fs
    LEFT JOIN users u ON fs.worker_id = u.id
    LEFT JOIN employees e ON u.id = e.user_id
    WHERE DATE(fs.opened_at) >= ? AND DATE(fs.opened_at) <= ?${workerClause}
    ORDER BY fs.opened_at DESC
  `, bindings);

  // POS sales from farming (walk-in)
  const posSales = await db.raw(`
    SELECT ps.*, u.full_name AS cashier_name,
           pm.name AS payment_method_name,
           c.name AS customer_name, c.phone AS customer_phone
    FROM pos_sales ps
    LEFT JOIN users u ON ps.cashier_id = u.id
    LEFT JOIN payment_methods pm ON ps.payment_method_id = pm.id
    LEFT JOIN customers c ON ps.customer_id = c.id
    WHERE ps.order_source = 'farming_orders'
      AND DATE(ps.sale_date) >= ? AND DATE(ps.sale_date) <= ?
    ORDER BY ps.sale_date DESC
  `, [sd, ed]);

  // Online farming orders
  const onlineOrders = await db.raw(`
    SELECT fo.*,
           COALESCE(u.full_name, c.name, fo.contact_name) AS customer_name,
           COALESCE(u.phone, c.phone, fo.contact_phone) AS customer_phone
    FROM farming_orders fo
    LEFT JOIN customers c ON fo.customer_id = c.id
    LEFT JOIN users u ON c.user_id = u.id
    WHERE DATE(fo.created_at) >= ? AND DATE(fo.created_at) <= ?
    ORDER BY fo.created_at DESC
  `, [sd, ed]);

  // Attendance records — paired clock_in/clock_out per employee per day with position
  const attendance = await db.raw(`
    SELECT
      a.employee_id,
      e.full_name AS employee_name,
      e.position,
      e.department,
      r.name AS role_name,
      a.work_date,
      MAX(CASE WHEN a.action = 'CLOCK_IN' THEN a.timestamp END) AS clock_in,
      MAX(CASE WHEN a.action = 'CLOCK_OUT' THEN a.timestamp END) AS clock_out,
      TIMESTAMPDIFF(MINUTE,
        MAX(CASE WHEN a.action = 'CLOCK_IN' THEN a.timestamp END),
        MAX(CASE WHEN a.action = 'CLOCK_OUT' THEN a.timestamp END)
      ) AS duration_minutes
    FROM attendance_records a
    LEFT JOIN employees e ON a.employee_id = e.employee_id
    LEFT JOIN users u ON e.user_id = u.id
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    WHERE a.work_date >= ? AND a.work_date <= ?
    GROUP BY a.employee_id, a.work_date, e.full_name, e.position, e.department, r.name
    ORDER BY a.work_date DESC, a.employee_id
  `, [sd, ed]);

  // Today's summary via raw SQL
  const todaySummary = await db.raw(`
    SELECT
      COALESCE((SELECT SUM(total_amount) FROM farming_orders WHERE status = 'COMPLETED' AND DATE(created_at) = CURDATE()), 0) AS online_revenue,
      COALESCE((SELECT SUM(total_amount) FROM pos_sales WHERE order_source = 'farming_orders' AND DATE(sale_date) = CURDATE()), 0) AS walkin_revenue,
      (SELECT COUNT(*) FROM farming_shifts WHERE DATE(opened_at) = CURDATE()) AS shifts_today,
      (SELECT COUNT(*) FROM farming_orders WHERE DATE(created_at) = CURDATE()) AS orders_today,
      (SELECT COUNT(DISTINCT worker_id) FROM farming_shifts WHERE status = 'OPEN') AS active_workers
  `);

  res.json({
    status: 'success',
    data: {
      shifts: shifts[0] || [],
      posSales: posSales[0] || [],
      onlineOrders: onlineOrders[0] || [],
      attendance: attendance[0] || [],
      summary: (todaySummary[0] || [])[0] || {
        online_revenue: 0, walkin_revenue: 0,
        shifts_today: 0, orders_today: 0, active_workers: 0
      }
    }
  });
});

exports.getBudgetSummary = catchAsync(async (req, res) => {
  const categories = [
    { name: 'Seeds',       budget: 200000 },
    { name: 'Fertilizers', budget: 300000 },
    { name: 'Equipment',   budget: 100000 },
    { name: 'Pesticides',  budget: 150000 },
    { name: 'Animal Feed', budget: 100000 }
  ];
  const monthStart = new Date();
  monthStart.setDate(1);
  const ms = monthStart.toISOString().split('T')[0];

  const expenses = await db('expenses')
    .select('expense_categories.name as category_name')
    .sum('amount as total')
    .leftJoin('expense_categories', 'expenses.category_id', 'expense_categories.id')
    .whereRaw('expenses.date >= ?', [ms])
    .whereNull('expenses.deleted_at')
    .groupBy('expense_categories.name');

  const catMap = {};
  (expenses || []).forEach(e => { catMap[e.category_name] = parseFloat(e.total || 0); });

  const data = categories.map((c, i) => {
    const used = catMap[c.name] || 0;
    const remaining = c.budget - used;
    return { id: i + 1, category: c.name, budget: c.budget, used, remaining, status: remaining < 0 ? 'OVER' : 'OK' };
  });

  const total = data.reduce((s, c) => ({ budget: s.budget + c.budget, used: s.used + c.used }), { budget: 0, used: 0 });
  data.push({ id: data.length + 1, category: 'Total', budget: total.budget, used: total.used, remaining: total.budget - total.used, status: total.budget - total.used < 0 ? 'OVER' : 'OK' });

  res.json({ status: 'success', data });
});

exports.exportReport = catchAsync(async (req, res) => {
  const { format } = req.query;
  const today = new Date().toISOString().split('T')[0];

  const [prodRows] = await db.raw('SELECT name,stock_quantity,reorder_level FROM farming_products WHERE is_active=1');
  const [budgetRows] = await db.raw('SELECT category, budget, used, remaining, status FROM farming_budget_summary');
  const [reorderRows] = await db.raw("SELECT fp.name as product_name, u.full_name as requester_name, fp.stock_quantity as current_stock, fr.quantity_requested, fr.priority, fr.created_at FROM farming_reorder_requests fr JOIN farming_products fp ON fr.product_id=fp.id JOIN users u ON fr.requested_by=u.id WHERE fr.status='PENDING' ORDER BY fr.created_at DESC");
  const [topProdRows] = await db.raw('SELECT fp.name, SUM(foi.quantity) as total_qty, SUM(foi.subtotal) as total_revenue FROM farming_order_items foi JOIN farming_orders fo ON foi.order_id=fo.id JOIN farming_products fp ON foi.product_id=fp.id WHERE DATE(fo.created_at)=CURDATE() AND fo.status NOT IN (\'CANCELLED\') GROUP BY fp.id,fp.name ORDER BY total_qty DESC LIMIT 5');

  const filename = `QuickLinks_Report_${today}`;

  if (format === 'excel') {
    const ExcelJS = require('exceljs');
    const wb = new ExcelJS.Workbook();
    const addSheet = (wsName, headers, rows) => {
      const ws = wb.addWorksheet(wsName);
      ws.columns = headers.map(h => ({ header: h, key: h, width: 22 }));
      ws.getRow(1).font = { bold: true };
      ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF166534' } };
      ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      (rows || []).forEach(r => ws.addRow(r));
      ws.columns.forEach(c => { c.width = 24; });
    };
    addSheet('Stock Overview', ['#','Product','Stock','Reorder Level','Status'], (prodRows||[]).map((p,i) => [i+1,p.name,p.stock_quantity,p.reorder_level,p.stock_quantity<p.reorder_level?'LOW':'OK']));
    addSheet('Budget Summary', ['#','Category','Budget','Used','Remaining','Status'], (budgetRows||[]).map(b => [b.id,b.category,b.budget,b.used,b.remaining,b.status]));
    addSheet('Pending Reorders', ['#','Product','Requested By','Current Stock','Suggested Qty','Priority','Date','Status'], (reorderRows||[]).map((r,i) => [i+1,r.product_name,r.requester_name,r.current_stock,r.quantity_requested,r.priority,r.created_at?r.created_at.toISOString().split('T')[0]:'','Pending CEO']));
    addSheet('Top Products Today', ['#','Product','Qty Sold','Revenue'], (topProdRows||[]).map((p,i) => [i+1,p.name,p.total_qty,p.total_revenue]));
    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.attachment(`${filename}.xlsx`);
    await wb.xlsx.write(res);
    return res.end();
  }

  if (format === 'pdf') {
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    res.header('Content-Type', 'application/pdf');
    res.attachment(`${filename}.pdf`);
    doc.pipe(res);
    doc.fontSize(18).font('Helvetica-Bold').text('Quick Links Report', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(1.5);

    const drawTable = (title, headers, rows) => {
      doc.fontSize(13).font('Helvetica-Bold').text(title);
      doc.moveDown(0.5);
      const colW = (doc.page.width - 80) / headers.length;
      const startX = 40;
      let y = doc.y;
      doc.fontSize(8).font('Helvetica-Bold');
      headers.forEach((h, i) => doc.text(h, startX + i * colW, y, { width: colW, align: 'left' }));
      y += 14;
      doc.moveTo(startX, y - 4).lineTo(startX + headers.length * colW, y - 4).stroke('#166534');
      doc.fontSize(8).font('Helvetica');
      (rows || []).forEach(row => {
        if (y > doc.page.height - 40) { doc.addPage(); y = doc.y; }
        row.forEach((val, i) => doc.text(String(val||''), startX + i * colW, y, { width: colW, align: 'left' }));
        y += 12;
      });
      doc.y = y + 10;
    };

    const prodH = ['#','Product','Stock','Reorder','Status'];
    const prodR = (prodRows||[]).map((p,i) => [i+1,p.name,p.stock_quantity,p.reorder_level,p.stock_quantity<p.reorder_level?'LOW':'OK']);
    drawTable('Stock Overview', prodH, prodR);

    const budH = ['#','Category','Budget','Used','Remaining','Status'];
    const budR = (budgetRows||[]).map(b => [b.id,b.category,b.budget,b.used,b.remaining,b.status]);
    drawTable('Expense & Budget Summary', budH, budR);

    const reH = ['#','Product','Requested By','Stock','Qty','Priority','Date','Status'];
    const reR = (reorderRows||[]).map((r,i) => [i+1,r.product_name,r.requester_name,r.current_stock,r.quantity_requested,r.priority||'MEDIUM',r.created_at?r.created_at.toISOString().split('T')[0]:'','Pending CEO']);
    drawTable('Pending Reorder Requests', reH, reR);

    const topH = ['#','Product','Qty Sold','Revenue'];
    const topR = (topProdRows||[]).map((p,i) => [i+1,p.name,p.total_qty,p.total_revenue]);
    drawTable('Top Products Today', topH, topR);

    doc.end();
    return;
  }

  res.status(400).json({ status: 'error', message: 'Invalid format. Use excel or pdf.' });
});

/* ─── Farming → Store → CEO Product Request Flow ─── */

exports.createStoreRequest = catchAsync(async (req, res) => {
  const { items, notes } = req.body;
  if (!items || !items.length) throw new AppError('At least one item required', 400);
  await db.raw(`CREATE TABLE IF NOT EXISTS \`farming_store_requests\` (
    \`id\` int UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    \`request_number\` varchar(50) NOT NULL UNIQUE,
    \`requested_by\` int NOT NULL,
    \`store_handler\` int DEFAULT NULL,
    \`approved_by\` int DEFAULT NULL,
    \`status\` enum('PENDING_STORE','FORWARDED_TO_CEO','APPROVED','REJECTED','SHIPPED','RECEIVED') DEFAULT 'PENDING_STORE',
    \`rejection_reason\` text,
    \`notes\` text,
    \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
  await db.raw(`CREATE TABLE IF NOT EXISTS \`farming_store_request_items\` (
    \`id\` int UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    \`request_id\` int UNSIGNED NOT NULL,
    \`product_id\` int UNSIGNED NOT NULL,
    \`quantity_requested\` int NOT NULL,
    \`quantity_shipped\` int DEFAULT NULL,
    \`unit_price\` decimal(10,2) DEFAULT NULL,
    \`notes\` text,
    FOREIGN KEY (\`request_id\`) REFERENCES \`farming_store_requests\`(\`id\`) ON DELETE CASCADE,
    FOREIGN KEY (\`product_id\`) REFERENCES \`farming_products\`(\`id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8`);

  const num = `FSR-${Date.now()}`;
  const [id] = await db('farming_store_requests').insert({
    request_number: num, requested_by: req.user.id, notes: notes || null, status: 'PENDING_STORE'
  });
  const rows = items.map(i => ({ request_id: id, product_id: i.product_id, quantity_requested: i.quantity_requested }));
  await db('farming_store_request_items').insert(rows);
  const request = await db('farming_store_requests').where({ id }).first();
  res.status(201).json({ status: 'success', data: request });
});

exports.getStoreRequests = catchAsync(async (req, res) => {
  const { status } = req.query;
  await db.raw(`CREATE TABLE IF NOT EXISTS \`farming_store_requests\` (
    \`id\` int UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    \`request_number\` varchar(50) NOT NULL UNIQUE,
    \`requested_by\` int NOT NULL,
    \`store_handler\` int DEFAULT NULL,
    \`approved_by\` int DEFAULT NULL,
    \`status\` enum('PENDING_STORE','FORWARDED_TO_CEO','APPROVED','REJECTED','SHIPPED','RECEIVED') DEFAULT 'PENDING_STORE',
    \`rejection_reason\` text,
    \`notes\` text,
    \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
  await db.raw(`CREATE TABLE IF NOT EXISTS \`farming_store_request_items\` (
    \`id\` int UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    \`request_id\` int UNSIGNED NOT NULL,
    \`product_id\` int UNSIGNED NOT NULL,
    \`quantity_requested\` int NOT NULL,
    \`quantity_shipped\` int DEFAULT NULL,
    \`unit_price\` decimal(10,2) DEFAULT NULL,
    \`notes\` text,
    FOREIGN KEY (\`request_id\`) REFERENCES \`farming_store_requests\`(\`id\`) ON DELETE CASCADE,
    FOREIGN KEY (\`product_id\`) REFERENCES \`farming_products\`(\`id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8`);
  // fix existing tables that were created with only id column
  try { await db.raw('ALTER TABLE \`farming_store_requests\` ADD \`request_number\` varchar(50) NOT NULL UNIQUE'); } catch (e) {}
  try { await db.raw('ALTER TABLE \`farming_store_requests\` ADD \`requested_by\` int NOT NULL'); } catch (e) {}
  try { await db.raw('ALTER TABLE \`farming_store_requests\` ADD \`store_handler\` int DEFAULT NULL'); } catch (e) {}
  try { await db.raw('ALTER TABLE \`farming_store_requests\` ADD \`approved_by\` int DEFAULT NULL'); } catch (e) {}
  try { await db.raw('ALTER TABLE \`farming_store_requests\` ADD \`status\` enum(\'PENDING_STORE\',\'FORWARDED_TO_CEO\',\'APPROVED\',\'REJECTED\',\'SHIPPED\',\'RECEIVED\') DEFAULT \'PENDING_STORE\''); } catch (e) {}
  try { await db.raw('ALTER TABLE \`farming_store_requests\` ADD \`rejection_reason\` text'); } catch (e) {}
  try { await db.raw('ALTER TABLE \`farming_store_requests\` ADD \`notes\` text'); } catch (e) {}
  try { await db.raw('ALTER TABLE \`farming_store_requests\` ADD \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP'); } catch (e) {}
  try { await db.raw('ALTER TABLE \`farming_store_requests\` ADD \`updated_at\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'); } catch (e) {}
  let q = db('farming_store_requests')
    .select(
      'farming_store_requests.*',
      'req_user.full_name as requester_name',
      'store_user.full_name as store_handler_name',
      'ceo_user.full_name as approver_name',
      db.raw('(SELECT COUNT(*) FROM farming_store_request_items WHERE request_id = farming_store_requests.id) as item_count')
    )
    .leftJoin('users as req_user', 'farming_store_requests.requested_by', 'req_user.id')
    .leftJoin('users as store_user', 'farming_store_requests.store_handler', 'store_user.id')
    .leftJoin('users as ceo_user', 'farming_store_requests.approved_by', 'ceo_user.id');
  if (status) q = q.where('farming_store_requests.status', status);
  const requests = await q.orderBy('farming_store_requests.created_at', 'desc');
  res.json({ status: 'success', data: requests });
});

exports.getStoreRequestDetail = catchAsync(async (req, res) => {
  const { id } = req.params;
  const request = await db('farming_store_requests')
    .select('farming_store_requests.*', 'req_user.full_name as requester_name', 'store_user.full_name as store_handler_name', 'ceo_user.full_name as approver_name')
    .leftJoin('users as req_user', 'farming_store_requests.requested_by', 'req_user.id')
    .leftJoin('users as store_user', 'farming_store_requests.store_handler', 'store_user.id')
    .leftJoin('users as ceo_user', 'farming_store_requests.approved_by', 'ceo_user.id')
    .where('farming_store_requests.id', id).first();
  if (!request) throw new AppError('Request not found', 404);
  const items = await db('farming_store_request_items')
    .select('farming_store_request_items.*', 'farming_products.name as product_name', 'farming_products.stock_quantity')
    .leftJoin('farming_products', 'farming_store_request_items.product_id', 'farming_products.id')
    .where('farming_store_request_items.request_id', id);
  res.json({ status: 'success', data: { ...request, items } });
});

exports.updateStoreRequestStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status: newStatus, rejection_reason, items: shippedItems } = req.body;
  const valid = ['PENDING_STORE','FORWARDED_TO_CEO','APPROVED','REJECTED','SHIPPED','RECEIVED'];
  if (!valid.includes(newStatus)) throw new AppError('Invalid status', 400);
  const request = await db('farming_store_requests').where({ id }).first();
  if (!request) throw new AppError('Request not found', 404);

  const upd = { status: newStatus, updated_at: db.fn.now() };
  if (newStatus === 'FORWARDED_TO_CEO') upd.store_handler = req.user.id;
  if (newStatus === 'APPROVED' || newStatus === 'REJECTED') {
    upd.approved_by = req.user.id;
    if (newStatus === 'REJECTED') upd.rejection_reason = rejection_reason || 'No reason provided';
  }

  await db('farming_store_requests').where({ id }).update(upd);

  if (shippedItems && shippedItems.length) {
    for (const si of shippedItems) {
      await db('farming_store_request_items').where({ id: si.item_id, request_id: id }).update({ quantity_shipped: si.quantity_shipped, unit_price: si.unit_price || 0 });
    }
  }

  if (newStatus === 'RECEIVED') {
    const items = await db('farming_store_request_items').where({ request_id: id });
    for (const item of items) {
      const shippedQty = item.quantity_shipped || item.quantity_requested;
      const fpId = item.product_id;

      const fp = await db('farming_products').where({ id: fpId }).first();
      if (fp) {
        const newStock = (fp.stock_quantity || 0) + shippedQty;
        await db('farming_products').where({ id: fpId }).update({ stock_quantity: newStock, updated_at: db.fn.now() });
        const unified = await db('products').where('sku', `FARM-${fpId}`).first();
        if (unified) {
          await db('products').where('id', unified.id).update({ stock_quantity: newStock, updated_at: db.fn.now() });
        }
      }
    }
  }

  const updated = await db('farming_store_requests').where({ id }).first();
  res.json({ status: 'success', data: updated });
});

/* ─── End Farming → Store → CEO Flow ─── */

exports.getQuickActions = catchAsync(async (req, res) => {
  // Auto-create table if not exists
  await db.raw(`
    CREATE TABLE IF NOT EXISTS \`farming_manager_quick_actions\` (
      \`id\` int(20) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
      \`action_name\` varchar(100) NOT NULL COMMENT 'Name of the quick action',
      \`action_description\` text COMMENT 'Description of what the action does',
      \`icon_class\` varchar(100) DEFAULT NULL COMMENT 'CSS icon class for the action button',
      \`route_path\` varchar(510) NOT NULL COMMENT 'URL route path for the action',
      \`sort_order\` int(20) DEFAULT '0' COMMENT 'Display order for sorting',
      \`is_active\` tinyint(1) DEFAULT '1' COMMENT 'Whether this action is active',
      \`role_access\` json DEFAULT NULL COMMENT 'JSON array of role names that can access this action',
      \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
      \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
      PRIMARY KEY (\`id\`),
      KEY \`idx_sort_order\` (\`sort_order\`),
      KEY \`idx_is_active\` (\`is_active\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Farming Manager quick actions for dashboard shortcuts'
  `);

  // Seed default actions if table is empty
  const [count] = await db('farming_manager_quick_actions').count('id as total');
  if (parseInt(count?.total || 0) === 0) {
    await db.raw(`
      INSERT IGNORE INTO \`farming_manager_quick_actions\`
        (\`action_name\`, \`action_description\`, \`icon_class\`, \`route_path\`, \`sort_order\`, \`is_active\`, \`role_access\`)
      VALUES
        ('View Stock Report',    'View current inventory stock levels and reports',             'fa-boxes',        '/farming/stock-report',    1, 1, '["Farming Manager","Admin"]'),
        ('View Workers',         'View and manage farming workers list',                        'fa-users',        '/farming/workers',         2, 1, '["Farming Manager","Admin"]'),
        ('Generate Daily Report','Generate daily farming operations report',                    'fa-file-alt',     '/farming/daily-report',    3, 1, '["Farming Manager","Admin","Finance"]'),
        ('View Expense Ledger',  'View farming expense records and ledger',                     'fa-coins',        '/farming/expense-ledger',  4, 1, '["Farming Manager","Admin","Finance"]'),
        ('Create Reorder Request','Create a new reorder request for products',                  'fa-cart-plus',    '/farming/reorder-request', 5, 1, '["Farming Manager","Admin"]'),
        ('View Shift Reports',   'View farming shift reports and summaries',                    'fa-clock',        '/farming/shift-reports',   6, 1, '["Farming Manager","Admin"]'),
        ('View Crop Calendar',   'View farming crop calendar and schedule',                     'fa-calendar-alt', '/farming/crop-calendar',   7, 1, '["Farming Manager","Admin"]'),
        ('Export Reports',       'Export farming reports (Excel / PDF)',                        'fa-file-export',  '/farming/export-reports',  8, 1, '["Farming Manager","Admin","Finance"]'),
        ('Product from Store',   'Request products from Store (Store → CEO → Approval)',           'fa-truck',        '/farming/store-request',   9, 1, '["Farming Manager","Admin"]')
    `);
  }

  // Fetch actions the user's role can access
  const userRoles = req.user.roles || [];
  const actions = await db.raw(`
    SELECT * FROM \`farming_manager_quick_actions\`
    WHERE \`is_active\` = 1
    ORDER BY \`sort_order\` ASC
  `);

  const filtered = (actions[0] || []).filter(a => {
    if (!a.role_access) return true;
    try {
      const roles = typeof a.role_access === 'string' ? JSON.parse(a.role_access) : a.role_access;
      return roles.some(r => userRoles.includes(r));
    } catch (_) { return true; }
  });

  res.json({ status: 'success', data: filtered });
});
