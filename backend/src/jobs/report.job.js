const cron = require('node-cron');
const { db } = require('../config/database');
const { logger } = require('../config/logger');
const { sendEmail } = require('../services/email.service');
const { exportToBuffer } = require('../utils/exportHelper');
const { getDailySalesReport, getSalesByPeriod } = require('../services/report.service');
const config = require('../config/env');
const JOB_CONFIG = {
  schedule: '0 8 * * *', 
  name: 'report-generation',
  enabled: true
};
let scheduledTask = null;
const getReportSubscribers = async () => {
  try {
    const subscribers = await db('report_subscribers')
      .where('is_active', true)
      .select('email', 'report_type', 'frequency', 'format');
    return subscribers;
  } catch (error) {
    logger.error('[Report Job] Failed to get report subscribers:', error.message);
    return [];
  }
};
const generateDailySalesReport = async (date, format = 'pdf') => {
  const reportData = await getDailySalesReport(date);
  const filename = `daily_sales_${date}`;
  if (format === 'csv') {
    return await exportToBuffer(reportData.sales, 'csv', filename);
  } else if (format === 'excel') {
    return await exportToBuffer(reportData.sales, 'excel', filename);
  }
  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument({ margin: 50 });
  const chunks = [];
  doc.on('data', chunk => chunks.push(chunk));
  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.fontSize(20).text('Daily Sales Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Date: ${date}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text('Summary', { underline: true });
    doc.fontSize(10);
    doc.text(`Total Sales: ${reportData.summary.totalSales}`);
    doc.text(`Total Revenue: ${reportData.summary.totalRevenue.toLocaleString()} ETB`);
    doc.text(`Average Order Value: ${reportData.summary.averageOrderValue.toLocaleString()} ETB`);
    doc.text(`Total Tax: ${reportData.summary.totalTax.toLocaleString()} ETB`);
    doc.text(`Total Discount: ${reportData.summary.totalDiscount.toLocaleString()} ETB`);
    doc.moveDown();
    doc.fontSize(14).text('Payment Method Breakdown', { underline: true });
    doc.fontSize(10);
    for (const [method, data] of Object.entries(reportData.summary.byPaymentMethod)) {
      doc.text(`${method}: ${data.count} transactions (${data.amount.toLocaleString()} ETB)`);
    }
    doc.end();
  });
};
const generateWeeklySalesReport = async (startDate, endDate, format = 'pdf') => {
  const reportData = await getSalesByPeriod(startDate, endDate, 'day');
  const filename = `weekly_sales_${startDate}_to_${endDate}`;
  return await exportToBuffer(reportData.sales, format, filename);
};
const generateMonthlySalesReport = async (year, month, format = 'pdf') => {
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];
  const reportData = await getSalesByPeriod(startDate, endDate, 'day');
  const filename = `monthly_sales_${year}_${month.toString().padStart(2, '0')}`;
  return await exportToBuffer(reportData.sales, format, filename);
};
const generateLowStockReport = async (format = 'pdf') => {
  const lowStockProducts = await db('products as p')
    .leftJoin('inventory as i', 'p.id', 'i.product_id')
    .leftJoin('product_categories as pc', 'p.category_id', 'pc.id')
    .select(
      'p.name',
      'p.sku',
      'pc.name as category',
      'p.reorder_level',
      db.raw('COALESCE(i.quantity, 0) as current_stock')
    )
    .whereRaw('COALESCE(i.quantity, 0) <= p.reorder_level')
    .whereNull('p.deleted_at')
    .where('p.is_active', true);
  const filename = `low_stock_report_${new Date().toISOString().split('T')[0]}`;
  return await exportToBuffer(lowStockProducts, format, filename);
};
const sendReportToSubscriber = async (subscriber, reportBuffer, filename, format) => {
  const contentType = format === 'pdf' ? 'application/pdf' : 
                      format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 
                      'text/csv';
  const extension = format === 'pdf' ? '.pdf' : format === 'excel' ? '.xlsx' : '.csv';
  await sendEmail({
    to: subscriber.email,
    subject: `Sutana EMS - ${subscriber.report_type} Report`,
    template: 'scheduled-report',
    data: {
      subscriberName: subscriber.name || 'Valued User',
      reportType: subscriber.report_type,
      date: new Date().toISOString(),
      format: format.toUpperCase()
    },
    attachments: [{
      filename: `${filename}${extension}`,
      content: reportBuffer,
      contentType
    }]
  }).catch(err => logger.error(`Failed to send report to ${subscriber.email}:`, err.message));
  await db('report_delivery_logs').insert({
    subscriber_email: subscriber.email,
    report_type: subscriber.report_type,
    format,
    delivered_at: db.fn.now(),
    status: 'sent'
  });
};
const executeDailyReports = async () => {
  const today = new Date().toISOString().split('T')[0];
  const subscribers = await getReportSubscribers();
  for (const subscriber of subscribers) {
    try {
      if (subscriber.frequency === 'daily') {
        let reportBuffer;
        let filename;
        switch (subscriber.report_type) {
          case 'sales':
            reportBuffer = await generateDailySalesReport(today, subscriber.format);
            filename = `daily_sales_${today}`;
            break;
          case 'low_stock':
            reportBuffer = await generateLowStockReport(subscriber.format);
            filename = `low_stock_${today}`;
            break;
          default:
            continue;
        }
        await sendReportToSubscriber(subscriber, reportBuffer, filename, subscriber.format);
      }
    } catch (error) {
      logger.error(`[Report Job] Failed to generate/send ${subscriber.report_type} report to ${subscriber.email}:`, error.message);
      await db('report_delivery_logs').insert({
        subscriber_email: subscriber.email,
        report_type: subscriber.report_type,
        format: subscriber.format,
        delivered_at: db.fn.now(),
        status: 'failed',
        error_message: error.message
      });
    }
  }
};
const executeWeeklyReports = async () => {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
  const startDateStr = startDate.toISOString().split('T')[0];
  const subscribers = await getReportSubscribers();
  for (const subscriber of subscribers) {
    if (subscriber.frequency !== 'weekly') continue;
    try {
      let reportBuffer;
      let filename;
      switch (subscriber.report_type) {
        case 'sales':
          reportBuffer = await generateWeeklySalesReport(startDateStr, endDate, subscriber.format);
          filename = `weekly_sales_${startDateStr}_to_${endDate}`;
          break;
        default:
          continue;
      }
      await sendReportToSubscriber(subscriber, reportBuffer, filename, subscriber.format);
    } catch (error) {
      logger.error(`[Report Job] Failed to generate/send weekly ${subscriber.report_type} report to ${subscriber.email}:`, error.message);
    }
  }
};
const executeMonthlyReports = async () => {
  const today = new Date();
  const isFirstDayOfMonth = today.getDate() === 1;
  if (!isFirstDayOfMonth) return;
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const year = lastMonth.getFullYear();
  const month = lastMonth.getMonth() + 1;
  const subscribers = await getReportSubscribers();
  for (const subscriber of subscribers) {
    if (subscriber.frequency !== 'monthly') continue;
    try {
      let reportBuffer;
      let filename;
      switch (subscriber.report_type) {
        case 'sales':
          reportBuffer = await generateMonthlySalesReport(year, month, subscriber.format);
          filename = `monthly_sales_${year}_${month.toString().padStart(2, '0')}`;
          break;
        default:
          continue;
      }
      await sendReportToSubscriber(subscriber, reportBuffer, filename, subscriber.format);
    } catch (error) {
      logger.error(`[Report Job] Failed to generate/send monthly ${subscriber.report_type} report to ${subscriber.email}:`, error.message);
    }
  }
};
const generateExecutiveSummary = async () => {
  try {
    const ceos = await db('users')
      .leftJoin('user_roles', 'users.id', 'user_roles.user_id')
      .leftJoin('roles', 'user_roles.role_id', 'roles.id')
      .where('roles.name', 'CEO')
      .select('users.email', 'users.full_name');
    if (ceos.length === 0) return;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date();
    const salesReport = await getSalesByPeriod(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      'day'
    );
    const lowStockReport = await generateLowStockReport('pdf');
    for (const ceo of ceos) {
      await sendEmail({
        to: ceo.email,
        subject: `Weekly Executive Summary - ${endDate.toISOString().split('T')[0]}`,
        template: 'executive-summary',
        data: {
          ceoName: ceo.full_name,
          period: {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0]
          },
          totalRevenue: salesReport.totals.totalRevenue,
          totalOrders: salesReport.totals.totalOrders,
          averageOrderValue: salesReport.totals.averageOrderValue
        },
        attachments: [{
          filename: `low_stock_report_${endDate.toISOString().split('T')[0]}.pdf`,
          content: lowStockReport,
          contentType: 'application/pdf'
        }]
      }).catch(err => logger.error(`Failed to send executive summary to ${ceo.email}:`, err.message));
    }
    logger.info(`[Report Job] Sent executive summary to ${ceos.length} CEO(s)`);
  } catch (error) {
    logger.error('[Report Job] Failed to generate executive summary:', error.message);
  }
};
const cleanupReportLogs = async () => {
  try {
    const cutoffDate = db.raw(`DATE_SUB(NOW(), INTERVAL 90 DAY)`);
    const deleted = await db('report_delivery_logs')
      .where('delivered_at', '<', cutoffDate)
      .delete();
    if (deleted > 0) {
      logger.info(`[Report Job] Deleted ${deleted} old report delivery logs`);
    }
    return deleted;
  } catch (error) {
    logger.error('[Report Job] Failed to cleanup report logs:', error.message);
    return 0;
  }
};
const executeReports = async () => {
  const startTime = Date.now();
  logger.info('[Report Job] Starting report generation...');
  try {
    await executeDailyReports();
    await generateExecutiveSummary();
    const today = new Date();
    if (today.getDay() === 1) { 
      await executeWeeklyReports();
    }
    await executeMonthlyReports();
    await cleanupReportLogs();
    const duration = Date.now() - startTime;
    logger.info(`[Report Job] Report generation completed in ${duration}ms`);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('[Report Job] Report generation failed:', {
      error: error.message,
      duration: `${duration}ms`
    });
    throw error;
  }
};
const init = () => {
  if (!JOB_CONFIG.enabled) {
    logger.info('[Report Job] Disabled by configuration');
    return;
  }
  if (scheduledTask) {
    logger.warn('[Report Job] Already initialized');
    return;
  }
  scheduledTask = cron.schedule(JOB_CONFIG.schedule, async () => {
    await executeReports();
  }, {
    scheduled: true,
    timezone: config.timezone || 'Africa/Addis_Ababa'
  });
  logger.info(`[Report Job] Initialized with schedule: ${JOB_CONFIG.schedule}`);
  logger.info(`[Report Job] Next execution: ${scheduledTask.nextDates().toISOString()}`);
};
const stop = () => {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    logger.info('[Report Job] Stopped');
  }
};
const runNow = async () => {
  logger.info('[Report Job] Manual execution triggered');
  return await executeReports();
};
const getStatus = () => {
  return {
    name: JOB_CONFIG.name,
    schedule: JOB_CONFIG.schedule,
    enabled: JOB_CONFIG.enabled,
    running: !!scheduledTask,
    nextRun: scheduledTask ? scheduledTask.nextDates().toISOString() : null
  };
};
module.exports = {
  init,
  stop,
  runNow,
  getStatus,
  executeReports,
  JOB_CONFIG
};
