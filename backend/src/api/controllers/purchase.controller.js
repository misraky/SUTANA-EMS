const { db, transaction } = require('../../config/database');
const { audit } = require('../../config/logger');
const { sendEmail } = require('../../services/email.service');
const { sendSMS } = require('../../services/sms.service');
const AppError = require('../../utils/AppError');
const { catchAsync } = require('../../utils/catchAsync');
const { generatePONumber } = require('../../utils/orderNumber');
let formatCurrency;
try { formatCurrency = require('../../utils/formatters').formatCurrency; } catch (_) {}
if (!formatCurrency) formatCurrency = (v) => `ETB ${parseFloat(v || 0).toLocaleString()}`;
exports.getSuppliers = catchAsync(async (req, res) => {
  const { page = 1, limit = 25, search, isActive } = req.query;
  const offset = (page - 1) * limit;
  let query = db('suppliers')
    .leftJoin('payment_terms', 'suppliers.payment_terms_id', 'payment_terms.id')
    .select(
      'suppliers.*',
      'payment_terms.name as payment_terms_name',
      'payment_terms.days_net'
    )
    .whereNull('suppliers.deleted_at');
  if (search) {
    query = query.where(function() {
      this.where('suppliers.name', 'like', `%${search}%`)
        .orWhere('suppliers.contact_person', 'like', `%${search}%`)
        .orWhere('suppliers.email', 'like', `%${search}%`)
        .orWhere('suppliers.phone', 'like', `%${search}%`);
    });
  }
  if (isActive !== undefined) {
    query = query.where('suppliers.is_active', isActive === 'true');
  }
  const total = await query.clone().clearSelect().count('suppliers.id as total').first();
  const suppliers = await query
    .orderBy('suppliers.name', 'asc')
    .limit(limit)
    .offset(offset);
  for (const supplier of suppliers) {
    const poCount = await db('purchase_orders')
      .where('supplier_id', supplier.id)
      .count('id as count')
      .first();
    supplier.purchase_order_count = parseInt(poCount.count);
  }
  res.json({
    status: 'success',
    data: {
      suppliers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.total),
        totalPages: Math.ceil(total.total / limit)
      }
    }
  });
});
exports.getSupplierById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const supplier = await db('suppliers')
    .leftJoin('payment_terms', 'suppliers.payment_terms_id', 'payment_terms.id')
    .select(
      'suppliers.*',
      'payment_terms.name as payment_terms_name',
      'payment_terms.days_net'
    )
    .where('suppliers.id', id)
    .whereNull('suppliers.deleted_at')
    .first();
  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }
  const recentPOs = await db('purchase_orders')
    .where('supplier_id', id)
    .orderBy('created_at', 'desc')
    .limit(10);
  res.json({
    status: 'success',
    data: { supplier, recentPOs }
  });
});
exports.createSupplier = catchAsync(async (req, res) => {
  const {
    name,
    contactPerson,
    phone,
    email,
    address,
    paymentTermsId,
    leadTimeDays = 7,
    taxId,
    bankAccount
  } = req.body;
  const userId = req.user.id;
  const ip = req.ip;
  const existing = await db('suppliers')
    .where('name', name)
    .whereNull('deleted_at')
    .first();
  if (existing) {
    throw new AppError('Supplier with this name already exists', 400);
  }
  const [supplierId] = await db('suppliers').insert({
    name,
    contact_person: contactPerson,
    phone,
    email: email.toLowerCase(),
    address,
    payment_terms_id: paymentTermsId || null,
    lead_time_days: leadTimeDays,
    tax_id: taxId || null,
    bank_account: bankAccount || null,
    is_active: true,
    created_at: db.fn.now()
  });
  await audit('SUPPLIER_CREATED', supplierId, {
    ip,
    details: { name, contactPerson, email }
  });
  res.status(201).json({
    status: 'success',
    message: 'Supplier created successfully',
    data: { supplierId }
  });
});
exports.updateSupplier = catchAsync(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    contactPerson,
    phone,
    email,
    address,
    paymentTermsId,
    leadTimeDays,
    taxId,
    bankAccount,
    isActive
  } = req.body;
  const userId = req.user.id;
  const ip = req.ip;
  const supplier = await db('suppliers')
    .where('id', id)
    .whereNull('deleted_at')
    .first();
  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }
  if (name && name !== supplier.name) {
    const existing = await db('suppliers')
      .where('name', name)
      .where('id', '!=', id)
      .whereNull('deleted_at')
      .first();
    if (existing) {
      throw new AppError('Supplier with this name already exists', 400);
    }
  }
  const updateData = {};
  if (name) updateData.name = name;
  if (contactPerson) updateData.contact_person = contactPerson;
  if (phone) updateData.phone = phone;
  if (email) updateData.email = email.toLowerCase();
  if (address) updateData.address = address;
  if (paymentTermsId !== undefined) updateData.payment_terms_id = paymentTermsId;
  if (leadTimeDays !== undefined) updateData.lead_time_days = leadTimeDays;
  if (taxId !== undefined) updateData.tax_id = taxId;
  if (bankAccount !== undefined) updateData.bank_account = bankAccount;
  if (isActive !== undefined) updateData.is_active = isActive;
  updateData.updated_at = db.fn.now();
  await db('suppliers')
    .where('id', id)
    .update(updateData);
  await audit('SUPPLIER_UPDATED', id, {
    ip,
    details: { updates: Object.keys(updateData) }
  });
  res.json({
    status: 'success',
    message: 'Supplier updated successfully'
  });
});
exports.deleteSupplier = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const ip = req.ip;
  const supplier = await db('suppliers')
    .where('id', id)
    .whereNull('deleted_at')
    .first();
  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }
  const poCount = await db('purchase_orders')
    .where('supplier_id', id)
    .count('id as count')
    .first();
  if (poCount.count > 0) {
    throw new AppError('Cannot delete supplier with existing purchase orders. Deactivate instead.', 400);
  }
  await db('suppliers')
    .where('id', id)
    .update({
      is_active: false,
      deleted_at: db.fn.now(),
      updated_at: db.fn.now()
    });
  await audit('SUPPLIER_DELETED', id, {
    ip,
    details: { name: supplier.name }
  });
  res.json({
    status: 'success',
    message: 'Supplier deleted successfully'
  });
});
exports.restoreSupplier = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const ip = req.ip;
  const supplier = await db('suppliers')
    .where('id', id)
    .whereNotNull('deleted_at')
    .first();
  if (!supplier) {
    throw new AppError('Supplier not found or not deleted', 404);
  }
  await db('suppliers')
    .where('id', id)
    .update({
      is_active: true,
      deleted_at: null,
      updated_at: db.fn.now()
    });
  await audit('SUPPLIER_RESTORED', id, { ip });
  res.json({
    status: 'success',
    message: 'Supplier restored successfully'
  });
});
exports.getPurchaseOrders = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 25,
    status,
    supplierId,
    startDate,
    endDate
  } = req.query;
  const offset = (page - 1) * limit;
  let query = db('purchase_orders as po')
    .leftJoin('suppliers as s', 'po.supplier_id', 's.id')
    .leftJoin('sectors as sec', 'po.sector_id', 'sec.id')
    .leftJoin('po_statuses as ps', 'po.status_id', 'ps.id')
    .leftJoin('users as u', 'po.created_by', 'u.id')
    .select(
      'po.*',
      's.name as supplier_name',
      's.phone as supplier_phone',
      'sec.name as sector_name',
      'ps.status_name as status_name',
      'ps.color_hex as status_color',
      'u.full_name as created_by_name'
    )
    .whereNull('po.deleted_at');
  if (status) {
    const statusRecord = await db('po_statuses').where('status_code', status).first();
    if (statusRecord) {
      query = query.where('po.status_id', statusRecord.id);
    }
  }
  if (supplierId) {
    query = query.where('po.supplier_id', supplierId);
  }
  if (startDate && endDate) {
    query = query.whereBetween('po.created_at', [startDate, endDate]);
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
exports.getPurchaseOrderById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const purchaseOrder = await db('purchase_orders as po')
    .leftJoin('suppliers as s', 'po.supplier_id', 's.id')
    .leftJoin('sectors as sec', 'po.sector_id', 'sec.id')
    .leftJoin('po_statuses as ps', 'po.status_id', 'ps.id')
    .leftJoin('users as u', 'po.created_by', 'u.id')
    .leftJoin('users as a', 'po.approved_by', 'a.id')
    .select(
      'po.*',
      's.name as supplier_name',
      's.phone as supplier_phone',
      's.email as supplier_email',
      's.address as supplier_address',
      'sec.name as sector_name',
      'ps.status_name as status_name',
      'ps.color_hex as status_color',
      'u.full_name as created_by_name',
      'a.full_name as approved_by_name'
    )
    .where('po.id', id)
    .whereNull('po.deleted_at')
    .first();
  if (!purchaseOrder) {
    throw new AppError('Purchase order not found', 404);
  }
  const items = await db('po_items as pi')
    .leftJoin('products as p', 'pi.product_id', 'p.id')
    .select(
      'pi.*',
      'p.name as product_name',
      'p.sku'
    )
    .where('pi.po_id', id);
  purchaseOrder.items = items;
  res.json({
    status: 'success',
    data: { purchaseOrder }
  });
});
exports.uploadAttachment = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!req.file) {
    throw new AppError('No attachment file provided', 400);
  }
  const purchaseOrder = await db('purchase_orders')
    .where('id', id)
    .whereNull('deleted_at')
    .first();
  if (!purchaseOrder) {
    throw new AppError('Purchase order not found', 404);
  }
  const attachmentPath = `/uploads/orders/${req.file.filename}`;
  await db('purchase_orders')
    .where('id', id)
    .update({
      attachment: attachmentPath,
      updated_at: db.fn.now()
    });
  res.json({
    status: 'success',
    message: 'Attachment uploaded successfully',
    data: { attachmentPath }
  });
});
exports.createPurchaseOrder = catchAsync(async (req, res) => {
  const {
    supplierId,
    expectedDeliveryDate,
    sectorId,
    items,
    notes
  } = req.body;
  const userId = req.user.id;
  const ip = req.ip;
  const supplier = await db('suppliers')
    .where('id', supplierId)
    .whereNull('deleted_at')
    .first();
  if (!supplier) {
    throw new AppError('Supplier not found', 400);
  }
  if (!items || items.length === 0) {
    throw new AppError('At least one item is required', 400);
  }
  let subtotal = 0;
  for (const item of items) {
    const itemTotal = item.quantityOrdered * item.unitPrice;
    item.total = itemTotal;
    subtotal += itemTotal;
  }
  const taxAmount = subtotal * 0.15; 
  const totalAmount = subtotal + taxAmount;
  const draftStatus = await db('po_statuses').where('status_code', 'draft').first();
  const poNumber = await generatePONumber();
  const result = await transaction(async (trx) => {
    const [poId] = await trx('purchase_orders').insert({
      po_number: poNumber,
      supplier_id: supplierId,
      order_date: db.fn.now(),
      expected_delivery_date: expectedDeliveryDate,
      sector_id: sectorId,
      status_id: draftStatus.id,
      subtotal: subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      paid_amount: 0,
      notes: notes || null,
      created_by: userId,
      created_at: db.fn.now()
    });
    for (const item of items) {
      await trx('po_items').insert({
        po_id: poId,
        product_id: item.productId || null,
        product_name: item.productName,
        quantity_ordered: item.quantityOrdered,
        unit_price: item.unitPrice,
        total: item.quantityOrdered * item.unitPrice,
        quantity_received: 0,
        quantity_damaged: 0
      });
    }
    return poId;
  });
  await audit('PURCHASE_ORDER_CREATED', result, {
    ip,
    details: {
      poNumber,
      supplierId,
      totalAmount,
      itemCount: items.length
    }
  });
  res.status(201).json({
    status: 'success',
    message: 'Purchase order created successfully',
    data: {
      poId: result,
      poNumber,
      totalAmount
    }
  });
});
exports.updatePurchaseOrder = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { expectedDeliveryDate, items, notes } = req.body;
  const userId = req.user.id;
  const ip = req.ip;
  const purchaseOrder = await db('purchase_orders')
    .where('id', id)
    .whereNull('deleted_at')
    .first();
  if (!purchaseOrder) {
    throw new AppError('Purchase order not found', 404);
  }
  const draftStatus = await db('po_statuses').where('status_code', 'draft').first();
  if (purchaseOrder.status_id !== draftStatus.id) {
    throw new AppError('Only draft purchase orders can be edited', 400);
  }
  await transaction(async (trx) => {
    const updateData = {};
    if (expectedDeliveryDate) updateData.expected_delivery_date = expectedDeliveryDate;
    if (notes !== undefined) updateData.notes = notes;
    updateData.updated_at = db.fn.now();
    if (Object.keys(updateData).length > 0) {
      await trx('purchase_orders')
        .where('id', id)
        .update(updateData);
    }
    if (items && items.length > 0) {
      await trx('po_items').where('po_id', id).delete();
      let subtotal = 0;
      for (const item of items) {
        const itemTotal = item.quantityOrdered * item.unitPrice;
        subtotal += itemTotal;
        await trx('po_items').insert({
          po_id: id,
          product_id: item.productId || null,
          product_name: item.productName,
          quantity_ordered: item.quantityOrdered,
          unit_price: item.unitPrice,
          total: itemTotal,
          quantity_received: 0,
          quantity_damaged: 0
        });
      }
      const taxAmount = subtotal * 0.15;
      const totalAmount = subtotal + taxAmount;
      await trx('purchase_orders')
        .where('id', id)
        .update({
          subtotal: subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          updated_at: db.fn.now()
        });
    }
  });
  await audit('PURCHASE_ORDER_UPDATED', id, {
    ip,
    details: { updates: Object.keys(req.body) }
  });
  res.json({
    status: 'success',
    message: 'Purchase order updated successfully'
  });
});
exports.submitForApproval = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const ip = req.ip;
  const purchaseOrder = await db('purchase_orders')
    .leftJoin('po_statuses', 'purchase_orders.status_id', 'po_statuses.id')
    .leftJoin('suppliers', 'purchase_orders.supplier_id', 'suppliers.id')
    .where('purchase_orders.id', id)
    .whereNull('purchase_orders.deleted_at')
    .select('purchase_orders.*', 'po_statuses.status_code', 'suppliers.name as supplier_name')
    .first();
  if (!purchaseOrder) {
    throw new AppError('Purchase order not found', 404);
  }
  if (purchaseOrder.status_code !== 'draft') {
    throw new AppError('Only draft purchase orders can be submitted for approval', 400);
  }
  const pendingStatus = await db('po_statuses').where('status_code', 'pending').first();
  await db('purchase_orders')
    .where('id', id)
    .update({
      status_id: pendingStatus.id,
      updated_at: db.fn.now()
    });
  const config = require('../../config/env');
  const threshold = config.business?.highValuePoThreshold ?? 200000;
  const approvers = [];
  if (purchaseOrder.total_amount > threshold) {
    const ceoUsers = await db('users')
      .leftJoin('user_roles', 'users.id', 'user_roles.user_id')
      .leftJoin('roles', 'user_roles.role_id', 'roles.id')
      .where('roles.name', 'CEO')
      .select('users.id', 'users.email', 'users.full_name');
    approvers.push(...ceoUsers);
  } else {
    const managers = await db('users')
      .leftJoin('user_roles', 'users.id', 'user_roles.user_id')
      .leftJoin('roles', 'user_roles.role_id', 'roles.id')
      .where('roles.name', 'Finance')
      .select('users.id', 'users.email', 'users.full_name');
    approvers.push(...managers);
  }
  for (const approver of approvers) {
    // 1. In-app Notification
    await db('user_notifications').insert({
      user_id: approver.id,
      title: 'Purchase Order Approval Required',
      message: `PO ${purchaseOrder.po_number} for ${formatCurrency(purchaseOrder.total_amount)} requires your approval.`,
      type: 'purchase_order',
      link_url: `/ceo/purchases`,
      is_read: false,
      created_at: db.fn.now()
    }).catch(err => console.error('Failed to create in-app notification:', err.message));

    // 2. Email Notification
    await sendEmail({
      to: approver.email,
      subject: `Purchase Order Approval Required: ${purchaseOrder.po_number}`,
      template: 'po-approval-request',
      data: {
        approverName: approver.full_name,
        poNumber: purchaseOrder.po_number,
        totalAmount: purchaseOrder.total_amount,
        supplierName: purchaseOrder.supplier_name,
        requesterName: req.user.full_name,
        approvalUrl: `${process.env.FRONTEND_URL}/ceo/purchases`
      }
    }).catch(err => console.error('Failed to send approval email:', err.message));
  }
  await audit('PURCHASE_ORDER_SUBMITTED', id, {
    ip,
    details: { poNumber: purchaseOrder.po_number, totalAmount: purchaseOrder.total_amount }
  });
  res.json({
    status: 'success',
    message: 'Purchase order submitted for approval',
    data: {
      poNumber: purchaseOrder.po_number,
      approversNotified: approvers.length
    }
  });
});
exports.approvePurchaseOrder = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { approved, rejectionReason } = req.body;
  const userId = req.user.id;
  const ip = req.ip;
  const purchaseOrder = await db('purchase_orders as po')
    .leftJoin('suppliers as s', 'po.supplier_id', 's.id')
    .leftJoin('po_statuses as ps', 'po.status_id', 'ps.id')
    .select('po.*', 's.name as supplier_name', 'ps.status_code as current_status')
    .where('po.id', id)
    .whereNull('po.deleted_at')
    .first();
  if (!purchaseOrder) {
    throw new AppError('Purchase order not found', 404);
  }
  if (purchaseOrder.current_status !== 'pending') {
    throw new AppError('Only pending purchase orders can be approved/rejected', 400);
  }
  const config = require('../../config/env');
  let requiresHigherApproval = false;
  const highValueThreshold = (config.businessRules && config.businessRules.highValuePoThreshold) ? config.businessRules.highValuePoThreshold : 50000;
  if (purchaseOrder.total_amount > highValueThreshold) {
    const userRoles = await db('user_roles')
      .leftJoin('roles', 'user_roles.role_id', 'roles.id')
      .where('user_roles.user_id', userId)
      .select('roles.name');
    const hasCeoRole = userRoles.some(r => r.name === 'CEO');
    if (!hasCeoRole) {
      requiresHigherApproval = true;
    }
  }
  if (requiresHigherApproval) {
    throw new AppError('This purchase order requires CEO approval due to high value', 403);
  }
  const newStatus = approved ? 'approved' : 'rejected';
  const statusRecord = await db('po_statuses').where('status_code', newStatus).first();
  await db('purchase_orders')
    .where('id', id)
    .update({
      status_id: statusRecord.id,
      approved_by: approved ? userId : null,
      approved_at: approved ? db.fn.now() : null,
      rejection_reason: approved ? null : rejectionReason || null,
      updated_at: db.fn.now()
    });
  // Send email and in-app notification — wrapped so it never crashes the approval
  try {
    const requester = await db('users').where('id', purchaseOrder.created_by).first();
    if (requester) {
      // 1. In-app Notification
      await db('user_notifications').insert({
        user_id: requester.id,
        title: `Purchase Order ${approved ? 'Approved' : 'Rejected'}`,
        message: `Your PO ${purchaseOrder.po_number} has been ${approved ? 'approved' : 'rejected'}.`,
        type: 'purchase_order',
        link_url: `/purchase/orders`,
        is_read: false,
        created_at: db.fn.now()
      }).catch(err => console.error('Failed to create in-app notification:', err.message));

      // 2. Email Notification
      if (requester.email) {
        await sendEmail({
          to: requester.email,
          subject: `Purchase Order ${purchaseOrder.po_number} - ${approved ? 'Approved' : 'Rejected'}`,
          template: 'po-approval-result',
          data: {
            requesterName: requester.full_name,
            poNumber: purchaseOrder.po_number,
            status: approved ? 'Approved' : 'Rejected',
            reason: rejectionReason,
            totalAmount: purchaseOrder.total_amount,
            supplierName: purchaseOrder.supplier_name
          }
        });
      }
    }
  } catch (emailErr) {
    console.error('Failed to send approval notification:', emailErr.message);
  }
  await audit('PURCHASE_ORDER_APPROVED', id, {
    ip,
    details: {
      poNumber: purchaseOrder.po_number,
      approved,
      totalAmount: purchaseOrder.total_amount
    }
  });
  res.json({
    status: 'success',
    message: `Purchase order ${approved ? 'approved' : 'rejected'} successfully`
  });
});
exports.cancelPurchaseOrder = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user.id;
  const ip = req.ip;
  const purchaseOrder = await db('purchase_orders as po')
    .leftJoin('po_statuses as ps', 'po.status_id', 'ps.id')
    .select('po.*', 'ps.status_code')
    .where('po.id', id)
    .whereNull('po.deleted_at')
    .first();
  if (!purchaseOrder) {
    throw new AppError('Purchase order not found', 404);
  }
  const cancellableStatuses = ['draft', 'pending', 'approved'];
  if (!cancellableStatuses.includes(purchaseOrder.status_code)) {
    throw new AppError('This purchase order cannot be cancelled in its current status', 400);
  }
  const cancelledStatus = await db('po_statuses').where('status_code', 'cancelled').first();
  await db('purchase_orders')
    .where('id', id)
    .update({
      status_id: cancelledStatus.id,
      rejection_reason: reason,
      updated_at: db.fn.now()
    });
  await audit('PURCHASE_ORDER_CANCELLED', id, {
    ip,
    details: {
      poNumber: purchaseOrder.po_number,
      reason,
      previousStatus: purchaseOrder.status_code
    }
  });
  const requester = await db('users').where('id', purchaseOrder.created_by).first();
  if (requester.email) {
    await sendEmail({
      to: requester.email,
      subject: `Purchase Order ${purchaseOrder.po_number} - Cancelled`,
      template: 'po-cancelled',
      data: {
        requesterName: requester.full_name,
        poNumber: purchaseOrder.po_number,
        reason,
        cancelledBy: req.user.full_name
      }
    }).catch(err => console.error('Failed to send cancellation email:', err.message));
  }
  res.json({
    status: 'success',
    message: 'Purchase order cancelled successfully'
  });
});
exports.getPendingReceiving = catchAsync(async (req, res) => {
  const pendingReceiving = await db('purchase_orders as po')
    .leftJoin('suppliers as s', 'po.supplier_id', 's.id')
    .leftJoin('po_statuses as ps', 'po.status_id', 'ps.id')
    .leftJoin('po_items as pi', 'po.id', 'pi.po_id')
    .select(
      'po.id as po_id',
      'po.po_number',
      's.name as supplier_name',
      'po.expected_delivery_date',
      'ps.status_name as po_status',
      db.raw('COUNT(pi.id) as total_items'),
      db.raw('SUM(CASE WHEN pi.quantity_received < pi.quantity_ordered THEN 1 ELSE 0 END) as pending_items')
    )
    .whereIn('ps.status_code', ['approved', 'sent', 'partial_received'])
    .whereNull('po.deleted_at')
    .groupBy('po.id', 'po.po_number', 's.name', 'po.expected_delivery_date', 'ps.status_name')
    .havingRaw('COUNT(CASE WHEN pi.quantity_received < pi.quantity_ordered THEN 1 ELSE NULL END) > 0')
    .orderBy('po.expected_delivery_date', 'asc');
  res.json({
    status: 'success',
    data: { pendingReceiving }
  });
});
exports.registerReceiving = catchAsync(async (req, res) => {
  const { poId, items, receivingNote } = req.body;
  const userId = req.user.id;
  const ip = req.ip;
  const purchaseOrder = await db('purchase_orders as po')
    .leftJoin('po_statuses as ps', 'po.status_id', 'ps.id')
    .select('po.*', 'ps.status_code')
    .where('po.id', poId)
    .whereNull('po.deleted_at')
    .first();
  if (!purchaseOrder) {
    throw new AppError('Purchase order not found', 404);
  }
  const allowedStatuses = ['approved', 'sent', 'partial_received'];
  if (!allowedStatuses.includes(purchaseOrder.status_code)) {
    throw new AppError('This purchase order is not ready for receiving', 400);
  }
  await transaction(async (trx) => {
    let allReceived = true;
    let anyReceived = false;
    for (const item of items) {
      const poItem = await trx('po_items')
        .where('id', item.poItemId)
        .where('po_id', poId)
        .first();
      if (!poItem) continue;
      const newReceived = poItem.quantity_received + item.quantityReceived;
      const newDamaged = (poItem.quantity_damaged || 0) + (item.quantityDamaged || 0);
      await trx('po_items')
        .where('id', item.poItemId)
        .update({
          quantity_received: newReceived,
          quantity_damaged: newDamaged,
          quality_pass: item.qualityPass
        });
      const goodQuantity = item.quantityReceived;
      if (goodQuantity > 0) {
        let productId = poItem.product_id;
        
        // Auto-create product if the user ordered a generic item
        if (!productId) {
          const existingProduct = await trx('products')
            .where('name', poItem.product_name)
            .first();
            
          if (existingProduct) {
            productId = existingProduct.id;
          } else {
            const defaultCat = await trx('product_categories').first() || { id: 1 };
            const defaultUnit = await trx('units').first() || { id: 1 };
            
            const [insertId] = await trx('products').insert({
              name: poItem.product_name,
              sku: `PO-${poId}-ITEM-${item.poItemId}-${Date.now().toString().slice(-4)}`,
              category_id: defaultCat.id,
              unit_id: defaultUnit.id,
              selling_price: poItem.unit_price * 1.5,
              is_active: true
            });
            productId = insertId;
          }
          
          // Link it to the order item so it doesn't get created again
          await trx('po_items')
            .where('id', item.poItemId)
            .update({ product_id: productId });
        }
        
        const currentInventory = await trx('inventory')
          .where('product_id', productId)
          .first();
          
        if (currentInventory) {
          const newQuantity = currentInventory.quantity + goodQuantity;
          const newAvgCost = ((currentInventory.quantity * currentInventory.unit_cost) + (goodQuantity * poItem.unit_price)) / newQuantity;
          await trx('inventory')
            .where('product_id', productId)
            .update({
              quantity: newQuantity,
              unit_cost: newAvgCost,
              last_updated: db.fn.now()
            });
        } else {
          await trx('inventory').insert({
            product_id: productId,
            quantity: goodQuantity,
            unit_cost: poItem.unit_price,
            last_updated: db.fn.now()
          });
        }
        await trx('inventory_movements').insert({
          product_id: productId,
          transaction_type: 'Purchase',
          quantity_change: goodQuantity,
          quantity_before: currentInventory?.quantity || 0,
          quantity_after: (currentInventory?.quantity || 0) + goodQuantity,
          reference_type: 'PO',
          reference_id: poId,
          reason: `Purchase order ${purchaseOrder.po_number}`,
          performed_by: userId,
          created_at: db.fn.now()
        });
      }
      if (newReceived < poItem.quantity_ordered) {
        allReceived = false;
      }
      if (newReceived > 0) {
        anyReceived = true;
      }
    }
    let newStatusCode = 'partial_received';
    if (allReceived && anyReceived) {
      newStatusCode = 'complete';
    } else if (!anyReceived) {
      newStatusCode = purchaseOrder.status_code;
    }
    const newStatus = await trx('po_statuses').where('status_code', newStatusCode).first();
    await trx('purchase_orders')
      .where('id', poId)
      .update({
        status_id: newStatus.id,
        updated_at: db.fn.now()
      });
  });
  await audit('RECEIVING_REGISTERED', poId, {
    ip,
    details: {
      poNumber: purchaseOrder.po_number,
      itemsReceived: items.length,
      receivingNote
    }
  });
  res.json({
    status: 'success',
    message: 'Receiving registered successfully'
  });
});
exports.getPurchaseStatistics = catchAsync(async (req, res) => {
  const startOfMonth = db.raw('DATE_FORMAT(NOW(), "%Y-%m-01")');
  const monthlyPOs = await db('purchase_orders')
    .where('created_at', '>=', startOfMonth)
    .count('id as count')
    .first();
  const pendingStatus = await db('po_statuses').where('status_code', 'pending').first();
  const pendingApprovals = await db('purchase_orders')
    .where('status_id', pendingStatus?.id)
    .count('id as count')
    .first();
  const startOfYear = db.raw('DATE_FORMAT(NOW(), "%Y-01-01")');
  const totalSpend = await db('purchase_orders')
    .where('created_at', '>=', startOfYear)
    .sum('total_amount as total')
    .first();
  const activeSuppliers = await db('suppliers')
    .where('is_active', true)
    .whereNull('deleted_at')
    .count('id as count')
    .first();
  const topSuppliers = await db('purchase_orders as po')
    .leftJoin('suppliers as s', 'po.supplier_id', 's.id')
    .select('s.id', 's.name', db.raw('SUM(po.total_amount) as total_spent'))
    .where('po.created_at', '>=', startOfYear)
    .groupBy('po.supplier_id', 's.id', 's.name')
    .orderBy('total_spent', 'desc')
    .limit(5);
  const recentPOs = await db('purchase_orders as po')
    .leftJoin('suppliers as s', 'po.supplier_id', 's.id')
    .leftJoin('po_statuses as ps', 'po.status_id', 'ps.id')
    .select('po.id', 'po.po_number', 's.name as supplier', 'po.total_amount', 'ps.status_name as status', 'po.created_at')
    .orderBy('po.created_at', 'desc')
    .limit(10);
  res.json({
    status: 'success',
    data: {
      monthlyPOs: parseInt(monthlyPOs.count),
      pendingApprovals: parseInt(pendingApprovals.count),
      totalSpendThisYear: parseFloat(totalSpend.total || 0),
      activeSuppliers: parseInt(activeSuppliers.count),
      topSuppliers,
      recentPOs
    }
  });
});
exports.getSectors = catchAsync(async (req, res) => {
  const sectors = await db('sectors')
    .select('id', 'name', 'description')
    .orderBy('name');
  res.json({
    status: 'success',
    data: { sectors }
  });
});
exports.getPaymentTerms = catchAsync(async (req, res) => {
  const paymentTerms = await db('payment_terms')
    .select('id', 'name', 'days_net')
    .orderBy('days_net');
  res.json({
    status: 'success',
    data: { paymentTerms }
  });
});
