const { catchAsync } = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const pcService = require('../../services/petty-cash.service');
const PettyCashRepository = require('../../repositories/petty-cash.repository');
const pcRepo = new PettyCashRepository();

exports.getFunds = catchAsync(async (req, res) => {
  const { status } = req.query;
  let funds;
  if (status === 'active') {
    funds = await pcRepo.getActiveFunds();
  } else {
    funds = await pcRepo.findAll({ orderBy: 'created_at', orderDirection: 'desc' });
  }
  res.json({ status: 'success', data: { funds } });
});

exports.getFundById = catchAsync(async (req, res) => {
  const fund = await pcRepo.getFundWithCustodian(req.params.id);
  if (!fund) throw new AppError('Petty cash fund not found', 404);
  res.json({ status: 'success', data: { fund } });
});

exports.createFund = catchAsync(async (req, res) => {
  const id = await pcService.createFund(req.body, req.user.id);
  res.status(201).json({ status: 'success', data: { fundId: id } });
});

exports.getTransactions = catchAsync(async (req, res) => {
  const { page, limit, status } = req.query;
  const result = await pcRepo.getTransactions(req.params.fundId, { page: parseInt(page) || 1, limit: parseInt(limit) || 50, status });
  res.json({ status: 'success', data: result });
});

exports.disburse = catchAsync(async (req, res) => {
  const result = await pcService.disburse(req.params.fundId, req.body, req.user.id);
  res.json({ status: 'success', message: 'Disbursement recorded', data: result });
});

exports.replenish = catchAsync(async (req, res) => {
  const { fundId } = req.params;
  const { amount } = req.body;
  const result = await pcService.replenish(fundId, amount, req.user.id);
  res.json({ status: 'success', message: 'Fund replenished', data: result });
});

exports.reconcile = catchAsync(async (req, res) => {
  const { fundId } = req.params;
  const { actualBalance, notes } = req.body;
  const result = await pcService.reconcile(fundId, actualBalance, req.user.id, notes);
  res.json({ status: 'success', message: 'Fund reconciled', data: result });
});

exports.getSummary = catchAsync(async (req, res) => {
  const summary = await pcRepo.getFundSummary();
  res.json({ status: 'success', data: summary });
});
