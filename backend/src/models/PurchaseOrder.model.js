class PurchaseOrderModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.poNumber = data.po_number || data.poNumber || '';
    this.supplierId = data.supplier_id || data.supplierId || null;
    this.supplierName = data.supplier_name || data.supplierName || '';
    this.supplierPhone = data.supplier_phone || data.supplierPhone || '';
    this.supplierEmail = data.supplier_email || data.supplierEmail || '';
    this.supplierAddress = data.supplier_address || data.supplierAddress || '';
    this.orderDate = data.order_date || data.orderDate || null;
    this.expectedDeliveryDate = data.expected_delivery_date || data.expectedDeliveryDate || null;
    this.sectorId = data.sector_id || data.sectorId || null;
    this.sectorName = data.sector_name || data.sectorName || '';
    this.statusId = data.status_id || data.statusId || null;
    this.status = data.status || '';
    this.statusName = data.status_name || data.statusName || '';
    this.statusColor = data.status_color || data.statusColor || '';
    this.subtotal = data.subtotal || 0;
    this.taxAmount = data.tax_amount || data.taxAmount || 0;
    this.totalAmount = data.total_amount || data.totalAmount || 0;
    this.paidAmount = data.paid_amount || data.paidAmount || 0;
    this.notes = data.notes || '';
    this.attachment = data.attachment || '';
    this.approvedBy = data.approved_by || data.approvedBy || null;
    this.approvedByName = data.approved_by_name || data.approvedByName || '';
    this.approvedAt = data.approved_at || data.approvedAt || null;
    this.rejectionReason = data.rejection_reason || data.rejectionReason || '';
    this.createdBy = data.created_by || data.createdBy || null;
    this.createdByName = data.created_by_name || data.createdByName || '';
    this.createdAt = data.created_at || data.createdAt || null;
    this.updatedAt = data.updated_at || data.updatedAt || null;
    this.deletedAt = data.deleted_at || data.deletedAt || null;
    // Items
    this.items = data.items || [];
  }
  /**
   * Get valid PO statuses with flow
   * @returns {Object}
   */
  static getStatusFlow() {
    return {
      draft: { next: ['pending'], label: 'Draft', order: 1, color: '#6B7280' },
      pending: { next: ['approved', 'rejected'], label: 'Pending Approval', order: 2, color: '#F59E0B' },
      approved: { next: ['sent', 'cancelled'], label: 'Approved', order: 3, color: '#10B981' },
      rejected: { next: [], label: 'Rejected', order: 4, color: '#EF4444' },
      sent: { next: ['partial_received', 'complete'], label: 'Sent to Supplier', order: 5, color: '#3B82F6' },
      partial_received: { next: ['complete', 'cancelled'], label: 'Partial Received', order: 6, color: '#8B5CF6' },
      complete: { next: [], label: 'Complete', order: 7, color: '#059669' },
      cancelled: { next: [], label: 'Cancelled', order: 8, color: '#EF4444' }
    };
  }
  static getSectors() {
    return ['Printing', 'Sales', 'Pharmacy', 'General Office'];
  }
  validate() {
    const errors = [];
    if (!this.supplierId) {
      errors.push('Supplier ID is required');
    }
    if (!this.expectedDeliveryDate) {
      errors.push('Expected delivery date is required');
    }
    if (this.expectedDeliveryDate && new Date(this.expectedDeliveryDate) < new Date()) {
      errors.push('Expected delivery date cannot be in the past');
    }
    if (!this.sectorId) {
      errors.push('Sector ID is required');
    }
    if (!this.items || this.items.length === 0) {
      errors.push('At least one item is required');
    }
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      if (!item.productName) {
        errors.push(`Item ${i + 1}: Product name is required`);
      }
      if (!item.quantityOrdered || item.quantityOrdered < 1) {
        errors.push(`Item ${i + 1}: Quantity must be at least 1`);
      }
      if (!item.unitPrice || item.unitPrice < 0) {
        errors.push(`Item ${i + 1}: Unit price must be a positive number`);
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
      const itemTotal = item.quantityOrdered * item.unitPrice;
      item.total = itemTotal;
      subtotal += itemTotal;
    }
    const taxAmount = subtotal * 0.15; 
    const totalAmount = subtotal + taxAmount;
    return { subtotal, taxAmount, totalAmount };
  }
  updateTotals() {
    const { subtotal, taxAmount, totalAmount } = this.calculateTotals();
    this.subtotal = subtotal;
    this.taxAmount = taxAmount;
    this.totalAmount = totalAmount;
  }
  static isValidTransition(fromStatus, toStatus) {
    const flow = PurchaseOrderModel.getStatusFlow();
    if (!flow[fromStatus]) return false;
    return flow[fromStatus].next.includes(toStatus);
  }
  getNextStatuses() {
    const flow = PurchaseOrderModel.getStatusFlow();
    const currentFlow = flow[this.status];
    if (!currentFlow) return [];
    return currentFlow.next;
  }
  isEditable() {
    return this.status === 'draft';
  }
  isCancellable() {
    return ['draft', 'pending', 'approved'].includes(this.status);
  }
  isFullyReceived() {
    if (!this.items || this.items.length === 0) return false;
    return this.items.every(item => 
      (item.quantityReceived || 0) >= item.quantityOrdered
    );
  }
  isPartiallyReceived() {
    if (!this.items || this.items.length === 0) return false;
    const hasReceived = this.items.some(item => (item.quantityReceived || 0) > 0);
    const hasPending = this.items.some(item => (item.quantityReceived || 0) < item.quantityOrdered);
    return hasReceived && hasPending;
  }
  getReceivingProgress() {
    if (!this.items || this.items.length === 0) return 0;
    let totalOrdered = 0;
    let totalReceived = 0;
    for (const item of this.items) {
      totalOrdered += item.quantityOrdered;
      totalReceived += (item.quantityReceived || 0);
    }
    if (totalOrdered === 0) return 0;
    return (totalReceived / totalOrdered) * 100;
  }
  requiresApproval(threshold = 200000) {
    return this.totalAmount > threshold;
  }
  getRemainingBalance() {
    return this.totalAmount - this.paidAmount;
  }
  getPaymentStatus() {
    const remaining = this.getRemainingBalance();
    if (remaining <= 0) {
      return { text: 'Fully Paid', color: '#10B981', variant: 'success' };
    }
    if (this.paidAmount > 0) {
      return { text: `Partially Paid (${this.paidAmount.toLocaleString()} ETB)`, color: '#F59E0B', variant: 'warning' };
    }
    return { text: `Unpaid (${remaining.toLocaleString()} ETB)`, color: '#EF4444', variant: 'error' };
  }
  getDaysUntilDelivery() {
    if (!this.expectedDeliveryDate) return null;
    const expected = new Date(this.expectedDeliveryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((expected - today) / (1000 * 60 * 60 * 24));
  }
  isDeliveryOverdue() {
    const daysUntil = this.getDaysUntilDelivery();
    return daysUntil !== null && daysUntil < 0 && !['complete', 'cancelled'].includes(this.status);
  }
  getDeliveryStatus() {
    if (this.status === 'complete') {
      return { text: 'Delivered', color: '#10B981', variant: 'success' };
    }
    if (this.status === 'cancelled') {
      return { text: 'Cancelled', color: '#6B7280', variant: 'default' };
    }
    if (this.isDeliveryOverdue()) {
      return { text: 'Overdue', color: '#EF4444', variant: 'error' };
    }
    const daysUntil = this.getDaysUntilDelivery();
    if (daysUntil <= 3) {
      return { text: `Due in ${daysUntil} days`, color: '#F59E0B', variant: 'warning' };
    }
    return { text: `Due in ${daysUntil} days`, color: '#3B82F6', variant: 'info' };
  }
  toJSON() {
    return {
      id: this.id,
      poNumber: this.poNumber,
      supplierId: this.supplierId,
      supplierName: this.supplierName,
      supplierPhone: this.supplierPhone,
      supplierEmail: this.supplierEmail,
      orderDate: this.orderDate,
      expectedDeliveryDate: this.expectedDeliveryDate,
      sectorId: this.sectorId,
      sectorName: this.sectorName,
      status: this.status,
      statusName: this.statusName,
      statusColor: this.statusColor,
      subtotal: this.subtotal,
      taxAmount: this.taxAmount,
      totalAmount: this.totalAmount,
      paidAmount: this.paidAmount,
      remainingBalance: this.getRemainingBalance(),
      paymentStatus: this.getPaymentStatus(),
      receivingProgress: this.getReceivingProgress(),
      deliveryStatus: this.getDeliveryStatus(),
      isOverdue: this.isDeliveryOverdue(),
      notes: this.notes,
      attachment: this.attachment,
      approvedBy: this.approvedBy,
      approvedByName: this.approvedByName,
      approvedAt: this.approvedAt,
      rejectionReason: this.rejectionReason,
      createdBy: this.createdBy,
      createdByName: this.createdByName,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      items: this.items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName || item.product_name,
        quantityOrdered: item.quantityOrdered || item.quantity_ordered,
        unitPrice: item.unitPrice || item.unit_price,
        total: item.total,
        quantityReceived: item.quantityReceived || item.quantity_received || 0,
        quantityDamaged: item.quantityDamaged || item.quantity_damaged || 0,
        qualityPass: item.qualityPass || item.quality_pass
      }))
    };
  }
  static fromDatabase(data) {
    const po = new PurchaseOrderModel(data);
    if (data.items && typeof data.items === 'string') {
      try {
        po.items = JSON.parse(data.items);
      } catch {
        po.items = [];
      }
    }
    return po;
  }
  static fromRequest(data) {
    const po = new PurchaseOrderModel({
      supplierId: data.supplierId,
      expectedDeliveryDate: data.expectedDeliveryDate,
      sectorId: data.sectorId,
      notes: data.notes,
      items: data.items || []
    });
    po.updateTotals();
    return po;
  }
  static getCreationRules() {
    return {
      supplierId: { required: true, type: 'integer', min: 1 },
      expectedDeliveryDate: { required: true, type: 'date', min: 'today' },
      sectorId: { required: true, type: 'integer', min: 1 },
      items: { required: true, type: 'array', min: 1 },
      'items.*.productId': { type: 'integer' },
      'items.*.productName': { required: true, min: 1, max: 200 },
      'items.*.quantityOrdered': { required: true, type: 'integer', min: 1 },
      'items.*.unitPrice': { required: true, type: 'float', min: 0 },
      notes: { max: 1000 }
    };
  }
  static getUpdateRules() {
    return {
      expectedDeliveryDate: { type: 'date', min: 'today' },
      items: { type: 'array' },
      notes: { max: 1000 }
    };
  }
  static getStatistics(purchaseOrders) {
    const stats = {
      totalOrders: purchaseOrders.length,
      totalAmount: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      byStatus: {},
      bySupplier: {},
      bySector: {}
    };
    for (const po of purchaseOrders) {
      stats.totalAmount += po.totalAmount;
      stats.totalPaid += po.paidAmount;
      stats.totalOutstanding += po.getRemainingBalance();
      if (!stats.byStatus[po.status]) {
        stats.byStatus[po.status] = { count: 0, amount: 0 };
      }
      stats.byStatus[po.status].count++;
      stats.byStatus[po.status].amount += po.totalAmount;
      if (!stats.bySupplier[po.supplierName]) {
        stats.bySupplier[po.supplierName] = { count: 0, amount: 0 };
      }
      stats.bySupplier[po.supplierName].count++;
      stats.bySupplier[po.supplierName].amount += po.totalAmount;
      if (!stats.bySector[po.sectorName]) {
        stats.bySector[po.sectorName] = { count: 0, amount: 0 };
      }
      stats.bySector[po.sectorName].count++;
      stats.bySector[po.sectorName].amount += po.totalAmount;
    }
    return stats;
  }
  static getPendingApprovals(purchaseOrders) {
    return purchaseOrders.filter(po => po.status === 'pending');
  }
  static getOverdueDeliveries(purchaseOrders) {
    return purchaseOrders.filter(po => po.isDeliveryOverdue());
  }
  static filterByStatus(purchaseOrders, status) {
    if (!status) return purchaseOrders;
    return purchaseOrders.filter(po => po.status === status);
  }
  static filterBySupplier(purchaseOrders, supplierId) {
    if (!supplierId) return purchaseOrders;
    return purchaseOrders.filter(po => po.supplierId === supplierId);
  }
  static filterBySector(purchaseOrders, sectorName) {
    if (!sectorName) return purchaseOrders;
    return purchaseOrders.filter(po => po.sectorName === sectorName);
  }
}
module.exports = PurchaseOrderModel;
