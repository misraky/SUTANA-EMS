const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const POSController = require('../controllers/pos.controller');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { limiters } = require('../../config/rateLimit');
const searchProductsValidation = [
  query('q')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1 }).withMessage('Search query must be at least 1 character'),
  query('type')
    .optional()
    .isIn(['name', 'barcode']).withMessage('Search type must be "name" or "barcode"'),
  query('categoryId')
    .optional()
    .isInt().withMessage('Category ID must be a valid integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
    .toInt()
];
const addToCartValidation = [
  body('productId')
    .notEmpty().withMessage('Product ID is required'),
  body('quantity')
    .notEmpty().withMessage('Quantity is required')
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1')
];
const updateCartItemValidation = [
  param('itemId')
    .isString().withMessage('Item ID must be a string'),
  body('quantity')
    .notEmpty().withMessage('Quantity is required')
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1')
];
const applyDiscountValidation = [
  body('type')
    .notEmpty().withMessage('Discount type is required')
    .isIn(['percentage', 'fixed']).withMessage('Discount type must be "percentage" or "fixed"'),
  body('value')
    .notEmpty().withMessage('Discount value is required')
    .isFloat({ min: 0 }).withMessage('Discount value must be a positive number'),
  body('reason')
    .optional()
    .isString()
    .isLength({ max: 200 }).withMessage('Reason cannot exceed 200 characters')
];
const checkoutValidation = [
  body('customerId')
    .optional()
    .isInt().withMessage('Customer ID must be a valid integer'),
  body('customer')
    .optional()
    .isObject(),
  body('customer.name')
    .if(body('customerId').not().exists())
    .optional()
    .isString(),
  body('customer.phone')
    .if(body('customerId').not().exists())
    .optional()
    .matches(/^(09[0-9]{8}|\+251[0-9]{9})$/).withMessage('Phone must be Ethiopian format (09xxxxxxxx or +251xxxxxxxxx)'),
  body('paymentMethod')
    .notEmpty().withMessage('Payment method is required')
    .isIn(['Cash', 'Credit', 'Bank Transfer', 'Telebirr', 'Check']),
  body('amountPaid')
    .notEmpty().withMessage('Amount paid is required')
    .isFloat({ min: 0 }).withMessage('Amount paid must be a positive number'),
  body('paymentReference')
    .if(body('paymentMethod').isIn(['Bank Transfer', 'Telebirr', 'Check']))
    .notEmpty().withMessage('Payment reference is required for bank transfer, Telebirr and Check')
    .optional(),
  body('notes')
    .optional()
    .isString()
    .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
];
const voidSaleValidation = [
  param('saleId')
    .isInt().withMessage('Sale ID must be a valid integer'),
  body('reason')
    .notEmpty().withMessage('Void reason is required')
    .isString()
    .isLength({ min: 5, max: 500 }).withMessage('Reason must be between 5 and 500 characters')
];
const saleIdParamValidation = [
  param('saleId')
    .isInt().withMessage('Sale ID must be a valid integer')
    .toInt()
];
router.get(
  '/products',
  authenticate,
  authorize(['pos:read']),
  query('page').optional().isInt().toInt(),
  query('limit').optional().isInt().toInt(),
  query('categoryId').optional().isInt(),
  query('source').optional().isIn(['retail', 'farming', 'pharmacy']),
  validate,
  POSController.getProducts
);
router.get(
  '/products/search',
  authenticate,
  authorize(['pos:read']),
  searchProductsValidation,
  validate,
  POSController.searchProducts
);
router.get(
  '/products/barcode/:barcode',
  authenticate,
  authorize(['pos:read']),
  param('barcode').isString().notEmpty(),
  validate,
  POSController.getProductByBarcode
);
router.get(
  '/cart',
  authenticate,
  authorize(['pos:read']),
  POSController.getCart
);
router.post(
  '/cart/items',
  authenticate,
  authorize(['pos:update']),
  addToCartValidation,
  validate,
  POSController.addToCart
);
router.put(
  '/cart/items/:itemId',
  authenticate,
  authorize(['pos:update']),
  updateCartItemValidation,
  validate,
  POSController.updateCartItem
);
router.delete(
  '/cart/items/:itemId',
  authenticate,
  authorize(['pos:update']),
  param('itemId').isString(),
  validate,
  POSController.removeCartItem
);
router.delete(
  '/cart',
  authenticate,
  authorize(['pos:update']),
  POSController.clearCart
);
router.put(
  '/cart/discount',
  authenticate,
  authorize(['pos:update']),
  applyDiscountValidation,
  validate,
  POSController.applyCartDiscount
);
router.delete(
  '/cart/discount',
  authenticate,
  authorize(['pos:update']),
  POSController.removeCartDiscount
);
router.post(
  '/checkout',
  authenticate,
  authorize(['pos:create']),
  checkoutValidation,
  validate,
  limiters.checkout,
  POSController.checkout
);
router.get(
  '/customers',
  authenticate,
  authorize(['pos:read']),
  query('page').optional().isInt().toInt(),
  query('limit').optional().isInt().toInt(),
  query('search').optional().isString().trim(),
  validate,
  POSController.getCustomers
);
router.post(
  '/customers',
  authenticate,
  authorize(['pos:create']),
  body('name').notEmpty().withMessage('Name is required'),
  body('phone').optional().matches(/^09[0-9]{8}$/).withMessage('Phone number must be Ethiopian format (09xxxxxxxx)'),
  body('email').optional().isEmail().withMessage('Must be a valid email'),
  validate,
  POSController.createCustomer
);
router.get(
  '/reports',
  authenticate,
  authorize(['pos:read']),
  query('range').optional().isIn(['today', 'week', 'month', 'year']),
  validate,
  POSController.getSalesReports
);
router.get(
  '/sales',
  authenticate,
  authorize(['pos:read']),
  query('page').optional().isInt().toInt(),
  query('limit').optional().isInt().toInt(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('customerId').optional().isInt(),
  query('search').optional().isString(),
  query('source').optional().isIn(['retail', 'farming', 'pharmacy']),
  validate,
  POSController.getSalesHistory
);
router.get(
  '/sales/:saleId',
  authenticate,
  authorize(['pos:read']),
  saleIdParamValidation,
  validate,
  POSController.getSaleById
);
router.get(
  '/receipts/:saleId',
  authenticate,
  authorize(['pos:read']),
  saleIdParamValidation,
  validate,
  POSController.getReceipt
);
router.post(
  '/sales/:saleId/void',
  authenticate,
  authorize(['pos:void']),
  voidSaleValidation,
  validate,
  POSController.voidSale
);
router.get(
  '/statistics/daily',
  authenticate,
  authorize(['pos:read']),
  query('date').optional().isISO8601(),
  validate,
  POSController.getDailyStatistics
);
router.get(
  '/validate-discount',
  authenticate,
  authorize(['pos:read']),
  query('discountPercent').isFloat({ min: 0, max: 100 }),
  query('subtotal').isFloat({ min: 0 }),
  validate,
  POSController.validateDiscount
);

/* ── Shift Management ── */
router.get('/shifts/current', authenticate, authorize(['pos:read']), POSController.getCurrentShift);
router.post('/shifts/open', authenticate, authorize(['pos:create']),
  body('opening_float').isFloat({ min: 0 }).withMessage('Opening float must be a positive number'),
  body('shift_type').optional().isIn(['morning', 'afternoon', 'evening']),
  validate, POSController.openShift
);
router.post('/shifts/close', authenticate, authorize(['pos:update']),
  body('physical_cash_counted').isFloat({ min: 0 }).withMessage('Physical cash counted is required'),
  body('difference_reason').optional().isString().isLength({ max: 500 }),
  validate, POSController.closeShift
);
router.get('/shifts/history', authenticate, authorize(['pos:read']),
  query('limit').optional().isInt().toInt(), validate, POSController.getShiftHistory
);

/* ── Manager Shift Verification ── */
router.get('/shifts/all-open', authenticate, authorize(['pos:read']), POSController.getAllOpenShifts);
router.get('/shifts/all-history', authenticate, authorize(['pos:verify']),
  query('limit').optional().isInt().toInt(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('search').optional().isString(),
  validate, POSController.getAllShiftHistory
);
router.post('/shifts/:shiftId/verify', authenticate, authorize(['pos:verify']),
  param('shiftId').isInt(),
  body('status').isIn(['VERIFIED', 'REJECTED']),
  validate, POSController.verifyShift
);

/* ── Cash Handover ── */
router.post('/handover/from-cashier', authenticate, authorize(['pos:create']),
  body('to_user_id').isInt(),
  body('total_cash').isFloat({ min: 0 }),
  body('total_telebirr').optional().isFloat({ min: 0 }),
  body('total_transfer').optional().isFloat({ min: 0 }),
  body('total_credit').optional().isFloat({ min: 0 }),
  body('total_check').optional().isFloat({ min: 0 }),
  body('notes').optional().isString(),
  validate, POSController.submitCashierHandover
);
router.post('/handover/to-finance', authenticate, authorize(['pos:update']),
  body('to_user_id').isInt(),
  body('total_cash').isFloat({ min: 0 }),
  body('total_telebirr').optional().isFloat({ min: 0 }),
  body('total_transfer').optional().isFloat({ min: 0 }),
  body('total_credit').optional().isFloat({ min: 0 }),
  body('total_check').optional().isFloat({ min: 0 }),
  body('notes').optional().isString(),
  validate, POSController.submitManagerHandover
);
router.get('/handover/pending', authenticate, authorize(['pos:read', 'pos:update']), POSController.getPendingHandovers);
router.post('/handover/:handoverId/verify', authenticate, authorize(['pos:update']),
  param('handoverId').isInt(),
  body('status').isIn(['VERIFIED', 'REJECTED']),
  validate, POSController.verifyHandover
);

/* ── Manager Sale Approval / Audit ── */
router.get('/manager/sales', authenticate, authorize(['pos:read']),
  query('page').optional().isInt().toInt(),
  query('limit').optional().isInt().toInt(),
  query('saleType').optional().isIn(['walk_in', 'online']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('status').optional().isIn(['pending', 'approved', 'flagged']),
  validate, POSController.getManagerSales
);
router.post('/manager/sales/:saleId/approve', authenticate, authorize(['pos:update']),
  param('saleId').isInt().toInt(),
  body('reason').optional().isString(),
  validate, POSController.managerApproveSale
);
router.post('/manager/sales/:saleId/flag', authenticate, authorize(['pos:update']),
  param('saleId').isInt().toInt(),
  body('reason').notEmpty().withMessage('Flag reason is required'),
  validate, POSController.managerFlagSale
);
router.get('/sales/:saleId/audit-log', authenticate, authorize(['pos:read']),
  param('saleId').isInt().toInt(),
  validate, POSController.getSaleAuditLog
);

/* ── Reports ── */
router.get('/reports/combined-daily', authenticate, authorize(['pos:read']),
  query('date').optional().isISO8601(),
  validate, POSController.getCombinedDailyReport
);
router.get('/reports/today-summary', authenticate, authorize(['pos:read']), POSController.getTodaySummary);
router.get('/reports/audit-pdf', authenticate, authorize(['pos:read', 'reports:read']),
  query('startDate').optional(), query('endDate').optional(),
  query('source').optional().isIn(['retail', 'farming', 'pharmacy']),
  validate, POSController.exportAuditPDF
);
router.get('/reports/audit-excel', authenticate, authorize(['pos:read', 'reports:read']),
  query('startDate').optional(), query('endDate').optional(),
  query('source').optional().isIn(['retail', 'farming', 'pharmacy']),
  validate, POSController.exportAuditExcel
);

/* ── Online Order Collection (Cashier collects prepaid online order) ── */
router.post('/collect-online-order', authenticate, authorize(['pos:create']),
  body('orderSource').notEmpty().isIn(['farming_orders', 'retail_orders', 'pharmacy_orders']),
  body('orderId').notEmpty().isInt().toInt(),
  body('paymentMethod').optional().isIn(['Cash', 'Credit', 'Bank Transfer', 'Telebirr', 'Check']),
  body('amountPaid').optional().isFloat({ min: 0 }),
  validate, POSController.collectOnlineOrder
);

module.exports = router;
