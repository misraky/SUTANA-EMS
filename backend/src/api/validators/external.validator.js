const { body, query, param, header } = require('express-validator');
const initiateBankPaymentValidation = [
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 1 })
    .withMessage('Amount must be at least 1 ETB'),
  body('orderId')
    .optional()
    .isString()
    .trim(),
  body('invoiceNumber')
    .optional()
    .isString()
    .trim(),
  body('customerName')
    .notEmpty()
    .withMessage('Customer name is required')
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 }),
  body('customerPhone')
    .notEmpty()
    .withMessage('Customer phone is required')
    .matches(/^09[0-9]{8}$/)
    .withMessage('Invalid Ethiopian phone number'),
  body('customerEmail')
    .optional()
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),
  body('bankCode')
    .notEmpty()
    .withMessage('Bank code is required')
    .isIn(['CBE', 'DASHEN', 'AWASH', 'TELEBIRR'])
    .withMessage('Bank code must be CBE, DASHEN, AWASH, or TELEBIRR'),
  body('returnUrl')
    .notEmpty()
    .withMessage('Return URL is required')
    .isURL()
    .withMessage('Invalid return URL')
];
const bankWebhookValidation = [
  header('x-webhook-signature')
    .notEmpty()
    .withMessage('Webhook signature is required'),
  body('transactionId')
    .notEmpty()
    .withMessage('Transaction ID is required')
    .isString()
    .trim(),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['success', 'failed', 'pending'])
    .withMessage('Status must be success, failed, or pending'),
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0 }),
  body('reference')
    .notEmpty()
    .withMessage('Reference is required')
    .isString()
    .trim()
];
const getBankPaymentStatusValidation = [
  param('transactionId')
    .notEmpty()
    .withMessage('Transaction ID is required')
    .isString()
    .trim()
];
const sendSMSValidation = [
  body('to')
    .isArray({ min: 1 })
    .withMessage('At least one recipient is required'),
  body('to.*')
    .matches(/^09[0-9]{8}$/)
    .withMessage('Invalid Ethiopian phone number'),
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 1, max: 480 })
    .withMessage('Message must be between 1 and 480 characters')
    .trim(),
  body('senderId')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 11 })
    .withMessage('Sender ID cannot exceed 11 characters')
];
const smsDeliveryWebhookValidation = [
  body('messageId')
    .notEmpty()
    .withMessage('Message ID is required')
    .isString()
    .trim(),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['sent', 'delivered', 'failed'])
    .withMessage('Status must be sent, delivered, or failed'),
  body('reason')
    .optional()
    .isString()
    .trim()
];
const sendEmailValidation = [
  body('to')
    .isArray({ min: 1 })
    .withMessage('At least one recipient is required'),
  body('to.*.email')
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),
  body('to.*.name')
    .optional()
    .isString()
    .trim(),
  body('subject')
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Subject must be between 1 and 200 characters')
    .trim(),
  body('content')
    .notEmpty()
    .withMessage('Email content is required')
    .isString(),
  body('templateId')
    .optional()
    .isString()
    .trim(),
  body('attachments')
    .optional()
    .isArray()
];
const emailBounceWebhookValidation = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email address'),
  body('reason')
    .optional()
    .isString()
    .trim(),
  body('timestamp')
    .optional()
    .isISO8601()
];
const initiateTelebirrPaymentValidation = [
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 1 })
    .withMessage('Amount must be at least 1 ETB'),
  body('phoneNumber')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^09[0-9]{8}$/)
    .withMessage('Invalid Ethiopian phone number'),
  body('orderId')
    .optional()
    .isString()
    .trim(),
  body('invoiceNumber')
    .optional()
    .isString()
    .trim()
];
const verifyTelebirrPaymentValidation = [
  body('transactionId')
    .notEmpty()
    .withMessage('Transaction ID is required')
    .isString()
    .trim()
];
const initiateCBEPaymentValidation = [
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 1 }),
  body('accountNumber')
    .optional()
    .isString()
    .trim(),
  body('orderId')
    .optional()
    .isString()
    .trim()
];
const cbeWebhookValidation = [
  header('x-cbe-signature')
    .notEmpty()
    .withMessage('CBE signature is required'),
  body('transactionId')
    .notEmpty()
    .withMessage('Transaction ID is required')
    .isString(),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isString()
];
const initiateDashenPaymentValidation = [
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 1 }),
  body('orderId')
    .optional()
    .isString()
    .trim()
];
const dashenWebhookValidation = [
  header('x-dashen-signature')
    .notEmpty()
    .withMessage('Dashen signature is required'),
  body('reference')
    .notEmpty()
    .withMessage('Reference is required')
    .isString(),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isString()
];
const initiateAwashPaymentValidation = [
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 1 }),
  body('orderId')
    .optional()
    .isString()
    .trim()
];
const awashWebhookValidation = [
  header('x-awash-signature')
    .notEmpty()
    .withMessage('Awash signature is required'),
  body('transactionRef')
    .notEmpty()
    .withMessage('Transaction reference is required')
    .isString(),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isString()
];
const retryFailedCommunicationsValidation = [
  body('type')
    .optional()
    .isIn(['email', 'sms'])
    .withMessage('Type must be email or sms'),
  body('maxRetries')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Max retries must be between 1 and 5')
    .toInt()
];
module.exports = {
  initiateBankPaymentValidation,
  bankWebhookValidation,
  getBankPaymentStatusValidation,
  sendSMSValidation,
  smsDeliveryWebhookValidation,
  sendEmailValidation,
  emailBounceWebhookValidation,
  initiateTelebirrPaymentValidation,
  verifyTelebirrPaymentValidation,
  initiateCBEPaymentValidation,
  cbeWebhookValidation,
  initiateDashenPaymentValidation,
  dashenWebhookValidation,
  initiateAwashPaymentValidation,
  awashWebhookValidation,
  retryFailedCommunicationsValidation
};
