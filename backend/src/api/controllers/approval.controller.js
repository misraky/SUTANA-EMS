const { db } = require('../../config/database');
const { catchAsync } = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const approvalWorkflow = require('../../services/approval-workflow.service');
const ApprovalRepository = require('../../repositories/approval.repository');
const { audit } = require('../../config/logger');
const approvalRepo = new ApprovalRepository();

exports.getDashboard = catchAsync(async (req, res) => {
  const dashboard = await approvalWorkflow.getApprovalDashboard(req.user.id);
  res.json({ status: 'success', data: dashboard });
});

exports.getExpenseApprovalHistory = catchAsync(async (req, res) => {
  const history = await approvalRepo.getApprovalHistory(req.params.expenseId);
  res.json({ status: 'success', data: { history } });
});

exports.processApproval = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { approved, comments } = req.body;
  const result = await approvalWorkflow.processApprovalDecision(id, req.user.id, approved, comments);
  await audit(approved ? 'EXPENSE_APPROVED' : 'EXPENSE_REJECTED', id, {
    ip: req.ip,
    details: { approved, comments, userId: req.user.id }
  });
  res.json({ status: 'success', message: approved ? 'Expense approved' : 'Expense rejected', data: result });
});

exports.getApprovers = catchAsync(async (req, res) => {
  const approvers = await db('expense_approvers as ea')
    .join('users as u', 'ea.user_id', 'u.id')
    .select('ea.*', 'u.full_name', 'u.email')
    .where('ea.is_active', true)
    .orderBy('ea.approval_tier', 'asc')
    .orderBy('ea.priority', 'asc');
  res.json({ status: 'success', data: { approvers } });
});

exports.setApprover = catchAsync(async (req, res) => {
  const { userId, approvalTier, minAmount, maxAmount, priority } = req.body;
  const [id] = await db('expense_approvers').insert({
    user_id: userId, approval_tier: approvalTier,
    min_amount: minAmount ?? 0, max_amount: maxAmount ?? 999999999.99,
    priority: priority ?? 0, is_active: true
  });
  await audit('APPROVER_CONFIGURED', id, { ip: req.ip, details: { userId, approvalTier } });
  res.status(201).json({ status: 'success', data: { approverId: id } });
});


