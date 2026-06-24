import apiClient from './apiClient';

const purchaseService = {
  // ── Suppliers ──
  getSuppliers: async (params) => {
    return await apiClient.get('/purchase/suppliers', { params });
  },
  getSupplierById: async (id) => {
    return await apiClient.get(`/purchase/suppliers/${id}`);
  },
  createSupplier: async (data) => {
    return await apiClient.post('/purchase/suppliers', data);
  },
  awardSupplierBid: async (id, formData) => {
    return await apiClient.post(`/purchase/suppliers/${id}/award`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // ── Purchase Orders ──
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

  // ── Receiving ──
  getPendingReceiving: async () => {
    return await apiClient.get('/purchase/receiving/pending');
  },
  getPendingReceivingById: async (id) => {
    return await apiClient.get(`/purchase/receiving/pending/${id}`);
  },
  registerReceiving: async (data) => {
    return await apiClient.post('/purchase/receiving/register', data);
  },
  getGRNs: async (poId) => {
    return await apiClient.get('/purchase/receiving/grns', { params: { poId } });
  },


  // ── Contracts ──
  getContracts: async (params) => {
    return await apiClient.get('/purchase/contracts', { params });
  },

  // ── Fraud Alerts ──
  getFraudAlerts: async () => {
    return await apiClient.get('/purchase/fraud/alerts');
  },

  // ── Stats / Analytics ──
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
