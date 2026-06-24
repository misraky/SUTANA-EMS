const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, authorizeRoles } = require('../middleware/auth.middleware');
const StorePRController = require('../controllers/storePurchaseResearch.controller');

router.use(authenticate);

const storeRoles = ['Store Manager', 'Store Worker', 'Sales/Cashier', 'CEO', 'Admin'];
const ceoRoles = ['CEO', 'Admin'];
const purchaseRoles = ['Purchase', 'CEO', 'Admin'];
const marketRoles = ['CEO', 'Admin', 'Market Research'];

const RESEARCH_DIR = path.join(process.cwd(), 'uploads', 'research');
if (!fs.existsSync(RESEARCH_DIR)) fs.mkdirSync(RESEARCH_DIR, { recursive: true });
const researchUpload = multer({ dest: RESEARCH_DIR });

router.get('/purchase-research', StorePRController.listRequests);
router.get('/purchase-research/:id', StorePRController.getRequestDetail);
router.post('/purchase-research', authorizeRoles(storeRoles), [
  body('product_name').notEmpty().isString(),
  body('quantity_requested').isInt({ min: 1 }),
  body('reason').optional().isString(),
  body('current_stock').optional().isInt({ min: 0 }),
], validate, StorePRController.createRequest);
router.patch('/purchase-research/:id/status', authorizeRoles([...ceoRoles, ...purchaseRoles, ...storeRoles, ...marketRoles]), [
  body('status').isIn(['PENDING_CEO', 'MARKET_STUDY', 'RESULTS_SUBMITTED', 'APPROVED', 'REJECTED']),
  body('ceo_instructions').optional().isString(),
  body('research_findings').optional().isString(),
  body('research_prices').optional().isString(),
  body('research_suppliers').optional().isString(),
  body('research_quality').optional().isString(),
  body('research_availability').optional().isString(),
  body('research_notes').optional().isString(),
  body('rejection_reason').optional().isString(),
  body('approval_instructions').optional().isString(),
], validate, StorePRController.updateStatus);
router.post('/purchase-research/upload', authorizeRoles(marketRoles), researchUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ status: 'error', message: 'No file uploaded' });
  const ext = path.extname(req.file.originalname);
  const newName = `${req.file.filename}${ext}`;
  const oldPath = req.file.path;
  const newPath = path.join(RESEARCH_DIR, newName);
  try { fs.renameSync(oldPath, newPath); } catch (e) {}
  res.json({ status: 'success', data: { url: `/uploads/research/${newName}`, originalName: req.file.originalname, size: req.file.size } });
});

module.exports = router;
