const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/gallery.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');

const uploadDir = './uploads/gallery';
const fs = require('fs');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const thumbDir = './uploads/gallery/thumbnails';
if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `gallery-${Date.now()}-${uuidv4().substring(0, 8)}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPG, PNG, and WEBP files are allowed (max 5MB)'), false);
};

const upload = multer({
  storage, fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }
});

// ── Public (no login required) ─────────────────────────────────
router.get('/public', galleryController.getPublicImages);
router.get('/public/:id', galleryController.getPublicImageById);

// ── Admin (login + Admin role) ────────────────────────────────
router.use(authenticate);
router.use(authorizeRoles(['Admin', 'CEO']));

router.get('/', galleryController.getAllImages);
router.post('/', upload.single('image'), (err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === 'FILE_TOO_LARGE') {
    return res.status(400).json({ status: 'error', message: 'File too large. Max 5MB.' });
  }
  if (err) return res.status(400).json({ status: 'error', message: err.message });
  next();
}, galleryController.createImage);

router.put('/:id', upload.single('image'), (err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === 'FILE_TOO_LARGE') {
    return res.status(400).json({ status: 'error', message: 'File too large. Max 5MB.' });
  }
  if (err) return res.status(400).json({ status: 'error', message: err.message });
  next();
}, galleryController.updateImage);

router.delete('/:id', galleryController.deleteImage);

module.exports = router;
