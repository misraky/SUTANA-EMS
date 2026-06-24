const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');
const tenderController = require('../controllers/tender.controller');
const bidController = require('../controllers/bid.controller');

const tenderStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads/tenders'),
  filename: (req, file, cb) => cb(null, `tender-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});

const tenderUpload = multer({
  storage: tenderStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only PDF, JPG, PNG, GIF allowed (max 10MB)'), false);
    }
    cb(null, true);
  },
});

// Public
router.get('/public', tenderController.listPublic);
router.get('/public/:id', tenderController.getPublic);

// Customer (authenticated)
router.get('/my-bids', authenticate, bidController.getMyBids);
router.post('/:tenderId/bid', authenticate, bidController.submitBid);
router.get('/:tenderId/my-bid', authenticate, bidController.getMyBid);
router.get('/:tenderId/winner', authenticate, bidController.getWinner);

// Internal — Sales Manager, Admin, CEO, Purchase, Sales/Cashier
router.use(authenticate, authorizeRoles(['Admin', 'CEO', 'Sales Manager', 'Sales/Cashier', 'Purchase']));
router.get('/', tenderController.listInternal);
router.get('/:id', tenderController.getInternal);
router.post('/', tenderUpload.array('attachments', 5), tenderController.create);
router.put('/:id', tenderUpload.array('attachments', 5), tenderController.update);
router.delete('/:id', tenderController.delete);
router.put('/:id/publish', tenderController.publish);
router.put('/:id/approve', authorizeRoles(['Admin', 'CEO']), tenderController.approve);
router.put('/:id/close', tenderController.close);
router.put('/:id/extend', tenderController.extend);
router.put('/:id/cancel', tenderController.cancel);
router.get('/:tenderId/bids', bidController.listBids);
router.put('/:tenderId/award', bidController.award);
router.put('/bids/:bidId/evaluate', bidController.addEvaluation);
router.put('/bids/:bidId/disqualify', bidController.disqualify);

module.exports = router;
