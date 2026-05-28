const { db, transaction } = require('../config/database');
const config = require('../config/env');
const { audit } = require('../config/logger');
const { sendEmail } = require('./email.service');
const { sendSMS } = require('./sms.service');
const { AppError } = require('../utils/AppError');
const { comparePassword, hashPassword, validatePasswordStrength } = require('../config/auth');
const { generateOrderNumber, calculatePrintingPrice } = require('../utils/orderNumber');
const getProfile = async (userId) => {
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
    .where('customers.user_id', userId)
    .orWhere('customers.email', userId)
    .first();
  if (!customer) {
    throw new AppError('Customer profile not found', 404);
  }
  return customer;
};
const updateProfile = async (userId, updateData) => {
  const { name, email, phone, address } = updateData;
  const customer = await db('customers')
    .where('user_id', userId)
    .orWhere('email', userId)
    .first();
  if (!customer) {
    throw new AppError('Customer profile not found', 404);
  }
  const updateFields = {};
  if (name) updateFields.name = name;
  if (email) updateFields.email = email.toLowerCase();
  if (phone) updateFields.phone = phone;
  if (address) updateFields.address = address;
  updateFields.updated_at = db.fn.now();
  await db('customers')
    .where('id', customer.id)
    .update(updateFields);
  return true;
};
const changePassword = async (userId, currentPassword, newPassword) => {
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
  return true;
};
const getOrders = async (userId, page = 1, limit = 25, status = null) => {
  const offset = (page - 1) * limit;
  const customer = await db('customers')
    .where('user_id', userId)
    .orWhere('email', userId)
    .first();
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }
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
  const total = await query.clone().count('po.id as total').first();
  const orders = await query
    .orderBy('po.created_at', 'desc')
    .limit(limit)
    .offset(offset);
  return {
    orders,
    pagination: {
      page,
      limit,
      total: parseInt(total.total),
      totalPages: Math.ceil(total.total / limit)
    }
  };
};
const getOrderById = async (userId, orderId) => {
  const customer = await db('customers')
    .where('user_id', userId)
    .orWhere('email', userId)
    .first();
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }
  const order = await db('printing_orders as po')
    .leftJoin('order_statuses as os', 'po.status_id', 'os.id')
    .select(
      'po.*',
      'os.status_name as status',
      'os.color_hex as status_color'
    )
    .where('po.id', orderId)
    .where('po.customer_id', customer.id)
    .whereNull('po.deleted_at')
    .first();
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  const history = await db('order_status_history as osh')
    .leftJoin('users as u', 'osh.changed_by', 'u.id')
    .select('osh.*', 'u.full_name as changed_by_name')
    .where('osh.order_id', orderId)
    .orderBy('osh.changed_at', 'desc');
  order.statusHistory = history;
  return order;
};
const createOrder = async (userId, orderData) => {
  const {
    productType,
    quantity,
    paperType,
    pagesPerCopy,
    colorPrinting = false,
    bindingType = 'None',
    dueDate,
    specialInstructions
  } = orderData;
  const customer = await db('customers')
    .where('user_id', userId)
    .orWhere('email', userId)
    .first();
  if (!customer) {
    throw new AppError('Customer profile not found. Please contact support.', 404);
  }
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
    changed_at: db.fn.now()
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
        trackUrl: `${config.frontendUrl}/customer/orders/${orderId}/track`
      }
    }).catch(() => {});
  }
  return {
    orderId,
    orderNumber,
    totalPrice: priceCalculation.totalPrice
  };
};
const trackOrder = async (userId, orderId) => {
  const customer = await db('customers')
    .where('user_id', userId)
    .orWhere('email', userId)
    .first();
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }
  const order = await db('printing_orders as po')
    .leftJoin('order_statuses as os', 'po.status_id', 'os.id')
    .select(
      'po.order_number',
      'po.product_type',
      'po.quantity',
      'po.due_date',
      'os.status_name as status',
      'os.color_hex as status_color',
      'po.created_at'
    )
    .where('po.id', orderId)
    .where('po.customer_id', customer.id)
    .whereNull('po.deleted_at')
    .first();
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  const timeline = await db('order_status_history as osh')
    .select('osh.to_status as status', 'osh.changed_at', 'osh.note')
    .where('osh.order_id', orderId)
    .orderBy('osh.changed_at', 'asc');
  return { order, timeline };
};
const cancelOrder = async (userId, orderId, reason = null) => {
  const customer = await db('customers')
    .where('user_id', userId)
    .orWhere('email', userId)
    .first();
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }
  const order = await db('printing_orders')
    .leftJoin('order_statuses', 'printing_orders.status_id', 'order_statuses.id')
    .select('printing_orders.*', 'order_statuses.status_code')
    .where('printing_orders.id', orderId)
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
      .where('id', orderId)
      .update({
        status_id: cancelledStatus.id,
        updated_at: db.fn.now()
      });
    await trx('order_status_history').insert({
      order_id: orderId,
      from_status: 'received',
      to_status: 'cancelled',
      note: reason || 'Cancelled by customer',
      changed_by: userId,
      changed_at: db.fn.now()
    });
  });
  return true;
};
const requestQuote = async (userId, quoteData) => {
  const {
    productType,
    quantity,
    paperType,
    pagesPerCopy,
    colorPrinting = false,
    bindingType = 'None'
  } = quoteData;
  const customer = await db('customers')
    .where('user_id', userId)
    .orWhere('email', userId)
    .first();
  const priceCalculation = calculatePrintingPrice({
    paperType,
    pagesPerCopy,
    quantity,
    bindingType,
    colorPrinting
  });
  const quoteId = Date.now().toString();
  const quote = {
    id: quoteId,
    customerId: customer?.id,
    productType,
    quantity,
    paperType,
    pagesPerCopy,
    colorPrinting,
    bindingType,
    totalPrice: priceCalculation.totalPrice,
    breakdown: priceCalculation,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };
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
        expiresAt: quote.expiresAt,
        acceptUrl: `${config.frontendUrl}/customer/quotes/${quoteId}/accept`
      }
    }).catch(() => {});
  }
  return {
    quoteId,
    totalPrice: priceCalculation.totalPrice,
    breakdown: priceCalculation,
    expiresAt: quote.expiresAt
  };
};
const getQuotes = async (userId, page = 1, limit = 25) => {
  return {
    quotes: [],
    pagination: { page, limit, total: 0, totalPages: 0 }
  };
};
const acceptQuote = async (userId, quoteId) => {
  const quote = await cache.get(`quote:${quoteId}`);
  if (!quote) {
    throw new AppError('Quote not found or expired', 404);
  }
  const customer = await db('customers')
    .where('user_id', userId)
    .orWhere('email', userId)
    .first();
  if (!customer) {
    throw new AppError('Customer profile not found', 404);
  }
  const orderNumber = await generateOrderNumber('PRT');
  const receivedStatus = await db('order_statuses').where('status_code', 'received').first();
  const [orderId] = await db('printing_orders').insert({
    order_number: orderNumber,
    customer_id: customer.id,
    customer_type_id: customer.customer_type_id,
    product_type: quote.productType,
    quantity: quote.quantity,
    paper_type: quote.paperType,
    pages_per_copy: quote.pagesPerCopy,
    color_printing: quote.colorPrinting,
    binding_type: quote.bindingType,
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    price_per_unit: quote.breakdown.pricePerUnit,
    binding_cost: quote.breakdown.bindingCost,
    total_price: quote.totalPrice,
    status_id: receivedStatus.id,
    created_by: userId,
    created_at: db.fn.now()
  });
  return {
    orderId,
    orderNumber,
    totalPrice: quote.totalPrice
  };
};
const getReceipts = async (userId, page = 1, limit = 25) => {
  const offset = (page - 1) * limit;
  const customer = await db('customers')
    .where('user_id', userId)
    .orWhere('email', userId)
    .first();
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }
  const receipts = await db('pos_sales')
    .select('id', 'invoice_number', 'total_amount', 'sale_date', 'payment_method')
    .where('customer_id', customer.id)
    .where('status', 'Completed')
    .orderBy('sale_date', 'desc')
    .limit(limit)
    .offset(offset);
  const total = await db('pos_sales')
    .where('customer_id', customer.id)
    .where('status', 'Completed')
    .count('id as total')
    .first();
  return {
    receipts,
    pagination: {
      page,
      limit,
      total: parseInt(total.total),
      totalPages: Math.ceil(total.total / limit)
    }
  };
};
const downloadReceipt = async (userId, receiptId) => {
  const customer = await db('customers')
    .where('user_id', userId)
    .orWhere('email', userId)
    .first();
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }
  const sale = await db('pos_sales')
    .where('id', receiptId)
    .where('customer_id', customer.id)
    .first();
  if (!sale) {
    throw new AppError('Receipt not found', 404);
  }
  const items = await db('pos_items as pi')
    .leftJoin('products as p', 'pi.product_id', 'p.id')
    .select('pi.*', 'p.name as product_name')
    .where('pi.sale_id', receiptId);
  return {
    receipt: {
      invoiceNumber: sale.invoice_number,
      date: sale.sale_date,
      customer: customer.name,
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
const getInvoices = async (userId, status = null) => {
  const customer = await db('customers')
    .where('user_id', userId)
    .orWhere('email', userId)
    .first();
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }
  let invoices = await db('pos_sales')
    .select('id', 'invoice_number', 'total_amount', 'amount_paid', 'sale_date')
    .where('customer_id', customer.id)
    .where('payment_method', 'Credit')
    .orderBy('sale_date', 'desc');
  invoices = invoices.map(inv => ({
    ...inv,
    balance: inv.total_amount - (inv.amount_paid || 0),
    status: inv.balance <= 0 ? 'paid' : inv.balance > 0 && new Date(inv.sale_date) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) ? 'overdue' : 'pending'
  }));
  if (status) {
    invoices = invoices.filter(inv => inv.status === status);
  }
  return invoices;
};
const getBalance = async (userId) => {
  const customer = await db('customers')
    .where('user_id', userId)
    .orWhere('email', userId)
    .first();
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }
  return {
    currentBalance: customer.current_balance,
    creditLimit: customer.credit_limit,
    availableCredit: customer.credit_limit - customer.current_balance
  };
};
const makePayment = async (userId, amount, paymentMethod, referenceNumber = null) => {
  const customer = await db('customers')
    .where('user_id', userId)
    .orWhere('email', userId)
    .first();
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }
  if (amount > customer.current_balance) {
    throw new AppError(`Payment amount (${amount} ETB) exceeds your current balance (${customer.current_balance} ETB)`, 400);
  }
  const paymentMethodRecord = await db('payment_methods').where('name', paymentMethod).first();
  const completedStatus = await db('payment_statuses').where('status_code', 'completed').first();
  let newBalance;
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
      notes: 'Payment from customer portal'
    });
    newBalance = customer.current_balance - amount;
    await trx('customers')
      .where('id', customer.id)
      .update({
        current_balance: newBalance,
        updated_at: db.fn.now()
      });
  });
  if (customer.email) {
    await sendEmail({
      to: customer.email,
      subject: `Payment Received - ${amount} ETB`,
      template: 'payment-received',
      data: {
        customerName: customer.name,
        amount,
        newBalance,
        paymentMethod,
        date: new Date().toISOString()
      }
    }).catch(() => {});
  }
  return {
    amountPaid: amount,
    newBalance
  };
};
const getNotifications = async (userId, unreadOnly = false) => {
  const customer = await db('customers')
    .where('user_id', userId)
    .orWhere('email', userId)
    .first();
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }
  let notifications = await db('customer_notifications')
    .where('customer_id', customer.id)
    .orderBy('created_at', 'desc')
    .limit(50);
  if (unreadOnly) {
    notifications = notifications.filter(n => !n.is_read);
  }
  return notifications;
};
const markNotificationRead = async (userId, notificationId) => {
  const customer = await db('customers')
    .where('user_id', userId)
    .orWhere('email', userId)
    .first();
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }
  await db('customer_notifications')
    .where('id', notificationId)
    .where('customer_id', customer.id)
    .update({ is_read: true });
  return true;
};
const markAllNotificationsRead = async (userId) => {
  const customer = await db('customers')
    .where('user_id', userId)
    .orWhere('email', userId)
    .first();
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }
  await db('customer_notifications')
    .where('customer_id', customer.id)
    .where('is_read', false)
    .update({ is_read: true });
  return true;
};
const createSupportTicket = async (userId, subject, message, ip) => {
  const customer = await db('customers')
    .where('user_id', userId)
    .orWhere('email', userId)
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
  const admins = await db('users')
    .leftJoin('user_roles', 'users.id', 'user_roles.user_id')
    .leftJoin('roles', 'user_roles.role_id', 'roles.id')
    .where('roles.name', 'Admin')
    .select('users.email', 'users.full_name');
  const user = await db('users').where('id', userId).first();
  for (const admin of admins) {
    await sendEmail({
      to: admin.email,
      subject: `New Support Ticket: ${subject}`,
      template: 'support-ticket-notification',
      data: {
        adminName: admin.full_name,
        ticketId,
        subject,
        message,
        customerName: customer?.name || user?.full_name,
        customerEmail: customer?.email || user?.email
      }
    }).catch(() => {});
  }
  return ticketId;
};
const getSupportTickets = async (userId, page = 1, limit = 25) => {
  const offset = (page - 1) * limit;
  const customer = await db('customers')
    .where('user_id', userId)
    .orWhere('email', userId)
    .first();
  let query = db('support_tickets')
    .where('user_id', userId);
  if (customer) {
    query = query.orWhere('customer_id', customer.id);
  }
  const total = await query.clone().count('id as total').first();
  const tickets = await query
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset);
  return {
    tickets,
    pagination: {
      page,
      limit,
      total: parseInt(total.total),
      totalPages: Math.ceil(total.total / limit)
    }
  };
};
module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getOrders,
  getOrderById,
  createOrder,
  trackOrder,
  cancelOrder,
  requestQuote,
  getQuotes,
  acceptQuote,
  getReceipts,
  downloadReceipt,
  getInvoices,
  getBalance,
  makePayment,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  createSupportTicket,
  getSupportTickets
};
