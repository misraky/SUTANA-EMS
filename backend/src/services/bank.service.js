const axios = require('axios');
const crypto = require('crypto');
const config = require('../config/env');
const { db, transaction } = require('../config/database');
const { logger } = require('../config/logger');
const { encrypt, decrypt } = require('../utils/encryption');
const { sendEmail } = require('./email.service');
const { sendSMS } = require('./sms.service');
const BANK_CONFIGS = {
  CBE: {
    name: 'Commercial Bank of Ethiopia',
    code: 'CBE',
    apiEndpoint: config.integrations.cbe.endpoint,
    webhookSecret: config.integrations.cbe.webhookSecret,
    timeout: 30000,
    currency: 'ETB'
  },
  DASHEN: {
    name: 'Dashen Bank',
    code: 'DASHEN',
    apiEndpoint: config.integrations.dashen.endpoint,
    webhookSecret: config.integrations.dashen.webhookSecret,
    timeout: 30000,
    currency: 'ETB'
  },
  AWASH: {
    name: 'Awash Bank',
    code: 'AWASH',
    apiEndpoint: config.integrations.awash.endpoint,
    webhookSecret: config.integrations.awash.webhookSecret,
    timeout: 30000,
    currency: 'ETB'
  },
  TELEBIRR: {
    name: 'Telebirr',
    code: 'TELEBIRR',
    apiEndpoint: config.integrations.telebirr.endpoint,
    webhookSecret: config.integrations.telebirr.webhookSecret,
    timeout: 30000,
    currency: 'ETB'
  }
};
const initBankService = async () => {
  logger.info('✅ Bank service initialized');
  return true;
};
const generateTransactionReference = (bankCode) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${bankCode}-${timestamp}-${random}`;
};
const generateWebhookSignature = (payload, secret) => {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
};
const verifyWebhookSignature = (payload, signature, secret) => {
  const expectedSignature = generateWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};
const initiatePayment = async (paymentData) => {
  const {
    amount,
    orderId,
    invoiceNumber,
    customerName,
    customerPhone,
    customerEmail,
    bankCode,
    returnUrl
  } = paymentData;
  const bankConfig = BANK_CONFIGS[bankCode];
  if (!bankConfig) {
    throw new Error(`Unsupported bank: ${bankCode}`);
  }
  if (!config.integrations[bankCode.toLowerCase()]?.enabled) {
    throw new Error(`${bankConfig.name} integration is not enabled`);
  }
  const reference = generateTransactionReference(bankCode);
  const paymentId = crypto.randomUUID();
  await db('bank_payments').insert({
    payment_id: paymentId,
    reference,
    amount,
    order_id: orderId,
    invoice_number: invoiceNumber,
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_email: customerEmail,
    bank_code: bankCode,
    status: 'pending',
    created_at: db.fn.now(),
    expires_at: db.raw('DATE_ADD(NOW(), INTERVAL 30 MINUTE)')
  });
  let redirectUrl;
  let transactionId;
  try {
    const decryptedApiKey = decrypt(config.integrations[bankCode.toLowerCase()].apiKey);
    switch (bankCode) {
      case 'CBE':
        const cbeResponse = await initiateCBEPayment(amount, reference, customerName, customerPhone, returnUrl, decryptedApiKey);
        redirectUrl = cbeResponse.redirectUrl;
        transactionId = cbeResponse.transactionId;
        break;
      case 'DASHEN':
        const dashenResponse = await initiateDashenPayment(amount, reference, customerName, customerPhone, returnUrl, decryptedApiKey);
        redirectUrl = dashenResponse.redirectUrl;
        transactionId = dashenResponse.transactionId;
        break;
      case 'AWASH':
        const awashResponse = await initiateAwashPayment(amount, reference, customerName, customerPhone, returnUrl, decryptedApiKey);
        redirectUrl = awashResponse.redirectUrl;
        transactionId = awashResponse.transactionId;
        break;
      case 'TELEBIRR':
        const telebirrResponse = await initiateTelebirrPayment(amount, reference, customerPhone, returnUrl, decryptedApiKey);
        redirectUrl = telebirrResponse.redirectUrl;
        transactionId = telebirrResponse.transactionId;
        break;
      default:
        throw new Error(`Unsupported bank: ${bankCode}`);
    }
    await db('bank_payments')
      .where('payment_id', paymentId)
      .update({ transaction_id: transactionId });
    return {
      paymentId,
      reference,
      transactionId,
      redirectUrl,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000)
    };
  } catch (error) {
    logger.error(`${bankCode} payment initiation failed:`, error.message);
    await db('bank_payments')
      .where('payment_id', paymentId)
      .update({ 
        status: 'failed',
        response_data: JSON.stringify({ error: error.message })
      });
    throw new Error(`Payment initiation failed: ${error.message}`);
  }
};
const initiateCBEPayment = async (amount, reference, customerName, customerPhone, returnUrl, apiKey) => {
  const transactionId = `CBE-TXN-${Date.now()}`;
  const redirectUrl = `https://sandbox.cbe.com.et/pay?ref=${reference}&amount=${amount}&returnUrl=${encodeURIComponent(returnUrl)}`;
  return { redirectUrl, transactionId };
};
const initiateDashenPayment = async (amount, reference, customerName, customerPhone, returnUrl, apiKey) => {
  const transactionId = `DASH-TXN-${Date.now()}`;
  const redirectUrl = `https://sandbox.dashenbank.et/pay?ref=${reference}&amount=${amount}&returnUrl=${encodeURIComponent(returnUrl)}`;
  return { redirectUrl, transactionId };
};
const initiateAwashPayment = async (amount, reference, customerName, customerPhone, returnUrl, apiKey) => {
  const transactionId = `AWA-TXN-${Date.now()}`;
  const redirectUrl = `https://sandbox.awashbank.com/pay?ref=${reference}&amount=${amount}&returnUrl=${encodeURIComponent(returnUrl)}`;
  return { redirectUrl, transactionId };
};
const initiateTelebirrPayment = async (amount, reference, customerPhone, returnUrl, apiKey) => {
  const transactionId = `TEB-TXN-${Date.now()}`;
  const redirectUrl = `https://sandbox.telebirr.et/pay?ref=${reference}&amount=${amount}&phone=${customerPhone}&returnUrl=${encodeURIComponent(returnUrl)}`;
  return { redirectUrl, transactionId };
};
const handleBankWebhook = async (webhookData, signature, bankCode) => {
  const bankConfig = BANK_CONFIGS[bankCode];
  if (!bankConfig) {
    throw new Error(`Unsupported bank: ${bankCode}`);
  }
  const isValid = verifyWebhookSignature(webhookData, signature, bankConfig.webhookSecret);
  if (!isValid) {
    logger.warn(`Invalid webhook signature from ${bankCode}`);
    throw new Error('Invalid webhook signature');
  }
  const { transactionId, status, amount, reference } = webhookData;
  const payment = await db('bank_payments')
    .where('reference', reference)
    .orWhere('transaction_id', transactionId)
    .first();
  if (!payment) {
    logger.warn(`Payment not found for reference: ${reference}`);
    return { processed: false, message: 'Payment not found' };
  }
  if (payment.status !== 'pending') {
    logger.info(`Payment ${payment.reference} already processed: ${payment.status}`);
    return { processed: true, message: 'Already processed' };
  }
  const newStatus = status === 'success' ? 'completed' : 'failed';
  await transaction(async (trx) => {
    await trx('bank_payments')
      .where('id', payment.id)
      .update({
        status: newStatus,
        transaction_id: transactionId,
        completed_at: db.fn.now(),
        response_data: JSON.stringify(webhookData)
      });
    if (newStatus === 'completed' && payment.order_id) {
      await trx('printing_orders')
        .where('id', payment.order_id)
        .update({
          payment_status: 'paid',
          updated_at: db.fn.now()
        });
    }
    if (newStatus === 'completed' && payment.invoice_number) {
      await trx('pos_sales')
        .where('invoice_number', payment.invoice_number)
        .update({
          payment_status: 'paid',
          updated_at: db.fn.now()
        });
    }
  });
  if (newStatus === 'completed') {
    if (payment.customer_email) {
      await sendEmail({
        to: payment.customer_email,
        subject: `Payment Confirmation - ${reference}`,
        template: 'payment-confirmation',
        data: {
          customerName: payment.customer_name,
          amount: payment.amount,
          reference,
          date: new Date().toISOString()
        }
      }).catch(err => logger.error('Failed to send payment confirmation email:', err.message));
    }
    if (payment.customer_phone) {
      await sendSMS({
        to: payment.customer_phone,
        message: `Payment of ${payment.amount} ETB confirmed. Reference: ${reference}. Thank you!`
      }).catch(err => logger.error('Failed to send payment confirmation SMS:', err.message));
    }
  }
  logger.info(`Bank payment webhook processed: ${reference} -> ${newStatus}`);
  return {
    processed: true,
    reference: payment.reference,
    status: newStatus,
    amount: payment.amount
  };
};
const getPaymentStatus = async (transactionId) => {
  const payment = await db('bank_payments')
    .where('transaction_id', transactionId)
    .orWhere('reference', transactionId)
    .first();
  if (!payment) {
    throw new Error('Payment not found');
  }
  return {
    reference: payment.reference,
    amount: payment.amount,
    status: payment.status,
    bankCode: payment.bank_code,
    createdAt: payment.created_at,
    completedAt: payment.completed_at,
    customerName: payment.customer_name,
    customerPhone: payment.customer_phone,
    customerEmail: payment.customer_email
  };
};
const verifyTelebirrPayment = async (transactionId) => {
  const payment = await db('bank_payments')
    .where('transaction_id', transactionId)
    .first();
  if (!payment) {
    throw new Error('Payment not found');
  }
  return {
    reference: payment.reference,
    amount: payment.amount,
    status: payment.status,
    verifiedAt: payment.completed_at
  };
};
const getPayments = async (filters) => {
  const { page = 1, limit = 25, status, bankCode, startDate, endDate } = filters;
  const offset = (page - 1) * limit;
  let query = db('bank_payments');
  if (status) {
    query = query.where('status', status);
  }
  if (bankCode) {
    query = query.where('bank_code', bankCode);
  }
  if (startDate && endDate) {
    query = query.whereBetween('created_at', [startDate, endDate]);
  }
  const total = await query.clone().count('id as total').first();
  const payments = await query
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset);
  const summary = await db('bank_payments')
    .where(function() {
      if (status) this.where('status', status);
      if (bankCode) this.where('bank_code', bankCode);
      if (startDate && endDate) this.whereBetween('created_at', [startDate, endDate]);
    })
    .select(
      db.raw('SUM(amount) as total_amount'),
      db.raw('COUNT(*) as total_count'),
      db.raw('SUM(CASE WHEN status = "completed" THEN amount ELSE 0 END) as completed_amount'),
      db.raw('SUM(CASE WHEN status = "failed" THEN amount ELSE 0 END) as failed_amount')
    )
    .first();
  return {
    payments,
    summary: {
      totalAmount: parseFloat(summary?.total_amount || 0),
      totalCount: parseInt(summary?.total_count || 0),
      completedAmount: parseFloat(summary?.completed_amount || 0),
      failedAmount: parseFloat(summary?.failed_amount || 0)
    },
    pagination: {
      page,
      limit,
      total: parseInt(total.total),
      totalPages: Math.ceil(total.total / limit)
    }
  };
};
const getBankStatus = () => {
  return {
    CBE: {
      enabled: config.integrations.cbe.enabled,
      name: 'Commercial Bank of Ethiopia',
      endpoint: config.integrations.cbe.endpoint
    },
    DASHEN: {
      enabled: config.integrations.dashen.enabled,
      name: 'Dashen Bank',
      endpoint: config.integrations.dashen.endpoint
    },
    AWASH: {
      enabled: config.integrations.awash.enabled,
      name: 'Awash Bank',
      endpoint: config.integrations.awash.endpoint
    },
    TELEBIRR: {
      enabled: config.integrations.telebirr.enabled,
      name: 'Telebirr',
      endpoint: config.integrations.telebirr.endpoint
    }
  };
};
const getPaymentStats = async (days = 30) => {
  const stats = await db('bank_payments')
    .where('created_at', '>=', db.raw(`DATE_SUB(NOW(), INTERVAL ${days} DAY)`))
    .select(
      db.raw('COUNT(*) as total'),
      db.raw('SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed'),
      db.raw('SUM(CASE WHEN status = "failed" THEN 1 ELSE 0 END) as failed'),
      db.raw('SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending'),
      db.raw('SUM(amount) as total_amount'),
      db.raw('SUM(CASE WHEN status = "completed" THEN amount ELSE 0 END) as completed_amount')
    )
    .first();
  const byBank = await db('bank_payments')
    .where('created_at', '>=', db.raw(`DATE_SUB(NOW(), INTERVAL ${days} DAY)`))
    .select('bank_code', db.raw('COUNT(*) as count'), db.raw('SUM(amount) as total_amount'))
    .groupBy('bank_code');
  return {
    period: `${days} days`,
    totals: {
      total: parseInt(stats?.total || 0),
      completed: parseInt(stats?.completed || 0),
      failed: parseInt(stats?.failed || 0),
      pending: parseInt(stats?.pending || 0),
      totalAmount: parseFloat(stats?.total_amount || 0),
      completedAmount: parseFloat(stats?.completed_amount || 0),
      successRate: stats?.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : 0
    },
    byBank
  };
};
module.exports = {
  initBankService,
  initiatePayment,
  handleBankWebhook,
  getPaymentStatus,
  verifyTelebirrPayment,
  getPayments,
  getBankStatus,
  getPaymentStats,
  BANK_CONFIGS,
  generateTransactionReference,
  verifyWebhookSignature
};
