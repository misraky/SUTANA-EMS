const { db, transaction } = require('../config/database');
const AppError = require('../utils/AppError');
const { generateOrderNumber } = require('../utils/orderNumber');

// =========================================================
// 1. PRICING ENGINE
// =========================================================
const getEffectivePrice = async (productId, customerId, quantity = 1) => {
  const product = await db('products').where('id', productId).first();
  if (!product) throw new AppError('Product not found', 404);
  let finalPrice = parseFloat(product.selling_price);

  if (customerId) {
    const customer = await db('customers').where('id', customerId).first();
    if (customer && customer.customer_group) {
      const groupPriceList = await db('price_lists as pl')
        .join('price_list_items as pli', 'pl.id', 'pli.price_list_id')
        .where('pl.name', customer.customer_group)
        .where('pl.is_active', true)
        .where('pli.product_id', productId)
        .where('pli.min_quantity', '<=', quantity)
        .where(function () {
          this.whereNull('pl.effective_from').orWhere('pl.effective_from', '<=', db.fn.now());
        })
        .where(function () {
          this.whereNull('pl.effective_to').orWhere('pl.effective_to', '>=', db.fn.now());
        })
        .orderBy('pli.min_quantity', 'desc')
        .orderBy('pl.priority', 'desc')
        .first();
      if (groupPriceList) {
        finalPrice = parseFloat(groupPriceList.unit_price);
      }
    }
  }

  const volumePrice = await db('price_list_items as pli')
    .join('price_lists as pl', 'pl.id', 'pli.price_list_id')
    .where('pli.product_id', productId)
    .where('pli.min_quantity', '<=', quantity)
    .where('pl.name', 'Volume Pricing')
    .where('pl.is_active', true)
    .orderBy('pli.min_quantity', 'desc')
    .first();
  if (volumePrice) {
    finalPrice = parseFloat(volumePrice.unit_price);
  }

  return finalPrice;
};

const getProductsWithPricing = async (filters, customerId = null) => {
  const { page = 1, limit = 50, categoryId } = filters;
  const offset = (page - 1) * limit;
  let query = db('products as p')
    .leftJoin('product_categories as pc', 'p.category_id', 'pc.id')
    .leftJoin('units as u', 'p.unit_id', 'u.id')
    .leftJoin('inventory as i', 'p.id', 'i.product_id')
    .select(
      'p.id',
      'p.name',
      'p.sku',
      'p.selling_price',
      'pc.name as category_name',
      'u.abbreviation as unit',
      db.raw('COALESCE(i.quantity, 0) as stock_quantity')
    )
    .where('p.is_active', true)
    .whereNull('p.deleted_at');
  if (categoryId) query = query.where('p.category_id', categoryId);
  const total = await query.clone().count('p.id as total').first();
  const products = await query.orderBy('p.name', 'asc').limit(limit).offset(offset);

  const activePromotions = await getActivePromotions();

  const enriched = await Promise.all(products.map(async (p) => {
    let effectivePrice = parseFloat(p.selling_price);
    let appliedPromotion = null;
    let priceListName = null;

    if (customerId) {
      effectivePrice = await getEffectivePrice(p.id, customerId, 1);
      if (effectivePrice !== parseFloat(p.selling_price)) priceListName = 'Customer Price';
    }

    for (const promo of activePromotions) {
      if (promo.applies_to === 'all' ||
          (promo.applies_to === 'product' && promo.product_id === p.id) ||
          (promo.applies_to === 'category' && promo.category_id === p.category_id)) {
        if (promo.type === 'percentage') {
          effectivePrice = effectivePrice * (1 - parseFloat(promo.value) / 100);
        } else if (promo.type === 'fixed') {
          effectivePrice = effectivePrice - parseFloat(promo.value);
        }
        appliedPromotion = { id: promo.id, name: promo.name, type: promo.type, value: promo.value };
        break;
      }
    }

    return {
      ...p,
      selling_price: parseFloat(p.selling_price),
      effective_price: Math.max(0, effectivePrice),
      has_discount: effectivePrice !== parseFloat(p.selling_price),
      price_list_name: priceListName,
      promotion: appliedPromotion
    };
  }));

  return {
    products: enriched,
    pagination: { page, limit, total: parseInt(total.total), totalPages: Math.ceil(total.total / limit) }
  };
};

// =========================================================
// 2. PROMOTIONS ENGINE
// =========================================================
const getActivePromotions = async () => {
  return db('promotions')
    .where('is_active', true)
    .where('start_date', '<=', db.fn.now())
    .where('end_date', '>=', db.fn.now())
    .where(function () {
      this.where('max_uses', 0).orWhereRaw('current_uses < max_uses');
    })
    .orderBy('created_at', 'desc');
};

const createPromotion = async (data, userId) => {
  const promo = {
    ...data,
    created_by: userId,
    start_date: new Date(data.start_date),
    end_date: new Date(data.end_date)
  };
  const [id] = await db('promotions').insert(promo);
  return db('promotions').where('id', id).first();
};

const validateCouponCode = async (code, subtotal) => {
  const promo = await db('promotions')
    .where('coupon_code', code)
    .where('is_active', true)
    .where('start_date', '<=', db.fn.now())
    .where('end_date', '>=', db.fn.now())
    .first();
  if (!promo) throw new AppError('Invalid or expired coupon code', 400);
  if (promo.max_uses > 0 && promo.current_uses >= promo.max_uses) {
    throw new AppError('Coupon code has reached maximum usage limit', 400);
  }
  if (parseFloat(promo.min_purchase_amount) > 0 && subtotal < parseFloat(promo.min_purchase_amount)) {
    throw new AppError(`Minimum purchase amount of ${promo.min_purchase_amount} ETB required`, 400);
  }
  let discountAmount = 0;
  if (promo.type === 'percentage') discountAmount = subtotal * (parseFloat(promo.value) / 100);
  else if (promo.type === 'fixed') discountAmount = parseFloat(promo.value);
  return { promotion: promo, discountAmount };
};

const incrementPromotionUsage = async (promoId) => {
  await db('promotions').where('id', promoId).increment('current_uses', 1);
};

// =========================================================
// 3. LOYALTY PROGRAM
// =========================================================
const LOYALTY_TIER_THRESHOLDS = [
  { name: 'Bronze', minSpend: 0, discountPercent: 0, pointsMultiplier: 1, color: '#CD7F32' },
  { name: 'Silver', minSpend: 50000, discountPercent: 3, pointsMultiplier: 1.5, color: '#C0C0C0' },
  { name: 'Gold', minSpend: 200000, discountPercent: 7, pointsMultiplier: 2, color: '#FFD700' },
  { name: 'Platinum', minSpend: 500000, discountPercent: 12, pointsMultiplier: 3, color: '#E5E4E2' },
  { name: 'Wholesale', minSpend: 0, discountPercent: 5, pointsMultiplier: 1, color: '#6366f1' },
];

const POINTS_PER_CURRENCY = 10;
const POINTS_REDEMPTION_RATE = 10;

const getCustomerLoyalty = async (customerId) => {
  const customer = await db('customers').where('id', customerId).first();
  if (!customer) throw new AppError('Customer not found', 404);

  const totalPoints = await db('loyalty_points')
    .where('customer_id', customerId)
    .whereIn('type', ['earned', 'signup_bonus'])
    .sum('points as total').first();

  const redeemedPoints = await db('loyalty_points')
    .where('customer_id', customerId)
    .where('type', 'redeemed')
    .sum('points as total').first();

  const availablePoints = (parseFloat(totalPoints?.total || 0) - parseFloat(redeemedPoints?.total || 0));

  const annualSpend = await db('pos_sales')
    .where('customer_id', customerId)
    .whereRaw('YEAR(created_at) = YEAR(CURDATE())')
    .sum('total_amount as total').first();

  const annualValue = parseFloat(annualSpend?.total || 0);
  let currentTier = LOYALTY_TIER_THRESHOLDS[0];
  for (const tier of LOYALTY_TIER_THRESHOLDS) {
    if (annualValue >= tier.minSpend) currentTier = tier;
  }

  const nextTier = LOYALTY_TIER_THRESHOLDS.find(t => t.minSpend > annualValue);
  const spendToNextTier = nextTier ? nextTier.minSpend - annualValue : 0;

  return {
    customerId,
    customerName: customer.name,
    currentTier: currentTier.name,
    tierColor: currentTier.color,
    tierDiscountPercent: currentTier.discountPercent,
    pointsMultiplier: currentTier.pointsMultiplier,
    availablePoints: Math.floor(availablePoints),
    totalPointsEarned: Math.floor(parseFloat(totalPoints?.total || 0)),
    annualSpend: annualValue,
    spendToNextTier,
    nextTierName: nextTier?.name || null,
    redeemableValue: Math.floor(availablePoints / POINTS_REDEMPTION_RATE),
  };
};

const earnPoints = async (customerId, saleId, totalAmount, multiplier = 1) => {
  if (!customerId) return;
  const points = Math.floor(totalAmount / POINTS_PER_CURRENCY * multiplier);
  if (points <= 0) return;
  await db('loyalty_points').insert({
    customer_id: customerId,
    points,
    type: 'earned',
    reference_type: 'sale',
    reference_id: saleId,
    expires_at: db.raw('DATE_ADD(NOW(), INTERVAL 12 MONTH)'),
    notes: `Earned from sale INV-${saleId}`
  });
  await db('customers').where('id', customerId).increment('total_lifetime_value', totalAmount);
  await db('customers').where('id', customerId).update({ last_purchase_date: db.fn.now() });
};

const redeemPoints = async (customerId, pointsToRedeem, saleId) => {
  const loyalty = await getCustomerLoyalty(customerId);
  if (pointsToRedeem > loyalty.availablePoints) {
    throw new AppError(`Insufficient points. Available: ${loyalty.availablePoints}`, 400);
  }
  const discountAmount = Math.floor(pointsToRedeem / POINTS_REDEMPTION_RATE);
  await db('loyalty_points').insert({
    customer_id: customerId,
    points: pointsToRedeem,
    type: 'redeemed',
    reference_type: 'sale',
    reference_id: saleId,
    notes: `Redeemed ${pointsToRedeem} points for ${discountAmount} ETB discount`
  });
  return discountAmount;
};

const updateCustomerTier = async (customerId) => {
  const annualSpend = await db('pos_sales')
    .where('customer_id', customerId)
    .whereRaw('YEAR(created_at) = YEAR(CURDATE())')
    .sum('total_amount as total').first();
  const value = parseFloat(annualSpend?.total || 0);
  let bestTier = null;
  for (const tier of LOYALTY_TIER_THRESHOLDS) {
    if (value >= tier.minSpend) {
      const dbTier = await db('loyalty_tiers').where('name', tier.name).first();
      if (dbTier) bestTier = dbTier.id;
    }
  }
  if (bestTier) {
    await db('customers').where('id', customerId).update({ loyalty_tier_id: bestTier });
  }
};

// =========================================================
// 4. LEAD-TO-CASH PIPELINE
// =========================================================
const createLead = async (data) => {
  const [id] = await db('leads').insert({ ...data, created_at: db.fn.now(), updated_at: db.fn.now() });
  return db('leads').where('id', id).first();
};

const getLeads = async (filters = {}) => {
  const { status, source, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;
  let query = db('leads as l').leftJoin('users as u', 'l.assigned_to', 'u.id')
    .select('l.*', 'u.full_name as assigned_to_name');
  if (status) query = query.where('l.status', status);
  if (source) query = query.where('l.source', source);
  const total = await query.clone().count('l.id as total').first();
  const leads = await query.orderBy('l.created_at', 'desc').limit(limit).offset(offset);
  return { leads, pagination: { page, limit, total: parseInt(total.total) } };
};

const convertLeadToCustomer = async (leadId) => {
  const lead = await db('leads').where('id', leadId).first();
  if (!lead) throw new AppError('Lead not found', 404);
  const [customerId] = await db('customers').insert({
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    customer_group: 'Retail',
    created_by: lead.assigned_to,
  });
  await db('leads').where('id', leadId).update({
    status: 'converted',
    converted_to_customer_id: customerId,
    updated_at: db.fn.now()
  });
  return db('customers').where('id', customerId).first();
};

const createOpportunity = async (data) => {
  const [id] = await db('opportunities').insert({ ...data, stage: 'new' });
  if (data.lead_id) {
    await db('leads').where('id', data.lead_id).update({ status: 'qualified', updated_at: db.fn.now() });
  }
  return db('opportunities').where('id', id).first();
};

const getOpportunities = async (filters = {}) => {
  const { stage, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;
  let query = db('opportunities as o')
    .leftJoin('customers as c', 'o.customer_id', 'c.id')
    .leftJoin('users as u', 'o.assigned_to', 'u.id')
    .select('o.*', 'c.name as customer_name', 'c.phone as customer_phone', 'u.full_name as assigned_to_name');
  if (stage) query = query.where('o.stage', stage);
  const total = await query.clone().count('o.id as total').first();
  const opps = await query.orderBy('o.created_at', 'desc').limit(limit).offset(offset);
  return { opportunities: opps, pagination: { page, limit, total: parseInt(total.total) } };
};

const createQuotation = async (data, userId) => {
  let totalAmount = 0;
  const items = data.items || [];
  for (const item of items) {
    const product = await db('products').where('id', item.product_id).first();
    if (!product) throw new AppError(`Product ID ${item.product_id} not found`, 404);
    const qty = parseFloat(item.quantity) || 1;
    const unitPrice = parseFloat(item.unit_price) || parseFloat(product.selling_price);
    const discountPct = parseFloat(item.discount_percent) || 0;
    const lineTotal = qty * unitPrice * (1 - discountPct / 100);
    item.product_name = product.name;
    item.unit_price = unitPrice;
    item.line_total = lineTotal;
    totalAmount += lineTotal;
  }
  const quoteNumber = await generateOrderNumber('QT');
  const subtotal = totalAmount;
  const taxAmount = subtotal * 0.15;
  const total = subtotal + taxAmount;

  const [id] = await db('quotations').insert({
    quote_number: quoteNumber,
    customer_id: data.customer_id,
    opportunity_id: data.opportunity_id || null,
    subtotal, tax_amount: taxAmount, total_amount: total,
    valid_until: data.valid_until || db.raw('DATE_ADD(NOW(), INTERVAL 30 DAY)'),
    terms_conditions: data.terms_conditions,
    notes: data.notes,
    created_by: userId,
    status: 'draft',
  });

  const quoteItems = items.map(item => ({
    quotation_id: id, product_id: item.product_id,
    product_name: item.product_name, quantity: item.quantity,
    unit_price: item.unit_price, discount_percent: item.discount_percent || 0,
    line_total: item.line_total
  }));
  await db('quotation_items').insert(quoteItems);
  return db('quotations').where('id', id).first();
};

const getQuotations = async (filters = {}) => {
  const { status, customerId, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;
  let query = db('quotations as q')
    .leftJoin('customers as c', 'q.customer_id', 'c.id')
    .leftJoin('users as u', 'q.created_by', 'u.id')
    .select('q.*', 'c.name as customer_name', 'u.full_name as created_by_name');
  if (status) query = query.where('q.status', status);
  if (customerId) query = query.where('q.customer_id', customerId);
  const total = await query.clone().count('q.id as total').first();
  const quotes = await query.orderBy('q.created_at', 'desc').limit(limit).offset(offset);

  for (const quote of quotes) {
    quote.items = await db('quotation_items').where('quotation_id', quote.id);
  }
  return { quotations: quotes, pagination: { page, limit, total: parseInt(total.total) } };
};

const acceptQuotation = async (quoteId, userId) => {
  const quote = await db('quotations').where('id', quoteId).first();
  if (!quote) throw new AppError('Quotation not found', 404);
  if (quote.status !== 'sent') throw new AppError('Only sent quotations can be accepted', 400);
  if (quote.valid_until && new Date(quote.valid_until) < new Date()) {
    throw new AppError('Quotation has expired', 400);
  }
  await db('quotations').where('id', quoteId).update({
    status: 'accepted', approved_by: userId, approved_at: db.fn.now(), updated_at: db.fn.now()
  });
  if (quote.opportunity_id) {
    await db('opportunities').where('id', quote.opportunity_id).update({
      stage: 'closed_won', updated_at: db.fn.now()
    });
  }
  return db('quotations').where('id', quoteId).first();
};

// =========================================================
// 5. ENHANCED RETURNS / RMA
// =========================================================
const createRMAReturn = async (data, userId) => {
  const sale = await db('pos_sales').where('id', data.original_sale_id).first();
  if (!sale) throw new AppError('Original sale not found', 404);
  if (sale.status_id) {
    const status = await db('sale_statuses').where('id', sale.status_id).first();
    if (status && status.status_code === 'voided') throw new AppError('Cannot return a voided sale', 400);
  }
  const saleItems = await db('pos_items').where('sale_id', data.original_sale_id);
  if (!saleItems.length) throw new AppError('No items found in original sale', 404);

  let totalRefund = 0;
  const returnItems = [];
  for (const ri of data.items) {
    const originalItem = saleItems.find(si => si.product_id === ri.product_id);
    if (!originalItem) throw new AppError(`Product ID ${ri.product_id} not in original sale`, 404);
    if (ri.quantity > originalItem.quantity) {
      throw new AppError(`Cannot return more than ${originalItem.quantity} of product ID ${ri.product_id}`, 400);
    }
    const unitPrice = parseFloat(originalItem.unit_price);
    let refundAmount = unitPrice * ri.quantity;
    if (data.condition === 'opened') refundAmount *= 0.9;
    else if (data.condition === 'damaged') refundAmount *= 0.5;
    returnItems.push({
      product_id: ri.product_id, quantity: ri.quantity,
      item_condition: ri.item_condition || data.condition || 'unopened',
      refund_amount: refundAmount, reason_code: ri.reason_code || 'customer_return'
    });
    totalRefund += refundAmount;
  }

  let restockingFee = 0;
  if (data.condition === 'unopened') restockingFee = 0;
  else if (data.condition === 'opened') restockingFee = totalRefund * 0.1;
  const netRefund = totalRefund - restockingFee;
  const returnNumber = await generateOrderNumber('RMA');

  const [id] = await db('rma_returns').insert({
    return_number: returnNumber, original_sale_id: data.original_sale_id,
    customer_id: data.customer_id || sale.customer_id,
    condition: data.condition || 'unopened', restocking_fee: restockingFee,
    refund_method: data.refund_method || 'original', total_refund: netRefund,
    status: data.status || 'completed', reason: data.reason,
    processed_by: userId, inspection_notes: data.inspection_notes || null,
  });

  const rmaItems = returnItems.map(ri => ({ rma_return_id: id, ...ri }));
  await db('rma_return_items').insert(rmaItems);

  for (const ri of returnItems) {
    await db('inventory').where('product_id', ri.product_id).increment('quantity', ri.quantity);
    await db('inventory_movements').insert({
      product_id: ri.product_id, quantity: ri.quantity,
      type: 'return', reference_type: 'rma_return', reference_id: id,
      notes: `RMA ${returnNumber} return, condition: ${ri.item_condition}`
    });
  }

  return db('rma_returns').where('id', id).first();
};

const getRMAReturns = async (filters = {}) => {
  const { status, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;
  let query = db('rma_returns as r')
    .leftJoin('customers as c', 'r.customer_id', 'c.id')
    .leftJoin('pos_sales as ps', 'r.original_sale_id', 'ps.id')
    .leftJoin('users as u', 'r.processed_by', 'u.id')
    .select('r.*', 'c.name as customer_name', 'ps.invoice_number', 'u.full_name as processed_by_name');
  if (status) query = query.where('r.status', status);
  const total = await query.clone().count('r.id as total').first();
  const returns = await query.orderBy('r.created_at', 'desc').limit(limit).offset(offset);
  for (const ret of returns) {
    ret.items = await db('rma_return_items').where('rma_return_id', ret.id);
  }
  return { returns, pagination: { page, limit, total: parseInt(total.total) } };
};

// =========================================================
// 6. SALES TARGETS
// =========================================================
const setSalesTarget = async (data) => {
  const [id] = await db('sales_targets').insert(data);
  return db('sales_targets').where('id', id).first();
};

const getSalesTargets = async (filters = {}) => {
  const { userId, period, date } = filters;
  let query = db('sales_targets as st')
    .leftJoin('users as u', 'st.user_id', 'u.id')
    .select('st.*', 'u.full_name as user_name');
  if (userId) query = query.where('st.user_id', userId);
  if (period) query = query.where('st.period', period);
  if (date) query = query.where('st.target_date', date);
  return query.orderBy('st.target_date', 'desc');
};

const updateTargetAchievement = async () => {
  const targets = await db('sales_targets')
    .where('target_date', '<=', db.fn.now())
    .whereRaw("DATE_FORMAT(target_date, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')");
  for (const t of targets) {
    const achieved = await db('pos_sales')
      .whereRaw('MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())')
      .where(function () {
        if (t.user_id) this.where('cashier_id', t.user_id);
      })
      .sum('total_amount as total').first();
    await db('sales_targets').where('id', t.id).update({
      achieved_amount: parseFloat(achieved?.total || 0), updated_at: db.fn.now()
    });
  }
};

// =========================================================
// 7. SALES DASHBOARD / REPORTS
// =========================================================
const getSalesDashboard = async (businessUnitId = null) => {
  const todayStart = db.raw("CURDATE()");
  const monthStart = db.raw("DATE_FORMAT(CURDATE(), '%Y-%m-01')");

  const todaySales = await db('pos_sales')
    .whereRaw('DATE(created_at) = CURDATE()')
    .where(function () { if (businessUnitId) this.where('business_unit_id', businessUnitId); })
    .sum('total_amount as total').count('id as count').first();

  const monthSales = await db('pos_sales')
    .whereRaw('MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())')
    .where(function () { if (businessUnitId) this.where('business_unit_id', businessUnitId); })
    .sum('total_amount as total').count('id as count').first();

  const topProducts = await db('pos_items as pi')
    .join('pos_sales as ps', 'pi.sale_id', 'ps.id')
    .join('products as p', 'pi.product_id', 'p.id')
    .whereRaw('DATE(ps.created_at) = CURDATE()')
    .groupBy('pi.product_id', 'p.name')
    .select('p.name', db.raw('SUM(pi.quantity) as qty'), db.raw('SUM(pi.line_total) as revenue'))
    .orderBy('qty', 'desc').limit(10);

  const paymentBreakdown = await db('pos_sales')
    .whereRaw('DATE(created_at) = CURDATE()')
    .groupBy('payment_method_id')
    .select('payment_method_id', db.raw('COUNT(*) as count'), db.raw('SUM(total_amount) as total'))
    .where(function () { if (businessUnitId) this.where('business_unit_id', businessUnitId); });

  const hourlySales = await db('pos_sales')
    .whereRaw('DATE(created_at) = CURDATE()')
    .groupBy(db.raw("HOUR(created_at)"))
    .select(db.raw("HOUR(created_at) as hour"), db.raw('COUNT(*) as count'), db.raw('SUM(total_amount) as total'))
    .where(function () { if (businessUnitId) this.where('business_unit_id', businessUnitId); })
    .orderBy('hour');

  const activePromotions = await getActivePromotions();

  return {
    todaySales: { total: parseFloat(todaySales?.total || 0), count: parseInt(todaySales?.count || 0) },
    monthSales: { total: parseFloat(monthSales?.total || 0), count: parseInt(monthSales?.count || 0) },
    topProducts: topProducts || [],
    paymentBreakdown: paymentBreakdown || [],
    hourlySales: hourlySales || [],
    activePromotions: activePromotions || [],
  };
};

module.exports = {
  getEffectivePrice,
  getProductsWithPricing,
  getActivePromotions,
  createPromotion,
  validateCouponCode,
  incrementPromotionUsage,
  getCustomerLoyalty,
  earnPoints,
  redeemPoints,
  updateCustomerTier,
  createLead,
  getLeads,
  convertLeadToCustomer,
  createOpportunity,
  getOpportunities,
  createQuotation,
  getQuotations,
  acceptQuotation,
  createRMAReturn,
  getRMAReturns,
  setSalesTarget,
  getSalesTargets,
  updateTargetAchievement,
  getSalesDashboard,
  LOYALTY_TIER_THRESHOLDS,
  POINTS_PER_CURRENCY,
  POINTS_REDEMPTION_RATE,
};
