const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const FinanceController = require('../controllers/finance.controller');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { uploads, handleUploadError } = require('../../config/multer');
const { limiters } = require('../../config/rateLimit');
const createExpenseValidation = [
  body('categoryId')
    .notEmpty().withMessage('Expense category ID is required')
    .isInt(),
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('date')
    .notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Invalid date format'),
  body('description')
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 5, max: 500 }).withMessage('Description must be between 5 and 500 characters'),
  body('paymentMethodId')
    .notEmpty().withMessage('Payment method ID is required')
    .isInt(),
  body('referenceNumber')
    .optional()
    .isString()
    .isLength({ max: 100 }),
  body('receiptPath')
    .optional()
    .isString()
];
const updateExpenseValidation = [
  body('categoryId')
    .optional()
    .isInt(),
  body('amount')
    .optional()
    .isFloat({ min: 0.01 }),
  body('date')
    .optional()
    .isISO8601(),
  body('description')
    .optional()
    .isLength({ min: 5, max: 500 }),
  body('paymentMethodId')
    .optional()
    .isInt(),
  body('referenceNumber')
    .optional()
    .isString()
];
const approveExpenseValidation = [
  body('approved')
    .isBoolean().withMessage('Approved must be true or false'),
  body('rejectionReason')
    .if(body('approved').equals('false'))
    .notEmpty().withMessage('Rejection reason is required when rejecting')
    .isString()
    .isLength({ min: 10, max: 500 })
];
const processPOValidation = [
  body('poId')
    .notEmpty().withMessage('Purchase order ID is required')
    .isInt(),
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 0.01 }),
  body('paymentMethodId')
    .notEmpty().withMessage('Payment method ID is required')
    .isInt(),
  body('referenceNumber')
    .optional()
    .isString(),
  body('notes')
    .optional()
    .isString()
    .isLength({ max: 500 })
];
const processInvoiceValidation = [
  body('saleId')
    .notEmpty().withMessage('Sale ID is required')
    .isInt(),
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 0.01 }),
  body('paymentMethodId')
    .notEmpty().withMessage('Payment method ID is required')
    .isInt(),
  body('referenceNumber')
    .optional()
    .isString(),
  body('notes')
    .optional()
    .isString()
    .isLength({ max: 500 })
];
const expenseIdParamValidation = [
  param('id')
    .isInt().withMessage('Expense ID must be a valid integer')
    .toInt()
];
const paymentIdParamValidation = [
  param('id')
    .isInt().withMessage('Payment ID must be a valid integer')
    .toInt()
];
const listExpensesValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).toInt(),
  query('categoryId')
    .optional()
    .isInt(),
  query('startDate')
    .optional()
    .isISO8601(),
  query('endDate')
    .optional()
    .isISO8601(),
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected'])
];
const listPaymentsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).toInt(),
  query('referenceType')
    .optional()
    .isIn(['PO', 'Invoice', 'Credit']),
  query('startDate')
    .optional()
    .isISO8601(),
  query('endDate')
    .optional()
    .isISO8601()
];
router.get(
  '/expenses',
  authenticate,
  authorize(['expenses:read']),
  listExpensesValidation,
  validate,
  FinanceController.getExpenses
);
router.get(
  '/expenses/:id',
  authenticate,
  authorize(['expenses:read']),
  expenseIdParamValidation,
  validate,
  FinanceController.getExpenseById
);
router.post(
  '/expenses',
  authenticate,
  authorize(['expenses:create']),
  createExpenseValidation,
  validate,
  limiters.checkout,
  FinanceController.createExpense
);
router.put(
  '/expenses/:id',
  authenticate,
  authorize(['expenses:update']),
  expenseIdParamValidation,
  updateExpenseValidation,
  validate,
  FinanceController.updateExpense
);
router.delete(
  '/expenses/:id',
  authenticate,
  authorize(['expenses:delete']),
  expenseIdParamValidation,
  validate,
  FinanceController.deleteExpense
);
router.post(
  '/expenses/:id/approve',
  authenticate,
  authorize(['expenses:approve']),
  expenseIdParamValidation,
  approveExpenseValidation,
  validate,
  FinanceController.approveExpense
);
router.post(
  '/expenses/:id/receipt',
  authenticate,
  authorize(['expenses:update']),
  expenseIdParamValidation,
  uploads.singleExpenseReceipt.single('receipt'),
  handleUploadError,
  FinanceController.uploadReceipt
);
router.get(
  '/payments',
  authenticate,
  authorize(['payments:read']),
  listPaymentsValidation,
  validate,
  FinanceController.getPayments
);
router.get(
  '/payments/:id',
  authenticate,
  authorize(['payments:read']),
  paymentIdParamValidation,
  validate,
  FinanceController.getPaymentById
);
router.post(
  '/payments/po',
  authenticate,
  authorize(['payments:create']),
  processPOValidation,
  validate,
  FinanceController.processPOMobilePayments
);
router.post(
  '/payments/invoice',
  authenticate,
  authorize(['payments:create']),
  processInvoiceValidation,
  validate,
  FinanceController.processInvoicePayment
);
router.post(
  '/payments/:id/refund',
  authenticate,
  authorize(['payments:refund']),
  paymentIdParamValidation,
  body('amount').isFloat({ min: 0.01 }),
  body('reason').isString().isLength({ min: 10, max: 500 }),
  validate,
  FinanceController.processRefund
);
router.get(
  '/accounts-receivable',
  authenticate,
  authorize(['reports:read']),
  query('asOfDate').optional().isISO8601(),
  validate,
  FinanceController.getAccountsReceivable
);
router.get(
  '/accounts-payable',
  authenticate,
  authorize(['reports:read']),
  query('asOfDate').optional().isISO8601(),
  validate,
  FinanceController.getAccountsPayable
);
router.get(
  '/expense-categories',
  authenticate,
  FinanceController.getExpenseCategories
);
router.get(
  '/payment-methods',
  authenticate,
  FinanceController.getPaymentMethods
);
router.get(
  '/statistics',
  authenticate,
  authorize(['reports:read']),
  FinanceController.getFinanceStatistics
);
module.exports = router;
