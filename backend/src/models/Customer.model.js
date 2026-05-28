class CustomerModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.phone = data.phone || '';
    this.email = data.email || '';
    this.customerTypeId = data.customer_type_id || data.customerTypeId || null;
    this.customerTypeName = data.customer_type_name || data.customerTypeName || '';
    this.customerTypeColor = data.customer_type_color || data.customerTypeColor || '';
    this.address = data.address || '';
    this.taxId = data.tax_id || data.taxId || '';
    this.creditLimit = data.credit_limit || data.creditLimit || 0;
    this.currentBalance = data.current_balance || data.currentBalance || 0;
    this.userId = data.user_id || data.userId || null;
    this.createdBy = data.created_by || data.createdBy || null;
    this.createdByName = data.created_by_name || data.createdByName || '';
    this.createdAt = data.created_at || data.createdAt || null;
    this.updatedAt = data.updated_at || data.updatedAt || null;
    this.deletedAt = data.deleted_at || data.deletedAt || null;
    // Extended fields from joins
    this.orderCount = data.order_count || data.orderCount || 0;
    this.totalSpent = data.total_spent || data.totalSpent || 0;
    this.lastOrderDate = data.last_order_date || data.lastOrderDate || null;
    this.recentOrders = data.recentOrders || [];
    this.paymentHistory = data.paymentHistory || [];
  }
  /**
   * Get valid customer types
   * @returns {Object[]}
   */
  static getCustomerTypes() {
    return [
      { id: 1, name: 'Government', color: '#EF4444', icon: 'building', sortOrder: 1 },
      { id: 2, name: 'Scholar', color: '#3B82F6', icon: 'graduation-cap', sortOrder: 2 },
      { id: 3, name: 'Lecturer', color: '#10B981', icon: 'chalkboard-user', sortOrder: 3 },
      { id: 4, name: 'Church', color: '#8B5CF6', icon: 'church', sortOrder: 4 },
      { id: 5, name: 'Regular', color: '#6B7280', icon: 'user', sortOrder: 5 }
    ];
  }
  validate() {
    const errors = [];
    if (!this.name || this.name.length < 2 || this.name.length > 100) {
      errors.push('Customer name must be between 2 and 100 characters');
    }
    if (!this.phone || !this.isValidEthiopianPhone(this.phone)) {
      errors.push('Valid Ethiopian phone number (09xxxxxxxx) is required');
    }
    if (this.email && !this.isValidEmail(this.email)) {
      errors.push('Please provide a valid email address');
    }
    if (this.creditLimit < 0) {
      errors.push('Credit limit cannot be negative');
    }
    if (this.currentBalance < 0) {
      errors.push('Current balance cannot be negative');
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
  getCustomerType() {
    return CustomerModel.getCustomerTypes().find(t => t.id === this.customerTypeId) || null;
  }
  getCustomerTypeName() {
    const type = this.getCustomerType();
    return type ? type.name : 'Regular';
  }
  getCustomerTypeColor() {
    const type = this.getCustomerType();
    return type ? type.color : '#6B7280';
  }
  getCustomerTypeIcon() {
    const type = this.getCustomerType();
    return type ? type.icon : 'user';
  }
  hasAvailableCredit() {
    return this.currentBalance < this.creditLimit;
  }
  getAvailableCredit() {
    return Math.max(0, this.creditLimit - this.currentBalance);
  }
  getCreditUsagePercentage() {
    if (this.creditLimit <= 0) return 0;
    return (this.currentBalance / this.creditLimit) * 100;
  }
  getCreditStatus() {
    const percentage = this.getCreditUsagePercentage();
    if (percentage >= 90) {
      return { text: 'Critical', color: '#EF4444', variant: 'error' };
    }
    if (percentage >= 75) {
      return { text: 'High', color: '#F59E0B', variant: 'warning' };
    }
    if (percentage >= 50) {
      return { text: 'Moderate', color: '#3B82F6', variant: 'info' };
    }
    if (percentage > 0) {
      return { text: 'Low', color: '#10B981', variant: 'success' };
    }
    return { text: 'None', color: '#6B7280', variant: 'default' };
  }
  hasOverdueBalance(daysThreshold = 30) {
    if (this.currentBalance <= 0) return false;
    if (!this.lastOrderDate) return false;
    const lastOrder = new Date(this.lastOrderDate);
    const now = new Date();
    const daysSinceLastOrder = (now - lastOrder) / (1000 * 60 * 60 * 24);
    return daysSinceLastOrder > daysThreshold;
  }
  getBalanceStatus() {
    if (this.currentBalance === 0) {
      return { text: 'No Balance', color: '#10B981', variant: 'success' };
    }
    if (this.hasOverdueBalance()) {
      return { text: 'Overdue', color: '#EF4444', variant: 'error' };
    }
    return { text: 'Has Balance', color: '#F59E0B', variant: 'warning' };
  }
  addToBalance(amount) {
    this.currentBalance += amount;
  }
  reduceBalance(amount) {
    if (amount > this.currentBalance) return false;
    this.currentBalance -= amount;
    return true;
  }
  getMaskedEmail() {
    if (!this.email) return '';
    const [local, domain] = this.email.split('@');
    if (local.length <= 2) return `${local[0]}***@${domain}`;
    return `${local.substring(0, 2)}${'*'.repeat(local.length - 2)}@${domain}`;
  }
  /**
   * Get masked phone
   * @returns {string}
   */
  getMaskedPhone() {
    if (!this.phone) return '';
    return `${this.phone.substring(0, 3)}****${this.phone.substring(7)}`;
  }
  /**
   * Get customer initials
   * @returns {string}
   */
  getInitials() {
    if (!this.name) return '';
    return this.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
  /**
   * Convert to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      phone: this.phone,
      email: this.email,
      customerTypeId: this.customerTypeId,
      customerTypeName: this.getCustomerTypeName(),
      customerTypeColor: this.getCustomerTypeColor(),
      customerTypeIcon: this.getCustomerTypeIcon(),
      address: this.address,
      taxId: this.taxId,
      creditLimit: this.creditLimit,
      currentBalance: this.currentBalance,
      availableCredit: this.getAvailableCredit(),
      creditUsagePercentage: this.getCreditUsagePercentage(),
      creditStatus: this.getCreditStatus(),
      balanceStatus: this.getBalanceStatus(),
      orderCount: this.orderCount,
      totalSpent: this.totalSpent,
      lastOrderDate: this.lastOrderDate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      recentOrders: this.recentOrders,
      paymentHistory: this.paymentHistory
    };
  }
  /**
   * Create from database row
   * @param {Object} data - Database row
   * @returns {CustomerModel}
   */
  static fromDatabase(data) {
    return new CustomerModel(data);
  }
  /**
   * Create from API request
   * @param {Object} data - Request data
   * @returns {CustomerModel}
   */
  static fromRequest(data) {
    return new CustomerModel({
      name: data.name,
      phone: data.phone,
      email: data.email,
      customerTypeId: data.customerTypeId || 5,
      address: data.address,
      taxId: data.taxId,
      creditLimit: data.creditLimit || 0
    });
  }
  /**
   * Get validation rules for customer creation
   * @returns {Object}
   */
  static getCreationRules() {
    return {
      name: { required: true, min: 2, max: 100 },
      phone: { required: true, pattern: /^09[0-9]{8}$/ },
      email: { type: 'email' },
      customerTypeId: { type: 'integer', min: 1, max: 5 },
      address: { max: 500 },
      taxId: { max: 50 },
      creditLimit: { type: 'float', min: 0 }
    };
  }
  static getUpdateRules() {
    return {
      name: { min: 2, max: 100 },
      phone: { pattern: /^09[0-9]{8}$/ },
      email: { type: 'email' },
      customerTypeId: { type: 'integer', min: 1, max: 5 },
      address: { max: 500 },
      taxId: { max: 50 },
      creditLimit: { type: 'float', min: 0 }
    };
  }
  static getStatistics(customers) {
    const stats = {
      totalCustomers: customers.length,
      totalBalance: 0,
      totalCreditLimit: 0,
      totalSpent: 0,
      overdueCount: 0,
      byType: {},
      topSpenders: []
    };
    for (const customer of customers) {
      stats.totalBalance += customer.currentBalance;
      stats.totalCreditLimit += customer.creditLimit;
      stats.totalSpent += customer.totalSpent;
      if (customer.hasOverdueBalance()) {
        stats.overdueCount++;
      }
      const typeName = customer.getCustomerTypeName();
      if (!stats.byType[typeName]) {
        stats.byType[typeName] = { count: 0, balance: 0, spent: 0 };
      }
      stats.byType[typeName].count++;
      stats.byType[typeName].balance += customer.currentBalance;
      stats.byType[typeName].spent += customer.totalSpent;
    }
    stats.topSpenders = [...customers]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
      .map(c => ({
        id: c.id,
        name: c.name,
        totalSpent: c.totalSpent,
        orderCount: c.orderCount
      }));
    return stats;
  }
  static search(customers, query) {
    if (!query) return customers;
    const lowerQuery = query.toLowerCase();
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(lowerQuery) ||
      customer.phone.includes(lowerQuery) ||
      (customer.email && customer.email.toLowerCase().includes(lowerQuery))
    );
  }
  static filterByType(customers, typeId) {
    if (!typeId) return customers;
    return customers.filter(customer => customer.customerTypeId === typeId);
  }
  static filterWithBalance(customers) {
    return customers.filter(customer => customer.currentBalance > 0);
  }
}
module.exports = CustomerModel;
