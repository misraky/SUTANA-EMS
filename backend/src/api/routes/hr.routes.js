const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const HRController = require('../controllers/hr.controller');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, authorize, authorizeRoles } = require('../middleware/auth.middleware');

router.post('/auth/login', body('employeeId').notEmpty(), body('password').notEmpty(), validate, HRController.authenticate);

router.get('/summary', authenticate, authorize(['hr:read']), HRController.getHRSummary);

router.post('/employees', authenticate, authorize(['hr:write']),
  body('fullName').notEmpty(), body('email').isEmail(), body('department').notEmpty(), validate, HRController.createEmployee);
router.put('/employees/:id', authenticate, authorize(['hr:write']), HRController.updateEmployee);
router.get('/employees', authenticate, authorize(['hr:read']), HRController.getEmployees);
router.get('/employees/:id', authenticate, authorize(['hr:read']), HRController.getEmployeeById);

router.post('/clock-in', body('employeeId').notEmpty(), body('computerId').notEmpty(), validate, HRController.clockIn);
router.post('/clock-out', body('employeeId').notEmpty(), body('computerId').notEmpty(), validate, HRController.clockOut);
router.get('/my-attendance', authenticate, HRController.getMyAttendance);
router.get('/attendance/monthly/:employeeId', authenticate, authorize(['hr:read']), HRController.getMonthlyAttendance);
router.get('/attendance/daily', authenticate, authorize(['hr:read']), HRController.getDailyAttendances);

router.post('/computers', authenticate, authorize(['hr:write']),
  body('computerId').notEmpty(), body('computerName').notEmpty(), validate, HRController.registerComputer);
router.get('/computers', authenticate, authorize(['hr:read']), HRController.getRegisteredComputers);

router.post('/leaves', authenticate, body('leaveTypeId').isInt(), body('startDate').notEmpty(), body('endDate').notEmpty(), validate, HRController.createLeaveRequest);
router.get('/leaves', authenticate, HRController.getLeaveRequests);
router.post('/leaves/:id/review', authenticate, authorize(['hr:write']), body('approved').isBoolean(), validate, HRController.approveLeave);

router.post('/payroll/calculate', authenticate, authorize(['hr:write']), body('month').notEmpty(), validate, HRController.calculatePayroll);
router.get('/payroll/:month', authenticate, authorize(['hr:read', 'finance:read']), HRController.getPayroll);
router.post('/payroll/:month/send', authenticate, authorize(['hr:write']), HRController.sendPayrollToFinance);
router.post('/payroll/:month/approve', authenticate, authorize(['finance:approve']), HRController.approvePayrollFinance);
router.post('/payroll/:month/pay', authenticate, authorize(['finance:write']), body('paymentMethod').notEmpty(), validate, HRController.markPayrollPaid);

router.get('/manager-accuracy', authenticate, authorize(['ceo:dashboard', 'hr:read']), HRController.getManagerAccuracyReport);

module.exports = router;
