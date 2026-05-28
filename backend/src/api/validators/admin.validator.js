const { body, query, param } = require('express-validator');
const listAuditLogsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  query('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('User ID must be a valid integer')
    .toInt(),
  query('action')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Action must not be empty'),
  query('resource')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Resource must not be empty'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format. Use YYYY-MM-DD'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format. Use YYYY-MM-DD'),
  query('search')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Search query must be at least 1 character')
];
const getAuditLogByIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Audit log ID must be a valid positive integer')
    .toInt()
];
const exportAuditLogsValidation = [
  query('format')
    .isIn(['csv', 'excel'])
    .withMessage('Format must be csv or excel'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format')
];
const getSettingsByCategoryValidation = [
  param('category')
    .isIn(['General', 'Business Rules', 'Security', 'Integration'])
    .withMessage('Category must be General, Business Rules, Security, or Integration')
];
const updateSettingsValidation = [
  body('settings')
    .isArray({ min: 1 })
    .withMessage('Settings must be an array with at least one item'),
  body('settings.*.key')
    .notEmpty()
    .withMessage('Setting key is required')
    .isString()
    .trim(),
  body('settings.*.value')
    .notEmpty()
    .withMessage('Setting value is required')
    .isString()
    .trim()
];
const updateSingleSettingValidation = [
  param('key')
    .notEmpty()
    .withMessage('Setting key is required')
    .isString()
    .trim(),
  body('value')
    .notEmpty()
    .withMessage('Setting value is required')
    .isString()
    .trim()
];
const resetSettingsValidation = [
  body('confirm')
    .optional()
    .equals('RESET')
    .withMessage('Type "RESET" to confirm')
];
const restoreBackupValidation = [
  param('backupId')
    .notEmpty()
    .withMessage('Backup ID is required')
    .isString()
    .trim(),
  body('confirm')
    .notEmpty()
    .withMessage('Confirmation is required')
    .equals('RESTORE')
    .withMessage('Type "RESTORE" to confirm')
];
const deleteBackupValidation = [
  param('backupId')
    .notEmpty()
    .withMessage('Backup ID is required')
    .isString()
    .trim()
];
const configureBackupValidation = [
  body('enabled')
    .isBoolean()
    .withMessage('enabled must be true or false')
    .toBoolean(),
  body('frequencyHours')
    .isInt({ min: 1, max: 24 })
    .withMessage('Frequency hours must be between 1 and 24')
    .toInt(),
  body('retentionDays')
    .isInt({ min: 7, max: 365 })
    .withMessage('Retention days must be between 7 and 365')
    .toInt(),
  body('cloudUpload')
    .isBoolean()
    .withMessage('cloudUpload must be true or false')
    .toBoolean()
];
const clearLogsValidation = [
  body('daysOld')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days old must be between 1 and 365')
    .toInt()
];
const getActivityStatisticsValidation = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 90 })
    .withMessage('Days must be between 1 and 90')
    .toInt()
];
const optimizeDatabaseValidation = [
  body('confirm')
    .optional()
    .equals('OPTIMIZE')
    .withMessage('Type "OPTIMIZE" to confirm')
];
const systemHealthValidation = [
];
const getMaintenanceInfoValidation = [
];
const getUserStatisticsValidation = [
];
const getPerformanceMetricsValidation = [
];
const getDatabaseStatusValidation = [
];
module.exports = {
  listAuditLogsValidation,
  getAuditLogByIdValidation,
  exportAuditLogsValidation,
  getSettingsByCategoryValidation,
  updateSettingsValidation,
  updateSingleSettingValidation,
  resetSettingsValidation,
  restoreBackupValidation,
  deleteBackupValidation,
  configureBackupValidation,
  clearLogsValidation,
  getActivityStatisticsValidation,
  optimizeDatabaseValidation,
  systemHealthValidation,
  getMaintenanceInfoValidation,
  getUserStatisticsValidation,
  getPerformanceMetricsValidation,
  getDatabaseStatusValidation
};
