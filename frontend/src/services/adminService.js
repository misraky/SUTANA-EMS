import apiClient from './apiClient';

const handleBlob = async (url, params) => {
  const response = await apiClient.get(url, { params, responseType: 'blob' });
  return response;
};

const adminService = {
  getUsers: async (params) => {
    return await apiClient.get('/users', { params });
  },
  exportUsers: async (params) => {
    return await apiClient.get('/users/export', { params: { ...params, format: 'excel' }, responseType: 'blob' });
  },
  getUserById: async (id) => {
    return await apiClient.get(`/users/${id}`);
  },
  createUser: async (data) => {
    return await apiClient.post('/users', data);
  },
  updateUser: async (id, data) => {
    return await apiClient.put(`/users/${id}`, data);
  },
  updateUserStatus: async (id, data) => {
    if (data.status === 'inactive') return await apiClient.delete(`/users/${id}`);
    if (data.status === 'active') return await apiClient.post(`/users/${id}/restore`);
    return await apiClient.patch(`/users/${id}/status`, data);
  },
  getAuditLogs: async (params) => {
    return await apiClient.get('/admin/audit-logs', { params });
  },
  getSystemSettings: async () => {
    const response = await apiClient.get('/admin/settings');
    const flatSettings = {};
    if (response.data?.settings) {
      Object.values(response.data.settings).forEach(group => {
        group.forEach(setting => {
          flatSettings[setting.setting_key] = setting.setting_value;
        });
      });
    }
    return { data: { settings: flatSettings } };
  },
  updateSystemSettings: async (data) => {
    const settingsArray = Object.keys(data).map(key => ({ key, value: data[key] }));
    return await apiClient.put('/admin/settings', { settings: settingsArray });
  },
  getBackups: async () => {
    return await apiClient.get('/admin/backups');
  },
  createBackup: async (type = 'manual') => {
    return await apiClient.post('/admin/backups', { type });
  },
  restoreBackup: async (filename) => {
    return await apiClient.post(`/admin/backups/restore/${filename}`, { confirm: 'RESTORE' });
  },
  deleteBackup: async (filename) => {
    return await apiClient.delete(`/admin/backups/${filename}`);
  },
  getDashboardStats: async () => {
    return await apiClient.get('/admin/dashboard/stats');
  },
  getSystemHealth: async () => {
    return await apiClient.get('/admin/system/health');
  },
  /* D1 — Admin Tiers */
  getAdminTiers: async () => {
    return await apiClient.get('/admin/tiers');
  },
  assignAdminTier: async (userId, tier) => {
    return await apiClient.post('/admin/tiers/assign', { userId, tier });
  },
  getAdminCoverage: async () => {
    return await apiClient.get('/admin/tiers/coverage');
  },
  /* D2 — PAM */
  requestElevation: async (data) => {
    return await apiClient.post('/admin/pam/elevate', data);
  },
  getActiveElevations: async () => {
    return await apiClient.get('/admin/pam/elevations');
  },
  approveElevation: async (id) => {
    return await apiClient.post(`/admin/pam/elevations/${id}/approve`);
  },
  revokeElevation: async (id) => {
    return await apiClient.post(`/admin/pam/elevations/${id}/revoke`);
  },
  getElevationHistory: async () => {
    return await apiClient.get('/admin/pam/history');
  },
  activateBreakGlass: async (reason, coApproverId) => {
    return await apiClient.post('/admin/pam/break-glass/activate', { reason, coApproverId });
  },
  deactivateBreakGlass: async () => {
    return await apiClient.post('/admin/pam/break-glass/deactivate');
  },
  getBreakGlassStatus: async () => {
    return await apiClient.get('/admin/pam/break-glass/status');
  },
  /* D3 — SoD */
  getSodRules: async () => {
    return await apiClient.get('/admin/sod/rules');
  },
  createSodRule: async (data) => {
    return await apiClient.post('/admin/sod/rules', data);
  },
  updateSodRule: async (id, data) => {
    return await apiClient.put(`/admin/sod/rules/${id}`, data);
  },
  deleteSodRule: async (id) => {
    return await apiClient.delete(`/admin/sod/rules/${id}`);
  },
  getSodViolations: async () => {
    return await apiClient.get('/admin/sod/violations');
  },
  remediateSodViolation: async (id, action, notes) => {
    return await apiClient.post(`/admin/sod/violations/${id}/remediate`, { action, notes });
  },
  checkSodAssignment: async (roleIds) => {
    return await apiClient.get('/admin/sod/check', { params: { roleIds: roleIds.join(',') } });
  },
  /* D4 — Certifications */
  getCertifications: async () => {
    return await apiClient.get('/admin/certifications');
  },
  createCertification: async (data) => {
    return await apiClient.post('/admin/certifications', data);
  },
  getCertificationById: async (id) => {
    return await apiClient.get(`/admin/certifications/${id}`);
  },
  performCertificationReview: async (certId, userId, action, notes) => {
    return await apiClient.post(`/admin/certifications/${certId}/review/${userId}`, { action, notes });
  },
  completeCertification: async (id) => {
    return await apiClient.post(`/admin/certifications/${id}/complete`);
  },
  generateEvidencePackage: async (id) => {
    return await apiClient.get(`/admin/certifications/evidence/${id}`);
  },
  getDormantAccounts: async () => {
    return await apiClient.get('/admin/dormant-accounts');
  },
  disableDormantAccount: async (id) => {
    return await apiClient.post(`/admin/dormant-accounts/${id}/disable`);
  },
  /* D5 — Sessions */
  getActiveSessions: async () => {
    return await apiClient.get('/admin/sessions/active');
  },
  getSessionHistory: async () => {
    return await apiClient.get('/admin/sessions/history');
  },
  getSessionDetail: async (id) => {
    return await apiClient.get(`/admin/sessions/${id}`);
  },
  terminateSession: async (id, reason) => {
    return await apiClient.post(`/admin/sessions/${id}/terminate`, { reason });
  },
  getSessionAnomalies: async () => {
    return await apiClient.get('/admin/sessions/anomalies');
  },
  /* D6 — Role Designer */
  getSingleRoles: async () => {
    return await apiClient.get('/admin/roles/single');
  },
  createSingleRole: async (data) => {
    return await apiClient.post('/admin/roles/single', data);
  },
  updateSingleRole: async (id, data) => {
    return await apiClient.put(`/admin/roles/single/${id}`, data);
  },
  deleteSingleRole: async (id) => {
    return await apiClient.delete(`/admin/roles/single/${id}`);
  },
  getCompositeRoles: async () => {
    return await apiClient.get('/admin/roles/composite');
  },
  createCompositeRole: async (data) => {
    return await apiClient.post('/admin/roles/composite', data);
  },
  updateCompositeRole: async (id, data) => {
    return await apiClient.put(`/admin/roles/composite/${id}`, data);
  },
  deleteCompositeRole: async (id) => {
    return await apiClient.delete(`/admin/roles/composite/${id}`);
  },
  getPermissionMatrix: async () => {
    return await apiClient.get('/admin/roles/permission-matrix');
  },
  /* D7 — Service Accounts */
  getServiceAccounts: async () => {
    return await apiClient.get('/admin/service-accounts');
  },
  createServiceAccount: async (data) => {
    return await apiClient.post('/admin/service-accounts', data);
  },
  rotateServiceAccountSecret: async (id) => {
    return await apiClient.post(`/admin/service-accounts/${id}/rotate`);
  },
  deleteServiceAccount: async (id) => {
    return await apiClient.delete(`/admin/service-accounts/${id}`);
  },
  /* D8 — Field Security */
  getFieldSecurity: async () => {
    return await apiClient.get('/admin/field-security');
  },
  updateFieldSensitivity: async (id, sensitivity, maskRule) => {
    return await apiClient.put(`/admin/field-security/${id}`, { sensitivity, maskRule });
  },
  getFieldSecurityModules: async () => {
    return await apiClient.get('/admin/field-security/modules');
  },
  /* D9 — Data Scopes */
  getDataScopes: async () => {
    return await apiClient.get('/admin/data-scopes');
  },
  getAdminScope: async (adminId) => {
    return await apiClient.get(`/admin/data-scopes/${adminId}`);
  },
  updateAdminScope: async (adminId, data) => {
    return await apiClient.put(`/admin/data-scopes/${adminId}`, data);
  },
  /* D10 — Delegated Admin */
  getDelegatedNodes: async () => {
    return await apiClient.get('/admin/delegated/nodes');
  },
  createDelegatedNode: async (data) => {
    return await apiClient.post('/admin/delegated/nodes', data);
  },
  assignDelegatedAdmin: async (nodeId, adminId, capability) => {
    return await apiClient.post(`/admin/delegated/nodes/${nodeId}/assign`, { adminId, capability });
  },
  unassignDelegatedAdmin: async (nodeId, adminId) => {
    return await apiClient.delete(`/admin/delegated/nodes/${nodeId}/unassign/${adminId}`);
  },
  /* D11 — Tenants */
  getTenants: async () => {
    return await apiClient.get('/admin/tenants');
  },
  createTenant: async (data) => {
    return await apiClient.post('/admin/tenants', data);
  },
  getTenantAudit: async (id) => {
    return await apiClient.get(`/admin/tenants/${id}/audit`);
  },
  /* D12 — Compliance Evidence */
  getEvidenceList: async () => {
    return await apiClient.get('/admin/compliance/evidence');
  },
  generateEvidence: async (type, periodStart, periodEnd) => {
    return await apiClient.post('/admin/compliance/evidence/generate', { type, periodStart, periodEnd });
  },
  downloadEvidence: async (id) => {
    return await handleBlob(`/admin/compliance/evidence/${id}/download`);
  },
  /* D13 — Vendor Access */
  getVendorAccess: async () => {
    return await apiClient.get('/admin/vendor-access');
  },
  onboardVendor: async (data) => {
    return await apiClient.post('/admin/vendor-access', data);
  },
  extendVendorAccess: async (id, newEndDate) => {
    return await apiClient.post(`/admin/vendor-access/${id}/extend`, { newEndDate });
  },
  revokeVendorAccess: async (id) => {
    return await apiClient.post(`/admin/vendor-access/${id}/revoke`);
  },
  /* D14 — DR */
  getDRStatus: async () => {
    return await apiClient.get('/admin/dr/status');
  },
  initiateDRTest: async () => {
    return await apiClient.post('/admin/dr/test');
  },
  completeDRTest: async (id, result, notes) => {
    return await apiClient.post(`/admin/dr/test/${id}/complete`, { result, notes });
  },
  /* D15 — Privilege Health */
  getPrivilegeHealth: async () => {
    return await apiClient.get('/admin/privilege-health');
  },
  getDidDoAnalysis: async () => {
    return await apiClient.get('/admin/privilege-health/did-do');
  },
  getRoleAccumulation: async () => {
    return await apiClient.get('/admin/privilege-health/role-accumulation');
  },
  remediatePrivilegeCreep: async (userId, roleId) => {
    return await apiClient.post(`/admin/privilege-health/remediate/${userId}`, { roleId });
  },
  /* D16 — API Keys */
  getApiKeys: async () => {
    return await apiClient.get('/admin/api-keys');
  },
  createApiKey: async (data) => {
    return await apiClient.post('/admin/api-keys', data);
  },
  revokeApiKey: async (id) => {
    return await apiClient.post(`/admin/api-keys/${id}/revoke`);
  },
  rotateApiKey: async (id) => {
    return await apiClient.post(`/admin/api-keys/${id}/rotate`);
  }
};
export default adminService;