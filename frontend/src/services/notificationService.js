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
    const res = await apiClient.get('/notifications');
    return res.data;
  },
  markAsRead: async (id) => {
    const res = await apiClient.patch(`/notifications/${id}/read`);
    return res.data;
  },
  markAllAsRead: async () => {
    const res = await apiClient.patch('/notifications/mark-all-read');
    return res.data;
  }
};

export default notificationService;
