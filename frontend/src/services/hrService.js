import apiClient from './apiClient';

const hrService = {
  login: async (employeeId, password) => {
    return await apiClient.post('/hr/auth/login', { employeeId, password });
  },
  getSummary: async () => {
    return await apiClient.get('/hr/summary');
  },
  getEmployees: async (params) => {
    return await apiClient.get('/hr/employees', { params });
  },
  getEmployeeById: async (id) => {
    return await apiClient.get(`/hr/employees/${id}`);
  },
  createEmployee: async (data) => {
    return await apiClient.post('/hr/employees', data);
  },
  updateEmployee: async (id, data) => {
    return await apiClient.put(`/hr/employees/${id}`, data);
  },
  clockIn: async (employeeId, computerId) => {
    return await apiClient.post('/hr/clock-in', { employeeId, computerId });
  },
  clockOut: async (employeeId, computerId) => {
    return await apiClient.post('/hr/clock-out', { employeeId, computerId });
  },
  getMyAttendance: async (employeeId) => {
    return await apiClient.get('/hr/my-attendance', { params: { employeeId } });
  },
  getMonthlyAttendance: async (employeeId, month) => {
    return await apiClient.get(`/hr/attendance/monthly/${employeeId}`, { params: { month } });
  },
  getDailyAttendances: async (date) => {
    return await apiClient.get('/hr/attendance/daily', { params: { date } });
  },
  getComputers: async () => {
    return await apiClient.get('/hr/computers');
  },
  registerComputer: async (data) => {
    return await apiClient.post('/hr/computers', data);
  },
  createLeaveRequest: async (data) => {
    return await apiClient.post('/hr/leaves', data);
  },
  getLeaveRequests: async (params) => {
    return await apiClient.get('/hr/leaves', { params });
  },
  reviewLeave: async (id, approved, rejectionReason) => {
    return await apiClient.post(`/hr/leaves/${id}/review`, { approved, rejectionReason });
  },
  calculatePayroll: async (month) => {
    return await apiClient.post('/hr/payroll/calculate', { month });
  },
  getPayroll: async (month) => {
    return await apiClient.get(`/hr/payroll/${month}`);
  },
  sendPayrollToFinance: async (month) => {
    return await apiClient.post(`/hr/payroll/${month}/send`);
  },
  approvePayrollFinance: async (month) => {
    return await apiClient.post(`/hr/payroll/${month}/approve`);
  },
  markPayrollPaid: async (month, paymentMethod) => {
    return await apiClient.post(`/hr/payroll/${month}/pay`, { paymentMethod });
  },
  getManagerAccuracy: async () => {
    return await apiClient.get('/hr/manager-accuracy');
  }
};

export default hrService;
