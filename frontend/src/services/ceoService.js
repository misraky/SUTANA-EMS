import apiClient from './apiClient';
const ceoService = {
  getDashboardOverview: async () => {
    return await apiClient.get('/ceo/dashboard');
  },
  getRevenueBreakdown: async (period = 'year') => {
    return await apiClient.get('/ceo/revenue/breakdown', { params: { period } });
  },
  getTargets: async () => {
    return await apiClient.get('/ceo/targets');
  },
  updateTargets: async (targetData) => {
    return await apiClient.put('/ceo/targets', targetData);
  },
  resetTargets: async () => {
    return await apiClient.post('/ceo/targets/reset');
  },
  getMonthlyReport: async (year, month, format = 'json') => {
    return await apiClient.get('/ceo/reports/monthly', { params: { year, month, format } });
  },
  getQuarterlyReport: async (year, quarter, format = 'json') => {
    return await apiClient.get('/ceo/reports/quarterly', { params: { year, quarter, format } });
  },
  getYearlyReport: async (year, format = 'json') => {
    return await apiClient.get('/ceo/reports/yearly', { params: { year, format } });
  },
  getKPIs: async (period = 'monthly') => {
    return await apiClient.get('/ceo/kpis', { params: { period } });
  },
  getCashFlow: async (period = 'daily', days = 30) => {
    return await apiClient.get('/ceo/cash-flow', { params: { period, days } });
  },
  getCriticalAlerts: async (severity) => {
    const params = severity ? { severity } : {};
    return await apiClient.get('/ceo/alerts', { params });
  },
  dismissAlert: async (alertId) => {
    return await apiClient.post(`/ceo/alerts/${alertId}/dismiss`);
  }
};
export default ceoService;
