const { db } = require('../../config/database');
const { catchAsync } = require('../../utils/catchAsync');

const ensureTable = async () => {
  await db.raw(`
    CREATE TABLE IF NOT EXISTS purchase_budget_workflow (
      id INT AUTO_INCREMENT PRIMARY KEY,
      request_number VARCHAR(50) NOT NULL UNIQUE,
      product_name VARCHAR(255) NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      estimated_cost DECIMAL(12,2) DEFAULT 0,
      supplier_name VARCHAR(255) DEFAULT NULL,
      supplier_contact VARCHAR(255) DEFAULT NULL,
      requested_by INT NOT NULL,
      store_notes TEXT DEFAULT NULL,
      purchase_officer_id INT DEFAULT NULL,
      po_number VARCHAR(100) DEFAULT NULL,
      budget_request_notes TEXT DEFAULT NULL,
      finance_handler INT DEFAULT NULL,
      budget_amount DECIMAL(12,2) DEFAULT NULL,
      finance_notes TEXT DEFAULT NULL,
      ceo_budget_handler INT DEFAULT NULL,
      ceo_budget_notes TEXT DEFAULT NULL,
      budget_approved_at TIMESTAMP NULL,
      purchase_notes TEXT DEFAULT NULL,
      purchased_at TIMESTAMP NULL,
      advance_amount DECIMAL(12,2) DEFAULT NULL,
      advance_payment_ref VARCHAR(255) DEFAULT NULL,
      advance_paid_at TIMESTAMP NULL,
      inventory_handler INT DEFAULT NULL,
      receiving_notes TEXT DEFAULT NULL,
      goods_received_at TIMESTAMP NULL,
      receipt_handler INT DEFAULT NULL,
      receipt_notes TEXT DEFAULT NULL,
      receipt_confirmed_at TIMESTAMP NULL,
      ceo_remaining_handler INT DEFAULT NULL,
      remaining_notes TEXT DEFAULT NULL,
      remaining_approved_at TIMESTAMP NULL,
      remaining_payment_ref VARCHAR(255) DEFAULT NULL,
      remaining_paid_at TIMESTAMP NULL,
      finance_payment_notes TEXT DEFAULT NULL,
      status ENUM('STORE_REQUESTED','BUDGET_REQUESTED','BUDGET_FORWARDED_CEO','BUDGET_APPROVED','BUDGET_READY','GOODS_PURCHASED','ADVANCE_PAID','GOODS_RECEIVED','RECEIPT_CONFIRMED','REMAINING_APPROVED','REMAINING_PAID','CANCELLED') DEFAULT 'STORE_REQUESTED',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
};

const generateRequestNumber = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PW-${ts}-${rand}`;
};

exports.create = catchAsync(async (req, res) => {
  await ensureTable();
  const { product_name, quantity, estimated_cost, supplier_name, supplier_contact, store_notes } = req.body;
  if (!product_name || !quantity) {
    return res.status(400).json({ status: 'error', message: 'product_name and quantity are required' });
  }
  const request_number = generateRequestNumber();
  const [id] = await db('purchase_budget_workflow').insert({
    request_number, product_name, quantity,
    estimated_cost: estimated_cost || 0,
    supplier_name: supplier_name || null,
    supplier_contact: supplier_contact || null,
    store_notes: store_notes || null,
    requested_by: req.user.id,
    status: 'STORE_REQUESTED',
  });
  const row = await db('purchase_budget_workflow').where('id', id).first();
  res.status(201).json({ status: 'success', data: row });
});

exports.list = catchAsync(async (req, res) => {
  await ensureTable();
  const { status } = req.query;
  let q = db('purchase_budget_workflow')
    .select(
      'purchase_budget_workflow.*',
      'req_user.full_name as requester_name',
      'po_user.full_name as purchase_officer_name',
      'fin_user.full_name as finance_handler_name',
      'ceo_bud_user.full_name as ceo_budget_handler_name',
      'inv_user.full_name as inventory_handler_name',
      'receipt_user.full_name as receipt_handler_name',
      'ceo_rem_user.full_name as ceo_remaining_handler_name'
    )
    .leftJoin('users as req_user', 'purchase_budget_workflow.requested_by', 'req_user.id')
    .leftJoin('users as po_user', 'purchase_budget_workflow.purchase_officer_id', 'po_user.id')
    .leftJoin('users as fin_user', 'purchase_budget_workflow.finance_handler', 'fin_user.id')
    .leftJoin('users as ceo_bud_user', 'purchase_budget_workflow.ceo_budget_handler', 'ceo_bud_user.id')
    .leftJoin('users as inv_user', 'purchase_budget_workflow.inventory_handler', 'inv_user.id')
    .leftJoin('users as receipt_user', 'purchase_budget_workflow.receipt_handler', 'receipt_user.id')
    .leftJoin('users as ceo_rem_user', 'purchase_budget_workflow.ceo_remaining_handler', 'ceo_rem_user.id');
  if (status) q = q.where('purchase_budget_workflow.status', status);
  const rows = await q.orderBy('purchase_budget_workflow.created_at', 'desc');
  res.json({ status: 'success', data: rows });
});

exports.detail = catchAsync(async (req, res) => {
  await ensureTable();
  const row = await db('purchase_budget_workflow')
    .select(
      'purchase_budget_workflow.*',
      'req_user.full_name as requester_name',
      'po_user.full_name as purchase_officer_name',
      'fin_user.full_name as finance_handler_name',
      'ceo_bud_user.full_name as ceo_budget_handler_name',
      'inv_user.full_name as inventory_handler_name',
      'receipt_user.full_name as receipt_handler_name',
      'ceo_rem_user.full_name as ceo_remaining_handler_name'
    )
    .leftJoin('users as req_user', 'purchase_budget_workflow.requested_by', 'req_user.id')
    .leftJoin('users as po_user', 'purchase_budget_workflow.purchase_officer_id', 'po_user.id')
    .leftJoin('users as fin_user', 'purchase_budget_workflow.finance_handler', 'fin_user.id')
    .leftJoin('users as ceo_bud_user', 'purchase_budget_workflow.ceo_budget_handler', 'ceo_bud_user.id')
    .leftJoin('users as inv_user', 'purchase_budget_workflow.inventory_handler', 'inv_user.id')
    .leftJoin('users as receipt_user', 'purchase_budget_workflow.receipt_handler', 'receipt_user.id')
    .leftJoin('users as ceo_rem_user', 'purchase_budget_workflow.ceo_remaining_handler', 'ceo_rem_user.id')
    .where('purchase_budget_workflow.id', req.params.id)
    .first();
  if (!row) return res.status(404).json({ status: 'error', message: 'Workflow not found' });
  res.json({ status: 'success', data: row });
});

exports.updateStatus = catchAsync(async (req, res) => {
  await ensureTable();
  const { id } = req.params;
  const existing = await db('purchase_budget_workflow').where('id', id).first();
  if (!existing) return res.status(404).json({ status: 'error', message: 'Workflow not found' });

  const {
    status: newStatus,
    po_number, budget_request_notes, budget_amount, finance_notes,
    ceo_budget_notes, purchase_notes, advance_amount, advance_payment_ref,
    receiving_notes, receipt_notes, remaining_notes,
    remaining_payment_ref, finance_payment_notes, product_name, quantity,
    estimated_cost, supplier_name, supplier_contact
  } = req.body;

  const validTransitions = {
    STORE_REQUESTED: ['BUDGET_REQUESTED', 'CANCELLED'],
    BUDGET_REQUESTED: ['BUDGET_FORWARDED_CEO', 'CANCELLED'],
    BUDGET_FORWARDED_CEO: ['BUDGET_APPROVED', 'CANCELLED'],
    BUDGET_APPROVED: ['BUDGET_READY', 'CANCELLED'],
    BUDGET_READY: ['GOODS_PURCHASED', 'CANCELLED'],
    GOODS_PURCHASED: ['ADVANCE_PAID', 'CANCELLED'],
    ADVANCE_PAID: ['GOODS_RECEIVED', 'CANCELLED'],
    GOODS_RECEIVED: ['RECEIPT_CONFIRMED', 'CANCELLED'],
    RECEIPT_CONFIRMED: ['REMAINING_APPROVED', 'CANCELLED'],
    REMAINING_APPROVED: ['REMAINING_PAID', 'CANCELLED'],
    REMAINING_PAID: [],
    CANCELLED: [],
  };

  if (!validTransitions[existing.status]?.includes(newStatus)) {
    return res.status(400).json({
      status: 'error',
      message: `Cannot transition from ${existing.status} to ${newStatus}`,
    });
  }

  const updateData = { status: newStatus };

  if (newStatus === 'BUDGET_REQUESTED') {
    updateData.purchase_officer_id = req.user.id;
    if (po_number) updateData.po_number = po_number;
    if (budget_request_notes) updateData.budget_request_notes = budget_request_notes;
  }
  if (newStatus === 'BUDGET_FORWARDED_CEO') {
    updateData.finance_handler = req.user.id;
    if (budget_amount) updateData.budget_amount = budget_amount;
    if (finance_notes) updateData.finance_notes = finance_notes;
  }
  if (newStatus === 'BUDGET_APPROVED') {
    updateData.ceo_budget_handler = req.user.id;
    updateData.budget_approved_at = db.fn.now();
    if (ceo_budget_notes) updateData.ceo_budget_notes = ceo_budget_notes;
  }
  if (newStatus === 'BUDGET_READY') {
    if (finance_notes) updateData.finance_notes = finance_notes;
  }
  if (newStatus === 'GOODS_PURCHASED') {
    updateData.purchased_at = db.fn.now();
    if (purchase_notes) updateData.purchase_notes = purchase_notes;
  }
  if (newStatus === 'ADVANCE_PAID') {
    updateData.advance_paid_at = db.fn.now();
    if (advance_amount) updateData.advance_amount = advance_amount;
    if (advance_payment_ref) updateData.advance_payment_ref = advance_payment_ref;
  }
  if (newStatus === 'GOODS_RECEIVED') {
    updateData.inventory_handler = req.user.id;
    updateData.goods_received_at = db.fn.now();
    if (receiving_notes) updateData.receiving_notes = receiving_notes;
  }
  if (newStatus === 'RECEIPT_CONFIRMED') {
    updateData.receipt_handler = req.user.id;
    updateData.receipt_confirmed_at = db.fn.now();
    if (receipt_notes) updateData.receipt_notes = receipt_notes;
  }
  if (newStatus === 'REMAINING_APPROVED') {
    updateData.ceo_remaining_handler = req.user.id;
    updateData.remaining_approved_at = db.fn.now();
    if (remaining_notes) updateData.remaining_notes = remaining_notes;
  }
  if (newStatus === 'REMAINING_PAID') {
    updateData.remaining_paid_at = db.fn.now();
    if (remaining_payment_ref) updateData.remaining_payment_ref = remaining_payment_ref;
    if (finance_payment_notes) updateData.finance_payment_notes = finance_payment_notes;
  }
  if (product_name) updateData.product_name = product_name;
  if (quantity) updateData.quantity = quantity;
  if (estimated_cost) updateData.estimated_cost = estimated_cost;
  if (supplier_name) updateData.supplier_name = supplier_name;
  if (supplier_contact) updateData.supplier_contact = supplier_contact;

  await db('purchase_budget_workflow').where('id', id).update(updateData);

  const updated = await db('purchase_budget_workflow')
    .select(
      'purchase_budget_workflow.*',
      'req_user.full_name as requester_name',
      'po_user.full_name as purchase_officer_name',
      'fin_user.full_name as finance_handler_name',
      'ceo_bud_user.full_name as ceo_budget_handler_name',
      'inv_user.full_name as inventory_handler_name',
      'receipt_user.full_name as receipt_handler_name',
      'ceo_rem_user.full_name as ceo_remaining_handler_name'
    )
    .leftJoin('users as req_user', 'purchase_budget_workflow.requested_by', 'req_user.id')
    .leftJoin('users as po_user', 'purchase_budget_workflow.purchase_officer_id', 'po_user.id')
    .leftJoin('users as fin_user', 'purchase_budget_workflow.finance_handler', 'fin_user.id')
    .leftJoin('users as ceo_bud_user', 'purchase_budget_workflow.ceo_budget_handler', 'ceo_bud_user.id')
    .leftJoin('users as inv_user', 'purchase_budget_workflow.inventory_handler', 'inv_user.id')
    .leftJoin('users as receipt_user', 'purchase_budget_workflow.receipt_handler', 'receipt_user.id')
    .leftJoin('users as ceo_rem_user', 'purchase_budget_workflow.ceo_remaining_handler', 'ceo_rem_user.id')
    .where('purchase_budget_workflow.id', id)
    .first();
  res.json({ status: 'success', data: updated });
});
