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
  }
};

export default notificationService;
