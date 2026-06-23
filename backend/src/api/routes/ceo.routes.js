const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const CEODashboardController = require('../controllers/ceo.controller');
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
