class ProductModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.sku = data.sku || '';
    this.categoryId = data.category_id || data.categoryId || null;
    this.categoryName = data.category_name || data.categoryName || '';
    this.unitId = data.unit_id || data.unitId || null;
    this.unitName = data.unit_name || data.unitName || '';
    this.unitAbbr = data.unit_abbr || data.unitAbbr || '';
    this.sellingPrice = data.selling_price || data.sellingPrice || 0;
    this.reorderLevel = data.reorder_level || data.reorderLevel || 0;
    this.expiryDate = data.expiry_date || data.expiryDate || null;
    this.supplierId = data.supplier_id || data.supplierId || null;
    this.supplierName = data.supplier_name || data.supplierName || '';
    this.isActive = data.is_active ?? data.isActive ?? true;
    this.currentStock = data.current_stock || data.currentStock || 0;
    this.averageCost = data.average_cost || data.averageCost || 0;
    this.storageLocation = data.storage_location || data.storageLocation || '';
    this.lastCounted = data.last_counted || data.lastCounted || null;
    this.createdAt = data.created_at || data.createdAt || null;
    this.updatedAt = data.updated_at || data.updatedAt || null;
    this.deletedAt = data.deleted_at || data.deletedAt || null;
    this.isLowStock = data.is_low_stock || data.isLowStock || false;
  }
  /**
   * Validate product data
   * @returns {Object} - { isValid, errors }
   */
  validate() {
    const errors = [];
    if (!this.name || this.name.length < 2 || this.name.length > 200) {
      errors.push('Product name must be between 2 and 200 characters');
    }
    if (!this.sku || this.sku.length < 3 || this.sku.length > 50) {
      errors.push('SKU must be between 3 and 50 characters');
    }
    if (!this.categoryId) {
      errors.push('Category ID is required');
    }
    if (!this.unitId) {
      errors.push('Unit ID is required');
    }
    if (this.sellingPrice <= 0) {
      errors.push('Selling price must be greater than 0');
    }
    if (this.reorderLevel < 0) {
      errors.push('Reorder level cannot be negative');
    }
    if (this.expiryDate && new Date(this.expiryDate) < new Date()) {
      errors.push('Expiry date cannot be in the past');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  static getCategories() {
    return ['Printing', 'Sales', 'Pharmacy', 'Office'];
  }
  static getUnits() {
    return [
      { name: 'Each', abbreviation: 'pc' },
      { name: 'Sheet', abbreviation: 'sh' },
      { name: 'Kilogram', abbreviation: 'kg' },
      { name: 'Liter', abbreviation: 'L' },
      { name: 'Milliliter', abbreviation: 'mL' },
      { name: 'Gram', abbreviation: 'g' }
    ];
  }
  isLowOnStock() {
    return this.currentStock <= this.reorderLevel;
  }
  isOutOfStock() {
    return this.currentStock <= 0;
  }
  isInStock() {
    return this.currentStock > 0;
  }
  getStockStatus() {
    if (this.currentStock <= 0) {
      return { text: 'Out of Stock', color: '#EF4444', variant: 'error' };
    }
    if (this.isLowOnStock()) {
      return { text: 'Low Stock', color: '#F59E0B', variant: 'warning' };
    }
    return { text: 'In Stock', color: '#10B981', variant: 'success' };
  }
  getStockPercentage() {
    if (this.reorderLevel <= 0) return 100;
    const percentage = (this.currentStock / this.reorderLevel) * 100;
    return Math.min(percentage, 100);
  }
  isExpired() {
    if (!this.expiryDate) return false;
    return new Date(this.expiryDate) < new Date();
  }
  getDaysUntilExpiry() {
    if (!this.expiryDate) return null;
    const expiry = new Date(this.expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  }
  getExpiryStatus() {
    if (!this.expiryDate) {
      return { text: 'No Expiry', color: '#6B7280', variant: 'default' };
    }
    if (this.isExpired()) {
      return { text: 'Expired', color: '#EF4444', variant: 'error' };
    }
    const daysLeft = this.getDaysUntilExpiry();
    if (daysLeft <= 7) {
      return { text: `Expires in ${daysLeft} days`, color: '#F59E0B', variant: 'warning' };
    }
    if (daysLeft <= 30) {
      return { text: `Expires in ${daysLeft} days`, color: '#3B82F6', variant: 'info' };
    }
    return { text: 'Valid', color: '#10B981', variant: 'success' };
  }
  getInventoryValue() {
    return this.currentStock * this.averageCost;
  }
  getPotentialRevenue() {
    return this.currentStock * this.sellingPrice;
  }
  reduceStock(quantity) {
    if (this.currentStock < quantity) return false;
    this.currentStock -= quantity;
    return true;
  }
  increaseStock(quantity, unitCost) {
    const totalCost = (this.currentStock * this.averageCost) + (quantity * unitCost);
    this.currentStock += quantity;
    this.averageCost = totalCost / this.currentStock;
  }
  applyPriceChange(newPrice, reason) {
    this.oldPrice = this.sellingPrice;
    this.sellingPrice = newPrice;
    this.lastPriceChangeReason = reason;
    this.lastPriceChangeAt = new Date().toISOString();
  }
  getPriceChangeHistory() {
    return [];
  }
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      sku: this.sku,
      categoryId: this.categoryId,
      categoryName: this.categoryName,
      unitId: this.unitId,
      unitName: this.unitName,
      unitAbbr: this.unitAbbr,
      sellingPrice: this.sellingPrice,
      reorderLevel: this.reorderLevel,
      expiryDate: this.expiryDate,
      supplierId: this.supplierId,
      supplierName: this.supplierName,
      isActive: this.isActive,
      currentStock: this.currentStock,
      averageCost: this.averageCost,
      storageLocation: this.storageLocation,
      lastCounted: this.lastCounted,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isLowStock: this.isLowOnStock(),
      stockStatus: this.getStockStatus(),
      stockPercentage: this.getStockPercentage(),
      expiryStatus: this.getExpiryStatus(),
      inventoryValue: this.getInventoryValue(),
      potentialRevenue: this.getPotentialRevenue()
    };
  }
  static fromDatabase(data) {
    const product = new ProductModel(data);
    product.isLowStock = product.isLowOnStock();
    return product;
  }
  static fromRequest(data) {
    return new ProductModel({
      name: data.name,
      sku: data.sku,
      categoryId: data.categoryId,
      unitId: data.unitId,
      sellingPrice: data.sellingPrice,
      reorderLevel: data.reorderLevel,
      expiryDate: data.expiryDate,
      supplierId: data.supplierId
    });
  }
  static getCreationRules() {
    return {
      name: { required: true, min: 2, max: 200 },
      sku: { required: true, min: 3, max: 50, unique: true },
      categoryId: { required: true, type: 'integer', min: 1 },
      unitId: { required: true, type: 'integer', min: 1 },
      sellingPrice: { required: true, type: 'float', min: 0 },
      reorderLevel: { type: 'integer', min: 0 },
      expiryDate: { type: 'date', min: 'today' },
      supplierId: { type: 'integer', min: 1 }
    };
  }
  static getUpdateRules() {
    return {
      name: { min: 2, max: 200 },
      sku: { min: 3, max: 50, unique: true },
      categoryId: { type: 'integer', min: 1 },
      unitId: { type: 'integer', min: 1 },
      sellingPrice: { type: 'float', min: 0 },
      reorderLevel: { type: 'integer', min: 0 },
      expiryDate: { type: 'date' },
      supplierId: { type: 'integer', min: 1 },
      isActive: { type: 'boolean' }
    };
  }
  static getStatistics(products) {
    const stats = {
      totalProducts: products.length,
      totalValue: 0,
      totalStock: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      expiredCount: 0,
      byCategory: {}
    };
    for (const product of products) {
      stats.totalValue += product.getInventoryValue();
      stats.totalStock += product.currentStock;
      if (product.isOutOfStock()) {
        stats.outOfStockCount++;
      } else if (product.isLowOnStock()) {
        stats.lowStockCount++;
      }
      if (product.isExpired()) {
        stats.expiredCount++;
      }
      if (!stats.byCategory[product.categoryName]) {
        stats.byCategory[product.categoryName] = {
          count: 0,
          value: 0,
          stock: 0
        };
      }
      stats.byCategory[product.categoryName].count++;
      stats.byCategory[product.categoryName].value += product.getInventoryValue();
      stats.byCategory[product.categoryName].stock += product.currentStock;
    }
    return stats;
  }
}
module.exports = ProductModel;
