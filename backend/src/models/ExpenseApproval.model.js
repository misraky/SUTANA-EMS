class ExpenseApproverModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.userId = data.user_id || data.userId || null;
    this.approvalTier = data.approval_tier || data.approvalTier || 'manager';
    this.minAmount = data.min_amount || data.minAmount || 0;
    this.maxAmount = data.max_amount || data.maxAmount || 999999999.99;
    this.isActive = data.is_active !== undefined ? data.is_active : data.isActive !== undefined ? data.isActive : true;
    this.priority = data.priority || 0;
    this.createdAt = data.created_at || data.createdAt || null;
  }

  canApprove(amount) {
    return this.isActive && amount >= this.minAmount && amount <= this.maxAmount;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      approvalTier: this.approvalTier,
      minAmount: this.minAmount,
      maxAmount: this.maxAmount,
      isActive: this.isActive,
      priority: this.priority
    };
  }

  static fromDatabase(data) {
    return new ExpenseApproverModel(data);
  }
}

class ExpenseApprovalRequestModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.expenseId = data.expense_id || data.expenseId || null;
    this.approverId = data.approver_id || data.approverId || null;
    this.approverName = data.approver_name || data.approverName || '';
    this.tier = data.tier || 'manager';
    this.status = data.status || 'pending';
    this.comments = data.comments || '';
    this.actionedAt = data.actioned_at || data.actionedAt || null;
    this.createdAt = data.created_at || data.createdAt || null;
    this.updatedAt = data.updated_at || data.updatedAt || null;
  }

  isPending() { return this.status === 'pending'; }
  isApproved() { return this.status === 'approved'; }
  isRejected() { return this.status === 'rejected'; }

  toJSON() {
    return {
      id: this.id,
      expenseId: this.expenseId,
      approverId: this.approverId,
      approverName: this.approverName,
      tier: this.tier,
      status: this.status,
      comments: this.comments,
      actionedAt: this.actionedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromDatabase(data) {
    return new ExpenseApprovalRequestModel(data);
  }
}

module.exports = { ExpenseApproverModel, ExpenseApprovalRequestModel };
