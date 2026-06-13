const notificationRepository = require('../../repositories/notification.repository');

exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const roles = req.user.roles || [];
    let roleTarget = 'CUSTOMER';
    if (roles.some(r => ['Car Renting Manager', 'Admin', 'CEO'].includes(r))) roleTarget = 'MANAGER';
    if (roles.some(r => ['Finance Manager', 'Finance Officer', 'Finance'].includes(r))) roleTarget = 'FINANCE';

    const notifications = await notificationRepository.getForUserOrRole(userId, roleTarget);
    res.status(200).json({ status: 'success', data: notifications.map(n => n.toJSON()) });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch notifications' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    await notificationRepository.markAsRead(req.params.id);
    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update notification' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const roles = req.user.roles || [];
    let roleTarget = 'CUSTOMER';
    if (roles.some(r => ['Car Renting Manager', 'Admin', 'CEO'].includes(r))) roleTarget = 'MANAGER';
    if (roles.some(r => ['Finance Manager', 'Finance Officer', 'Finance'].includes(r))) roleTarget = 'FINANCE';

    await notificationRepository.markAllAsRead(userId, roleTarget);
    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update notifications' });
  }
};
