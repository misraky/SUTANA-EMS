const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All notification routes require authentication
router.use(authenticate);

router.get('/', NotificationController.getNotifications);
router.put('/:id/read', NotificationController.markRead);
router.put('/read-all', NotificationController.markAllRead);

module.exports = router;
