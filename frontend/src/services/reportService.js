import apiClient from './apiClient';
const reportService = {
  getDailySales: async (params) => {
    return await apiClient.get('/reports/sales/daily', { params });
  },
  getWeeklySales: async (params) => {
    return await apiClient.get('/reports/sales/weekly', { params });
  },
  getMonthlySales: async (params) => {
    return await apiClient.get('/reports/sales/monthly', { params });
  },
  getSalesByPeriod: async (params) => {
    return await apiClient.get('/reports/sales/by-period', { params });
  },
  getLowStock: async (params) => {
    return await apiClient.get('/reports/inventory/low-stock', { params });
  },
  getInventoryMovements: async (params) => {
    return await apiClient.get('/reports/inventory/movements', { params });
  },
  getProfitAndLoss: async (params) => {
    return await apiClient.get('/reports/finance/pnl', { params });
  },
  getTaxSummary: async (params) => {
    return await apiClient.get('/reports/finance/tax', { params });
  },
  getExpenses: async (params) => {
    return await apiClient.get('/reports/finance/expenses', { params });
  },
  exportReport: async (reportType, params) => {
    return await apiClient.get(`/reports/export/${reportType}`, { 
      params,
      responseType: 'blob' 
    });
  }
};
export default reportService;
