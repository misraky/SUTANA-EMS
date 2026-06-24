const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { catchAsync } = require('../../utils/catchAsync');
const FinanceController = require('../controllers/finance.controller');
const BudgetController = require('../controllers/budget.controller');
const PettyCashController = require('../controllers/petty-cash.controller');
const COAController = require('../controllers/coa.controller');
const ApprovalController = require('../controllers/approval.controller');
const CloseProcessController = require('../controllers/close-process.controller');
const ReportSubmissionController = require('../controllers/reportSubmission.controller');
const TaxService = require('../../services/tax.service');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { uploads, handleUploadError } = require('../../config/multer');
const { limiters } = require('../../config/rateLimit');

// ---- Validation rules ----
const expenseIdParam = [param('id').isInt().withMessage('Expense ID must be an integer').toInt()];
const listValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('categoryId').optional().isInt(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('status').optional().isIn(['pending', 'approved', 'rejected', 'unpaid'])
];
const createExpenseValidation = [
  body('categoryId').notEmpty().isInt(),
  body('amount').notEmpty().isFloat({ min: 0.01 }),
  body('date').notEmpty().isISO8601(),
  body('description').notEmpty().isLength({ min: 5, max: 500 }),
  body('paymentMethodId').notEmpty().isInt(),
  body('referenceNumber').optional().isString().isLength({ max: 100 }),
  body('currency').optional().isString().isLength({ max: 3 }),
  body('exchangeRate').optional().isFloat(),
  body('coaId').optional().isInt(),
  body('poId').optional().isInt(),
  body('expenseType').optional().isIn(['goods', 'services', 'transport', 'commission', 'rent', 'consultancy', 'construction', 'other']),
  body('isVatRegistered').optional().isBoolean()
];
const approveValidation = [
  body('approved').isBoolean(),
  body('comments').optional().isString().isLength({ max: 500 })
];
const paymentValidation = [
  body('paymentMethodId').notEmpty().isInt(),
  body('referenceNumber').optional().isString(),
  body('notes').optional().isString()
];

// ================================================================
// ENHANCED EXPENSE ENDPOINTS
// ================================================================
router.get('/expenses/enhanced', authenticate, authorize(['expenses:read']), listValidation, validate, FinanceController.getEnhancedExpenses);
router.get('/expenses/enhanced/:id', authenticate, authorize(['expenses:read']), expenseIdParam, validate, FinanceController.getEnhancedExpenseById);
router.post('/expenses/enhanced', authenticate, authorize(['expenses:create']), createExpenseValidation, validate, FinanceController.createEnhancedExpense);
router.get('/expenses/:id/audit', authenticate, authorize(['expenses:read']), expenseIdParam, validate, FinanceController.getAuditTrail);
router.post('/expenses/:id/payment', authenticate, authorize(['payments:create']), expenseIdParam, paymentValidation, validate, FinanceController.processPayment);
router.get('/expenses/summary/tier', authenticate, authorize(['reports:read']), FinanceController.getExpenseSummaryByTier);
router.get('/statistics/enhanced', authenticate, authorize(['reports:read']), FinanceController.getExpenseStatistics);

// ================================================================
// EXISTING EXPENSE ENDPOINTS (backward compatible)
// ================================================================
const createExpenseValidationLegacy = [
  body('categoryId').notEmpty().isInt(),
  body('amount').notEmpty().isFloat({ min: 0.01 }),
  body('date').notEmpty().isISO8601(),
  body('description').notEmpty().isLength({ min: 5, max: 500 }),
  body('paymentMethodId').notEmpty().isInt(),
  body('referenceNumber').optional().isString().isLength({ max: 100 })
];
const updateExpenseValidation = [
  body('categoryId').optional().isInt(),
  body('amount').optional().isFloat({ min: 0.01 }),
  body('date').optional().isISO8601(),
  body('description').optional().isLength({ min: 5, max: 500 }),
  body('paymentMethodId').optional().isInt(),
  body('referenceNumber').optional().isString()
];
const approveExpenseValidation = [
  body('approved').isBoolean().withMessage('Approved must be true or false'),
  body('rejectionReason').if(body('approved').equals('false')).notEmpty().isString().isLength({ min: 10, max: 500 })
];
const listPaymentsValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('referenceType').optional().isIn(['PO', 'Invoice', 'Credit']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
];
const processPOValidation = [
  body('poId').notEmpty().isInt(),
  body('amount').notEmpty().isFloat({ min: 0.01 }),
  body('paymentMethodId').notEmpty().isInt(),
  body('referenceNumber').optional().isString(),
  body('notes').optional().isString().isLength({ max: 500 })
];
const processInvoiceValidation = [
  body('saleId').notEmpty().isInt(),
  body('amount').notEmpty().isFloat({ min: 0.01 }),
  body('paymentMethodId').notEmpty().isInt(),
  body('referenceNumber').optional().isString(),
  body('notes').optional().isString().isLength({ max: 500 })
];

router.get('/expenses', authenticate, authorize(['expenses:read']), listValidation, validate, FinanceController.getExpenses);
router.get('/expenses/:id', authenticate, authorize(['expenses:read']), expenseIdParam, validate, FinanceController.getExpenseById);
router.post('/expenses', authenticate, authorize(['expenses:create']), createExpenseValidationLegacy, validate, limiters.checkout, FinanceController.createExpense);
router.put('/expenses/:id', authenticate, authorize(['expenses:update']), expenseIdParam, updateExpenseValidation, validate, FinanceController.updateExpense);
router.delete('/expenses/:id', authenticate, authorize(['expenses:delete']), expenseIdParam, validate, FinanceController.deleteExpense);
router.post('/expenses/:id/approve', authenticate, authorize(['expenses:approve']), expenseIdParam, approveExpenseValidation, validate, FinanceController.approveExpense);
router.post('/expenses/:id/receipt', authenticate, authorize(['expenses:update']), expenseIdParam, uploads.singleExpenseReceipt.single('receipt'), handleUploadError, FinanceController.uploadReceipt);
router.get('/expense-categories', authenticate, FinanceController.getExpenseCategories);
router.get('/payment-methods', authenticate, FinanceController.getPaymentMethods);
router.get('/statistics', authenticate, authorize(['reports:read']), FinanceController.getFinanceStatistics);

// ================================================================
// PAYMENTS
// ================================================================
router.get('/payments/unpaid-invoices', authenticate, authorize(['payments:read']), query('search').optional().isString(), validate, FinanceController.getUnpaidInvoices);
router.get('/payments/unpaid-pos', authenticate, authorize(['payments:read']), query('search').optional().isString(), validate, FinanceController.getUnpaidPOs);
router.get('/payments', authenticate, authorize(['payments:read']), listPaymentsValidation, validate, FinanceController.getPayments);
router.get('/payments/:id', authenticate, authorize(['payments:read']), expenseIdParam, validate, FinanceController.getPaymentById);
router.post('/payments/po', authenticate, authorize(['payments:create']), processPOValidation, validate, FinanceController.processPOMobilePayments);
router.post('/payments/invoice', authenticate, authorize(['payments:create']), processInvoiceValidation, validate, FinanceController.processInvoicePayment);
router.post('/payments/:id/refund', authenticate, authorize(['payments:refund']), expenseIdParam,
  body('amount').isFloat({ min: 0.01 }), body('reason').isString().isLength({ min: 10, max: 500 }), validate, FinanceController.processRefund);
router.post('/bank-transactions', authenticate, authorize(['payments:create']),
  body('bankCode').notEmpty().isIn(['CBE', 'DASHEN', 'AWASH', 'TELEBIRR']),
  body('amount').notEmpty().isFloat({ min: 0.01 }),
  body('reference').optional().isString().isLength({ max: 50 }),
  body('transactionDate').optional().isISO8601(),
  body('description').optional().isString().isLength({ max: 500 }),
  body('customerName').optional().isString().isLength({ max: 255 }),
  body('customerPhone').optional().isString().isLength({ max: 20 }),
  validate, FinanceController.createBankTransaction);
router.get('/accounts-receivable', authenticate, authorize(['reports:read']), query('asOfDate').optional().isISO8601(), validate, FinanceController.getAccountsReceivable);
router.get('/accounts-payable', authenticate, authorize(['reports:read']), query('asOfDate').optional().isISO8601(), validate, FinanceController.getAccountsPayable);

// ================================================================
// APPROVAL WORKFLOW
// ================================================================
router.get('/approvals/dashboard', authenticate, authorize(['approvals:read']), ApprovalController.getDashboard);
router.get('/approvals/expense/:expenseId', authenticate, authorize(['approvals:read']), param('expenseId').isInt().toInt(), validate, ApprovalController.getExpenseApprovalHistory);
router.post('/approvals/expense/:id/decide', authenticate, authorize(['approvals:approve']), expenseIdParam, approveValidation, validate, ApprovalController.processApproval);
router.get('/approvals/approvers', authenticate, authorize(['admin:users']), ApprovalController.getApprovers);
router.post('/approvals/approvers', authenticate, authorize(['admin:users']),
  body('userId').notEmpty().isInt(), body('approvalTier').notEmpty().isIn(['manager', 'director', 'ceo']),
  body('minAmount').optional().isFloat(), body('maxAmount').optional().isFloat(), body('priority').optional().isInt(), validate, ApprovalController.setApprover);

// ================================================================
// BUDGET
// ================================================================
router.get('/budgets', authenticate, authorize(['budgets:read']), BudgetController.getBudgets);
router.get('/budgets/:id', authenticate, authorize(['budgets:read']), expenseIdParam, validate, BudgetController.getBudgetById);
router.post('/budgets', authenticate, authorize(['budgets:create']),
  body('name').notEmpty().isString(), body('periodType').notEmpty().isIn(['monthly', 'quarterly', 'yearly', 'custom']),
  body('startDate').notEmpty().isISO8601(), body('endDate').notEmpty().isISO8601(), validate, BudgetController.createBudget);
router.put('/budgets/:id', authenticate, authorize(['budgets:update']), expenseIdParam, validate, BudgetController.updateBudget);
router.post('/budgets/:id/approve', authenticate, authorize(['budgets:approve']), expenseIdParam, validate, BudgetController.approveBudget);
router.post('/budgets/:budgetId/items', authenticate, authorize(['budgets:update']),
  body('allocatedAmount').notEmpty().isFloat({ min: 0.01 }), validate, BudgetController.addBudgetItem);
router.get('/budgets/:budgetId/utilization', authenticate, authorize(['budgets:read']), BudgetController.getUtilizationReport);

// ================================================================
// PETTY CASH
// ================================================================
router.get('/petty-cash/summary', authenticate, authorize(['petty_cash:read']), PettyCashController.getSummary);
router.get('/petty-cash/funds', authenticate, authorize(['petty_cash:read']), PettyCashController.getFunds);
router.get('/petty-cash/funds/:id', authenticate, authorize(['petty_cash:read']), expenseIdParam, validate, PettyCashController.getFundById);
router.post('/petty-cash/funds', authenticate, authorize(['petty_cash:create']),
  body('fundName').notEmpty().isString(), body('imprestAmount').notEmpty().isFloat({ min: 0.01 }),
  body('custodianId').notEmpty().isInt(), validate, PettyCashController.createFund);
router.get('/petty-cash/funds/:fundId/transactions', authenticate, authorize(['petty_cash:read']), PettyCashController.getTransactions);
router.post('/petty-cash/funds/:fundId/disburse', authenticate, authorize(['petty_cash:update']),
  body('amount').notEmpty().isFloat({ min: 0.01 }), body('description').notEmpty().isString(), validate, PettyCashController.disburse);
router.post('/petty-cash/funds/:fundId/replenish', authenticate, authorize(['petty_cash:update']),
  body('amount').notEmpty().isFloat({ min: 0.01 }), validate, PettyCashController.replenish);
router.post('/petty-cash/funds/:fundId/reconcile', authenticate, authorize(['petty_cash:update']),
  body('actualBalance').notEmpty().isFloat(), validate, PettyCashController.reconcile);

// ================================================================
// CHART OF ACCOUNTS
// ================================================================
router.get('/coa', authenticate, authorize(['coa:read']), COAController.getAccounts);
router.get('/coa/tree', authenticate, authorize(['coa:read']), COAController.getAccountTree);
router.post('/coa', authenticate, authorize(['coa:create']),
  body('accountCode').notEmpty().isString(), body('accountName').notEmpty().isString(),
  body('accountType').notEmpty().isIn(['asset', 'liability', 'equity', 'revenue', 'expense']), validate, COAController.createAccount);
router.put('/coa/:id', authenticate, authorize(['coa:update']), expenseIdParam, validate, COAController.updateAccount);

// ================================================================
// MONTH-END CLOSE
// ================================================================
router.get('/close/current', authenticate, authorize(['close:read']), CloseProcessController.getCurrentPeriod);
router.get('/close/history', authenticate, authorize(['close:read']), CloseProcessController.getPeriodHistory);
router.get('/close/:period/readiness', authenticate, authorize(['close:read']), CloseProcessController.getReadiness);
router.post('/close/:period/execute', authenticate, authorize(['close:execute']),
  body('notes').optional().isString(), validate, CloseProcessController.executeClose);
router.post('/close/:period/reopen', authenticate, authorize(['close:execute']),
  body('reason').notEmpty().isString(), validate, CloseProcessController.reopenPeriod);

// ================================================================
// REPORT SUBMISSIONS (Finance → CEO → Board)
// ================================================================
router.get('/report-submissions', authenticate, authorize(['reports:read']), ReportSubmissionController.getMySubmissions);
router.get('/report-submissions/:id', authenticate, authorize(['reports:read']), ReportSubmissionController.getSubmissionById);
router.post('/report-submissions', authenticate, authorize(['reports:read']),
  body('reportType').notEmpty().isIn(['income_statement', 'balance_sheet', 'bank_reconciliation']),
  body('period').notEmpty().matches(/^\d{4}-\d{2}$/),
  body('financialYear').optional().isString(),
  body('title').optional().isString(),
  body('notes').optional().isString(),
  validate, ReportSubmissionController.createDraft
);
router.put('/report-submissions/:id', authenticate, authorize(['reports:read']), ReportSubmissionController.updateDraft);
router.post('/report-submissions/:id/submit', authenticate, authorize(['reports:read']), ReportSubmissionController.submitForApproval);

// ================================================================
// TAX
// ================================================================
router.get('/tax/registrations', authenticate, authorize(['tax:read']), catchAsync(async (req, res) => {
  const registrations = await TaxService.getTaxRegistrations();
  res.json({ status: 'success', data: { registrations } });
}));
router.post('/tax/declare/:expenseId', authenticate, authorize(['tax:declare']), expenseIdParam, validate, catchAsync(async (req, res) => {
  const declaration = await TaxService.generateERCADeclaration(req.params.expenseId);
  res.json({ status: 'success', data: declaration });
}));

module.exports = router;
