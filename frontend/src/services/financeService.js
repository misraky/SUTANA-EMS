import apiClient from './apiClient';
const financeService = {
  // Legacy endpoints
  getExpenses: async (params) => apiClient.get('/finance/expenses', { params }),
  createExpense: async (data) => apiClient.post('/finance/expenses', data),
  approveExpense: async (id, data) => apiClient.post(`/finance/expenses/${id}/approve`, data),
  getPayments: async (params) => apiClient.get('/finance/payments', { params }),
  getUnpaidInvoices: async (params) => apiClient.get('/finance/payments/unpaid-invoices', { params }),
  getUnpaidPOs: async (params) => apiClient.get('/finance/payments/unpaid-pos', { params }),
  processPOPayment: async (data) => apiClient.post('/finance/payments/po', data),
  processInvoicePayment: async (data) => apiClient.post('/finance/payments/invoice', data),
  getStatistics: async () => apiClient.get('/finance/statistics'),
  getAccountsReceivable: async (params) => apiClient.get('/finance/accounts-receivable', { params }),
  getAccountsPayable: async (params) => apiClient.get('/finance/accounts-payable', { params }),
  getExpenseCategories: async () => apiClient.get('/finance/expense-categories'),
  getPaymentMethods: async () => apiClient.get('/finance/payment-methods'),
  getRentalPaymentVerification: async () => apiClient.get('/rental-orders/pending-payments'),
  searchRentalOrders: async (q) => apiClient.get(`/rental-orders/search?q=${encodeURIComponent(q)}`),
  verifyRentalPayment: async (id, data) => apiClient.post(`/rental-orders/${id}/verify-payment`, data),
  uploadRentalPaymentProof: async (id, file) => {
    const formData = new FormData();
    formData.append('proof', file);
    return await apiClient.post(`/rental-orders/${id}/payment-proof`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Enhanced expense endpoints (multi-tier approval, tax, budget)
  getEnhancedExpenses: async (params) => apiClient.get('/finance/expenses/enhanced', { params }),
  getEnhancedExpenseById: async (id) => apiClient.get(`/finance/expenses/enhanced/${id}`),
  createEnhancedExpense: async (data) => apiClient.post('/finance/expenses/enhanced', data),
  getExpenseAuditTrail: async (id) => apiClient.get(`/finance/expenses/${id}/audit`),
  processExpensePayment: async (id, data) => apiClient.post(`/finance/expenses/${id}/payment`, data),
  getExpenseSummaryByTier: async (params) => apiClient.get('/finance/expenses/summary/tier', { params }),
  getEnhancedStatistics: async () => apiClient.get('/finance/statistics/enhanced'),

  // Approval workflow
  getApprovalDashboard: async () => apiClient.get('/finance/approvals/dashboard'),
  getExpenseApprovalHistory: async (expenseId) => apiClient.get(`/finance/approvals/expense/${expenseId}`),
  processApprovalDecision: async (id, data) => apiClient.post(`/finance/approvals/expense/${id}/decide`, data),
  getApprovers: async () => apiClient.get('/finance/approvals/approvers'),
  setApprover: async (data) => apiClient.post('/finance/approvals/approvers', data),

  // Budget
  getBudgets: async (params) => apiClient.get('/finance/budgets', { params }),
  getBudgetById: async (id) => apiClient.get(`/finance/budgets/${id}`),
  createBudget: async (data) => apiClient.post('/finance/budgets', data),
  updateBudget: async (id, data) => apiClient.put(`/finance/budgets/${id}`, data),
  approveBudget: async (id) => apiClient.post(`/finance/budgets/${id}/approve`),
  addBudgetItem: async (budgetId, data) => apiClient.post(`/finance/budgets/${budgetId}/items`, data),
  getBudgetUtilization: async (budgetId) => apiClient.get(`/finance/budgets/${budgetId}/utilization`),

  // Petty Cash
  getPettyCashSummary: async () => apiClient.get('/finance/petty-cash/summary'),
  getPettyCashFunds: async (params) => apiClient.get('/finance/petty-cash/funds', { params }),
  getPettyCashFundById: async (id) => apiClient.get(`/finance/petty-cash/funds/${id}`),
  createPettyCashFund: async (data) => apiClient.post('/finance/petty-cash/funds', data),
  getPettyCashTransactions: async (fundId, params) => apiClient.get(`/finance/petty-cash/funds/${fundId}/transactions`, { params }),
  disbursePettyCash: async (fundId, data) => apiClient.post(`/finance/petty-cash/funds/${fundId}/disburse`, data),
  replenishPettyCash: async (fundId, data) => apiClient.post(`/finance/petty-cash/funds/${fundId}/replenish`, data),
  reconcilePettyCash: async (fundId, data) => apiClient.post(`/finance/petty-cash/funds/${fundId}/reconcile`, data),

  // Chart of Accounts
  getCOA: async (params) => apiClient.get('/finance/coa', { params }),
  getCOATree: async () => apiClient.get('/finance/coa/tree'),
  createCOAAccount: async (data) => apiClient.post('/finance/coa', data),
  updateCOAAccount: async (id, data) => apiClient.put(`/finance/coa/${id}`, data),

  // Month-End Close
  getCurrentClosePeriod: async () => apiClient.get('/finance/close/current'),
  getClosePeriodHistory: async () => apiClient.get('/finance/close/history'),
  getCloseReadiness: async (period) => apiClient.get(`/finance/close/${period}/readiness`),
  executeClose: async (period, data) => apiClient.post(`/finance/close/${period}/execute`, data),
  reopenPeriod: async (period, data) => apiClient.post(`/finance/close/${period}/reopen`, data),

  // Bank Transactions
  createBankTransaction: async (data) => apiClient.post('/finance/bank-transactions', data),

  // Tax
  getTaxRegistrations: async () => apiClient.get('/finance/tax/registrations'),
  declareTax: async (expenseId) => apiClient.post(`/finance/tax/declare/${expenseId}`),

  // Report Submissions (Finance → CEO → Board approval workflow)
  getReportSubmissions: async () => apiClient.get('/finance/report-submissions'),
  getReportSubmissionById: async (id) => apiClient.get(`/finance/report-submissions/${id}`),
  createReportSubmission: async (data) => apiClient.post('/finance/report-submissions', data),
  updateReportSubmission: async (id, data) => apiClient.put(`/finance/report-submissions/${id}`, data),
  submitReportForApproval: async (id) => apiClient.post(`/finance/report-submissions/${id}/submit`),
};
export default financeService;
