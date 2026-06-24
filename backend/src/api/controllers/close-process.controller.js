const { catchAsync } = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const closeService = require('../../services/close-process.service');
const ClosePeriodRepository = require('../../repositories/close-period.repository');
const closeRepo = new ClosePeriodRepository();

exports.getReadiness = catchAsync(async (req, res) => {
  const { period } = req.params;
  const readiness = await closeService.getCloseReadiness(period);
  res.json({ status: 'success', data: readiness });
});

exports.executeClose = catchAsync(async (req, res) => {
  const { period } = req.params;
  const { notes } = req.body;
  const result = await closeService.executeClose(period, req.user.id, notes);
  res.json({ status: 'success', message: `Period ${period} closed`, data: result });
});

exports.reopenPeriod = catchAsync(async (req, res) => {
  const { period } = req.params;
  const { reason } = req.body;
  if (!reason) throw new AppError('Reason required to reopen period', 400);
  const result = await closeService.reopenPeriod(period, req.user.id, reason);
  res.json({ status: 'success', message: `Period ${period} reopened`, data: result });
});

exports.getPeriodHistory = catchAsync(async (req, res) => {
  const periods = await closeRepo.getPeriodHistory();
  res.json({ status: 'success', data: { periods } });
});

exports.getCurrentPeriod = catchAsync(async (req, res) => {
  const period = await closeRepo.getCurrentPeriod();
  res.json({ status: 'success', data: { period } });
});
