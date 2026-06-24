const hrService = require('../../services/hr.service');
const { catchAsync } = require('../../utils/catchAsync');

exports.getHRSummary = catchAsync(async (req, res) => {
  const data = await hrService.getHRSummary();
  res.json({ success: true, data });
});

exports.getAttritionData = catchAsync(async (req, res) => {
  const { period = 'quarter' } = req.query;
  const data = await hrService.getAttritionData(period);
  res.json({ success: true, data });
});

exports.getCompensationData = catchAsync(async (req, res) => {
  const data = await hrService.getCompensationData();
  res.json({ success: true, data });
});

exports.getSuccessionPipeline = catchAsync(async (req, res) => {
  const data = await hrService.getSuccessionPipeline();
  res.json({ success: true, data });
});

exports.getDEIMetrics = catchAsync(async (req, res) => {
  const data = await hrService.getDEIMetrics();
  res.json({ success: true, data });
const HrService = require('../../services/hr.service');
const { audit } = require('../../config/logger');
const AppError = require('../../utils/AppError');
const { catchAsync } = require('../../utils/catchAsync');

exports.createEmployee = catchAsync(async (req, res) => {
  const id = await HrService.createEmployee(req.body);
  await audit('EMPLOYEE_CREATED', req.user.id, { resource: 'HR', resourceId: id, ip: req.ip });
  res.status(201).json({ status: 'success', data: { employeeId: id } });
});

exports.updateEmployee = catchAsync(async (req, res) => {
  await HrService.updateEmployee(req.params.id, req.body);
  await audit('EMPLOYEE_UPDATED', req.user.id, { resource: 'HR', resourceId: req.params.id, ip: req.ip });
  res.json({ status: 'success', message: 'Employee updated' });
});

exports.getEmployees = catchAsync(async (req, res) => {
  const employees = await HrService.getEmployees(req.query);
  res.json({ status: 'success', data: { employees } });
});

exports.getEmployeeById = catchAsync(async (req, res) => {
  const emp = await HrService.getEmployeeById(req.params.id);
  if (!emp) throw new AppError('Employee not found', 404);
  res.json({ status: 'success', data: { employee: emp } });
});

exports.clockIn = catchAsync(async (req, res) => {
  const result = await HrService.registerClock(req.body.employeeId, req.body.computerId, 'CLOCK_IN', req.ip);
  if (result.error) throw new AppError(result.error, 400);
  await audit('CLOCK_IN', req.body.employeeId, { resource: 'ATTENDANCE', resourceId: result.id, ip: req.ip });
  res.json({ status: 'success', data: result });
});

exports.clockOut = catchAsync(async (req, res) => {
  const result = await HrService.registerClock(req.body.employeeId, req.body.computerId, 'CLOCK_OUT', req.ip);
  if (result.error) throw new AppError(result.error, 400);
  await audit('CLOCK_OUT', req.body.employeeId, { resource: 'ATTENDANCE', resourceId: result.id, ip: req.ip });
  res.json({ status: 'success', data: result });
});

exports.getMyAttendance = catchAsync(async (req, res) => {
  const today = await HrService.getTodayAttendance(req.user.employeeId || req.query.employeeId);
  res.json({ status: 'success', data: today });
});

exports.getMonthlyAttendance = catchAsync(async (req, res) => {
  const records = await HrService.getMonthlyAttendance(req.params.employeeId || req.query.employeeId, req.query.month);
  res.json({ status: 'success', data: { records } });
});

exports.getDailyAttendances = catchAsync(async (req, res) => {
  const attendances = await HrService.getDailyAttendances(req.query.date);
  res.json({ status: 'success', data: { attendances } });
});

exports.registerComputer = catchAsync(async (req, res) => {
  await HrService.registerComputer(req.body);
  await audit('COMPUTER_REGISTERED', req.user.id, { resource: 'HR', resourceId: req.body.computerId, ip: req.ip });
  res.status(201).json({ status: 'success', message: 'Computer registered' });
});

exports.getRegisteredComputers = catchAsync(async (req, res) => {
  const computers = await HrService.getRegisteredComputers();
  res.json({ status: 'success', data: { computers } });
});

exports.createLeaveRequest = catchAsync(async (req, res) => {
  const id = await HrService.createLeaveRequest(req.user.employeeId || req.body.employeeId, req.body);
  await audit('LEAVE_REQUESTED', req.user.id || req.body.employeeId, { resource: 'HR', resourceId: id, ip: req.ip });
  res.status(201).json({ status: 'success', data: { leaveId: id } });
});

exports.getLeaveRequests = catchAsync(async (req, res) => {
  const leaves = await HrService.getLeaveRequests(req.query);
  res.json({ status: 'success', data: { leaves } });
});

exports.approveLeave = catchAsync(async (req, res) => {
  const { approved, rejectionReason } = req.body;
  const status = approved ? 'Approved' : 'Rejected';
  await HrService.approveLeave(req.params.id, req.user.id, status, rejectionReason);
  await audit('LEAVE_' + status.toUpperCase(), req.user.id, { resource: 'HR', resourceId: req.params.id, ip: req.ip });
  res.json({ status: 'success', message: `Leave ${status.toLowerCase()}` });
});

exports.getHRSummary = catchAsync(async (req, res) => {
  const summary = await HrService.getHRSummary();
  res.json({ status: 'success', data: summary });
});

exports.calculatePayroll = catchAsync(async (req, res) => {
  const result = await HrService.calculatePayroll(req.body.month);
  await audit('PAYROLL_CALCULATED', req.user.id, { resource: 'PAYROLL', resourceId: result.payrollId, ip: req.ip });
  res.json({ status: 'success', data: result });
});

exports.getPayroll = catchAsync(async (req, res) => {
  const payroll = await HrService.getPayroll(req.params.month);
  if (!payroll) throw new AppError('Payroll not found for this month', 404);
  res.json({ status: 'success', data: { payroll } });
});

exports.sendPayrollToFinance = catchAsync(async (req, res) => {
  await HrService.sendPayrollToFinance(req.params.month, req.user.id);
  await audit('PAYROLL_SENT', req.user.id, { resource: 'PAYROLL', resourceId: req.params.month, ip: req.ip });
  res.json({ status: 'success', message: 'Payroll sent to finance' });
});

exports.approvePayrollFinance = catchAsync(async (req, res) => {
  await HrService.approvePayroll(req.params.month, req.user.id);
  await audit('PAYROLL_APPROVED', req.user.id, { resource: 'PAYROLL', resourceId: req.params.month, ip: req.ip });
  res.json({ status: 'success', message: 'Payroll approved' });
});

exports.markPayrollPaid = catchAsync(async (req, res) => {
  await HrService.markPayrollPaid(req.params.month, req.body.paymentMethod);
  await audit('PAYROLL_PAID', req.user.id, { resource: 'PAYROLL', resourceId: req.params.month, ip: req.ip });
  res.json({ status: 'success', message: 'Payroll marked as paid' });
});

exports.getManagerAccuracyReport = catchAsync(async (req, res) => {
  const report = await HrService.getManagerAccuracyReport();
  res.json({ status: 'success', data: { report } });
});

exports.authenticate = catchAsync(async (req, res) => {
  const emp = await HrService.authenticateEmployee(req.body.employeeId, req.body.password);
  if (!emp) throw new AppError('Invalid Employee ID or Password', 401);
  const token = require('jsonwebtoken').sign(
    { employeeId: emp.employee_id, sub: emp.employee_id, role: 'Employee' },
    process.env.JWT_SECRET || require('../../config/env').jwt.secret,
    { expiresIn: '12h' }
  );
  res.json({ status: 'success', data: { token, employee: emp } });
}));
