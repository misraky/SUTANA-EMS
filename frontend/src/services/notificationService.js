import apiClient from './apiClient';

const notificationService = {
  getMyNotifications: async (filter = '') => {
    const params = filter ? `?filter=${filter}` : '';
    const res = await apiClient.get(`/news/notifications${params}`);
    if (res.status === 'success') {
      return {
        ...res,
        data: res.data.map(n => ({
          id: n.id,
          title: n.title,
          message: n.content ? n.content.replace(/<[^>]*>/g, '').slice(0, 120) : '',
          createdAt: n.created_at,
          isRead: n.is_read,
          _type: n.type,
          newsPostId: n.news_post_id,
          hiringPosition: n.hiring_position,
          hiringDeadline: n.hiring_deadline,
          hiringEmail: n.hiring_email,
          youtubeUrl: n.youtube_url,
        })),
      };
    }
    return res;
  },
  getUnreadCount: async () => {
    const res = await apiClient.get('/news/notifications/unread-count');
    return res;
  },
  markAsRead: async (id) => {
    const res = await apiClient.put(`/news/notifications/${id}/read`);
    return res;
  },
  markAllAsRead: async () => {
    const res = await apiClient.put('/news/notifications/read-all');
    return res;
  },
  getSystemNotifications: async () => {
    const res = await apiClient.get('/notifications');
    return res;
  },
  markSystemAsRead: async (id) => {
    const res = await apiClient.patch(`/notifications/${id}/read`);
    return res;
  },
};

export default notificationService;
