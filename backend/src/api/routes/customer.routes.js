const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const CustomerController = require('../controllers/customer.controller');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');
const { limiters } = require('../../config/rateLimit');
const { uploads, handleUploadError } = require('../../config/multer');
const { customerChangePasswordValidation } = require('../validators/customer.validator');

router.get(
  '/profile',
  authenticate,
  authorizeRoles(['Customer']),
  CustomerController.getProfile
);

router.put(
  '/profile',
  authenticate,
  authorizeRoles(['Customer']),
  body('name').optional().isLength({ min: 2, max: 100 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().matches(/^09[0-9]{8}$/),
  body('address').optional().isString().isLength({ max: 500 }),
  validate,
  CustomerController.updateProfile
);

router.post(
  '/change-password',
  authenticate,
  authorizeRoles(['Customer']),
  customerChangePasswordValidation,
  validate,
  CustomerController.changePassword
);

router.get(
  '/orders',
  authenticate,
  authorizeRoles(['Customer']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  query('status').optional().isIn(['Received', 'In Progress', 'Quality Check', 'Ready', 'Delivered']),
  validate,
  CustomerController.getOrders
);

router.get(
  '/orders/:id',
  authenticate,
  authorizeRoles(['Customer']),
  param('id').isInt(),
  validate,
  CustomerController.getOrderById
);

router.post(
  '/orders',
  authenticate,
  authorizeRoles(['Customer']),
  body('productType').isIn(['Book', 'Module', 'Exam', 'Brochure']),
  body('quantity').isInt({ min: 1 }),
  body('paperType').isIn(['A3', 'A4', 'A5']),
  body('pagesPerCopy').isInt({ min: 1 }),
  body('colorPrinting').optional().isBoolean(),
  body('bindingType').optional().isIn(['None', 'Spiral', 'Thermal']),
  body('dueDate').isISO8601(),
  body('specialInstructions').optional().isLength({ max: 500 }),
  validate,
  limiters.checkout,
  CustomerController.createOrder
);

router.get(
  '/orders/:id/track',
  authenticate,
  authorizeRoles(['Customer']),
  param('id').isInt(),
  validate,
  CustomerController.trackOrder
);

router.post(
  '/orders/:id/cancel',
  authenticate,
  authorizeRoles(['Customer']),
  param('id').isInt(),
  body('reason').optional().isString().isLength({ max: 200 }),
  validate,
  CustomerController.cancelOrder
);

router.post(
  '/orders/:id/attachments',
  authenticate,
  authorizeRoles(['Customer']),
  param('id').isInt(),
  uploads.multipleOrderAttachments.array('attachments', 10),
  handleUploadError,
  CustomerController.uploadAttachments
);

router.post(
  '/quote',
  authenticate,
  authorizeRoles(['Customer']),
  body('productType').isIn(['Book', 'Module', 'Exam', 'Brochure']),
  body('quantity').isInt({ min: 1 }),
  body('paperType').isIn(['A3', 'A4', 'A5']),
  body('pagesPerCopy').isInt({ min: 1 }),
  body('colorPrinting').optional().isBoolean(),
  body('bindingType').optional().isIn(['None', 'Spiral', 'Thermal']),
  validate,
  CustomerController.requestQuote
);

router.get(
  '/quotes',
  authenticate,
  authorizeRoles(['Customer']),
  query('page').optional().isInt().toInt(),
  validate,
  CustomerController.getQuotes
);

router.post(
  '/quotes/:quoteId/accept',
  authenticate,
  authorizeRoles(['Customer']),
  param('quoteId').isInt(),
  validate,
  CustomerController.acceptQuote
);

router.get(
  '/receipts',
  authenticate,
  authorizeRoles(['Customer']),
  query('page').optional().isInt().toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  validate,
  CustomerController.getReceipts
);

router.get(
  '/receipts/:id',
  authenticate,
  authorizeRoles(['Customer']),
  param('id').isInt(),
  validate,
  CustomerController.downloadReceipt
);

router.get(
  '/invoices',
  authenticate,
  authorizeRoles(['Customer']),
  query('status').optional().isIn(['pending', 'paid', 'overdue']),
  validate,
  CustomerController.getInvoices
);

router.get(
  '/balance',
  authenticate,
  authorizeRoles(['Customer']),
  CustomerController.getBalance
);

router.post(
  '/payments',
  authenticate,
  authorizeRoles(['Customer']),
  body('amount').isFloat({ min: 1 }),
  body('paymentMethod').isIn(['Cash', 'Bank Transfer', 'Telebirr']),
  body('referenceNumber').optional(),
  validate,
  limiters.checkout,
  CustomerController.makePayment
);

router.get(
  '/notifications',
  authenticate,
  authorizeRoles(['Customer']),
  query('unreadOnly').optional().isBoolean(),
  validate,
  CustomerController.getNotifications
);

router.put(
  '/notifications/:id/read',
  authenticate,
  authorizeRoles(['Customer']),
  param('id').isInt(),
  validate,
  CustomerController.markNotificationRead
);

router.put(
  '/notifications/read-all',
  authenticate,
  authorizeRoles(['Customer']),
  CustomerController.markAllNotificationsRead
);

router.post(
  '/support',
  authenticate,
  authorizeRoles(['Customer']),
  body('subject').notEmpty().isLength({ min: 5, max: 200 }),
  body('message').notEmpty().isLength({ min: 10, max: 2000 }),
  validate,
  CustomerController.createSupportTicket
);

router.get(
  '/support',
  authenticate,
  authorizeRoles(['Customer']),
  query('page').optional().isInt().toInt(),
  validate,
  CustomerController.getSupportTickets
);

module.exports = router;
