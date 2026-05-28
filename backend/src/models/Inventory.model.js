class InventoryModel {
  constructor(data = {}) {
    this.productId = data.product_id || data.productId || null;
    this.productName = data.product_name || data.productName || '';
    this.sku = data.sku || '';
    this.categoryName = data.category_name || data.categoryName || '';
    this.unitName = data.unit_name || data.unitName || '';
    this.unitAbbr = data.unit_abbr || data.unitAbbr || '';
    this.quantity = data.quantity || 0;
    this.unitCost = data.unit_cost || data.unitCost || 0;
    this.sellingPrice = data.selling_price || data.sellingPrice || 0;
    this.reorderLevel = data.reorder_level || data.reorderLevel || 0;
    this.location = data.location || '';
    this.lastUpdated = data.last_updated || data.lastUpdated || null;
    this.lastCounted = data.last_counted || data.lastCounted || null;
    this.createdAt = data.created_at || data.createdAt || null;
    this.updatedAt = data.updated_at || data.updatedAt || null;
    // Calculated fields
    this.totalValue = this.quantity * this.unitCost;
    this.potentialRevenue = this.quantity * this.sellingPrice;
  }
  /**
   * Validate inventory data
   * @returns {Object} - { isValid, errors }
   */
  validate() {
    const errors = [];
    if (!this.productId) {
      errors.push('Product ID is required');
    }
    if (this.quantity < 0) {
      errors.push('Quantity cannot be negative');
    }
    if (this.unitCost < 0) {
      errors.push('Unit cost cannot be negative');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  isLowStock() {
    return this.quantity <= this.reorderLevel && this.quantity > 0;
  }
  isOutOfStock() {
    return this.quantity <= 0;
  }
  isInStock() {
    return this.quantity > 0;
  }
  getStockStatus() {
    if (this.isOutOfStock()) {
      return { text: 'Out of Stock', color: '#EF4444', variant: 'error' };
    }
    if (this.isLowStock()) {
      return { text: 'Low Stock', color: '#F59E0B', variant: 'warning' };
    }
    return { text: 'In Stock', color: '#10B981', variant: 'success' };
  }
  getStockPercentage() {
    if (this.reorderLevel <= 0) return 100;
    const percentage = (this.quantity / this.reorderLevel) * 100;
    return Math.min(percentage, 100);
  }
  getStockLevelIndicator() {
    if (this.reorderLevel <= 0) return 100;
    const maxStock = this.reorderLevel * 2;
    const percentage = (this.quantity / maxStock) * 100;
    return Math.min(percentage, 100);
  }
  getReorderQuantity() {
    if (this.quantity >= this.reorderLevel) return 0;
    return this.reorderLevel - this.quantity;
  }
  getDaysOfStockRemaining(avgDailySales = null) {
    if (avgDailySales && avgDailySales > 0) {
      return Math.floor(this.quantity / avgDailySales);
    }
    return null;
  }
  updateStock(newQuantity, newUnitCost = null) {
    this.previousQuantity = this.quantity;
    this.previousUnitCost = this.unitCost;
    this.quantity = newQuantity;
    if (newUnitCost !== null) {
      this.unitCost = newUnitCost;
    }
    this.totalValue = this.quantity * this.unitCost;
    this.potentialRevenue = this.quantity * this.sellingPrice;
    this.lastUpdated = new Date().toISOString();
  }
  addStock(quantity, unitCost) {
    const totalCost = (this.quantity * this.unitCost) + (quantity * unitCost);
    this.quantity += quantity;
    this.unitCost = totalCost / this.quantity;
    this.totalValue = this.quantity * this.unitCost;
    this.potentialRevenue = this.quantity * this.sellingPrice;
    this.lastUpdated = new Date().toISOString();
  }
  removeStock(quantity) {
    if (this.quantity < quantity) return false;
    this.previousQuantity = this.quantity;
    this.quantity -= quantity;
    this.totalValue = this.quantity * this.unitCost;
    this.potentialRevenue = this.quantity * this.sellingPrice;
    this.lastUpdated = new Date().toISOString();
    return true;
  }
  static getMovementTypes() {
    return ['Sale', 'Purchase', 'Adjustment', 'Damaged', 'Lost', 'Expired'];
  }
  createMovementRecord(quantityChange, type, reason, userId) {
    return {
      productId: this.productId,
      transactionType: type,
      quantityChange: quantityChange,
      quantityBefore: this.previousQuantity !== undefined ? this.previousQuantity : this.quantity,
      quantityAfter: this.quantity,
      reason: reason,
      performedBy: userId,
      timestamp: new Date().toISOString()
    };
  }
  toJSON() {
    return {
      productId: this.productId,
      productName: this.productName,
      sku: this.sku,
      categoryName: this.categoryName,
      unitName: this.unitName,
      unitAbbr: this.unitAbbr,
      quantity: this.quantity,
      unitCost: this.unitCost,
      sellingPrice: this.sellingPrice,
      reorderLevel: this.reorderLevel,
      location: this.location,
      totalValue: this.totalValue,
      potentialRevenue: this.potentialRevenue,
      stockStatus: this.getStockStatus(),
      stockPercentage: this.getStockPercentage(),
      reorderQuantity: this.getReorderQuantity(),
      lastUpdated: this.lastUpdated,
      lastCounted: this.lastCounted
    };
  }
  static fromDatabase(data) {
    return new InventoryModel(data);
  }
  static fromProduct(product) {
    return new InventoryModel({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      categoryName: product.categoryName,
      unitName: product.unitName,
      unitAbbr: product.unitAbbr,
      quantity: 0,
      unitCost: 0,
      sellingPrice: product.sellingPrice,
      reorderLevel: product.reorderLevel || 0
    });
  }
  static getStatistics(inventoryItems) {
    const stats = {
      totalProducts: inventoryItems.length,
      totalValue: 0,
      totalUnits: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      byCategory: {}
    };
    for (const item of inventoryItems) {
      stats.totalValue += item.totalValue;
      stats.totalUnits += item.quantity;
      if (item.isOutOfStock()) {
        stats.outOfStockCount++;
      } else if (item.isLowStock()) {
        stats.lowStockCount++;
      }
      if (!stats.byCategory[item.categoryName]) {
        stats.byCategory[item.categoryName] = {
          count: 0,
          value: 0,
          units: 0
        };
      }
      stats.byCategory[item.categoryName].count++;
      stats.byCategory[item.categoryName].value += item.totalValue;
      stats.byCategory[item.categoryName].units += item.quantity;
    }
    return stats;
  }
  static filterLowStock(inventoryItems) {
    return inventoryItems.filter(item => item.isLowStock());
  }
  static filterOutOfStock(inventoryItems) {
    return inventoryItems.filter(item => item.isOutOfStock());
  }
  static filterByCategory(inventoryItems, categoryName) {
    if (!categoryName) return inventoryItems;
    return inventoryItems.filter(item => item.categoryName === categoryName);
  }
  static sortByValue(inventoryItems) {
    return [...inventoryItems].sort((a, b) => b.totalValue - a.totalValue);
  }
  static sortByStockLevel(inventoryItems) {
    return [...inventoryItems].sort((a, b) => a.getStockPercentage() - b.getStockPercentage());
  }
}
module.exports = InventoryModel;
