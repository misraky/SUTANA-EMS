class ExpenseModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.categoryId = data.category_id || data.categoryId || null;
    this.categoryName = data.category_name || data.categoryName || '';
    this.categoryRequiresApproval = data.requires_approval || data.categoryRequiresApproval || false;
    this.categoryApprovalLimit = data.approval_limit || data.categoryApprovalLimit || null;
    this.amount = data.amount || 0;
    this.date = data.date || null;
    this.description = data.description || '';
    this.paymentMethodId = data.payment_method_id || data.paymentMethodId || null;
    this.paymentMethodName = data.payment_method_name || data.paymentMethodName || '';
    this.referenceNumber = data.reference_number || data.referenceNumber || '';
    this.receiptPath = data.receipt_path || data.receiptPath || '';
    this.enteredBy = data.entered_by || data.enteredBy || null;
    this.enteredByName = data.entered_by_name || data.enteredByName || '';
    this.approvedBy = data.approved_by || data.approvedBy || null;
    this.approvedByName = data.approved_by_name || data.approvedByName || '';
    this.approvedAt = data.approved_at || data.approvedAt || null;
    this.rejectionReason = data.rejection_reason || data.rejectionReason || '';
    this.createdAt = data.created_at || data.createdAt || null;
    this.updatedAt = data.updated_at || data.updatedAt || null;
    this.deletedAt = data.deleted_at || data.deletedAt || null;
  }
  /**
   * Get expense categories
   * @returns {Object[]}
   */
  static getCategories() {
    return [
      { id: 1, name: 'Utility', requiresApproval: false, approvalLimit: null, icon: 'bolt' },
      { id: 2, name: 'Salary', requiresApproval: true, approvalLimit: 50000, icon: 'users' },
      { id: 3, name: 'Rent', requiresApproval: true, approvalLimit: 100000, icon: 'building' },
      { id: 4, name: 'Supplies', requiresApproval: false, approvalLimit: null, icon: 'box' },
      { id: 5, name: 'Maintenance', requiresApproval: true, approvalLimit: 20000, icon: 'wrench' },
      { id: 6, name: 'Other', requiresApproval: false, approvalLimit: null, icon: 'ellipsis-h' }
    ];
  }
  static getPaymentMethods() {
    return [
      { id: 1, name: 'Cash', icon: 'money-bill' },
      { id: 3, name: 'Bank Transfer', icon: 'university' }
    ];
  }
  validate() {
    const errors = [];
    if (!this.categoryId) {
      errors.push('Category ID is required');
    }
    if (!this.amount || this.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }
    if (!this.date) {
      errors.push('Date is required');
    }
    if (this.date && new Date(this.date) > new Date()) {
      errors.push('Expense date cannot be in the future');
    }
    if (!this.description || this.description.length < 5) {
      errors.push('Description must be at least 5 characters');
    }
    if (this.description && this.description.length > 500) {
      errors.push('Description cannot exceed 500 characters');
    }
    if (!this.paymentMethodId) {
      errors.push('Payment method is required');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  getCategory() {
    return ExpenseModel.getCategories().find(c => c.id === this.categoryId) || null;
  }
  getCategoryName() {
    const category = this.getCategory();
    return category ? category.name : 'Other';
  }
  getCategoryIcon() {
    const category = this.getCategory();
    return category ? category.icon : 'ellipsis-h';
  }
  requiresApproval() {
    const category = this.getCategory();
    if (!category) return false;
    return category.requiresApproval && this.amount > (category.approvalLimit || 0);
  }
  isApproved() {
    return !!this.approvedAt;
  }
  isPending() {
    return !this.approvedAt && !this.rejectionReason;
  }
  isRejected() {
    return !!this.rejectionReason;
  }
  getApprovalStatus() {
    if (this.isApproved()) {
      return { text: 'Approved', color: '#10B981', variant: 'success', icon: 'check-circle' };
    }
    if (this.isRejected()) {
      return { text: 'Rejected', color: '#EF4444', variant: 'error', icon: 'times-circle' };
    }
    if (this.requiresApproval()) {
      return { text: 'Pending Approval', color: '#F59E0B', variant: 'warning', icon: 'clock' };
    }
    return { text: 'Approval Not Required', color: '#6B7280', variant: 'default', icon: 'check' };
  }
  getFormattedAmount() {
    return `${this.amount.toLocaleString()} ETB`;
  }
  getPaymentMethod() {
    return ExpenseModel.getPaymentMethods().find(p => p.id === this.paymentMethodId) || null;
  }
  getPaymentMethodIcon() {
    const method = this.getPaymentMethod();
    return method ? method.icon : 'credit-card';
  }
  getReceiptUrl() {
    if (!this.receiptPath) return null;
    return `/uploads/expenses/${this.receiptPath}`;
  }
  toJSON() {
    return {
      id: this.id,
      categoryId: this.categoryId,
      categoryName: this.getCategoryName(),
      categoryIcon: this.getCategoryIcon(),
      amount: this.amount,
      formattedAmount: this.getFormattedAmount(),
      date: this.date,
      description: this.description,
      paymentMethodId: this.paymentMethodId,
      paymentMethodName: this.paymentMethodName,
      paymentMethodIcon: this.getPaymentMethodIcon(),
      referenceNumber: this.referenceNumber,
      receiptPath: this.receiptPath,
      receiptUrl: this.getReceiptUrl(),
      enteredBy: this.enteredBy,
      enteredByName: this.enteredByName,
      approvedBy: this.approvedBy,
      approvedByName: this.approvedByName,
      approvedAt: this.approvedAt,
      rejectionReason: this.rejectionReason,
      requiresApproval: this.requiresApproval(),
      approvalStatus: this.getApprovalStatus(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
  static fromDatabase(data) {
    return new ExpenseModel(data);
  }
  static fromRequest(data, userId) {
    return new ExpenseModel({
      categoryId: data.categoryId,
      amount: data.amount,
      date: data.date,
      description: data.description,
      paymentMethodId: data.paymentMethodId,
      referenceNumber: data.referenceNumber,
      enteredBy: userId
    });
  }
  static getCreationRules() {
    return {
      categoryId: { required: true, type: 'integer', min: 1 },
      amount: { required: true, type: 'float', min: 0.01 },
      date: { required: true, type: 'date', max: 'today' },
      description: { required: true, min: 5, max: 500 },
      paymentMethodId: { required: true, type: 'integer', min: 1 },
      referenceNumber: { max: 100 }
    };
  }
  static getUpdateRules() {
    return {
      categoryId: { type: 'integer', min: 1 },
      amount: { type: 'float', min: 0.01 },
      date: { type: 'date', max: 'today' },
      description: { min: 5, max: 500 },
      paymentMethodId: { type: 'integer', min: 1 },
      referenceNumber: { max: 100 }
    };
  }
  static getApprovalRules() {
    return {
      approved: { required: true, type: 'boolean' },
      rejectionReason: { min: 10, max: 500 }
    };
  }
  static getStatistics(expenses) {
    const stats = {
      totalExpenses: expenses.length,
      totalAmount: 0,
      averageAmount: 0,
      byCategory: {},
      byMonth: {},
      approvedAmount: 0,
      pendingAmount: 0
    };
    for (const expense of expenses) {
      stats.totalAmount += expense.amount;
      if (expense.isApproved()) {
        stats.approvedAmount += expense.amount;
      } else if (expense.isPending()) {
        stats.pendingAmount += expense.amount;
      }
      const categoryName = expense.getCategoryName();
      if (!stats.byCategory[categoryName]) {
        stats.byCategory[categoryName] = { count: 0, amount: 0 };
      }
      stats.byCategory[categoryName].count++;
      stats.byCategory[categoryName].amount += expense.amount;
      if (expense.date) {
        const month = expense.date.substring(0, 7);
        if (!stats.byMonth[month]) {
          stats.byMonth[month] = { count: 0, amount: 0 };
        }
        stats.byMonth[month].count++;
        stats.byMonth[month].amount += expense.amount;
      }
    }
    stats.averageAmount = stats.totalExpenses > 0 ? stats.totalAmount / stats.totalExpenses : 0;
    return stats;
  }
  static filterByCategory(expenses, categoryId) {
    if (!categoryId) return expenses;
    return expenses.filter(expense => expense.categoryId === categoryId);
  }
  static filterByDateRange(expenses, startDate, endDate) {
    if (!startDate && !endDate) return expenses;
    return expenses.filter(expense => {
      if (startDate && expense.date < startDate) return false;
      if (endDate && expense.date > endDate) return false;
      return true;
    });
  }
  static filterByApprovalStatus(expenses, status) {
    switch (status) {
      case 'approved':
        return expenses.filter(e => e.isApproved());
      case 'pending':
        return expenses.filter(e => e.isPending());
      case 'rejected':
        return expenses.filter(e => e.isRejected());
      default:
        return expenses;
    }
  }
  static getPendingApprovals(expenses) {
    return expenses.filter(e => e.requiresApproval() && e.isPending());
  }
}
module.exports = ExpenseModel;
