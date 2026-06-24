import apiClient from './apiClient';
const salesService = {
  getSales: async (params) => {
    return await apiClient.get('/pos/sales', { params });
  },
  getSaleById: async (id) => {
    return await apiClient.get(`/pos/sales/${id}`);
  },
  createSale: async (data) => {
    return await apiClient.post('/pos/checkout', data);
  },
  getCart: async () => {
    return await apiClient.get('/pos/cart');
  },
  getPOSProducts: async (params) => {
    return await apiClient.get('/pos/products', { params });
  },
  addToCart: async (data) => {
    return await apiClient.post('/pos/cart/items', data);
  },
  updateCartItem: async (itemId, data) => {
    return await apiClient.put(`/pos/cart/items/${itemId}`, data);
  },
  removeFromCart: async (itemId) => {
    return await apiClient.delete(`/pos/cart/items/${itemId}`);
  },
  clearCart: async () => {
    return await apiClient.delete('/pos/cart');
  },
  getCustomers: async (params) => {
    return await apiClient.get('/pos/customers', { params });
  },
  getCustomerById: async (id) => {
    return await apiClient.get(`/pos/customers/${id}`);
  },
  createCustomer: async (data) => {
    return await apiClient.post('/pos/customers', data);
  },
  getSalesReports: async (params) => {
    return await apiClient.get('/pos/reports', { params });
  },
  // Returns
  getSaleItems: async (saleId) => {
    return await apiClient.get(`/pos/sales/${saleId}/items`);
  },
  processReturn: async (data) => {
    return await apiClient.post('/pos/returns', data);
  },
  getReturnHistory: async (params) => {
    return await apiClient.get('/pos/returns', { params });
  },
  // Z-Report
  getZReport: async (params) => {
    return await apiClient.get('/pos/z-report', { params });
  },
  // Customer with purchase history
  getCustomerFullProfile: async (id) => {
    return await apiClient.get(`/pos/customers/${id}/profile`);
  }
  getSales: async (params) => apiClient.get('/pos/sales', { params }),
  getSaleById: async (id) => apiClient.get(`/pos/sales/${id}`),
  createSale: async (data) => apiClient.post('/pos/checkout', data),
  getCart: async () => apiClient.get('/pos/cart'),
  getPOSProducts: async (params) => apiClient.get('/pos/products', { params }),
  addToCart: async (data) => apiClient.post('/pos/cart/items', data),
  updateCartItem: async (itemId, data) => apiClient.put(`/pos/cart/items/${itemId}`, data),
  removeFromCart: async (itemId) => apiClient.delete(`/pos/cart/items/${itemId}`),
  clearCart: async () => apiClient.delete('/pos/cart'),
  getCustomers: async (params) => apiClient.get('/pos/customers', { params }),
  getCustomerById: async (id) => apiClient.get(`/pos/customers/${id}`),
  createCustomer: async (data) => apiClient.post('/pos/customers', data),
  getSalesReports: async (params) => apiClient.get('/pos/reports', { params }),
  applyDiscount: async (data) => apiClient.put('/pos/cart/discount', data),
  removeDiscount: async () => apiClient.delete('/pos/cart/discount'),
  validateDiscount: async (params) => apiClient.get('/pos/validate-discount', { params }),

  /* Shift */
  getCurrentShift: async () => apiClient.get('/pos/shifts/current'),
  openShift: async (data) => apiClient.post('/pos/shifts/open', data),
  closeShift: async (data) => apiClient.post('/pos/shifts/close', data),
  getShiftHistory: async (params) => apiClient.get('/pos/shifts/history', { params }),
  getAllOpenShifts: async () => apiClient.get('/pos/shifts/all-open'),
  verifyShift: async (shiftId, data) => apiClient.post(`/pos/shifts/${shiftId}/verify`, data),

  /* Handover */
  submitCashierHandover: async (data) => apiClient.post('/pos/handover/from-cashier', data),
  submitManagerHandover: async (data) => apiClient.post('/pos/handover/to-finance', data),
  getPendingHandovers: async () => apiClient.get('/pos/handover/pending'),
  verifyHandover: async (handoverId, data) => apiClient.post(`/pos/handover/${handoverId}/verify`, data),

  /* Barcode */
  getProductByBarcode: async (barcode) => apiClient.get(`/pos/products/barcode/${barcode}`),

  /* Void */
  voidSale: async (saleId, data) => apiClient.post(`/pos/sales/${saleId}/void`, data),

  /* Daily stats */
  getDailyStatistics: async (params) => apiClient.get('/pos/statistics/daily', { params }),

  /* Manager sale approval */
  getManagerSales: async (params) => apiClient.get('/pos/manager/sales', { params }),
  managerApproveSale: async (saleId, data) => apiClient.post(`/pos/manager/sales/${saleId}/approve`, data),
  managerFlagSale: async (saleId, data) => apiClient.post(`/pos/manager/sales/${saleId}/flag`, data),

  /* Sale audit log */
  getSaleAuditLog: async (saleId) => apiClient.get(`/pos/sales/${saleId}/audit-log`),

  /* Reports */
  getCombinedDailyReport: async (params) => apiClient.get('/pos/reports/combined-daily', { params }),
  getTodaySummary: async () => apiClient.get('/pos/reports/today-summary'),

  /* Online order collection */
  collectOnlineOrder: async (data) => apiClient.post('/pos/collect-online-order', data),
};
export default salesService;
