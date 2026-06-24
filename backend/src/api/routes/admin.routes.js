const express = require('express');
const router = express.Router();
const { body, query, param, header } = require('express-validator');
const AdminController = require('../controllers/admin.controller');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { limiters } = require('../../config/rateLimit');

const auditLogValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('userId').optional().isInt(),
  query('action').optional().isString(),
  query('resource').optional().isString(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('search').optional().isString().trim()
];
const updateSettingsValidation = [
  body('settings').isArray().withMessage('Settings must be an array'),
  body('settings.*.key').notEmpty().withMessage('Setting key is required'),
  body('settings.*.value').notEmpty().withMessage('Setting value is required')
];

/* ════════════════════════════════════════════════
   DIMENSION 1 — TIERED ADMIN ROLES
   ════════════════════════════════════════════════ */
router.get('/tiers', authenticate, authorize(['admin:roles']), AdminController.getAdminTiers);
router.post('/tiers/assign', authenticate, authorize(['admin:roles']),
  body('userId').isInt(), body('tier').isIn(['L1', 'L2', 'L3', 'L4']), validate,
  AdminController.assignAdminTier
);
router.get('/tiers/coverage', authenticate, authorize(['admin:roles']), AdminController.getAdminCoverage);

/* ════════════════════════════════════════════════
   DIMENSION 2 — PAM (JIT / BREAK-GLASS)
   ════════════════════════════════════════════════ */
router.post('/pam/elevate', authenticate, authorize(['admin:elevation']),
  body('tier').isIn(['L1', 'L2', 'L3', 'L4']),
  body('duration').isInt({ min: 15, max: 480 }),
  body('reason').isString().isLength({ min: 20 }),
  body('ticketRef').isString(),
  validate,
  AdminController.requestElevation
);
router.get('/pam/elevations', authenticate, authorize(['admin:pam']), AdminController.getActiveElevations);
router.post('/pam/elevations/:id/approve', authenticate, authorize(['admin:pam']),
  param('id').isInt(), validate, AdminController.approveElevation
);
router.post('/pam/elevations/:id/revoke', authenticate, authorize(['admin:pam']),
  param('id').isInt(), validate, AdminController.revokeElevation
);
router.get('/pam/history', authenticate, authorize(['admin:pam']), AdminController.getElevationHistory);
router.post('/pam/break-glass/activate', authenticate, authorize(['admin:system']),
  body('reason').isString().isLength({ min: 20 }),
  body('coApproverId').isInt(),
  validate,
  AdminController.activateBreakGlass
);
router.post('/pam/break-glass/deactivate', authenticate, authorize(['admin:system']),
  AdminController.deactivateBreakGlass
);
router.get('/pam/break-glass/status', authenticate, AdminController.getBreakGlassStatus);

/* ════════════════════════════════════════════════
   DIMENSION 3 — SoD COMPLIANCE
   ════════════════════════════════════════════════ */
router.get('/sod/rules', authenticate, authorize(['admin:sod-config']), AdminController.getSodRules);
router.post('/sod/rules', authenticate, authorize(['admin:sod-config']),
  body('functionA').isString(), body('functionB').isString(),
  body('severity').isIn(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  body('description').isString(), validate,
  AdminController.createSodRule
);
router.put('/sod/rules/:id', authenticate, authorize(['admin:sod-config']), AdminController.updateSodRule);
router.delete('/sod/rules/:id', authenticate, authorize(['admin:sod-config']), AdminController.deleteSodRule);
router.get('/sod/violations', authenticate, authorize(['admin:roles']), AdminController.getSodViolations);
router.post('/sod/violations/:id/remediate', authenticate, authorize(['admin:roles']),
  body('action').isIn(['remove_role', 'mitigate', 'accept']),
  body('notes').optional().isString(), validate,
  AdminController.remediateSodViolation
);
router.get('/sod/check', authenticate, authorize(['admin:roles']),
  query('roleIds').isString(), validate,
  AdminController.checkSodAssignment
);

/* ════════════════════════════════════════════════
   DIMENSION 4 — ACCESS CERTIFICATION
   ════════════════════════════════════════════════ */
router.get('/certifications', authenticate, authorize(['admin:access-reviews']), AdminController.getCertificationList);
router.post('/certifications', authenticate, authorize(['admin:access-reviews']),
  body('type').isIn(['user_access', 'admin_privilege', 'role_entitlement', 'sod_review', 'dormant_account', 'service_account']),
  body('dueDate').isISO8601(), body('ownerId').isInt(), validate,
  AdminController.createCertification
);
router.get('/certifications/:id', authenticate, authorize(['admin:access-reviews']), AdminController.getCertificationById);
router.post('/certifications/:id/review/:userId', authenticate, authorize(['admin:access-reviews']),
  param('id').isInt(), param('userId').isInt(),
  body('action').isIn(['confirm', 'modify', 'revoke', 'flag']),
  body('notes').optional().isString(), validate,
  AdminController.performCertificationReview
);
router.post('/certifications/:id/complete', authenticate, authorize(['admin:access-reviews']),
  AdminController.completeCertification
);
router.get('/certifications/evidence/:id', authenticate, authorize(['admin:compliance']),
  AdminController.generateEvidencePackage
);
router.get('/dormant-accounts', authenticate, authorize(['admin:access-reviews']), AdminController.getDormantAccounts);
router.post('/dormant-accounts/:id/disable', authenticate, authorize(['admin:access-reviews']),
  AdminController.disableDormantAccount
);

/* ════════════════════════════════════════════════
   DIMENSION 5 — SESSION RECORDING
   ════════════════════════════════════════════════ */
router.get('/sessions/active', authenticate, authorize(['admin:session-mgmt']), AdminController.getActiveAdminSessions);
router.get('/sessions/history', authenticate, authorize(['admin:session-mgmt']), AdminController.getSessionHistory);
router.get('/sessions/:id', authenticate, authorize(['admin:audit']), AdminController.getSessionDetail);
router.post('/sessions/:id/terminate', authenticate, authorize(['admin:session-mgmt']),
  param('id').isString(), body('reason').isString(), validate,
  AdminController.terminateSession
);
router.get('/sessions/anomalies', authenticate, authorize(['admin:audit']), AdminController.getSessionAnomalies);

/* ════════════════════════════════════════════════
   DIMENSION 6 — ROLE DESIGNER
   ════════════════════════════════════════════════ */
router.get('/roles/single', authenticate, authorize(['admin:role-designer']), AdminController.getSingleRoles);
router.post('/roles/single', authenticate, authorize(['admin:role-designer']),
  body('name').isString(), body('module').isString(),
  body('function').isString(), body('scope').isString(),
  body('permissions').isArray(), validate,
  AdminController.createSingleRole
);
router.put('/roles/single/:id', authenticate, authorize(['admin:role-designer']), AdminController.updateSingleRole);
router.delete('/roles/single/:id', authenticate, authorize(['admin:role-designer']), AdminController.deleteSingleRole);
router.get('/roles/composite', authenticate, authorize(['admin:role-designer']), AdminController.getCompositeRoles);
router.post('/roles/composite', authenticate, authorize(['admin:role-designer']),
  body('name').isString(), body('description').isString(),
  body('singleRoleIds').isArray(), validate,
  AdminController.createCompositeRole
);
router.put('/roles/composite/:id', authenticate, authorize(['admin:role-designer']), AdminController.updateCompositeRole);
router.delete('/roles/composite/:id', authenticate, authorize(['admin:role-designer']), AdminController.deleteCompositeRole);
router.get('/roles/permission-matrix', authenticate, authorize(['admin:role-designer']), AdminController.getPermissionMatrix);

/* ════════════════════════════════════════════════
   DIMENSION 7 — SERVICE ACCOUNTS (NHI)
   ════════════════════════════════════════════════ */
router.get('/service-accounts', authenticate, authorize(['admin:service-accounts']), AdminController.getServiceAccounts);
router.post('/service-accounts', authenticate, authorize(['admin:service-accounts']),
  body('name').isString().matches(/^(svc-|bot-|api-)/),
  body('type').isIn(['API Key', 'System Account', 'OAuth Client', 'CI/CD', 'Bot']),
  body('scope').isString(), body('ownerId').isInt(),
  body('expirationDate').isISO8601(), body('ipWhitelist').optional().isString(), validate,
  AdminController.createServiceAccount
);
router.post('/service-accounts/:id/rotate', authenticate, authorize(['admin:service-accounts']),
  AdminController.rotateServiceAccountSecret
);
router.delete('/service-accounts/:id', authenticate, authorize(['admin:service-accounts']),
  AdminController.deleteServiceAccount
);

/* ════════════════════════════════════════════════
   DIMENSION 8 — FIELD-LEVEL SECURITY
   ════════════════════════════════════════════════ */
router.get('/field-security', authenticate, authorize(['admin:field-security']), AdminController.getFieldSecurityConfig);
router.put('/field-security/:id', authenticate, authorize(['admin:field-security']),
  body('sensitivity').isIn(['L0', 'L1', 'L2', 'L3', 'L4', 'L5']),
  body('maskRule').optional().isString(), validate,
  AdminController.updateFieldSensitivity
);
router.get('/field-security/modules', authenticate, authorize(['admin:field-security']), AdminController.getFieldSecurityModules);

/* ════════════════════════════════════════════════
   DIMENSION 9 — ROW-LEVEL SECURITY / DATA SCOPES
   ════════════════════════════════════════════════ */
router.get('/data-scopes', authenticate, authorize(['admin:data-scopes']), AdminController.getDataScopes);
router.get('/data-scopes/:adminId', authenticate, authorize(['admin:data-scopes']), AdminController.getAdminScope);
router.put('/data-scopes/:adminId', authenticate, authorize(['admin:data-scopes']),
  body('geographic').optional().isString(),
  body('department').optional().isString(),
  body('sensitivityLimit').optional().isIn(['L0', 'L1', 'L2', 'L3', 'L4', 'L5']),
  body('timeRestriction').optional().isString(), validate,
  AdminController.updateAdminScope
);

/* ════════════════════════════════════════════════
   DIMENSION 10 — DELEGATED ADMINISTRATION
   ════════════════════════════════════════════════ */
router.get('/delegated/nodes', authenticate, authorize(['admin:delegated-admin']), AdminController.getDelegatedNodes);
router.post('/delegated/nodes', authenticate, authorize(['admin:delegated-admin']),
  body('name').isString(), body('parentId').optional({ values: 'null' }).isInt(),
  body('type').isIn(['global', 'region', 'department']), validate,
  AdminController.createDelegatedNode
);
router.post('/delegated/nodes/:nodeId/assign', authenticate, authorize(['admin:delegated-admin']),
  param('nodeId').isInt(), body('adminId').isInt(), body('capability').isIn(['full', 'user-only', 'read-only']), validate,
  AdminController.assignDelegatedAdmin
);
router.delete('/delegated/nodes/:nodeId/unassign/:adminId', authenticate, authorize(['admin:delegated-admin']),
  AdminController.unassignDelegatedAdmin
);

/* ════════════════════════════════════════════════
   DIMENSION 11 — TENANT MANAGEMENT
   ════════════════════════════════════════════════ */
router.get('/tenants', authenticate, authorize(['admin:tenant']), AdminController.getTenants);
router.post('/tenants', authenticate, authorize(['admin:tenant']),
  body('name').isString(), body('isolation').isIn(['logical', 'schema', 'database', 'instance']), validate,
  AdminController.createTenant
);
router.get('/tenants/:id/audit', authenticate, authorize(['admin:tenant']), AdminController.getTenantAudit);

/* ════════════════════════════════════════════════
   DIMENSION 12 — COMPLIANCE EVIDENCE
   ════════════════════════════════════════════════ */
router.get('/compliance/evidence', authenticate, authorize(['admin:compliance']), AdminController.getEvidenceList);
router.post('/compliance/evidence/generate', authenticate, authorize(['admin:compliance']),
  body('type').isString(), body('periodStart').isISO8601(), body('periodEnd').isISO8601(), validate,
  AdminController.generateEvidence
);
router.get('/compliance/evidence/:id/download', authenticate, authorize(['admin:compliance']),
  AdminController.downloadEvidence
);

/* ════════════════════════════════════════════════
   DIMENSION 13 — VENDOR ACCESS
   ════════════════════════════════════════════════ */
router.get('/vendor-access', authenticate, authorize(['admin:vendor-access']), AdminController.getVendorAccessList);
router.post('/vendor-access', authenticate, authorize(['admin:vendor-access']),
  body('vendorName').isString(), body('contactName').isString(),
  body('contactEmail').isEmail(), body('scope').isString(),
  body('startDate').isISO8601(), body('endDate').isISO8601(),
  body('supervisingAdminId').isInt(), body('justification').isString().isLength({ min: 20 }), validate,
  AdminController.onboardVendor
);
router.post('/vendor-access/:id/extend', authenticate, authorize(['admin:vendor-access']),
  param('id').isInt(), body('newEndDate').isISO8601(), validate,
  AdminController.extendVendorAccess
);
router.post('/vendor-access/:id/revoke', authenticate, authorize(['admin:vendor-access']),
  AdminController.revokeVendorAccess
);

/* ════════════════════════════════════════════════
   DIMENSION 14 — DISASTER RECOVERY
   ════════════════════════════════════════════════ */
router.get('/dr/status', authenticate, authorize(['admin:dr']), AdminController.getDRStatus);
router.post('/dr/test', authenticate, authorize(['admin:dr']), AdminController.initiateDRTest);
router.post('/dr/test/:id/complete', authenticate, authorize(['admin:dr']),
  body('result').isIn(['passed', 'failed']), body('notes').optional().isString(), validate,
  AdminController.completeDRTest
);

/* ════════════════════════════════════════════════
   DIMENSION 15 — PRIVILEGE HEALTH / CREEP DETECTION
   ════════════════════════════════════════════════ */
router.get('/privilege-health', authenticate, authorize(['admin:privilege-health']), AdminController.getPrivilegeHealth);
router.get('/privilege-health/did-do', authenticate, authorize(['admin:privilege-health']), AdminController.getDidDoAnalysis);
router.get('/privilege-health/role-accumulation', authenticate, authorize(['admin:privilege-health']), AdminController.getRoleAccumulation);
router.post('/privilege-health/remediate/:userId', authenticate, authorize(['admin:privilege-health']),
  param('userId').isInt(), body('roleId').isInt(), validate,
  AdminController.remediatePrivilegeCreep
);

/* ════════════════════════════════════════════════
   DIMENSION 16 — API ACCESS KEYS
   ════════════════════════════════════════════════ */
router.get('/api-keys', authenticate, authorize(['admin:api-keys']), AdminController.getApiKeys);
router.post('/api-keys', authenticate, authorize(['admin:api-keys']),
  body('name').isString(), body('description').optional().isString(),
  body('scopes').isArray(), body('ipRestriction').optional().isString(),
  body('expirationDate').isISO8601(), body('rateLimit').optional().isInt(), validate,
  AdminController.createApiKey
);
router.post('/api-keys/:id/revoke', authenticate, authorize(['admin:api-keys']), AdminController.revokeApiKey);
router.post('/api-keys/:id/rotate', authenticate, authorize(['admin:api-keys']), AdminController.rotateApiKey);

/* ════════════════════════════════════════════════
   EXISTING ROUTES (Enhanced Dashboard)
   ════════════════════════════════════════════════ */
router.get('/dashboard/stats', authenticate, authorize(['admin:dashboard']), AdminController.getDashboardStats);
router.get('/system/health', authenticate, authorize(['admin:system']), AdminController.getSystemHealth);

router.get('/audit-logs', authenticate, authorize(['admin:audit']), auditLogValidation, validate, AdminController.getAuditLogs);
router.get('/audit-logs/:id', authenticate, authorize(['admin:audit']), param('id').isInt(), validate, AdminController.getAuditLogById);
router.get('/audit-logs/export', authenticate, authorize(['admin:audit', 'reports:export']),
  query('format').isIn(['csv', 'excel']), auditLogValidation, validate, AdminController.exportAuditLogs
);

router.get('/settings', authenticate, authorize(['admin:settings']), AdminController.getSettings);
router.get('/settings/:category', authenticate, authorize(['admin:settings']),
  param('category').isIn(['General', 'Business Rules', 'Security', 'Integration']), validate, AdminController.getSettingsByCategory
);
router.put('/settings', authenticate, authorize(['admin:settings']), updateSettingsValidation, validate, AdminController.updateSettings);
router.put('/settings/:key', authenticate, authorize(['admin:settings']), param('key').isString(), body('value').notEmpty(), validate, AdminController.updateSingleSetting);
router.post('/settings/reset', authenticate, authorize(['admin:settings']), AdminController.resetSettings);

router.get('/backups', authenticate, authorize(['admin:backup']), AdminController.listBackups);
router.post('/backups', authenticate, authorize(['admin:backup']), limiters.checkout, AdminController.createBackup);
router.post('/backups/restore/:backupId', authenticate, authorize(['admin:backup']),
  param('backupId').isString(), body('confirm').equals('RESTORE').withMessage('Type "RESTORE" to confirm'), validate, AdminController.restoreBackup
);
router.delete('/backups/:backupId', authenticate, authorize(['admin:backup']), param('backupId').isString(), validate, AdminController.deleteBackup);
router.post('/backups/configure', authenticate, authorize(['admin:backup']),
  body('enabled').isBoolean(), body('frequencyHours').isInt({ min: 1, max: 24 }),
  body('retentionDays').isInt({ min: 7, max: 365 }), body('cloudUpload').isBoolean(), validate, AdminController.configureBackup
);

router.post('/maintenance/clear-cache', authenticate, authorize(['admin:maintenance']), AdminController.clearCache);
router.post('/maintenance/clear-logs', authenticate, authorize(['admin:maintenance']),
  body('daysOld').optional().isInt({ min: 1, max: 365 }), validate, AdminController.clearLogs
);
router.get('/maintenance/info', authenticate, authorize(['admin:maintenance']), AdminController.getMaintenanceInfo);

router.get('/statistics/users', authenticate, authorize(['admin:statistics']), AdminController.getUserStatistics);
router.get('/statistics/activity', authenticate, authorize(['admin:statistics']),
  query('days').optional().isInt({ min: 1, max: 90 }), validate, AdminController.getActivityStatistics
);
router.get('/statistics/performance', authenticate, authorize(['admin:statistics']), AdminController.getPerformanceMetrics);

router.post('/database/optimize', authenticate, authorize(['admin:database']), AdminController.optimizeDatabase);
router.get('/database/status', authenticate, authorize(['admin:database']), AdminController.getDatabaseStatus);

// ── Alerts ────────────────────────────────────────────────────
router.get(
  '/alerts',
  authenticate,
  authorize(['admin:dashboard']),
  AdminController.getAlerts
);
router.post(
  '/alerts/:alertId/dismiss',
  authenticate,
  authorize(['admin:dashboard']),
  AdminController.dismissAlert
);

// ── Social Links ──────────────────────────────────────────────
router.put(
  '/social-links',
  authenticate,
  authorize(['admin:settings']),
  body('links').isArray(),
  validate,
  AdminController.updateSocialLinks
);

module.exports = router;
