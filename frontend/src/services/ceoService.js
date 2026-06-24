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
  },
  getActivityLog: async (limit = 10) => {
    return await apiClient.get('/ceo/activity', { params: { limit } });
  },
  getPendingPOApprovals: async () => {
    return await apiClient.get('/ceo/pending-approvals');
  },
  approvePO: async (id) => {
    return await apiClient.post(`/ceo/approve/${id}`);
  },
  rejectPO: async (id, rejectionReason) => {
    return await apiClient.post(`/ceo/reject/${id}`, { rejectionReason });
  },
  getPendingApprovalsCount: async () => {
    return await apiClient.get('/ceo/pending-approvals-count');
  },
  getHRSummary: async () => {
    return await apiClient.get('/ceo/hr-summary');
  },
  getFarmingAttendance: async () => {
    return await apiClient.get('/farming/attendance/today');
  },
  getDailyEmployees: async () => {
    return await apiClient.get('/ceo/daily-employees');
  },
  getEmployeeMonthlyAttendance: async (employeeId, month) => {
    return await apiClient.get(`/ceo/employee-attendance/${employeeId}`, { params: { month } });
  }
};
export default ceoService;
