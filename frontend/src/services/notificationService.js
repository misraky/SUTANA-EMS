import apiClient from './apiClient';

const notificationService = {
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
