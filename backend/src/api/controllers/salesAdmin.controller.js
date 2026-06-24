const { db } = require('../../config/database');
const { audit } = require('../../config/logger');
const { catchAsync } = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const salesAdmin = require('../../services/salesAdmin.service');

// =========================================================
// PRICING ENGINE
// =========================================================
exports.getProductsWithPricing = catchAsync(async (req, res) => {
  const { page, limit, categoryId } = req.query;
  const customerId = req.query.customerId || null;
  const result = await salesAdmin.getProductsWithPricing({ page, limit, categoryId }, customerId);
  res.json({ status: 'success', data: result });
});

exports.getPriceLists = catchAsync(async (req, res) => {
  const lists = await db('price_lists').orderBy('priority', 'desc');
  for (const list of lists) {
    list.items = await db('price_list_items').where('price_list_id', list.id)
      .join('products as p', 'price_list_items.product_id', 'p.id')
      .select('price_list_items.*', 'p.name as product_name', 'p.sku');
  }
  res.json({ status: 'success', data: { priceLists: lists } });
});

exports.createPriceList = catchAsync(async (req, res) => {
  const { name, description, effective_from, effective_to, priority, items } = req.body;
  const [id] = await db('price_lists').insert({
    name, description, effective_from, effective_to, priority: priority || 0, created_by: req.user.id
  });
  if (items && items.length) {
    await db('price_list_items').insert(items.map(i => ({ price_list_id: id, ...i })));
  }
  audit('PRICE_LIST_CREATED', { priceListId: id, name }, req.user.id);
  res.status(201).json({ status: 'success', data: { id } });
});

exports.updatePriceListItem = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { unit_price, min_quantity } = req.body;
  await db('price_list_items').where('id', id).update({ unit_price, min_quantity });
  audit('PRICE_LIST_ITEM_UPDATED', { itemId: id }, req.user.id);
  res.json({ status: 'success' });
});

// =========================================================
// PROMOTIONS
// =========================================================
exports.getPromotions = catchAsync(async (req, res) => {
  const promotions = await db('promotions').orderBy('created_at', 'desc');
  res.json({ status: 'success', data: { promotions } });
});

exports.createPromotion = catchAsync(async (req, res) => {
  const promo = await salesAdmin.createPromotion(req.body, req.user.id);
  audit('PROMOTION_CREATED', { promotionId: promo.id, name: promo.name }, req.user.id);
  res.status(201).json({ status: 'success', data: { promotion: promo } });
});

exports.togglePromotion = catchAsync(async (req, res) => {
  const { id } = req.params;
  const promo = await db('promotions').where('id', id).first();
  if (!promo) throw new AppError('Promotion not found', 404);
  await db('promotions').where('id', id).update({ is_active: !promo.is_active });
  audit('PROMOTION_TOGGLED', { promotionId: id, nowActive: !promo.is_active }, req.user.id);
  res.json({ status: 'success' });
});

exports.validateCoupon = catchAsync(async (req, res) => {
  const { code, subtotal } = req.query;
  const result = await salesAdmin.validateCouponCode(code, parseFloat(subtotal));
  res.json({ status: 'success', data: result });
});

// =========================================================
// LOYALTY
// =========================================================
exports.getCustomerLoyalty = catchAsync(async (req, res) => {
  const { customerId } = req.params;
  const loyalty = await salesAdmin.getCustomerLoyalty(customerId);
  res.json({ status: 'success', data: loyalty });
});

exports.getLoyaltyTiers = catchAsync(async (req, res) => {
  const tiers = await db('loyalty_tiers').orderBy('sort_order');
  res.json({ status: 'success', data: { tiers } });
});

exports.getLoyaltyRewards = catchAsync(async (req, res) => {
  const rewards = await db('loyalty_rewards').where('is_active', true);
  res.json({ status: 'success', data: { rewards } });
});

exports.getLoyaltyPointsHistory = catchAsync(async (req, res) => {
  const { customerId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const total = await db('loyalty_points').where('customer_id', customerId).count('id as total').first();
  const history = await db('loyalty_points').where('customer_id', customerId)
    .orderBy('created_at', 'desc').limit(limit).offset(offset);
  res.json({ status: 'success', data: { history, pagination: { page, limit, total: parseInt(total.total) } } });
});

// =========================================================
// LEADS
// =========================================================
exports.getLeads = catchAsync(async (req, res) => {
  const { status, source, page, limit } = req.query;
  const result = await salesAdmin.getLeads({ status, source, page, limit });
  res.json({ status: 'success', data: result });
});

exports.createLead = catchAsync(async (req, res) => {
  const lead = await salesAdmin.createLead({ ...req.body, assigned_to: req.body.assigned_to || req.user.id });
  audit('LEAD_CREATED', { leadId: lead.id, name: lead.name }, req.user.id);
  res.status(201).json({ status: 'success', data: { lead } });
});

exports.convertLead = catchAsync(async (req, res) => {
  const { leadId } = req.params;
  const customer = await salesAdmin.convertLeadToCustomer(leadId);
  audit('LEAD_CONVERTED', { leadId, customerId: customer.id }, req.user.id);
  res.json({ status: 'success', data: { customer } });
});

// =========================================================
// OPPORTUNITIES
// =========================================================
exports.getOpportunities = catchAsync(async (req, res) => {
  const { stage, page, limit } = req.query;
  const result = await salesAdmin.getOpportunities({ stage, page, limit });
  res.json({ status: 'success', data: result });
});

exports.createOpportunity = catchAsync(async (req, res) => {
  const opp = await salesAdmin.createOpportunity({ ...req.body, assigned_to: req.body.assigned_to || req.user.id });
  audit('OPPORTUNITY_CREATED', { opportunityId: opp.id, name: opp.name }, req.user.id);
  res.status(201).json({ status: 'success', data: { opportunity: opp } });
});

exports.updateOpportunityStage = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { stage, lost_reason } = req.body;
  const updateData = { stage, updated_at: db.fn.now() };
  if (lost_reason) updateData.lost_reason = lost_reason;
  await db('opportunities').where('id', id).update(updateData);
  audit('OPPORTUNITY_STAGE_CHANGED', { opportunityId: id, stage }, req.user.id);
  res.json({ status: 'success' });
});

// =========================================================
// QUOTATIONS
// =========================================================
exports.getQuotations = catchAsync(async (req, res) => {
  const { status, customerId, page, limit } = req.query;
  const result = await salesAdmin.getQuotations({ status, customerId, page, limit });
  res.json({ status: 'success', data: result });
});

exports.createQuotation = catchAsync(async (req, res) => {
  const quote = await salesAdmin.createQuotation(req.body, req.user.id);
  audit('QUOTATION_CREATED', { quoteId: quote.id, number: quote.quote_number }, req.user.id);
  res.status(201).json({ status: 'success', data: { quotation: quote } });
});

exports.updateQuotationStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (status === 'sent') {
    await db('quotations').where('id', id).update({ status: 'sent', updated_at: db.fn.now() });
  } else if (status === 'accepted') {
    await salesAdmin.acceptQuotation(id, req.user.id);
  } else {
    await db('quotations').where('id', id).update({ status, updated_at: db.fn.now() });
  }
  audit('QUOTATION_STATUS_CHANGED', { quoteId: id, status }, req.user.id);
  res.json({ status: 'success' });
});

// =========================================================
// RMA RETURNS
// =========================================================
exports.getRMAReturns = catchAsync(async (req, res) => {
  const { status, page, limit } = req.query;
  const result = await salesAdmin.getRMAReturns({ status, page, limit });
  res.json({ status: 'success', data: result });
});

exports.createRMAReturn = catchAsync(async (req, res) => {
  const rmaReturn = await salesAdmin.createRMAReturn(req.body, req.user.id);
  audit('RMA_RETURN_CREATED', { returnId: rmaReturn.id, number: rmaReturn.return_number }, req.user.id);
  res.status(201).json({ status: 'success', data: { return: rmaReturn } });
});

exports.approveRMAReturn = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { approved } = req.body;
  const rma = await db('rma_returns').where('id', id).first();
  if (!rma) throw new AppError('RMA return not found', 404);
  await db('rma_returns').where('id', id).update({
    status: approved ? 'approved' : 'rejected',
    approved_by: req.user.id,
    rejection_reason: approved ? null : req.body.rejection_reason,
    updated_at: db.fn.now()
  });
  audit('RMA_RETURN_APPROVED', { returnId: id, approved }, req.user.id);
  res.json({ status: 'success' });
});

// =========================================================
// SALES TARGETS
// =========================================================
exports.getSalesTargets = catchAsync(async (req, res) => {
  const { userId, period, date } = req.query;
  const targets = await salesAdmin.getSalesTargets({ userId, period, date });
  res.json({ status: 'success', data: { targets } });
});

exports.setSalesTarget = catchAsync(async (req, res) => {
  const target = await salesAdmin.setSalesTarget(req.body);
  audit('SALES_TARGET_SET', { targetId: target.id }, req.user.id);
  res.status(201).json({ status: 'success', data: { target } });
});

// =========================================================
// DASHBOARD
// =========================================================
exports.getSalesDashboard = catchAsync(async (req, res) => {
  const { businessUnitId } = req.query;
  const dashboard = await salesAdmin.getSalesDashboard(businessUnitId || null);
  res.json({ status: 'success', data: dashboard });
});
