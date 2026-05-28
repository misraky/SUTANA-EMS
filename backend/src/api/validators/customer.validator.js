const { body, query, param } = require('express-validator');
const updateProfileValidation = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .trim()
    .escape(),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .trim()
    .toLowerCase(),
  body('phone')
    .optional()
    .matches(/^09[0-9]{8}$/)
    .withMessage('Phone number must be Ethiopian format (09xxxxxxxx)')
    .trim(),
  body('address')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters')
];
const customerChangePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('New password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('New password must contain at least one number')
    .matches(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/)
    .withMessage('New password must contain at least one special character')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password cannot be the same as current password');
      }
      return true;
    })
];
const listCustomerOrdersValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
    .toInt(),
  query('status')
    .optional()
    .isIn(['Received', 'In Progress', 'Quality Check', 'Ready', 'Delivered'])
    .withMessage('Invalid status')
];
const getCustomerOrderByIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Order ID must be a valid positive integer')
    .toInt()
];
const createCustomerOrderValidation = [
  body('productType')
    .notEmpty()
    .withMessage('Product type is required')
    .isIn(['Book', 'Module', 'Exam', 'Brochure'])
    .withMessage('Product type must be Book, Module, Exam, or Brochure'),
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1, max: 10000 })
    .withMessage('Quantity must be between 1 and 10,000')
    .toInt(),
  body('paperType')
    .notEmpty()
    .withMessage('Paper type is required')
    .isIn(['A3', 'A4', 'A5'])
    .withMessage('Paper type must be A3, A4, or A5'),
  body('pagesPerCopy')
    .notEmpty()
    .withMessage('Pages per copy is required')
    .isInt({ min: 1, max: 5000 })
    .withMessage('Pages per copy must be between 1 and 5,000')
    .toInt(),
  body('colorPrinting')
    .optional()
    .isBoolean()
    .withMessage('Color printing must be true or false')
    .toBoolean(),
  body('bindingType')
    .optional()
    .isIn(['None', 'Spiral', 'Thermal'])
    .withMessage('Binding type must be None, Spiral, or Thermal'),
  body('dueDate')
    .notEmpty()
    .withMessage('Due date is required')
    .isISO8601()
    .withMessage('Invalid date format. Use YYYY-MM-DD')
    .custom((value) => {
      const dueDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dueDate < today) {
        throw new Error('Due date cannot be in the past');
      }
      return true;
    }),
  body('specialInstructions')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Special instructions cannot exceed 500 characters')
    .trim()
    .escape()
];
const trackOrderValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Order ID must be a valid positive integer')
    .toInt()
];
const cancelOrderValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Order ID must be a valid positive integer')
    .toInt(),
  body('reason')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Reason cannot exceed 200 characters')
];
const requestQuoteValidation = [
  body('productType')
    .notEmpty()
    .withMessage('Product type is required')
    .isIn(['Book', 'Module', 'Exam', 'Brochure'])
    .withMessage('Product type must be Book, Module, Exam, or Brochure'),
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1')
    .toInt(),
  body('paperType')
    .notEmpty()
    .withMessage('Paper type is required')
    .isIn(['A3', 'A4', 'A5'])
    .withMessage('Paper type must be A3, A4, or A5'),
  body('pagesPerCopy')
    .notEmpty()
    .withMessage('Pages per copy is required')
    .isInt({ min: 1 })
    .withMessage('Pages per copy must be at least 1')
    .toInt(),
  body('colorPrinting')
    .optional()
    .isBoolean()
    .toBoolean(),
  body('bindingType')
    .optional()
    .isIn(['None', 'Spiral', 'Thermal'])
];
const getQuotesValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .toInt()
];
const acceptQuoteValidation = [
  param('quoteId')
    .notEmpty()
    .withMessage('Quote ID is required')
    .isString()
    .trim()
];
const getReceiptsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .toInt()
];
const downloadReceiptValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Receipt ID must be a valid positive integer')
    .toInt()
];
const getInvoicesValidation = [
  query('status')
    .optional()
    .isIn(['pending', 'paid', 'overdue'])
    .withMessage('Status must be pending, paid, or overdue')
];
const getBalanceValidation = [
];
const makePaymentValidation = [
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 1 })
    .withMessage('Amount must be at least 1 ETB'),
  body('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['Cash', 'Bank Transfer', 'Telebirr'])
    .withMessage('Payment method must be Cash, Bank Transfer, or Telebirr'),
  body('referenceNumber')
    .if(body('paymentMethod').isIn(['Bank Transfer', 'Telebirr']))
    .notEmpty()
    .withMessage('Reference number is required for bank transfer and Telebirr')
    .isString()
    .trim()
];
const getNotificationsValidation = [
  query('unreadOnly')
    .optional()
    .isBoolean()
    .withMessage('unreadOnly must be true or false')
    .toBoolean()
];
const markNotificationReadValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Notification ID must be a valid positive integer')
    .toInt()
];
const createSupportTicketValidation = [
  body('subject')
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5 and 200 characters')
    .trim()
    .escape(),
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters')
    .trim()
    .escape()
];
const getSupportTicketsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .toInt()
];
module.exports = {
  updateProfileValidation,
  customerChangePasswordValidation,
  listCustomerOrdersValidation,
  getCustomerOrderByIdValidation,
  createCustomerOrderValidation,
  trackOrderValidation,
  cancelOrderValidation,
  requestQuoteValidation,
  getQuotesValidation,
  acceptQuoteValidation,
  getReceiptsValidation,
  downloadReceiptValidation,
  getInvoicesValidation,
  getBalanceValidation,
  makePaymentValidation,
  getNotificationsValidation,
  markNotificationReadValidation,
  createSupportTicketValidation,
  getSupportTicketsValidation
};
