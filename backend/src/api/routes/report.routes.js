const express = require('express');
const router = express.Router();
const { query, param } = require('express-validator');
const ReportController = require('../controllers/report.controller');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { limiters } = require('../../config/rateLimit');
const dateRangeValidation = [
  query('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date format')
    .custom((endDate, { req }) => {
      if (req.query.startDate && endDate) {
        const start = new Date(req.query.startDate);
        const end = new Date(endDate);
        if (end < start) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    })
];
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 500 }).withMessage('Limit must be between 1 and 500')
    .toInt()
];
const exportValidation = [
  query('format')
    .isIn(['pdf', 'excel', 'csv']).withMessage('Format must be pdf, excel, or csv'),
  query('startDate')
    .optional()
    .isISO8601(),
  query('endDate')
    .optional()
    .isISO8601()
];
router.get(
  '/sales/daily',
  authenticate,
  authorize(['reports:read']),
  query('date').optional().isISO8601(),
  validate,
  ReportController.getDailySalesReport
);
router.get(
  '/sales/weekly',
  authenticate,
  authorize(['reports:read']),
  query('weekStart').optional().isISO8601(),
  validate,
  ReportController.getWeeklySalesReport
);
router.get(
  '/sales/monthly',
  authenticate,
  authorize(['reports:read']),
  query('year').optional().isInt({ min: 2020, max: 2030 }),
  query('month').optional().isInt({ min: 1, max: 12 }),
  validate,
  ReportController.getMonthlySalesReport
);
router.get(
  '/sales/by-period',
  authenticate,
  authorize(['reports:read']),
  dateRangeValidation,
  query('groupBy').optional().isIn(['day', 'week', 'month']),
  query('sectorId').optional().isInt(),
  validate,
  ReportController.getSalesByPeriod
);
router.get(
  '/sales/by-product',
  authenticate,
  authorize(['reports:read']),
  dateRangeValidation,
  paginationValidation,
  query('productId').optional().isInt(),
  validate,
  ReportController.getSalesByProduct
);
router.get(
  '/sales/by-customer',
  authenticate,
  authorize(['reports:read']),
  dateRangeValidation,
  paginationValidation,
  query('customerId').optional().isInt(),
  validate,
  ReportController.getSalesByCustomer
);
router.get(
  '/printing/orders',
  authenticate,
  authorize(['reports:read']),
  dateRangeValidation,
  paginationValidation,
  query('status').optional().isIn(['Received', 'In Progress', 'Quality Check', 'Ready', 'Delivered']),
  query('customerTypeId').optional().isInt(),
  validate,
  ReportController.getPrintingOrdersReport
);
router.get(
  '/printing/revenue',
  authenticate,
  authorize(['reports:read']),
  dateRangeValidation,
  query('groupBy').optional().isIn(['day', 'week', 'month']),
  validate,
  ReportController.getPrintingRevenueReport
);
router.get(
  '/printing/tax-receipts',
  authenticate,
  authorize(['reports:read']),
  dateRangeValidation,
  paginationValidation,
  validate,
  ReportController.getTaxReceiptReport
);
router.get(
  '/inventory/low-stock',
  authenticate,
  authorize(['inventory:read']),
  query('thresholdPercent').optional().isInt({ min: 0, max: 100 }),
  validate,
  ReportController.getLowStockReport
);
router.get(
  '/inventory/expiring',
  authenticate,
  authorize(['inventory:read']),
  query('days').optional().isInt({ min: 1, max: 365 }).toInt(),
  validate,
  ReportController.getExpiringProductsReport
);
router.get(
  '/inventory/movements',
  authenticate,
  authorize(['inventory:read']),
  dateRangeValidation,
  paginationValidation,
  query('productId').optional().isInt(),
  query('transactionType').optional().isIn(['Sale', 'Purchase', 'Adjustment', 'Damaged', 'Lost', 'Expired']),
  validate,
  ReportController.getInventoryMovementReport
);
router.get(
  '/inventory/valuation',
  authenticate,
  authorize(['reports:read']),
  query('asOfDate').optional().isISO8601(),
  validate,
  ReportController.getInventoryValuationReport
);
router.get(
  '/finance/pnl',
  authenticate,
  authorize(['reports:read']),
  dateRangeValidation,
  query('sectorId').optional().isInt(),
  validate,
  ReportController.getProfitAndLoss
);
router.get(
  '/finance/balance-sheet',
  authenticate,
  authorize(['reports:read']),
  query('asOfDate').optional().isISO8601(),
  validate,
  ReportController.getBalanceSheet
);
router.get(
  '/finance/cash-flow',
  authenticate,
  authorize(['reports:read']),
  dateRangeValidation,
  validate,
  ReportController.getCashFlow
);
router.get(
  '/finance/expenses',
  authenticate,
  authorize(['reports:read']),
  dateRangeValidation,
  paginationValidation,
  query('categoryId').optional().isInt(),
  validate,
  ReportController.getExpensesReport
);
router.get(
  '/finance/tax',
  authenticate,
  authorize(['reports:read']),
  dateRangeValidation,
  validate,
  ReportController.getTaxSummaryReport
);
router.get(
  '/executive/summary',
  authenticate,
  authorize(['reports:read']),
  query('period').optional().isIn(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
  validate,
  ReportController.getExecutiveSummary
);
router.get(
  '/executive/kpis',
  authenticate,
  authorize(['reports:read']),
  query('period').optional().isIn(['month', 'quarter', 'year']),
  validate,
  ReportController.getKPIReport
);
router.get(
  '/executive/trends',
  authenticate,
  authorize(['reports:read']),
  query('metrics').optional().isString(),
  query('months').optional().isInt({ min: 1, max: 36 }),
  validate,
  ReportController.getTrendsReport
);
router.get(
  '/export/:reportType',
  authenticate,
  authorize(['reports:export']),
  param('reportType').isIn(['sales', 'inventory', 'pnl', 'balance-sheet', 'expenses', 'tax-audit']),
  exportValidation,
  dateRangeValidation,
  validate,
  limiters.report,
  ReportController.exportReport
);
router.post(
  '/schedule',
  authenticate,
  authorize(['reports:schedule']),
  query('reportType').isIn(['sales', 'inventory', 'pnl']),
  query('frequency').isIn(['daily', 'weekly', 'monthly']),
  query('recipients').isArray(),
  validate,
  ReportController.scheduleReport
);
router.get(
  '/scheduled',
  authenticate,
  authorize(['reports:read']),
  ReportController.getScheduledReports
);
router.delete(
  '/schedule/:id',
  authenticate,
  authorize(['reports:schedule']),
  param('id').isInt(),
  validate,
  ReportController.cancelScheduledReport
);
module.exports = router;
