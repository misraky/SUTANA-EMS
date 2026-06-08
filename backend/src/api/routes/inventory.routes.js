const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const InventoryController = require('../controllers/inventory.controller');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { uploads, handleUploadError } = require('../../config/multer');
const { limiters } = require('../../config/rateLimit');

const createProductValidation = [
  body('name').notEmpty().isLength({ min: 2, max: 200 }),
  body('sku').notEmpty().isLength({ min: 3, max: 50 }),
  body('categoryId').notEmpty().isInt(),
  body('unitId').notEmpty().isInt(),
  body('sellingPrice').notEmpty().isFloat({ min: 0 }),
  body('reorderLevel').optional().isInt({ min: 0 }),
  body('expiryDate').optional().isISO8601(),
  body('supplierId').optional().isInt()
];
const updateProductValidation = [
  body('name').optional().isLength({ min: 2, max: 200 }),
  body('sku').optional().isLength({ min: 3, max: 50 }),
  body('categoryId').optional().isInt(),
  body('unitId').optional().isInt(),
  body('sellingPrice').optional().isFloat({ min: 0 }),
  body('reorderLevel').optional().isInt({ min: 0 }),
  body('expiryDate').optional().isISO8601(),
  body('supplierId').optional().isInt(),
  body('isActive').optional().isBoolean()
];
const stockAdjustmentValidation = [
  body('productId').notEmpty().isInt(),
  body('quantityChange').notEmpty().isInt(),
  body('reason').notEmpty().isString().isLength({ min: 5, max: 500 }),
  body('referenceType').optional().isIn(['Purchase', 'Sale', 'Adjustment', 'Damaged', 'Lost', 'Expired']),
  body('referenceId').optional().isInt()
];
const markDamagedValidation = [
  body('productId').notEmpty().isInt(),
  body('quantity').notEmpty().isInt({ min: 1 }),
  body('reason').notEmpty().isString().isLength({ min: 5, max: 500 }),
  body('photoUrl').optional({ checkFalsy: true }).isString().isLength({ max: 500 })
];
const productIdParamValidation = [
  param('id').isInt().toInt()
];
const listProductsValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 1000 }).toInt(),
  query('categoryId').optional().isInt(),
  query('search').optional().isString().trim(),
  query('isActive').optional().isBoolean(),
  query('lowStock').optional().isBoolean()
];

router.get('/products', authenticate, authorize(['inventory:read']), listProductsValidation, validate, InventoryController.getProducts);
router.get('/products/low-stock', authenticate, authorize(['inventory:read']), InventoryController.getLowStockProducts);
router.get('/products/expiring', authenticate, authorize(['inventory:read']), query('days').optional().isInt({ min: 1, max: 365 }).toInt(), validate, InventoryController.getExpiringProducts);
router.get('/products/:id', authenticate, authorize(['inventory:read']), productIdParamValidation, validate, InventoryController.getProductById);
router.post('/products', authenticate, authorize(['inventory:create']), createProductValidation, validate, limiters.checkout, InventoryController.createProduct);
router.put('/products/:id', authenticate, authorize(['inventory:update']), productIdParamValidation, updateProductValidation, validate, InventoryController.updateProduct);
router.delete('/products/:id', authenticate, authorize(['inventory:delete']), productIdParamValidation, validate, InventoryController.deleteProduct);
router.post('/products/:id/restore', authenticate, authorize(['inventory:update']), productIdParamValidation, validate, InventoryController.restoreProduct);
router.get('/stock/:productId', authenticate, authorize(['inventory:read']), param('productId').isInt(), validate, InventoryController.getCurrentStock);

router.post('/adjustments', authenticate, authorize(['inventory:update']), stockAdjustmentValidation, validate, InventoryController.adjustStock);
// Only Store Manager and CEO can view pending adjustments and approve/reject them
router.get('/adjustments/pending', authenticate, authorize(['inventory:manager_approve']), InventoryController.getPendingAdjustments);
router.post('/adjustments/:id/approve', authenticate, authorize(['inventory:manager_approve']), InventoryController.approveAdjustment);
router.post('/adjustments/:id/reject', authenticate, authorize(['inventory:manager_approve']), body('reason').notEmpty().isString(), validate, InventoryController.rejectAdjustment);

router.post('/mark-damaged', authenticate, authorize(['inventory:update']), markDamagedValidation, validate, InventoryController.markDamaged);
router.post('/mark-lost', authenticate, authorize(['inventory:update']), markDamagedValidation, validate, InventoryController.markLost);

router.get('/movements', authenticate, authorize(['inventory:read']), query('productId').optional().isInt(), query('type').optional().isIn(['Purchase', 'Sale', 'Adjustment', 'Damaged', 'Lost', 'Expired']), query('startDate').optional().isISO8601(), query('endDate').optional().isISO8601(), query('page').optional().isInt().toInt(), query('limit').optional().isInt().toInt(), validate, InventoryController.getMovementHistory);
router.post('/count', authenticate, authorize(['inventory:update']), body('productId').isInt(), body('countedQuantity').isInt({ min: 0 }), body('notes').optional().isString(), validate, InventoryController.recordInventoryCount);
router.get('/statistics', authenticate, authorize(['inventory:read']), InventoryController.getInventoryStatistics);
router.post('/import', authenticate, authorize(['inventory:create']), uploads.singleProductImage.single('file'), handleUploadError, InventoryController.importProducts);
router.get('/export', authenticate, authorize(['inventory:read', 'reports:export']), query('format').isIn(['csv', 'excel']), validate, InventoryController.exportInventory);

router.get('/categories', authenticate, InventoryController.getCategories);
router.post('/categories', authenticate, authorize(['*']), body('name').notEmpty().isLength({ min: 2, max: 50 }), validate, InventoryController.createCategory);
router.get('/units', authenticate, InventoryController.getUnits);

module.exports = router;
