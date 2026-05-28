const { body, query, param } = require('express-validator');
const createProductValidation = [
  body('name')
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters')
    .trim()
    .escape(),
  body('sku')
    .notEmpty()
    .withMessage('SKU is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('SKU must be between 3 and 50 characters')
    .trim()
    .toUpperCase(),
  body('categoryId')
    .notEmpty()
    .withMessage('Category ID is required')
    .isInt({ min: 1 })
    .withMessage('Category ID must be a valid integer')
    .toInt(),
  body('unitId')
    .notEmpty()
    .withMessage('Unit ID is required')
    .isInt({ min: 1 })
    .withMessage('Unit ID must be a valid integer')
    .toInt(),
  body('sellingPrice')
    .notEmpty()
    .withMessage('Selling price is required')
    .isFloat({ min: 0 })
    .withMessage('Selling price must be a positive number'),
  body('reorderLevel')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Reorder level must be a non-negative integer')
    .toInt(),
  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid expiry date format. Use YYYY-MM-DD')
    .custom((value) => {
      if (value) {
        const expiryDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (expiryDate < today) {
          throw new Error('Expiry date cannot be in the past');
        }
      }
      return true;
    }),
  body('supplierId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Supplier ID must be a valid integer')
    .toInt()
];
const updateProductValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a valid positive integer')
    .toInt(),
  body('name')
    .optional()
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters')
    .trim()
    .escape(),
  body('sku')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('SKU must be between 3 and 50 characters')
    .trim()
    .toUpperCase(),
  body('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a valid integer')
    .toInt(),
  body('unitId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Unit ID must be a valid integer')
    .toInt(),
  body('sellingPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Selling price must be a positive number'),
  body('reorderLevel')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Reorder level must be a non-negative integer')
    .toInt(),
  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid expiry date format'),
  body('supplierId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Supplier ID must be a valid integer')
    .toInt(),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be true or false')
    .toBoolean()
];
const deleteProductValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a valid positive integer')
    .toInt()
];
const restoreProductValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a valid positive integer')
    .toInt()
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
    .toBoolean(),
  query('lowStock')
    .optional()
    .isBoolean()
    .withMessage('lowStock must be true or false')
    .toBoolean()
];
const getProductByIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a valid positive integer')
    .toInt()
];
const getLowStockProductsValidation = [
  query('thresholdPercent')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Threshold percentage must be between 0 and 100')
    .toInt()
];
const getExpiringProductsValidation = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365')
    .toInt()
];
const getCurrentStockValidation = [
  param('productId')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a valid positive integer')
    .toInt()
];
const adjustStockValidation = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a valid integer')
    .toInt(),
  body('quantityChange')
    .notEmpty()
    .withMessage('Quantity change is required')
    .isInt()
    .withMessage('Quantity change must be an integer')
    .custom((value) => {
      if (value === 0) {
        throw new Error('Quantity change cannot be zero');
      }
      return true;
    }),
  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .isString()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters')
    .escape(),
  body('referenceType')
    .optional()
    .isIn(['Purchase', 'Sale', 'Adjustment', 'Damaged', 'Lost', 'Expired'])
    .withMessage('Invalid reference type'),
  body('referenceId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Reference ID must be a valid integer')
    .toInt()
];
const markDamagedValidation = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a valid integer')
    .toInt(),
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1')
    .toInt(),
  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .isString()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters')
    .escape(),
  body('photoUrl')
    .optional()
    .isURL()
    .withMessage('Photo URL must be a valid URL')
];
const markLostValidation = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a valid integer')
    .toInt(),
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1')
    .toInt(),
  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .isString()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters')
    .escape()
];
const getMovementHistoryValidation = [
  query('productId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Product ID must be a valid integer')
    .toInt(),
  query('type')
    .optional()
    .isIn(['Purchase', 'Sale', 'Adjustment', 'Damaged', 'Lost', 'Expired'])
    .withMessage('Invalid transaction type'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt()
];
const recordInventoryCountValidation = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a valid integer')
    .toInt(),
  body('countedQuantity')
    .notEmpty()
    .withMessage('Counted quantity is required')
    .isInt({ min: 0 })
    .withMessage('Counted quantity must be a non-negative integer')
    .toInt(),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];
const createCategoryValidation = [
  body('name')
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters')
    .trim()
    .escape()
];
const importProductsValidation = [
];
const exportInventoryValidation = [
  query('format')
    .isIn(['csv', 'excel'])
    .withMessage('Format must be "csv" or "excel"')
];
module.exports = {
  createProductValidation,
  updateProductValidation,
  deleteProductValidation,
  restoreProductValidation,
  listProductsValidation,
  getProductByIdValidation,
  getLowStockProductsValidation,
  getExpiringProductsValidation,
  getCurrentStockValidation,
  adjustStockValidation,
  markDamagedValidation,
  markLostValidation,
  getMovementHistoryValidation,
  recordInventoryCountValidation,
  createCategoryValidation,
  importProductsValidation,
  exportInventoryValidation
};
