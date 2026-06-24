class PettyCashFundModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.fundName = data.fund_name || data.fundName || '';
    this.imprestAmount = data.imprest_amount || data.imprestAmount || 0;
    this.currentBalance = data.current_balance || data.currentBalance || 0;
    this.maxDisbursement = data.max_disbursement || data.maxDisbursement || 5000;
    this.maxPerTransaction = data.max_per_transaction || data.maxPerTransaction || 2000;
    this.custodianId = data.custodian_id || data.custodianId || null;
    this.custodianName = data.custodian_name || data.custodianName || '';
    this.status = data.status || 'active';
    this.lastReconciledAt = data.last_reconciled_at || data.lastReconciledAt || null;
    this.createdAt = data.created_at || data.createdAt || null;
    this.updatedAt = data.updated_at || data.updatedAt || null;
  }

  canDisburse(amount) {
    return this.status === 'active' && this.currentBalance >= amount && amount <= this.maxPerTransaction;
  }

  needsReplenishment() {
    return this.currentBalance < (this.imprestAmount * 0.2);
  }

  toJSON() {
    return {
      id: this.id,
      fundName: this.fundName,
      imprestAmount: this.imprestAmount,
      currentBalance: this.currentBalance,
      maxDisbursement: this.maxDisbursement,
      maxPerTransaction: this.maxPerTransaction,
      custodianId: this.custodianId,
      custodianName: this.custodianName,
      status: this.status,
      lastReconciledAt: this.lastReconciledAt,
      needsReplenishment: this.needsReplenishment(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromDatabase(data) {
    return new PettyCashFundModel(data);
  }
}

class PettyCashTransactionModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.fundId = data.fund_id || data.fundId || null;
    this.type = data.type || 'disbursement';
    this.amount = data.amount || 0;
    this.categoryId = data.category_id || data.categoryId || null;
    this.description = data.description || '';
    this.receiptPath = data.receipt_path || data.receiptPath || '';
    this.requestedBy = data.requested_by || data.requestedBy || null;
    this.approvedBy = data.approved_by || data.approvedBy || null;
    this.status = data.status || 'pending';
    this.paidAt = data.paid_at || data.paidAt || null;
    this.notes = data.notes || '';
    this.createdAt = data.created_at || data.createdAt || null;
    this.updatedAt = data.updated_at || data.updatedAt || null;
  }

  toJSON() {
    return {
      id: this.id,
      fundId: this.fundId,
      type: this.type,
      amount: this.amount,
      categoryId: this.categoryId,
      description: this.description,
      receiptPath: this.receiptPath,
      requestedBy: this.requestedBy,
      approvedBy: this.approvedBy,
      status: this.status,
      paidAt: this.paidAt,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromDatabase(data) {
    return new PettyCashTransactionModel(data);
  }
}

module.exports = { PettyCashFundModel, PettyCashTransactionModel };
