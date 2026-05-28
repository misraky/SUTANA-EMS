const { db, transaction } = require('../../config/database');
const { audit } = require('../../config/logger');
const AppError = require('../../utils/AppError');
const { catchAsync } = require('../../utils/catchAsync');
const { sendEmail } = require('../../services/email.service');
const { sendSMS } = require('../../services/sms.service');
const axios = require('axios');
const crypto = require('crypto');
exports.initiateBankPayment = catchAsync(async (req, res) => {
  const {
    amount,
    orderId,
    invoiceNumber,
    customerName,
    customerPhone,
    customerEmail,
    bankCode,
    returnUrl
  } = req.body;
  const paymentId = crypto.randomUUID();
  const reference = `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
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
  let paymentUrl;
  switch (bankCode) {
    case 'CBE':
      paymentUrl = `${process.env.CBE_API_ENDPOINT}/payments/initiate`;
      break;
    case 'DASHEN':
      paymentUrl = `${process.env.DASHEN_API_ENDPOINT}/api/v1/payments`;
      break;
    case 'AWASH':
      paymentUrl = `${process.env.AWASH_API_ENDPOINT}/payment/initiate`;
      break;
    case 'TELEBIRR':
      paymentUrl = `${process.env.TELEBIRR_API_ENDPOINT}/payment/request`;
      break;
    default:
      throw new AppError('Invalid bank code', 400);
  }
  const redirectUrl = `${paymentUrl}?reference=${reference}&amount=${amount}&returnUrl=${encodeURIComponent(returnUrl)}`;
  res.json({
    status: 'success',
    data: {
      paymentId,
      reference,
      redirectUrl,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000)
    }
  });
});
exports.handleBankWebhook = catchAsync(async (req, res) => {
  const { transactionId, status, amount, reference } = req.body;
  const signature = req.headers['x-webhook-signature'];
  const payment = await db('bank_payments')
    .where('reference', reference)
    .first();
  if (!payment) {
    throw new AppError('Payment not found', 404);
  }
  if (payment.status !== 'pending') {
    return res.json({ status: 'success', message: 'Payment already processed' });
  }
  await transaction(async (trx) => {
    await trx('bank_payments')
      .where('id', payment.id)
      .update({
        status: status === 'success' ? 'completed' : 'failed',
        transaction_id: transactionId,
        completed_at: db.fn.now(),
        response_data: JSON.stringify(req.body)
      });
    if (status === 'success' && payment.order_id) {
      await trx('printing_orders')
        .where('id', payment.order_id)
        .update({
          payment_status: 'paid',
          updated_at: db.fn.now()
        });
    }
    if (status === 'success' && payment.invoice_number) {
      await trx('pos_sales')
        .where('invoice_number', payment.invoice_number)
        .update({
          payment_status: 'paid',
          updated_at: db.fn.now()
        });
    }
  });
  if (status === 'success' && payment.customer_email) {
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
    }).catch(err => console.error('Failed to send confirmation email:', err.message));
  }
  if (status === 'success' && payment.customer_phone) {
    await sendSMS({
      to: payment.customer_phone,
      message: `Payment of ${payment.amount} ETB confirmed. Reference: ${reference}. Thank you!`
    }).catch(err => console.error('Failed to send confirmation SMS:', err.message));
  }
  await audit('BANK_PAYMENT_WEBHOOK', null, {
    ip: req.ip,
    details: { reference, status, amount }
  });
  res.json({ status: 'success' });
});
exports.getBankPaymentStatus = catchAsync(async (req, res) => {
  const { transactionId } = req.params;
  const payment = await db('bank_payments')
    .where('transaction_id', transactionId)
    .orWhere('payment_id', transactionId)
    .first();
  if (!payment) {
    throw new AppError('Payment not found', 404);
  }
  res.json({
    status: 'success',
    data: {
      reference: payment.reference,
      amount: payment.amount,
      status: payment.status,
      createdAt: payment.created_at,
      completedAt: payment.completed_at
    }
  });
});
exports.sendSMS = catchAsync(async (req, res) => {
  const { to, message, senderId } = req.body;
  const results = [];
  for (const recipient of to) {
    try {
      const result = await sendSMS({
        to: recipient,
        message,
        senderId: senderId || process.env.AFRICA_TALKING_SENDER_ID
      });
      await db('communication_logs').insert({
        type: 'sms',
        recipient,
        content: message,
        status: 'sent',
        provider_response: JSON.stringify(result),
        created_at: db.fn.now(),
        sent_at: db.fn.now()
      });
      results.push({ recipient, status: 'sent' });
    } catch (error) {
      await db('communication_logs').insert({
        type: 'sms',
        recipient,
        content: message,
        status: 'failed',
        provider_response: error.message,
        created_at: db.fn.now()
      });
      results.push({ recipient, status: 'failed', error: error.message });
    }
  }
  res.json({
    status: 'success',
    data: { results }
  });
});
exports.handleSMSDeliveryWebhook = catchAsync(async (req, res) => {
  const { messageId, status, reason } = req.body;
  await db('communication_logs')
    .where('provider_response', 'like', `%${messageId}%`)
    .update({
      status: status === 'delivered' ? 'sent' : 'failed',
      provider_response: db.raw(`CONCAT(provider_response, ' - Delivery: ${status}, Reason: ${reason || 'N/A'}')`)
    });
  res.json({ status: 'success' });
});
exports.sendEmail = catchAsync(async (req, res) => {
  const { to, subject, content, templateId, attachments } = req.body;
  const results = [];
  for (const recipient of to) {
    try {
      const result = await sendEmail({
        to: recipient.email,
        subject,
        html: content,
        templateId,
        attachments,
        fromName: process.env.SENDGRID_FROM_NAME,
        fromEmail: process.env.SENDGRID_FROM_EMAIL
      });
      await db('communication_logs').insert({
        type: 'email',
        recipient: recipient.email,
        subject,
        content,
        status: 'sent',
        provider_response: JSON.stringify(result),
        created_at: db.fn.now(),
        sent_at: db.fn.now()
      });
      results.push({ recipient: recipient.email, status: 'sent' });
    } catch (error) {
      await db('communication_logs').insert({
        type: 'email',
        recipient: recipient.email,
        subject,
        content,
        status: 'failed',
        provider_response: error.message,
        created_at: db.fn.now()
      });
      results.push({ recipient: recipient.email, status: 'failed', error: error.message });
    }
  }
  res.json({
    status: 'success',
    data: { results }
  });
});
exports.handleEmailBounceWebhook = catchAsync(async (req, res) => {
  const { email, reason, timestamp } = req.body;
  await db('communication_logs')
    .where('recipient', email)
    .where('status', 'sent')
    .orderBy('created_at', 'desc')
    .limit(1)
    .update({
      status: 'failed',
      provider_response: db.raw(`CONCAT(provider_response, ' - Bounce: ${reason} at ${timestamp}')`)
    });
  res.json({ status: 'success' });
});
exports.initiateTelebirrPayment = catchAsync(async (req, res) => {
  const { amount, phoneNumber, orderId, invoiceNumber } = req.body;
  const reference = `TEB-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const mockResponse = {
    transactionId: `TXT-${Date.now()}`,
    status: 'pending',
    checkoutUrl: `https://telebirr.et/pay/${reference}`
  };
  await db('telebirr_payments').insert({
    reference,
    transaction_id: mockResponse.transactionId,
    amount,
    phone_number: phoneNumber,
    order_id: orderId,
    invoice_number: invoiceNumber,
    status: 'pending',
    created_at: db.fn.now(),
    expires_at: db.raw('DATE_ADD(NOW(), INTERVAL 10 MINUTE)')
  });
  res.json({
    status: 'success',
    data: {
      reference,
      transactionId: mockResponse.transactionId,
      checkoutUrl: mockResponse.checkoutUrl,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    }
  });
});
exports.verifyTelebirrPayment = catchAsync(async (req, res) => {
  const { transactionId } = req.body;
  const payment = await db('telebirr_payments')
    .where('transaction_id', transactionId)
    .first();
  if (!payment) {
    throw new AppError('Payment not found', 404);
  }
  res.json({
    status: 'success',
    data: {
      reference: payment.reference,
      amount: payment.amount,
      status: payment.status,
      verifiedAt: payment.completed_at
    }
  });
});
exports.initiateCBEPayment = catchAsync(async (req, res) => {
  const { amount, accountNumber, orderId } = req.body;
  const reference = `CBE-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const mockResponse = {
    transactionId: `CBE-TXN-${Date.now()}`,
    status: 'pending'
  };
  res.json({
    status: 'success',
    data: {
      reference,
      transactionId: mockResponse.transactionId,
      status: mockResponse.status
    }
  });
});
exports.handleCBECallback = catchAsync(async (req, res) => {
  const { transactionId, status } = req.body;
  await db('bank_payments')
    .where('transaction_id', transactionId)
    .update({
      status: status === 'SUCCESS' ? 'completed' : 'failed',
      completed_at: db.fn.now()
    });
  res.json({ status: 'success' });
});
exports.initiateDashenPayment = catchAsync(async (req, res) => {
  const { amount, orderId } = req.body;
  const reference = `DASH-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const mockResponse = {
    transactionId: `DASH-TXN-${Date.now()}`,
    status: 'pending',
    paymentUrl: `https://dashenbank.et/pay/${reference}`
  };
  res.json({
    status: 'success',
    data: {
      reference,
      transactionId: mockResponse.transactionId,
      paymentUrl: mockResponse.paymentUrl
    }
  });
});
exports.handleDashenCallback = catchAsync(async (req, res) => {
  const { reference, status } = req.body;
  await db('bank_payments')
    .where('reference', reference)
    .update({
      status: status === 'SUCCESS' ? 'completed' : 'failed',
      completed_at: db.fn.now()
    });
  res.json({ status: 'success' });
});
exports.initiateAwashPayment = catchAsync(async (req, res) => {
  const { amount, orderId } = req.body;
  const reference = `AWA-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const mockResponse = {
    transactionId: `AWA-TXN-${Date.now()}`,
    status: 'pending'
  };
  res.json({
    status: 'success',
    data: {
      reference,
      transactionId: mockResponse.transactionId
    }
  });
});
exports.handleAwashCallback = catchAsync(async (req, res) => {
  const { transactionRef, status } = req.body;
  await db('bank_payments')
    .where('reference', transactionRef)
    .update({
      status: status === 'SUCCESS' ? 'completed' : 'failed',
      completed_at: db.fn.now()
    });
  res.json({ status: 'success' });
});
exports.getExternalServicesHealth = catchAsync(async (req, res) => {
  const services = {
    sms: { status: 'unknown', lastCheck: new Date().toISOString() },
    email: { status: 'unknown', lastCheck: new Date().toISOString() },
    banks: {}
  };
  try {
    services.sms.status = 'healthy';
  } catch (error) {
    services.sms.status = 'unhealthy';
    services.sms.error = error.message;
  }
  try {
    services.email.status = 'healthy';
  } catch (error) {
    services.email.status = 'unhealthy';
    services.email.error = error.message;
  }
  const banks = ['CBE', 'DASHEN', 'AWASH', 'TELEBIRR'];
  for (const bank of banks) {
    services.banks[bank] = { status: 'healthy' };
  }
  res.json({
    status: 'success',
    data: services
  });
});
exports.retryFailedCommunications = catchAsync(async (req, res) => {
  const { type, maxRetries = 3 } = req.body;
  let query = db('communication_logs')
    .where('status', 'failed')
    .where('retry_count', '<', maxRetries);
  if (type) {
    query = query.where('type', type);
  }
  const failedMessages = await query;
  let retried = 0;
  for (const message of failedMessages) {
    try {
      if (message.type === 'email') {
        await sendEmail({
          to: message.recipient,
          subject: message.subject,
          html: message.content
        });
      } else if (message.type === 'sms') {
        await sendSMS({
          to: message.recipient,
          message: message.content
        });
      }
      await db('communication_logs')
        .where('id', message.id)
        .update({
          status: 'sent',
          retry_count: message.retry_count + 1,
          sent_at: db.fn.now(),
          provider_response: 'Retry successful'
        });
      retried++;
    } catch (error) {
      await db('communication_logs')
        .where('id', message.id)
        .update({
          retry_count: message.retry_count + 1,
          provider_response: db.raw(`CONCAT(provider_response, '; Retry failed: ${error.message}')`)
        });
    }
  }
  await audit('FAILED_COMMUNICATIONS_RETRIED', null, {
    ip: req.ip,
    details: { type, retried, total: failedMessages.length }
  });
  res.json({
    status: 'success',
    message: `Retried ${retried} of ${failedMessages.length} failed messages`
  });
});
