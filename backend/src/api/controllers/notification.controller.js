const notificationRepository = require('../../repositories/notification.repository');

const ROLE_ALLOWED_TYPES = {
  CEO: ['general', 'pharmacy', 'ceo', 'pos'],
  MANAGER: ['general', 'pos'],
  FINANCE: ['general', 'finance', 'farming', 'pos'],
  FARMING: ['general', 'farming', 'pos'],
  RENTAL: ['general', 'rental', 'pos'],
};

exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const roles = req.user.roles || [];
    const lowerRoles = roles.map(r => r.toLowerCase().trim());
    let roleTarget = 'CUSTOMER';
    let allowedTypes = null;
    if (lowerRoles.some(r => ['admin', 'ceo'].includes(r))) {
      roleTarget = 'MANAGER';
      allowedTypes = ROLE_ALLOWED_TYPES.CEO;
    } else if (lowerRoles.some(r => r.includes('market'))) {
      roleTarget = 'MANAGER';
      allowedTypes = ROLE_ALLOWED_TYPES.CEO;
    } else if (lowerRoles.some(r => r.includes('farming'))) {
      roleTarget = 'MANAGER';
      allowedTypes = ROLE_ALLOWED_TYPES.FARMING;
    } else if (lowerRoles.some(r => r.includes('renting') || r.includes('rental'))) {
      roleTarget = 'MANAGER';
      allowedTypes = ROLE_ALLOWED_TYPES.RENTAL;
    } else if (lowerRoles.some(r => ['finance manager', 'finance officer', 'finance'].includes(r))) {
      roleTarget = 'FINANCE';
      allowedTypes = ROLE_ALLOWED_TYPES.FINANCE;
    }

    const notifications = await notificationRepository.getForUserOrRole(userId, roleTarget, allowedTypes);
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
    const lowerRoles = roles.map(r => r.toLowerCase().trim());
    let roleTarget = 'CUSTOMER';
    let allowedTypes = null;
    if (lowerRoles.some(r => ['admin', 'ceo'].includes(r))) {
      roleTarget = 'MANAGER';
      allowedTypes = ROLE_ALLOWED_TYPES.CEO;
    } else if (lowerRoles.some(r => r.includes('market'))) {
      roleTarget = 'MANAGER';
      allowedTypes = ROLE_ALLOWED_TYPES.CEO;
    } else if (lowerRoles.some(r => r.includes('farming'))) {
      roleTarget = 'MANAGER';
      allowedTypes = ROLE_ALLOWED_TYPES.FARMING;
    } else if (lowerRoles.some(r => r.includes('renting') || r.includes('rental'))) {
      roleTarget = 'MANAGER';
      allowedTypes = ROLE_ALLOWED_TYPES.RENTAL;
    } else if (lowerRoles.some(r => ['finance manager', 'finance officer', 'finance'].includes(r))) {
      roleTarget = 'FINANCE';
      allowedTypes = ROLE_ALLOWED_TYPES.FINANCE;
    }

    await notificationRepository.markAllAsRead(userId, roleTarget, allowedTypes);
    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update notifications' });
  }
};
