const { body, query, param } = require('express-validator');
const createSupplierValidation = [
  body('name')
    .notEmpty()
    .withMessage('Supplier name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Supplier name must be between 2 and 200 characters')
    .trim()
    .escape(),
  body('contactPerson')
    .notEmpty()
    .withMessage('Contact person name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Contact person name must be between 2 and 100 characters')
    .trim()
    .escape(),
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^09[0-9]{8}$/)
    .withMessage('Phone number must be Ethiopian format (09xxxxxxxx)')
    .trim(),
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .trim()
    .toLowerCase(),
  body('address')
    .notEmpty()
    .withMessage('Address is required')
    .isString()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Address must be between 5 and 500 characters'),
  body('paymentTermsId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Payment terms ID must be a valid integer')
    .toInt(),
  body('leadTimeDays')
    .optional()
    .isInt({ min: 0, max: 90 })
    .withMessage('Lead time days must be between 0 and 90')
    .toInt(),
  body('taxId')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Tax ID cannot exceed 50 characters'),
  body('bankAccount')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Bank account cannot exceed 100 characters')
];
const updateSupplierValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Supplier ID must be a valid positive integer')
    .toInt(),
  body('name')
    .optional()
    .isLength({ min: 2, max: 200 })
    .withMessage('Supplier name must be between 2 and 200 characters')
    .trim()
    .escape(),
  body('contactPerson')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Contact person name must be between 2 and 100 characters')
    .trim()
    .escape(),
  body('phone')
    .optional()
    .matches(/^09[0-9]{8}$/)
    .withMessage('Phone number must be Ethiopian format (09xxxxxxxx)')
    .trim(),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .trim()
    .toLowerCase(),
  body('address')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Address must be between 5 and 500 characters'),
  body('paymentTermsId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Payment terms ID must be a valid integer')
    .toInt(),
  body('leadTimeDays')
    .optional()
    .isInt({ min: 0, max: 90 })
    .withMessage('Lead time days must be between 0 and 90')
    .toInt(),
  body('taxId')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 }),
  body('bankAccount')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 }),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be true or false')
    .toBoolean()
];
const deleteSupplierValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Supplier ID must be a valid positive integer')
    .toInt()
];
const restoreSupplierValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Supplier ID must be a valid positive integer')
    .toInt()
];
const listSuppliersValidation = [
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
  query('search')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Search query must be at least 1 character'),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be true or false')
    .toBoolean()
];
const createPurchaseOrderValidation = [
  body('supplierId')
    .notEmpty()
    .withMessage('Supplier ID is required')
    .isInt({ min: 1 })
    .withMessage('Supplier ID must be a valid integer')
    .toInt(),
  body('expectedDeliveryDate')
    .notEmpty()
    .withMessage('Expected delivery date is required')
    .isISO8601()
    .withMessage('Invalid date format. Use YYYY-MM-DD')
    .custom((value) => {
      const deliveryDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (deliveryDate < today) {
        throw new Error('Expected delivery date cannot be in the past');
      }
      return true;
    }),
  body('sectorId')
    .notEmpty()
    .withMessage('Sector ID is required')
    .isInt({ min: 1 })
    .withMessage('Sector ID must be a valid integer')
    .toInt(),
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  body('items.*.productId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Product ID must be a valid integer')
    .toInt(),
  body('items.*.productName')
    .notEmpty()
    .withMessage('Product name is required for each item')
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Product name must be between 1 and 200 characters'),
  body('items.*.quantityOrdered')
    .notEmpty()
    .withMessage('Quantity is required for each item')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1')
    .toInt(),
  body('items.*.unitPrice')
    .notEmpty()
    .withMessage('Unit price is required for each item')
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a positive number'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];
const updatePurchaseOrderValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Purchase order ID must be a valid positive integer')
    .toInt(),
  body('expectedDeliveryDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format. Use YYYY-MM-DD'),
  body('items')
    .optional()
    .isArray()
    .withMessage('Items must be an array'),
  body('items.*.productId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Product ID must be a valid integer'),
  body('items.*.productName')
    .if(body('items').exists())
    .notEmpty()
    .withMessage('Product name is required for each item')
    .isString()
    .trim(),
  body('items.*.quantityOrdered')
    .if(body('items').exists())
    .notEmpty()
    .withMessage('Quantity is required for each item')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('items.*.unitPrice')
    .if(body('items').exists())
    .notEmpty()
    .withMessage('Unit price is required for each item')
    .isFloat({ min: 0 }),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
];
const listPurchaseOrdersValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt(),
  query('status')
    .optional()
    .isIn(['Draft', 'Pending', 'Approved', 'Rejected', 'Sent', 'Partial Received', 'Complete', 'Cancelled'])
    .withMessage('Invalid status'),
  query('supplierId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Supplier ID must be a valid integer')
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
const getPurchaseOrderByIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Purchase order ID must be a valid positive integer')
    .toInt()
];
const submitForApprovalValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Purchase order ID must be a valid positive integer')
    .toInt()
];
const approvePurchaseOrderValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Purchase order ID must be a valid positive integer')
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
const cancelPurchaseOrderValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Purchase order ID must be a valid positive integer')
    .toInt(),
  body('reason')
    .notEmpty()
    .withMessage('Cancellation reason is required')
    .isString()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters')
];
const registerReceivingValidation = [
  body('poId')
    .notEmpty()
    .withMessage('Purchase order ID is required')
    .isInt({ min: 1 })
    .withMessage('Purchase order ID must be a valid integer')
    .toInt(),
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  body('items.*.poItemId')
    .notEmpty()
    .withMessage('PO item ID is required')
    .isInt({ min: 1 })
    .withMessage('PO item ID must be a valid integer')
    .toInt(),
  body('items.*.quantityReceived')
    .notEmpty()
    .withMessage('Quantity received is required')
    .isInt({ min: 0 })
    .withMessage('Quantity received must be a non-negative integer')
    .toInt(),
  body('items.*.quantityDamaged')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Quantity damaged must be a non-negative integer')
    .toInt(),
  body('items.*.qualityPass')
    .isBoolean()
    .withMessage('Quality pass must be true or false')
    .toBoolean(),
  body('receivingNote')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Receiving note cannot exceed 500 characters')
];
const getPendingReceivingValidation = [
];
module.exports = {
  createSupplierValidation,
  updateSupplierValidation,
  deleteSupplierValidation,
  restoreSupplierValidation,
  listSuppliersValidation,
  createPurchaseOrderValidation,
  updatePurchaseOrderValidation,
  listPurchaseOrdersValidation,
  getPurchaseOrderByIdValidation,
  submitForApprovalValidation,
  approvePurchaseOrderValidation,
  cancelPurchaseOrderValidation,
  registerReceivingValidation,
  getPendingReceivingValidation
};
