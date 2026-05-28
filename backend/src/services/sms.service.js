const axios = require('axios');
const crypto = require('crypto');
const config = require('../config/env');
const { db } = require('../config/database');
const { logger } = require('../config/logger');
const { encrypt, decrypt } = require('../utils/encryption');
const smsQueue = [];
const MAX_RETRIES = 5;
const RETRY_DELAYS = [300, 600, 1200, 2400, 4800]; 
const RATE_LIMIT_PER_SECOND = 10;
let requestTimestamps = [];
const initSmsService = async () => {
  logger.info('✅ SMS service initialized');
  return true;
};
const validatePhoneNumber = (phone) => {
  const ethiopianRegex = /^09[0-9]{8}$/;
  return ethiopianRegex.test(phone);
};
const formatPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  // Ethiopian format: 09xxxxxxxx -> 256xxxxxxxx
  if (cleaned.startsWith('09') && cleaned.length === 10) {
    return `256${cleaned.substring(1)}`;
  }
  return cleaned;
};
const applyRateLimit = async () => {
  const now = Date.now();
  const oneSecondAgo = now - 1000;
  requestTimestamps = requestTimestamps.filter(ts => ts > oneSecondAgo);
  if (requestTimestamps.length >= RATE_LIMIT_PER_SECOND) {
    const oldestTimestamp = requestTimestamps[0];
    const waitTime = 1000 - (now - oldestTimestamp);
    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    return applyRateLimit();
  }
  requestTimestamps.push(now);
};
const sendSMS = async (options) => {
  const { to, message, senderId = config.integrations.africaTalking.senderId } = options;
  if (!config.integrations.africaTalking.enabled) {
    logger.info(`SMS disabled. Would send to ${to}: ${message.substring(0, 50)}...`);
    return { mock: true, to, message: message.substring(0, 50) };
  }
  const recipients = Array.isArray(to) ? to : [to];
  const validRecipients = [];
  const invalidRecipients = [];
  for (const recipient of recipients) {
    if (validatePhoneNumber(recipient)) {
      validRecipients.push(formatPhoneNumber(recipient));
    } else {
      invalidRecipients.push(recipient);
      logger.warn(`Invalid phone number format: ${recipient}`);
    }
  }
  if (validRecipients.length === 0) {
    throw new Error('No valid phone numbers provided');
  }
  await applyRateLimit();
  const payload = {
    username: config.integrations.africaTalking.username,
    to: validRecipients.join(','),
    message: message.substring(0, 480), 
    from: senderId || config.integrations.africaTalking.senderId
  };
  try {
    const decryptedApiKey = decrypt(config.integrations.africaTalking.apiKey);
    const response = await axios.post(
      `${config.integrations.africaTalking.endpoint}/messaging`,
      new URLSearchParams(payload),
      {
        headers: {
          'apiKey': decryptedApiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 30000
      }
    );
    for (const recipient of validRecipients) {
      await logSmsCommunication(recipient, message, 'sent', response.status);
    }
    for (const recipient of invalidRecipients) {
      await logSmsCommunication(recipient, message, 'failed', 'Invalid phone number');
    }
    logger.info(`SMS sent to ${validRecipients.length} recipient(s): ${message.substring(0, 50)}...`);
    return { success: true, recipients: validRecipients, invalid: invalidRecipients, response: response.data };
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message || error.message;
    logger.error(`SMS send failed: ${errorMessage}`);
    for (const recipient of validRecipients) {
      await logSmsCommunication(recipient, message, 'failed', errorMessage);
    }
    await queueSmsForRetry({
      to: validRecipients,
      message,
      senderId
    });
    throw new Error(`SMS send failed: ${errorMessage}`);
  }
};
const queueSmsForRetry = async (smsData) => {
  smsQueue.push({
    ...smsData,
    retryCount: 0,
    queuedAt: new Date().toISOString()
  });
  logger.info(`SMS queued for retry. Queue size: ${smsQueue.length}`);
};
const processSmsRetryQueue = async () => {
  let processed = 0;
  const now = Date.now();
  for (let i = smsQueue.length - 1; i >= 0; i--) {
    const sms = smsQueue[i];
    const queuedTime = new Date(sms.queuedAt).getTime();
    const nextRetryDelay = RETRY_DELAYS[sms.retryCount] * 1000;
    if (now - queuedTime >= nextRetryDelay) {
      try {
        await sendSMS({
          to: sms.to,
          message: sms.message,
          senderId: sms.senderId
        });
        smsQueue.splice(i, 1);
        processed++;
      } catch (error) {
        sms.retryCount++;
        sms.lastAttemptAt = new Date().toISOString();
        if (sms.retryCount >= MAX_RETRIES) {
          logger.error(`SMS permanently failed after ${MAX_RETRIES} retries: ${sms.to}`);
          for (const recipient of sms.to) {
            await logSmsCommunication(recipient, sms.message, 'permanently_failed', 'Max retries exceeded');
          }
          smsQueue.splice(i, 1);
        }
      }
    }
  }
  if (processed > 0) {
    logger.info(`Processed ${processed} SMS from retry queue`);
  }
  return processed;
};
const logSmsCommunication = async (recipient, message, status, response) => {
  try {
    await db('communication_logs').insert({
      type: 'sms',
      recipient,
      content: message.substring(0, 1000),
      status,
      provider_response: typeof response === 'string' ? response : JSON.stringify(response),
      retry_count: 0,
      created_at: db.fn.now(),
      sent_at: status === 'sent' ? db.fn.now() : null
    });
  } catch (error) {
    logger.error('Failed to log SMS communication:', error.message);
  }
};
const sendOrderConfirmationSMS = async (phone, orderNumber, totalPrice, dueDate) => {
  const message = `Order ${orderNumber} confirmed. Total: ${totalPrice} ETB. Due date: ${dueDate}. Track at: ${config.frontendUrl}/track`;
  return sendSMS({ to: phone, message });
};
const sendOrderStatusUpdateSMS = async (phone, orderNumber, status) => {
  const statusMessage = status === 'ready' 
    ? 'Your order is ready for pickup!' 
    : status === 'delivered' 
      ? 'Your order has been delivered. Thank you!' 
      : `Your order is now ${status}`;
  const message = `Order ${orderNumber}: ${statusMessage}`;
  return sendSMS({ to: phone, message });
};
const sendPaymentConfirmationSMS = async (phone, amount, reference) => {
  const message = `Payment of ${amount} ETB confirmed. Reference: ${reference}. Thank you!`;
  return sendSMS({ to: phone, message });
};
const sendLowStockAlertSMS = async (phone, productName, currentStock, reorderLevel) => {
  const message = `ALERT: ${productName} is low on stock! Current: ${currentStock}, Reorder level: ${reorderLevel}. Please restock immediately.`;
  return sendSMS({ to: phone, message });
};
const sendWelcomeSMS = async (phone, name, email) => {
  const message = `Welcome ${name} to Sutana EMS! Use email ${email} and the temporary password sent to your email to login.`;
  return sendSMS({ to: phone, message });
};
const sendOverdueReminderSMS = async (phone, customerName, amount, daysOverdue) => {
  const message = `Dear ${customerName}, your payment of ${amount} ETB is ${daysOverdue} days overdue. Please settle your account to avoid service interruption.`;
  return sendSMS({ to: phone, message });
};
const sendBulkSMS = async (recipients, message) => {
  const results = {
    total: recipients.length,
    sent: 0,
    failed: 0,
    errors: []
  };
  const batchSize = 100;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    try {
      await sendSMS({ to: batch, message });
      results.sent += batch.length;
    } catch (error) {
      results.failed += batch.length;
      results.errors.push({ batch: i / batchSize, error: error.message });
    }
    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return results;
};
const testSMSConfig = async (testPhone) => {
  const message = 'Sutana EMS - SMS configuration test. Your SMS service is working correctly!';
  return sendSMS({ to: testPhone, message });
};
const getSMSStats = async (days = 7) => {
  const stats = await db('communication_logs')
    .where('type', 'sms')
    .where('created_at', '>=', db.raw(`DATE_SUB(NOW(), INTERVAL ${days} DAY)`))
    .select(
      db.raw('COUNT(*) as total'),
      db.raw('SUM(CASE WHEN status = "sent" THEN 1 ELSE 0 END) as sent'),
      db.raw('SUM(CASE WHEN status = "failed" THEN 1 ELSE 0 END) as failed')
    )
    .first();
  return {
    total: parseInt(stats?.total || 0),
    sent: parseInt(stats?.sent || 0),
    failed: parseInt(stats?.failed || 0),
    successRate: stats?.total > 0 ? ((stats.sent / stats.total) * 100).toFixed(1) : 0,
    queueSize: smsQueue.length
  };
};
const verifyWebhookSignature = (payload, signature) => {
  const expectedSignature = crypto
    .createHmac('sha256', config.integrations.africaTalking.apiKey)
    .update(JSON.stringify(payload))
    .digest('hex');
  return signature === expectedSignature;
};
const handleDeliveryWebhook = async (data) => {
  const { messageId, status, reason, recipient } = data;
  await db('communication_logs')
    .where('provider_response', 'like', `%${messageId}%`)
    .orWhere('recipient', recipient)
    .update({
      status: status === 'delivered' ? 'sent' : 'failed',
      provider_response: db.raw(`CONCAT(provider_response, ' - Delivery: ${status}, Reason: ${reason || 'N/A'}')`)
    });
  logger.info(`SMS delivery webhook processed for ${recipient}: ${status}`);
};
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    processSmsRetryQueue().catch(err => logger.error('SMS retry processor error:', err.message));
  }, 60000);
}
module.exports = {
  initSmsService,
  sendSMS,
  sendOrderConfirmationSMS,
  sendOrderStatusUpdateSMS,
  sendPaymentConfirmationSMS,
  sendLowStockAlertSMS,
  sendWelcomeSMS,
  sendOverdueReminderSMS,
  sendBulkSMS,
  testSMSConfig,
  getSMSStats,
  validatePhoneNumber,
  formatPhoneNumber,
  processSmsRetryQueue,
  verifyWebhookSignature,
  handleDeliveryWebhook
};
