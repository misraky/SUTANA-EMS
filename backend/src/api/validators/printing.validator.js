const { body, query, param } = require('express-validator');
const createOrderValidation = [
  body('customerId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Customer ID must be a valid positive integer')
    .toInt(),
  body('customer')
    .optional()
    .isObject()
    .withMessage('Customer must be an object'),
  body('customer.name')
    .if(body('customerId').not().exists())
    .notEmpty()
    .withMessage('Customer name is required when creating new customer')
    .isLength({ min: 2, max: 100 })
    .withMessage('Customer name must be between 2 and 100 characters')
    .trim()
    .escape(),
  body('customer.phone')
    .if(body('customerId').not().exists())
    .notEmpty()
    .withMessage('Customer phone is required when creating new customer')
    .matches(/^09[0-9]{8}$/)
    .withMessage('Phone number must be Ethiopian format (09xxxxxxxx)')
    .trim(),
  body('customer.email')
    .if(body('customerId').not().exists())
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .trim()
    .toLowerCase(),
  body('customer.customerTypeId')
    .if(body('customerId').not().exists())
    .notEmpty()
    .withMessage('Customer type ID is required when creating new customer')
    .isInt({ min: 1 })
    .withMessage('Customer type ID must be a valid integer')
    .toInt(),
  body('productType')
    .notEmpty()
    .withMessage('Product type is required')
    .isIn(['Book', 'Module', 'Exam', 'Brochure', 'TaxReceipt'])
    .withMessage('Product type must be Book, Module, Exam, Brochure, or TaxReceipt'),
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1, max: 100000 })
    .withMessage('Quantity must be between 1 and 100,000')
    .toInt(),
  body('paperType')
    .notEmpty()
    .withMessage('Paper type is required')
    .isIn(['A3', 'A4', 'A5'])
    .withMessage('Paper type must be A3, A4, or A5'),
  body('pagesPerCopy')
    .notEmpty()
    .withMessage('Pages per copy is required')
    .isInt({ min: 1, max: 10000 })
    .withMessage('Pages per copy must be between 1 and 10,000')
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
const updateOrderStatusValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Order ID must be a valid positive integer')
    .toInt(),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['Received', 'In Progress', 'Quality Check', 'Ready', 'Delivered'])
    .withMessage('Invalid status value'),
  body('reason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters')
    .trim()
    .escape()
];
const listOrdersValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  query('status')
    .optional()
    .isIn(['Received', 'In Progress', 'Quality Check', 'Ready', 'Delivered'])
    .withMessage('Invalid status value'),
  query('search')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Search query must be at least 1 character'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format. Use YYYY-MM-DD'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format. Use YYYY-MM-DD')
    .custom((endDate, { req }) => {
      if (req.query.startDate && endDate) {
        const start = new Date(req.query.startDate);
        const end = new Date(endDate);
        if (end < start) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    })
];
const getOrderByIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Order ID must be a valid positive integer')
    .toInt()
];
const getOrderHistoryValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Order ID must be a valid positive integer')
    .toInt()
];
const uploadAttachmentsValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Order ID must be a valid positive integer')
    .toInt()
];
const deleteAttachmentValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Order ID must be a valid positive integer')
    .toInt(),
  param('attachmentId')
    .isString()
    .notEmpty()
    .withMessage('Attachment ID is required')
];
const printTaxReceiptValidation = [
  param('orderId')
    .isInt({ min: 1 })
    .withMessage('Order ID must be a valid positive integer')
    .toInt(),
  body('approvalAmountTotal')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Approval amount must be a positive integer'),
  body('approvedDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format. Use YYYY-MM-DD'),
  body('approvalDocument')
    .optional()
    .isString()
    .trim()
];
const getRemainingTaxAllowanceValidation = [
  param('orderId')
    .isInt({ min: 1 })
    .withMessage('Order ID must be a valid positive integer')
    .toInt()
];
const listTaxReceiptsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt(),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format')
];
const calculatePriceValidation = [
  query('paperType')
    .notEmpty()
    .withMessage('Paper type is required')
    .isIn(['A3', 'A4', 'A5'])
    .withMessage('Paper type must be A3, A4, or A5'),
  query('pagesPerCopy')
    .notEmpty()
    .withMessage('Pages per copy is required')
    .isInt({ min: 1 })
    .withMessage('Pages per copy must be a positive integer')
    .toInt(),
  query('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer')
    .toInt(),
  query('colorPrinting')
    .optional()
    .isBoolean()
    .withMessage('Color printing must be true or false')
    .toBoolean(),
  query('bindingType')
    .optional()
    .isIn(['None', 'Spiral', 'Thermal'])
    .withMessage('Binding type must be None, Spiral, or Thermal')
];
module.exports = {
  createOrderValidation,
  updateOrderStatusValidation,
  listOrdersValidation,
  getOrderByIdValidation,
  getOrderHistoryValidation,
  uploadAttachmentsValidation,
  deleteAttachmentValidation,
  printTaxReceiptValidation,
  getRemainingTaxAllowanceValidation,
  listTaxReceiptsValidation,
  calculatePriceValidation
};
