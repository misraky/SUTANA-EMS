const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const CEODashboardController = require('../controllers/ceo.controller');
const HRController = require('../controllers/hr.controller');
const BoardController = require('../controllers/board.controller');
const RiskController = require('../controllers/risk.controller');
const CrisisController = require('../controllers/crisis.controller');
const ReportSubmissionController = require('../controllers/reportSubmission.controller');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
router.get(
  '/dashboard',
  authenticate,
  authorize(['ceo:dashboard']),
  CEODashboardController.getDashboardOverview
);
router.get(
  '/revenue',
  authenticate,
  authorize(['ceo:revenue']),
  query('period')
    .optional()
    .isIn(['today', 'week', 'month', 'quarter', 'year'])
    .withMessage('Period must be today, week, month, quarter, or year'),
  validate,
  CEODashboardController.getRevenueMetrics
);
router.get(
  '/revenue/breakdown',
  authenticate,
  authorize(['ceo:revenue']),
  query('period').optional().isIn(['month', 'quarter', 'year']),
  validate,
  CEODashboardController.getRevenueBreakdown
);
router.get(
  '/revenue/forecast',
  authenticate,
  authorize(['ceo:revenue']),
  query('months').optional().isInt({ min: 1, max: 12 }),
  validate,
  CEODashboardController.getRevenueForecast
);
router.get(
  '/profit',
  authenticate,
  authorize(['ceo:profit']),
  query('period').optional().isIn(['month', 'quarter', 'year']),
  validate,
  CEODashboardController.getProfitMetrics
);
router.get(
  '/profit/margin',
  authenticate,
  authorize(['ceo:profit']),
  query('months').optional().isInt({ min: 1, max: 24 }),
  validate,
  CEODashboardController.getProfitMarginTrends
);
router.get(
  '/cash-flow',
  authenticate,
  authorize(['ceo:cashflow']),
  query('period')
    .optional()
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Period must be daily, weekly, or monthly'),
  query('days').optional().isInt({ min: 7, max: 90 }),
  validate,
  CEODashboardController.getCashFlow
);
router.get(
  '/cash-flow/projection',
  authenticate,
  authorize(['ceo:cashflow']),
  query('months').optional().isInt({ min: 1, max: 6 }),
  validate,
  CEODashboardController.getCashFlowProjection
);
router.get(
  '/kpis',
  authenticate,
  authorize(['ceo:kpis']),
  query('period').optional().isIn(['daily', 'weekly', 'monthly']),
  validate,
  CEODashboardController.getKPIs
);
router.get(
  '/kpis/sales-target',
  authenticate,
  authorize(['ceo:kpis']),
  CEODashboardController.getSalesTargetPerformance
);
router.get(
  '/kpis/fulfillment',
  authenticate,
  authorize(['ceo:kpis']),
  CEODashboardController.getFulfillmentMetrics
);
router.get(
  '/kpis/inventory-turnover',
  authenticate,
  authorize(['ceo:kpis']),
  CEODashboardController.getInventoryTurnover
);
router.get(
  '/kpis/customer-satisfaction',
  authenticate,
  authorize(['ceo:kpis']),
  CEODashboardController.getCustomerSatisfaction
);
router.get(
  '/targets',
  authenticate,
  authorize(['ceo:targets']),
  CEODashboardController.getTargets
);
router.put(
  '/targets',
  authenticate,
  authorize(['ceo:update_targets']),
  body('dailySalesTarget').optional().isFloat({ min: 0 }),
  body('monthlySalesTarget').optional().isFloat({ min: 0 }),
  body('fulfillmentHoursTarget').optional().isInt({ min: 1, max: 168 }),
  body('inventoryTurnoverTarget').optional().isFloat({ min: 0 }),
  body('customerSatisfactionTarget').optional().isFloat({ min: 0, max: 100 }),
  body('profitMarginTarget').optional().isFloat({ min: 0, max: 100 }),
  validate,
  CEODashboardController.updateTargets
);
router.post(
  '/targets/reset',
  authenticate,
  authorize(['ceo:update_targets']),
  CEODashboardController.resetTargets
);
router.get(
  '/alerts',
  authenticate,
  authorize(['ceo:alerts']),
  query('severity').optional().isIn(['info', 'warning', 'critical']),
  validate,
  CEODashboardController.getCriticalAlerts
);
router.post(
  '/alerts/:alertId/dismiss',
  authenticate,
  authorize(['ceo:alerts']),
  CEODashboardController.dismissAlert
);
router.get(
  '/alerts/history',
  authenticate,
  authorize(['ceo:alerts']),
  query('days').optional().isInt({ min: 1, max: 90 }),
  validate,
  CEODashboardController.getAlertHistory
);
router.get(
  '/compare/periods',
  authenticate,
  authorize(['ceo:reports']),
  query('currentPeriod').isIn(['today', 'week', 'month', 'quarter', 'year']),
  query('previousPeriod').isIn(['yesterday', 'lastWeek', 'lastMonth', 'lastQuarter', 'lastYear']),
  query('metrics').isString(),
  validate,
  CEODashboardController.comparePeriods
);
router.get(
  '/compare/sectors',
  authenticate,
  authorize(['ceo:reports']),
  query('metric').isIn(['revenue', 'profit', 'orders']),
  query('period').isIn(['month', 'quarter', 'year']),
  validate,
  CEODashboardController.compareSectors
);
router.get(
  '/reports/monthly',
  authenticate,
  authorize(['ceo:reports']),
  query('year').isInt({ min: 2024, max: 2030 }),
  query('month').isInt({ min: 1, max: 12 }),
  query('format').optional().isIn(['json', 'pdf']),
  validate,
  CEODashboardController.getMonthlyReport
);
router.get(
  '/reports/quarterly',
  authenticate,
  authorize(['ceo:reports']),
  query('year').isInt({ min: 2024, max: 2030 }),
  query('quarter').isInt({ min: 1, max: 4 }),
  query('format').optional().isIn(['json', 'pdf']),
  validate,
  CEODashboardController.getQuarterlyReport
);
router.get(
  '/reports/yearly',
  authenticate,
  authorize(['ceo:reports']),
  query('year').isInt({ min: 2024, max: 2030 }),
  query('format').optional().isIn(['json', 'pdf']),
  validate,
  CEODashboardController.getYearlyReport
);
router.get('/hr/summary', authenticate, authorize(['ceo:dashboard']), HRController.getHRSummary);
router.get('/hr/attrition', authenticate, authorize(['ceo:dashboard']), HRController.getAttritionData);
router.get('/hr/compensation', authenticate, authorize(['ceo:dashboard']), HRController.getCompensationData);
router.get('/hr/succession', authenticate, authorize(['ceo:dashboard']), HRController.getSuccessionPipeline);
router.get('/hr/dei', authenticate, authorize(['ceo:dashboard']), HRController.getDEIMetrics);
router.get('/board/meetings', authenticate, authorize(['ceo:dashboard']), BoardController.getBoardMeetings);
router.post('/board/meetings', authenticate, authorize(['ceo:dashboard']), BoardController.createBoardMeeting);
router.get('/board/:meetingId', authenticate, authorize(['ceo:dashboard']), BoardController.getBoardPack);
router.get('/board/shareholders', authenticate, authorize(['ceo:dashboard']), BoardController.getShareholderRegistry);
router.post('/board/shareholders', authenticate, authorize(['ceo:dashboard']), BoardController.createShareholder);
router.get('/board/dividends', authenticate, authorize(['ceo:dashboard']), BoardController.getDividendStatus);
router.get('/board/resolutions', authenticate, authorize(['ceo:dashboard']), BoardController.getBoardResolutions);
router.post('/board/resolutions', authenticate, authorize(['ceo:dashboard']), BoardController.createBoardResolution);
router.put('/board/meetings/:id', authenticate, authorize(['ceo:dashboard']), BoardController.updateBoardMeeting);
router.delete('/board/meetings/:id', authenticate, authorize(['ceo:dashboard']), BoardController.deleteBoardMeeting);
router.put('/board/shareholders/:id', authenticate, authorize(['ceo:dashboard']), BoardController.updateShareholder);
router.delete('/board/shareholders/:id', authenticate, authorize(['ceo:dashboard']), BoardController.deleteShareholder);
router.put('/board/resolutions/:id', authenticate, authorize(['ceo:dashboard']), BoardController.updateBoardResolution);
router.delete('/board/resolutions/:id', authenticate, authorize(['ceo:dashboard']), BoardController.deleteBoardResolution);
router.get('/risk/register', authenticate, authorize(['ceo:dashboard']), RiskController.getRiskRegister);
router.get('/risk/compliance', authenticate, authorize(['ceo:dashboard']), RiskController.getComplianceStatus);
router.get('/risk/regulatory', authenticate, authorize(['ceo:dashboard']), RiskController.getRegulatoryCalendar);
router.get('/risk/esg', authenticate, authorize(['ceo:dashboard']), RiskController.getESGSummary);
router.get('/risk/cybersecurity', authenticate, authorize(['ceo:dashboard']), RiskController.getCybersecurityPosture);
router.post('/risk/register', authenticate, authorize(['ceo:dashboard']), RiskController.createRisk);
router.put('/risk/register/:id', authenticate, authorize(['ceo:dashboard']), RiskController.updateRisk);
router.delete('/risk/register/:id', authenticate, authorize(['ceo:dashboard']), RiskController.deleteRisk);
router.post('/risk/compliance', authenticate, authorize(['ceo:dashboard']), RiskController.createComplianceItem);
router.put('/risk/compliance/:id', authenticate, authorize(['ceo:dashboard']), RiskController.updateComplianceItem);
router.delete('/risk/compliance/:id', authenticate, authorize(['ceo:dashboard']), RiskController.deleteComplianceItem);
router.post('/risk/regulatory', authenticate, authorize(['ceo:dashboard']), RiskController.createRegulatoryItem);
router.put('/risk/regulatory/:id', authenticate, authorize(['ceo:dashboard']), RiskController.updateRegulatoryItem);
router.delete('/risk/regulatory/:id', authenticate, authorize(['ceo:dashboard']), RiskController.deleteRegulatoryItem);
router.post('/risk/esg', authenticate, authorize(['ceo:dashboard']), RiskController.createESGMetric);
router.put('/risk/esg/:id', authenticate, authorize(['ceo:dashboard']), RiskController.updateESGMetric);
router.delete('/risk/esg/:id', authenticate, authorize(['ceo:dashboard']), RiskController.deleteESGMetric);
router.post('/risk/cybersecurity', authenticate, authorize(['ceo:dashboard']), RiskController.createCyberControl);
router.put('/risk/cybersecurity/:id', authenticate, authorize(['ceo:dashboard']), RiskController.updateCyberControl);
router.delete('/risk/cybersecurity/:id', authenticate, authorize(['ceo:dashboard']), RiskController.deleteCyberControl);
router.get('/crisis/status', authenticate, authorize(['ceo:dashboard']), CrisisController.getCrisisStatus);
router.post('/crisis/activate', authenticate, authorize(['ceo:dashboard']), CrisisController.activateCrisisMode);
router.post('/crisis/deactivate', authenticate, authorize(['ceo:dashboard']), CrisisController.deactivateCrisisMode);
router.get('/crisis/actions', authenticate, authorize(['ceo:dashboard']), CrisisController.getEmergencyActions);
router.post('/crisis/actions', authenticate, authorize(['ceo:dashboard']), CrisisController.createEmergencyAction);
router.put('/crisis/actions/:id', authenticate, authorize(['ceo:dashboard']), CrisisController.updateEmergencyAction);
router.delete('/crisis/actions/:id', authenticate, authorize(['ceo:dashboard']), CrisisController.deleteEmergencyAction);
router.get('/crisis/fast-track', authenticate, authorize(['ceo:dashboard']), CrisisController.getFastTrackApprovals);
router.post('/crisis/fast-track', authenticate, authorize(['ceo:dashboard']), CrisisController.fastTrackApproval);
router.post('/crisis/fast-track/:id/approve', authenticate, authorize(['ceo:dashboard']), CrisisController.approveFastTrack);
router.post('/crisis/fast-track/:id/reject', authenticate, authorize(['ceo:dashboard']), CrisisController.rejectFastTrack);

// ================================================================
// FINANCIAL REPORT APPROVALS (CEO → Board)
// ================================================================
router.get('/report-approvals/pending-ceo', authenticate, authorize(['ceo:reports']), ReportSubmissionController.getPendingCEO);
router.post('/report-approvals/:id/ceo-approve', authenticate, authorize(['ceo:reports']),
  body('comment').optional().isString(), validate, ReportSubmissionController.ceoApprove
);
router.get('/report-approvals/pending-board', authenticate, authorize(['ceo:reports']), ReportSubmissionController.getPendingBoard);
router.post('/report-approvals/:id/board-approve', authenticate, authorize(['ceo:reports']),
  body('comment').optional().isString(), validate, ReportSubmissionController.boardApprove
);
router.post('/report-approvals/:id/reject', authenticate, authorize(['ceo:reports']),
  body('reason').notEmpty().isString().isLength({ min: 5 }), validate, ReportSubmissionController.reject
);
router.get('/report-approvals/all', authenticate, authorize(['ceo:reports']), ReportSubmissionController.getAllSubmissions);
router.get(
  '/activity',
  authenticate,
  authorize(['ceo:dashboard']),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validate,
  CEODashboardController.getActivityLog
);
router.get(
  '/pending-approvals',
  authenticate,
  authorize(['ceo:dashboard']),
  CEODashboardController.getPendingPOApprovals
);
router.post(
  '/approve/:id',
  authenticate,
  authorize(['ceo:dashboard']),
  CEODashboardController.approvePO
);
router.post(
  '/reject/:id',
  authenticate,
  authorize(['ceo:dashboard']),
  body('rejectionReason').notEmpty().withMessage('Rejection reason is required'),
  validate,
  CEODashboardController.rejectPO
);
router.get(
  '/pending-approvals-count',
  authenticate,
  authorize(['ceo:dashboard']),
  CEODashboardController.getPendingApprovalsCount
);
router.get(
  '/hr-summary',
  authenticate,
  authorize(['ceo:dashboard']),
  CEODashboardController.getHRSummary
);
router.get(
  '/daily-employees',
  authenticate,
  authorize(['ceo:dashboard']),
  CEODashboardController.getDailyEmployees
);
router.get(
  '/employee-attendance/:employeeId',
  authenticate,
  authorize(['ceo:dashboard']),
  CEODashboardController.getEmployeeMonthlyAttendance
);
module.exports = router;
