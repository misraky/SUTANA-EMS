const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const SA = require('../controllers/salesAdmin.controller');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// =========================================================
// PRICING ENGINE
// =========================================================
router.get('/products', authenticate, authorize(['pos:read']), SA.getProductsWithPricing);
router.get('/price-lists', authenticate, authorize(['pos:read']), SA.getPriceLists);
router.post('/price-lists', authenticate, authorize(['pos:create']),
  body('name').notEmpty(), validate, SA.createPriceList
);
router.put('/price-list-items/:id', authenticate, authorize(['pos:update']),
  param('id').isInt(), body('unit_price').isFloat({ min: 0 }), validate, SA.updatePriceListItem
);

// =========================================================
// PROMOTIONS
// =========================================================
router.get('/promotions', authenticate, authorize(['pos:read']), SA.getPromotions);
router.post('/promotions', authenticate, authorize(['pos:create']),
  body('name').notEmpty(),
  body('type').isIn(['percentage', 'fixed', 'bogo', 'bundle', 'loyalty']),
  body('value').isFloat({ min: 0 }),
  body('start_date').isISO8601(),
  body('end_date').isISO8601(),
  validate, SA.createPromotion
);
router.put('/promotions/:id/toggle', authenticate, authorize(['pos:update']), SA.togglePromotion);
router.get('/validate-coupon', authenticate, authorize(['pos:read']),
  query('code').notEmpty(), query('subtotal').isFloat({ min: 0 }), validate, SA.validateCoupon
);

// =========================================================
// LOYALTY
// =========================================================
router.get('/loyalty/customers/:customerId', authenticate, authorize(['pos:read']), SA.getCustomerLoyalty);
router.get('/loyalty/tiers', authenticate, authorize(['pos:read']), SA.getLoyaltyTiers);
router.get('/loyalty/rewards', authenticate, authorize(['pos:read']), SA.getLoyaltyRewards);
router.get('/loyalty/history/:customerId', authenticate, authorize(['pos:read']), SA.getLoyaltyPointsHistory);

// =========================================================
// LEADS
// =========================================================
router.get('/leads', authenticate, authorize(['pos:read']), SA.getLeads);
router.post('/leads', authenticate, authorize(['pos:create']),
  body('name').notEmpty(), validate, SA.createLead
);
router.put('/leads/:leadId/convert', authenticate, authorize(['pos:update']), SA.convertLead);

// =========================================================
// OPPORTUNITIES
// =========================================================
router.get('/opportunities', authenticate, authorize(['pos:read']), SA.getOpportunities);
router.post('/opportunities', authenticate, authorize(['pos:create']),
  body('name').notEmpty(), validate, SA.createOpportunity
);
router.put('/opportunities/:id/stage', authenticate, authorize(['pos:update']),
  param('id').isInt(), body('stage').isIn(['new', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost']), validate, SA.updateOpportunityStage
);

// =========================================================
// QUOTATIONS
// =========================================================
router.get('/quotations', authenticate, authorize(['pos:read']), SA.getQuotations);
router.post('/quotations', authenticate, authorize(['pos:create']),
  body('customer_id').isInt(), body('items').isArray({ min: 1 }), validate, SA.createQuotation
);
router.put('/quotations/:id/status', authenticate, authorize(['pos:update']),
  param('id').isInt(), body('status').isIn(['draft', 'sent', 'accepted', 'rejected', 'expired']), validate, SA.updateQuotationStatus
);

// =========================================================
// RMA RETURNS
// =========================================================
router.get('/rma-returns', authenticate, authorize(['pos:read']), SA.getRMAReturns);
router.post('/rma-returns', authenticate, authorize(['pos:create']),
  body('original_sale_id').isInt(), body('items').isArray({ min: 1 }), validate, SA.createRMAReturn
);
router.put('/rma-returns/:id/approve', authenticate, authorize(['pos:update']), SA.approveRMAReturn);

// =========================================================
// SALES TARGETS
// =========================================================
router.get('/targets', authenticate, authorize(['pos:read']), SA.getSalesTargets);
router.post('/targets', authenticate, authorize(['pos:create']),
  body('target_amount').isFloat({ min: 0 }), body('period').isIn(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']), validate, SA.setSalesTarget
);

// =========================================================
// DASHBOARD
// =========================================================
router.get('/dashboard', authenticate, authorize(['pos:read']), SA.getSalesDashboard);

module.exports = router;
