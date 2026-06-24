const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const publicController = require('../controllers/public.controller');
const searchController = require('../controllers/search.controller');
const AdminController = require('../controllers/admin.controller');

const trackLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, keyGenerator: (req) => req.ip, handler: (req, res) => { res.status(429).json({ status: 'error', message: 'Too many requests. Please wait a moment before trying again.' }); } });
const searchLimiter = rateLimit({ windowMs: 60000, max: 60, standardHeaders: true, legacyHeaders: false, keyGenerator: (req) => req.ip, handler: (req, res) => { res.status(429).json({ status: 'error', message: 'Too many requests. Please wait a moment.' }); } });

router.get('/track', trackLimiter, publicController.trackOrder);
router.get('/search', searchLimiter, searchController.search);
router.get('/social-links', AdminController.getSocialLinks);

module.exports = router;
