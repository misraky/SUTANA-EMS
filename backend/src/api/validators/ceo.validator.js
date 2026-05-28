const { body, query, param } = require('express-validator');
const getRevenueMetricsValidation = [
  query('period')
    .optional()
    .isIn(['today', 'week', 'month', 'quarter', 'year'])
    .withMessage('Period must be today, week, month, quarter, or year')
];
const getRevenueBreakdownValidation = [
  query('period')
    .optional()
    .isIn(['today', 'week', 'month', 'quarter', 'year'])
    .withMessage('Period must be today, week, month, quarter, or year')
];
const getRevenueForecastValidation = [
  query('months')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Months must be between 1 and 12')
    .toInt()
];
const getProfitMetricsValidation = [
  query('period')
    .optional()
    .isIn(['month', 'quarter', 'year'])
    .withMessage('Period must be month, quarter, or year')
];
const getProfitMarginTrendsValidation = [
  query('months')
    .optional()
    .isInt({ min: 1, max: 24 })
    .withMessage('Months must be between 1 and 24')
    .toInt()
];
const getCashFlowValidation = [
  query('period')
    .optional()
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Period must be daily, weekly, or monthly'),
  query('days')
    .optional()
    .isInt({ min: 7, max: 90 })
    .withMessage('Days must be between 7 and 90')
    .toInt()
];
const getCashFlowProjectionValidation = [
  query('months')
    .optional()
    .isInt({ min: 1, max: 6 })
    .withMessage('Months must be between 1 and 6')
    .toInt()
];
const getKPIsValidation = [
  query('period')
    .optional()
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Period must be daily, weekly, or monthly')
];
const getSalesTargetPerformanceValidation = [
];
const getFulfillmentMetricsValidation = [
];
const getInventoryTurnoverValidation = [
];
const getCustomerSatisfactionValidation = [
];
const getTargetsValidation = [
];
const updateTargetsValidation = [
  body('dailySalesTarget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Daily sales target must be a positive number'),
  body('monthlySalesTarget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Monthly sales target must be a positive number'),
  body('fulfillmentHoursTarget')
    .optional()
    .isInt({ min: 1, max: 168 })
    .withMessage('Fulfillment hours target must be between 1 and 168'),
  body('inventoryTurnoverTarget')
    .optional()
    .isFloat({ min: 0, max: 24 })
    .withMessage('Inventory turnover target must be between 0 and 24'),
  body('customerSatisfactionTarget')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Customer satisfaction target must be between 0 and 100'),
  body('profitMarginTarget')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Profit margin target must be between 0 and 100'),
  body('quarterlyRevenueTarget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Quarterly revenue target must be a positive number'),
  body('yearlyRevenueTarget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Yearly revenue target must be a positive number')
];
const resetTargetsValidation = [
  body('confirm')
    .optional()
    .equals('RESET')
    .withMessage('Type "RESET" to confirm')
];
const getCriticalAlertsValidation = [
  query('severity')
    .optional()
    .isIn(['info', 'warning', 'critical'])
    .withMessage('Severity must be info, warning, or critical')
];
const dismissAlertValidation = [
  param('alertId')
    .notEmpty()
    .withMessage('Alert ID is required')
    .isString()
    .trim()
];
const getAlertHistoryValidation = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 90 })
    .withMessage('Days must be between 1 and 90')
    .toInt(),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt()
];
const comparePeriodsValidation = [
  query('currentPeriod')
    .notEmpty()
    .withMessage('Current period is required')
    .isIn(['today', 'yesterday', 'week', 'lastWeek', 'month', 'lastMonth', 'quarter', 'lastQuarter', 'year', 'lastYear'])
    .withMessage('Invalid current period'),
  query('previousPeriod')
    .notEmpty()
    .withMessage('Previous period is required')
    .isIn(['today', 'yesterday', 'week', 'lastWeek', 'month', 'lastMonth', 'quarter', 'lastQuarter', 'year', 'lastYear'])
    .withMessage('Invalid previous period'),
  query('metrics')
    .optional()
    .isString()
    .withMessage('Metrics must be a comma-separated string')
];
const compareSectorsValidation = [
  query('metric')
    .optional()
    .isIn(['revenue', 'profit', 'orders', 'customers'])
    .withMessage('Metric must be revenue, profit, orders, or customers'),
  query('period')
    .optional()
    .isIn(['month', 'quarter', 'year'])
    .withMessage('Period must be month, quarter, or year')
];
const getMonthlyReportValidation = [
  query('year')
    .notEmpty()
    .withMessage('Year is required')
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Year must be between 2020 and 2030')
    .toInt(),
  query('month')
    .notEmpty()
    .withMessage('Month is required')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12')
    .toInt(),
  query('format')
    .optional()
    .isIn(['json', 'pdf'])
    .withMessage('Format must be json or pdf')
];
const getQuarterlyReportValidation = [
  query('year')
    .notEmpty()
    .withMessage('Year is required')
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Year must be between 2020 and 2030')
    .toInt(),
  query('quarter')
    .notEmpty()
    .withMessage('Quarter is required')
    .isInt({ min: 1, max: 4 })
    .withMessage('Quarter must be between 1 and 4')
    .toInt(),
  query('format')
    .optional()
    .isIn(['json', 'pdf'])
    .withMessage('Format must be json or pdf')
];
const getYearlyReportValidation = [
  query('year')
    .notEmpty()
    .withMessage('Year is required')
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Year must be between 2020 and 2030')
    .toInt(),
  query('format')
    .optional()
    .isIn(['json', 'pdf'])
    .withMessage('Format must be json or pdf')
];
module.exports = {
  getRevenueMetricsValidation,
  getRevenueBreakdownValidation,
  getRevenueForecastValidation,
  getProfitMetricsValidation,
  getProfitMarginTrendsValidation,
  getCashFlowValidation,
  getCashFlowProjectionValidation,
  getKPIsValidation,
  getSalesTargetPerformanceValidation,
  getFulfillmentMetricsValidation,
  getInventoryTurnoverValidation,
  getCustomerSatisfactionValidation,
  getTargetsValidation,
  updateTargetsValidation,
  resetTargetsValidation,
  getCriticalAlertsValidation,
  dismissAlertValidation,
  getAlertHistoryValidation,
  comparePeriodsValidation,
  compareSectorsValidation,
  getMonthlyReportValidation,
  getQuarterlyReportValidation,
  getYearlyReportValidation
};
