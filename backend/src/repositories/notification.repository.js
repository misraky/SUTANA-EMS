const { db } = require('../config/database');
const Notification = require('../models/Notification.model');

class NotificationRepository {
  async create(data) {
    const [result] = await db('notifications').insert({
      user_id: data.userId || null,
      role_target: data.roleTarget || null,
      title: data.title,
      message: data.message,
      is_read: false
    });
    return result;
  }

  async getForUserOrRole(userId, roleTarget) {
    const query = db('notifications')
      .where('user_id', userId)
      .orWhere('role_target', roleTarget)
      .orderBy('created_at', 'desc');
    
    const rows = await query;
    return rows.map(Notification.fromDatabase);
  }

  async markAsRead(id) {
    await db('notifications').where('id', id).update({ is_read: true });
  }

  async markAllAsRead(userId, roleTarget) {
    await db('notifications')
      .where('user_id', userId)
      .orWhere('role_target', roleTarget)
      .update({ is_read: true });
  }
}

module.exports = new NotificationRepository();
