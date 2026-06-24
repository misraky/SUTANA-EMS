const reportSubmissionService = require('../../services/reportSubmission.service');
const { catchAsync } = require('../../utils/catchAsync');

exports.createDraft = catchAsync(async (req, res) => {
  const submission = await reportSubmissionService.createDraft(req.user.id, req.body);
  res.status(201).json({ status: 'success', data: submission });
});

exports.getMySubmissions = catchAsync(async (req, res) => {
  const submissions = await reportSubmissionService.getMySubmissions(req.user.id);
  res.json({ status: 'success', data: submissions });
});

exports.getSubmissionById = catchAsync(async (req, res) => {
  const submission = await reportSubmissionService.getSubmissionById(req.params.id);
  res.json({ status: 'success', data: submission });
});

exports.updateDraft = catchAsync(async (req, res) => {
  const submission = await reportSubmissionService.updateDraft(req.params.id, req.user.id, req.body);
  res.json({ status: 'success', data: submission });
});

exports.submitForApproval = catchAsync(async (req, res) => {
  const submission = await reportSubmissionService.submitForApproval(req.params.id, req.user.id);
  res.json({ status: 'success', data: submission });
});

exports.getPendingCEO = catchAsync(async (req, res) => {
  const submissions = await reportSubmissionService.getPendingCEOApprovals();
  res.json({ status: 'success', data: submissions });
});

exports.ceoApprove = catchAsync(async (req, res) => {
  const { comment } = req.body;
  const submission = await reportSubmissionService.ceoApprove(req.params.id, req.user.id, comment);
  res.json({ status: 'success', data: submission });
});

exports.getPendingBoard = catchAsync(async (req, res) => {
  const submissions = await reportSubmissionService.getPendingBoardApprovals();
  res.json({ status: 'success', data: submissions });
});

exports.boardApprove = catchAsync(async (req, res) => {
  const { comment } = req.body;
  const submission = await reportSubmissionService.boardApprove(req.params.id, req.user.id, comment);
  res.json({ status: 'success', data: submission });
});

exports.reject = catchAsync(async (req, res) => {
  const { reason } = req.body;
  const submission = await reportSubmissionService.reject(req.params.id, req.user.id, reason);
  res.json({ status: 'success', data: submission });
});

exports.getAllSubmissions = catchAsync(async (req, res) => {
  const { status } = req.query;
  const submissions = await reportSubmissionService.getAllSubmissions(status);
  res.json({ status: 'success', data: submissions });
});
