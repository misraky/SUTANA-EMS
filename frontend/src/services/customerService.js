import apiClient from './apiClient';
const customerService = {
  getProfile: async () => {
    return await apiClient.get('/customer/profile');
  },
  updateProfile: async (data) => {
    return await apiClient.put('/customer/profile', data);
  },
  changePassword: async (data) => {
    return await apiClient.post('/customer/change-password', data);
  },
  getOrders: async (params) => {
    return await apiClient.get('/customer/orders', { params });
  },
  getOrderById: async (id) => {
    return await apiClient.get(`/customer/orders/${id}`);
  },
  createOrder: async (data) => {
    return await apiClient.post('/customer/orders', data);
  },
  trackOrder: async (id) => {
    return await apiClient.get(`/customer/orders/${id}/track`);
  },
  uploadOrderAttachments: async (id, formData) => {
    return await apiClient.post(`/customer/orders/${id}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  cancelOrder: async (id, reason) => {
    return await apiClient.post(`/customer/orders/${id}/cancel`, { reason });
  },
  requestQuote: async (data) => {
    return await apiClient.post('/customer/quote', data);
  },
  getQuotes: async (params) => {
    return await apiClient.get('/customer/quotes', { params });
  },
  acceptQuote: async (id) => {
    return await apiClient.post(`/customer/quotes/${id}/accept`);
  },
  getReceipts: async (params) => {
    return await apiClient.get('/customer/receipts', { params });
  },
  downloadReceipt: async (id) => {
    return await apiClient.get(`/customer/receipts/${id}`, { responseType: 'blob' });
  },
  getInvoices: async (params) => {
    return await apiClient.get('/customer/invoices', { params });
  },
  getBalance: async () => {
    return await apiClient.get('/customer/balance');
  },
  makePayment: async (data) => {
    return await apiClient.post('/customer/payments', data);
  },
  getNotifications: async (params) => {
    return await apiClient.get('/customer/notifications', { params });
  },
  markNotificationRead: async (id) => {
    return await apiClient.put(`/customer/notifications/${id}/read`);
  },
  markAllNotificationsRead: async () => {
    return await apiClient.put('/customer/notifications/read-all');
  },
  createSupportTicket: async (data) => {
    return await apiClient.post('/customer/support', data);
  },
  getSupportTickets: async (params) => {
    return await apiClient.get('/customer/support', { params });
  }
};
export default customerService;
