import apiClient from './apiClient';
const purchaseService = {
  getSuppliers: async (params) => {
    return await apiClient.get('/purchase/suppliers', { params });
  },
  getSupplierById: async (id) => {
    return await apiClient.get(`/purchase/suppliers/${id}`);
  },
  createSupplier: async (data) => {
    return await apiClient.post('/purchase/suppliers', data);
  },
  getPurchaseOrders: async (params) => {
    return await apiClient.get('/purchase/orders', { params });
  },
  getPOById: async (id) => {
    return await apiClient.get(`/purchase/orders/${id}`);
  },
  createPO: async (data) => {
    return await apiClient.post('/purchase/orders', data);
  },
  submitPOForApproval: async (id) => {
    return await apiClient.post(`/purchase/orders/${id}/submit`);
  },
  approvePO: async (id, data) => {
    return await apiClient.post(`/purchase/orders/${id}/approve`, data);
  },
  getPendingReceiving: async () => {
    return await apiClient.get('/purchase/receiving/pending');
  },
  registerReceiving: async (data) => {
    return await apiClient.post(`/purchase/receiving/register`, data);
  },
  getSectors: async () => {
    return await apiClient.get('/purchase/sectors');
  },
  getPurchaseStatistics: async () => {
    return await apiClient.get('/purchase/statistics');
  },
  getReorderSuggestions: async () => {
    return await apiClient.get('/purchase/reorder-suggestions');
  },
};
export default purchaseService;
