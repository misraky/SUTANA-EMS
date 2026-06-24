const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');
const contactController = require('../controllers/contact.controller');
const rateLimit = require('express-rate-limit');

const contactLimiter = rateLimit({ windowMs: 3600000, max: 5, message: { status: 'fail', message: 'Too many submissions. Try again later.' } });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads/contact'),
  filename: (req, file, cb) => cb(null, `contact-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.mimetype)) return cb(new Error('Only PDF, DOC, DOCX, JPG, PNG allowed (max 5MB)'), false);
    cb(null, true);
  },
});

// Public
router.post('/', contactLimiter, upload.single('attachment'), contactController.submit);

// Internal (Admin + department heads)
router.use(authenticate);
router.get('/', contactController.list);
router.get('/export/csv', authorizeRoles(['Admin']), contactController.exportCsv);
router.get('/:id', contactController.get);
router.put('/:id/reply', contactController.reply);
router.put('/:id/close', contactController.close);
router.put('/:id/assign', authorizeRoles(['Admin']), contactController.assign);
router.post('/bulk', authorizeRoles(['Admin']), contactController.bulkAction);

module.exports = router;
