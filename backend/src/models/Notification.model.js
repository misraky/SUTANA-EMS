class Notification {
  constructor(data = {}) {
    this.id = data.id || null;
    this.userId = data.user_id || data.userId || null;
    this.roleTarget = data.role_target || data.roleTarget || null;
    this.title = data.title || '';
    this.message = data.message || '';
    this.isRead = data.is_read || data.isRead || false;
    this.createdAt = data.created_at || data.createdAt || null;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      roleTarget: this.roleTarget,
      title: this.title,
      message: this.message,
      isRead: !!this.isRead,
      createdAt: this.createdAt
    };
  }

  static fromDatabase(data) {
    return new Notification(data);
  }
}

module.exports = Notification;
