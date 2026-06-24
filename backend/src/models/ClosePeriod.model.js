class ClosePeriodModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.closePeriod = data.close_period || data.closePeriod || '';
    this.closeDate = data.close_date || data.closeDate || null;
    this.status = data.status || 'open';
    this.closedAt = data.closed_at || data.closedAt || null;
    this.closedBy = data.closed_by || data.closedBy || null;
    this.closedByName = data.closed_by_name || data.closedByName || '';
    this.reopenedBy = data.reopened_by || data.reopenedBy || null;
    this.reopenedAt = data.reopened_at || data.reopenedAt || null;
    this.checklistResults = data.checklist_results || data.checklistResults || '';
    this.notes = data.notes || '';
    this.createdAt = data.created_at || data.createdAt || null;
    this.updatedAt = data.updated_at || data.updatedAt || null;
  }

  isClosed() { return this.status === 'closed'; }
  isOpen() { return this.status === 'open'; }

  toJSON() {
    return {
      id: this.id,
      closePeriod: this.closePeriod,
      closeDate: this.closeDate,
      status: this.status,
      closedAt: this.closedAt,
      closedBy: this.closedBy,
      closedByName: this.closedByName,
      reopenedBy: this.reopenedBy,
      reopenedAt: this.reopenedAt,
      checklistResults: this.checklistResults,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromDatabase(data) {
    return new ClosePeriodModel(data);
  }
}

module.exports = ClosePeriodModel;
