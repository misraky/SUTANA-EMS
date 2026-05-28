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
    .notEmpty().withMessage('Product ID is required')
    .isInt().withMessage('Product ID must be a valid integer'),
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
    .matches(/^09[0-9]{8}$/).withMessage('Phone number must be Ethiopian format (09xxxxxxxx)'),
  body('paymentMethod')
    .notEmpty().withMessage('Payment method is required')
    .isIn(['Cash', 'Credit', 'Bank Transfer', 'Telebirr']),
  body('amountPaid')
    .notEmpty().withMessage('Amount paid is required')
    .isFloat({ min: 0 }).withMessage('Amount paid must be a positive number'),
  body('paymentReference')
    .if(body('paymentMethod').isIn(['Bank Transfer', 'Telebirr']))
    .notEmpty().withMessage('Payment reference is required for bank transfer and Telebirr')
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
  authorize(['pos:update']),
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
module.exports = router;
