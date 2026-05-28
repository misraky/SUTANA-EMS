const { body, query, param } = require('express-validator');
const createExpenseValidation = [
  body('categoryId')
    .notEmpty()
    .withMessage('Expense category ID is required')
    .isInt({ min: 1 })
    .withMessage('Category ID must be a valid integer')
    .toInt(),
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Invalid date format. Use YYYY-MM-DD')
    .custom((value) => {
      const expenseDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expenseDate > today) {
        throw new Error('Expense date cannot be in the future');
      }
      return true;
    }),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isString()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Description must be between 5 and 500 characters'),
  body('paymentMethodId')
    .notEmpty()
    .withMessage('Payment method ID is required')
    .isInt({ min: 1 })
    .withMessage('Payment method ID must be a valid integer')
    .toInt(),
  body('referenceNumber')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Reference number cannot exceed 100 characters')
];
const updateExpenseValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Expense ID must be a valid positive integer')
    .toInt(),
  body('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a valid integer')
    .toInt(),
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format. Use YYYY-MM-DD'),
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Description must be between 5 and 500 characters'),
  body('paymentMethodId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Payment method ID must be a valid integer')
    .toInt(),
  body('referenceNumber')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
];
const deleteExpenseValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Expense ID must be a valid positive integer')
    .toInt()
];
const approveExpenseValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Expense ID must be a valid positive integer')
    .toInt(),
  body('approved')
    .isBoolean()
    .withMessage('approved must be true or false')
    .toBoolean(),
  body('rejectionReason')
    .if(body('approved').equals('false'))
    .notEmpty()
    .withMessage('Rejection reason is required when rejecting')
    .isString()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Rejection reason must be between 10 and 500 characters')
];
const listExpensesValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt(),
  query('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a valid integer')
    .toInt(),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected', 'all'])
    .withMessage('Status must be pending, approved, rejected, or all')
];
const getExpenseByIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Expense ID must be a valid positive integer')
    .toInt()
];
const processPOMobilePaymentValidation = [
  body('poId')
    .notEmpty()
    .withMessage('Purchase order ID is required')
    .isInt({ min: 1 })
    .withMessage('Purchase order ID must be a valid integer')
    .toInt(),
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('paymentMethodId')
    .notEmpty()
    .withMessage('Payment method ID is required')
    .isInt({ min: 1 })
    .withMessage('Payment method ID must be a valid integer')
    .toInt(),
  body('referenceNumber')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 }),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
];
const processInvoicePaymentValidation = [
  body('saleId')
    .notEmpty()
    .withMessage('Sale ID is required')
    .isInt({ min: 1 })
    .withMessage('Sale ID must be a valid integer')
    .toInt(),
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('paymentMethodId')
    .notEmpty()
    .withMessage('Payment method ID is required')
    .isInt({ min: 1 })
    .withMessage('Payment method ID must be a valid integer')
    .toInt(),
  body('referenceNumber')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 }),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
];
const listPaymentsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt(),
  query('referenceType')
    .optional()
    .isIn(['PO', 'Invoice', 'Credit'])
    .withMessage('Reference type must be PO, Invoice, or Credit'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format')
];
const getPaymentByIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Payment ID must be a valid positive integer')
    .toInt()
];
const processRefundValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Payment ID must be a valid positive integer')
    .toInt(),
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('reason')
    .notEmpty()
    .withMessage('Refund reason is required')
    .isString()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters')
];
const getAccountsReceivableValidation = [
  query('asOfDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format. Use YYYY-MM-DD')
];
const getAccountsPayableValidation = [
  query('asOfDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format. Use YYYY-MM-DD')
];
const createExpenseCategoryValidation = [
  body('name')
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters')
    .trim()
    .escape(),
  body('requiresApproval')
    .optional()
    .isBoolean()
    .withMessage('requiresApproval must be true or false')
    .toBoolean(),
  body('approvalLimit')
    .if(body('requiresApproval').equals('true'))
    .notEmpty()
    .withMessage('Approval limit is required when approval is required')
    .isFloat({ min: 0 })
    .withMessage('Approval limit must be a positive number')
];
module.exports = {
  createExpenseValidation,
  updateExpenseValidation,
  deleteExpenseValidation,
  approveExpenseValidation,
  listExpensesValidation,
  getExpenseByIdValidation,
  processPOMobilePaymentValidation,
  processInvoicePaymentValidation,
  listPaymentsValidation,
  getPaymentByIdValidation,
  processRefundValidation,
  getAccountsReceivableValidation,
  getAccountsPayableValidation,
  createExpenseCategoryValidation
};
