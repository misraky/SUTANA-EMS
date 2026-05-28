class SupplierModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.contactPerson = data.contact_person || data.contactPerson || '';
    this.phone = data.phone || '';
    this.email = data.email || '';
    this.address = data.address || '';
    this.paymentTermsId = data.payment_terms_id || data.paymentTermsId || null;
    this.paymentTermsName = data.payment_terms_name || data.paymentTermsName || '';
    this.daysNet = data.days_net || data.daysNet || 30;
    this.leadTimeDays = data.lead_time_days || data.leadTimeDays || 7;
    this.taxId = data.tax_id || data.taxId || '';
    this.bankAccount = data.bank_account || data.bankAccount || '';
    this.isActive = data.is_active ?? data.isActive ?? true;
    this.createdAt = data.created_at || data.createdAt || null;
    this.updatedAt = data.updated_at || data.updatedAt || null;
    this.deletedAt = data.deleted_at || data.deletedAt || null;
    // Extended fields
    this.poCount = data.po_count || data.poCount || 0;
    this.totalSpent = data.total_spent || data.totalSpent || 0;
    this.outstandingBalance = data.outstanding_balance || data.outstandingBalance || 0;
    this.recentPOs = data.recentPOs || [];
  }
  /**
   * Get valid payment terms
   * @returns {Object[]}
   */
  static getPaymentTerms() {
    return [
      { id: 1, name: 'Net 30', daysNet: 30 },
      { id: 2, name: 'Net 60', daysNet: 60 },
      { id: 3, name: 'COD', daysNet: 0 },
      { id: 4, name: 'Prepaid', daysNet: 0 }
    ];
  }
  validate() {
    const errors = [];
    if (!this.name || this.name.length < 2 || this.name.length > 200) {
      errors.push('Supplier name must be between 2 and 200 characters');
    }
    if (!this.contactPerson || this.contactPerson.length < 2 || this.contactPerson.length > 100) {
      errors.push('Contact person name must be between 2 and 100 characters');
    }
    if (!this.phone || !this.isValidEthiopianPhone(this.phone)) {
      errors.push('Valid Ethiopian phone number (09xxxxxxxx) is required');
    }
    if (!this.email || !this.isValidEmail(this.email)) {
      errors.push('Valid email address is required');
    }
    if (!this.address || this.address.length < 5) {
      errors.push('Address must be at least 5 characters');
    }
    if (this.leadTimeDays < 0 || this.leadTimeDays > 90) {
      errors.push('Lead time days must be between 0 and 90');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  isValidEthiopianPhone(phone) {
    const phoneRegex = /^09[0-9]{8}$/;
    return phoneRegex.test(phone);
  }
  getPaymentTerm() {
    return SupplierModel.getPaymentTerms().find(t => t.id === this.paymentTermsId) || null;
  }
  getPaymentTermName() {
    const term = this.getPaymentTerm();
    return term ? term.name : 'Net 30';
  }
  getDaysNet() {
    const term = this.getPaymentTerm();
    return term ? term.daysNet : 30;
  }
  getFormattedAddress() {
    return this.address.replace(/\n/g, ', ');
  }
  isActiveSupplier() {
    return this.isActive && !this.deletedAt;
  }
  getStatus() {
    if (this.deletedAt) {
      return { text: 'Deleted', color: '#EF4444', variant: 'error' };
    }
    if (this.isActive) {
      return { text: 'Active', color: '#10B981', variant: 'success' };
    }
    return { text: 'Inactive', color: '#6B7280', variant: 'default' };
  }
  getAverageOrderValue() {
    if (this.poCount === 0) return 0;
    return this.totalSpent / this.poCount;
  }
  getPaymentStatus() {
    if (this.outstandingBalance === 0) {
      return { text: 'Fully Paid', color: '#10B981', variant: 'success' };
    }
    if (this.outstandingBalance > 0) {
      return { text: `Outstanding: ${this.outstandingBalance.toLocaleString()} ETB`, color: '#F59E0B', variant: 'warning' };
    }
    return { text: 'Overpaid', color: '#EF4444', variant: 'error' };
  }
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      contactPerson: this.contactPerson,
      phone: this.phone,
      email: this.email,
      address: this.address,
      formattedAddress: this.getFormattedAddress(),
      paymentTermsId: this.paymentTermsId,
      paymentTermsName: this.getPaymentTermName(),
      daysNet: this.getDaysNet(),
      leadTimeDays: this.leadTimeDays,
      taxId: this.taxId,
      bankAccount: this.bankAccount,
      isActive: this.isActive,
      status: this.getStatus(),
      poCount: this.poCount,
      totalSpent: this.totalSpent,
      averageOrderValue: this.getAverageOrderValue(),
      outstandingBalance: this.outstandingBalance,
      paymentStatus: this.getPaymentStatus(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      recentPOs: this.recentPOs
    };
  }
  static fromDatabase(data) {
    return new SupplierModel(data);
  }
  static fromRequest(data) {
    return new SupplierModel({
      name: data.name,
      contactPerson: data.contactPerson,
      phone: data.phone,
      email: data.email,
      address: data.address,
      paymentTermsId: data.paymentTermsId,
      leadTimeDays: data.leadTimeDays || 7,
      taxId: data.taxId,
      bankAccount: data.bankAccount
    });
  }
  static getCreationRules() {
    return {
      name: { required: true, min: 2, max: 200, unique: true },
      contactPerson: { required: true, min: 2, max: 100 },
      phone: { required: true, pattern: /^09[0-9]{8}$/ },
      email: { required: true, type: 'email' },
      address: { required: true, min: 5, max: 500 },
      paymentTermsId: { type: 'integer', min: 1 },
      leadTimeDays: { type: 'integer', min: 0, max: 90 },
      taxId: { max: 50 },
      bankAccount: { max: 100 }
    };
  }
  static getUpdateRules() {
    return {
      name: { min: 2, max: 200, unique: true },
      contactPerson: { min: 2, max: 100 },
      phone: { pattern: /^09[0-9]{8}$/ },
      email: { type: 'email' },
      address: { min: 5, max: 500 },
      paymentTermsId: { type: 'integer', min: 1 },
      leadTimeDays: { type: 'integer', min: 0, max: 90 },
      taxId: { max: 50 },
      bankAccount: { max: 100 },
      isActive: { type: 'boolean' }
    };
  }
  static getStatistics(suppliers) {
    const stats = {
      totalSuppliers: suppliers.length,
      activeSuppliers: 0,
      totalSpent: 0,
      totalOutstanding: 0,
      averageLeadTime: 0,
      topSuppliers: []
    };
    let totalLeadTime = 0;
    for (const supplier of suppliers) {
      if (supplier.isActiveSupplier()) {
        stats.activeSuppliers++;
      }
      stats.totalSpent += supplier.totalSpent;
      stats.totalOutstanding += supplier.outstandingBalance;
      totalLeadTime += supplier.leadTimeDays;
    }
    stats.averageLeadTime = suppliers.length > 0 ? totalLeadTime / suppliers.length : 0;
    stats.topSuppliers = [...suppliers]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
      .map(s => ({
        id: s.id,
        name: s.name,
        totalSpent: s.totalSpent,
        poCount: s.poCount,
        averageOrderValue: s.getAverageOrderValue()
      }));
    return stats;
  }
  static search(suppliers, query) {
    if (!query) return suppliers;
    const lowerQuery = query.toLowerCase();
    return suppliers.filter(supplier => 
      supplier.name.toLowerCase().includes(lowerQuery) ||
      supplier.contactPerson.toLowerCase().includes(lowerQuery) ||
      supplier.email.toLowerCase().includes(lowerQuery) ||
      supplier.phone.includes(lowerQuery)
    );
  }
  static filterByActive(suppliers, isActive) {
    if (isActive === undefined) return suppliers;
    return suppliers.filter(supplier => supplier.isActive === isActive);
  }
  static filterWithOutstanding(suppliers) {
    return suppliers.filter(supplier => supplier.outstandingBalance > 0);
  }
}
module.exports = SupplierModel;
