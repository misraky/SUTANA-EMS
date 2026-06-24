const { db, transaction } = require('../config/database');
const { logger } = require('../config/logger');
const BudgetRepository = require('../repositories/budget.repository');
const AppError = require('../utils/AppError');
const budgetRepo = new BudgetRepository();

const findAvailableBudget = async (categoryId, amount) => {
  const now = new Date();
  const activeBudgets = await db('budget_periods')
    .where('status', 'active')
    .where('start_date', '<=', now)
    .where('end_date', '>=', now)
    .orderBy('created_at', 'desc');
  for (const budget of activeBudgets) {
    const item = await db('budget_items')
      .where('budget_period_id', budget.id)
      .where('category_id', categoryId)
      .first();
    if (item) {
      const remaining = parseFloat(item.allocated_amount) - parseFloat(item.encumbered_amount) - parseFloat(item.spent_amount);
      if (remaining >= amount) return { budgetId: budget.id, budgetItemId: item.id };
    }
  }
  return null;
};

const encumberExpense = async (expenseId, categoryId, amount, userId) => {
  const budgetInfo = await findAvailableBudget(categoryId, amount);
  if (!budgetInfo) return null;
  await transaction(async (trx) => {
    await trx('budget_encumbrances').insert({
      budget_item_id: budgetInfo.budgetItemId,
      expense_id: expenseId,
      amount,
      status: 'encumbered',
      created_by: userId,
      notes: `Auto-encumbered for expense #${expenseId}`
    });
    await trx('budget_items')
      .where('id', budgetInfo.budgetItemId)
      .increment('encumbered_amount', amount);
    await trx('budget_periods')
      .where('id', budgetInfo.budgetId)
      .increment('total_encumbered', amount);
    await trx('expenses')
      .where('id', expenseId)
      .update({
        budget_id: budgetInfo.budgetId,
        is_encumbered: true,
        encumbered_amount: amount,
        encumbered_at: db.fn.now()
      });
  });
  return budgetInfo;
};

const disburseEncumbrance = async (expenseId, amount) => {
  const encumbrances = await db('budget_encumbrances')
    .where('expense_id', expenseId)
    .where('status', 'encumbered');
  for (const enc of encumbrances) {
    await transaction(async (trx) => {
      const budgetItem = await trx('budget_items').where('id', enc.budget_item_id).first();
      if (!budgetItem) return;
      await trx('budget_encumbrances')
        .where('id', enc.id)
        .update({ status: 'disbursed', disbursed_at: db.fn.now() });
      await trx('budget_items')
        .where('id', enc.budget_item_id)
        .decrement('encumbered_amount', enc.amount)
        .increment('spent_amount', enc.amount);
      await trx('budget_periods')
        .where('id', budgetItem.budget_period_id)
        .decrement('total_encumbered', enc.amount)
        .increment('total_spent', enc.amount);
    });
  }
};

const releaseEncumbrance = async (expenseId) => {
  const encumbrances = await db('budget_encumbrances')
    .where('expense_id', expenseId)
    .where('status', 'encumbered');
  for (const enc of encumbrances) {
    await transaction(async (trx) => {
      const budgetItem = await trx('budget_items').where('id', enc.budget_item_id).first();
      if (!budgetItem) return;
      await trx('budget_encumbrances')
        .where('id', enc.id)
        .update({ status: 'released', released_at: db.fn.now() });
      await trx('budget_items')
        .where('id', enc.budget_item_id)
        .decrement('encumbered_amount', enc.amount);
      await trx('budget_periods')
        .where('id', budgetItem.budget_period_id)
        .decrement('total_encumbered', enc.amount);
    });
  }
  await db('expenses').where('id', expenseId).update({
    is_encumbered: false,
    encumbered_amount: 0,
    de_encumbered_at: db.fn.now()
  });
};

const getBudgetUtilization = async (budgetId) => {
  return await budgetRepo.getBudgetUtilizationReport(budgetId);
};

module.exports = {
  findAvailableBudget,
  encumberExpense,
  disburseEncumbrance,
  releaseEncumbrance,
  getBudgetUtilization
};
