const { db, transaction } = require('../config/database');
const config = require('../config/env');
const { audit } = require('../config/logger');
const { sendEmail } = require('./email.service');
const { sendSMS } = require('./sms.service');
const { AppError } = require('../utils/AppError');
const { generateOrderNumber } = require('../utils/orderNumber');
const getSuppliers = async (filters) => {
  const { page = 1, limit = 25, search, isActive } = filters;
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
  const total = await query.clone().count('suppliers.id as total').first();
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
  return {
    suppliers,
    pagination: {
      page,
      limit,
      total: parseInt(total.total),
      totalPages: Math.ceil(total.total / limit)
    }
  };
};
const getSupplierById = async (supplierId) => {
  const supplier = await db('suppliers')
    .leftJoin('payment_terms', 'suppliers.payment_terms_id', 'payment_terms.id')
    .select(
      'suppliers.*',
      'payment_terms.name as payment_terms_name',
      'payment_terms.days_net'
    )
    .where('suppliers.id', supplierId)
    .whereNull('suppliers.deleted_at')
    .first();
  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }
  const recentPOs = await db('purchase_orders')
    .where('supplier_id', supplierId)
    .orderBy('created_at', 'desc')
    .limit(10);
  return { supplier, recentPOs };
};
const createSupplier = async (supplierData, userId) => {
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
  } = supplierData;
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
  return supplierId;
};
const updateSupplier = async (supplierId, updateData) => {
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
  } = updateData;
  const supplier = await db('suppliers')
    .where('id', supplierId)
    .whereNull('deleted_at')
    .first();
  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }
  if (name && name !== supplier.name) {
    const existing = await db('suppliers')
      .where('name', name)
      .where('id', '!=', supplierId)
      .whereNull('deleted_at')
      .first();
    if (existing) {
      throw new AppError('Supplier with this name already exists', 400);
    }
  }
  const updateFields = {};
  if (name) updateFields.name = name;
  if (contactPerson) updateFields.contact_person = contactPerson;
  if (phone) updateFields.phone = phone;
  if (email) updateFields.email = email.toLowerCase();
  if (address) updateFields.address = address;
  if (paymentTermsId !== undefined) updateFields.payment_terms_id = paymentTermsId;
  if (leadTimeDays !== undefined) updateFields.lead_time_days = leadTimeDays;
  if (taxId !== undefined) updateFields.tax_id = taxId;
  if (bankAccount !== undefined) updateFields.bank_account = bankAccount;
  if (isActive !== undefined) updateFields.is_active = isActive;
  updateFields.updated_at = db.fn.now();
  await db('suppliers')
    .where('id', supplierId)
    .update(updateFields);
  return true;
};
const deleteSupplier = async (supplierId) => {
  const supplier = await db('suppliers')
    .where('id', supplierId)
    .whereNull('deleted_at')
    .first();
  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }
  const poCount = await db('purchase_orders')
    .where('supplier_id', supplierId)
    .count('id as count')
    .first();
  if (poCount.count > 0) {
    throw new AppError('Cannot delete supplier with existing purchase orders. Deactivate instead.', 400);
  }
  await db('suppliers')
    .where('id', supplierId)
    .update({
      is_active: false,
      deleted_at: db.fn.now(),
      updated_at: db.fn.now()
    });
  return true;
};
const restoreSupplier = async (supplierId) => {
  const supplier = await db('suppliers')
    .where('id', supplierId)
    .whereNotNull('deleted_at')
    .first();
  if (!supplier) {
    throw new AppError('Supplier not found or not deleted', 404);
  }
  await db('suppliers')
    .where('id', supplierId)
    .update({
      is_active: true,
      deleted_at: null,
      updated_at: db.fn.now()
    });
  return true;
};
const getPurchaseOrders = async (filters) => {
  const { page = 1, limit = 25, status, supplierId, startDate, endDate } = filters;
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
const getPurchaseOrderById = async (poId) => {
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
    .where('po.id', poId)
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
    .where('pi.po_id', poId);
  purchaseOrder.items = items;
  return purchaseOrder;
};
const createPurchaseOrder = async (poData, userId) => {
  const { supplierId, expectedDeliveryDate, sectorId, items, notes } = poData;
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
  const poNumber = await generateOrderNumber('PO');
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
  return { poId: result, poNumber, totalAmount };
};
const updatePurchaseOrder = async (poId, updateData, userId) => {
  const { expectedDeliveryDate, items, notes } = updateData;
  const purchaseOrder = await db('purchase_orders')
    .where('id', poId)
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
    const updateFields = {};
    if (expectedDeliveryDate) updateFields.expected_delivery_date = expectedDeliveryDate;
    if (notes !== undefined) updateFields.notes = notes;
    updateFields.updated_at = db.fn.now();
    if (Object.keys(updateFields).length > 0) {
      await trx('purchase_orders')
        .where('id', poId)
        .update(updateFields);
    }
    if (items && items.length > 0) {
      await trx('po_items').where('po_id', poId).delete();
      let subtotal = 0;
      for (const item of items) {
        const itemTotal = item.quantityOrdered * item.unitPrice;
        subtotal += itemTotal;
        await trx('po_items').insert({
          po_id: poId,
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
        .where('id', poId)
        .update({
          subtotal: subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          updated_at: db.fn.now()
        });
    }
  });
  return true;
};
const submitForApproval = async (poId, userId) => {
  const purchaseOrder = await db('purchase_orders as po')
    .leftJoin('suppliers as s', 'po.supplier_id', 's.id')
    .leftJoin('po_statuses as ps', 'po.status_id', 'ps.id')
    .select('po.*', 's.name as supplier_name', 'ps.status_code')
    .where('po.id', poId)
    .whereNull('po.deleted_at')
    .first();
  if (!purchaseOrder) {
    throw new AppError('Purchase order not found', 404);
  }
  if (purchaseOrder.status_code !== 'draft') {
    throw new AppError('Only draft purchase orders can be submitted for approval', 400);
  }
  const pendingStatus = await db('po_statuses').where('status_code', 'pending').first();
  await db('purchase_orders')
    .where('id', poId)
    .update({
      status_id: pendingStatus.id,
      updated_at: db.fn.now()
    });
  const approvers = await getApproversForPO(purchaseOrder.total_amount);
  const requester = await db('users').where('id', userId).first();
  for (const approver of approvers) {
    await sendEmail({
      to: approver.email,
      subject: `Purchase Order Approval Required: ${purchaseOrder.po_number}`,
      template: 'po-approval-request',
      data: {
        approverName: approver.full_name,
        poNumber: purchaseOrder.po_number,
        totalAmount: purchaseOrder.total_amount,
        supplierName: purchaseOrder.supplier_name,
        requesterName: requester?.full_name || 'Unknown',
        approvalUrl: `${config.frontendUrl}/purchase/orders/${poId}/approve`
      }
    }).catch(() => {});
  }
  return {
    poNumber: purchaseOrder.po_number,
    approversNotified: approvers.length
  };
};
const approvePurchaseOrder = async (poId, approved, rejectionReason, userId) => {
  const purchaseOrder = await db('purchase_orders as po')
    .leftJoin('suppliers as s', 'po.supplier_id', 's.id')
    .leftJoin('po_statuses as ps', 'po.status_id', 'ps.id')
    .select('po.*', 's.name as supplier_name', 'ps.status_code')
    .where('po.id', poId)
    .whereNull('po.deleted_at')
    .first();
  if (!purchaseOrder) {
    throw new AppError('Purchase order not found', 404);
  }
  if (purchaseOrder.status_code !== 'pending') {
    throw new AppError('Only pending purchase orders can be approved/rejected', 400);
  }
  await validateApprovalAuthority(purchaseOrder.total_amount, userId);
  const newStatus = approved ? 'approved' : 'rejected';
  const statusRecord = await db('po_statuses').where('status_code', newStatus).first();
  await db('purchase_orders')
    .where('id', poId)
    .update({
      status_id: statusRecord.id,
      approved_by: approved ? userId : null,
      approved_at: approved ? db.fn.now() : null,
      rejection_reason: approved ? null : rejectionReason || null,
      updated_at: db.fn.now()
    });
  const requester = await db('users').where('id', purchaseOrder.created_by).first();
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
  }).catch(() => {});
  return { approved };
};
const cancelPurchaseOrder = async (poId, reason, userId) => {
  const purchaseOrder = await db('purchase_orders as po')
    .leftJoin('po_statuses as ps', 'po.status_id', 'ps.id')
    .select('po.*', 'ps.status_code')
    .where('po.id', poId)
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
    .where('id', poId)
    .update({
      status_id: cancelledStatus.id,
      rejection_reason: reason,
      updated_at: db.fn.now()
    });
  const requester = await db('users').where('id', purchaseOrder.created_by).first();
  const canceller = await db('users').where('id', userId).first();
  await sendEmail({
    to: requester.email,
    subject: `Purchase Order ${purchaseOrder.po_number} - Cancelled`,
    template: 'po-cancelled',
    data: {
      requesterName: requester.full_name,
      poNumber: purchaseOrder.po_number,
      reason,
      cancelledBy: canceller?.full_name || 'Unknown'
    }
  }).catch(() => {});
  return { cancelled: true };
};
const getPendingReceiving = async () => {
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
  return pendingReceiving;
};
const registerReceiving = async (poId, items, receivingNote, userId) => {
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
          quality_pass: item.qualityPass,
          updated_at: db.fn.now()
        });
      const goodQuantity = item.quantityReceived;
      if (goodQuantity > 0 && poItem.product_id) {
        const currentInventory = await trx('inventory')
          .where('product_id', poItem.product_id)
          .first();
        if (currentInventory) {
          const newQuantity = currentInventory.quantity + goodQuantity;
          const newAvgCost = ((currentInventory.quantity * currentInventory.unit_cost) + (goodQuantity * poItem.unit_price)) / newQuantity;
          await trx('inventory')
            .where('product_id', poItem.product_id)
            .update({
              quantity: newQuantity,
              unit_cost: newAvgCost,
              last_updated: db.fn.now()
            });
        } else {
          await trx('inventory').insert({
            product_id: poItem.product_id,
            quantity: goodQuantity,
            unit_cost: poItem.unit_price,
            last_updated: db.fn.now()
          });
        }
        await trx('inventory_movements').insert({
          product_id: poItem.product_id,
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
  return true;
};
const getPurchaseStatistics = async () => {
  const startOfMonth = db.raw('DATE_FORMAT(NOW(), "%Y-%m-01")');
  const startOfYear = db.raw('DATE_FORMAT(NOW(), "%Y-01-01")');
  const monthlyPOs = await db('purchase_orders')
    .where('created_at', '>=', startOfMonth)
    .count('id as count')
    .first();
  const pendingStatus = await db('po_statuses').where('status_code', 'pending').first();
  const pendingApprovals = await db('purchase_orders')
    .where('status_id', pendingStatus?.id)
    .count('id as count')
    .first();
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
  return {
    monthlyPOs: parseInt(monthlyPOs.count),
    pendingApprovals: parseInt(pendingApprovals.count),
    totalSpendThisYear: parseFloat(totalSpend.total || 0),
    activeSuppliers: parseInt(activeSuppliers.count),
    topSuppliers,
    recentPOs
  };
};
const getSectors = async () => {
  const sectors = await db('sectors')
    .select('id', 'name', 'description')
    .orderBy('name');
  return sectors;
};
const getPaymentTerms = async () => {
  const paymentTerms = await db('payment_terms')
    .select('id', 'name', 'days_net')
    .orderBy('days_net');
  return paymentTerms;
};
const getApproversForPO = async (totalAmount) => {
  const approvers = [];
  if (totalAmount > config.businessRules.highValuePoThreshold) {
    const ceoUsers = await db('users')
      .leftJoin('user_roles', 'users.id', 'user_roles.user_id')
      .leftJoin('roles', 'user_roles.role_id', 'roles.id')
      .where('roles.name', 'CEO')
      .select('users.email', 'users.full_name');
    approvers.push(...ceoUsers);
  } else {
    const managers = await db('users')
      .leftJoin('user_roles', 'users.id', 'user_roles.user_id')
      .leftJoin('roles', 'user_roles.role_id', 'roles.id')
      .where('roles.name', 'Finance')
      .select('users.email', 'users.full_name');
    approvers.push(...managers);
  }
  return approvers;
};
const validateApprovalAuthority = async (totalAmount, userId) => {
  if (totalAmount > config.businessRules.highValuePoThreshold) {
    const userRoles = await db('user_roles')
      .leftJoin('roles', 'user_roles.role_id', 'roles.id')
      .where('user_roles.user_id', userId)
      .select('roles.name');
    const hasCeoRole = userRoles.some(r => r.name === 'CEO');
    if (!hasCeoRole) {
      throw new AppError('This purchase order requires CEO approval due to high value', 403);
    }
  }
};
module.exports = {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  restoreSupplier,
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  submitForApproval,
  approvePurchaseOrder,
  cancelPurchaseOrder,
  getPendingReceiving,
  registerReceiving,
  getPurchaseStatistics,
  getSectors,
  getPaymentTerms
};
