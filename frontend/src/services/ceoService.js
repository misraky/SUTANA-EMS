import apiClient from './apiClient';
import { format } from 'date-fns';

const ceoService = {
  // === EXISTING (keep) ===
  getDashboardOverview: async () => apiClient.get('/ceo/dashboard'),
  getRevenueBreakdown: async (period = 'year') => apiClient.get('/ceo/revenue/breakdown', { params: { period } }),
  getRevenueForecast: async (months = 6) => apiClient.get('/ceo/revenue/forecast', { params: { months } }),
  getRevenueMetrics: async (period = 'week') => apiClient.get('/ceo/revenue', { params: { period } }),
  getProfitMetrics: async (period = 'month') => apiClient.get('/ceo/profit', { params: { period } }),
  getProfitMarginTrends: async (months = 12) => apiClient.get('/ceo/profit/margin', { params: { months } }),
  getCashFlow: async (period = 'daily', days = 30) => apiClient.get('/ceo/cash-flow', { params: { period, days } }),
  getCashFlowProjection: async (months = 3) => apiClient.get('/ceo/cash-flow/projection', { params: { months } }),
  getKPIs: async (period = 'monthly') => apiClient.get('/ceo/kpis', { params: { period } }),
  getSalesTargetPerformance: async () => apiClient.get('/ceo/kpis/sales-target'),
  getFulfillmentMetrics: async () => apiClient.get('/ceo/kpis/fulfillment'),
  getInventoryTurnover: async () => apiClient.get('/ceo/kpis/inventory-turnover'),
  getCustomerSatisfaction: async () => apiClient.get('/ceo/kpis/customer-satisfaction'),
  getTargets: async () => apiClient.get('/ceo/targets'),
  updateTargets: async (targetData) => apiClient.put('/ceo/targets', targetData),
  resetTargets: async () => apiClient.post('/ceo/targets/reset'),
  getCriticalAlerts: async (severity) => {
    const params = severity ? { severity } : {};
    return apiClient.get('/ceo/alerts', { params });
  },
  dismissAlert: async (alertId) => apiClient.post(`/ceo/alerts/${alertId}/dismiss`),
  getAlertHistory: async (days = 30, page = 1, limit = 20) => 
    apiClient.get('/ceo/alerts/history', { params: { days, page, limit } }),
  getMonthlyReport: async (year, month, format = 'json') => 
    apiClient.get('/ceo/reports/monthly', { params: { year, month, format } }),
  getQuarterlyReport: async (year, quarter, format = 'json') => 
    apiClient.get('/ceo/reports/quarterly', { params: { year, quarter, format } }),
  getYearlyReport: async (year, format = 'json') => 
    apiClient.get('/ceo/reports/yearly', { params: { year, format } }),
  comparePeriods: async (currentPeriod, previousPeriod, metrics) => 
    apiClient.get('/ceo/compare/periods', { params: { currentPeriod, previousPeriod, metrics } }),
  compareSectors: async (metric = 'revenue', period = 'month') => 
    apiClient.get('/ceo/compare/sectors', { params: { metric, period } }),
  getInventoryMovements: async (params) => 
    apiClient.get('/reports/inventory/movements', { params }),
  getCurrentStock: async () =>
    apiClient.get('/reports/inventory/current-stock'),

  // === NEW: HR & People ===
  getHRSummary: async () => apiClient.get('/ceo/hr/summary'),
  getAttritionData: async (period = 'quarter') => apiClient.get('/ceo/hr/attrition', { params: { period } }),
  getCompensationData: async () => apiClient.get('/ceo/hr/compensation'),
  getSuccessionPipeline: async () => apiClient.get('/ceo/hr/succession'),
  getDEIMetrics: async () => apiClient.get('/ceo/hr/dei'),

  // === NEW: Board & Governance ===
  getBoardPack: async (meetingId) => apiClient.get(`/ceo/board/${meetingId}`),
  getBoardMeetings: async () => apiClient.get('/ceo/board/meetings'),
  createBoardMeeting: async (data) => apiClient.post('/ceo/board/meetings', data),
  getShareholderRegistry: async () => apiClient.get('/ceo/board/shareholders'),
  createShareholder: async (data) => apiClient.post('/ceo/board/shareholders', data),
  getDividendStatus: async () => apiClient.get('/ceo/board/dividends'),
  getBoardResolutions: async () => apiClient.get('/ceo/board/resolutions'),
  createBoardResolution: async (data) => apiClient.post('/ceo/board/resolutions', data),
  updateBoardMeeting: async (id, data) => apiClient.put(`/ceo/board/meetings/${id}`, data),
  deleteBoardMeeting: async (id) => apiClient.delete(`/ceo/board/meetings/${id}`),
  updateShareholder: async (id, data) => apiClient.put(`/ceo/board/shareholders/${id}`, data),
  deleteShareholder: async (id) => apiClient.delete(`/ceo/board/shareholders/${id}`),
  updateBoardResolution: async (id, data) => apiClient.put(`/ceo/board/resolutions/${id}`, data),
  deleteBoardResolution: async (id) => apiClient.delete(`/ceo/board/resolutions/${id}`),

  // === NEW: Risk & Compliance ===
  getRiskRegister: async () => apiClient.get('/ceo/risk/register'),
  getESGSummary: async () => apiClient.get('/ceo/risk/esg'),
  getRegulatoryCalendar: async () => apiClient.get('/ceo/risk/regulatory'),
  getComplianceStatus: async () => apiClient.get('/ceo/risk/compliance'),
  getCybersecurityPosture: async () => apiClient.get('/ceo/risk/cybersecurity'),
  createRisk: async (data) => apiClient.post('/ceo/risk/register', data),
  updateRisk: async (id, data) => apiClient.put(`/ceo/risk/register/${id}`, data),
  deleteRisk: async (id) => apiClient.delete(`/ceo/risk/register/${id}`),
  createComplianceItem: async (data) => apiClient.post('/ceo/risk/compliance', data),
  updateComplianceItem: async (id, data) => apiClient.put(`/ceo/risk/compliance/${id}`, data),
  deleteComplianceItem: async (id) => apiClient.delete(`/ceo/risk/compliance/${id}`),
  createRegulatoryItem: async (data) => apiClient.post('/ceo/risk/regulatory', data),
  updateRegulatoryItem: async (id, data) => apiClient.put(`/ceo/risk/regulatory/${id}`, data),
  deleteRegulatoryItem: async (id) => apiClient.delete(`/ceo/risk/regulatory/${id}`),
  createESGMetric: async (data) => apiClient.post('/ceo/risk/esg', data),
  updateESGMetric: async (id, data) => apiClient.put(`/ceo/risk/esg/${id}`, data),
  deleteESGMetric: async (id) => apiClient.delete(`/ceo/risk/esg/${id}`),
  createCyberControl: async (data) => apiClient.post('/ceo/risk/cybersecurity', data),
  updateCyberControl: async (id, data) => apiClient.put(`/ceo/risk/cybersecurity/${id}`, data),
  deleteCyberControl: async (id) => apiClient.delete(`/ceo/risk/cybersecurity/${id}`),

  // === NEW: Crisis Management ===
  activateCrisisMode: async () => apiClient.post('/ceo/crisis/activate'),
  deactivateCrisisMode: async () => apiClient.post('/ceo/crisis/deactivate'),
  getCrisisStatus: async () => apiClient.get('/ceo/crisis/status'),
  fastTrackApproval: async (requestData) => apiClient.post('/ceo/crisis/fast-track', requestData),
  getEmergencyActions: async () => apiClient.get('/ceo/crisis/actions'),
  createEmergencyAction: async (data) => apiClient.post('/ceo/crisis/actions', data),
  updateEmergencyAction: async (id, data) => apiClient.put(`/ceo/crisis/actions/${id}`, data),
  deleteEmergencyAction: async (id) => apiClient.delete(`/ceo/crisis/actions/${id}`),
  getFastTrackApprovals: async () => apiClient.get('/ceo/crisis/fast-track'),
  approveFastTrack: async (id) => apiClient.post(`/ceo/crisis/fast-track/${id}/approve`),
  rejectFastTrack: async (id) => apiClient.post(`/ceo/crisis/fast-track/${id}/reject`),

  // === NEW: Strategy Execution (OKR) ===
  getOKRs: async (period = 'quarter') => apiClient.get('/ceo/okrs', { params: { period } }),
  updateOKR: async (id, data) => apiClient.put(`/ceo/okrs/${id}`, data),
  getInitiativePortfolio: async () => apiClient.get('/ceo/initiatives'),

  // === NEW: Customer Executive View ===
  getTopAccounts: async () => apiClient.get('/ceo/customers/top'),
  getAccountHealth: async (accountId) => apiClient.get(`/ceo/customers/${accountId}/health`),
  getChurnPrediction: async () => apiClient.get('/ceo/customers/churn-risk'),

  // === NEW: Supply Chain ===
  getSupplierHealth: async () => apiClient.get('/ceo/supply-chain/suppliers'),
  getDisruptionHeatmap: async () => apiClient.get('/ceo/supply-chain/disruptions'),
  getInventoryRisk: async () => apiClient.get('/ceo/supply-chain/inventory-risk'),

  // === NEW: Corporate IT ===
  getITPortfolio: async () => apiClient.get('/ceo/it/portfolio'),
  getITSpend: async () => apiClient.get('/ceo/it/spend'),
  getCybersecurityDashboard: async () => apiClient.get('/ceo/it/cybersecurity'),

  // === NEW: Legal & IP ===
  getLitigationSummary: async () => apiClient.get('/ceo/legal/litigation'),
  getPatentPortfolio: async () => apiClient.get('/ceo/legal/patents'),
  getRegulatoryChanges: async () => apiClient.get('/ceo/legal/regulatory'),

  // === NEW: Facilities & Real Estate ===
  getPropertyPortfolio: async () => apiClient.get('/ceo/facilities/properties'),
  getLeaseCalendar: async () => apiClient.get('/ceo/facilities/leases'),
  getFacilitiesCAPEX: async () => apiClient.get('/ceo/facilities/capex'),

  // === NEW: Override Privileges ===
  getOverrideLog: async () => apiClient.get('/ceo/overrides'),
  executeOverride: async (overrideData) => apiClient.post('/ceo/overrides', overrideData),
  getAuditLog: async (days = 30) => apiClient.get('/ceo/audit', { params: { days } }),

  // === NEW: Delegation ===
  getDelegations: async () => apiClient.get('/ceo/delegations'),
  createDelegation: async (delegationData) => apiClient.post('/ceo/delegations', delegationData),
  revokeDelegation: async (id) => apiClient.delete(`/ceo/delegations/${id}`),
  getDeputyConfig: async () => apiClient.get('/ceo/delegations/deputy'),
  setDeputy: async (deputyData) => apiClient.put('/ceo/delegations/deputy', deputyData),

  // === NEW: Personalization ===
  getSavedViews: async () => apiClient.get('/ceo/views'),
  saveView: async (viewData) => apiClient.post('/ceo/views', viewData),
  deleteView: async (id) => apiClient.delete(`/ceo/views/${id}`),
  getWidgetLibrary: async () => apiClient.get('/ceo/widgets'),
  updateDashboardLayout: async (layoutData) => apiClient.put('/ceo/dashboard/layout', layoutData),

  // Financial Report Approvals (from Finance → CEO → Board)
  getPendingCEOApprovals: async () => apiClient.get('/ceo/report-approvals/pending-ceo'),
  ceoApproveReport: async (id, comment) => apiClient.post(`/ceo/report-approvals/${id}/ceo-approve`, { comment }),
  getPendingBoardApprovals: async () => apiClient.get('/ceo/report-approvals/pending-board'),
  boardApproveReport: async (id, comment) => apiClient.post(`/ceo/report-approvals/${id}/board-approve`, { comment }),
  rejectReport: async (id, reason) => apiClient.post(`/ceo/report-approvals/${id}/reject`, { reason }),
  getAllReportSubmissions: async (status) => apiClient.get('/ceo/report-approvals/all', { params: { status } }),
};
export default ceoService;
