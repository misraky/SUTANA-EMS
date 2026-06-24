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
};
export default salesService;
