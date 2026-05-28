const { db, transaction } = require('../config/database');
const config = require('../config/env');
const { audit } = require('../config/logger');
const { sendEmail } = require('./email.service');
const { AppError } = require('../utils/AppError');
const getExpenses = async (filters) => {
  const { page = 1, limit = 25, categoryId, startDate, endDate, status = 'all' } = filters;
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
  const total = await query.clone().count('e.id as total').first();
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
  return {
    expenses,
    summary: {
      totalAmount: parseFloat(totals.total_amount || 0),
      totalCount: parseInt(totals.total_count || 0),
      approvedAmount: parseFloat(totals.approved_amount || 0),
      pendingAmount: parseFloat((totals.total_amount || 0) - (totals.approved_amount || 0))
    },
    pagination: {
      page,
      limit,
      total: parseInt(total.total),
      totalPages: Math.ceil(total.total / limit)
    }
  };
};
const getExpenseById = async (expenseId) => {
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
    .where('e.id', expenseId)
    .whereNull('e.deleted_at')
    .first();
  if (!expense) {
    throw new AppError('Expense not found', 404);
  }
  return expense;
};
const createExpense = async (expenseData, userId) => {
  const { categoryId, amount, date, description, paymentMethodId, referenceNumber } = expenseData;
  const category = await db('expense_categories')
    .where('id', categoryId)
    .first();
  if (!category) {
    throw new AppError('Expense category not found', 400);
  }
  let requiresApproval = false;
  if (category.requires_approval && amount > (category.approval_limit || 0)) {
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
    await notifyExpenseApprovers(expenseId, { category, amount, description }, userId);
  }
  return { expenseId, requiresApproval };
};
const updateExpense = async (expenseId, updateData) => {
  const { categoryId, amount, date, description, paymentMethodId, referenceNumber } = updateData;
  const expense = await db('expenses')
    .where('id', expenseId)
    .whereNull('deleted_at')
    .first();
  if (!expense) {
    throw new AppError('Expense not found', 404);
  }
  if (expense.approved_at) {
    throw new AppError('Cannot update an approved expense', 400);
  }
  const updateFields = {};
  if (categoryId) updateFields.category_id = categoryId;
  if (amount) updateFields.amount = amount;
  if (date) updateFields.date = date;
  if (description) updateFields.description = description;
  if (paymentMethodId) updateFields.payment_method_id = paymentMethodId;
  if (referenceNumber !== undefined) updateFields.reference_number = referenceNumber;
  updateFields.updated_at = db.fn.now();
  await db('expenses')
    .where('id', expenseId)
    .update(updateFields);
  return true;
};
const deleteExpense = async (expenseId) => {
  const expense = await db('expenses')
    .where('id', expenseId)
    .whereNull('deleted_at')
    .first();
  if (!expense) {
    throw new AppError('Expense not found', 404);
  }
  if (expense.approved_at) {
    throw new AppError('Cannot delete an approved expense', 400);
  }
  await db('expenses')
    .where('id', expenseId)
    .update({
      deleted_at: db.fn.now(),
      updated_at: db.fn.now()
    });
  return true;
};
const approveExpense = async (expenseId, approved, rejectionReason, userId) => {
  const expense = await db('expenses as e')
    .leftJoin('expense_categories as ec', 'e.category_id', 'ec.id')
    .select('e.*', 'ec.name as category_name')
    .where('e.id', expenseId)
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
      .where('id', expenseId)
      .update({
        approved_by: userId,
        rejection_reason: rejectionReason,
        updated_at: db.fn.now()
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
    }).catch(() => {});
    return { approved: false };
  }
  await db('expenses')
    .where('id', expenseId)
    .update({
      approved_by: userId,
      approved_at: db.fn.now(),
      updated_at: db.fn.now()
    });
  const creator = await db('users').where('id', expense.entered_by).first();
  const approver = await db('users').where('id', userId).first();
  await sendEmail({
    to: creator.email,
    subject: `Expense Approved: ${expense.category_name} - ${expense.amount} ETB`,
    template: 'expense-approved',
    data: {
      name: creator.full_name,
      category: expense.category_name,
      amount: expense.amount,
      description: expense.description,
      approvedBy: approver?.full_name || 'Unknown',
      approvedAt: new Date().toISOString()
    }
  }).catch(() => {});
  return { approved: true };
};
const processPOMobilePayment = async (poId, amount, paymentMethodId, referenceNumber, notes, userId) => {
  const purchaseOrder = await db('purchase_orders')
    .where('id', poId)
    .whereNull('deleted_at')
    .first();
  if (!purchaseOrder) {
    throw new AppError('Purchase order not found', 404);
  }
  const remainingAmount = purchaseOrder.total_amount - purchaseOrder.paid_amount;
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
  return {
    poId,
    poNumber: purchaseOrder.po_number,
    amountPaid: amount,
    remainingBalance: purchaseOrder.total_amount - (purchaseOrder.paid_amount + amount)
  };
};
const processInvoicePayment = async (saleId, amount, paymentMethodId, referenceNumber, notes, userId) => {
  const sale = await db('pos_sales')
    .leftJoin('customers', 'pos_sales.customer_id', 'customers.id')
    .select('pos_sales.*', 'customers.name as customer_name', 'customers.current_balance')
    .where('pos_sales.id', saleId)
    .whereNull('pos_sales.deleted_at')
    .first();
  if (!sale) {
    throw new AppError('Sale not found', 404);
  }
  if (sale.payment_method !== 'Credit') {
    throw new AppError('This sale is not a credit sale', 400);
  }
  if (amount > sale.current_balance) {
    throw new AppError(`Amount exceeds current balance. Balance: ${sale.current_balance} ETB`, 400);
  }
  const completedStatus = await db('payment_statuses').where('status_code', 'completed').first();
  let newBalance;
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
    newBalance = sale.current_balance - amount;
    await trx('customers')
      .where('id', sale.customer_id)
      .update({
        current_balance: newBalance,
        updated_at: db.fn.now()
      });
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
      }).catch(() => {});
    }
  }
  return {
    saleId,
    invoiceNumber: sale.invoice_number,
    amountPaid: amount,
    remainingBalance: newBalance
  };
};
const getPayments = async (filters) => {
  const { page = 1, limit = 25, referenceType, startDate, endDate } = filters;
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
  return {
    payments: paginatedPayments,
    summary: {
      totalAmount,
      poTotal,
      invoiceTotal,
      totalCount: total
    },
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};
const getPaymentById = async (paymentId) => {
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
    .where('pp.id', paymentId)
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
      .where('ip.id', paymentId)
      .first();
  }
  if (!payment) {
    throw new AppError('Payment not found', 404);
  }
  return payment;
};
const processRefund = async (paymentId, amount, reason, userId) => {
  const payment = await getPaymentById(paymentId);
  const refundedStatus = await db('payment_statuses').where('status_code', 'refunded').first();
  if (payment.payment_type === 'PO') {
    await db('po_payments')
      .where('id', paymentId)
      .update({
        status_id: refundedStatus.id,
        notes: db.raw(`CONCAT(notes, '; Refund: ${amount} ETB, Reason: ${reason}')`),
        updated_at: db.fn.now()
      });
  } else {
    await db('invoice_payments')
      .where('id', paymentId)
      .update({
        status_id: refundedStatus.id,
        notes: db.raw(`CONCAT(notes, '; Refund: ${amount} ETB, Reason: ${reason}')`),
        updated_at: db.fn.now()
      });
  }
  return true;
};
const getAccountsReceivable = async (asOfDate = new Date().toISOString().split('T')[0]) => {
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
      .where('status', 'Completed')
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
    const remainingBalance = customer.current_balance;
    const oldestInvoice = invoices[0];
    const daysOverdue = oldestInvoice 
      ? Math.floor((new Date(asOfDate) - new Date(oldestInvoice.sale_date)) / (1000 * 60 * 60 * 24))
      : 0;
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
  return {
    asOfDate,
    aging,
    summary: {
      totalReceivable: totalCurrent + total30Days + total60Days + total90Days + totalOver90Days,
      current: totalCurrent,
      days30_60: total30Days,
      days60_90: total60Days,
      daysOver90: totalOver90Days
    }
  };
};
const getAccountsPayable = async (asOfDate = new Date().toISOString().split('T')[0]) => {
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
    const daysOutstanding = oldestPO 
      ? Math.floor((new Date(asOfDate) - new Date(oldestPO.created_at)) / (1000 * 60 * 60 * 24))
      : 0;
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
  return {
    asOfDate,
    aging,
    summary: {
      totalPayable: totalCurrent + total30Days + total60Days + total90Days + totalOver90Days,
      current: totalCurrent,
      days30_60: total30Days,
      days60_90: total60Days,
      daysOver90: totalOver90Days
    }
  };
};
const getExpenseCategories = async () => {
  const categories = await db('expense_categories')
    .select('id', 'name', 'requires_approval', 'approval_limit')
    .orderBy('name');
  return categories;
};
const getPaymentMethods = async () => {
  const methods = await db('payment_methods')
    .select('id', 'name', 'requires_reference', 'is_active')
    .where('is_active', true)
    .orderBy('name');
  return methods;
};
const getFinanceStatistics = async () => {
  const startOfMonth = db.raw('DATE_FORMAT(NOW(), "%Y-%m-01")');
  const startOfYear = db.raw('DATE_FORMAT(NOW(), "%Y-01-01")');
  const monthlyExpenses = await db('expenses')
    .where('created_at', '>=', startOfMonth)
    .whereNull('deleted_at')
    .sum('amount as total')
    .first();
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
  return {
    monthlyExpenses: parseFloat(monthlyExpenses.total || 0),
    yearlyExpensesByCategory,
    pendingApprovals: parseInt(pendingApprovals.count),
    pendingApprovalAmount: parseFloat(pendingAmount.total || 0),
    totalAccountsReceivable: parseFloat(totalReceivable.total || 0)
  };
};
const notifyExpenseApprovers = async (expenseId, expenseDetails, requesterId) => {
  const approvers = await db('users')
    .leftJoin('user_roles', 'users.id', 'user_roles.user_id')
    .leftJoin('roles', 'user_roles.role_id', 'roles.id')
    .where('roles.name', 'Finance')
    .select('users.email', 'users.full_name');
  const requester = await db('users').where('id', requesterId).first();
  for (const approver of approvers) {
    await sendEmail({
      to: approver.email,
      subject: `Expense Approval Required: ${expenseDetails.category.name} - ${expenseDetails.amount} ETB`,
      template: 'expense-approval-request',
      data: {
        approverName: approver.full_name,
        category: expenseDetails.category.name,
        amount: expenseDetails.amount,
        description: expenseDetails.description,
        requesterName: requester?.full_name || 'Unknown',
        expenseId,
        approvalUrl: `${config.frontendUrl}/finance/expenses/${expenseId}/approve`
      }
    }).catch(() => {});
  }
};
module.exports = {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  approveExpense,
  processPOMobilePayment,
  processInvoicePayment,
  getPayments,
  getPaymentById,
  processRefund,
  getAccountsReceivable,
  getAccountsPayable,
  getExpenseCategories,
  getPaymentMethods,
  getFinanceStatistics
};
