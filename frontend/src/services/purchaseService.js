import apiClient from './apiClient';
const purchaseService = {
  getSuppliers: async (params) => apiClient.get('/purchase/suppliers', { params }),
  getSupplierById: async (id) => apiClient.get(`/purchase/suppliers/${id}`),
  createSupplier: async (data) => apiClient.post('/purchase/suppliers', data),
  updateSupplier: async (id, data) => apiClient.put(`/purchase/suppliers/${id}`, data),
  deleteSupplier: async (id) => apiClient.delete(`/purchase/suppliers/${id}`),
  restoreSupplier: async (id) => apiClient.post(`/purchase/suppliers/${id}/restore`),
  getPurchaseOrders: async (params) => apiClient.get('/purchase/orders', { params }),
  getPOById: async (id) => apiClient.get(`/purchase/orders/${id}`),
  createPO: async (data) => apiClient.post('/purchase/orders', data),
  updatePO: async (id, data) => apiClient.put(`/purchase/orders/${id}`, data),
  submitPOForApproval: async (id) => apiClient.post(`/purchase/orders/${id}/submit`),
  approvePO: async (id, data) => apiClient.post(`/purchase/orders/${id}/approve`, data),
  cancelPO: async (id, data) => apiClient.post(`/purchase/orders/${id}/cancel`, data),
  uploadAttachment: async (id, formData) => apiClient.post(`/purchase/orders/${id}/attachment`, formData),
  getPendingReceiving: async () => apiClient.get('/purchase/receiving/pending'),
  registerReceiving: async (data) => apiClient.post('/purchase/receiving/register', data),
  getSectors: async () => apiClient.get('/purchase/sectors'),
  getPaymentTerms: async () => apiClient.get('/purchase/payment-terms'),
  getPurchaseStatistics: async () => apiClient.get('/purchase/statistics'),
  getReorderSuggestions: async () => apiClient.get('/purchase/reorder-suggestions'),
};
export default purchaseService;