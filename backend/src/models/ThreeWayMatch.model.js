class ThreeWayMatchModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.expenseId = data.expense_id || data.expenseId || null;
    this.poId = data.po_id || data.poId || null;
    this.grnId = data.grn_id || data.grnId || null;
    this.matchStatus = data.match_status || data.matchStatus || 'pending';
    this.poAmount = data.po_amount || data.poAmount || 0;
    this.grnAmount = data.grn_amount || data.grnAmount || 0;
    this.invoiceAmount = data.invoice_amount || data.invoiceAmount || 0;
    this.varianceAmount = data.variance_amount || data.varianceAmount || 0;
    this.varianceReason = data.variance_reason || data.varianceReason || '';
    this.matchedBy = data.matched_by || data.matchedBy || null;
    this.matchedAt = data.matched_at || data.matchedAt || null;
    this.createdAt = data.created_at || data.createdAt || null;
    this.updatedAt = data.updated_at || data.updatedAt || null;
  }

  isMatched() { return this.matchStatus === 'matched'; }
  isMismatch() { return this.matchStatus === 'mismatch'; }

  getVariancePercent() {
    if (this.poAmount === 0) return 0;
    return (this.varianceAmount / this.poAmount) * 100;
  }

  toJSON() {
    return {
      id: this.id,
      expenseId: this.expenseId,
      poId: this.poId,
      grnId: this.grnId,
      matchStatus: this.matchStatus,
      poAmount: this.poAmount,
      grnAmount: this.grnAmount,
      invoiceAmount: this.invoiceAmount,
      varianceAmount: this.varianceAmount,
      variancePercent: this.getVariancePercent(),
      varianceReason: this.varianceReason,
      matchedBy: this.matchedBy,
      matchedAt: this.matchedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromDatabase(data) {
    return new ThreeWayMatchModel(data);
  }
}

module.exports = ThreeWayMatchModel;
