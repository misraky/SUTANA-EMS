const express = require('express');
const router = express.Router();
const { body, query, header } = require('express-validator');
const ExternalController = require('../controllers/external.controller');
const { validate } = require('../middleware/validate.middleware');
const { authenticateApiKey } = require('../middleware/auth.middleware');
const { limiters } = require('../../config/rateLimit');
router.post(
  '/bank/payment',
  authenticateApiKey,
  limiters.apiKey(50, 60000),
  body('amount').isFloat({ min: 1 }),
  body('orderId').optional().isString(),
  body('invoiceNumber').optional().isString(),
  body('customerName').notEmpty().isString(),
  body('customerPhone').notEmpty().matches(/^09[0-9]{8}$/),
  body('customerEmail').optional().isEmail(),
  body('bankCode').isIn(['CBE', 'DASHEN', 'AWASH', 'TELEBIRR']),
  body('returnUrl').isURL(),
  validate,
  ExternalController.initiateBankPayment
);
router.post(
  '/bank/webhook',
  body('transactionId').notEmpty(),
  body('status').isIn(['success', 'failed', 'pending']),
  body('amount').isFloat(),
  body('reference').notEmpty(),
  header('x-webhook-signature').notEmpty(),
  validate,
  limiters.webhook,
  ExternalController.handleBankWebhook
);
router.get(
  '/bank/status/:transactionId',
  authenticateApiKey,
  param('transactionId').isString(),
  validate,
  ExternalController.getBankPaymentStatus
);
router.post(
  '/sms/send',
  authenticateApiKey,
  limiters.apiKey(100, 60000),
  body('to').isArray().withMessage('Recipients must be an array'),
  body('to.*').matches(/^09[0-9]{8}$/).withMessage('Invalid Ethiopian phone number'),
  body('message').notEmpty().isLength({ min: 1, max: 480 }),
  body('senderId').optional().isString().isLength({ max: 11 }),
  validate,
  ExternalController.sendSMS
);
router.post(
  '/sms/webhook/delivery',
  body('messageId').notEmpty(),
  body('status').isIn(['sent', 'delivered', 'failed']),
  body('reason').optional(),
  validate,
  limiters.webhook,
  ExternalController.handleSMSDeliveryWebhook
);
router.post(
  '/email/send',
  authenticateApiKey,
  limiters.apiKey(100, 60000),
  body('to').isArray().withMessage('Recipients must be an array'),
  body('to.*.email').isEmail(),
  body('to.*.name').optional().isString(),
  body('subject').notEmpty().isLength({ min: 1, max: 200 }),
  body('content').notEmpty(),
  body('templateId').optional().isString(),
  body('attachments').optional().isArray(),
  validate,
  ExternalController.sendEmail
);
router.post(
  '/email/webhook/bounce',
  body('email').isEmail(),
  body('reason').optional(),
  body('timestamp').optional(),
  validate,
  limiters.webhook,
  ExternalController.handleEmailBounceWebhook
);
router.post(
  '/telebirr/payment',
  authenticateApiKey,
  body('amount').isFloat({ min: 1 }),
  body('phoneNumber').matches(/^09[0-9]{8}$/),
  body('orderId').optional(),
  body('invoiceNumber').optional(),
  validate,
  ExternalController.initiateTelebirrPayment
);
router.post(
  '/telebirr/verify',
  authenticateApiKey,
  body('transactionId').notEmpty(),
  validate,
  ExternalController.verifyTelebirrPayment
);
router.post(
  '/cbe/payment',
  authenticateApiKey,
  body('amount').isFloat({ min: 1 }),
  body('accountNumber').optional(),
  body('orderId').optional(),
  validate,
  ExternalController.initiateCBEPayment
);
router.post(
  '/cbe/webhook',
  header('x-cbe-signature').notEmpty(),
  body('transactionId').notEmpty(),
  body('status').isString(),
  validate,
  limiters.webhook,
  ExternalController.handleCBECallback
);
router.post(
  '/dashen/payment',
  authenticateApiKey,
  body('amount').isFloat({ min: 1 }),
  body('orderId').optional(),
  validate,
  ExternalController.initiateDashenPayment
);
router.post(
  '/dashen/webhook',
  header('x-dashen-signature').notEmpty(),
  body('reference').notEmpty(),
  body('status').isString(),
  validate,
  limiters.webhook,
  ExternalController.handleDashenCallback
);
router.post(
  '/awash/payment',
  authenticateApiKey,
  body('amount').isFloat({ min: 1 }),
  body('orderId').optional(),
  validate,
  ExternalController.initiateAwashPayment
);
router.post(
  '/awash/webhook',
  header('x-awash-signature').notEmpty(),
  body('transactionRef').notEmpty(),
  body('status').isString(),
  validate,
  limiters.webhook,
  ExternalController.handleAwashCallback
);
router.get(
  '/health',
  authenticateApiKey,
  ExternalController.getExternalServicesHealth
);
router.post(
  '/retry/failed',
  authenticateApiKey,
  body('type').optional().isIn(['email', 'sms']),
  body('maxRetries').optional().isInt({ min: 1, max: 5 }),
  validate,
  ExternalController.retryFailedCommunications
);
module.exports = router;
