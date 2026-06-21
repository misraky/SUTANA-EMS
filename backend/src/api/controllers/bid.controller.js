const { db } = require('../../config/database');
const { catchAsync } = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const notificationRepository = require('../../repositories/notification.repository');

exports.submitBid = catchAsync(async (req, res) => {
  const { bid_price_per_unit, quantity_requested, proposed_pickup_date, notes } = req.body;
  const tender = await db('tenders').where('id', req.params.tenderId).first();
  if (!tender) throw AppError.notFound('Tender not found');
  if (tender.status !== 'open') throw AppError.badRequest('This tender is not accepting bids');
  if (new Date(tender.deadline) < new Date()) throw AppError.badRequest('Bid deadline has passed');
  if (!bid_price_per_unit || parseFloat(bid_price_per_unit) < parseFloat(tender.starting_bid_price)) {
    throw AppError.badRequest(`Bid price must be at least ${tender.starting_bid_price} ETB`);
  }
  const qty = parseInt(quantity_requested) || 1;
  if (qty > tender.quantity) throw AppError.badRequest(`Requested quantity exceeds available (${tender.quantity})`);

  const existing = await db('bids').where({ tender_id: tender.id, customer_id: req.user.id }).first();
  const total = parseFloat(bid_price_per_unit) * qty;

  if (existing) {
    await db('bids').where('id', existing.id).update({
      bid_price_per_unit, quantity_requested: qty, total_bid_value: total,
      proposed_pickup_date: proposed_pickup_date || null,
      notes: notes || null, status: 'pending',
      updated_at: db.fn.now(),
    });
    const bid = await db('bids').where('id', existing.id).first();
    return res.json({ status: 'success', data: bid, message: 'Bid updated' });
  }

  const [id] = await db('bids').insert({
    tender_id: tender.id, customer_id: req.user.id,
    bid_price_per_unit, quantity_requested: qty, total_bid_value: total,
    proposed_pickup_date: proposed_pickup_date || null,
    notes: notes || null,
  });
  const bid = await db('bids').where('id', id).first();
  await notificationRepository.create({ roleTarget: 'Sales Manager', title: 'New Bid Received', message: `New bid on ${tender.reference_number} — ${tender.title}: ${parseFloat(bid_price_per_unit).toLocaleString()} ETB/unit x ${qty}` });
  res.status(201).json({ status: 'success', data: bid });
});

exports.listBids = catchAsync(async (req, res) => {
  const tender = await db('tenders').where('id', req.params.tenderId).first();
  if (!tender) throw AppError.notFound('Tender not found');
  const bids = await db('bids')
    .join('users', 'bids.customer_id', 'users.id')
    .where('bids.tender_id', req.params.tenderId)
    .select('bids.*', 'users.name as customer_name', 'users.email as customer_email', 'users.phone as customer_phone')
    .orderBy('bids.total_bid_value', 'desc');
  res.json({ status: 'success', data: bids });
});

exports.getMyBid = catchAsync(async (req, res) => {
  const bid = await db('bids')
    .join('tenders', 'bids.tender_id', 'tenders.id')
    .where('bids.tender_id', req.params.tenderId)
    .where('bids.customer_id', req.user.id)
    .select('bids.*', 'tenders.title as tender_title', 'tenders.reference_number', 'tenders.status as tender_status',
      'tenders.deadline', 'tenders.starting_bid_price', 'tenders.item_name')
    .first();
  if (!bid) return res.json({ status: 'success', data: null });
  res.json({ status: 'success', data: bid });
});

exports.getMyBids = catchAsync(async (req, res) => {
  const bids = await db('bids')
    .join('tenders', 'bids.tender_id', 'tenders.id')
    .where('bids.customer_id', req.user.id)
    .select('bids.*', 'tenders.title as tender_title', 'tenders.reference_number',
      'tenders.status as tender_status', 'tenders.deadline', 'tenders.item_name')
    .orderBy('bids.submitted_at', 'desc')
    .limit(50);
  res.json({ status: 'success', data: bids });
});

exports.disqualify = catchAsync(async (req, res) => {
  const { reason } = req.body;
  if (!reason) throw AppError.badRequest('Disqualification reason is required');
  const bid = await db('bids').where('id', req.params.bidId).first();
  if (!bid) throw AppError.notFound('Bid not found');
  await db('bids').where('id', req.params.bidId).update({
    status: 'disqualified', disqualification_reason: reason, evaluation_label: 'disqualified',
    updated_at: db.fn.now(),
  });
  res.json({ status: 'success', message: 'Bid disqualified' });
});

exports.addEvaluation = catchAsync(async (req, res) => {
  const { evaluation_notes, evaluation_label } = req.body;
  const bid = await db('bids').where('id', req.params.bidId).first();
  if (!bid) throw AppError.notFound('Bid not found');
  const updates = { updated_at: db.fn.now() };
  if (evaluation_notes !== undefined) updates.evaluation_notes = evaluation_notes;
  if (evaluation_label !== undefined) updates.evaluation_label = evaluation_label;
  if (evaluation_label) updates.status = 'under_review';
  await db('bids').where('id', req.params.bidId).update(updates);
  res.json({ status: 'success', message: 'Evaluation updated' });
});

exports.award = catchAsync(async (req, res) => {
  const tender = await db('tenders').where('id', req.params.tenderId).first();
  if (!tender) throw AppError.notFound('Tender not found');
  if (tender.status !== 'closed' && tender.status !== 'open') {
    throw AppError.badRequest('Tender must be closed or open to award');
  }

  const { bid_ids } = req.body;
  if (!bid_ids || !bid_ids.length) throw AppError.badRequest('Select at least one bid to award');

  const bids = await db('bids').whereIn('id', bid_ids).where('tender_id', req.params.tenderId);
  if (!bids.length) throw AppError.notFound('No valid bids found');

  await db('bids').whereIn('id', bid_ids).update({ status: 'awarded', evaluation_label: 'highest', updated_at: db.fn.now() });
  await db('bids').where('tender_id', req.params.tenderId).whereNotIn('id', bid_ids)
    .whereNot('status', 'disqualified').update({ status: 'not_selected', updated_at: db.fn.now() });

  const firstBid = bids[0];
  await db('tenders').where('id', req.params.tenderId).update({
    status: 'awarded', awarded_bid_id: firstBid.id, updated_at: db.fn.now(),
  });

  for (const b of bids) {
    await notificationRepository.create({ userId: b.customer_id, title: 'Bid Awarded!', message: `Congratulations! Your bid on ${tender.reference_number} — ${tender.title} has been selected.` });
  }
  const notSelected = await db('bids').where('tender_id', req.params.tenderId).where('status', 'not_selected').select('customer_id');
  for (const b of notSelected) {
    await notificationRepository.create({ userId: b.customer_id, title: 'Bid Not Selected', message: `Your bid on ${tender.reference_number} — ${tender.title} was not selected. Thank you for participating.` });
  }
  await notificationRepository.create({ roleTarget: 'Sales Manager', title: 'Tender Awarded', message: `Tender ${tender.reference_number} — ${tender.title} has been awarded.` });

  res.json({ status: 'success', message: 'Bid(s) awarded', data: { awarded: bids.length } });
});
