class OrderModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.orderNumber = data.order_number || data.orderNumber || '';
    this.customerId = data.customer_id || data.customerId || null;
    this.customerName = data.customer_name || data.customerName || '';
    this.customerPhone = data.customer_phone || data.customerPhone || '';
    this.customerEmail = data.customer_email || data.customerEmail || '';
    this.customerTypeId = data.customer_type_id || data.customerTypeId || null;
    this.customerTypeName = data.customer_type_name || data.customerTypeName || '';
    this.customerTypeColor = data.customer_type_color || data.customerTypeColor || '';
    this.productType = data.product_type || data.productType || '';
    this.quantity = data.quantity || 0;
    this.paperType = data.paper_type || data.paperType || '';
    this.pagesPerCopy = data.pages_per_copy || data.pagesPerCopy || 0;
    this.colorPrinting = data.color_printing || data.colorPrinting || false;
    this.bindingType = data.binding_type || data.bindingType || 'None';
    this.dueDate = data.due_date || data.dueDate || null;
    this.specialInstructions = data.special_instructions || data.specialInstructions || '';
    this.attachments = data.attachments || [];
    this.pricePerUnit = data.price_per_unit || data.pricePerUnit || 0;
    this.bindingCost = data.binding_cost || data.bindingCost || 0;
    this.totalPrice = data.total_price || data.totalPrice || 0;
    this.statusId = data.status_id || data.statusId || null;
    this.status = data.status || '';
    this.statusName = data.status_name || data.statusName || '';
    this.statusColor = data.status_color || data.statusColor || '';
    this.createdBy = data.created_by || data.createdBy || null;
    this.createdByName = data.created_by_name || data.createdByName || '';
    this.createdAt = data.created_at || data.createdAt || null;
    this.updatedAt = data.updated_at || data.updatedAt || null;
    this.deletedAt = data.deleted_at || data.deletedAt || null;
    this.statusHistory = data.statusHistory || [];
  }
  /**
   * Validate order data
   * @returns {Object} - { isValid, errors }
   */
  validate() {
    const errors = [];
    if (!this.customerId && (!this.customerName || !this.customerPhone)) {
      errors.push('Customer information is required');
    }
    if (!this.productType) {
      errors.push('Product type is required');
    }
    if (!this.quantity || this.quantity < 1) {
      errors.push('Quantity must be at least 1');
    }
    if (!this.paperType) {
      errors.push('Paper type is required');
    }
    if (!this.pagesPerCopy || this.pagesPerCopy < 1) {
      errors.push('Pages per copy must be at least 1');
    }
    if (!this.dueDate) {
      errors.push('Due date is required');
    }
    if (this.dueDate && new Date(this.dueDate) < new Date()) {
      errors.push('Due date cannot be in the past');
    }
    if (this.specialInstructions && this.specialInstructions.length > 500) {
      errors.push('Special instructions cannot exceed 500 characters');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  static getProductTypes() {
    return ['Book', 'Module', 'Exam', 'Brochure', 'TaxReceipt'];
  }
  static getPaperTypes() {
    return ['A3', 'A4', 'A5'];
  }
  static getBindingTypes() {
    return [
      { code: 'None', name: 'No Binding', price: 0 },
      { code: 'Spiral', name: 'Spiral Binding', price: 500 },
      { code: 'Thermal', name: 'Thermal Binding', price: 300 }
    ];
  }
  static getBasePrice(paperType) {
    const prices = {
      A4: 0.50,
      A5: 0.75,
      A3: 1.00
    };
    return prices[paperType] || 0.50;
  }
  static getBindingCost(bindingType) {
    const costs = {
      Spiral: 500,
      Thermal: 300,
      None: 0
    };
    return costs[bindingType] || 0;
  }
  calculatePrice() {
    const basePrice = OrderModel.getBasePrice(this.paperType);
    const multiplier = this.colorPrinting ? 2.0 : 1.0;
    const pricePerUnit = this.pagesPerCopy * basePrice * multiplier;
    const bindingCostPerUnit = OrderModel.getBindingCost(this.bindingType);
    const bindingCostTotal = bindingCostPerUnit * this.quantity;
    const subtotal = pricePerUnit * this.quantity;
    const totalPrice = subtotal + bindingCostTotal;
    return {
      pricePerUnit,
      bindingCost: bindingCostTotal,
      subtotal,
      totalPrice
    };
  }
  static getStatusFlow() {
    return {
      received: { next: ['in_progress'], label: 'Received', order: 1 },
      in_progress: { next: ['quality_check'], label: 'In Progress', order: 2 },
      quality_check: { next: ['ready'], label: 'Quality Check', order: 3 },
      ready: { next: ['delivered'], label: 'Ready', order: 4 },
      delivered: { next: [], label: 'Delivered', order: 5 },
      cancelled: { next: [], label: 'Cancelled', order: 6 }
    };
  }
  static isValidTransition(fromStatus, toStatus) {
    const flow = OrderModel.getStatusFlow();
    if (!flow[fromStatus]) return false;
    return flow[fromStatus].next.includes(toStatus);
  }
  getNextStatuses() {
    const flow = OrderModel.getStatusFlow();
    const currentFlow = flow[this.status];
    if (!currentFlow) return [];
    return currentFlow.next;
  }
  isEditable() {
    return this.status === 'received';
  }
  isCancellable() {
    return this.status === 'received';
  }
  isCompleted() {
    return this.status === 'delivered';
  }
  getDaysRemaining() {
    if (!this.dueDate) return null;
    const due = new Date(this.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  }
  isPastDue() {
    const daysRemaining = this.getDaysRemaining();
    return daysRemaining !== null && daysRemaining < 0 && !this.isCompleted();
  }
  getAlertLevel() {
    if (this.isCompleted()) return 'completed';
    if (this.isPastDue()) return 'past_due';
    const daysRemaining = this.getDaysRemaining();
    if (daysRemaining === 0) return 'today';
    if (daysRemaining === 1) return 'tomorrow';
    if (daysRemaining <= 7) return 'soon';
    return 'normal';
  }
  getStatusBadgeColor() {
    const colors = {
      received: '#9CA3AF',
      in_progress: '#3B82F6',
      quality_check: '#F59E0B',
      ready: '#10B981',
      delivered: '#059669',
      cancelled: '#EF4444'
    };
    return colors[this.status] || '#6B7280';
  }
  parseAttachments(attachments) {
    if (Array.isArray(attachments)) return attachments;
    if (typeof attachments === 'string') {
      try {
        return JSON.parse(attachments);
      } catch {
        return [];
      }
    }
    return [];
  }
  addAttachment(attachment) {
    this.attachments.push({
      ...attachment,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
      uploadedAt: new Date().toISOString()
    });
  }
  removeAttachment(attachmentId) {
    const initialLength = this.attachments.length;
    this.attachments = this.attachments.filter(a => a.id !== attachmentId);
    return initialLength !== this.attachments.length;
  }
  toJSON() {
    return {
      id: this.id,
      orderNumber: this.orderNumber,
      customerId: this.customerId,
      customerName: this.customerName,
      customerPhone: this.customerPhone,
      customerEmail: this.customerEmail,
      customerTypeId: this.customerTypeId,
      customerTypeName: this.customerTypeName,
      customerTypeColor: this.customerTypeColor,
      productType: this.productType,
      quantity: this.quantity,
      paperType: this.paperType,
      pagesPerCopy: this.pagesPerCopy,
      colorPrinting: this.colorPrinting,
      bindingType: this.bindingType,
      dueDate: this.dueDate,
      specialInstructions: this.specialInstructions,
      attachments: this.attachments,
      pricePerUnit: this.pricePerUnit,
      bindingCost: this.bindingCost,
      totalPrice: this.totalPrice,
      status: this.status,
      statusName: this.statusName,
      statusColor: this.statusColor,
      createdBy: this.createdBy,
      createdByName: this.createdByName,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      daysRemaining: this.getDaysRemaining(),
      isPastDue: this.isPastDue(),
      alertLevel: this.getAlertLevel(),
      statusHistory: this.statusHistory
    };
  }
  static fromDatabase(data) {
    const order = new OrderModel(data);
    if (data.attachments) {
      order.attachments = order.parseAttachments(data.attachments);
    }
    if (data.status_code) {
      order.status = data.status_code;
    }
    if (data.status_name) {
      order.statusName = data.status_name;
    }
    if (data.color_hex) {
      order.statusColor = data.color_hex;
    }
    return order;
  }
  static fromRequest(data) {
    return new OrderModel({
      customerId: data.customerId,
      customerName: data.customer?.name,
      customerPhone: data.customer?.phone,
      customerEmail: data.customer?.email,
      customerTypeId: data.customer?.customerTypeId,
      productType: data.productType,
      quantity: data.quantity,
      paperType: data.paperType,
      pagesPerCopy: data.pagesPerCopy,
      colorPrinting: data.colorPrinting || false,
      bindingType: data.bindingType || 'None',
      dueDate: data.dueDate,
      specialInstructions: data.specialInstructions
    });
  }
  static getCreationRules() {
    return {
      customerId: { type: 'integer', min: 1 },
      customer: { type: 'object' },
      productType: { required: true, enum: OrderModel.getProductTypes() },
      quantity: { required: true, type: 'integer', min: 1, max: 100000 },
      paperType: { required: true, enum: OrderModel.getPaperTypes() },
      pagesPerCopy: { required: true, type: 'integer', min: 1, max: 10000 },
      colorPrinting: { type: 'boolean' },
      bindingType: { enum: ['None', 'Spiral', 'Thermal'] },
      dueDate: { required: true, type: 'date', min: 'today' },
      specialInstructions: { max: 500 }
    };
  }
  static getSummaryStats(orders) {
    const stats = {
      totalOrders: orders.length,
      totalRevenue: 0,
      byStatus: {},
      byProductType: {},
      byCustomerType: {}
    };
    for (const order of orders) {
      stats.totalRevenue += order.totalPrice;
      if (!stats.byStatus[order.status]) {
        stats.byStatus[order.status] = { count: 0, revenue: 0 };
      }
      stats.byStatus[order.status].count++;
      stats.byStatus[order.status].revenue += order.totalPrice;
      if (!stats.byProductType[order.productType]) {
        stats.byProductType[order.productType] = { count: 0, revenue: 0 };
      }
      stats.byProductType[order.productType].count++;
      stats.byProductType[order.productType].revenue += order.totalPrice;
      if (!stats.byCustomerType[order.customerTypeName]) {
        stats.byCustomerType[order.customerTypeName] = { count: 0, revenue: 0 };
      }
      stats.byCustomerType[order.customerTypeName].count++;
      stats.byCustomerType[order.customerTypeName].revenue += order.totalPrice;
    }
    return stats;
  }
}
module.exports = OrderModel;
