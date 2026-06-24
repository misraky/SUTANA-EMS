const { db } = require('../config/database');
const AppError = require('../utils/AppError');

const createDraft = async (userId, data) => {
  const { reportType, period, financialYear, title, notes } = data;
  const [id] = await db('report_submissions').insert({
    report_type: reportType,
    period,
    financial_year: financialYear || null,
    title: title || null,
    notes: notes || null,
    submitted_by: userId,
    status: 'draft'
  });
  return db('report_submissions').where({ id }).first();
};

const getMySubmissions = async (userId) => {
  return db('report_submissions')
    .select(
      'report_submissions.*',
      'u.full_name as submitted_by_name'
    )
    .leftJoin('users as u', 'report_submissions.submitted_by', 'u.id')
    .where('report_submissions.submitted_by', userId)
    .orderBy('report_submissions.created_at', 'desc');
};

const getSubmissionById = async (id) => {
  const submission = await db('report_submissions')
    .select(
      'report_submissions.*',
      'sub.full_name as submitted_by_name',
      'ceo.full_name as ceo_actioned_by_name',
      'board.full_name as board_actioned_by_name',
      'rej.full_name as rejected_by_name'
    )
    .leftJoin('users as sub', 'report_submissions.submitted_by', 'sub.id')
    .leftJoin('users as ceo', 'report_submissions.ceo_actioned_by', 'ceo.id')
    .leftJoin('users as board', 'report_submissions.board_actioned_by', 'board.id')
    .leftJoin('users as rej', 'report_submissions.rejected_by', 'rej.id')
    .where('report_submissions.id', id)
    .first();
  if (!submission) throw new AppError('Submission not found', 404);
  return submission;
};

const updateDraft = async (id, userId, data) => {
  const submission = await db('report_submissions').where({ id }).first();
  if (!submission) throw new AppError('Submission not found', 404);
  if (submission.submitted_by !== userId) throw new AppError('Not authorized', 403);
  if (submission.status !== 'draft') throw new AppError('Only drafts can be edited', 400);

  const updates = {};
  if (data.reportType) updates.report_type = data.reportType;
  if (data.period) updates.period = data.period;
  if (data.financialYear) updates.financial_year = data.financialYear;
  if (data.title !== undefined) updates.title = data.title;
  if (data.notes !== undefined) updates.notes = data.notes;

  await db('report_submissions').where({ id }).update(updates);
  return db('report_submissions').where({ id }).first();
};

const submitForApproval = async (id, userId) => {
  const submission = await db('report_submissions').where({ id }).first();
  if (!submission) throw new AppError('Submission not found', 404);
  if (submission.submitted_by !== userId) throw new AppError('Not authorized', 403);
  if (submission.status !== 'draft') throw new AppError('Already submitted', 400);

  await db('report_submissions').where({ id }).update({ status: 'submitted' });
  return db('report_submissions').where({ id }).first();
};

const getPendingCEOApprovals = async () => {
  return db('report_submissions')
    .select(
      'report_submissions.*',
      'u.full_name as submitted_by_name'
    )
    .leftJoin('users as u', 'report_submissions.submitted_by', 'u.id')
    .where('report_submissions.status', 'submitted')
    .orderBy('report_submissions.created_at', 'asc');
};

const ceoApprove = async (id, userId, comment) => {
  const submission = await db('report_submissions').where({ id }).first();
  if (!submission) throw new AppError('Submission not found', 404);
  if (submission.status !== 'submitted') throw new AppError('Report must be in submitted status', 400);

  await db('report_submissions').where({ id }).update({
    status: 'ceo_approved',
    ceo_comment: comment || null,
    ceo_actioned_by: userId,
    ceo_actioned_at: db.fn.now()
  });
  return db('report_submissions').where({ id }).first();
};

const getPendingBoardApprovals = async () => {
  return db('report_submissions')
    .select(
      'report_submissions.*',
      'u.full_name as submitted_by_name'
    )
    .leftJoin('users as u', 'report_submissions.submitted_by', 'u.id')
    .where('report_submissions.status', 'ceo_approved')
    .orderBy('report_submissions.created_at', 'asc');
};

const boardApprove = async (id, userId, comment) => {
  const submission = await db('report_submissions').where({ id }).first();
  if (!submission) throw new AppError('Submission not found', 404);
  if (submission.status !== 'ceo_approved') throw new AppError('Report must be CEO-approved first', 400);

  await db('report_submissions').where({ id }).update({
    status: 'board_approved',
    board_comment: comment || null,
    board_actioned_by: userId,
    board_actioned_at: db.fn.now()
  });
  return db('report_submissions').where({ id }).first();
};

const reject = async (id, userId, reason) => {
  if (!reason) throw new AppError('Rejection reason is required', 400);
  const submission = await db('report_submissions').where({ id }).first();
  if (!submission) throw new AppError('Submission not found', 404);
  if (!['submitted', 'ceo_approved'].includes(submission.status)) {
    throw new AppError('Report cannot be rejected in its current status', 400);
  }

  await db('report_submissions').where({ id }).update({
    status: 'rejected',
    rejected_by: userId,
    rejection_reason: reason,
    rejected_at: db.fn.now()
  });
  return db('report_submissions').where({ id }).first();
};

const getAllSubmissions = async (status) => {
  let query = db('report_submissions')
    .select(
      'report_submissions.*',
      'u.full_name as submitted_by_name'
    )
    .leftJoin('users as u', 'report_submissions.submitted_by', 'u.id');
  if (status) {
    query = query.where('report_submissions.status', status);
  }
  return query.orderBy('report_submissions.created_at', 'desc');
};

module.exports = {
  createDraft,
  getMySubmissions,
  getSubmissionById,
  updateDraft,
  submitForApproval,
  getPendingCEOApprovals,
  ceoApprove,
  getPendingBoardApprovals,
  boardApprove,
  reject,
  getAllSubmissions
};
