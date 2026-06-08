const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const PurchaseController = require('../controllers/purchase.controller');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { uploads, handleUploadError } = require('../../config/multer');
const { limiters } = require('../../config/rateLimit');

const createSupplierValidation = [
  body('name').notEmpty().withMessage('Supplier name is required').isLength({ min: 2, max: 200 }),
  body('contactPerson').notEmpty().withMessage('Contact person name is required').isLength({ min: 2, max: 100 }),
  body('phone').notEmpty().withMessage('Phone number is required').matches(/^09[0-9]{8}$/).withMessage('Invalid Ethiopian phone number'),
  body('email').notEmpty().withMessage('Email is required').isEmail().normalizeEmail(),
  body('address').notEmpty().withMessage('Address is required'),
  body('paymentTermsId').optional().isInt(),
  body('leadTimeDays').optional().isInt({ min: 0, max: 90 }),
  body('taxId').optional().isString(),
  body('bankAccount').optional().isString()
];

const updateSupplierValidation = [
  body('name').optional().isLength({ min: 2, max: 200 }),
  body('contactPerson').optional().isLength({ min: 2, max: 100 }),
  body('phone').optional().matches(/^09[0-9]{8}$/),
  body('email').optional().isEmail().normalizeEmail(),
  body('address').optional(),
  body('paymentTermsId').optional().isInt(),
  body('leadTimeDays').optional().isInt({ min: 0, max: 90 }),
  body('isActive').optional().isBoolean()
];

const createPOValidation = [
  body('supplierId').notEmpty().withMessage('Supplier ID is required').isInt(),
  body('expectedDeliveryDate').notEmpty().withMessage('Expected delivery date is required').isISO8601()
    .custom((value) => {
      const deliveryDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (deliveryDate < today) throw new Error('Expected delivery date cannot be in the past');
      return true;
    }),
  body('sectorId').notEmpty().withMessage('Sector ID is required').isInt(),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').optional().isInt(),
  body('items.*.productName').notEmpty().withMessage('Product name is required for each item'),
  body('items.*.quantityOrdered').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be a positive number'),
  body('notes').optional().isString().isLength({ max: 1000 }),
  body('attachment').optional().isString()
];

const updatePOValidation = [
  body('expectedDeliveryDate').optional().isISO8601(),
  body('notes').optional().isString(),
  body('items').optional().isArray()
];

const approvePOValidation = [
  body('approved').isBoolean().withMessage('Approved must be true or false'),
  body('rejectionReason')
    .if(body('approved').equals('false'))
    .notEmpty().withMessage('Rejection reason is required when rejecting')
    .isString().isLength({ min: 10, max: 500 })
];

const receiveItemsValidation = [
  body('poId').notEmpty().withMessage('Purchase order ID is required').isInt(),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.poItemId').isInt().withMessage('PO item ID is required'),
  body('items.*.quantityReceived').isInt({ min: 0 }).withMessage('Quantity received must be non-negative'),
  body('items.*.quantityDamaged').isInt({ min: 0 }).withMessage('Quantity damaged must be non-negative'),
  body('items.*.qualityPass').isBoolean().withMessage('Quality pass must be true or false'),
  body('receivingNote').optional().isString().isLength({ max: 500 })
];

const supplierIdParamValidation = [param('id').isInt().withMessage('Supplier ID must be a valid integer').toInt()];
const poIdParamValidation = [param('id').isInt().withMessage('Purchase order ID must be a valid integer').toInt()];

const listSuppliersValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().isString().trim(),
  query('isActive').optional().isBoolean()
];

const listPOsValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('status').optional().isIn(['Draft', 'Pending', 'Approved', 'Rejected', 'Sent', 'Partial Received', 'Complete', 'Cancelled']),
  query('supplierId').optional().isInt(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
];

// Supplier routes
router.get('/suppliers', authenticate, authorize(['suppliers:read']), listSuppliersValidation, validate, PurchaseController.getSuppliers);
router.get('/suppliers/:id', authenticate, authorize(['suppliers:read']), supplierIdParamValidation, validate, PurchaseController.getSupplierById);
router.post('/suppliers', authenticate, authorize(['suppliers:create']), createSupplierValidation, validate, PurchaseController.createSupplier);
router.put('/suppliers/:id', authenticate, authorize(['suppliers:update']), supplierIdParamValidation, updateSupplierValidation, validate, PurchaseController.updateSupplier);
router.delete('/suppliers/:id', authenticate, authorize(['suppliers:delete']), supplierIdParamValidation, validate, PurchaseController.deleteSupplier);
router.post('/suppliers/:id/restore', authenticate, authorize(['suppliers:update']), supplierIdParamValidation, validate, PurchaseController.restoreSupplier);

// Purchase Order routes
router.get('/orders', authenticate, authorize(['purchase_orders:read']), listPOsValidation, validate, PurchaseController.getPurchaseOrders);
router.get('/orders/:id', authenticate, authorize(['purchase_orders:read']), poIdParamValidation, validate, PurchaseController.getPurchaseOrderById);
router.post('/orders', authenticate, authorize(['purchase_orders:create']), createPOValidation, validate, limiters.checkout, PurchaseController.createPurchaseOrder);
router.put('/orders/:id', authenticate, authorize(['purchase_orders:update']), poIdParamValidation, updatePOValidation, validate, PurchaseController.updatePurchaseOrder);
router.post('/orders/:id/submit', authenticate, authorize(['purchase_orders:update']), poIdParamValidation, validate, PurchaseController.submitForApproval);
router.post('/orders/:id/approve', authenticate, authorize(['purchase_orders:approve']), poIdParamValidation, approvePOValidation, validate, PurchaseController.approvePurchaseOrder);
router.post('/orders/:id/cancel', authenticate, authorize(['purchase_orders:update']), poIdParamValidation, body('reason').notEmpty().isString(), validate, PurchaseController.cancelPurchaseOrder);
router.post('/orders/:id/attachment', authenticate, authorize(['purchase_orders:update']), poIdParamValidation, uploads.singleOrderAttachment.single('attachment'), handleUploadError, PurchaseController.uploadAttachment);

// Receiving routes
router.get('/receiving/pending', authenticate, authorize(['receiving:read']), PurchaseController.getPendingReceiving);
router.post('/receiving/register', authenticate, authorize(['receiving:create']), receiveItemsValidation, validate, PurchaseController.registerReceiving);

// Analytics & Misc
router.get('/statistics', authenticate, authorize(['purchase_orders:read']), PurchaseController.getPurchaseStatistics);
router.get('/reorder-suggestions', authenticate, authorize(['purchase_orders:read']), PurchaseController.getReorderSuggestions);
router.get('/sectors', authenticate, PurchaseController.getSectors);
router.get('/payment-terms', authenticate, PurchaseController.getPaymentTerms);

module.exports = router;
