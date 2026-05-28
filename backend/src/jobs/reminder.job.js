const cron = require('node-cron');
const { db } = require('../config/database');
const { logger } = require('../config/logger');
const { sendEmail } = require('../services/email.service');
const { sendSMS } = require('../services/sms.service');
const config = require('../config/env');
const JOB_CONFIG = {
  schedule: '0 9 * * *', 
  name: 'reminder-notifications',
  enabled: true
};
let scheduledTask = null;
const getOverdueCustomers = async () => {
  try {
    const overdueCustomers = await db('customers')
      .where('current_balance', '>', 0)
      .whereRaw(`
        EXISTS (
          SELECT 1 FROM pos_sales 
          WHERE customer_id = customers.id 
          AND status = 'Completed'
          AND sale_date < DATE_SUB(NOW(), INTERVAL 30 DAY)
        )
      `)
      .whereNull('deleted_at')
      .select(
        'id',
        'name',
        'email',
        'phone',
        'current_balance'
      );
    for (const customer of overdueCustomers) {
      const lastSale = await db('pos_sales')
        .where('customer_id', customer.id)
        .where('status', 'Completed')
        .orderBy('sale_date', 'desc')
        .first();
      if (lastSale) {
        const daysOverdue = Math.floor((Date.now() - new Date(lastSale.sale_date)) / (1000 * 60 * 60 * 24));
        customer.daysOverdue = daysOverdue;
        customer.lastSaleDate = lastSale.sale_date;
        customer.lastSaleAmount = lastSale.total_amount;
      }
    }
    return overdueCustomers;
  } catch (error) {
    logger.error('[Reminder Job] Failed to get overdue customers:', error.message);
    return [];
  }
};
const getPendingOrders = async () => {
  try {
    const pastDueOrders = await db('printing_orders as po')
      .leftJoin('customers as c', 'po.customer_id', 'c.id')
      .leftJoin('order_statuses as os', 'po.status_id', 'os.id')
      .select(
        'po.id',
        'po.order_number',
        'c.name as customer_name',
        'c.phone as customer_phone',
        'c.email as customer_email',
        'po.due_date',
        'os.status_name as status'
      )
      .where('po.due_date', '<', db.fn.now())
      .whereNot('os.status_code', 'delivered')
      .whereNot('os.status_code', 'cancelled')
      .whereNull('po.deleted_at');
    const dueTodayOrders = await db('printing_orders as po')
      .leftJoin('customers as c', 'po.customer_id', 'c.id')
      .leftJoin('order_statuses as os', 'po.status_id', 'os.id')
      .select(
        'po.id',
        'po.order_number',
        'c.name as customer_name',
        'c.phone as customer_phone',
        'c.email as customer_email',
        'po.due_date',
        'os.status_name as status'
      )
      .whereDate('po.due_date', db.fn.now())
      .whereNot('os.status_code', 'delivered')
      .whereNot('os.status_code', 'cancelled')
      .whereNull('po.deleted_at');
    return { pastDueOrders, dueTodayOrders };
  } catch (error) {
    logger.error('[Reminder Job] Failed to get pending orders:', error.message);
    return { pastDueOrders: [], dueTodayOrders: [] };
  }
};
const getLowStockProducts = async () => {
  try {
    const lowStockProducts = await db('products as p')
      .leftJoin('inventory as i', 'p.id', 'i.product_id')
      .leftJoin('product_categories as pc', 'p.category_id', 'pc.id')
      .select(
        'p.id',
        'p.name',
        'p.sku',
        'p.reorder_level',
        'pc.name as category',
        db.raw('COALESCE(i.quantity, 0) as current_stock'),
        db.raw('ROUND((COALESCE(i.quantity, 0) / NULLIF(p.reorder_level, 0)) * 100, 1) as stock_percentage')
      )
      .whereRaw('COALESCE(i.quantity, 0) <= p.reorder_level')
      .whereNull('p.deleted_at')
      .where('p.is_active', true)
      .orderByRaw('(COALESCE(i.quantity, 0) / NULLIF(p.reorder_level, 0)) ASC')
      .limit(20);
    return lowStockProducts;
  } catch (error) {
    logger.error('[Reminder Job] Failed to get low stock products:', error.message);
    return [];
  }
};
const sendOverdueReminder = async (customer) => {
  const message = `Dear ${customer.name}, your payment of ${customer.current_balance.toLocaleString()} ETB is ${customer.daysOverdue} days overdue. Please settle your account to avoid service interruption.`;
  if (customer.phone) {
    await sendSMS({
      to: customer.phone,
      message
    }).catch(err => logger.error(`Failed to send SMS to ${customer.phone}:`, err.message));
  }
  if (customer.email) {
    await sendEmail({
      to: customer.email,
      subject: 'Payment Reminder - Overdue Balance',
      template: 'payment-reminder',
      data: {
        customerName: customer.name,
        amount: customer.current_balance,
        daysOverdue: customer.daysOverdue,
        lastSaleDate: customer.lastSaleDate,
        lastSaleAmount: customer.lastSaleAmount
      }
    }).catch(err => logger.error(`Failed to send email to ${customer.email}:`, err.message));
  }
  logger.info(`[Reminder Job] Sent overdue reminder to ${customer.name} (${customer.current_balance} ETB, ${customer.daysOverdue} days overdue)`);
};
const sendOrderReminder = async (order, isPastDue = false) => {
  const message = isPastDue 
    ? `Dear ${order.customer_name}, your order ${order.order_number} was due on ${order.due_date}. Please contact us to arrange delivery.`
    : `Dear ${order.customer_name}, your order ${order.order_number} is due today (${order.due_date}). Please arrange for pickup/delivery.`;
  if (order.customer_phone) {
    await sendSMS({
      to: order.customer_phone,
      message
    }).catch(err => logger.error(`Failed to send SMS to ${order.customer_phone}:`, err.message));
  }
  if (order.customer_email) {
    await sendEmail({
      to: order.customer_email,
      subject: isPastDue ? 'Order Past Due Notice' : 'Order Due Today',
      template: isPastDue ? 'order-past-due' : 'order-due-today',
      data: {
        customerName: order.customer_name,
        orderNumber: order.order_number,
        dueDate: order.due_date,
        status: order.status
      }
    }).catch(err => logger.error(`Failed to send email to ${order.customer_email}:`, err.message));
  }
  logger.info(`[Reminder Job] Sent ${isPastDue ? 'past due' : 'due today'} reminder for order ${order.order_number} to ${order.customer_name}`);
};
const sendLowStockAlert = async (lowStockProducts) => {
  if (lowStockProducts.length === 0) return;
  const staff = await db('users')
    .leftJoin('user_roles', 'users.id', 'user_roles.user_id')
    .leftJoin('roles', 'user_roles.role_id', 'roles.id')
    .whereIn('roles.name', ['Store Worker', 'Admin', 'Purchase'])
    .select('users.id', 'users.email', 'users.phone', 'users.full_name')
    .groupBy('users.id');
  const productList = lowStockProducts.map(p => 
    `- ${p.name} (${p.sku}): ${p.current_stock} / ${p.reorder_level} (${p.stock_percentage}%)`
  ).join('\n');
  for (const staffMember of staff) {
    if (staffMember.email) {
      await sendEmail({
        to: staffMember.email,
        subject: `Low Stock Alert - ${lowStockProducts.length} Items Need Reorder`,
        template: 'low-stock-batch-alert',
        data: {
          staffName: staffMember.full_name,
          products: lowStockProducts,
          productCount: lowStockProducts.length,
          productList
        }
      }).catch(err => logger.error(`Failed to send low stock email to ${staffMember.email}:`, err.message));
    }
    const criticalProducts = lowStockProducts.filter(p => p.stock_percentage < 10);
    if (criticalProducts.length > 0 && staffMember.phone) {
      const message = `ALERT: ${criticalProducts.length} items critically low on stock. Check inventory dashboard.`;
      await sendSMS({
        to: staffMember.phone,
        message
      }).catch(err => logger.error(`Failed to send low stock SMS to ${staffMember.phone}:`, err.message));
    }
  }
  logger.info(`[Reminder Job] Sent low stock alert for ${lowStockProducts.length} products to ${staff.length} staff members`);
};
const sendInternalOrderReminder = async (pastDueOrders, dueTodayOrders) => {
  const hasOrders = pastDueOrders.length > 0 || dueTodayOrders.length > 0;
  if (!hasOrders) return;
  const supervisors = await db('users')
    .leftJoin('user_roles', 'users.id', 'user_roles.user_id')
    .leftJoin('roles', 'user_roles.role_id', 'roles.id')
    .where('roles.name', 'Printing Supervisor')
    .orWhere('roles.name', 'Admin')
    .select('users.id', 'users.email', 'users.full_name')
    .groupBy('users.id');
  for (const supervisor of supervisors) {
    await sendEmail({
      to: supervisor.email,
      subject: `Order Reminder: ${pastDueOrders.length} Past Due, ${dueTodayOrders.length} Due Today`,
      template: 'order-reminder-internal',
      data: {
        supervisorName: supervisor.full_name,
        pastDueOrders,
        dueTodayOrders,
        pastDueCount: pastDueOrders.length,
        dueTodayCount: dueTodayOrders.length
      }
    }).catch(err => logger.error(`Failed to send internal reminder to ${supervisor.email}:`, err.message));
  }
  logger.info(`[Reminder Job] Sent internal order reminder to ${supervisors.length} supervisors`);
};
const executeReminders = async () => {
  const startTime = Date.now();
  logger.info('[Reminder Job] Starting reminder notifications...');
  const results = {
    overdueCustomers: 0,
    pastDueOrders: 0,
    dueTodayOrders: 0,
    lowStockProducts: 0
  };
  try {
    const overdueCustomers = await getOverdueCustomers();
    results.overdueCustomers = overdueCustomers.length;
    for (const customer of overdueCustomers) {
      await sendOverdueReminder(customer);
    }
    const { pastDueOrders, dueTodayOrders } = await getPendingOrders();
    results.pastDueOrders = pastDueOrders.length;
    results.dueTodayOrders = dueTodayOrders.length;
    for (const order of pastDueOrders) {
      await sendOrderReminder(order, true);
    }
    for (const order of dueTodayOrders) {
      await sendOrderReminder(order, false);
    }
    await sendInternalOrderReminder(pastDueOrders, dueTodayOrders);
    const lowStockProducts = await getLowStockProducts();
    results.lowStockProducts = lowStockProducts.length;
    await sendLowStockAlert(lowStockProducts);
    const duration = Date.now() - startTime;
    logger.info('[Reminder Job] Reminder notifications completed', {
      ...results,
      duration: `${duration}ms`
    });
    return results;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('[Reminder Job] Reminder notifications failed:', {
      error: error.message,
      duration: `${duration}ms`
    });
    throw error;
  }
};
const init = () => {
  if (!JOB_CONFIG.enabled) {
    logger.info('[Reminder Job] Disabled by configuration');
    return;
  }
  if (scheduledTask) {
    logger.warn('[Reminder Job] Already initialized');
    return;
  }
  scheduledTask = cron.schedule(JOB_CONFIG.schedule, async () => {
    await executeReminders();
  }, {
    scheduled: true,
    timezone: config.timezone || 'Africa/Addis_Ababa'
  });
  logger.info(`[Reminder Job] Initialized with schedule: ${JOB_CONFIG.schedule}`);
  logger.info(`[Reminder Job] Next execution: ${scheduledTask.nextDates().toISOString()}`);
};
const stop = () => {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    logger.info('[Reminder Job] Stopped');
  }
};
const runNow = async () => {
  logger.info('[Reminder Job] Manual execution triggered');
  return await executeReminders();
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
  executeReminders,
  JOB_CONFIG
};
