const { catchAsync } = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const { db } = require('../../config/database');
const { audit } = require('../../config/logger');
const { generateOrderNumber } = require('../../utils/orderNumber');
const deleteFile = (path) => console.log('Deleted file:', path);
const calculatePrintingPrice = (params) => ({
  pricePerUnit: 10,
  bindingCost: params.bindingType === 'Spiral' ? 500 : 0,
  subtotal: params.quantity * 10,
  totalPrice: (params.quantity * 10) + (params.bindingType === 'Spiral' ? 500 : 0)
});
exports.getAllOrders = catchAsync(async (req, res) => {
  const { page = 1, limit = 25, status, search, startDate, endDate } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  let query = db('printing_orders as po')
    .leftJoin('order_statuses as os', 'po.status_id', 'os.id')
    .leftJoin('customers as c', 'po.customer_id', 'c.id')
    .leftJoin('users as u', 'po.created_by', 'u.id')
    .select(
      'po.id', 'po.order_number', 'po.total_price', 'po.quantity',
      'po.created_at', 'po.completed_at', 'po.updated_at',
      'os.status_name', 'os.status_code', 'os.color_hex',
      'c.name as customer_name', 'c.phone as customer_phone',
      'u.full_name as created_by_name'
    )
    .whereNull('po.deleted_at');
  if (status) query = query.where('os.status_code', status);
  if (search) {
    query = query.where(function() {
      this.where('po.order_number', 'like', `%${search}%`)
        .orWhere('c.name', 'like', `%${search}%`);
    });
  }
  if (startDate && endDate) query = query.whereBetween('po.created_at', [startDate, endDate]);
  const total = await query.clone().clearSelect().count('po.id as count').first();
  const orders = await query.orderBy('po.created_at', 'desc').limit(parseInt(limit)).offset(offset);
  res.json({
    status: 'success',
    data: {
      orders,
      pagination: {
        page: parseInt(page), limit: parseInt(limit),
        total: parseInt(total.count),
        totalPages: Math.ceil(total.count / parseInt(limit))
      }
    }
  });
});
exports.getPendingOrders = catchAsync(async (req, res) => {
  const deliveredStatus = await db('order_statuses').where('status_code', 'delivered').first();
  const orders = await db('printing_orders as po')
    .leftJoin('order_statuses as os', 'po.status_id', 'os.id')
    .leftJoin('customers as c', 'po.customer_id', 'c.id')
    .select('po.*', 'os.status_name', 'os.color_hex', 'c.name as customer_name')
    .whereNull('po.deleted_at')
    .where('po.status_id', '!=', deliveredStatus?.id || 5)
    .orderBy('po.created_at', 'desc');
  res.json({ status: 'success', data: { orders } });
});
exports.getOrderById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const order = await db('printing_orders as po')
    .leftJoin('order_statuses as os', 'po.status_id', 'os.id')
    .leftJoin('customers as c', 'po.customer_id', 'c.id')
    .leftJoin('users as u', 'po.created_by', 'u.id')
    .select(
      'po.*',
      'os.status_name', 'os.status_code', 'os.color_hex',
      'c.name as customer_name', 'c.phone as customer_phone',
      'u.full_name as created_by_name'
    )
    .where('po.id', id)
    .whereNull('po.deleted_at')
    .first();
  if (!order) throw new AppError('Order not found', 404);
  res.json({ status: 'success', data: { order } });
});
exports.createOrder = catchAsync(async (req, res) => {
  const {
    customer,        
    productType,
    quantity,
    paperType,
    pagesPerCopy,
    colorPrinting,
    bindingType,
    dueDate,
    specialInstructions
  } = req.body;
  const userId = req.user.id;
  let resolvedCustomerId = req.body.customerId || null;
  let resolvedCustomerTypeId = parseInt(customer?.customerTypeId) || 1;
  if (!resolvedCustomerId && customer?.phone) {
    const existing = await db('customers').where('phone', customer.phone).whereNull('deleted_at').first();
    if (!existing) {
      const [newId] = await db('customers').insert({
        name: customer.name || 'Walk-in Customer',
        phone: customer.phone,
        customer_type_id: resolvedCustomerTypeId,
        created_at: db.fn.now(),
        updated_at: db.fn.now()
      });
      resolvedCustomerId = newId;
    } else {
      resolvedCustomerId = existing.id;
      resolvedCustomerTypeId = existing.customer_type_id || resolvedCustomerTypeId;
    }
  } else if (resolvedCustomerId) {
    const existingCustomer = await db('customers').where('id', resolvedCustomerId).first();
    if (existingCustomer) resolvedCustomerTypeId = existingCustomer.customer_type_id || resolvedCustomerTypeId;
  }
  const OrderModel = require('../../models/Order.model');
  const orderModel = new OrderModel({
    paperType: paperType || 'A4',
    pagesPerCopy: parseInt(pagesPerCopy) || 1,
    quantity: parseInt(quantity) || 1,
    colorPrinting: colorPrinting === true || colorPrinting === 'true',
    bindingType: bindingType || 'None'
  });
  const pricing = orderModel.calculatePrice();
  const orderNumber = await generateOrderNumber('PRT');
  const initialStatus = await db('order_statuses').where('status_code', 'received').first();
  const [orderId] = await db('printing_orders').insert({
    order_number: orderNumber,
    customer_id: resolvedCustomerId,
    customer_type_id: resolvedCustomerTypeId,
    product_type: productType || 'Book',
    paper_type: paperType || 'A4',
    pages_per_copy: parseInt(pagesPerCopy) || 1,
    color_printing: colorPrinting === true || colorPrinting === 'true' ? 1 : 0,
    binding_type: bindingType || 'None',
    quantity: parseInt(quantity) || 1,
    special_instructions: specialInstructions || null,
    due_date: dueDate || null,
    price_per_unit: pricing.pricePerUnit,
    binding_cost: pricing.bindingCost,
    total_price: pricing.totalPrice,
    status_id: initialStatus?.id || 1,
    created_by: userId,
    created_at: db.fn.now(),
    updated_at: db.fn.now()
  });
  await audit('PRINTING_ORDER_CREATED', userId, { ip: req.ip, resourceId: orderId });
  res.status(201).json({ status: 'success', data: { orderId, orderNumber } });
});
exports.updateOrderStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { statusId, status, notes } = req.body;  
  const userId = req.user.id;
  const order = await db('printing_orders').where('id', id).first();
  if (!order) throw new AppError('Order not found', 404);
  let statusRow;
  if (statusId && !isNaN(parseInt(statusId))) {
    statusRow = await db('order_statuses').where('id', parseInt(statusId)).first();
  } else if (status) {
    statusRow = await db('order_statuses')
      .where('status_code', status)
      .orWhere('status_name', status)
      .first();
  }
  if (!statusRow) throw new AppError(`Status '${status || statusId}' not found`, 400);
  const newStatusId = statusRow.id;
  const deliveredStatus = await db('order_statuses').where('status_code', 'delivered').first();
  const deliveredId = deliveredStatus?.id || 5;
  const updateData = {
    status_id: newStatusId,
    updated_at: db.fn.now()
  };
  if (newStatusId === deliveredId) {
    updateData.completed_at = db.fn.now();
  }
  await db('printing_orders').where('id', id).update(updateData);
  await db('order_status_history').insert({
    order_id: id,
    status_id: newStatusId,
    changed_by: userId,
    notes: notes || null,
    created_at: db.fn.now()
  }).catch(() => {});
  if (order.customer_id) {
    await db('customer_notifications').insert({
      customer_id: order.customer_id,
      title: 'Order Status Update',
      message: `Your order ${order.order_number} is now ${statusRow.status_name}.`,
      type: 'order_update',
      link_url: `/customer/orders/${id}/track`,
      created_at: db.fn.now()
    }).catch(err => console.error('Notification failed:', err.message));
  }
  await audit('PRINTING_ORDER_STATUS_UPDATED', userId, {
    ip: req.ip, resourceId: id,
    afterState: { status_code: statusRow.status_code, completed_at: updateData.completed_at || null }
  });
  res.json({ status: 'success', message: 'Order status updated successfully', data: { statusCode: statusRow.status_code, statusName: statusRow.status_name } });
});
exports.uploadAttachments = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const ip = req.ip;
  const order = await db('printing_orders')
    .where('id', id)
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
  await audit('PRINTING_ORDER_ATTACHMENTS_UPLOADED', id, {
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
exports.deleteAttachment = catchAsync(async (req, res) => {
  const { id, attachmentId } = req.params;
  const userId = req.user.id;
  const ip = req.ip;
  const order = await db('printing_orders')
    .where('id', id)
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
  deleteFile(attachmentToDelete.path);
  const updatedAttachments = attachments.filter(a => a.id !== attachmentId);
  await db('printing_orders')
    .where('id', id)
    .update({
      attachments: updatedAttachments.length > 0 ? JSON.stringify(updatedAttachments) : null,
      updated_at: db.fn.now()
    });
  await audit('PRINTING_ORDER_ATTACHMENT_DELETED', id, {
    ip,
    details: {
      attachmentId,
      filename: attachmentToDelete.originalName
    }
  });
  res.json({
    status: 'success',
    message: 'Attachment deleted successfully'
  });
});
exports.getOrderHistory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const order = await db('printing_orders')
    .where('id', id)
    .whereNull('deleted_at')
    .first();
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  const history = await db('order_status_history as osh')
    .leftJoin('users as u', 'osh.changed_by', 'u.id')
    .select(
      'osh.*',
      'u.full_name as changed_by_name'
    )
    .where('osh.order_id', id)
    .orderBy('osh.changed_at', 'desc');
  res.json({
    status: 'success',
    data: { history }
  });
});
exports.getRemainingTaxAllowance = catchAsync(async (req, res) => {
  const { orderId } = req.params;
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
  res.json({
    status: 'success',
    data: {
      orderId: parseInt(orderId),
      orderNumber: order.order_number,
      serialNumber: taxReceipt.serial_number,
      totalApproved: taxReceipt.approval_amount_total,
      usedCount: taxReceipt.used_count,
      remaining: taxReceipt.remaining,
      canPrintMore: taxReceipt.remaining > 0,
      maxPrintQuantity: Math.min(order.quantity - taxReceipt.used_count, taxReceipt.remaining)
    }
  });
});
exports.printTaxReceipt = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const { approvalAmountTotal, approvedDate, approvalDocument } = req.body;
  const userId = req.user.id;
  const ip = req.ip;
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
  const serialNumber = `TR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  let taxReceipt = await db('tax_receipts')
    .where('order_id', orderId)
    .whereNull('deleted_at')
    .first();
  let newUsedCount, newRemaining;
  if (!taxReceipt) {
    const [receiptId] = await db('tax_receipts').insert({
      serial_number: serialNumber,
      order_id: orderId,
      customer_name: order.customer_name || 'Walk-in Customer',
      customer_type_id: order.customer_type_id || 1,
      approval_amount_total: parseInt(approvalAmountTotal),
      used_count: 1,
      remaining: parseInt(approvalAmountTotal) - 1,
      approved_date: approvedDate,
      approval_document: approvalDocument || '',
      printed_by: userId,
      ip_address: ip,
      printed_at: db.fn.now()
    });
    newUsedCount = 1;
    newRemaining = parseInt(approvalAmountTotal) - 1;
    taxReceipt = { id: receiptId, approval_amount_total: parseInt(approvalAmountTotal) };
  } else {
    // Already exists — increment usage
    newUsedCount  = taxReceipt.used_count + 1;
    newRemaining  = taxReceipt.remaining - 1;
    await db('tax_receipts')
      .where('id', taxReceipt.id)
      .update({
        used_count: newUsedCount,
        remaining: newRemaining,
        printed_by: userId,
        ip_address: ip,
        printed_at: db.fn.now()
      });
  }
  await audit('TAX_RECEIPT_PRINTED', userId, {
    ip,
    details: { serialNumber, customerName: order.customer_name, usedCount: newUsedCount, remaining: newRemaining }
  });
  res.json({
    status: 'success',
    message: 'Tax receipt printed successfully',
    data: {
      receipt: {
        serialNumber,
        orderNumber: order.order_number,
        customerName: order.customer_name || 'Walk-in Customer',
        customerType: order.customer_type_name,
        taxId: order.tax_id,
        approvalAmountTotal: taxReceipt.approval_amount_total,
        usedCount: newUsedCount,
        remaining: newRemaining,
        approvedDate,
        printedAt: new Date().toISOString(),
        printedBy: req.user.full_name
      },
      canPrintMore: newRemaining > 0
    }
  });
});
exports.getAllTaxReceipts = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 25,
    startDate,
    endDate
  } = req.query;
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
  const total = await query.clone().clearSelect().count('tr.id as total').first();
  const receipts = await query
    .orderBy('tr.printed_at', 'desc')
    .limit(limit)
    .offset(offset);
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
exports.getPrintingStatistics = catchAsync(async (req, res) => {
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
    .where('status_id', '!=', (await db('order_statuses').where('status_code', 'received').first())?.id)
    .groupBy(db.raw('DATE_FORMAT(created_at, "%Y-%m")'))
    .orderBy('month', 'desc')
    .limit(6);
  const deliveredStatus = await db('order_statuses').where('status_code', 'delivered').first();
  const pendingCount = await db('printing_orders')
    .where('status_id', '!=', deliveredStatus?.id)
    .whereNull('deleted_at')
    .count('id as count')
    .first();
  const pastDueCount = await db('printing_orders')
    .where('due_date', '<', db.fn.now())
    .where('status_id', '!=', deliveredStatus?.id)
    .whereNull('deleted_at')
    .count('id as count')
    .first();
  const customerTypeBreakdown = await db('printing_orders as po')
    .leftJoin('customer_types as ct', 'po.customer_type_id', 'ct.id')
    .select('ct.name', 'ct.color_code', db.raw('COUNT(*) as count'), db.raw('SUM(po.total_price) as total_revenue'))
    .whereNull('po.deleted_at')
    .groupBy('po.customer_type_id', 'ct.name', 'ct.color_code')
    .orderBy('count', 'desc');
  res.json({
    status: 'success',
    data: {
      statusBreakdown: statusCounts,
      monthlyRevenue,
      pendingOrders: parseInt(pendingCount.count),
      pastDueOrders: parseInt(pastDueCount.count),
      customerTypeBreakdown,
      totalOrders: statusCounts.reduce((sum, s) => sum + parseInt(s.count), 0)
    }
  });
});
exports.calculatePrice = catchAsync(async (req, res) => {
  const {
    paperType,
    pagesPerCopy,
    quantity,
    colorPrinting = false,
    bindingType = 'None'
  } = req.query;
  if (!paperType || !pagesPerCopy || !quantity) {
    throw new AppError('Missing required parameters: paperType, pagesPerCopy, quantity', 400);
  }
  const priceCalculation = calculatePrintingPrice({
    paperType,
    pagesPerCopy: parseInt(pagesPerCopy),
    quantity: parseInt(quantity),
    bindingType,
    colorPrinting: colorPrinting === 'true'
  });
  res.json({
    status: 'success',
    data: {
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
        basePricePerPage: paperType === 'A4' ? 0.50 : paperType === 'A5' ? 0.75 : 1.00,
        colorMultiplier: colorPrinting === 'true' ? 2.0 : 1.0,
        bindingCostPerCopy: bindingType === 'Spiral' ? 500 : bindingType === 'Thermal' ? 300 : 0
      }
    }
  });
});
exports.getCustomerTypes = catchAsync(async (req, res) => {
  const customerTypes = await db('customer_types')
    .select('id', 'name', 'color_code', 'icon_name', 'sort_order')
    .orderBy('sort_order', 'asc');
  res.json({
    status: 'success',
    data: { customerTypes }
  });
});
exports.getOrderStatuses = catchAsync(async (req, res) => {
  const statuses = await db('order_statuses')
    .select('id', 'status_code', 'status_name', 'color_hex', 'sort_order')
    .orderBy('sort_order', 'asc');
  res.json({
    status: 'success',
    data: { statuses }
  });
});
exports.getPaperTypes = catchAsync(async (req, res) => {
  const paperTypes = [
    { code: 'A3', name: 'A3', description: '297mm x 420mm' },
    { code: 'A4', name: 'A4', description: '210mm x 297mm' },
    { code: 'A5', name: 'A5', description: '148mm x 210mm' }
  ];
  res.json({
    status: 'success',
    data: { paperTypes }
  });
});
exports.getBindingTypes = catchAsync(async (req, res) => {
  const bindingTypes = [
    { code: 'None', name: 'No Binding', price: 0 },
    { code: 'Spiral', name: 'Spiral Binding', price: 500 },
    { code: 'Thermal', name: 'Thermal Binding', price: 300 }
  ];
  res.json({
    status: 'success',
    data: { bindingTypes }
  });
});
exports.getProductTypes = catchAsync(async (req, res) => {
  const productTypes = [
    { code: 'Book', name: 'Book Printing', description: 'For scholars and researchers' },
    { code: 'Module', name: 'Module Printing', description: 'For lecturers and educators' },
    { code: 'Exam', name: 'Exam Paper Printing', description: 'For examinations and tests' },
    { code: 'Brochure', name: 'Brochure Printing', description: 'For churches, weddings, and events' },
    { code: 'TaxReceipt', name: 'Government Tax Receipt', description: 'Official government tax receipts' }
  ];
  res.json({
    status: 'success',
    data: { productTypes }
  });
});
