const { body, query, param } = require('express-validator');
const searchProductsValidation = [
  query('q')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Search query must be at least 1 character'),
  query('type')
    .optional()
    .isIn(['name', 'barcode'])
    .withMessage('Search type must be "name" or "barcode"'),
  query('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a valid integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
    .toInt()
];
const getProductByBarcodeValidation = [
  param('barcode')
    .notEmpty()
    .withMessage('Barcode is required')
    .isString()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Barcode must be between 3 and 50 characters')
];
const listProductsValidation = [
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
  query('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a valid integer')
    .toInt()
];
const addToCartValidation = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a valid positive integer')
    .toInt(),
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1, max: 999 })
    .withMessage('Quantity must be between 1 and 999')
    .toInt()
];
const updateCartItemValidation = [
  param('itemId')
    .isString()
    .notEmpty()
    .withMessage('Item ID is required'),
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1, max: 999 })
    .withMessage('Quantity must be between 1 and 999')
    .toInt()
];
const removeCartItemValidation = [
  param('itemId')
    .isString()
    .notEmpty()
    .withMessage('Item ID is required')
];
const applyDiscountValidation = [
  body('type')
    .notEmpty()
    .withMessage('Discount type is required')
    .isIn(['percentage', 'fixed'])
    .withMessage('Discount type must be "percentage" or "fixed"'),
  body('value')
    .notEmpty()
    .withMessage('Discount value is required')
    .isFloat({ min: 0, max: 100000 })
    .withMessage('Discount value must be between 0 and 100,000'),
  body('reason')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Reason cannot exceed 200 characters')
];
const checkoutValidation = [
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
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Customer name must be between 2 and 100 characters'),
  body('customer.phone')
    .if(body('customerId').not().exists())
    .optional()
    .matches(/^09[0-9]{8}$/)
    .withMessage('Phone number must be Ethiopian format (09xxxxxxxx)'),
  body('customer.email')
    .if(body('customerId').not().exists())
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['Cash', 'Credit', 'Bank Transfer', 'Telebirr'])
    .withMessage('Invalid payment method'),
  body('amountPaid')
    .notEmpty()
    .withMessage('Amount paid is required')
    .isFloat({ min: 0 })
    .withMessage('Amount paid must be a positive number'),
  body('paymentReference')
    .if(body('paymentMethod').isIn(['Bank Transfer', 'Telebirr']))
    .notEmpty()
    .withMessage('Payment reference is required for bank transfer and Telebirr')
    .isString()
    .trim(),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];
const getSalesHistoryValidation = [
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
    .withMessage('Invalid start date format. Use YYYY-MM-DD'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format. Use YYYY-MM-DD'),
  query('customerId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Customer ID must be a valid integer')
    .toInt()
];
const getSaleByIdValidation = [
  param('saleId')
    .isInt({ min: 1 })
    .withMessage('Sale ID must be a valid positive integer')
    .toInt()
];
const getReceiptValidation = [
  param('saleId')
    .isInt({ min: 1 })
    .withMessage('Sale ID must be a valid positive integer')
    .toInt()
];
const voidSaleValidation = [
  param('saleId')
    .isInt({ min: 1 })
    .withMessage('Sale ID must be a valid positive integer')
    .toInt(),
  body('reason')
    .notEmpty()
    .withMessage('Void reason is required')
    .isString()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters')
];
const getDailyStatisticsValidation = [
  query('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format. Use YYYY-MM-DD')
];
const validateDiscountValidation = [
  query('discountPercent')
    .notEmpty()
    .withMessage('Discount percentage is required')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount percentage must be between 0 and 100'),
  query('subtotal')
    .notEmpty()
    .withMessage('Subtotal is required')
    .isFloat({ min: 0 })
    .withMessage('Subtotal must be a positive number')
];
module.exports = {
  searchProductsValidation,
  getProductByBarcodeValidation,
  listProductsValidation,
  addToCartValidation,
  updateCartItemValidation,
  removeCartItemValidation,
  applyDiscountValidation,
  checkoutValidation,
  getSalesHistoryValidation,
  getSaleByIdValidation,
  getReceiptValidation,
  voidSaleValidation,
  getDailyStatisticsValidation,
  validateDiscountValidation
};
