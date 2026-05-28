import apiClient from './apiClient';
const adminService = {
  getUsers: async (params) => {
    return await apiClient.get('/users', { params });
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
    if (data.status === 'inactive') {
      return await apiClient.delete(`/users/${id}`);
    } else if (data.status === 'active') {
      return await apiClient.post(`/users/${id}/restore`);
    }
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
    const settingsArray = Object.keys(data).map(key => ({
      key,
      value: data[key]
    }));
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
  }
};
export default adminService;
