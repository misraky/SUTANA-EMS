const axios = require('axios');
const config = require('../config/env');
const { db } = require('../config/database');
const { logger } = require('../config/logger');
const { encrypt, decrypt, isEncrypted } = require('../utils/encryption');
const handlebars = require('handlebars');
const path = require('path');
const fs = require('fs');
const TEMPLATES_DIR = path.join(__dirname, '../templates/email');
const emailQueue = [];
const MAX_RETRIES = 5;
const RETRY_DELAYS = [300, 600, 1200, 2400, 4800]; 
const initEmailService = async () => {
  if (!fs.existsSync(TEMPLATES_DIR)) {
    fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
  }
  await createDefaultTemplates();
  logger.info('✅ Email service initialized');
  return true;
};
const createDefaultTemplates = async () => {
  const defaultTemplates = {
    'welcome.html': `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Sutana EMS</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Sutana EMS</h1>
    </div>
    <div class="content">
      <h2>Hello {{name}},</h2>
      <p>Your account has been successfully created.</p>
      <p><strong>Email:</strong> {{email}}</p>
      <p><strong>Temporary Password:</strong> {{temporaryPassword}}</p>
      <p>Please change your password after your first login.</p>
      <a href="{{loginUrl}}" class="button">Login to Your Account</a>
      <p>If you have any questions, please contact our support team.</p>
    </div>
    <div class="footer">
      <p>&copy; 2026 Sutana EMS. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    'password-reset.html': `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Password Reset Request</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    .warning { background: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset Request</h1>
    </div>
    <div class="content">
      <h2>Hello {{name}},</h2>
      <p>We received a request to reset your password.</p>
      <div class="warning">
        <p><strong>⚠️ This link expires in {{expiresIn}}</strong></p>
      </div>
      <a href="{{resetUrl}}" class="button">Reset Your Password</a>
      <p>If you did not request this, please ignore this email.</p>
      <p>Request made from IP: {{ip}}</p>
    </div>
  </div>
</body>
</html>`,
    'order-confirmation.html': `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Order Confirmation</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .order-details { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .total { font-size: 18px; font-weight: bold; color: #10b981; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Confirmation</h1>
    </div>
    <div class="content">
      <h2>Dear {{customerName}},</h2>
      <p>Your order has been confirmed.</p>
      <div class="order-details">
        <p><strong>Order Number:</strong> {{orderNumber}}</p>
        <p><strong>Product Type:</strong> {{productType}}</p>
        <p><strong>Quantity:</strong> {{quantity}}</p>
        <p><strong>Due Date:</strong> {{dueDate}}</p>
        <p class="total"><strong>Total Amount:</strong> {{totalPrice}} ETB</p>
      </div>
      <a href="{{trackUrl}}" class="button">Track Your Order</a>
    </div>
  </div>
</body>
</html>`,
    'order-status-update.html': `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Order Status Update</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #3b82f6; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .status { font-size: 24px; font-weight: bold; color: #3b82f6; margin: 20px 0; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Status Update</h1>
    </div>
    <div class="content">
      <h2>Hello {{customerName}},</h2>
      <p>Your order <strong>{{orderNumber}}</strong> status has been updated to:</p>
      <div class="status">{{status}}</div>
      <p>{{message}}</p>
      <a href="{{trackUrl}}" class="button">Track Your Order</a>
    </div>
  </div>
</body>
</html>`
  };
  for (const [templateName, templateContent] of Object.entries(defaultTemplates)) {
    const templatePath = path.join(TEMPLATES_DIR, templateName);
    if (!fs.existsSync(templatePath)) {
      fs.writeFileSync(templatePath, templateContent);
    }
  }
};
const loadTemplate = (templateName) => {
  const templatePath = path.join(TEMPLATES_DIR, `${templateName}.html`);
  if (!fs.existsSync(templatePath)) {
    logger.warn(`Template not found: ${templateName}, using default`);
    return (data) => `<h1>${templateName}</h1><pre>${JSON.stringify(data, null, 2)}</pre>`;
  }
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  return handlebars.compile(templateContent);
};
const sendEmail = async (options) => {
  const {
    to,
    subject,
    html,
    text,
    template,
    data = {},
    fromEmail = config.email.fromEmail,
    fromName = config.email.fromName
  } = options;
  let finalHtml = html;
  if (template) {
    try {
      const compiledTemplate = loadTemplate(template);
      finalHtml = compiledTemplate(data);
    } catch (error) {
      logger.error(`Template compilation error for ${template}:`, error.message);
      finalHtml = `<h1>${subject}</h1><pre>${JSON.stringify(data, null, 2)}</pre>`;
    }
  }
  if (!config.email.enabled) {
    logger.info(`\n📧 [MOCK EMAIL] To: ${to} | Subject: ${subject}`);
    console.log('\n======================================================');
    console.log(`📧 MOCK EMAIL INTERCEPTED (SendGrid is Disabled)`);
    console.log(`======================================================`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    if (data.resetUrl) {
      logger.info(`🔗 RESET LINK: ${data.resetUrl}`);
      console.log(`\n🔗 COPY THIS RESET LINK:`);
      console.log(`${data.resetUrl}`);
      try {
        const fs = require('fs');
        const path = require('path');
        fs.writeFileSync(
          path.join(process.cwd(), 'LATEST_RESET_LINK.txt'), 
          `LATEST RESET LINK:\n${data.resetUrl}\n\nGenerated at: ${new Date().toLocaleString()}`
        );
      } catch (e) {
        console.error('Failed to write reset link to file');
      }
    } else if (data.temporaryPassword) {
      logger.info(`🔑 TEMP PASSWORD: ${data.temporaryPassword}`);
      console.log(`🔑 TEMP PASSWORD: ${data.temporaryPassword}`);
    } else {
      logger.info(`📝 DATA: ${JSON.stringify(data)}`);
    }
    console.log('======================================================\n');
    return { mock: true, to, subject };
  }
  const payload = {
    personalizations: [
      {
        to: [{ email: to }],
        subject: subject
      }
    ],
    from: { email: fromEmail, name: fromName },
    content: [
      { type: 'text/html', value: finalHtml }
    ]
  };
  if (text) {
    payload.content.push({ type: 'text/plain', value: text });
  }
  try {
    let decryptedApiKey;
    if (config.email.apiKey && isEncrypted(config.email.apiKey)) {
      decryptedApiKey = decrypt(config.email.apiKey);
    } else {
      decryptedApiKey = config.email.apiKey;
    }
    const response = await axios.post(
      `${config.email.endpoint || 'https://api.sendgrid.com/v3'}/mail/send`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${decryptedApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    await logEmailCommunication(to, subject, finalHtml, 'sent', response.status);
    logger.info(`Email sent to ${to}: ${subject}`);
    return { success: true, status: response.status, to, subject };
  } catch (error) {
    const errorMessage = error.response?.data?.errors?.[0]?.message || error.message;
    logger.error(`Email send failed to ${to}: ${errorMessage}`);
    await logEmailCommunication(to, subject, finalHtml, 'failed', errorMessage);
    await queueEmailForRetry({
      to,
      subject,
      html: finalHtml,
      text,
      template,
      data
    });
    throw new Error(`Email send failed: ${errorMessage}`);
  }
};
const queueEmailForRetry = async (emailData) => {
  emailQueue.push({
    ...emailData,
    retryCount: 0,
    queuedAt: new Date().toISOString()
  });
  logger.info(`Email queued for retry. Queue size: ${emailQueue.length}`);
};
const processEmailRetryQueue = async () => {
  let processed = 0;
  const now = Date.now();
  for (let i = emailQueue.length - 1; i >= 0; i--) {
    const email = emailQueue[i];
    const queuedTime = new Date(email.queuedAt).getTime();
    const nextRetryDelay = RETRY_DELAYS[email.retryCount] * 1000;
    if (now - queuedTime >= nextRetryDelay) {
      try {
        await sendEmail({
          to: email.to,
          subject: email.subject,
          html: email.html,
          text: email.text,
          template: email.template,
          data: email.data
        });
        emailQueue.splice(i, 1);
        processed++;
      } catch (error) {
        email.retryCount++;
        email.lastAttemptAt = new Date().toISOString();
        if (email.retryCount >= MAX_RETRIES) {
          logger.error(`Email permanently failed after ${MAX_RETRIES} retries: ${email.to}`);
          await logEmailCommunication(email.to, email.subject, email.html, 'permanently_failed', 'Max retries exceeded');
          emailQueue.splice(i, 1);
        }
      }
    }
  }
  if (processed > 0) {
    logger.info(`Processed ${processed} emails from retry queue`);
  }
  return processed;
};
const logEmailCommunication = async (recipient, subject, content, status, response) => {
  try {
    await db('communication_logs').insert({
      type: 'email',
      recipient,
      subject: subject.substring(0, 500),
      content: content.substring(0, 5000),
      status,
      provider_response: typeof response === 'string' ? response : JSON.stringify(response),
      retry_count: 0,
      created_at: db.fn.now(),
      sent_at: status === 'sent' ? db.fn.now() : null
    });
  } catch (error) {
    logger.error('Failed to log email communication:', error.message);
  }
};
const sendWelcomeEmail = async (user, temporaryPassword) => {
  return sendEmail({
    to: user.email,
    subject: 'Welcome to Sutana EMS',
    template: 'welcome',
    data: {
      name: user.full_name,
      email: user.email,
      temporaryPassword,
      loginUrl: `${config.cors.frontendUrl}/login`
    }
  });
};
const sendPasswordResetEmail = async (user, resetToken, ip) => {
  const resetUrl = `${config.cors.frontendUrl}/auth/reset-password?token=${resetToken}`;
  return sendEmail({
    to: user.email,
    subject: 'Password Reset Request',
    template: 'password-reset',
    data: {
      name: user.full_name,
      resetUrl,
      expiresIn: '1 hour',
      ip
    }
  });
};
const sendOrderConfirmation = async (order) => {
  return sendEmail({
    to: order.customer_email,
    subject: `Order Confirmation - ${order.order_number}`,
    template: 'order-confirmation',
    data: {
      customerName: order.customer_name,
      orderNumber: order.order_number,
      productType: order.product_type,
      quantity: order.quantity,
      totalPrice: order.total_price,
      dueDate: order.due_date,
      trackUrl: `${config.cors.frontendUrl}/customer/orders/${order.id}/track`
    }
  });
};
const sendOrderStatusUpdate = async (order, status, message) => {
  return sendEmail({
    to: order.customer_email,
    subject: `Order ${order.order_number} Status Update - ${status.toUpperCase()}`,
    template: 'order-status-update',
    data: {
      customerName: order.customer_name,
      orderNumber: order.order_number,
      status: status.toUpperCase(),
      message,
      trackUrl: `${config.cors.frontendUrl}/customer/orders/${order.id}/track`
    }
  });
};
const sendPaymentReceipt = async (payment, customer) => {
  return sendEmail({
    to: customer.email,
    subject: `Payment Receipt - ${payment.reference_number || 'Payment'}`,
    template: 'payment-receipt',
    data: {
      customerName: customer.name,
      amount: payment.amount,
      paymentMethod: payment.method,
      referenceNumber: payment.reference_number,
      date: payment.processed_at,
      newBalance: customer.current_balance
    }
  });
};
const sendLowStockAlert = async (product, currentStock, admin) => {
  return sendEmail({
    to: admin.email,
    subject: `Low Stock Alert: ${product.name}`,
    template: 'low-stock-alert',
    data: {
      adminName: admin.full_name,
      productName: product.name,
      sku: product.sku,
      currentStock,
      reorderLevel: product.reorder_level
    }
  });
};
const sendDailySalesReport = async (recipient, report) => {
  const html = `
    <h1>Daily Sales Report</h1>
    <p>Date: ${report.date}</p>
    <p>Total Revenue: ${report.summary.totalRevenue} ETB</p>
    <p>Total Transactions: ${report.summary.totalSales}</p>
    <p>Average Order Value: ${report.summary.averageOrderValue} ETB</p>
  `;
  return sendEmail({
    to: recipient,
    subject: `Daily Sales Report - ${report.date}`,
    html
  });
};
const testEmailConfig = async (testEmail) => {
  return sendEmail({
    to: testEmail,
    subject: 'Sutana EMS - Email Configuration Test',
    html: '<h1>Test Email</h1><p>Your email configuration is working correctly!</p>'
  });
};
const getEmailStats = async (days = 7) => {
  const stats = await db('communication_logs')
    .where('type', 'email')
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
    queueSize: emailQueue.length
  };
};
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    processEmailRetryQueue().catch(err => logger.error('Email retry processor error:', err.message));
  }, 60000);
}
module.exports = {
  initEmailService,
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendPaymentReceipt,
  sendLowStockAlert,
  sendDailySalesReport,
  testEmailConfig,
  getEmailStats,
  processEmailRetryQueue
};
