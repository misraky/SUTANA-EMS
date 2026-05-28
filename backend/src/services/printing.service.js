const { db, transaction } = require('../config/database');
const config = require('../config/env');
const { audit } = require('../config/logger');
const { sendEmail } = require('./email.service');
const { sendSMS } = require('./sms.service');
const { AppError } = require('../utils/AppError');
const { generateOrderNumber, calculatePrintingPrice } = require('../utils/orderNumber');
const getAllOrders = async (filters) => {
  const { page = 1, limit = 25, status, search, startDate, endDate, userId, role } = filters;
  const offset = (page - 1) * limit;
  let query = db('printing_orders as po')
    .leftJoin('customers as c', 'po.customer_id', 'c.id')
    .leftJoin('customer_types as ct', 'po.customer_type_id', 'ct.id')
    .leftJoin('order_statuses as os', 'po.status_id', 'os.id')
    .select(
      'po.*',
      'c.name as customer_name',
      'c.phone as customer_phone',
      'c.email as customer_email',
      'ct.name as customer_type_name',
      'ct.color_code as customer_type_color',
      'os.status_name as status_name',
      'os.color_hex as status_color'
    )
    .whereNull('po.deleted_at');
  if (status) {
    const statusRecord = await db('order_statuses').where('status_code', status).first();
    if (statusRecord) {
      query = query.where('po.status_id', statusRecord.id);
    }
  }
  if (search) {
    query = query.where(function() {
      this.where('po.order_number', 'like', `%${search}%`)
        .orWhere('c.name', 'like', `%${search}%`)
        .orWhere('c.phone', 'like', `%${search}%`);
    });
  }
  if (startDate && endDate) {
    query = query.whereBetween('po.created_at', [startDate, endDate]);
  }
  const countQuery = query.clone();
  const total = await countQuery.count('po.id as total').first();
  const orders = await query
    .orderBy('po.due_date', 'asc')
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
const getPendingOrders = async () => {
  const deliveredStatus = await db('order_statuses').where('status_code', 'delivered').first();
  const orders = await db('printing_orders as po')
    .leftJoin('customers as c', 'po.customer_id', 'c.id')
    .leftJoin('order_statuses as os', 'po.status_id', 'os.id')
    .select(
      'po.id',
      'po.order_number',
      'c.name as customer_name',
      'po.due_date',
      'po.status_id',
      'os.status_name as status_name',
      'os.color_hex as status_color',
      db.raw('DATEDIFF(po.due_date, CURDATE()) as days_remaining'),
      db.raw('DATEDIFF(CURDATE(), po.created_at) as days_pending')
    )
    .whereNot('po.status_id', deliveredStatus?.id)
    .whereNull('po.deleted_at')
    .orderBy('po.due_date', 'asc')
    .limit(50);
  const processedOrders = orders.map(order => ({
    ...order,
    alertLevel: order.days_remaining < 0 ? 'past_due' :
                 order.days_remaining === 0 ? 'today' :
                 order.days_remaining === 1 ? 'tomorrow' :
                 order.days_remaining <= 7 ? 'soon' : 'normal'
  }));
  return {
    orders: processedOrders,
    count: processedOrders.length,
    pastDueCount: processedOrders.filter(o => o.alertLevel === 'past_due').length
  };
};
const getOrderById = async (orderId) => {
  const order = await db('printing_orders as po')
    .leftJoin('customers as c', 'po.customer_id', 'c.id')
    .leftJoin('customer_types as ct', 'po.customer_type_id', 'ct.id')
    .leftJoin('order_statuses as os', 'po.status_id', 'os.id')
    .leftJoin('users as u', 'po.created_by', 'u.id')
    .select(
      'po.*',
      'c.name as customer_name',
      'c.phone as customer_phone',
      'c.email as customer_email',
      'ct.name as customer_type_name',
      'ct.color_code as customer_type_color',
      'os.status_name as status_name',
      'os.color_hex as status_color',
      'u.full_name as created_by_name'
    )
    .where('po.id', orderId)
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
  if (order.attachments && typeof order.attachments === 'string') {
    order.attachments = JSON.parse(order.attachments);
  }
  return order;
};
const createOrder = async (orderData) => {
  const {
    customerId,
    customer,
    productType,
    quantity,
    paperType,
    pagesPerCopy,
    colorPrinting = false,
    bindingType = 'None',
    dueDate,
    specialInstructions,
    createdBy
  } = orderData;
  let finalCustomerId = customerId;
  if (!customerId && customer) {
    const [newCustomerId] = await db('customers').insert({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || null,
      customer_type_id: customer.customerTypeId,
      created_by: createdBy,
      created_at: db.fn.now()
    });
    finalCustomerId = newCustomerId;
  }
  if (!finalCustomerId) {
    throw new AppError('Customer information is required', 400);
  }
  const customerRecord = await db('customers')
    .where('id', finalCustomerId)
    .first();
  if (!customerRecord) {
    throw new AppError('Customer not found', 404);
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
    customer_id: finalCustomerId,
    customer_type_id: customerRecord.customer_type_id,
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
    created_by: createdBy,
    created_at: db.fn.now()
  });
  await db('order_status_history').insert({
    order_id: orderId,
    from_status: null,
    to_status: 'received',
    changed_by: createdBy,
    changed_at: db.fn.now()
  });
  if (customerRecord.email) {
    await sendEmail({
      to: customerRecord.email,
      subject: `Order Confirmation - ${orderNumber}`,
      template: 'order-confirmation',
      data: {
        orderNumber,
        customerName: customerRecord.name,
        productType,
        quantity,
        paperType,
        pagesPerCopy,
        dueDate,
        totalPrice: priceCalculation.totalPrice,
        statusUrl: `${config.frontendUrl}/customer/orders/${orderId}/track`
      }
    }).catch(() => {});
  }
  if (customerRecord.phone) {
    await sendSMS({
      to: customerRecord.phone,
      message: `Order ${orderNumber} confirmed. Total: ${priceCalculation.totalPrice} ETB. Due date: ${dueDate}. Track at: ${config.frontendUrl}/track`
    }).catch(() => {});
  }
  return {
    orderId,
    orderNumber,
    totalPrice: priceCalculation.totalPrice,
    priceBreakdown: {
      pricePerUnit: priceCalculation.pricePerUnit,
      bindingCost: priceCalculation.bindingCost,
      subtotal: priceCalculation.subtotal,
      total: priceCalculation.totalPrice
    }
  };
};
const updateOrderStatus = async (orderId, newStatus, reason, userId, ip) => {
  const order = await db('printing_orders')
    .leftJoin('order_statuses', 'printing_orders.status_id', 'order_statuses.id')
    .leftJoin('customers', 'printing_orders.customer_id', 'customers.id')
    .select(
      'printing_orders.*',
      'order_statuses.status_code as current_status_code',
      'customers.name as customer_name',
      'customers.email as customer_email',
      'customers.phone as customer_phone'
    )
    .where('printing_orders.id', orderId)
    .whereNull('printing_orders.deleted_at')
    .first();
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  const statusFlow = {
    received: ['in_progress'],
    in_progress: ['quality_check'],
    quality_check: ['ready'],
    ready: ['delivered'],
    delivered: []
  };
  const isValidTransition = statusFlow[order.current_status_code]?.includes(newStatus);
  if (!isValidTransition && order.current_status_code !== newStatus) {
    throw new AppError(`Invalid status transition from ${order.current_status_code} to ${newStatus}`, 400);
  }
  const newStatusRecord = await db('order_statuses')
    .where('status_code', newStatus)
    .first();
  if (!newStatusRecord) {
    throw new AppError('Invalid status', 400);
  }
  await transaction(async (trx) => {
    await trx('printing_orders')
      .where('id', orderId)
      .update({
        status_id: newStatusRecord.id,
        updated_at: db.fn.now()
      });
    await trx('order_status_history').insert({
      order_id: orderId,
      from_status: order.current_status_code,
      to_status: newStatus,
      note: reason || null,
      changed_by: userId,
      ip_address: ip,
      changed_at: db.fn.now()
    });
  });
  if (newStatus === 'ready' || newStatus === 'delivered') {
    if (order.customer_phone) {
      await sendSMS({
        to: order.customer_phone,
        message: `Your order ${order.order_number} is now ${newStatus.toUpperCase()}. ${newStatus === 'ready' ? 'Ready for pickup!' : 'Thank you for your business!'}`
      }).catch(() => {});
    }
    if (order.customer_email) {
      await sendEmail({
        to: order.customer_email,
        subject: `Order ${order.order_number} Status Update - ${newStatus.toUpperCase()}`,
        template: 'order-status-update',
        data: {
          orderNumber: order.order_number,
          customerName: order.customer_name,
          status: newStatus.toUpperCase(),
          message: newStatus === 'ready' ? 'Your order is ready for pickup!' : 'Your order has been delivered. Thank you!',
          trackUrl: `${config.frontendUrl}/customer/orders/${orderId}/track`
        }
      }).catch(() => {});
    }
  }
  return {
    orderId: parseInt(orderId),
    status: newStatus,
    previousStatus: order.current_status_code
  };
};
const uploadAttachments = async (orderId, files, userId) => {
  const order = await db('printing_orders')
    .where('id', orderId)
    .whereNull('deleted_at')
    .first();
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  let attachments = order.attachments || [];
  if (typeof attachments === 'string') {
    attachments = JSON.parse(attachments);
  }
  const newAttachments = files.map(file => ({
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
    .where('id', orderId)
    .update({
      attachments: JSON.stringify(attachments),
      updated_at: db.fn.now()
    });
  return {
    attachments: newAttachments.map(a => ({
      id: a.id,
      filename: a.filename,
      originalName: a.originalName,
      size: a.size,
      uploadedAt: a.uploadedAt
    }))
  };
};
const deleteAttachment = async (orderId, attachmentId) => {
  const order = await db('printing_orders')
    .where('id', orderId)
    .whereNull('deleted_at')
    .first();
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  let attachments = order.attachments || [];
  if (typeof attachments === 'string') {
    attachments = JSON.parse(attachments);
  }
  const attachmentToDelete = attachments.find(a => a.id === attachmentId);
  if (!attachmentToDelete) {
    throw new AppError('Attachment not found', 404);
  }
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(process.cwd(), attachmentToDelete.path);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  const updatedAttachments = attachments.filter(a => a.id !== attachmentId);
  await db('printing_orders')
    .where('id', orderId)
    .update({
      attachments: updatedAttachments.length > 0 ? JSON.stringify(updatedAttachments) : null,
      updated_at: db.fn.now()
    });
  return true;
};
const getOrderHistory = async (orderId) => {
  const order = await db('printing_orders')
    .where('id', orderId)
    .whereNull('deleted_at')
    .first();
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  const history = await db('order_status_history as osh')
    .leftJoin('users as u', 'osh.changed_by', 'u.id')
    .select('osh.*', 'u.full_name as changed_by_name')
    .where('osh.order_id', orderId)
    .orderBy('osh.changed_at', 'desc');
  return history;
};
const getRemainingTaxAllowance = async (orderId) => {
  const order = await db('printing_orders')
    .where('id', orderId)
    .whereNull('deleted_at')
    .first();
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  if (order.product_type !== 'TaxReceipt') {
    throw new AppError('This order is not a tax receipt order', 400);
  }
  const taxReceipt = await db('tax_receipts')
    .where('order_id', orderId)
    .whereNull('deleted_at')
    .first();
  if (!taxReceipt) {
    throw new AppError('No tax receipt record found for this order', 404);
  }
  return {
    orderId: parseInt(orderId),
    orderNumber: order.order_number,
    serialNumber: taxReceipt.serial_number,
    totalApproved: taxReceipt.approval_amount_total,
    usedCount: taxReceipt.used_count,
    remaining: taxReceipt.remaining,
    canPrintMore: taxReceipt.remaining > 0,
    maxPrintQuantity: Math.min(order.quantity - taxReceipt.used_count, taxReceipt.remaining)
  };
};
const printTaxReceipt = async (orderId, receiptData, userId, ip) => {
  const { approvalAmountTotal, approvedDate, approvalDocument } = receiptData;
  const order = await db('printing_orders')
    .leftJoin('customers', 'printing_orders.customer_id', 'customers.id')
    .leftJoin('customer_types', 'printing_orders.customer_type_id', 'customer_types.id')
    .select(
      'printing_orders.*',
      'customers.name as customer_name',
      'customers.tax_id',
      'customer_types.name as customer_type_name'
    )
    .where('printing_orders.id', orderId)
    .whereNull('printing_orders.deleted_at')
    .first();
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  if (order.product_type !== 'TaxReceipt') {
    throw new AppError('This order is not a tax receipt order', 400);
  }
  let taxReceipt = await db('tax_receipts')
    .where('order_id', orderId)
    .whereNull('deleted_at')
    .first();
  const serialNumber = `TR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  if (!taxReceipt) {
    await db('tax_receipts').insert({
      serial_number: serialNumber,
      order_id: orderId,
      customer_name: order.customer_name,
      customer_type_id: order.customer_type_id,
      approval_amount_total: approvalAmountTotal,
      used_count: 0,
      remaining: approvalAmountTotal,
      approved_date: approvedDate,
      approval_document: approvalDocument || null,
      printed_by: userId,
      ip_address: ip,
      printed_at: db.fn.now()
    });
  } else {
    await db('tax_receipts')
      .where('id', taxReceipt.id)
      .update({
        used_count: taxReceipt.used_count + 1,
        remaining: taxReceipt.remaining - 1,
        printed_by: userId,
        ip_address: ip,
        printed_at: db.fn.now()
      });
  }
  const updatedReceipt = await db('tax_receipts')
    .where('order_id', orderId)
    .first();
  const user = await db('users').where('id', userId).select('full_name').first();
  const receiptResult = {
    serialNumber: updatedReceipt.serial_number,
    orderNumber: order.order_number,
    customerName: order.customer_name,
    customerType: order.customer_type_name,
    taxId: order.tax_id,
    approvalAmountTotal: updatedReceipt.approval_amount_total,
    usedCount: updatedReceipt.used_count,
    remaining: updatedReceipt.remaining,
    approvedDate: updatedReceipt.approved_date,
    printedAt: new Date().toISOString(),
    printedBy: user?.full_name
  };
  return {
    receipt: receiptResult,
    canPrintMore: receiptResult.remaining > 0
  };
};
const getAllTaxReceipts = async (filters) => {
  const { page = 1, limit = 25, startDate, endDate } = filters;
  const offset = (page - 1) * limit;
  let query = db('tax_receipts as tr')
    .leftJoin('printing_orders as po', 'tr.order_id', 'po.id')
    .leftJoin('customers as c', 'po.customer_id', 'c.id')
    .leftJoin('customer_types as ct', 'tr.customer_type_id', 'ct.id')
    .leftJoin('users as u', 'tr.printed_by', 'u.id')
    .select(
      'tr.*',
      'po.order_number',
      'c.name as customer_name',
      'c.phone as customer_phone',
      'ct.name as customer_type_name',
      'u.full_name as printed_by_name'
    )
    .whereNull('tr.deleted_at');
  if (startDate && endDate) {
    query = query.whereBetween('tr.printed_at', [startDate, endDate]);
  }
  const total = await query.clone().count('tr.id as total').first();
  const receipts = await query
    .orderBy('tr.printed_at', 'desc')
    .limit(limit)
    .offset(offset);
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
const getPrintingStatistics = async () => {
  const statusCounts = await db('printing_orders as po')
    .leftJoin('order_statuses as os', 'po.status_id', 'os.id')
    .select('os.status_name', 'os.status_code', 'os.color_hex', db.raw('COUNT(*) as count'))
    .whereNull('po.deleted_at')
    .groupBy('po.status_id', 'os.status_name', 'os.status_code', 'os.color_hex');
  const monthlyRevenue = await db('printing_orders')
    .select(
      db.raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
      db.raw('SUM(total_price) as revenue'),
      db.raw('COUNT(*) as order_count')
    )
    .whereNull('deleted_at')
    .groupBy(db.raw('DATE_FORMAT(created_at, "%Y-%m")'))
    .orderBy('month', 'desc')
    .limit(6);
  const deliveredStatus = await db('order_statuses').where('status_code', 'delivered').first();
  const pendingCount = await db('printing_orders')
    .whereNot('status_id', deliveredStatus?.id)
    .whereNull('deleted_at')
    .count('id as count')
    .first();
  const pastDueCount = await db('printing_orders')
    .where('due_date', '<', db.fn.now())
    .whereNot('status_id', deliveredStatus?.id)
    .whereNull('deleted_at')
    .count('id as count')
    .first();
  const customerTypeBreakdown = await db('printing_orders as po')
    .leftJoin('customer_types as ct', 'po.customer_type_id', 'ct.id')
    .select('ct.name', 'ct.color_code', db.raw('COUNT(*) as count'), db.raw('SUM(po.total_price) as total_revenue'))
    .whereNull('po.deleted_at')
    .groupBy('po.customer_type_id', 'ct.name', 'ct.color_code')
    .orderBy('count', 'desc');
  return {
    statusBreakdown: statusCounts,
    monthlyRevenue,
    pendingOrders: parseInt(pendingCount.count),
    pastDueOrders: parseInt(pastDueCount.count),
    customerTypeBreakdown,
    totalOrders: statusCounts.reduce((sum, s) => sum + parseInt(s.count), 0)
  };
};
const calculatePrice = async (params) => {
  const { paperType, pagesPerCopy, quantity, colorPrinting = false, bindingType = 'None' } = params;
  const priceCalculation = calculatePrintingPrice({
    paperType,
    pagesPerCopy: parseInt(pagesPerCopy),
    quantity: parseInt(quantity),
    bindingType,
    colorPrinting: colorPrinting === 'true'
  });
  const basePrices = {
    A4: 0.50,
    A5: 0.75,
    A3: 1.00
  };
  const bindingPrices = {
    Spiral: 500,
    Thermal: 300,
    None: 0
  };
  return {
    calculation: {
      paperType,
      pagesPerCopy: parseInt(pagesPerCopy),
      quantity: parseInt(quantity),
      colorPrinting: colorPrinting === 'true',
      bindingType
    },
    pricePerUnit: priceCalculation.pricePerUnit,
    bindingCost: priceCalculation.bindingCost,
    subtotal: priceCalculation.subtotal,
    totalPrice: priceCalculation.totalPrice,
    formula: {
      basePricePerPage: basePrices[paperType],
      colorMultiplier: colorPrinting === 'true' ? 2.0 : 1.0,
      bindingCostPerCopy: bindingPrices[bindingType]
    }
  };
};
const getCustomerTypes = async () => {
  const customerTypes = await db('customer_types')
    .select('id', 'name', 'color_code', 'icon_name', 'sort_order')
    .orderBy('sort_order', 'asc');
  return customerTypes;
};
const getOrderStatuses = async () => {
  const statuses = await db('order_statuses')
    .select('id', 'status_code', 'status_name', 'color_hex', 'sort_order')
    .orderBy('sort_order', 'asc');
  return statuses;
};
module.exports = {
  getAllOrders,
  getPendingOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  uploadAttachments,
  deleteAttachment,
  getOrderHistory,
  getRemainingTaxAllowance,
  printTaxReceipt,
  getAllTaxReceipts,
  getPrintingStatistics,
  calculatePrice,
  getCustomerTypes,
  getOrderStatuses
};
