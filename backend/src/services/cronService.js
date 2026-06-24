const { db } = require('../config/database');
const notificationRepository = require('../repositories/notification.repository');
const { logger } = require('../config/logger');

// Auto-cleanup rules
class CronService {
  start() {
    // Run every hour
    setInterval(() => {
      this.runCleanup();
    }, 1000 * 60 * 60);

    // Run finance tasks every 30 minutes
    setInterval(() => {
      this.runFinanceTasks();
    }, 1000 * 60 * 30);
    
    // Run once on startup after 10 seconds
    setTimeout(() => {
      this.runCleanup();
    }, 10000);

    // Run finance tasks once on startup after 15 seconds
    setTimeout(() => {
      this.runFinanceTasks();
    }, 15000);
    
    logger.info('Cron service started for auto-cleanup and finance tasks.');
  }

  async runFinanceTasks() {
    try {
      logger.info('Running finance cron tasks...');
      const now = new Date();

      // 1. Mark overdue payment schedules
      const overdueSchedules = await db('payment_schedules')
        .where('status', 'pending')
        .where('due_date', '<', now);

      for (const s of overdueSchedules) {
        await db('payment_schedules').where('id', s.id).update({
          status: 'overdue',
          updated_at: db.fn.now()
        });
        await notificationRepository.create({
          userId: s.created_by,
          title: 'Payment Overdue',
          message: `Payment schedule #${s.id} for ETB ${s.amount_due} is overdue (due: ${s.due_date}).`
        });
      }

      // 2. Deactivate expired budget periods
      const expiredBudgets = await db('budget_periods')
        .where('status', 'active')
        .where('end_date', '<', now);

      for (const b of expiredBudgets) {
        await db('budget_periods').where('id', b.id).update({
          status: 'closed',
          updated_at: db.fn.now()
        });
      }

      logger.info('Finance cron tasks completed.');
    } catch (error) {
      logger.error('Error during finance cron tasks:', error);
    }
  }

  async runCleanup() {
    try {
      logger.info('Running auto-cleanup job...');
      const now = new Date();

      // 1. PENDING > 48 hours -> ABANDONED
      const abandonedDate = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      const pendingToAbandon = await db('rental_orders')
        .where('status', 'PENDING_APPROVAL')
        .where('created_at', '<', abandonedDate);
      
      for (const order of pendingToAbandon) {
        await db('rental_orders').where('id', order.id).update({ status: 'ABANDONED' });
        await notificationRepository.create({
          userId: order.customer_id,
          title: 'Order Abandoned',
          message: `Your order ${order.order_number} was abandoned due to inactivity.`
        });
      }

      // 2. APPROVED > 72 hours -> CANCELLED
      const cancelledDate = new Date(now.getTime() - 72 * 60 * 60 * 1000);
      const approvedToCancel = await db('rental_orders')
        .where('status', 'APPROVED')
        .where('approved_at', '<', cancelledDate)
        .where('payment_status', 'UNPAID');

      for (const order of approvedToCancel) {
        await db('rental_orders').where('id', order.id).update({ status: 'CANCELLED' });
        await db('cars').where('id', order.car_id).update({ availability: 'Available' });
        await notificationRepository.create({
          userId: order.customer_id,
          title: 'Order Cancelled',
          message: `Your order ${order.order_number} was cancelled due to no payment.`
        });
      }

      // 3. CONFIRMED > 24 hours past pickup -> CANCELLED (no-show)
      const noShowDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const confirmedToCancel = await db('rental_orders')
        .where('status', 'CONFIRMED')
        .where('pickup_date', '<', noShowDate);

      for (const order of confirmedToCancel) {
        // No-show fee is 1 day's rental rate
        const noShowFee = order.daily_rate;
        const totalPaid = order.total_amount;
        const refundAmount = totalPaid - noShowFee;

        await db('rental_orders').where('id', order.id).update({ 
          status: 'CANCELLED',
          manager_note: 'Auto-cancelled due to no-show',
          refund_amount: Math.max(0, refundAmount)
        });
        await db('cars').where('id', order.car_id).update({ availability: 'Available' });
        await notificationRepository.create({
          userId: order.customer_id,
          title: 'Order Cancelled - No Show',
          message: `Your order ${order.order_number} was cancelled because you did not pick up the car. A no-show fee of ETB ${noShowFee} was charged. Refund: ETB ${Math.max(0, refundAmount)}.`
        });
      }

      // 4. COMPLETED > 30 days -> ARCHIVED
      const archiveDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const completedToArchive = await db('rental_orders')
        .where('status', 'COMPLETED')
        .where('actual_return_time', '<', archiveDate);

      for (const order of completedToArchive) {
        await db('rental_orders').where('id', order.id).update({ status: 'ARCHIVED' });
      }

      logger.info('Auto-cleanup job completed.');
    } catch (error) {
      logger.error('Error during auto-cleanup:', error);
    }
  }
}

module.exports = new CronService();
