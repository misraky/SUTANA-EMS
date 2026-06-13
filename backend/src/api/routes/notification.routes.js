const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All notification routes require authentication
router.use(authenticate);

// --- YOUR OLD ROUTES ---
router.get('/', NotificationController.getNotifications);
router.put('/:id/read', NotificationController.markRead);
router.put('/read-all', NotificationController.markAllRead);

// --- PARTNER'S NEW ROUTES ---
router.get('/v2', NotificationController.getMyNotifications);
router.patch('/v2/mark-all-read', NotificationController.markAllAsRead);
router.patch('/v2/:id/read', NotificationController.markAsRead);

module.exports = router;
