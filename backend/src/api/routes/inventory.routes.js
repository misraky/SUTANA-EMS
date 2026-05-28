const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const InventoryController = require('../controllers/inventory.controller');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { uploads, handleUploadError } = require('../../config/multer');
const { limiters } = require('../../config/rateLimit');
const createProductValidation = [
  body('name')
    .notEmpty().withMessage('Product name is required')
    .isLength({ min: 2, max: 200 }).withMessage('Product name must be between 2 and 200 characters'),
  body('sku')
    .notEmpty().withMessage('SKU is required')
    .isLength({ min: 3, max: 50 }).withMessage('SKU must be between 3 and 50 characters'),
  body('categoryId')
    .notEmpty().withMessage('Category ID is required')
    .isInt().withMessage('Category ID must be a valid integer'),
  body('unitId')
    .notEmpty().withMessage('Unit ID is required')
    .isInt().withMessage('Unit ID must be a valid integer'),
  body('sellingPrice')
    .notEmpty().withMessage('Selling price is required')
    .isFloat({ min: 0 }).withMessage('Selling price must be a positive number'),
  body('reorderLevel')
    .optional()
    .isInt({ min: 0 }).withMessage('Reorder level must be a non-negative integer'),
  body('expiryDate')
    .optional()
    .isISO8601().withMessage('Invalid expiry date format')
    .custom((value) => {
      const expiryDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expiryDate < today) {
        throw new Error('Expiry date cannot be in the past');
      }
      return true;
    }),
  body('supplierId')
    .optional()
    .isInt().withMessage('Supplier ID must be a valid integer')
];
const updateProductValidation = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 200 }),
  body('sku')
    .optional()
    .isLength({ min: 3, max: 50 }),
  body('categoryId')
    .optional()
    .isInt(),
  body('unitId')
    .optional()
    .isInt(),
  body('sellingPrice')
    .optional()
    .isFloat({ min: 0 }),
  body('reorderLevel')
    .optional()
    .isInt({ min: 0 }),
  body('expiryDate')
    .optional()
    .isISO8601(),
  body('supplierId')
    .optional()
    .isInt(),
  body('isActive')
    .optional()
    .isBoolean()
];
const stockAdjustmentValidation = [
  body('productId')
    .notEmpty().withMessage('Product ID is required')
    .isInt().withMessage('Product ID must be a valid integer'),
  body('quantityChange')
    .notEmpty().withMessage('Quantity change is required')
    .isInt().withMessage('Quantity change must be an integer'),
  body('reason')
    .notEmpty().withMessage('Reason is required')
    .isString()
    .isLength({ min: 5, max: 500 }).withMessage('Reason must be between 5 and 500 characters'),
  body('referenceType')
    .optional()
    .isIn(['Purchase', 'Sale', 'Adjustment', 'Damaged', 'Lost', 'Expired']),
  body('referenceId')
    .optional()
    .isInt()
];
const markDamagedValidation = [
  body('productId')
    .notEmpty().withMessage('Product ID is required')
    .isInt(),
  body('quantity')
    .notEmpty().withMessage('Quantity is required')
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('reason')
    .notEmpty().withMessage('Reason is required')
    .isString()
    .isLength({ min: 5, max: 500 }),
  body('photoUrl')
    .optional({ checkFalsy: true })
    .isString()
    .isLength({ max: 500 }).withMessage('Photo URL must be under 500 characters'),
];
const productIdParamValidation = [
  param('id')
    .isInt().withMessage('Product ID must be a valid integer')
    .toInt()
];
const listProductsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 }).toInt(),
  query('categoryId')
    .optional()
    .isInt(),
  query('search')
    .optional()
    .isString()
    .trim(),
  query('isActive')
    .optional()
    .isBoolean(),
  query('lowStock')
    .optional()
    .isBoolean()
];
router.get(
  '/products',
  authenticate,
  authorize(['inventory:read']),
  listProductsValidation,
  validate,
  InventoryController.getProducts
);
router.get(
  '/products/low-stock',
  authenticate,
  authorize(['inventory:read']),
  InventoryController.getLowStockProducts
);
router.get(
  '/products/expiring',
  authenticate,
  authorize(['inventory:read']),
  query('days').optional().isInt({ min: 1, max: 365 }).toInt(),
  validate,
  InventoryController.getExpiringProducts
);
router.get(
  '/products/:id',
  authenticate,
  authorize(['inventory:read']),
  productIdParamValidation,
  validate,
  InventoryController.getProductById
);
router.post(
  '/products',
  authenticate,
  authorize(['inventory:create']),
  createProductValidation,
  validate,
  limiters.checkout,
  InventoryController.createProduct
);
router.put(
  '/products/:id',
  authenticate,
  authorize(['inventory:update']),
  productIdParamValidation,
  updateProductValidation,
  validate,
  InventoryController.updateProduct
);
router.delete(
  '/products/:id',
  authenticate,
  authorize(['inventory:delete']),
  productIdParamValidation,
  validate,
  InventoryController.deleteProduct
);
router.post(
  '/products/:id/restore',
  authenticate,
  authorize(['inventory:update']),
  productIdParamValidation,
  validate,
  InventoryController.restoreProduct
);
router.get(
  '/stock/:productId',
  authenticate,
  authorize(['inventory:read']),
  param('productId').isInt(),
  validate,
  InventoryController.getCurrentStock
);
router.post(
  '/adjustments',
  authenticate,
  authorize(['inventory:update']),
  stockAdjustmentValidation,
  validate,
  InventoryController.adjustStock
);
router.post(
  '/mark-damaged',
  authenticate,
  authorize(['inventory:update']),
  markDamagedValidation,
  validate,
  InventoryController.markDamaged
);
router.post(
  '/mark-lost',
  authenticate,
  authorize(['inventory:update']),
  markDamagedValidation,
  validate,
  InventoryController.markLost
);
router.get(
  '/movements',
  authenticate,
  authorize(['inventory:read']),
  query('productId').optional().isInt(),
  query('type').optional().isIn(['Purchase', 'Sale', 'Adjustment', 'Damaged', 'Lost', 'Expired']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('page').optional().isInt().toInt(),
  query('limit').optional().isInt().toInt(),
  validate,
  InventoryController.getMovementHistory
);
router.post(
  '/count',
  authenticate,
  authorize(['inventory:update']),
  body('productId').isInt(),
  body('countedQuantity').isInt({ min: 0 }),
  body('notes').optional().isString(),
  validate,
  InventoryController.recordInventoryCount
);
router.get(
  '/statistics',
  authenticate,
  authorize(['inventory:read']),
  InventoryController.getInventoryStatistics
);
router.post(
  '/import',
  authenticate,
  authorize(['inventory:create']),
  uploads.singleProductImage.single('file'),
  handleUploadError,
  InventoryController.importProducts
);
router.get(
  '/export',
  authenticate,
  authorize(['inventory:read', 'reports:export']),
  query('format').isIn(['csv', 'excel']),
  validate,
  InventoryController.exportInventory
);
router.get(
  '/categories',
  authenticate,
  InventoryController.getCategories
);
router.post(
  '/categories',
  authenticate,
  authorize(['*']),
  body('name').notEmpty().isLength({ min: 2, max: 50 }),
  validate,
  InventoryController.createCategory
);
router.get(
  '/units',
  authenticate,
  InventoryController.getUnits
);
module.exports = router;
