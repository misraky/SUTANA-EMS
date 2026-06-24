const { db } = require('../../config/database');
const { catchAsync } = require('../../utils/catchAsync');
const posService = require('../../services/pos.service');
const { generateOrderNumber, generateInvoiceNumber } = require('../../utils/orderNumber');
const { sendEmail } = require('../../services/email.service');
const { sendSMS } = require('../../services/sms.service');
const notificationRepository = require('../../repositories/notification.repository');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const carts = new Map();
exports.getProducts = catchAsync(async (req, res) => {
  const { page = 1, limit = 100, categoryId, search, source } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = db('products as p')
    .leftJoin('product_categories as pc', 'p.category_id', 'pc.id')
    .leftJoin('units as u', 'p.unit_id', 'u.id')
    .leftJoin('inventory as i', 'p.id', 'i.product_id')
    .select(
      'p.id',
      'p.name',
      db.raw("COALESCE(p.sku, '') as sku"),
      'p.selling_price',
      'pc.name as category_name',
      'u.abbreviation as unit',
      db.raw('COALESCE(i.quantity, p.stock_quantity, 0) as stock_quantity'),
      'p.business_unit as source',
      'p.product_image'
    )
    .where('p.is_active', true)
    .whereNull('p.deleted_at');

  if (source) {
    query = query.where('p.business_unit', source);
  }
  if (categoryId) {
    query = query.where('p.category_id', categoryId);
  }
  if (search) {
    query = query.where(function () {
      this.where('p.name', 'like', `%${search}%`)
        .orWhere('p.sku', 'like', `%${search}%`);
    });
  }

  const total = await query.clone().clearSelect().count('p.id as total').first();
  const products = await query
    .orderBy('p.name', 'asc')
    .limit(parseInt(limit))
    .offset(offset);

  res.json({
    status: 'success',
    data: {
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.total)
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
  let { productId, quantity } = req.body;
  const userId = req.user.id;

  if (typeof productId === 'string' && productId.includes('_')) {
    const parts = productId.split('_');
    productId = parseInt(parts[1], 10);
  } else {
    productId = parseInt(productId, 10);
  }

  const product = await db('products as p')
    .leftJoin('inventory as i', 'p.id', 'i.product_id')
    .select('p.id', 'p.name', 'p.selling_price as price', 'p.business_unit',
      db.raw('COALESCE(i.quantity, p.stock_quantity, 0) as stock_quantity'))
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

  const productIdStr = String(product.id);
  const existingItem = cart.items.find(item => item.productId === productIdStr);
  if (existingItem) {
    existingItem.quantity += quantity;
    existingItem.total = existingItem.quantity * existingItem.unitPrice;
  } else {
    cart.items.push({
      id: Date.now().toString(),
      productId: productIdStr,
      source: product.business_unit,
      realId: product.id,
      productName: product.name,
      quantity,
      unitPrice: parseFloat(product.price),
      total: quantity * parseFloat(product.price)
    });
  }
  carts.set(userId, cart);
  res.json({
    status: 'success',
    message: 'Item added to cart',
    data: result
  });
});
exports.updateCartItem = catchAsync(async (req, res) => {
  await posService.updateCartItem(req.user.id, req.params.itemId, req.body.quantity);
  res.json({ status: 'success', message: 'Cart item updated' });
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

  const product = await db('products as p')
    .leftJoin('inventory as i', 'p.id', 'i.product_id')
    .select(db.raw('COALESCE(i.quantity, p.stock_quantity, 0) as stock_quantity'))
    .where('p.id', item.realId)
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
exports.checkout = catchAsync(async (req, res) => {
  const shift = await db('pos_shifts').where({ cashier_id: req.user.id, status: 'OPEN' }).first();
  if (!shift) throw new AppError('No open shift. Please start a shift before processing sales.', 400);

  const {
    customerId,
    customer,
    paymentMethod,
    amountPaid,
    paymentReference,
    notes,
    serials // Expected format: { [productId]: ['serial1', 'serial2'] }
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
  if (!finalCustomerId && customer && customer.name) {
    let phone = (customer.phone || '').replace(/[^0-9]/g, '');
    if (phone.length > 10) phone = phone.slice(phone.length - 10);
    if (phone.length >= 9) phone = '0' + phone.slice(phone.length - 9);
    const existing = phone.length >= 9
      ? await db('customers').where('phone', phone).whereNull('deleted_at').first()
      : null;
    if (existing) {
      finalCustomerId = existing.id;
    } else {
      const [newCustomerId] = await db('customers').insert({
        name: customer.name,
        phone: phone || customer.phone || null,
        email: customer.email || null,
        customer_type_id: 5, 
        created_by: userId,
        created_at: db.fn.now()
      });
      finalCustomerId = newCustomerId;
    }
  }
  const invoiceNumber = await generateInvoiceNumber();
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
      sale_type: 'walk_in',
      order_source: null,
      order_id: null,
      notes: notes || null
    });
    if (paymentMethod === 'Credit' && finalCustomerId) {
      await trx('customers')
        .where('id', finalCustomerId)
        .increment('current_balance', totalAmount);
    }
    for (const item of cart.items) {
      const productId = item.realId;
      await trx('pos_items').insert({
        sale_id: saleId,
        product_id: productId,
        source: item.source || 'retail',
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount_percent: 0,
        subtotal: item.quantity * item.unitPrice,
        total: item.quantity * item.unitPrice
      });

      const product = await trx('products').where('id', productId).first();

      if (product && product.requires_serial) {
        const itemSerials = (serials && serials[item.productId]) || [];
        if (itemSerials.length !== item.quantity) {
          throw new AppError(`Product ${product.name} requires exactly ${item.quantity} serial numbers.`, 400);
        }
        for (const serial of itemSerials) {
          const serialRecord = await trx('inventory_serials')
            .where({ product_id: productId, serial_number: serial, status: 'IN_STOCK' })
            .first();
          if (!serialRecord) {
            throw new AppError(`Serial number ${serial} for product ${product.name} is not available in stock.`, 400);
          }
          await trx('inventory_serials')
            .where('id', serialRecord.id)
            .update({ status: 'SOLD', sale_id: saleId, updated_at: db.fn.now() });
        }
      }

      const inventoryRecord = await trx('inventory').where('product_id', productId).first();
      if (inventoryRecord) {
        const newQuantity = inventoryRecord.quantity - item.quantity;
        await trx('inventory')
          .where('product_id', productId)
          .update({ quantity: newQuantity, last_updated: db.fn.now() });
        await trx('inventory_movements').insert({
          product_id: productId,
          transaction_type: 'Sale',
          quantity_change: -item.quantity,
          quantity_before: inventoryRecord.quantity,
          quantity_after: newQuantity,
          reference_type: 'POS',
          reference_id: saleId,
          performed_by: userId,
          created_at: db.fn.now()
        });
      } else {
        await trx('products').where('id', productId).decrement('stock_quantity', item.quantity);
      }

      // Also decrease source-specific stock (farming_products / pharmacy_medications)
      if (product && item.source === 'farming') {
        const fpId = parseInt((product.sku || '').replace('FARM-', ''), 10);
        if (fpId) await trx('farming_products').where('id', fpId).decrement('stock_quantity', item.quantity);
      } else if (product && item.source === 'pharmacy') {
        const phId = parseInt((product.sku || '').replace('PHARM-', ''), 10);
        if (phId) await trx('pharmacy_medications').where('id', phId).decrement('stock_quantity', item.quantity);
      }
    }
    return saleId;
  });
  carts.delete(userId);

  /* Update shift totals */
  await db('pos_shifts').where({ id: shift.id }).update({
    transaction_count: db.raw('transaction_count + 1'),
    total_sales: db.raw('COALESCE(total_sales,0) + ?', [totalAmount]),
    cash_collected: paymentMethod === 'Cash' ? db.raw('COALESCE(cash_collected,0) + ?', [totalAmount]) : db.raw('cash_collected'),
    telebirr_collected: paymentMethod === 'Telebirr' ? db.raw('COALESCE(telebirr_collected,0) + ?', [totalAmount]) : db.raw('telebirr_collected'),
    transfer_collected: paymentMethod === 'Bank Transfer' ? db.raw('COALESCE(transfer_collected,0) + ?', [totalAmount]) : db.raw('transfer_collected'),
    credit_collected: paymentMethod === 'Credit' ? db.raw('COALESCE(credit_collected,0) + ?', [totalAmount]) : db.raw('credit_collected'),
    check_collected: paymentMethod === 'Check' ? db.raw('COALESCE(check_collected,0) + ?', [totalAmount]) : db.raw('check_collected'),
  });

  await audit('SALE_COMPLETED', result, {
    ip,
    details: {
      invoiceNumber,
      totalAmount,
      paymentMethod,
      itemCount: cart.items.length
    }
  });

  /* Manager notification */
  const cashier = await db('users').where('id', userId).select('full_name').first();
  const managers = await db('users')
    .join('user_roles', 'users.id', 'user_roles.user_id')
    .join('roles', 'user_roles.role_id', 'roles.id')
    .join('user_statuses', 'users.status_id', 'user_statuses.id')
    .whereIn('roles.name', ['Admin', 'Manager', 'CEO'])
    .where('user_statuses.status_code', 'active')
    .select('users.id')
    .distinct();
  for (const mgr of managers) {
    await db('notifications').insert({
      user_id: mgr.id,
      title: 'New Sale',
      message: `Sale ${invoiceNumber}: ${totalAmount} ETB (${paymentMethod}) by ${cashier ? cashier.full_name : 'Cashier'}`,
      type: 'pos',
      is_read: 0,
      created_at: db.fn.now()
    }).catch(() => {});
  }
  /* Sale audit log */
  await db('sale_audit_log').insert({
    pos_sale_id: result,
    action: 'created',
    performed_by: userId,
    action_details: JSON.stringify({ invoiceNumber, totalAmount, paymentMethod }),
    created_at: db.fn.now()
  }).catch(() => {});

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
      sale: {
        id: result,
        invoice_number: invoiceNumber,
        total_amount: totalAmount,
        amount_paid: amountPaid,
        change_amount: changeAmount,
        paymentMethod,
        itemsSold: cart.items.length
      }
    }
  });
});
exports.getSalesHistory = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 25,
    startDate,
    endDate,
    customerId,
    search,
    source
  } = req.query;
  const offset = (page - 1) * limit;
  let query = db('pos_sales as ps')
    .leftJoin('customers as c', 'ps.customer_id', 'c.id')
    .leftJoin('users as u', 'ps.cashier_id', 'u.id')
    .leftJoin('sale_statuses as ss', 'ps.status_id', 'ss.id')
    .leftJoin('payment_methods as pm', 'ps.payment_method_id', 'pm.id')
    .select(
      'ps.id',
      'ps.invoice_number',
      'ps.sale_type',
      'ps.order_source',
      'c.name as customer_name',
      'c.phone as customer_phone',
      'ps.total_amount',
      'ps.payment_method_id',
      'ps.sale_date',
      'ss.status_name as status',
      'u.full_name as cashier_name',
      'pm.name as payment_method_name'
    );
  if (startDate && endDate) {
    query = query.whereBetween('ps.sale_date', [startDate, endDate]);
  }
  if (customerId) {
    query = query.where('ps.customer_id', customerId);
  }
  if (search) {
    query = query.where('ps.invoice_number', 'like', `%${search}%`);
  }
  if (source) {
    const validSources = ['retail', 'farming', 'pharmacy'];
    if (validSources.includes(source)) {
      query = query.whereExists(function () {
        this.select('*')
          .from('pos_items')
          .whereRaw('pos_items.sale_id = ps.id')
          .where('pos_items.source', source);
      });
    }
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
    .select('pi.*', db.raw('COALESCE(p.name, CONCAT("Product #", pi.product_id)) as product_name'), 'p.sku')
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
    .select('pi.*', db.raw('COALESCE(p.name, CONCAT("Product #", pi.product_id)) as product_name'))
    .where('pi.sale_id', saleId);
  const paymentMethod = await db('payment_methods').where('id', sale.payment_method_id).select('name').first();
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
        paymentMethod: paymentMethod ? paymentMethod.name : 'Unknown',
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
      const inventoryRecord = await trx('inventory')
        .where('product_id', item.product_id)
        .first();
      if (inventoryRecord) {
        const newQuantity = inventoryRecord.quantity + item.quantity;
        await trx('inventory')
          .where('product_id', item.product_id)
          .update({ quantity: newQuantity, last_updated: db.fn.now() });
        await trx('inventory_movements').insert({
          product_id: item.product_id,
          transaction_type: 'Adjustment',
          quantity_change: item.quantity,
          quantity_before: inventoryRecord.quantity,
          quantity_after: newQuantity,
          reference_type: 'VOID',
          reference_id: saleId,
          reason: `Void sale: ${reason}`,
          performed_by: userId,
          created_at: db.fn.now()
        });
      } else {
        await trx('products').where('id', item.product_id).increment('stock_quantity', item.quantity);
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
    .leftJoin('sale_statuses', 'pos_sales.status_id', 'sale_statuses.id')
    .whereRaw('DATE(pos_sales.sale_date) = ?', [date])
    .where('sale_statuses.status_code', 'completed')
    .select(
      db.raw('COUNT(pos_sales.id) as total_transactions'),
      db.raw('SUM(pos_sales.total_amount) as total_revenue'),
      db.raw('AVG(pos_sales.total_amount) as average_transaction'),
      db.raw('SUM(pos_sales.tax_amount) as total_tax'),
      db.raw('SUM(pos_sales.discount_amount) as total_discount'),
      db.raw('SUM(CASE WHEN pos_sales.payment_method_id = (SELECT id FROM payment_methods WHERE name = ?) THEN pos_sales.total_amount ELSE 0 END) as cash_collected', ['Cash'])
    )
    .first();
  const paymentBreakdown = await db('pos_sales')
    .leftJoin('payment_methods', 'pos_sales.payment_method_id', 'payment_methods.id')
    .leftJoin('sale_statuses', 'pos_sales.status_id', 'sale_statuses.id')
    .whereRaw('DATE(pos_sales.sale_date) = ?', [date])
    .where('sale_statuses.status_code', 'completed')
    .select('payment_methods.name as method', db.raw('COUNT(pos_sales.id) as count'), db.raw('SUM(pos_sales.total_amount) as amount'))
    .groupBy('pos_sales.payment_method_id', 'payment_methods.name');
  const activeShifts = await db('pos_shifts').where('status', 'OPEN').count('* as count').first();
  const businessUnits = await getBusinessUnitStats({ date });
  res.json({
    status: 'success',
    data: {
      date,
      todaySales: parseFloat(stats.total_revenue || 0),
      todayTransactions: parseInt(stats.total_transactions || 0),
      cashCollected: parseFloat(stats.cash_collected || 0),
      activeShifts: parseInt(activeShifts.count || 0),
      statistics: {
        totalTransactions: parseInt(stats.total_transactions || 0),
        totalRevenue: parseFloat(stats.total_revenue || 0),
        averageTransaction: parseFloat(stats.average_transaction || 0),
        totalTax: parseFloat(stats.total_tax || 0),
        totalDiscount: parseFloat(stats.total_discount || 0)
      },
      paymentBreakdown,
      businessUnits
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


async function getBusinessUnitStats({ date }) {
  /* Gather today's sales from each business unit's order table */
  const units = [];
  const queries = [
    { name: 'Pharmacy', table: 'pharmacy_orders', amountCol: 'total_amount', dateCol: 'created_at' },
    { name: 'Printing', table: 'printing_orders', amountCol: 'total_amount', dateCol: 'created_at' },
    { name: 'Farming',  table: 'farming_orders',  amountCol: 'total_price', dateCol: 'created_at' },
    { name: 'Car Rental', table: 'rentals',       amountCol: 'total_cost', dateCol: 'created_at' },
  ];
  for (const u of queries) {
    const has = await db.schema.hasTable(u.table);
    if (!has) { units.push({ name: u.name, todaySales: 0, transactions: 0 }); continue; }
    const row = await db(u.table)
      .whereRaw(`DATE(${u.dateCol}) = ?`, [date])
      .select(db.raw('COUNT(*) as count'), db.raw(`COALESCE(SUM(${u.amountCol}),0) as total`))
      .first();
    units.push({ name: u.name, todaySales: parseFloat(row.total || 0), transactions: parseInt(row.count || 0) });
  }
  /* POS sales already in stats */
  const posRow = await db('pos_sales')
    .whereRaw('DATE(sale_date) = ?', [date])
    .where('status_id', 1)
    .select(db.raw('COUNT(*) as count'), db.raw('COALESCE(SUM(total_amount),0) as total'))
    .first();
  units.unshift({ name: 'POS (Retail)', todaySales: parseFloat(posRow.total || 0), transactions: parseInt(posRow.count || 0) });
  return units;
}
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

/* ── Shift Management ── */

exports.getCurrentShift = catchAsync(async (req, res) => {
  const shift = await db('pos_shifts').where({ cashier_id: req.user.id, status: 'OPEN' }).first();
  res.json({ status: 'success', data: shift || null });
});

exports.openShift = catchAsync(async (req, res) => {
  const { opening_float, shift_type } = req.body;
  const existing = await db('pos_shifts').where({ cashier_id: req.user.id, status: 'OPEN' }).first();
  if (existing) throw new AppError('You already have an open shift. Close it first.', 400);
  const [id] = await db('pos_shifts').insert({
    cashier_id: req.user.id, shift_type: shift_type || 'morning',
    opening_float: parseFloat(opening_float || 0), status: 'OPEN', opened_at: db.fn.now()
  });
  const shift = await db('pos_shifts').where({ id }).first();

  // Record CLOCK_IN in attendance_records using raw SQL
  const now = new Date();
  const workDate = now.toISOString().split('T')[0];
  const ts = now.toISOString().slice(0, 19).replace('T', ' ');
  let empId = null;
  const emp = await db('employees').where('user_id', req.user.id).first();
  if (emp) {
    empId = emp.employee_id;
  } else {
    const user = await db('users').where('id', req.user.id).first();
    if (user) {
      const newEmpId = `EMP${String(req.user.id).padStart(4, '0')}`;
      const dept = user.department || 'Retail';
      await db.raw(`INSERT IGNORE INTO employees (employee_id, user_id, full_name, email, phone, department, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'Active', NOW())`, [newEmpId, req.user.id, user.full_name || user.username || user.email, user.email || '', user.phone || '', dept]);
      empId = newEmpId;
    }
  }
  if (empId) {
    await db.raw(`INSERT IGNORE INTO attendance_records (employee_id, computer_id, action, status, timestamp, ip_address, work_date, recorded_by, created_at) VALUES (?, 'WEB', 'CLOCK_IN', 'Present', ?, ?, ?, ?, NOW())`, [empId, ts, req.ip || '127.0.0.1', workDate, req.user.id]);
  }

  res.status(201).json({ status: 'success', data: shift });
});

exports.closeShift = catchAsync(async (req, res) => {
  const { physical_cash_counted, difference_reason } = req.body;
  const shift = await db('pos_shifts').where({ cashier_id: req.user.id, status: 'OPEN' }).first();
  if (!shift) throw new AppError('No open shift found', 404);
  const expectedCash = parseFloat(shift.opening_float) + parseFloat(shift.cash_collected || 0);
  const counted = parseFloat(physical_cash_counted || 0);
  const difference = counted - expectedCash;
  const cashToHandover = parseFloat(shift.cash_collected || 0) + parseFloat(shift.telebirr_collected || 0) + parseFloat(shift.transfer_collected || 0) + parseFloat(shift.check_collected || 0);
  await db('pos_shifts').where({ id: shift.id }).update({
    physical_cash_counted: counted, difference_amount: difference,
    difference_reason: difference !== 0 ? (difference_reason || 'Discrepancy not explained') : null,
    cash_to_handover: cashToHandover, status: 'CLOSED', closed_at: db.fn.now()
  });

  try {
    const manager = await db('users').join('user_roles', 'users.id', 'user_roles.user_id').join('roles', 'user_roles.role_id', 'roles.id').join('user_statuses', 'users.status_id', 'user_statuses.id').whereIn('roles.name', ['Admin', 'Manager', 'CEO']).where('user_statuses.status_code', 'active').select('users.id').first();
    if (manager) {
      await db('cash_handovers').insert({
        from_user_id: req.user.id,
        to_user_id: manager.id,
        handover_type: 'CASHIER_TO_MANAGER',
        total_cash: counted,
        total_telebirr: parseFloat(shift.telebirr_collected || 0),
        total_transfer: parseFloat(shift.transfer_collected || 0),
        total_credit: parseFloat(shift.credit_collected || 0),
        total_check: parseFloat(shift.check_collected || 0),
        total_amount: counted + parseFloat(shift.telebirr_collected || 0) + parseFloat(shift.transfer_collected || 0) + parseFloat(shift.credit_collected || 0) + parseFloat(shift.check_collected || 0),
        notes: `System Auto-Handover on Shift Close for Shift #${shift.id}`,
        status: 'PENDING'
      });
      await db('notifications').insert({
        user_id: manager.id,
        title: 'Auto Cash Handover',
        message: `Cashier #${req.user.id} closed their shift. Auto-handover of ${counted} ETB physical cash requires your review.`,
        type: 'pos',
        is_read: 0,
        created_at: db.fn.now()
      }).catch(() => null);
    }
  } catch (err) {
    console.error('Failed to auto-handover:', err);
  }

  // Record CLOCK_OUT in attendance_records using raw SQL
  const now = new Date();
  const workDate = now.toISOString().split('T')[0];
  const ts = now.toISOString().slice(0, 19).replace('T', ' ');
  let empId = null;
  const emp = await db('employees').where('user_id', req.user.id).first();
  if (emp) {
    empId = emp.employee_id;
  } else {
    const user = await db('users').where('id', req.user.id).first();
    if (user) {
      const newEmpId = `EMP${String(req.user.id).padStart(4, '0')}`;
      const dept = user.department || 'Retail';
      await db.raw(`INSERT IGNORE INTO employees (employee_id, user_id, full_name, email, phone, department, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'Active', NOW())`, [newEmpId, req.user.id, user.full_name || user.username || user.email, user.email || '', user.phone || '', dept]);
      empId = newEmpId;
    }
  }
  if (empId) {
    await db.raw(`INSERT IGNORE INTO attendance_records (employee_id, computer_id, action, status, timestamp, ip_address, work_date, recorded_by, created_at) VALUES (?, 'WEB', 'CLOCK_OUT', 'Present', ?, ?, ?, ?, NOW())`, [empId, ts, req.ip || '127.0.0.1', workDate, req.user.id]);
  }

  res.json({ status: 'success', message: 'Shift closed and auto-handover initiated', data: {
    opening_float: shift.opening_float, cash_collected: shift.cash_collected,
    expected_cash: expectedCash, physical_cash_counted: counted,
    difference, cash_to_handover: cashToHandover
  }});
});

exports.getShiftHistory = catchAsync(async (req, res) => {
  const { limit = 20 } = req.query;
  const shifts = await db('pos_shifts').where({ cashier_id: req.user.id }).orderBy('created_at', 'desc').limit(parseInt(limit));
  res.json({ status: 'success', data: shifts });
});

exports.getAllOpenShifts = catchAsync(async (req, res) => {
  const shifts = await db('pos_shifts as ps')
    .leftJoin('users as u', 'ps.cashier_id', 'u.id')
    .where('ps.status', 'OPEN')
    .select('ps.*', 'u.full_name as cashier_name', 'u.employee_id')
    .orderBy('ps.opened_at', 'desc');
  res.json({ status: 'success', data: shifts });
});

exports.getAllShiftHistory = catchAsync(async (req, res) => {
  const { limit = 200, startDate, endDate, search } = req.query;
  let query = db('pos_shifts as ps')
    .leftJoin('users as u', 'ps.cashier_id', 'u.id')
    .select('ps.*', 'u.full_name as cashier_name', 'u.employee_id')
    .orderBy('ps.opened_at', 'desc')
    .limit(parseInt(limit));
  if (startDate) query = query.where('ps.opened_at', '>=', startDate);
  if (endDate) query = query.where('ps.opened_at', '<=', endDate);
  if (search) query = query.where(function () { this.where('u.full_name', 'like', `%${search}%`).orWhere('u.employee_id', 'like', `%${search}%`); });
  const shifts = await query;
  res.json({ status: 'success', data: shifts });
});

exports.verifyShift = catchAsync(async (req, res) => {
  const { shiftId } = req.params;
  const { status } = req.body;
  await db('pos_shifts').where({ id: shiftId }).update({ status, verified_by: req.user.id, verified_at: db.fn.now() });
  res.json({ status: 'success', message: `Shift ${status === 'VERIFIED' ? 'verified' : 'rejected'}` });
});

/* ── Cash Handover ── */

exports.submitCashierHandover = catchAsync(async (req, res) => {
  const { to_user_id, total_cash, total_telebirr, total_transfer, total_credit, total_check, notes } = req.body;
  const totalAmount = [total_cash, total_telebirr, total_transfer, total_credit, total_check].reduce((s, v) => s + parseFloat(v || 0), 0);
  const [id] = await db('cash_handovers').insert({
    from_user_id: req.user.id, to_user_id, handover_type: 'CASHIER_TO_MANAGER',
    total_cash: parseFloat(total_cash || 0), total_telebirr: parseFloat(total_telebirr || 0),
    total_transfer: parseFloat(total_transfer || 0), total_credit: parseFloat(total_credit || 0),
    total_check: parseFloat(total_check || 0), total_amount: totalAmount, notes: notes || null
  });
  res.status(201).json({ status: 'success', data: await db('cash_handovers').where({ id }).first() });
});

exports.submitManagerHandover = catchAsync(async (req, res) => {
  const { to_user_id, total_cash, total_telebirr, total_transfer, total_credit, total_check, notes } = req.body;
  const totalAmount = [total_cash, total_telebirr, total_transfer, total_credit, total_check].reduce((s, v) => s + parseFloat(v || 0), 0);
  const [id] = await db('cash_handovers').insert({
    from_user_id: req.user.id, to_user_id, handover_type: 'MANAGER_TO_FINANCE',
    total_cash: parseFloat(total_cash || 0), total_telebirr: parseFloat(total_telebirr || 0),
    total_transfer: parseFloat(total_transfer || 0), total_credit: parseFloat(total_credit || 0),
    total_check: parseFloat(total_check || 0), total_amount: totalAmount, notes: notes || null
  });
  res.status(201).json({ status: 'success', data: await db('cash_handovers').where({ id }).first() });
});

exports.getPendingHandovers = catchAsync(async (req, res) => {
  const handovers = await db('cash_handovers as ch')
    .leftJoin('users as u1', 'ch.from_user_id', 'u1.id')
    .leftJoin('users as u2', 'ch.to_user_id', 'u2.id')
    .where('ch.status', 'PENDING')
    .select('ch.*', 'u1.full_name as from_name', 'u2.full_name as to_name')
    .orderBy('ch.created_at', 'desc');
  res.json({ status: 'success', data: handovers });
});

exports.verifyHandover = catchAsync(async (req, res) => {
  const { handoverId } = req.params;
  const { status } = req.body;
  await db('cash_handovers').where({ id: handoverId }).update({ status, verified_at: db.fn.now() });
  res.json({ status: 'success', message: `Handover ${status.toLowerCase()}` });
});

/* ── Online Order Collection ── */

exports.collectOnlineOrder = catchAsync(async (req, res) => {
  const { orderSource, orderId, paymentMethod, amountPaid, payment_reference } = req.body;
  const userId = req.user.id;
  const ip = req.ip;

  const order = await db(orderSource).where('id', orderId).first();
  if (!order) throw new AppError('Order not found', 404);
  if (order.status === 'COMPLETED' || order.status === 'DELIVERED') {
    throw new AppError('Order has already been collected', 400);
  }

  /* Determine business unit from order table name */
  let businessUnit = 'retail';
  if (orderSource === 'farming_orders') businessUnit = 'farming';
  else if (orderSource === 'pharmacy_orders') businessUnit = 'pharmacy';

  /* Fetch order items */
  let itemsTable, productIdCol, priceCol;
  if (orderSource === 'retail_orders') {
    itemsTable = 'retail_order_items';
    productIdCol = 'product_id';
    priceCol = 'unit_price';
  } else if (orderSource === 'farming_orders') {
    itemsTable = 'farming_order_items';
    productIdCol = 'product_id';
    priceCol = 'unit_price';
  } else {
    /* pharmacy_orders — may not have items table; use order total */
    itemsTable = null;
  }

  const orderItems = itemsTable
    ? await db(itemsTable).where('order_id', orderId).select('*')
    : [{ quantity: 1, unit_price: order.total_amount, product_id: null }];

  const subtotal = orderItems.reduce((s, i) => s + parseFloat(i[priceCol] || i.unit_price) * i.quantity, 0);
  const totalAmount = parseFloat(order.total_amount) || subtotal;
  const taxAmount = parseFloat(order.tax || 0);
  const discountAmount = parseFloat(order.discount_amount || 0);

  const pmtMethod = paymentMethod || order.payment_method || 'Cash';
  const pmtMethodRecord = await db('payment_methods')
    .where('name', pmtMethod)
    .first() || await db('payment_methods').where('name', 'Cash').first();

  const invoiceNumber = order.invoice_number || await generateOrderNumber('INV');
  const completedStatus = await db('sale_statuses').where('status_code', 'completed').first();

  const shift = await db('pos_shifts').where({ cashier_id: userId, status: 'OPEN' }).first();

  const result = await transaction(async (trx) => {
    const [saleId] = await trx('pos_sales').insert({
      invoice_number: invoiceNumber,
      customer_id: order.customer_id || null,
      subtotal,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      total_amount: amountPaid || totalAmount,
      payment_method_id: pmtMethodRecord.id,
      payment_reference: payment_reference || null,
      amount_paid: amountPaid || totalAmount,
      change_amount: 0,
      cashier_id: userId,
      sale_date: db.fn.now(),
      status_id: completedStatus.id,
      sale_type: 'online',
      order_source: orderSource,
      order_id: orderId,
      notes: `Online order collection from ${orderSource}#${orderId}`
    });

    for (const item of orderItems) {
      await trx('pos_items').insert({
        sale_id: saleId,
        product_id: item[productIdCol] || item.product_id || 0,
        source: businessUnit,
        quantity: item.quantity,
        unit_price: parseFloat(item[priceCol] || item.unit_price),
        discount_percent: 0,
        subtotal: parseFloat(item[priceCol] || item.unit_price) * item.quantity,
        total: parseFloat(item[priceCol] || item.unit_price) * item.quantity
      });
    }

    /* Mark original order as COMPLETED */
    await trx(orderSource).where('id', orderId).update({
      status: 'COMPLETED',
      updated_at: db.fn.now()
    });

    return saleId;
  });

  /* Update shift totals */
  if (shift) {
    await db('pos_shifts').where({ id: shift.id }).update({
      transaction_count: db.raw('transaction_count + 1'),
      total_sales: db.raw('COALESCE(total_sales,0) + ?', [totalAmount]),
      cash_collected: pmtMethod === 'Cash' ? db.raw('COALESCE(cash_collected,0) + ?', [totalAmount]) : db.raw('cash_collected'),
      telebirr_collected: pmtMethod === 'Telebirr' ? db.raw('COALESCE(telebirr_collected,0) + ?', [totalAmount]) : db.raw('telebirr_collected'),
      transfer_collected: pmtMethod === 'Bank Transfer' ? db.raw('COALESCE(transfer_collected,0) + ?', [totalAmount]) : db.raw('transfer_collected'),
      check_collected: pmtMethod === 'Check' ? db.raw('COALESCE(check_collected,0) + ?', [totalAmount]) : db.raw('check_collected'),
    });
  }

  /* Manager notification */
  const cashier = await db('users').where('id', userId).select('full_name').first();
  const managers = await db('users').join('user_roles', 'users.id', 'user_roles.user_id').join('roles', 'user_roles.role_id', 'roles.id').join('user_statuses', 'users.status_id', 'user_statuses.id').whereIn('roles.name', ['Admin', 'Manager', 'CEO']).where('user_statuses.status_code', 'active').select('users.id').distinct();
  for (const mgr of managers) {
    await db('notifications').insert({
      user_id: mgr.id,
      title: 'Online Order Collected',
      message: `Online order ${invoiceNumber} (${orderSource}) collected — ${totalAmount} ETB by ${cashier ? cashier.full_name : 'Cashier'}`,
      type: 'pos',
      is_read: 0,
      created_at: db.fn.now()
    }).catch(() => {});
  }

  await audit('ONLINE_ORDER_COLLECTED', result, {
    ip, details: { invoiceNumber, totalAmount, orderSource, orderId }
  });

  res.status(201).json({
    status: 'success',
    message: 'Online order collected successfully',
    data: { saleId: result, invoiceNumber, totalAmount }
  });
});

/* ── Manager Sale Approval / Flag ── */

exports.getManagerSales = catchAsync(async (req, res) => {
  const { page = 1, limit = 25, saleType, startDate, endDate, status } = req.query;
  const offset = (page - 1) * limit;
  let query = db('pos_sales as ps')
    .leftJoin('customers as c', 'ps.customer_id', 'c.id')
    .leftJoin('users as u', 'ps.cashier_id', 'u.id')
    .leftJoin('sale_statuses as ss', 'ps.status_id', 'ss.id')
    .leftJoin('payment_methods as pm', 'ps.payment_method_id', 'pm.id')
    .select(
      'ps.id', 'ps.invoice_number', 'ps.sale_type', 'ps.total_amount',
      'ps.subtotal', 'ps.tax_amount', 'ps.discount_amount',
      'ps.amount_paid', 'ps.change_amount', 'ps.sale_date',
      'ps.manager_approved', 'ps.manager_flag_reason',
      'ps.order_source', 'ps.order_id',
      'c.name as customer_name', 'u.full_name as cashier_name',
      'ss.status_name as status_name', 'pm.name as payment_method_name'
    );
  if (saleType) query = query.where('ps.sale_type', saleType);
  if (startDate && endDate) query = query.whereBetween('ps.sale_date', [startDate, endDate]);
  if (status) {
    if (status === 'pending') query = query.where('ps.manager_approved', false);
    else if (status === 'approved') query = query.where('ps.manager_approved', true);
    else if (status === 'flagged') query = query.whereNotNull('ps.manager_flag_reason');
  }
  const total = await query.clone().count('ps.id as total').first();
  const sales = await query.orderBy('ps.sale_date', 'desc').limit(limit).offset(offset);
  res.json({
    status: 'success',
    data: {
      sales,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: parseInt(total.total) }
    }
  });
});

exports.managerApproveSale = catchAsync(async (req, res) => {
  const { saleId } = req.params;
  const { reason } = req.body;
  const managerId = req.user.id;
  const sale = await db('pos_sales').where('id', saleId).first();
  if (!sale) throw new AppError('Sale not found', 404);
  await transaction(async (trx) => {
    await trx('pos_sales').where('id', saleId).update({
      manager_approved: true,
      manager_approved_by: managerId,
      manager_approved_at: db.fn.now(),
      manager_flag_reason: null
    });
    await trx('manager_sale_actions').insert({
      pos_sale_id: saleId,
      manager_id: managerId,
      action: 'approved',
      reason: reason || null,
      created_at: db.fn.now()
    });
    await trx('sale_audit_log').insert({
      pos_sale_id: saleId,
      action: 'approved',
      performed_by: managerId,
      action_details: JSON.stringify({ reason }),
      created_at: db.fn.now()
    });
  });
  res.json({ status: 'success', message: 'Sale approved' });
});

exports.managerFlagSale = catchAsync(async (req, res) => {
  const { saleId } = req.params;
  const { reason } = req.body;
  if (!reason) throw new AppError('Flag reason is required', 400);
  const managerId = req.user.id;
  const sale = await db('pos_sales').where('id', saleId).first();
  if (!sale) throw new AppError('Sale not found', 404);
  await transaction(async (trx) => {
    await trx('pos_sales').where('id', saleId).update({
      manager_flag_reason: reason,
      manager_approved: false
    });
    await trx('manager_sale_actions').insert({
      pos_sale_id: saleId,
      manager_id: managerId,
      action: 'flagged',
      reason,
      created_at: db.fn.now()
    });
    await trx('sale_audit_log').insert({
      pos_sale_id: saleId,
      action: 'flagged',
      performed_by: managerId,
      action_details: JSON.stringify({ reason }),
      created_at: db.fn.now()
    });
  });
  res.json({ status: 'success', message: 'Sale flagged for review' });
});

exports.getSaleAuditLog = catchAsync(async (req, res) => {
  const { saleId } = req.params;
  const logs = await db('sale_audit_log as sal')
    .leftJoin('users as u', 'sal.performed_by', 'u.id')
    .select('sal.*', 'u.full_name as performed_by_name')
    .where('sal.pos_sale_id', saleId)
    .orderBy('sal.created_at', 'asc');
  res.json({ status: 'success', data: logs });
});

/* ── Combined Daily Report (walk-in + online) ── */

exports.getCombinedDailyReport = catchAsync(async (req, res) => {
  const { date = new Date().toISOString().split('T')[0] } = req.query;
  const report = { date, walkIn: {}, online: {}, combined: {} };

  /* Walk-in POS sales */
  const walkInStats = await db('pos_sales')
    .whereRaw('DATE(sale_date) = ?', [date])
    .where('sale_type', 'walk_in')
    .select(
      db.raw('COUNT(*) as total_transactions'),
      db.raw('COALESCE(SUM(total_amount),0) as total_revenue'),
      db.raw('COALESCE(SUM(tax_amount),0) as total_tax'),
      db.raw('COALESCE(SUM(discount_amount),0) as total_discount'),
      db.raw('COALESCE(SUM(amount_paid),0) as total_collected')
    )
    .first();

  const walkInPaymentBreakdown = await db('pos_sales')
    .leftJoin('payment_methods', 'pos_sales.payment_method_id', 'payment_methods.id')
    .whereRaw('DATE(pos_sales.sale_date) = ?', [date])
    .where('pos_sales.sale_type', 'walk_in')
    .select('payment_methods.name as method',
      db.raw('COUNT(*) as count'),
      db.raw('COALESCE(SUM(pos_sales.total_amount),0) as amount'))
    .groupBy('payment_methods.id', 'payment_methods.name');

  report.walkIn = {
    totalTransactions: parseInt(walkInStats.total_transactions || 0),
    totalRevenue: parseFloat(walkInStats.total_revenue || 0),
    totalTax: parseFloat(walkInStats.total_tax || 0),
    totalDiscount: parseFloat(walkInStats.total_discount || 0),
    totalCollected: parseFloat(walkInStats.total_collected || 0),
    paymentBreakdown: walkInPaymentBreakdown
  };

  /* Online order collections (from farming_orders, retail_orders, pharmacy_orders) */
  const onlineSources = [
    { table: 'retail_orders', amountCol: 'total_amount', dateCol: 'created_at', name: 'Retail' },
    { table: 'farming_orders', amountCol: 'total_amount', dateCol: 'created_at', name: 'Farming' },
    { table: 'pharmacy_orders', amountCol: 'total_amount', dateCol: 'created_at', name: 'Pharmacy' },
  ];
  let onlineTotalRevenue = 0;
  let onlineTotalTransactions = 0;
  const onlineBySource = [];
  for (const src of onlineSources) {
    const has = await db.schema.hasTable(src.table);
    if (!has) continue;
    const row = await db(src.table)
      .whereRaw(`DATE(${src.dateCol}) = ?`, [date])
      .where('status', 'COMPLETED')
      .select(db.raw('COUNT(*) as count'), db.raw('COALESCE(SUM(total_amount),0) as total'))
      .first();
    const count = parseInt(row.count || 0);
    const total = parseFloat(row.total || 0);
    onlineTotalRevenue += total;
    onlineTotalTransactions += count;
    onlineBySource.push({ source: src.name, transactions: count, revenue: total });
  }
  report.online = {
    totalTransactions: onlineTotalTransactions,
    totalRevenue: onlineTotalRevenue,
    bySource: onlineBySource
  };

  report.combined = {
    totalTransactions: report.walkIn.totalTransactions + report.online.totalTransactions,
    totalRevenue: report.walkIn.totalRevenue + report.online.totalRevenue
  };

  res.json({ status: 'success', data: report });
});

/* ── Today's Sales Summary (for dashboard widgets) ── */

exports.getTodaySummary = catchAsync(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const walkIn = await db('pos_sales')
    .whereRaw('DATE(sale_date) = ?', [today])
    .where('sale_type', 'walk_in')
    .count('* as count')
    .sum('total_amount as revenue')
    .first();
  const onlineFromPos = await db('pos_sales')
    .whereRaw('DATE(sale_date) = ?', [today])
    .where('sale_type', 'online')
    .count('* as count')
    .sum('total_amount as revenue')
    .first();
  const pendingApproval = await db('pos_sales')
    .whereRaw('DATE(sale_date) = ?', [today])
    .where('manager_approved', false)
    .whereNull('manager_flag_reason')
    .count('* as count')
    .first();
  res.json({
    status: 'success',
    data: {
      walkInSales: { count: parseInt(walkIn.count || 0), revenue: parseFloat(walkIn.revenue || 0) },
      onlineCollections: { count: parseInt(onlineFromPos.count || 0), revenue: parseFloat(onlineFromPos.revenue || 0) },
      pendingApproval: parseInt(pendingApproval.count || 0)
    }
  });
});

/* ── Export: Audit PDF ── */
exports.exportAuditPDF = catchAsync(async (req, res) => {
  const { startDate, endDate, source } = req.query;

  let sQuery = db('pos_sales as ps')
    .leftJoin('customers as c', 'ps.customer_id', 'c.id')
    .leftJoin('users as u', 'ps.cashier_id', 'u.id')
    .leftJoin('sale_statuses as ss', 'ps.status_id', 'ss.id')
    .leftJoin('payment_methods as pm', 'ps.payment_method_id', 'pm.id')
    .select('ps.id', 'ps.invoice_number', 'ps.sale_type', 'ps.order_source',
      'c.name as customer_name', 'c.phone as customer_phone',
      'ps.total_amount', 'ps.sale_date',
      'ss.status_name as status', 'u.full_name as cashier_name',
      'pm.name as payment_method_name');

  if (startDate && endDate) sQuery = sQuery.whereBetween('ps.sale_date', [startDate, endDate]);
  else if (startDate) sQuery = sQuery.where('ps.sale_date', '>=', startDate);

  if (source && ['retail', 'farming', 'pharmacy'].includes(source)) {
    sQuery = sQuery.whereExists(function () {
      this.select('*').from('pos_items').whereRaw('pos_items.sale_id = ps.id').where('pos_items.source', source);
    });
  }

  const sales = await sQuery.orderBy('ps.sale_date', 'desc').limit(500);
  const sTot = sales.reduce((a, s) => {
    const amt = parseFloat(s.total_amount || 0); a.total += amt; a.count++;
    const m = s.payment_method_name || '';
    if (m === 'Cash') a.cash += amt; else if (m === 'Telebirr') a.telebirr += amt;
    else if (m === 'Bank Transfer') a.bank += amt; else if (m === 'Credit') a.credit += amt; else if (m === 'Check') a.check += amt;
    if (s.sale_type === 'online') a.online += amt; else a.walkIn += amt;
    return a;
  }, { total: 0, count: 0, cash: 0, telebirr: 0, bank: 0, credit: 0, check: 0, online: 0, walkIn: 0 });

  let shQuery = db('pos_shifts as ps')
    .leftJoin('users as u', 'ps.cashier_id', 'u.id')
    .select('ps.*', 'u.full_name as cashier_name')
    .orderBy('ps.opened_at', 'desc').limit(200);
  if (startDate) shQuery = shQuery.where('ps.opened_at', '>=', startDate);
  if (endDate) shQuery = shQuery.where('ps.opened_at', '<=', endDate + 'T23:59:59');
  const shifts = await shQuery;

  const shTot = shifts.reduce((a, sh) => {
    a.sales += parseFloat(sh.total_sales || 0); a.txns += parseInt(sh.transaction_count || 0);
    a.cash += parseFloat(sh.cash_collected || 0); a.telebirr += parseFloat(sh.telebirr_collected || 0);
    a.bank += parseFloat(sh.transfer_collected || 0); return a;
  }, { sales: 0, txns: 0, cash: 0, telebirr: 0, bank: 0 });

  const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
  const fn = `audit_report_${startDate || 'all'}_to_${endDate || 'all'}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fn}"`);
  doc.pipe(res);

  const pw = doc.page.width - 100;
  const F = (n) => (parseFloat(n || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const FD = (d) => d ? new Date(d).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
  const dur = (o, c) => { if (!o) return '—'; const e = c ? new Date(c) : new Date(); const df = Math.floor((e - new Date(o)) / 1000); return `${Math.floor(df / 3600)}h ${Math.floor((df % 3600) / 60)}m`; };

  const drawTbl = (title, headers, widths, data, rowsFn) => {
    if (doc.y > doc.page.height - 80) doc.addPage();
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e293b').text(title);
    doc.moveDown(0.4);
    let y = doc.y;
    doc.font('Helvetica-Bold').fontSize(8);
    let x = 50;
    headers.forEach((h, i) => {
      doc.rect(x, y, widths[i], 18).fill('#0f172a');
      doc.fillColor('#fff').text(h, x + 3, y + 5, { width: widths[i] - 6, align: (typeof widths[i] === 'number' && widths[i] > 55) ? 'left' : (String(h).includes(' ') ? 'left' : 'right') });
      x += widths[i];
    });
    y += 18;
    data.forEach((d, i) => {
      if (y > doc.page.height - 50) { doc.addPage(); y = 50; }
      if (i % 2 === 0) doc.rect(50, y, pw, 15).fill('#f8fafc');
      const cells = rowsFn(d);
      x = 50;
      doc.font('Helvetica').fontSize(7.5).fillColor('#334155');
      cells.forEach((c, j) => {
        doc.text(String(c), x + 2, y + 3, { width: widths[j] - 4, align: j >= headers.length - 2 ? 'right' : 'left' });
        x += widths[j];
      });
      y += 15;
    });
    doc.y = y + 6;
  };

  // Header
  doc.fontSize(22).font('Helvetica-Bold').fillColor('#0f172a').text('SUTANA EMS', { align: 'center' });
  doc.fontSize(12).fillColor('#475569').text('Full Audit Report — Sales & Attendance Log', { align: 'center' });
  doc.fontSize(9).fillColor('#64748b').text(`Period: ${startDate || 'All'} to ${endDate || 'All'}  |  ${new Date().toLocaleString()}`, { align: 'center' });
  doc.moveDown();
  doc.strokeColor('#0f172a').lineWidth(2).moveTo(50, doc.y).lineTo(50 + pw, doc.y).stroke().moveDown();

  // Sales summary cards (2 rows × 4)
  const cw = (pw - 24) / 4;
  const drawCard = (label, val, color, cx, cy) => {
    doc.roundedRect(cx, cy, cw, 32, 4).fillAndStroke('#f8fafc', '#e2e8f0');
    doc.fillColor('#64748b').font('Helvetica').fontSize(7).text(label, cx + 5, cy + 3, { width: cw - 10 });
    doc.fillColor(color).font('Helvetica-Bold').fontSize(10).text(val, cx + 5, cy + 16, { width: cw - 10 });
  };
  let cy = doc.y;
  drawCard('Transactions', String(sTot.count), '#0f172a', 50, cy);
  drawCard('Total Revenue', `${F(sTot.total)} ETB`, '#0f172a', 50 + cw + 8, cy);
  drawCard('Cash', `${F(sTot.cash)} ETB`, '#10b981', 50 + (cw + 8) * 2, cy);
  drawCard('Telebirr', `${F(sTot.telebirr)} ETB`, '#3b82f6', 50 + (cw + 8) * 3, cy);
  cy += 36;
  drawCard('Bank Transfer', `${F(sTot.bank)} ETB`, '#8b5cf6', 50, cy);
  drawCard('Credit', `${F(sTot.credit)} ETB`, '#f59e0b', 50 + cw + 8, cy);
  drawCard('Online', `${F(sTot.online)} ETB`, '#8b5cf6', 50 + (cw + 8) * 2, cy);
  drawCard('Walk-in', `${F(sTot.walkIn)} ETB`, '#10b981', 50 + (cw + 8) * 3, cy);
  doc.y = cy + 36;

  // Sales table
  drawTbl('Sales Transactions',
    ['Invoice #', 'Date & Time', 'Cashier', 'Customer', 'Source', 'Payment', 'Total', 'Status'],
    [70, 75, 60, 65, 38, 45, 48, 40],
    sales,
    (s) => [s.invoice_number || '—', FD(s.sale_date), s.cashier_name || '—',
      s.customer_name ? s.customer_name + (s.customer_phone ? ' ' + s.customer_phone : '') : 'Walk-in',
      s.sale_type === 'online' ? 'Online' : 'Walk-in', s.payment_method_name || '—',
      `${F(s.total_amount)} ETB`, s.status || 'Completed']
  );

  // Shift section
  doc.moveDown();
  doc.strokeColor('#0f172a').lineWidth(2).moveTo(50, doc.y).lineTo(50 + pw, doc.y).stroke().moveDown(0.5);
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e293b').text('Attendance & Shift Records');
  doc.moveDown(0.3);

  const scw = (pw - 16) / 3;
  const drawSCard = (label, val, color, cx, cy) => {
    doc.roundedRect(cx, cy, scw, 28, 4).fillAndStroke('#f8fafc', '#e2e8f0');
    doc.fillColor('#64748b').font('Helvetica').fontSize(7).text(label, cx + 5, cy + 3, { width: scw - 10 });
    doc.fillColor(color).font('Helvetica-Bold').fontSize(9).text(val, cx + 5, cy + 14, { width: scw - 10 });
  };
  cy = doc.y;
  drawSCard('Total Shifts', String(shifts.length), '#0f172a', 50, cy);
  drawSCard('Total Sales', `${F(shTot.sales)} ETB`, '#10b981', 50 + scw + 8, cy);
  drawSCard('Transactions', String(shTot.txns), '#3b82f6', 50 + (scw + 8) * 2, cy);
  cy += 32;
  drawSCard('Cash', `${F(shTot.cash)} ETB`, '#10b981', 50, cy);
  drawSCard('Telebirr', `${F(shTot.telebirr)} ETB`, '#3b82f6', 50 + scw + 8, cy);
  drawSCard('Bank', `${F(shTot.bank)} ETB`, '#8b5cf6', 50 + (scw + 8) * 2, cy);
  doc.y = cy + 32;

  // Shift table
  drawTbl('Shift Records',
    ['Employee', 'Shift', 'Clock In', 'Clock Out', 'Duration', 'Float', 'Float+Sales', 'Txns', 'Cash', 'Telebirr', 'Bank', 'Status'],
    [48, 36, 50, 50, 32, 38, 45, 24, 38, 38, 38, 36],
    shifts,
    (sh) => [sh.cashier_name || `Employee #${sh.cashier_id}`, sh.shift_type || 'Morning',
      FD(sh.opened_at), sh.closed_at ? FD(sh.closed_at) : 'Open',
      dur(sh.opened_at, sh.closed_at), F(sh.opening_float),
      F(parseFloat(sh.opening_float || 0) + parseFloat(sh.total_sales || 0)),
      sh.transaction_count || 0, F(sh.cash_collected), F(sh.telebirr_collected),
      F(sh.transfer_collected), sh.status]
  );

  // Footer
  doc.moveDown(2);
  if (doc.y > doc.page.height - 40) doc.addPage();
  doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, doc.y).lineTo(50 + pw, doc.y).stroke().moveDown(0.3);
  doc.font('Helvetica').fontSize(7.5).fillColor('#9ca3af')
    .text('SUTANA EMS — Official Audit Document — All figures in Ethiopian Birr (ETB)', { align: 'center' })
    .text(`Generated ${new Date().toLocaleString()}`, { align: 'center' });

  doc.end();
});

/* ── Export: Audit Excel ── */
exports.exportAuditExcel = catchAsync(async (req, res) => {
  const { startDate, endDate, source } = req.query;

  let sQuery = db('pos_sales as ps')
    .leftJoin('customers as c', 'ps.customer_id', 'c.id')
    .leftJoin('users as u', 'ps.cashier_id', 'u.id')
    .leftJoin('sale_statuses as ss', 'ps.status_id', 'ss.id')
    .leftJoin('payment_methods as pm', 'ps.payment_method_id', 'pm.id')
    .select('ps.id', 'ps.invoice_number', 'ps.sale_type', 'ps.order_source',
      'c.name as customer_name', 'c.phone as customer_phone',
      'ps.total_amount', 'ps.subtotal', 'ps.tax_amount', 'ps.discount_amount', 'ps.sale_date',
      'ss.status_name as status', 'u.full_name as cashier_name',
      'pm.name as payment_method_name');

  if (startDate && endDate) sQuery = sQuery.whereBetween('ps.sale_date', [startDate, endDate]);
  else if (startDate) sQuery = sQuery.where('ps.sale_date', '>=', startDate);

  if (source && ['retail', 'farming', 'pharmacy'].includes(source)) {
    sQuery = sQuery.whereExists(function () {
      this.select('*').from('pos_items').whereRaw('pos_items.sale_id = ps.id').where('pos_items.source', source);
    });
  }

  const sales = await sQuery.orderBy('ps.sale_date', 'desc').limit(500);

  let shQuery = db('pos_shifts as ps')
    .leftJoin('users as u', 'ps.cashier_id', 'u.id')
    .select('ps.*', 'u.full_name as cashier_name')
    .orderBy('ps.opened_at', 'desc').limit(200);
  if (startDate) shQuery = shQuery.where('ps.opened_at', '>=', startDate);
  if (endDate) shQuery = shQuery.where('ps.opened_at', '<=', endDate + 'T23:59:59');
  const shifts = await shQuery;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SUTANA EMS';
  workbook.created = new Date();

  // Sheet 1: Sales
  const ws = workbook.addWorksheet('Sales Transactions');
  ws.columns = [
    { header: 'Invoice #', key: 'invoice_number', width: 18 },
    { header: 'Date & Time', key: 'sale_date', width: 20 },
    { header: 'Cashier', key: 'cashier_name', width: 20 },
    { header: 'Customer', key: 'customer_name', width: 20 },
    { header: 'Phone', key: 'customer_phone', width: 15 },
    { header: 'Order Source', key: 'order_source_display', width: 14 },
    { header: 'Sale Type', key: 'sale_type_display', width: 10 },
    { header: 'Payment Method', key: 'payment_method_name', width: 16 },
    { header: 'Subtotal', key: 'subtotal', width: 12 },
    { header: 'Discount', key: 'discount_amount', width: 12 },
    { header: 'Tax', key: 'tax_amount', width: 12 },
    { header: 'Total (ETB)', key: 'total_amount', width: 14 },
    { header: 'Status', key: 'status', width: 14 },
  ];

  sales.forEach(s => {
    ws.addRow({
      invoice_number: s.invoice_number || '',
      sale_date: s.sale_date ? new Date(s.sale_date).toLocaleString() : '',
      cashier_name: s.cashier_name || '',
      customer_name: s.customer_name || 'Walk-in',
      customer_phone: s.customer_phone || '',
      order_source_display: s.sale_type === 'online' ? (s.order_source || 'Online') : 'Walk-in',
      sale_type_display: s.sale_type === 'online' ? 'Online' : 'Walk-in',
      payment_method_name: s.payment_method_name || '',
      subtotal: parseFloat(s.subtotal || 0),
      discount_amount: parseFloat(s.discount_amount || 0),
      tax_amount: parseFloat(s.tax_amount || 0),
      total_amount: parseFloat(s.total_amount || 0),
      status: s.status || 'Completed',
    });
  });

  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.autoFilter = { from: 'A1', to: `M${sales.length + 1}` };

  // Sheet 2: Shifts
  const ws2 = workbook.addWorksheet('Shift Records');
  ws2.columns = [
    { header: 'Employee', key: 'employee', width: 20 },
    { header: 'Shift Type', key: 'shift_type', width: 14 },
    { header: 'Clock In', key: 'opened_at', width: 20 },
    { header: 'Clock Out', key: 'closed_at', width: 20 },
    { header: 'Duration', key: 'duration', width: 12 },
    { header: 'Opening Float', key: 'opening_float', width: 14 },
    { header: 'Float + Sales', key: 'float_plus_sales', width: 14 },
    { header: 'Transactions', key: 'transaction_count', width: 14 },
    { header: 'Cash Collected', key: 'cash_collected', width: 16 },
    { header: 'Telebirr Collected', key: 'telebirr_collected', width: 18 },
    { header: 'Bank Transfer', key: 'transfer_collected', width: 16 },
    { header: 'Credit', key: 'credit_collected', width: 14 },
    { header: 'Check', key: 'check_collected', width: 14 },
    { header: 'Status', key: 'status', width: 12 },
  ];

  shifts.forEach(sh => {
    const open = sh.opened_at;
    const close = sh.closed_at;
    const end = close ? new Date(close) : new Date();
    const diff = Math.floor((end - new Date(open)) / 1000);
    const duration = `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
    ws2.addRow({
      employee: sh.cashier_name || `Employee #${sh.cashier_id}`,
      shift_type: sh.shift_type || 'Morning',
      opened_at: open ? new Date(open).toLocaleString() : '',
      closed_at: close ? new Date(close).toLocaleString() : 'Still Open',
      duration,
      opening_float: parseFloat(sh.opening_float || 0),
      float_plus_sales: parseFloat(sh.opening_float || 0) + parseFloat(sh.total_sales || 0),
      transaction_count: parseInt(sh.transaction_count || 0),
      cash_collected: parseFloat(sh.cash_collected || 0),
      telebirr_collected: parseFloat(sh.telebirr_collected || 0),
      transfer_collected: parseFloat(sh.transfer_collected || 0),
      credit_collected: parseFloat(sh.credit_collected || 0),
      check_collected: parseFloat(sh.check_collected || 0),
      status: sh.status || '',
    });
  });

  const hdr2 = ws2.getRow(1);
  hdr2.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  hdr2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  hdr2.alignment = { horizontal: 'center', vertical: 'middle' };
  ws2.autoFilter = { from: 'A1', to: `N${shifts.length + 1}` };

  const fn = `audit_report_${startDate || 'all'}_to_${endDate || 'all'}.xlsx`;
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${fn}"`);
  await workbook.xlsx.write(res);
  res.end();
});
