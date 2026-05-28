const { body, query, param } = require('express-validator');
const dateRangeValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format. Use YYYY-MM-DD'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format. Use YYYY-MM-DD')
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
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage('Limit must be between 1 and 500')
    .toInt()
];
const exportFormatValidation = [
  query('format')
    .isIn(['pdf', 'excel', 'csv'])
    .withMessage('Format must be pdf, excel, or csv')
];
const dailySalesReportValidation = [
  query('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format. Use YYYY-MM-DD')
];
const weeklySalesReportValidation = [
  query('weekStart')
    .optional()
    .isISO8601()
    .withMessage('Invalid week start date format')
];
const monthlySalesReportValidation = [
  query('year')
    .optional()
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Year must be between 2020 and 2030')
    .toInt(),
  query('month')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12')
    .toInt()
];
const salesByPeriodValidation = [
  ...dateRangeValidation,
  query('groupBy')
    .optional()
    .isIn(['day', 'week', 'month'])
    .withMessage('Group by must be day, week, or month'),
  query('sectorId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Sector ID must be a valid integer')
    .toInt()
];
const salesByProductValidation = [
  ...dateRangeValidation,
  ...paginationValidation,
  query('productId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Product ID must be a valid integer')
    .toInt()
];
const salesByCustomerValidation = [
  ...dateRangeValidation,
  ...paginationValidation,
  query('customerId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Customer ID must be a valid integer')
    .toInt()
];
const printingOrdersReportValidation = [
  ...dateRangeValidation,
  ...paginationValidation,
  query('status')
    .optional()
    .isIn(['Received', 'In Progress', 'Quality Check', 'Ready', 'Delivered'])
    .withMessage('Invalid status'),
  query('customerTypeId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Customer type ID must be a valid integer')
    .toInt()
];
const printingRevenueReportValidation = [
  ...dateRangeValidation,
  query('groupBy')
    .optional()
    .isIn(['day', 'week', 'month'])
    .withMessage('Group by must be day, week, or month')
];
const taxReceiptReportValidation = [
  ...dateRangeValidation,
  ...paginationValidation
];
const lowStockReportValidation = [
  query('thresholdPercent')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Threshold percentage must be between 0 and 100')
    .toInt()
];
const expiringProductsReportValidation = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365')
    .toInt()
];
const inventoryMovementReportValidation = [
  ...dateRangeValidation,
  ...paginationValidation,
  query('productId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Product ID must be a valid integer')
    .toInt(),
  query('transactionType')
    .optional()
    .isIn(['Sale', 'Purchase', 'Adjustment', 'Damaged', 'Lost', 'Expired'])
    .withMessage('Invalid transaction type')
];
const inventoryValuationReportValidation = [
  query('asOfDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format. Use YYYY-MM-DD')
];
const profitAndLossValidation = [
  ...dateRangeValidation,
  query('sectorId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Sector ID must be a valid integer')
    .toInt()
];
const balanceSheetValidation = [
  query('asOfDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format. Use YYYY-MM-DD')
];
const cashFlowValidation = [
  ...dateRangeValidation
];
const expensesReportValidation = [
  ...dateRangeValidation,
  ...paginationValidation,
  query('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a valid integer')
    .toInt()
];
const taxSummaryReportValidation = [
  ...dateRangeValidation
];
const executiveSummaryValidation = [
  query('period')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'])
    .withMessage('Period must be daily, weekly, monthly, quarterly, or yearly')
];
const kpiReportValidation = [
  query('period')
    .optional()
    .isIn(['month', 'quarter', 'year'])
    .withMessage('Period must be month, quarter, or year')
];
const trendsReportValidation = [
  query('metrics')
    .optional()
    .isString()
    .withMessage('Metrics must be a comma-separated string'),
  query('months')
    .optional()
    .isInt({ min: 1, max: 36 })
    .withMessage('Months must be between 1 and 36')
    .toInt()
];
const exportReportValidation = [
  param('reportType')
    .isIn(['sales', 'inventory', 'pnl', 'balance-sheet', 'expenses', 'tax-audit'])
    .withMessage('Invalid report type'),
  ...exportFormatValidation,
  ...dateRangeValidation
];
const scheduleReportValidation = [
  body('reportType')
    .notEmpty()
    .withMessage('Report type is required')
    .isIn(['sales', 'inventory', 'pnl'])
    .withMessage('Invalid report type'),
  body('frequency')
    .notEmpty()
    .withMessage('Frequency is required')
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Frequency must be daily, weekly, or monthly'),
  body('recipients')
    .isArray({ min: 1 })
    .withMessage('At least one recipient is required'),
  body('recipients.*')
    .isEmail()
    .withMessage('Invalid email address'),
  body('format')
    .optional()
    .isIn(['pdf', 'excel', 'csv'])
    .withMessage('Format must be pdf, excel, or csv')
];
const cancelScheduledReportValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Schedule ID must be a valid positive integer')
    .toInt()
];
module.exports = {
  dateRangeValidation,
  paginationValidation,
  exportFormatValidation,
  dailySalesReportValidation,
  weeklySalesReportValidation,
  monthlySalesReportValidation,
  salesByPeriodValidation,
  salesByProductValidation,
  salesByCustomerValidation,
  printingOrdersReportValidation,
  printingRevenueReportValidation,
  taxReceiptReportValidation,
  lowStockReportValidation,
  expiringProductsReportValidation,
  inventoryMovementReportValidation,
  inventoryValuationReportValidation,
  profitAndLossValidation,
  balanceSheetValidation,
  cashFlowValidation,
  expensesReportValidation,
  taxSummaryReportValidation,
  executiveSummaryValidation,
  kpiReportValidation,
  trendsReportValidation,
  exportReportValidation,
  scheduleReportValidation,
  cancelScheduledReportValidation
};
