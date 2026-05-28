const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const AdminController = require('../controllers/admin.controller');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { limiters } = require('../../config/rateLimit');
router.get(
  '/dashboard/stats',
  authenticate,
  authorize(['admin:dashboard']),
  AdminController.getDashboardStats
);
router.get(
  '/system/health',
  authenticate,
  authorize(['admin:system']),
  AdminController.getSystemHealth
);
const auditLogValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).toInt(),
  query('userId')
    .optional()
    .isInt(),
  query('action')
    .optional()
    .isString(),
  query('resource')
    .optional()
    .isString(),
  query('startDate')
    .optional()
    .isISO8601(),
  query('endDate')
    .optional()
    .isISO8601(),
  query('search')
    .optional()
    .isString()
    .trim()
];
router.get(
  '/audit-logs',
  authenticate,
  authorize(['admin:audit']),
  auditLogValidation,
  validate,
  AdminController.getAuditLogs
);
router.get(
  '/audit-logs/:id',
  authenticate,
  authorize(['admin:audit']),
  param('id').isInt(),
  validate,
  AdminController.getAuditLogById
);
router.get(
  '/audit-logs/export',
  authenticate,
  authorize(['admin:audit', 'reports:export']),
  query('format').isIn(['csv', 'excel']),
  auditLogValidation,
  validate,
  AdminController.exportAuditLogs
);
const updateSettingsValidation = [
  body('settings')
    .isArray().withMessage('Settings must be an array'),
  body('settings.*.key')
    .notEmpty().withMessage('Setting key is required'),
  body('settings.*.value')
    .notEmpty().withMessage('Setting value is required')
];
router.get(
  '/settings',
  authenticate,
  authorize(['admin:settings']),
  AdminController.getSettings
);
router.get(
  '/settings/:category',
  authenticate,
  authorize(['admin:settings']),
  param('category').isIn(['General', 'Business Rules', 'Security', 'Integration']),
  validate,
  AdminController.getSettingsByCategory
);
router.put(
  '/settings',
  authenticate,
  authorize(['admin:settings']),
  updateSettingsValidation,
  validate,
  AdminController.updateSettings
);
router.put(
  '/settings/:key',
  authenticate,
  authorize(['admin:settings']),
  param('key').isString(),
  body('value').notEmpty(),
  validate,
  AdminController.updateSingleSetting
);
router.post(
  '/settings/reset',
  authenticate,
  authorize(['admin:settings']),
  AdminController.resetSettings
);
router.get(
  '/backups',
  authenticate,
  authorize(['admin:backup']),
  AdminController.listBackups
);
router.post(
  '/backups',
  authenticate,
  authorize(['admin:backup']),
  limiters.checkout,
  AdminController.createBackup
);
router.post(
  '/backups/restore/:backupId',
  authenticate,
  authorize(['admin:backup']),
  param('backupId').isString(),
  body('confirm').equals('RESTORE').withMessage('Type "RESTORE" to confirm'),
  validate,
  AdminController.restoreBackup
);
router.delete(
  '/backups/:backupId',
  authenticate,
  authorize(['admin:backup']),
  param('backupId').isString(),
  validate,
  AdminController.deleteBackup
);
router.post(
  '/backups/configure',
  authenticate,
  authorize(['admin:backup']),
  body('enabled').isBoolean(),
  body('frequencyHours').isInt({ min: 1, max: 24 }),
  body('retentionDays').isInt({ min: 7, max: 365 }),
  body('cloudUpload').isBoolean(),
  validate,
  AdminController.configureBackup
);
router.post(
  '/maintenance/clear-cache',
  authenticate,
  authorize(['admin:maintenance']),
  AdminController.clearCache
);
router.post(
  '/maintenance/clear-logs',
  authenticate,
  authorize(['admin:maintenance']),
  body('daysOld').optional().isInt({ min: 1, max: 365 }),
  validate,
  AdminController.clearLogs
);
router.get(
  '/maintenance/info',
  authenticate,
  authorize(['admin:maintenance']),
  AdminController.getMaintenanceInfo
);
router.get(
  '/statistics/users',
  authenticate,
  authorize(['admin:statistics']),
  AdminController.getUserStatistics
);
router.get(
  '/statistics/activity',
  authenticate,
  authorize(['admin:statistics']),
  query('days').optional().isInt({ min: 1, max: 90 }),
  validate,
  AdminController.getActivityStatistics
);
router.get(
  '/statistics/performance',
  authenticate,
  authorize(['admin:statistics']),
  AdminController.getPerformanceMetrics
);
router.post(
  '/database/optimize',
  authenticate,
  authorize(['admin:database']),
  AdminController.optimizeDatabase
);
router.get(
  '/database/status',
  authenticate,
  authorize(['admin:database']),
  AdminController.getDatabaseStatus
);
module.exports = router;
