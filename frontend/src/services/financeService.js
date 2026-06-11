import apiClient from './apiClient';
const financeService = {
  getExpenses: async (params) => {
    return await apiClient.get('/finance/expenses', { params });
  },
  createExpense: async (data) => {
    return await apiClient.post('/finance/expenses', data);
  },
  approveExpense: async (id, data) => {
    return await apiClient.post(`/finance/expenses/${id}/approve`, data);
  },
  getPayments: async (params) => {
    return await apiClient.get('/finance/payments', { params });
  },
  processPOPayment: async (data) => {
    return await apiClient.post('/finance/payments/po', data);
  },
  processInvoicePayment: async (data) => {
    return await apiClient.post('/finance/payments/invoice', data);
  },
  getStatistics: async () => {
    return await apiClient.get('/finance/statistics');
  },
  getAccountsReceivable: async (params) => {
    return await apiClient.get('/finance/accounts-receivable', { params });
  },
  getAccountsPayable: async (params) => {
    return await apiClient.get('/finance/accounts-payable', { params });
  },
  getReports: async (params) => {
    return await apiClient.get('/finance/reports', { params });
  },
  getExpenseCategories: async () => {
    return await apiClient.get('/finance/expense-categories');
  },
  getPaymentMethods: async () => {
    return await apiClient.get('/finance/payment-methods');
  },
  // Rental Payments (Car Renting)
  getPendingRentalPayments: async () => {
    return await apiClient.get('/rental-orders/pending-payments');
  },
  verifyRentalPayment: async (id, data) => {
    return await apiClient.post(`/rental-orders/${id}/verify-payment`, data);
  }
};
export default financeService;
