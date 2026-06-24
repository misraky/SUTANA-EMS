class ChartOfAccountsModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.accountCode = data.account_code || data.accountCode || '';
    this.accountName = data.account_name || data.accountName || '';
    this.accountType = data.account_type || data.accountType || 'expense';
    this.accountClass = data.account_class || data.accountClass || '';
    this.parentId = data.parent_id || data.parentId || null;
    this.isActive = data.is_active !== undefined ? data.is_active : data.isActive !== undefined ? data.isActive : true;
    this.isControlAccount = data.is_control_account || data.isControlAccount || false;
    this.description = data.description || '';
    this.createdAt = data.created_at || data.createdAt || null;
    this.updatedAt = data.updated_at || data.updatedAt || null;
  }

  toJSON() {
    return {
      id: this.id,
      accountCode: this.accountCode,
      accountName: this.accountName,
      accountType: this.accountType,
      accountClass: this.accountClass,
      parentId: this.parentId,
      isActive: this.isActive,
      isControlAccount: this.isControlAccount,
      description: this.description,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromDatabase(data) {
    return new ChartOfAccountsModel(data);
  }

  static getAccountTypes() {
    return ['asset', 'liability', 'equity', 'revenue', 'expense'];
  }
}

module.exports = ChartOfAccountsModel;
