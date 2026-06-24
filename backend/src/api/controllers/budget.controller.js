const { db } = require('../../config/database');
const { audit } = require('../../config/logger');
const AppError = require('../../utils/AppError');
const { catchAsync } = require('../../utils/catchAsync');
const BudgetRepository = require('../../repositories/budget.repository');
const budgetRepo = new BudgetRepository();
const BudgetPeriodModel = require('../../models/BudgetPeriod.model');

exports.getBudgets = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 25 } = req.query;
  let query = db('budget_periods');
  if (status) query = query.where('status', status);
  const total = await query.clone().count('id as total').first();
  const budgets = await query.orderBy('start_date', 'desc').limit(limit).offset((page - 1) * limit);
  res.json({ status: 'success', data: { budgets, pagination: { page: parseInt(page), limit: parseInt(limit), total: parseInt(total.total || 0) } } });
});

exports.getBudgetById = catchAsync(async (req, res) => {
  const budget = await budgetRepo.getBudgetWithItems(req.params.id);
  if (!budget) throw new AppError('Budget not found', 404);
  res.json({ status: 'success', data: { budget: BudgetPeriodModel.fromDatabase(budget) } });
});

exports.createBudget = catchAsync(async (req, res) => {
  const { name, periodType, startDate, endDate, notes } = req.body;
  const [id] = await db('budget_periods').insert({
    name, period_type: periodType, start_date: startDate, end_date: endDate,
    status: 'draft', created_by: req.user.id, notes: notes || ''
  });
  await audit('BUDGET_CREATED', id, { ip: req.ip, details: { name, periodType } });
  res.status(201).json({ status: 'success', data: { budgetId: id } });
});

exports.updateBudget = catchAsync(async (req, res) => {
  const { id } = req.params;
  const budget = await budgetRepo.findById(id);
  if (!budget) throw new AppError('Budget not found', 404);
  if (budget.status === 'closed') throw new AppError('Cannot update closed budget', 400);
  const { name, notes, status } = req.body;
  const updateData = {};
  if (name) updateData.name = name;
  if (notes !== undefined) updateData.notes = notes;
  if (status) updateData.status = status;
  updateData.updated_at = db.fn.now();
  await budgetRepo.update(id, updateData);
  res.json({ status: 'success', message: 'Budget updated' });
});

exports.approveBudget = catchAsync(async (req, res) => {
  const { id } = req.params;
  const budget = await budgetRepo.findById(id);
  if (!budget) throw new AppError('Budget not found', 404);
  if (budget.status !== 'draft') throw new AppError('Only draft budgets can be approved', 400);
  await db('budget_periods').where('id', id).update({ status: 'active', approved_by: req.user.id, approved_at: db.fn.now(), updated_at: db.fn.now() });
  await audit('BUDGET_APPROVED', id, { ip: req.ip, details: { name: budget.name } });
  res.json({ status: 'success', message: 'Budget approved and activated' });
});

exports.addBudgetItem = catchAsync(async (req, res) => {
  const { budgetId } = req.params;
  const { categoryId, coaId, allocatedAmount } = req.body;
  const budget = await budgetRepo.findById(budgetId);
  if (!budget) throw new AppError('Budget not found', 404);
  if (budget.status !== 'draft') throw new AppError('Can only add items to draft budgets', 400);
  await budgetRepo.createBudgetItem({
    budget_period_id: parseInt(budgetId),
    category_id: categoryId || null,
    coa_id: coaId || null,
    allocated_amount: allocatedAmount,
    remaining_amount: allocatedAmount
  });
  await db('budget_periods').where('id', budgetId).increment('total_budget', allocatedAmount);
  res.status(201).json({ status: 'success', message: 'Budget item added' });
});

exports.getUtilizationReport = catchAsync(async (req, res) => {
  const { budgetId } = req.params;
  const items = await budgetRepo.getBudgetUtilizationReport(budgetId);
  res.json({ status: 'success', data: { items } });
});
