const { db, transaction } = require('../config/database');
const { sendEmail } = require('./email.service');
const { logger } = require('../config/logger');
const AppError = require('../utils/AppError');

const createSchedule = async (data) => {
  const remaining = parseFloat(data.totalAmount) - parseFloat(data.paidAmount || 0);
  const [id] = await db('payment_schedules').insert({
    reference_type: data.referenceType,
    reference_id: data.referenceId,
    total_amount: data.totalAmount,
    paid_amount: data.paidAmount || 0,
    remaining_amount: remaining,
    due_date: data.dueDate,
    scheduled_date: data.scheduledDate || data.dueDate,
    supplier_id: data.supplierId || null,
    status: remaining <= 0 ? 'paid' : 'pending',
    notes: data.notes || ''
  });
  return id;
};

const recordPayment = async (scheduleId, amount, reference) => {
  return await transaction(async (trx) => {
    const schedule = await trx('payment_schedules').where('id', scheduleId).first();
    if (!schedule) throw new AppError('Payment schedule not found', 404);
    const newPaid = parseFloat(schedule.paid_amount) + parseFloat(amount);
    const remaining = parseFloat(schedule.total_amount) - newPaid;
    const status = remaining <= 0 ? 'paid' : newPaid > 0 ? 'partial' : 'pending';
    await trx('payment_schedules')
      .where('id', scheduleId)
      .update({
        paid_amount: newPaid,
        remaining_amount: remaining,
        status,
        updated_at: db.fn.now()
      });
    return { scheduleId, amount, newPaid, remaining, status };
  });
};

const getOverdueSchedules = async () => {
  return await db('payment_schedules')
    .whereIn('status', ['pending', 'partial'])
    .where('due_date', '<', db.fn.now())
    .orderBy('due_date', 'asc');
};

const getUpcomingPayments = async (days = 30) => {
  const future = new Date();
  future.setDate(future.getDate() + days);
  return await db('payment_schedules')
    .whereIn('status', ['pending', 'partial'])
    .where('scheduled_date', '<=', future)
    .orderBy('scheduled_date', 'asc');
};

const markOverdue = async () => {
  const overdue = await getOverdueSchedules();
  for (const s of overdue) {
    await db('payment_schedules')
      .where('id', s.id)
      .update({ status: 'overdue', updated_at: db.fn.now() });
  }
  return overdue.length;
};

module.exports = {
  createSchedule,
  recordPayment,
  getOverdueSchedules,
  getUpcomingPayments,
  markOverdue
};
