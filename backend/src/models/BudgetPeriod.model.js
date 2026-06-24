class BudgetPeriodModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.periodType = data.period_type || data.periodType || 'monthly';
    this.startDate = data.start_date || data.startDate || null;
    this.endDate = data.end_date || data.endDate || null;
    this.totalBudget = data.total_budget || data.totalBudget || 0;
    this.totalEncumbered = data.total_encumbered || data.totalEncumbered || 0;
    this.totalSpent = data.total_spent || data.totalSpent || 0;
    this.status = data.status || 'draft';
    this.createdBy = data.created_by || data.createdBy || null;
    this.approvedBy = data.approved_by || data.approvedBy || null;
    this.approvedAt = data.approved_at || data.approvedAt || null;
    this.notes = data.notes || '';
    this.createdAt = data.created_at || data.createdAt || null;
    this.updatedAt = data.updated_at || data.updatedAt || null;
  }

  getRemainingBudget() {
    return this.totalBudget - this.totalEncumbered - this.totalSpent;
  }

  getUtilizationPercent() {
    if (this.totalBudget === 0) return 0;
    return ((this.totalEncumbered + this.totalSpent) / this.totalBudget) * 100;
  }

  canEncumber(amount) {
    return this.status === 'active' && this.getRemainingBudget() >= amount;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      periodType: this.periodType,
      startDate: this.startDate,
      endDate: this.endDate,
      totalBudget: this.totalBudget,
      totalEncumbered: this.totalEncumbered,
      totalSpent: this.totalSpent,
      remainingBudget: this.getRemainingBudget(),
      utilizationPercent: this.getUtilizationPercent(),
      status: this.status,
      createdBy: this.createdBy,
      approvedBy: this.approvedBy,
      approvedAt: this.approvedAt,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromDatabase(data) {
    return new BudgetPeriodModel(data);
  }
}

module.exports = BudgetPeriodModel;
