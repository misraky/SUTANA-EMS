const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');
const newsController = require('../controllers/news.controller');

const newsStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads/news'),
  filename: (req, file, cb) => cb(null, `news-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});

const newsUpload = multer({
  storage: newsStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
      return cb(new Error('Only JPG/PNG allowed (max 5MB)'), false);
    }
    cb(null, true);
  },
});

// Public
router.get('/public', newsController.publicPosts);

// Employee
router.get('/notifications', authenticate, newsController.myNotifications);
router.get('/notifications/unread-count', authenticate, newsController.unreadCount);
router.put('/notifications/:id/read', authenticate, newsController.markRead);
router.put('/notifications/read-all', authenticate, newsController.markAllRead);

// Admin
router.use(authenticate, authorizeRoles(['Admin', 'CEO']));
router.get('/', newsController.listPosts);
router.get('/:id', newsController.getPost);
router.post('/', newsUpload.array('images', 10), newsController.createPost);
router.put('/:id', newsUpload.array('images', 10), newsController.updatePost);
router.delete('/:id', newsController.deletePost);

module.exports = router;
