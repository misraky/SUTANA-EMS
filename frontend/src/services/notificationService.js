import apiClient from './apiClient';

const notificationService = {
  getNotifications: async (params = {}) => {
    return await apiClient.get('/notifications', { params });
  },

  markAsRead: async (id, source) => {
    return await apiClient.put(`/notifications/${id}/read`, { source });
  },

  markAllAsRead: async () => {
    return await apiClient.put('/notifications/read-all');
  },
  getMyNotifications: async () => {
    const res = await apiClient.get('/notifications/v2');
    return res.data;
  },
  markAsReadV2: async (id) => {
    const res = await apiClient.patch(`/notifications/v2/${id}/read`);
    return res.data;
  },
  markAllAsReadV2: async () => {
    const res = await apiClient.patch('/notifications/v2/mark-all-read');
    return res.data;
  }
};

export default notificationService;
