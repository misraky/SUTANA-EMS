class PosSaleModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.invoiceNumber = data.invoice_number || data.invoiceNumber || '';
    this.customerId = data.customer_id || data.customerId || null;
    this.customerName = data.customer_name || data.customerName || '';
    this.customerPhone = data.customer_phone || data.customerPhone || '';
    this.customerEmail = data.customer_email || data.customerEmail || '';
    this.subtotal = data.subtotal || 0;
    this.taxAmount = data.tax_amount || data.taxAmount || 0;
    this.discountAmount = data.discount_amount || data.discountAmount || 0;
    this.totalAmount = data.total_amount || data.totalAmount || 0;
    this.paymentMethodId = data.payment_method_id || data.paymentMethodId || null;
    this.paymentMethodName = data.payment_method_name || data.paymentMethodName || '';
    this.paymentReference = data.payment_reference || data.paymentReference || '';
    this.amountPaid = data.amount_paid || data.amountPaid || 0;
    this.changeAmount = data.change_amount || data.changeAmount || 0;
    this.cashierId = data.cashier_id || data.cashierId || null;
    this.cashierName = data.cashier_name || data.cashierName || '';
    this.saleDate = data.sale_date || data.saleDate || null;
    this.statusId = data.status_id || data.statusId || null;
    this.status = data.status || '';
    this.statusName = data.status_name || data.statusName || '';
    this.statusColor = data.status_color || data.statusColor || '';
    this.voidedBy = data.voided_by || data.voidedBy || null;
    this.voidedByName = data.voided_by_name || data.voidedByName || '';
    this.voidReason = data.void_reason || data.voidReason || '';
    this.notes = data.notes || '';
    this.createdAt = data.created_at || data.createdAt || null;
    this.updatedAt = data.updated_at || data.updatedAt || null;
    this.deletedAt = data.deleted_at || data.deletedAt || null;
    // Items
    this.items = data.items || [];
  }
  /**
   * Get valid payment methods
   * @returns {Object[]}
   */
  static getPaymentMethods() {
    return [
      { id: 1, name: 'Cash', requiresReference: false, icon: 'money-bill' },
      { id: 2, name: 'Credit', requiresReference: false, icon: 'credit-card' },
      { id: 3, name: 'Bank Transfer', requiresReference: true, icon: 'university' },
      { id: 4, name: 'Telebirr', requiresReference: true, icon: 'mobile-alt' },
      { id: 5, name: 'Check', requiresReference: true, icon: 'check' }
    ];
  }
  static getStatuses() {
    return {
      completed: { label: 'Completed', color: '#10B981', order: 1 },
      voided: { label: 'Voided', color: '#EF4444', order: 2 },
      refunded: { label: 'Refunded', color: '#F59E0B', order: 3 }
    };
  }
  validate() {
    const errors = [];
    if (this.subtotal < 0) {
      errors.push('Subtotal cannot be negative');
    }
    if (this.totalAmount < 0) {
      errors.push('Total amount cannot be negative');
    }
    if (!this.paymentMethodId) {
      errors.push('Payment method is required');
    }
    if (this.amountPaid < 0) {
      errors.push('Amount paid cannot be negative');
    }
    const paymentMethod = PosSaleModel.getPaymentMethods().find(p => p.id === this.paymentMethodId);
    if (paymentMethod?.requiresReference && !this.paymentReference) {
      errors.push('Payment reference is required for this payment method');
    }
    if (!this.items || this.items.length === 0) {
      errors.push('At least one item is required');
    }
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      if (!item.productId) {
        errors.push(`Item ${i + 1}: Product ID is required`);
      }
      if (!item.quantity || item.quantity < 1) {
        errors.push(`Item ${i + 1}: Quantity must be at least 1`);
      }
      if (item.unitPrice < 0) {
        errors.push(`Item ${i + 1}: Unit price cannot be negative`);
      }
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  calculateTotals() {
    let subtotal = 0;
    for (const item of this.items) {
      const itemTotal = item.quantity * item.unitPrice;
      const itemDiscount = (itemTotal * (item.discountPercent || 0)) / 100;
      item.subtotal = itemTotal;
      item.total = itemTotal - itemDiscount;
      subtotal += item.total;
    }
    const taxAmount = subtotal * 0.15; 
    const totalAmount = subtotal + taxAmount - (this.discountAmount || 0);
    return { subtotal, taxAmount, totalAmount };
  }
  updateTotals() {
    const { subtotal, taxAmount, totalAmount } = this.calculateTotals();
    this.subtotal = subtotal;
    this.taxAmount = taxAmount;
    this.totalAmount = totalAmount;
  }
  calculateChange() {
    if (this.paymentMethodName !== 'Cash') return 0;
    return Math.max(0, this.amountPaid - this.totalAmount);
  }
  isVoidable() {
    return this.status === 'completed';
  }
  isRefundable() {
    return this.status === 'completed';
  }
  getPaymentMethod() {
    return PosSaleModel.getPaymentMethods().find(p => p.id === this.paymentMethodId) || null;
  }
  getPaymentMethodIcon() {
    const method = this.getPaymentMethod();
    return method ? method.icon : 'credit-card';
  }
  getStatus() {
    const statuses = PosSaleModel.getStatuses();
    return statuses[this.status] || { label: this.status, color: '#6B7280' };
  }
  getFormattedInvoiceNumber() {
    return `INV-${this.invoiceNumber}`;
  }
  getReceiptData() {
    return {
      invoiceNumber: this.invoiceNumber,
      date: this.saleDate,
      customer: this.customerName || 'Walk-in Customer',
      cashier: this.cashierName,
      items: this.items.map(item => ({
        name: item.productName,
        quantity: item.quantity,
        price: item.unitPrice,
        discount: item.discountPercent,
        total: item.total
      })),
      subtotal: this.subtotal,
      discount: this.discountAmount,
      tax: this.taxAmount,
      total: this.totalAmount,
      paymentMethod: this.paymentMethodName,
      amountPaid: this.amountPaid,
      change: this.changeAmount
    };
  }
  isCreditSale() {
    return this.paymentMethodName === 'Credit';
  }
  getOutstandingBalance() {
    if (!this.isCreditSale()) return 0;
    return this.totalAmount - this.amountPaid;
  }
  getCreditStatus() {
    if (!this.isCreditSale()) {
      return { text: 'N/A', color: '#6B7280', variant: 'default' };
    }
    const outstanding = this.getOutstandingBalance();
    if (outstanding <= 0) {
      return { text: 'Paid', color: '#10B981', variant: 'success' };
    }
    const daysSinceSale = this.getDaysSinceSale();
    if (daysSinceSale > 30) {
      return { text: `Overdue (${outstanding.toLocaleString()} ETB)`, color: '#EF4444', variant: 'error' };
    }
    return { text: `Pending (${outstanding.toLocaleString()} ETB)`, color: '#F59E0B', variant: 'warning' };
  }
  getDaysSinceSale() {
    if (!this.saleDate) return 0;
    const sale = new Date(this.saleDate);
    const now = new Date();
    return Math.floor((now - sale) / (1000 * 60 * 60 * 24));
  }
  toJSON() {
    return {
      id: this.id,
      invoiceNumber: this.invoiceNumber,
      formattedInvoiceNumber: this.getFormattedInvoiceNumber(),
      customerId: this.customerId,
      customerName: this.customerName,
      customerPhone: this.customerPhone,
      customerEmail: this.customerEmail,
      subtotal: this.subtotal,
      taxAmount: this.taxAmount,
      discountAmount: this.discountAmount,
      totalAmount: this.totalAmount,
      paymentMethodId: this.paymentMethodId,
      paymentMethodName: this.paymentMethodName,
      paymentMethodIcon: this.getPaymentMethodIcon(),
      paymentReference: this.paymentReference,
      amountPaid: this.amountPaid,
      changeAmount: this.changeAmount,
      cashierId: this.cashierId,
      cashierName: this.cashierName,
      saleDate: this.saleDate,
      status: this.status,
      statusName: this.getStatus().label,
      statusColor: this.getStatus().color,
      isCreditSale: this.isCreditSale(),
      outstandingBalance: this.getOutstandingBalance(),
      creditStatus: this.getCreditStatus(),
      voidReason: this.voidReason,
      notes: this.notes,
      items: this.items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent || 0,
        subtotal: item.subtotal,
        total: item.total
      })),
      receipt: this.getReceiptData()
    };
  }
  static fromDatabase(data) {
    const sale = new PosSaleModel(data);
    if (data.items && typeof data.items === 'string') {
      try {
        sale.items = JSON.parse(data.items);
      } catch {
        sale.items = [];
      }
    }
    return sale;
  }
  static fromCart(cartData, checkoutData, cashierId) {
    const sale = new PosSaleModel({
      customerId: checkoutData.customerId,
      discountAmount: cartData.discountAmount || 0,
      paymentMethodId: checkoutData.paymentMethodId,
      paymentReference: checkoutData.paymentReference,
      amountPaid: checkoutData.amountPaid,
      cashierId: cashierId,
      notes: checkoutData.notes,
      items: cartData.items
    });
    sale.updateTotals();
    sale.changeAmount = sale.calculateChange();
    sale.status = 'completed';
    return sale;
  }
  static getCreationRules() {
    return {
      customerId: { type: 'integer' },
      paymentMethodId: { required: true, type: 'integer', min: 1 },
      amountPaid: { required: true, type: 'float', min: 0 },
      paymentReference: { string: true, max: 100 },
      notes: { max: 500 },
      items: { required: true, type: 'array', min: 1 },
      'items.*.productId': { required: true, type: 'integer', min: 1 },
      'items.*.quantity': { required: true, type: 'integer', min: 1 },
      'items.*.unitPrice': { required: true, type: 'float', min: 0 }
    };
  }
  static getVoidRules() {
    return {
      reason: { required: true, min: 5, max: 500 }
    };
  }
  static getStatistics(sales) {
    const stats = {
      totalSales: sales.length,
      totalRevenue: 0,
      totalTax: 0,
      totalDiscount: 0,
      averageOrderValue: 0,
      byPaymentMethod: {},
      byStatus: {},
      byCashier: {},
      byHour: {},
      byDayOfWeek: {}
    };
    for (const sale of sales) {
      stats.totalRevenue += sale.totalAmount;
      stats.totalTax += sale.taxAmount;
      stats.totalDiscount += sale.discountAmount;
      if (!stats.byPaymentMethod[sale.paymentMethodName]) {
        stats.byPaymentMethod[sale.paymentMethodName] = { count: 0, amount: 0 };
      }
      stats.byPaymentMethod[sale.paymentMethodName].count++;
      stats.byPaymentMethod[sale.paymentMethodName].amount += sale.totalAmount;
      if (!stats.byStatus[sale.status]) {
        stats.byStatus[sale.status] = { count: 0, amount: 0 };
      }
      stats.byStatus[sale.status].count++;
      stats.byStatus[sale.status].amount += sale.totalAmount;
      if (!stats.byCashier[sale.cashierName]) {
        stats.byCashier[sale.cashierName] = { count: 0, amount: 0 };
      }
      stats.byCashier[sale.cashierName].count++;
      stats.byCashier[sale.cashierName].amount += sale.totalAmount;
      if (sale.saleDate) {
        const hour = new Date(sale.saleDate).getHours();
        if (!stats.byHour[hour]) {
          stats.byHour[hour] = { count: 0, amount: 0 };
        }
        stats.byHour[hour].count++;
        stats.byHour[hour].amount += sale.totalAmount;
        const dayOfWeek = new Date(sale.saleDate).getDay();
        if (!stats.byDayOfWeek[dayOfWeek]) {
          stats.byDayOfWeek[dayOfWeek] = { count: 0, amount: 0 };
        }
        stats.byDayOfWeek[dayOfWeek].count++;
        stats.byDayOfWeek[dayOfWeek].amount += sale.totalAmount;
      }
    }
    stats.averageOrderValue = stats.totalSales > 0 ? stats.totalRevenue / stats.totalSales : 0;
    return stats;
  }
  static getDailySummary(sales, date) {
    const daySales = sales.filter(s => {
      const saleDate = new Date(s.saleDate).toISOString().split('T')[0];
      return saleDate === date;
    });
    return PosSaleModel.getStatistics(daySales);
  }
  static filterByDateRange(sales, startDate, endDate) {
    if (!startDate && !endDate) return sales;
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    return sales.filter(sale => {
      const saleDate = new Date(sale.saleDate);
      if (start && saleDate < start) return false;
      if (end && saleDate > end) return false;
      return true;
    });
  }
  static filterByCustomer(sales, customerId) {
    if (!customerId) return sales;
    return sales.filter(sale => sale.customerId === customerId);
  }
  static filterByStatus(sales, status) {
    if (!status) return sales;
    return sales.filter(sale => sale.status === status);
  }
  static getTopSellingProducts(sales, limit = 10) {
    const productStats = {};
    for (const sale of sales) {
      for (const item of sale.items) {
        if (!productStats[item.productId]) {
          productStats[item.productId] = {
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            quantity: 0,
            revenue: 0
          };
        }
        productStats[item.productId].quantity += item.quantity;
        productStats[item.productId].revenue += item.total;
      }
    }
    return Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }
}
module.exports = PosSaleModel;
