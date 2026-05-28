const { db, transaction } = require('../../config/database');
const { audit } = require('../../config/logger');
const { sendEmail } = require('../../services/email.service');
const AppError = require('../../utils/AppError');
const { catchAsync } = require('../../utils/catchAsync');
exports.getExpenses = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 25,
    categoryId,
    startDate,
    endDate,
    status = 'all'
  } = req.query;
  const offset = (page - 1) * limit;
  let query = db('expenses as e')
    .leftJoin('expense_categories as ec', 'e.category_id', 'ec.id')
    .leftJoin('payment_methods as pm', 'e.payment_method_id', 'pm.id')
    .leftJoin('users as u', 'e.entered_by', 'u.id')
    .leftJoin('users as a', 'e.approved_by', 'a.id')
    .select(
      'e.*',
      'ec.name as category_name',
      'ec.requires_approval',
      'pm.name as payment_method_name',
      'u.full_name as entered_by_name',
      'a.full_name as approved_by_name'
    )
    .whereNull('e.deleted_at');
  if (categoryId) {
    query = query.where('e.category_id', categoryId);
  }
  if (startDate && endDate) {
    query = query.whereBetween('e.date', [startDate, endDate]);
  }
  if (status === 'pending') {
    query = query.whereNull('e.approved_at');
  } else if (status === 'approved') {
    query = query.whereNotNull('e.approved_at');
  }
  const total = await query.clone().clearSelect().count('e.id as total').first();
  const expenses = await query
    .orderBy('e.date', 'desc')
    .limit(limit)
    .offset(offset);
  const totals = await db('expenses')
    .where(function() {
      if (categoryId) this.where('category_id', categoryId);
      if (startDate && endDate) this.whereBetween('date', [startDate, endDate]);
    })
    .whereNull('deleted_at')
    .select(
      db.raw('SUM(amount) as total_amount'),
      db.raw('COUNT(*) as total_count'),
      db.raw('SUM(CASE WHEN approved_at IS NOT NULL THEN amount ELSE 0 END) as approved_amount')
    )
    .first();
  res.json({
    status: 'success',
    data: {
      expenses,
      summary: {
        totalAmount: parseFloat(totals.total_amount || 0),
        totalCount: parseInt(totals.total_count || 0),
        approvedAmount: parseFloat(totals.approved_amount || 0),
        pendingAmount: parseFloat((totals.total_amount || 0) - (totals.approved_amount || 0))
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.total),
        totalPages: Math.ceil(total.total / limit)
      }
    }
  });
});
exports.getExpenseById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const expense = await db('expenses as e')
    .leftJoin('expense_categories as ec', 'e.category_id', 'ec.id')
    .leftJoin('payment_methods as pm', 'e.payment_method_id', 'pm.id')
    .leftJoin('users as u', 'e.entered_by', 'u.id')
    .leftJoin('users as a', 'e.approved_by', 'a.id')
    .select(
      'e.*',
      'ec.name as category_name',
      'ec.requires_approval',
      'ec.approval_limit',
      'pm.name as payment_method_name',
      'u.full_name as entered_by_name',
      'a.full_name as approved_by_name'
    )
    .where('e.id', id)
    .whereNull('e.deleted_at')
    .first();
  if (!expense) {
    throw new AppError('Expense not found', 404);
  }
  res.json({
    status: 'success',
    data: { expense }
  });
});
exports.createExpense = catchAsync(async (req, res) => {
  const {
    categoryId,
    amount,
    date,
    description,
    paymentMethodId,
    referenceNumber
  } = req.body;
  const userId = req.user.id;
  const ip = req.ip;
  const category = await db('expense_categories')
    .where('id', categoryId)
    .first();
  if (!category) {
    throw new AppError('Expense category not found', 400);
  }
  let requiresApproval = false;
  if (category.requires_approval && amount > category.approval_limit) {
    requiresApproval = true;
  }
  const [expenseId] = await db('expenses').insert({
    category_id: categoryId,
    amount,
    date,
    description,
    payment_method_id: paymentMethodId,
    reference_number: referenceNumber || null,
    entered_by: userId,
    created_at: db.fn.now()
  });
  if (requiresApproval) {
    const approvers = await db('users')
      .leftJoin('user_roles', 'users.id', 'user_roles.user_id')
      .leftJoin('roles', 'user_roles.role_id', 'roles.id')
      .where('roles.name', 'Finance')
      .select('users.email', 'users.full_name');
    for (const approver of approvers) {
      await sendEmail({
        to: approver.email,
        subject: `Expense Approval Required: ${category.name} - ${amount} ETB`,
        template: 'expense-approval-request',
        data: {
          approverName: approver.full_name,
          category: category.name,
          amount,
          description,
          requesterName: req.user.full_name,
          expenseId,
          approvalUrl: `${process.env.FRONTEND_URL}/finance/expenses/${expenseId}/approve`
        }
      }).catch(err => console.error('Failed to send approval email:', err.message));
    }
  }
  await audit('EXPENSE_CREATED', expenseId, {
    ip,
    details: { categoryId, amount, description, requiresApproval }
  });
  res.status(201).json({
    status: 'success',
    message: requiresApproval 
      ? 'Expense created and submitted for approval'
      : 'Expense created successfully',
    data: { expenseId, requiresApproval }
  });
});
exports.updateExpense = catchAsync(async (req, res) => {
  const { id } = req.params;
  const {
    categoryId,
    amount,
    date,
    description,
    paymentMethodId,
    referenceNumber
  } = req.body;
  const userId = req.user.id;
  const ip = req.ip;
  const expense = await db('expenses')
    .where('id', id)
    .whereNull('deleted_at')
    .first();
  if (!expense) {
    throw new AppError('Expense not found', 404);
  }
  if (expense.approved_at) {
    throw new AppError('Cannot update an approved expense', 400);
  }
  const updateData = {};
  if (categoryId) updateData.category_id = categoryId;
  if (amount) updateData.amount = amount;
  if (date) updateData.date = date;
  if (description) updateData.description = description;
  if (paymentMethodId) updateData.payment_method_id = paymentMethodId;
  if (referenceNumber !== undefined) updateData.reference_number = referenceNumber;
  updateData.updated_at = db.fn.now();
  await db('expenses')
    .where('id', id)
    .update(updateData);
  await audit('EXPENSE_UPDATED', id, {
    ip,
    details: { updates: Object.keys(updateData) }
  });
  res.json({
    status: 'success',
    message: 'Expense updated successfully'
  });
});
exports.uploadReceipt = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!req.file) {
    throw new AppError('No receipt file provided', 400);
  }
  const expense = await db('expenses')
    .where('id', id)
    .whereNull('deleted_at')
    .first();
  if (!expense) {
    throw new AppError('Expense not found', 404);
  }
  const receiptPath = `/uploads/expenses/${req.file.filename}`;
  await db('expenses')
    .where('id', id)
    .update({
      receipt_path: receiptPath,
      updated_at: db.fn.now()
    });
  res.json({
    status: 'success',
    message: 'Receipt uploaded successfully',
    data: { receiptPath }
  });
});
exports.deleteExpense = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const ip = req.ip;
  const expense = await db('expenses')
    .where('id', id)
    .whereNull('deleted_at')
    .first();
  if (!expense) {
    throw new AppError('Expense not found', 404);
  }
  if (expense.approved_at) {
    throw new AppError('Cannot delete an approved expense', 400);
  }
  await db('expenses')
    .where('id', id)
    .update({
      deleted_at: db.fn.now(),
      updated_at: db.fn.now()
    });
  await audit('EXPENSE_DELETED', id, {
    ip,
    details: { amount: expense.amount, description: expense.description }
  });
  res.json({
    status: 'success',
    message: 'Expense deleted successfully'
  });
});
exports.approveExpense = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { approved, rejectionReason } = req.body;
  const userId = req.user.id;
  const ip = req.ip;
  const expense = await db('expenses as e')
    .leftJoin('expense_categories as ec', 'e.category_id', 'ec.id')
    .select('e.*', 'ec.name as category_name')
    .where('e.id', id)
    .whereNull('e.deleted_at')
    .first();
  if (!expense) {
    throw new AppError('Expense not found', 404);
  }
  if (expense.approved_at) {
    throw new AppError('Expense already approved', 400);
  }
  if (!approved) {
    await db('expenses')
      .where('id', id)
      .update({
        approved_by: userId,
        approved_at: null,
        rejection_reason: rejectionReason,
        updated_at: db.fn.now()
      });
    await audit('EXPENSE_REJECTED', id, {
      ip,
      details: { reason: rejectionReason }
    });
    const creator = await db('users').where('id', expense.entered_by).first();
    await sendEmail({
      to: creator.email,
      subject: `Expense Rejected: ${expense.category_name} - ${expense.amount} ETB`,
      template: 'expense-rejected',
      data: {
        name: creator.full_name,
        category: expense.category_name,
        amount: expense.amount,
        description: expense.description,
        reason: rejectionReason
      }
    }).catch(err => console.error('Failed to send rejection email:', err.message));
    return res.json({
      status: 'success',
      message: 'Expense rejected'
    });
  }
  await db('expenses')
    .where('id', id)
    .update({
      approved_by: userId,
      approved_at: db.fn.now(),
      updated_at: db.fn.now()
    });
  await audit('EXPENSE_APPROVED', id, {
    ip,
    details: { amount: expense.amount, category: expense.category_name }
  });
  const creator = await db('users').where('id', expense.entered_by).first();
  await sendEmail({
    to: creator.email,
    subject: `Expense Approved: ${expense.category_name} - ${expense.amount} ETB`,
    template: 'expense-approved',
    data: {
      name: creator.full_name,
      category: expense.category_name,
      amount: expense.amount,
      description: expense.description,
      approvedBy: req.user.full_name,
      approvedAt: new Date().toISOString()
    }
  }).catch(err => console.error('Failed to send approval email:', err.message));
  res.json({
    status: 'success',
    message: 'Expense approved'
  });
});
exports.getPayments = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 25,
    referenceType,
    startDate,
    endDate
  } = req.query;
  const offset = (page - 1) * limit;
  let poPayments = [];
  let invoicePayments = [];
  const poQuery = db('po_payments as pp')
    .leftJoin('purchase_orders as po', 'pp.po_id', 'po.id')
    .leftJoin('suppliers as s', 'po.supplier_id', 's.id')
    .leftJoin('payment_methods as pm', 'pp.payment_method_id', 'pm.id')
    .leftJoin('payment_statuses as ps', 'pp.status_id', 'ps.id')
    .leftJoin('users as u', 'pp.processed_by', 'u.id')
    .select(
      'pp.id',
      db.raw("'PO' as reference_type"),
      'pp.po_id as reference_id',
      'po.po_number as reference_number',
      's.name as party_name',
      'pp.amount',
      'pm.name as payment_method',
      'ps.status_name as status',
      'pp.reference_number as transaction_ref',
      'pp.processed_at',
      'u.full_name as processed_by_name',
      'pp.notes'
    );
  if (startDate && endDate) {
    poQuery.whereBetween('pp.processed_at', [startDate, endDate]);
  }
  const invoiceQuery = db('invoice_payments as ip')
    .leftJoin('pos_sales as ps', 'ip.sale_id', 'ps.id')
    .leftJoin('customers as c', 'ps.customer_id', 'c.id')
    .leftJoin('payment_methods as pm', 'ip.payment_method_id', 'pm.id')
    .leftJoin('payment_statuses as pst', 'ip.status_id', 'pst.id')
    .leftJoin('users as u', 'ip.processed_by', 'u.id')
    .select(
      'ip.id',
      db.raw("'INVOICE' as reference_type"),
      'ip.sale_id as reference_id',
      'ps.invoice_number as reference_number',
      'c.name as party_name',
      'ip.amount',
      'pm.name as payment_method',
      'pst.status_name as status',
      'ip.reference_number as transaction_ref',
      'ip.processed_at',
      'u.full_name as processed_by_name',
      'ip.notes'
    );
  if (startDate && endDate) {
    invoiceQuery.whereBetween('ip.processed_at', [startDate, endDate]);
  }
  if (!referenceType || referenceType === 'PO') {
    poPayments = await poQuery.orderBy('pp.processed_at', 'desc');
  }
  if (!referenceType || referenceType === 'Invoice') {
    invoicePayments = await invoiceQuery.orderBy('ip.processed_at', 'desc');
  }
  const allPayments = [...poPayments, ...invoicePayments]
    .sort((a, b) => new Date(b.processed_at) - new Date(a.processed_at));
  const total = allPayments.length;
  const paginatedPayments = allPayments.slice(offset, offset + limit);
  const totalAmount = allPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const poTotal = poPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const invoiceTotal = invoicePayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  res.json({
    status: 'success',
    data: {
      payments: paginatedPayments,
      summary: {
        totalAmount,
        poTotal,
        invoiceTotal,
        totalCount: total
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  });
});
exports.getPaymentById = catchAsync(async (req, res) => {
  const { id } = req.params;
  let payment = await db('po_payments as pp')
    .leftJoin('purchase_orders as po', 'pp.po_id', 'po.id')
    .leftJoin('suppliers as s', 'po.supplier_id', 's.id')
    .leftJoin('payment_methods as pm', 'pp.payment_method_id', 'pm.id')
    .leftJoin('payment_statuses as ps', 'pp.status_id', 'ps.id')
    .leftJoin('users as u', 'pp.processed_by', 'u.id')
    .select(
      'pp.*',
      db.raw("'PO' as payment_type"),
      'po.po_number as reference_number',
      's.name as party_name',
      'pm.name as payment_method_name',
      'ps.status_name as status_name',
      'u.full_name as processed_by_name'
    )
    .where('pp.id', id)
    .first();
  if (!payment) {
    payment = await db('invoice_payments as ip')
      .leftJoin('pos_sales as ps', 'ip.sale_id', 'ps.id')
      .leftJoin('customers as c', 'ps.customer_id', 'c.id')
      .leftJoin('payment_methods as pm', 'ip.payment_method_id', 'pm.id')
      .leftJoin('payment_statuses as pst', 'ip.status_id', 'pst.id')
      .leftJoin('users as u', 'ip.processed_by', 'u.id')
      .select(
        'ip.*',
        db.raw("'INVOICE' as payment_type"),
        'ps.invoice_number as reference_number',
        'c.name as party_name',
        'pm.name as payment_method_name',
        'pst.status_name as status_name',
        'u.full_name as processed_by_name'
      )
      .where('ip.id', id)
      .first();
  }
  if (!payment) {
    throw new AppError('Payment not found', 404);
  }
  res.json({
    status: 'success',
    data: { payment }
  });
});
exports.processPOMobilePayments = catchAsync(async (req, res) => {
  const { poId, amount, paymentMethodId, referenceNumber, notes } = req.body;
  const userId = req.user.id;
  const ip = req.ip;
  const purchaseOrder = await db('purchase_orders')
    .where('id', poId)
    .whereNull('deleted_at')
    .first();
  if (!purchaseOrder) {
    throw new AppError('Purchase order not found', 404);
  }
  const remainingAmount = Number((purchaseOrder.total_amount - purchaseOrder.paid_amount).toFixed(2));
  if (amount > remainingAmount) {
    throw new AppError(`Amount exceeds remaining balance. Remaining: ${remainingAmount} ETB`, 400);
  }
  const completedStatus = await db('payment_statuses').where('status_code', 'completed').first();
  await transaction(async (trx) => {
    await trx('po_payments').insert({
      po_id: poId,
      amount,
      payment_method_id: paymentMethodId,
      reference_number: referenceNumber || null,
      status_id: completedStatus.id,
      processed_by: userId,
      processed_at: db.fn.now(),
      notes: notes || null
    });
    const newPaidAmount = purchaseOrder.paid_amount + amount;
    await trx('purchase_orders')
      .where('id', poId)
      .update({
        paid_amount: newPaidAmount,
        updated_at: db.fn.now()
      });
  });
  await audit('PO_PAYMENT_PROCESSED', poId, {
    ip,
    details: { amount, poNumber: purchaseOrder.po_number }
  });
  res.json({
    status: 'success',
    message: `Payment of ${amount} ETB processed for PO ${purchaseOrder.po_number}`,
    data: {
      poId,
      poNumber: purchaseOrder.po_number,
      amountPaid: amount,
      remainingBalance: purchaseOrder.total_amount - (purchaseOrder.paid_amount + amount)
    }
  });
});
exports.processInvoicePayment = catchAsync(async (req, res) => {
  console.log('--- processInvoicePayment payload:', req.body);
  const { saleId, amount, paymentMethodId, referenceNumber, notes } = req.body;
  const userId = req.user.id;
  const ip = req.ip;
  const sale = await db('pos_sales')
    .leftJoin('customers', 'pos_sales.customer_id', 'customers.id')
    .select('pos_sales.*', 'customers.name as customer_name', 'customers.current_balance')
    .where('pos_sales.id', saleId)
    .whereNull('pos_sales.deleted_at')
    .first();
  console.log('--- Found sale:', sale);
  if (!sale) {
    throw new AppError('Sale not found', 404);
  }
  const creditMethod = await db('payment_methods').where('name', 'Credit').first();
  if (!creditMethod || sale.payment_method_id !== creditMethod.id) {
    throw new AppError('This sale is not a credit sale', 400);
  }
  const remainingInvoiceBalance = Number((sale.total_amount - sale.amount_paid).toFixed(2));
  if (amount > remainingInvoiceBalance) {
    throw new AppError(`Amount exceeds invoice remaining balance. Balance: ${remainingInvoiceBalance} ETB`, 400);
  }
  const completedStatus = await db('payment_statuses').where('status_code', 'completed').first();
  const newBalance = sale.current_balance - amount;
  await transaction(async (trx) => {
    await trx('invoice_payments').insert({
      sale_id: saleId,
      amount,
      payment_method_id: paymentMethodId,
      reference_number: referenceNumber || null,
      status_id: completedStatus.id,
      processed_by: userId,
      processed_at: db.fn.now(),
      notes: notes || null
    });
    await trx('pos_sales')
      .where('id', saleId)
      .update({
        amount_paid: db.raw('amount_paid + ?', [amount])
      });
    await trx('customers')
      .where('id', sale.customer_id)
      .update({
        current_balance: newBalance,
        updated_at: db.fn.now()
      });
  });
  await audit('INVOICE_PAYMENT_PROCESSED', saleId, {
    ip,
    details: { amount, customerId: sale.customer_id, customerName: sale.customer_name }
  });
  if (sale.customer_id) {
    const customer = await db('customers').where('id', sale.customer_id).first();
    if (customer.email) {
      await sendEmail({
        to: customer.email,
        subject: `Payment Received - Invoice ${sale.invoice_number}`,
        template: 'payment-receipt',
        data: {
          customerName: customer.name,
          invoiceNumber: sale.invoice_number,
          amount,
          newBalance,
          paymentDate: new Date().toISOString()
        }
      }).catch(err => console.error('Failed to send receipt email:', err.message));
    }
  }
  res.json({
    status: 'success',
    message: `Payment of ${amount} ETB received for invoice ${sale.invoice_number}`,
    data: {
      saleId,
      invoiceNumber: sale.invoice_number,
      amountPaid: amount,
      remainingBalance: newBalance
    }
  });
});
exports.getAccountsReceivable = catchAsync(async (req, res) => {
  const { asOfDate = new Date().toISOString().split('T')[0] } = req.query;
  const customers = await db('customers')
    .where('current_balance', '>', 0)
    .whereNull('deleted_at')
    .select('id', 'name', 'phone', 'email', 'current_balance');
  const aging = [];
  let totalCurrent = 0;
  let total30Days = 0;
  let total60Days = 0;
  let total90Days = 0;
  let totalOver90Days = 0;
  for (const customer of customers) {
    const invoices = await db('pos_sales')
      .where('customer_id', customer.id)
      .where('payment_method', 'Credit')
      .where('status_id', 1) 
      .select('id', 'invoice_number', 'total_amount', 'sale_date')
      .orderBy('sale_date', 'asc');
    let paidAmount = 0;
    for (const invoice of invoices) {
      const payments = await db('invoice_payments')
        .where('sale_id', invoice.id)
        .sum('amount as total')
        .first();
      paidAmount += parseFloat(payments.total || 0);
    }
    let remainingBalance = customer.current_balance;
    const daysOverdue = Math.floor((new Date(asOfDate) - new Date(invoices[0]?.sale_date)) / (1000 * 60 * 60 * 24));
    let agingBucket = 'current';
    if (daysOverdue > 90) {
      agingBucket = 'over_90';
      totalOver90Days += remainingBalance;
    } else if (daysOverdue > 60) {
      agingBucket = '60_90';
      total60Days += remainingBalance;
    } else if (daysOverdue > 30) {
      agingBucket = '30_60';
      total30Days += remainingBalance;
    } else {
      agingBucket = 'current';
      totalCurrent += remainingBalance;
    }
    aging.push({
      ...customer,
      remainingBalance,
      daysOverdue: Math.max(0, daysOverdue),
      agingBucket
    });
  }
  res.json({
    status: 'success',
    data: {
      asOfDate,
      aging,
      summary: {
        totalReceivable: totalCurrent + total30Days + total60Days + total90Days + totalOver90Days,
        current: totalCurrent,
        days30_60: total30Days,
        days60_90: total60Days,
        daysOver90: totalOver90Days
      }
    }
  });
});
exports.getAccountsPayable = catchAsync(async (req, res) => {
  const { asOfDate = new Date().toISOString().split('T')[0] } = req.query;
  const suppliers = await db('suppliers')
    .where('is_active', true)
    .whereNull('deleted_at')
    .select('id', 'name', 'phone', 'email');
  const aging = [];
  let totalCurrent = 0;
  let total30Days = 0;
  let total60Days = 0;
  let total90Days = 0;
  let totalOver90Days = 0;
  for (const supplier of suppliers) {
    const unpaidPOs = await db('purchase_orders')
      .where('supplier_id', supplier.id)
      .whereRaw('paid_amount < total_amount')
      .select('id', 'po_number', 'total_amount', 'paid_amount', 'created_at');
    let totalOwed = 0;
    for (const po of unpaidPOs) {
      totalOwed += po.total_amount - po.paid_amount;
    }
    if (totalOwed === 0) continue;
    const oldestPO = unpaidPOs[0];
    const daysOutstanding = Math.floor((new Date(asOfDate) - new Date(oldestPO?.created_at)) / (1000 * 60 * 60 * 24));
    let agingBucket = 'current';
    if (daysOutstanding > 90) {
      agingBucket = 'over_90';
      totalOver90Days += totalOwed;
    } else if (daysOutstanding > 60) {
      agingBucket = '60_90';
      total60Days += totalOwed;
    } else if (daysOutstanding > 30) {
      agingBucket = '30_60';
      total30Days += totalOwed;
    } else {
      agingBucket = 'current';
      totalCurrent += totalOwed;
    }
    aging.push({
      ...supplier,
      totalOwed,
      daysOutstanding: Math.max(0, daysOutstanding),
      agingBucket,
      unpaidOrders: unpaidPOs.length
    });
  }
  res.json({
    status: 'success',
    data: {
      asOfDate,
      aging,
      summary: {
        totalPayable: totalCurrent + total30Days + total60Days + total90Days + totalOver90Days,
        current: totalCurrent,
        days30_60: total30Days,
        days60_90: total60Days,
        daysOver90: totalOver90Days
      }
    }
  });
});
exports.getExpenseCategories = catchAsync(async (req, res) => {
  const categories = await db('expense_categories')
    .select('id', 'name', 'requires_approval', 'approval_limit')
    .orderBy('name');
  res.json({
    status: 'success',
    data: { categories }
  });
});
exports.getPaymentMethods = catchAsync(async (req, res) => {
  const methods = await db('payment_methods')
    .select('id', 'name', 'requires_reference', 'is_active')
    .where('is_active', true)
    .orderBy('name');
  res.json({
    status: 'success',
    data: { paymentMethods: methods }
  });
});
exports.getFinanceStatistics = catchAsync(async (req, res) => {
  const startOfMonth = db.raw('DATE_FORMAT(NOW(), "%Y-%m-01")');
  const startOfYear = db.raw('DATE_FORMAT(NOW(), "%Y-01-01")');
  const monthlyExpensesResult = await db('expenses')
    .where('created_at', '>=', startOfMonth)
    .whereNull('deleted_at')
    .sum('amount as total')
    .first();
  const monthlyExpenses = parseFloat(monthlyExpensesResult.total || 0);
  const monthlyRevenueResult = await db('pos_sales')
    .where('sale_date', '>=', startOfMonth)
    .whereNull('deleted_at')
    .sum('total_amount as total')
    .first();
  const monthlyRevenue = parseFloat(monthlyRevenueResult.total || 0);
  const netProfit = monthlyRevenue - monthlyExpenses;
  const yearlyExpensesByCategory = await db('expenses as e')
    .leftJoin('expense_categories as ec', 'e.category_id', 'ec.id')
    .where('e.created_at', '>=', startOfYear)
    .whereNull('e.deleted_at')
    .select('ec.name as category', db.raw('SUM(e.amount) as total'))
    .groupBy('e.category_id', 'ec.name')
    .orderBy('total', 'desc');
  const pendingApprovals = await db('expenses')
    .whereNull('approved_at')
    .whereNull('deleted_at')
    .count('id as count')
    .first();
  const pendingAmount = await db('expenses')
    .whereNull('approved_at')
    .whereNull('deleted_at')
    .sum('amount as total')
    .first();
  const totalReceivable = await db('customers')
    .sum('current_balance as total')
    .first();
  res.json({
    status: 'success',
    data: {
      monthlyRevenue,
      monthlyExpenses,
      netProfit,
      yearlyExpensesByCategory,
      pendingApprovals: parseInt(pendingApprovals.count),
      pendingApprovalAmount: parseFloat(pendingAmount.total || 0),
      totalAccountsReceivable: parseFloat(totalReceivable.total || 0)
    }
  });
});
exports.processRefund = catchAsync(async (req, res) => {
  res.json({
    status: 'success',
    message: 'Refund processed successfully (stub)'
  });
});
exports.getAccountsPayable = catchAsync(async (req, res) => {
  res.json({
    status: 'success',
    data: { accountsPayable: [] }
  });
});
exports.getExpenseCategories = catchAsync(async (req, res) => {
  const categories = await db('expense_categories').select('*');
  res.json({
    status: 'success',
    data: { categories }
  });
});
exports.getPaymentMethods = catchAsync(async (req, res) => {
  const methods = await db('payment_methods').select('*');
  res.json({
    status: 'success',
    data: { paymentMethods: methods }
  });
});
