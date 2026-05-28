import apiClient from './apiClient';
const printingService = {
  getOrders: async (params) => {
    return await apiClient.get('/printing/orders', { params });
  },
  getOrderById: async (id) => {
    return await apiClient.get(`/printing/orders/${id}`);
  },
  createOrder: async (data) => {
    return await apiClient.post('/printing/orders', data);
  },
  updateOrderStatus: async (id, statusCode, notes) => {
    return await apiClient.put(`/printing/orders/${id}/status`, { status: statusCode, notes: notes || undefined });
  },
  getProductionQueue: async () => {
    return await apiClient.get('/printing/orders/pending'); 
  },
  getTaxReceipts: async (params) => {
    return await apiClient.get('/printing/tax-receipts', { params }); 
  },
  generateTaxReceipt: async (orderId, data) => {
    return await apiClient.post(`/printing/tax-receipts/print/${orderId}`, data); 
  },
  getStatistics: async () => {
    return await apiClient.get('/printing/statistics');
  },
  calculatePrice: async (params) => {
    return await apiClient.get('/printing/calculate-price', { params });
  }
};
export default printingService;
