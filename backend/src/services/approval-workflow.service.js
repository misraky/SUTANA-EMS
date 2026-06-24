const { db, transaction } = require('../config/database');
const { audit } = require('../config/logger');
const { sendEmail } = require('./email.service');
const AppError = require('../utils/AppError');
const ApprovalRepository = require('../repositories/approval.repository');
const approvalRepo = new ApprovalRepository();

const APPROVAL_THRESHOLDS = {
  manager: { min: 0, max: 50000 },
  director: { min: 50001, max: 200000 },
  ceo: { min: 200001, max: 999999999.99 }
};

const determineTierForAmount = (amount) => {
  if (amount <= APPROVAL_THRESHOLDS.manager.max) return 'manager';
  if (amount <= APPROVAL_THRESHOLDS.director.max) return 'director';
  return 'ceo';
};

const getTierSequence = (tier) => {
  const tiers = ['manager', 'director', 'ceo'];
  const idx = tiers.indexOf(tier);
  return tiers.slice(0, idx + 1);
};

const initiateApprovalWorkflow = async (expenseId, amount, description, categoryName, requesterId) => {
  const tier = determineTierForAmount(amount);
  const tierSequence = getTierSequence(tier);
  const requester = await db('users').where('id', requesterId).first();
  let currentTier = null;

  for (const t of tierSequence) {
    currentTier = t;
    const approvers = await approvalRepo.getApproversForTier(t, amount);
    if (approvers.length === 0) continue;

    for (const approver of approvers) {
      await approvalRepo.createApprovalRequest({
        expense_id: expenseId,
        approver_id: approver.user_id,
        tier: t,
        status: 'pending'
      });
      await db('notifications').insert({
        user_id: approver.user_id,
        title: 'Expense Approval Required',
        message: `${categoryName} expense of ${amount} ETB requires your ${t} approval. "${description.substring(0, 100)}"`,
        created_at: db.fn.now()
      });
      await sendEmail({
        to: approver.email,
        subject: `[${t.toUpperCase()}] Expense Approval Required: ${categoryName} - ${amount} ETB`,
        template: 'expense-approval-request',
        data: {
          approverName: approver.full_name,
          category: categoryName,
          amount,
          description,
          requesterName: requester?.full_name || 'Unknown',
          expenseId,
          approvalUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/finance/expenses`
        }
      }).catch(() => {});
    }
  }

  await db('expenses').where('id', expenseId).update({ approval_tier: tier });
  return { tier, tierSequence: tierSequence.filter(t => t !== currentTier || true) };
};

const processApprovalDecision = async (expenseId, userId, approved, comments) => {
  const user = await db('users').where('id', userId).first();
  const approvalRequests = await approvalRepo.getApprovalHistory(expenseId);
  const myPending = approvalRequests.find(r => r.approver_id === userId && r.status === 'pending');
  if (!myPending) throw new AppError('No pending approval request found for you on this expense', 400);

  const expense = await db('expenses as e')
    .leftJoin('expense_categories as ec', 'e.category_id', 'ec.id')
    .select('e.*', 'ec.name as category_name')
    .where('e.id', expenseId)
    .first();
  if (!expense) throw new AppError('Expense not found', 404);

  if (approved) {
    await approvalRepo.updateApprovalStatus(myPending.id, 'approved', comments || '', userId);
    const allSameTier = approvalRequests.filter(r => r.tier === myPending.tier);
    const allApprovedInTier = allSameTier.every(r =>
      r.id === myPending.id || r.status === 'approved'
    );
    if (allApprovedInTier) {
      const tiers = ['manager', 'director', 'ceo'];
      const currentTierIdx = tiers.indexOf(myPending.tier);
      const nextTier = tiers[currentTierIdx + 1];
      const nextPending = nextTier ? approvalRequests.find(r => r.tier === nextTier && r.status === 'pending') : null;
      if (nextPending) {
        const nextApprover = await db('users').where('id', nextPending.approver_id).first();
        await sendEmail({
          to: nextApprover?.email,
          subject: `Expense Escalated: ${expense.category_name} - ${expense.amount} ETB`,
          template: 'expense-approval-request',
          data: {
            approverName: nextApprover?.full_name || 'Approver',
            category: expense.category_name,
            amount: expense.amount,
            description: expense.description,
            requesterName: user?.full_name || 'Unknown',
            expenseId,
            approvalUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/finance/expenses`
          }
        }).catch(() => {});
      } else {
        await db('expenses').where('id', expenseId).update({
          approved_by: userId,
          approved_at: db.fn.now(),
          updated_at: db.fn.now()
        });
        const creator = await db('users').where('id', expense.entered_by).first();
        if (creator) {
          await sendEmail({
            to: creator.email,
            subject: `Expense Approved: ${expense.category_name} - ${expense.amount} ETB`,
            template: 'expense-approved',
            data: {
              name: creator.full_name,
              category: expense.category_name,
              amount: expense.amount,
              description: expense.description,
              approvedBy: user?.full_name || 'Unknown',
              approvedAt: new Date().toISOString()
            }
          }).catch(() => {});
        }
      }
    }
  } else {
    await approvalRepo.updateApprovalStatus(myPending.id, 'rejected', comments || '', userId);
    await db('expenses').where('id', expenseId).update({
      rejection_reason: comments,
      updated_at: db.fn.now()
    });
    const remaining = approvalRequests.filter(r => r.status === 'pending' && r.id !== myPending.id);
    for (const r of remaining) {
      await approvalRepo.updateApprovalStatus(r.id, 'skipped', 'Preceding tier rejected', null);
    }
    await db('budget_encumbrances')
      .where('expense_id', expenseId)
      .where('status', 'encumbered')
      .update({ status: 'released', released_at: db.fn.now() });
    const creator = await db('users').where('id', expense.entered_by).first();
    if (creator) {
      await sendEmail({
        to: creator.email,
        subject: `Expense Rejected: ${expense.category_name} - ${expense.amount} ETB`,
        template: 'expense-rejected',
        data: {
          name: creator.full_name,
          category: expense.category_name,
          amount: expense.amount,
          description: expense.description,
          reason: comments
        }
      }).catch(() => {});
    }
  }
  return { approved };
};

const getApprovalDashboard = async (userId) => {
  const pending = await approvalRepo.getPendingForApprover(userId);
  const allRequests = await db('expense_approval_requests as ear')
    .join('expenses as e', 'ear.expense_id', 'e.id')
    .join('expense_categories as ec', 'e.category_id', 'ec.id')
    .join('users as u', 'e.entered_by', 'u.id')
    .select(
      'ear.*',
      'e.amount',
      'e.description',
      'e.date',
      'ec.name as category_name',
      'u.full_name as entered_by_name'
    )
    .where('ear.approver_id', userId)
    .orderBy('ear.created_at', 'desc')
    .limit(50);
  return {
    pending,
    history: allRequests,
    summary: {
      totalPending: pending.length,
      totalAmount: pending.reduce((s, r) => s + parseFloat(r.amount || 0), 0)
    }
  };
};

module.exports = {
  determineTierForAmount,
  initiateApprovalWorkflow,
  processApprovalDecision,
  getApprovalDashboard,
  APPROVAL_THRESHOLDS
};
