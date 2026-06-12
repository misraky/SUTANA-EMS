const { db, transaction } = require('../../config/database');
const { audit } = require('../../config/logger');
const AppError = require('../../utils/AppError');
const { catchAsync } = require('../../utils/catchAsync');
const { generateOrderNumber } = require('../../utils/orderNumber');
const { calculatePrintingPrice } = require('../../utils/pricing');
const { sendEmail } = require('../../services/email.service');
const { sendSMS } = require('../../services/sms.service');
const { comparePassword, hashPassword, validatePasswordStrength } = require('../../config/auth');

const getOrCreateCustomer = async (user) => {
  let customer = await db('customers')
    .where('user_id', user.id)
    .orWhere('email', user.email)
    .first();
  if (!customer) {
    const defaultType = await db('customer_types').first();
    const [newId] = await db('customers').insert({
      user_id: user.id,
      name: user.fullName || user.email.split('@')[0],
      email: user.email,
      phone: user.phone || '',
      customer_type_id: defaultType?.id || 1,
      credit_limit: 0,
      current_balance: 0,
      created_at: db.fn.now()
    });
    customer = await db('customers').where('id', newId).first();
  } else if (!customer.user_id) {
    await db('customers').where('id', customer.id).update({ user_id: user.id });
    customer.user_id = user.id;
  }
  return customer;
};
exports.getProfile = catchAsync(async (req, res) => {
  await getOrCreateCustomer(req.user);
  const customer = await db('customers')
    .leftJoin('customer_types', 'customers.customer_type_id', 'customer_types.id')
    .select(
      'customers.id',
      'customers.name',
      'customers.phone',
      'customers.email',
      'customers.address',
      'customers.tax_id',
      'customers.credit_limit',
      'customers.current_balance',
      'customer_types.name as customer_type',
      'customer_types.color_code as type_color'
    )
    .where('customers.user_id', req.user.id)
    .orWhere('customers.email', req.user.email)
    .first();
  if (!customer) {
    throw new AppError('Customer profile not found', 404);
  }
  res.json({
    status: 'success',
    data: { customer }
  });
});
exports.updateProfile = catchAsync(async (req, res) => {
  const { name, email, phone, address } = req.body;
  const userId = req.user.id;
  const ip = req.ip;
  const customer = await getOrCreateCustomer(req.user);
  const updateData = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email.toLowerCase();
  if (phone) updateData.phone = phone;
  if (address) updateData.address = address;
  updateData.updated_at = db.fn.now();
  await db('customers')
    .where('id', customer.id)
    .update(updateData);
  await audit('CUSTOMER_PROFILE_UPDATED', customer.id, {
    ip,
    details: { updates: Object.keys(updateData) }
  });
  res.json({
    status: 'success',
    message: 'Profile updated successfully'
  });
});
exports.changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;
  const ip = req.ip;
  const user = await db('users').where('id', userId).first();
  if (!user) {
    throw new AppError('User not found', 404);
  }
  const isValid = await comparePassword(currentPassword, user.password);
  if (!isValid) {
    throw new AppError('Current password is incorrect', 401);
  }
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.isValid) {
    throw new AppError(passwordValidation.errors.join(', '), 400);
  }
  const hashedPassword = await hashPassword(newPassword);
  await db('users')
    .where('id', userId)
    .update({
      password: hashedPassword,
      must_change_password: false,
      updated_at: db.fn.now()
    });
  await audit('CUSTOMER_PASSWORD_CHANGED', userId, { ip });
  res.json({
    status: 'success',
    message: 'Password changed successfully'
  });
});
exports.getOrders = catchAsync(async (req, res) => {
  const { page = 1, limit = 25, status } = req.query;
  const offset = (page - 1) * limit;
  const customer = await getOrCreateCustomer(req.user);
  let query = db('printing_orders as po')
    .leftJoin('order_statuses as os', 'po.status_id', 'os.id')
    .select(
      'po.id',
      'po.order_number',
      'po.product_type',
      'po.quantity',
      'po.paper_type',
      'po.pages_per_copy',
      'po.due_date',
      'po.total_price',
      'os.status_name as status',
      'os.color_hex as status_color',
      'po.created_at'
    )
    .where('po.customer_id', customer.id)
    .whereNull('po.deleted_at');
  if (status) {
    const statusRecord = await db('order_statuses').where('status_code', status).first();
    if (statusRecord) {
      query = query.where('po.status_id', statusRecord.id);
    }
  }
  const total = await query.clone().clearSelect().count('po.id as total').first();
  const orders = await query
    .orderBy('po.created_at', 'desc')
    .limit(limit)
    .offset(offset);
  res.json({
    status: 'success',
    data: {
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.total),
        totalPages: Math.ceil(total.total / limit)
      }
    }
  });
});
exports.getOrderById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const customer = await getOrCreateCustomer(req.user);
  const order = await db('printing_orders as po')
    .leftJoin('order_statuses as os', 'po.status_id', 'os.id')
    .select(
      'po.*',
      'os.status_name as status',
      'os.color_hex as status_color'
    )
    .where('po.id', id)
    .where('po.customer_id', customer.id)
    .whereNull('po.deleted_at')
    .first();
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  const history = await db('order_status_history as osh')
    .leftJoin('users as u', 'osh.changed_by', 'u.id')
    .select('osh.*', 'u.full_name as changed_by_name')
    .where('osh.order_id', id)
    .orderBy('osh.changed_at', 'desc');
  order.statusHistory = history;
  res.json({
    status: 'success',
    data: { order }
  });
});
exports.createOrder = catchAsync(async (req, res) => {
  const {
    productType,
    quantity,
    paperType,
    pagesPerCopy,
    colorPrinting = false,
    bindingType = 'None',
    dueDate,
    specialInstructions
  } = req.body;
  const userId = req.user.id;
  const ip = req.ip;
  const customer = await getOrCreateCustomer(req.user);
  const orderNumber = await generateOrderNumber('PRT');
  const priceCalculation = calculatePrintingPrice({
    paperType,
    pagesPerCopy,
    quantity,
    bindingType,
    colorPrinting
  });
  const receivedStatus = await db('order_statuses').where('status_code', 'received').first();
  const [orderId] = await db('printing_orders').insert({
    order_number: orderNumber,
    customer_id: customer.id,
    customer_type_id: customer.customer_type_id,
    product_type: productType,
    quantity,
    paper_type: paperType,
    pages_per_copy: pagesPerCopy,
    color_printing: colorPrinting,
    binding_type: bindingType,
    due_date: dueDate,
    special_instructions: specialInstructions || null,
    price_per_unit: priceCalculation.pricePerUnit,
    binding_cost: priceCalculation.bindingCost,
    total_price: priceCalculation.totalPrice,
    status_id: receivedStatus.id,
    created_by: userId,
    created_at: db.fn.now()
  });
  await db('order_status_history').insert({
    order_id: orderId,
    from_status: null,
    to_status: 'received',
    changed_by: userId,
    ip_address: ip,
    changed_at: db.fn.now()
  });
  await audit('CUSTOMER_ORDER_CREATED', orderId, {
    ip,
    details: { orderNumber, productType, quantity, totalPrice: priceCalculation.totalPrice }
  });
  if (customer.email) {
    await sendEmail({
      to: customer.email,
      subject: `Order Confirmation - ${orderNumber}`,
      template: 'customer-order-confirmation',
      data: {
        customerName: customer.name,
        orderNumber,
        productType,
        quantity,
        totalPrice: priceCalculation.totalPrice,
        dueDate,
        trackUrl: `${process.env.FRONTEND_URL}/customer/orders/${orderId}/track`
      }
    }).catch(err => console.error('Failed to send confirmation email:', err.message));
  }
  res.status(201).json({
    status: 'success',
    message: 'Order created successfully',
    data: {
      orderId,
      orderNumber,
      totalPrice: priceCalculation.totalPrice
    }
  });
});
exports.uploadAttachments = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const ip = req.ip;
  const customer = await getOrCreateCustomer(req.user);
  const order = await db('printing_orders')
    .where('id', id)
    .where('customer_id', customer.id)
    .whereNull('deleted_at')
    .first();
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  if (!req.files || req.files.length === 0) {
    throw new AppError('No files uploaded', 400);
  }
  let attachments = order.attachments || [];
  if (typeof attachments === 'string') {
    attachments = JSON.parse(attachments);
  }
  const newAttachments = req.files.map(file => ({
    id: Date.now() + Math.random().toString(36).substr(2, 9),
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
    path: file.path,
    uploadedBy: userId,
    uploadedAt: new Date().toISOString()
  }));
  attachments.push(...newAttachments);
  await db('printing_orders')
    .where('id', id)
    .update({
      attachments: JSON.stringify(attachments),
      updated_at: db.fn.now()
    });
  await audit('CUSTOMER_ORDER_ATTACHMENTS_UPLOADED', id, {
    ip,
    details: {
      fileCount: newAttachments.length,
      filenames: newAttachments.map(f => f.originalName)
    }
  });
  res.json({
    status: 'success',
    message: `${newAttachments.length} file(s) uploaded successfully`,
    data: {
      attachments: newAttachments.map(a => ({
        id: a.id,
        filename: a.filename,
        originalName: a.originalName,
        size: a.size,
        uploadedAt: a.uploadedAt
      }))
    }
  });
});
exports.trackOrder = catchAsync(async (req, res) => {
  const { id } = req.params;
  const customer = await getOrCreateCustomer(req.user);
  const order = await db('printing_orders as po')
    .leftJoin('order_statuses as os', 'po.status_id', 'os.id')
    .select(
      'po.order_number',
      'po.product_type',
      'po.quantity',
      'po.due_date',
      'po.attachments',
      'os.status_name as status',
      'os.color_hex as status_color',
      'po.created_at'
    )
    .where('po.id', id)
    .where('po.customer_id', customer.id)
    .whereNull('po.deleted_at')
    .first();
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  const timeline = await db('order_status_history as osh')
    .select('osh.to_status as status', 'osh.changed_at', 'osh.note')
    .where('osh.order_id', id)
    .orderBy('osh.changed_at', 'asc');
  res.json({
    status: 'success',
    data: {
      order,
      timeline
    }
  });
});
exports.cancelOrder = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user.id;
  const ip = req.ip;
  const customer = await getOrCreateCustomer(req.user);
  const order = await db('printing_orders')
    .leftJoin('order_statuses', 'printing_orders.status_id', 'order_statuses.id')
    .select('printing_orders.*', 'order_statuses.status_code')
    .where('printing_orders.id', id)
    .where('printing_orders.customer_id', customer.id)
    .whereNull('printing_orders.deleted_at')
    .first();
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  if (order.status_code !== 'received') {
    throw new AppError('Only orders in "Received" status can be cancelled', 400);
  }
  const cancelledStatus = await db('order_statuses').where('status_code', 'cancelled').first();
  await transaction(async (trx) => {
    await trx('printing_orders')
      .where('id', id)
      .update({
        status_id: cancelledStatus.id,
        updated_at: db.fn.now()
      });
    await trx('order_status_history').insert({
      order_id: id,
      from_status: 'received',
      to_status: 'cancelled',
      note: reason || 'Cancelled by customer',
      changed_by: userId,
      ip_address: ip,
      changed_at: db.fn.now()
    });
  });
  await audit('CUSTOMER_ORDER_CANCELLED', id, {
    ip,
    details: { orderNumber: order.order_number, reason }
  });
  res.json({
    status: 'success',
    message: 'Order cancelled successfully'
  });
});
exports.requestQuote = catchAsync(async (req, res) => {
  const {
    productType,
    quantity,
    paperType,
    pagesPerCopy,
    colorPrinting = false,
    bindingType = 'None'
  } = req.body;
  const userId = req.user.id;
  const customer = await getOrCreateCustomer(req.user);
  const priceCalculation = calculatePrintingPrice({
    paperType,
    pagesPerCopy,
    quantity,
    bindingType,
    colorPrinting
  });
  const quoteId = Date.now().toString();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const quote = {
    id: quoteId,
    customer_id: customer?.id,
    product_type: productType,
    quantity,
    paper_type: paperType,
    pages_per_copy: pagesPerCopy,
    color_printing: colorPrinting,
    binding_type: bindingType,
    total_price: priceCalculation.totalPrice,
    breakdown_json: JSON.stringify(priceCalculation),
    status: 'pending',
    created_at: db.fn.now(),
    expires_at: expiresAt
  };
  if (customer?.id) {
    await db('customer_quotes').insert(quote);
  }
  if (customer?.email) {
    await sendEmail({
      to: customer.email,
      subject: `Your Price Quote - ${quoteId}`,
      template: 'customer-quote',
      data: {
        customerName: customer?.name || 'Valued Customer',
        quoteId,
        productType,
        quantity,
        totalPrice: priceCalculation.totalPrice,
        expiresAt: expiresAt.toISOString(),
        acceptUrl: `${process.env.FRONTEND_URL}/customer/quotes/${quoteId}/accept`
      }
    }).catch(err => console.error('Failed to send quote email:', err.message));
  }
  res.status(201).json({
    status: 'success',
    data: {
      quoteId,
      totalPrice: priceCalculation.totalPrice,
      breakdown: priceCalculation,
      expiresAt: expiresAt.toISOString()
    }
  });
});
exports.getQuotes = catchAsync(async (req, res) => {
  const { page = 1, limit = 25 } = req.query;
  const customer = await getOrCreateCustomer(req.user);
  const offset = (page - 1) * limit;
  const quotes = await db('customer_quotes')
    .where('customer_id', customer.id)
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset);
  const totalRes = await db('customer_quotes')
    .where('customer_id', customer.id)
    .count('id as total')
    .first();
  const parsedQuotes = quotes.map(q => ({
    ...q,
    breakdown: q.breakdown_json ? JSON.parse(q.breakdown_json) : null
  }));
  res.json({
    status: 'success',
    data: { 
      quotes: parsedQuotes, 
      pagination: { 
        page: parseInt(page), 
        limit: parseInt(limit), 
        total: parseInt(totalRes.total), 
        totalPages: Math.ceil(parseInt(totalRes.total) / limit) 
      } 
    }
  });
});
exports.acceptQuote = catchAsync(async (req, res) => {
  const { quoteId } = req.params;
  const userId = req.user.id;
  const ip = req.ip;
  const quote = await db('customer_quotes')
    .where('id', quoteId)
    .where('status', 'pending')
    .first();
  if (!quote) {
    throw new AppError('Quote not found, expired, or already accepted', 404);
  }
  const breakdown = quote.breakdown_json ? JSON.parse(quote.breakdown_json) : {};
  const customer = await getOrCreateCustomer(req.user);
  const orderNumber = await generateOrderNumber('PRT');
  const receivedStatus = await db('order_statuses').where('status_code', 'received').first();
  const [orderId] = await db('printing_orders').insert({
    order_number: orderNumber,
    customer_id: customer.id,
    customer_type_id: customer.customer_type_id,
    product_type: quote.product_type,
    quantity: quote.quantity,
    paper_type: quote.paper_type,
    pages_per_copy: quote.pages_per_copy,
    color_printing: quote.color_printing,
    binding_type: quote.binding_type,
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    price_per_unit: breakdown.pricePerUnit || 0,
    binding_cost: breakdown.bindingCost || 0,
    total_price: quote.total_price,
    status_id: receivedStatus?.id || 1,
    created_by: userId,
    created_at: db.fn.now()
  });
  await db('customer_quotes')
    .where('id', quoteId)
    .update({ status: 'accepted' });
  await audit('QUOTE_ACCEPTED', orderId, {
    ip,
    details: { quoteId, orderNumber }
  });
  res.json({
    status: 'success',
    message: 'Quote accepted! Order created successfully.',
    data: {
      orderId,
      orderNumber,
      totalPrice: quote.total_price
    }
  });
});
exports.getReceipts = catchAsync(async (req, res) => {
  const { page = 1, limit = 25 } = req.query;
  const offset = (page - 1) * limit;
  const customer = await getOrCreateCustomer(req.user);
  const receipts = await db('pos_sales as ps')
    .leftJoin('payment_methods as pm', 'ps.payment_method_id', 'pm.id')
    .select(
      'ps.id',
      'ps.invoice_number',
      'ps.total_amount',
      'ps.amount_paid',
      'ps.sale_date',
      'pm.name as payment_method'
    )
    .where('ps.customer_id', customer.id)
    .where('ps.status_id', 1)
    .orderBy('ps.sale_date', 'desc')
    .limit(limit)
    .offset(offset);
  const total = await db('pos_sales')
    .where('customer_id', customer.id)
    .where('status_id', 1) 
    .count('id as total')
    .first();
  res.json({
    status: 'success',
    data: {
      receipts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.total),
        totalPages: Math.ceil(total.total / limit)
      }
    }
  });
});
exports.downloadReceipt = catchAsync(async (req, res) => {
  const { id } = req.params;
  const customer = await getOrCreateCustomer(req.user);
  const sale = await db('pos_sales')
    .where('id', id)
    .where('customer_id', customer.id)
    .first();
  if (!sale) {
    throw new AppError('Receipt not found', 404);
  }
  const items = await db('pos_items as pi')
    .leftJoin('products as p', 'pi.product_id', 'p.id')
    .select('pi.*', 'p.name as product_name')
    .where('pi.sale_id', id);
  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument({ margin: 50 });
  res.header('Content-Type', 'application/pdf');
  res.attachment(`receipt_${sale.invoice_number}.pdf`);
  doc.pipe(res);
  doc.fontSize(20).text('SUTANA EMS', { align: 'center' });
  doc.fontSize(12).text('Tax Invoice', { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).text(`Invoice Number: ${sale.invoice_number}`);
  doc.text(`Date: ${new Date(sale.sale_date).toLocaleString()}`);
  doc.text(`Customer: ${customer.name}`);
  doc.moveDown();
  doc.text('Items:', { underline: true });
  doc.moveDown(0.5);
  for (const item of items) {
    doc.text(`${item.product_name} x ${item.quantity} = ${item.total} ETB`);
  }
  doc.moveDown();
  doc.text(`Subtotal: ${sale.subtotal} ETB`);
  doc.text(`Tax (15%): ${sale.tax_amount} ETB`);
  doc.text(`Discount: ${sale.discount_amount} ETB`);
  doc.text(`Total: ${sale.total_amount} ETB`, { bold: true });
  doc.text(`Payment Method: ${sale.payment_method || 'N/A'}`);
  doc.end();
});
exports.getInvoices = catchAsync(async (req, res) => {
  const { status } = req.query;
  const customer = await getOrCreateCustomer(req.user);
  let invoices = await db('pos_sales as ps')
    .leftJoin('payment_methods as pm', 'ps.payment_method_id', 'pm.id')
    .select(
      'ps.id',
      'ps.invoice_number',
      'ps.total_amount',
      'ps.amount_paid',
      'ps.sale_date',
      'pm.name as payment_method'
    )
    .where('ps.customer_id', customer.id)
    .where('pm.name', 'Credit')
    .orderBy('ps.sale_date', 'desc');
  invoices = invoices.map(inv => {
    const balance = Number(inv.total_amount) - Number(inv.amount_paid || 0);
    const isOverdue = balance > 0 && new Date(inv.sale_date) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return {
      ...inv,
      balance,
      invoiceNumber: inv.invoice_number,
      totalAmount: inv.total_amount,
      paidAmount: inv.amount_paid,
      dueDate: inv.sale_date,
      createdAt: inv.sale_date,
      status: balance <= 0 ? 'paid' : isOverdue ? 'overdue' : 'pending'
    };
  });
  if (status) {
    invoices = invoices.filter(inv => inv.status === status);
  }
  res.json({
    status: 'success',
    data: { invoices }
  });
});
exports.getBalance = catchAsync(async (req, res) => {
  const customer = await getOrCreateCustomer(req.user);
  res.json({
    status: 'success',
    data: {
      currentBalance: customer.current_balance,
      creditLimit: customer.credit_limit,
      availableCredit: customer.credit_limit - customer.current_balance
    }
  });
});
exports.makePayment = catchAsync(async (req, res) => {
  const { amount, paymentMethod, referenceNumber } = req.body;
  const userId = req.user.id;
  const ip = req.ip;
  const customer = await getOrCreateCustomer(req.user);
  if (amount > customer.current_balance) {
    throw new AppError(`Payment amount (${amount} ETB) exceeds your current balance (${customer.current_balance} ETB)`, 400);
  }
  const paymentMethodRecord = await db('payment_methods').where('name', paymentMethod).first();
  const completedStatus = await db('payment_statuses').where('status_code', 'completed').first();
  await transaction(async (trx) => {
    await trx('invoice_payments').insert({
      sale_id: null,
      customer_id: customer.id,
      amount,
      payment_method_id: paymentMethodRecord.id,
      reference_number: referenceNumber || null,
      status_id: completedStatus.id,
      processed_by: userId,
      processed_at: db.fn.now(),
      notes: `Payment from customer portal`
    });
    const newBalance = customer.current_balance - amount;
    await trx('customers')
      .where('id', customer.id)
      .update({
        current_balance: newBalance,
        updated_at: db.fn.now()
      });
  });
  await audit('CUSTOMER_PAYMENT_MADE', customer.id, {
    ip,
    details: { amount, paymentMethod, newBalance: customer.current_balance - amount }
  });
  if (customer.email) {
    await sendEmail({
      to: customer.email,
      subject: `Payment Received - ${amount} ETB`,
      template: 'payment-received',
      data: {
        customerName: customer.name,
        amount,
        newBalance: customer.current_balance - amount,
        paymentMethod,
        date: new Date().toISOString()
      }
    }).catch(err => console.error('Failed to send payment confirmation:', err.message));
  }
  res.json({
    status: 'success',
    message: `Payment of ${amount} ETB received`,
    data: {
      amountPaid: amount,
      newBalance: customer.current_balance - amount
    }
  });
});
exports.getNotifications = catchAsync(async (req, res) => {
  const { unreadOnly = false } = req.query;
  const customer = await getOrCreateCustomer(req.user);
  let notifications = await db('customer_notifications')
    .where('customer_id', customer.id)
    .orderBy('created_at', 'desc')
    .limit(50);
  if (unreadOnly === 'true') {
    notifications = notifications.filter(n => !n.is_read);
  }
  res.json({
    status: 'success',
    data: { notifications }
  });
});
exports.markNotificationRead = catchAsync(async (req, res) => {
  const { id } = req.params;
  const customer = await getOrCreateCustomer(req.user);
  await db('customer_notifications')
    .where('id', id)
    .where('customer_id', customer.id)
    .update({ is_read: true });
  res.json({
    status: 'success',
    message: 'Notification marked as read'
  });
});
exports.markAllNotificationsRead = catchAsync(async (req, res) => {
  const customer = await getOrCreateCustomer(req.user);
  await db('customer_notifications')
    .where('customer_id', customer.id)
    .where('is_read', false)
    .update({ is_read: true });
  res.json({
    status: 'success',
    message: 'All notifications marked as read'
  });
});
exports.createSupportTicket = catchAsync(async (req, res) => {
  const { subject, message } = req.body;
  const userId = req.user.id;
  const ip = req.ip;
  const customer = await db('customers')
    .where('user_id', userId)
    .orWhere('email', req.user.email)
    .first();
  const [ticketId] = await db('support_tickets').insert({
    customer_id: customer?.id || null,
    user_id: userId,
    subject,
    message,
    status: 'open',
    created_at: db.fn.now(),
    ip_address: ip
  });
  await audit('SUPPORT_TICKET_CREATED', ticketId, {
    ip,
    details: { subject }
  });
  const admins = await db('users')
    .leftJoin('user_roles', 'users.id', 'user_roles.user_id')
    .leftJoin('roles', 'user_roles.role_id', 'roles.id')
    .where('roles.name', 'Admin')
    .select('users.email');
  for (const admin of admins) {
    await sendEmail({
      to: admin.email,
      subject: `New Support Ticket: ${subject}`,
      template: 'support-ticket-notification',
      data: {
        ticketId,
        subject,
        message,
        customerName: customer?.name || req.user.full_name,
        customerEmail: customer?.email || req.user.email
      }
    }).catch(err => console.error('Failed to send admin notification:', err.message));
  }
  res.status(201).json({
    status: 'success',
    message: 'Support ticket created. We will respond within 24 hours.',
    data: { ticketId }
  });
});
exports.getSupportTickets = catchAsync(async (req, res) => {
  const { page = 1, limit = 25 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const customer = await db('customers')
    .where('user_id', req.user.id)
    .orWhere('email', req.user.email)
    .first();
  const whereClause = (builder) => {
    builder.where('support_tickets.user_id', req.user.id);
    if (customer) {
      builder.orWhere('support_tickets.customer_id', customer.id);
    }
  };
  const [{ total }] = await db('support_tickets').where(whereClause).count('id as total');
  const rawTickets = await db('support_tickets')
    .where(whereClause)
    .orderBy('created_at', 'desc')
    .limit(parseInt(limit))
    .offset(offset);
  const tickets = rawTickets.map(t => ({
    ...t,
    createdAt: t.created_at,
    updatedAt: t.updated_at
  }));
  res.json({
    status: 'success',
    data: {
      tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});
