const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const PrintingController = require('../controllers/printing.controller');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { uploads, handleUploadError } = require('../../config/multer');
const { limiters } = require('../../config/rateLimit');
const createOrderValidation = [
  body('customerId')
    .optional()
    .isInt().withMessage('Customer ID must be a valid integer'),
  body('customer')
    .optional()
    .isObject().withMessage('Customer must be an object'),
  body('customer.name')
    .if(body('customerId').not().exists())
    .notEmpty().withMessage('Customer name is required when creating new customer')
    .isLength({ min: 2, max: 100 }),
  body('customer.phone')
    .if(body('customerId').not().exists())
    .notEmpty().withMessage('Customer phone is required when creating new customer')
    .matches(/^09[0-9]{8}$/).withMessage('Phone number must be Ethiopian format (09xxxxxxxx)'),
  body('customer.customerTypeId')
    .if(body('customerId').not().exists())
    .isInt().withMessage('Valid customer type ID is required'),
  body('productType')
    .notEmpty().withMessage('Product type is required')
    .isIn(['Book', 'Module', 'Exam', 'Brochure', 'TaxReceipt']),
  body('quantity')
    .notEmpty().withMessage('Quantity is required')
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('paperType')
    .notEmpty().withMessage('Paper type is required')
    .isIn(['A3', 'A4', 'A5']),
  body('pagesPerCopy')
    .notEmpty().withMessage('Pages per copy is required')
    .isInt({ min: 1 }).withMessage('Pages per copy must be at least 1'),
  body('colorPrinting')
    .optional()
    .isBoolean(),
  body('bindingType')
    .optional()
    .isIn(['None', 'Spiral', 'Thermal']),
  body('dueDate')
    .notEmpty().withMessage('Due date is required')
    .isISO8601().withMessage('Invalid date format')
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
    .isLength({ max: 500 }).withMessage('Special instructions cannot exceed 500 characters')
];
const updateStatusValidation = [
  body('status')
    .if(body('statusId').not().exists())
    .notEmpty().withMessage('Status or statusId is required')
    .isIn([
      'received', 'in_progress', 'quality_check', 'ready', 'delivered',
      'Received', 'In Progress', 'Quality Check', 'Ready', 'Delivered'
    ]).withMessage('Invalid status value'),
  body('statusId')
    .optional()
    .isInt({ min: 1 }).withMessage('statusId must be a positive integer'),
  body('notes')
    .optional()
    .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
];
const listOrdersValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),
  query('status')
    .optional()
    .isIn(['Received', 'In Progress', 'Quality Check', 'Ready', 'Delivered']),
  query('search')
    .optional()
    .isString()
    .trim(),
  query('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date format')
];
const orderIdParamValidation = [
  param('id')
    .isInt().withMessage('Order ID must be a valid integer')
    .toInt()
];
const printTaxReceiptValidation = [
  param('orderId')
    .isInt().withMessage('Order ID must be a valid integer')
    .toInt(),
  body('approvalAmountTotal')
    .notEmpty().withMessage('Approval amount total is required')
    .isInt({ min: 1 }).withMessage('Approval amount must be at least 1'),
  body('approvedDate')
    .notEmpty().withMessage('Approved date is required')
    .isISO8601().withMessage('Invalid date format'),
  body('approvalDocument')
    .optional()
    .isString()
];
router.get(
  '/orders',
  authenticate,
  authorize(['orders:read']),
  listOrdersValidation,
  validate,
  PrintingController.getAllOrders
);
router.get(
  '/orders/pending',
  authenticate,
  authorize(['orders:read']),
  PrintingController.getPendingOrders
);
router.get(
  '/orders/:id',
  authenticate,
  authorize(['orders:read']),
  orderIdParamValidation,
  validate,
  PrintingController.getOrderById
);
router.post(
  '/orders',
  authenticate,
  authorize(['orders:create']),
  createOrderValidation,
  validate,
  limiters.checkout,
  PrintingController.createOrder
);
router.put(
  '/orders/:id/status',
  authenticate,
  authorize(['orders:update']),
  orderIdParamValidation,
  updateStatusValidation,
  validate,
  PrintingController.updateOrderStatus
);
router.post(
  '/orders/:id/attachments',
  authenticate,
  authorize(['orders:update']),
  orderIdParamValidation,
  uploads.multipleOrderAttachments.array('attachments', 10),
  handleUploadError,
  PrintingController.uploadAttachments
);
router.delete(
  '/orders/:id/attachments/:attachmentId',
  authenticate,
  authorize(['orders:update']),
  param('id').isInt(),
  param('attachmentId').isString(),
  validate,
  PrintingController.deleteAttachment
);
router.get(
  '/orders/:id/history',
  authenticate,
  authorize(['orders:read']),
  orderIdParamValidation,
  validate,
  PrintingController.getOrderHistory
);
router.get(
  '/tax-receipts/remaining/:orderId',
  authenticate,
  authorize(['tax_receipts:read']),
  param('orderId').isInt(),
  validate,
  PrintingController.getRemainingTaxAllowance
);
router.post(
  '/tax-receipts/print/:orderId',
  authenticate,
  authorize(['tax_receipts:create']),
  param('orderId').isInt(),
  printTaxReceiptValidation,
  validate,
  PrintingController.printTaxReceipt
);
router.get(
  '/tax-receipts',
  authenticate,
  authorize(['tax_receipts:read']),
  query('page').optional().isInt().toInt(),
  query('limit').optional().isInt().toInt(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  validate,
  PrintingController.getAllTaxReceipts
);
router.get(
  '/statistics',
  authenticate,
  authorize(['orders:read']),
  PrintingController.getPrintingStatistics
);
router.get(
  '/calculate-price',
  authenticate,
  query('paperType').isIn(['A3', 'A4', 'A5']),
  query('pagesPerCopy').isInt({ min: 1 }),
  query('quantity').isInt({ min: 1 }),
  query('colorPrinting').optional().isBoolean(),
  query('bindingType').optional().isIn(['None', 'Spiral', 'Thermal']),
  validate,
  PrintingController.calculatePrice
);
module.exports = router;
