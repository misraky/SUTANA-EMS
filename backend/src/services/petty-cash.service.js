const { db, transaction } = require('../config/database');
const { sendEmail } = require('./email.service');
const { audit } = require('../config/logger');
const PettyCashRepository = require('../repositories/petty-cash.repository');
const AppError = require('../utils/AppError');
const pcRepo = new PettyCashRepository();

const createFund = async (data, userId) => {
  const [id] = await db('petty_cash_funds').insert({
    fund_name: data.fundName,
    imprest_amount: data.imprestAmount,
    current_balance: data.imprestAmount,
    max_disbursement: data.maxDisbursement || data.imprestAmount,
    max_per_transaction: data.maxPerTransaction || Math.min(2000, data.imprestAmount * 0.1),
    custodian_id: data.custodianId,
    status: 'active'
  });
  await audit('PETTY_CASH_FUND_CREATED', id, { ip: null, details: data });
  return id;
};

const disburse = async (fundId, data, userId) => {
  const fund = await pcRepo.getFundWithCustodian(fundId);
  if (!fund) throw new AppError('Petty cash fund not found', 404);
  if (fund.status !== 'active') throw new AppError('Fund is not active', 400);
  if (data.amount > fund.max_per_transaction) {
    throw new AppError(`Amount exceeds max per transaction of ${fund.max_per_transaction} ETB`, 400);
  }
  return await transaction(async (trx) => {
    const txId = await trx('petty_cash_transactions').insert({
      fund_id: fundId,
      type: 'disbursement',
      amount: data.amount,
      category_id: data.categoryId || null,
      description: data.description,
      requested_by: userId,
      status: 'paid',
      paid_at: db.fn.now()
    });
    const newBalance = parseFloat(fund.current_balance) - parseFloat(data.amount);
    await trx('petty_cash_funds')
      .where('id', fundId)
      .update({ current_balance: newBalance, updated_at: db.fn.now() });
    await audit('PETTY_CASH_DISBURSED', fundId, {
      ip: null,
      details: { amount: data.amount, newBalance, transactionId: txId }
    });
    return { transactionId: txId, newBalance };
  });
};

const replenish = async (fundId, amount, userId) => {
  const fund = await pcRepo.findById(fundId);
  if (!fund) throw new AppError('Petty cash fund not found', 404);
  const topUpAmount = parseFloat(fund.imprest_amount) - parseFloat(fund.current_balance);
  if (amount > topUpAmount) {
    throw new AppError(`Replenishment cannot exceed ${topUpAmount} ETB`, 400);
  }
  return await transaction(async (trx) => {
    await trx('petty_cash_transactions').insert({
      fund_id: fundId,
      type: 'replenishment',
      amount,
      description: `Fund replenishment - restored to ${fund.imprest_amount} ETB`,
      requested_by: userId,
      status: 'paid',
      paid_at: db.fn.now()
    });
    const newBalance = parseFloat(fund.current_balance) + parseFloat(amount);
    await trx('petty_cash_funds')
      .where('id', fundId)
      .update({ current_balance: newBalance, updated_at: db.fn.now() });
    return { newBalance };
  });
};

const reconcile = async (fundId, actualBalance, userId, notes) => {
  const fund = await pcRepo.findById(fundId);
  if (!fund) throw new AppError('Petty cash fund not found', 404);
  const bookBalance = parseFloat(fund.current_balance);
  const variance = actualBalance - bookBalance;
  await pcRepo.update(fundId, {
    current_balance: actualBalance,
    last_reconciled_at: db.fn.now(),
    updated_at: db.fn.now()
  });
  if (variance !== 0) {
    await db('petty_cash_transactions').insert({
      fund_id: fundId,
      type: 'adjustment',
      amount: Math.abs(variance),
      description: `Reconciliation adjustment: ${variance > 0 ? 'Surplus' : 'Shortfall'} of ${Math.abs(variance)} ETB. ${notes || ''}`,
      requested_by: userId,
      status: 'paid',
      paid_at: db.fn.now()
    });
  }
  return { bookBalance, actualBalance, variance, reconciled: true };
};

module.exports = {
  createFund,
  disburse,
  replenish,
  reconcile,
  getRepo: () => pcRepo
};
