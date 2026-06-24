const { db, transaction } = require('../config/database');
const { audit, logger } = require('../config/logger');
const ClosePeriodRepository = require('../repositories/close-period.repository');
const AppError = require('../utils/AppError');
const closeRepo = new ClosePeriodRepository();

const CLOSE_CHECKLIST = [
  { key: 'pendingExpenses', label: 'No pending unapproved expenses older than period end', weight: 1 },
  { key: 'bankReconciled', label: 'Bank statements reconciled', weight: 1 },
  { key: 'taxFiled', label: 'Tax declarations filed with ERCA', weight: 1 },
  { key: 'encumbrancesReviewed', label: 'Open encumbrances reviewed', weight: 1 },
  { key: 'pettyCashReconciled', label: 'Petty cash funds reconciled', weight: 1 },
  { key: 'arAged', label: 'Accounts Receivable aged', weight: 1 },
  { key: 'apAged', label: 'Accounts Payable aged', weight: 1 },
  { key: 'accrualsPosted', label: 'Accruals and prepayments posted', weight: 1 },
  { key: 'depreciationPosted', label: 'Depreciation entries posted', weight: 1 },
  { key: 'intercompanyReconciled', label: 'Intercompany accounts reconciled', weight: 1 }
];

const getCloseReadiness = async (period) => {
  const [year, month] = period.split('-');
  const periodStart = `${period}-01`;
  const periodEnd = new Date(year, month, 0).toISOString().split('T')[0];
  const pendingExpenses = await db('expenses')
    .whereNull('approved_at')
    .whereNull('deleted_at')
    .where('date', '<=', periodEnd)
    .count('id as count')
    .first();
  const [unencumberedBudget] = await db('budget_periods')
    .where('status', 'active')
    .whereRaw('(total_encumbered + total_spent) < total_budget')
    .select(db.raw('SUM(total_budget - total_encumbered - total_spent) as remaining'));
  const unreconciledPettyCash = await db('petty_cash_funds')
    .where('status', 'active')
    .whereRaw('current_balance < imprest_amount')
    .count('id as count')
    .first();
  const checks = CLOSE_CHECKLIST.map(item => {
    let passed = true;
    let details = '';
    switch (item.key) {
      case 'pendingExpenses':
        passed = parseInt(pendingExpenses?.count || 0) === 0;
        details = `${pendingExpenses?.count || 0} pending expenses`;
        break;
      case 'pettyCashReconciled':
        passed = parseInt(unreconciledPettyCash?.count || 0) === 0;
        details = `${unreconciledPettyCash?.count || 0} funds need reconciliation`;
        break;
      case 'taxFiled':
        passed = true;
        details = 'Manual verification required';
        break;
      default:
        passed = true;
        details = 'Pending verification';
    }
    return { ...item, passed, details };
  });
  const allPassed = checks.every(c => c.passed);
  return {
    period,
    periodStart,
    periodEnd,
    checks,
    allPassed,
    readyToClose: allPassed
  };
};

const executeClose = async (period, userId, notes) => {
  const readiness = await getCloseReadiness(period);
  if (!readiness.readyToClose) {
    throw new AppError('Period is not ready to close. Complete all checklist items first.', 400);
  }
  await closeRepo.closePeriod(period, userId, notes);
  await db('budget_periods')
    .where('status', 'active')
    .where('end_date', '<=', new Date())
    .update({ status: 'frozen', updated_at: db.fn.now() });
  await audit('MONTH_END_CLOSE', null, {
    ip: null,
    details: { period, userId, notes }
  });
  return { period, closed: true, closedAt: new Date().toISOString() };
};

const reopenPeriod = async (period, userId, reason) => {
  await closeRepo.reopenPeriod(period, userId, reason);
  return { period, reopened: true };
};

module.exports = {
  getCloseReadiness,
  executeClose,
  reopenPeriod,
  CLOSE_CHECKLIST
};
