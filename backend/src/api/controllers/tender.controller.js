const { db } = require('../../config/database');
const { catchAsync } = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const notificationRepository = require('../../repositories/notification.repository');

const genRef = async () => {
  const year = new Date().getFullYear();
  const last = await db('tenders').whereRaw('YEAR(created_at) = ?', [year]).orderBy('id', 'desc').first();
  const seq = last ? parseInt(last.reference_number.split('-')[2]) + 1 : 1;
  return `TND-${year}-${String(seq).padStart(3, '0')}`;
};

exports.listPublic = catchAsync(async (req, res) => {
  const { status, category, search } = req.query;
  let q = db('tenders').whereIn('status', ['open', 'closed', 'awarded', 'cancelled']);
  if (status) q = q.where('status', status);
  if (category) q = q.where('category', category);
  if (search) q = q.where(function() { this.where('title', 'like', `%${search}%`).orWhere('description', 'like', `%${search}%`); });
  const tenders = await q.orderBy('created_at', 'desc').limit(50);
  res.json({ status: 'success', data: tenders });
});

exports.getPublic = catchAsync(async (req, res) => {
  const tender = await db('tenders').where('id', req.params.id).whereIn('status', ['open', 'closed', 'awarded', 'cancelled']).first();
  if (!tender) throw AppError.notFound('Tender not found');
  res.json({ status: 'success', data: tender });
});

exports.listInternal = catchAsync(async (req, res) => {
  const tenders = await db('tenders').orderBy('created_at', 'desc').limit(100);
  res.json({ status: 'success', data: tenders });
});

exports.getInternal = catchAsync(async (req, res) => {
  const tender = await db('tenders').where('id', req.params.id).first();
  if (!tender) throw AppError.notFound('Tender not found');
  res.json({ status: 'success', data: tender });
});

exports.create = catchAsync(async (req, res) => {
  const { title, description, category, item_name, quantity, starting_bid_price, deadline, terms_conditions, attachments } = req.body;
  if (!title || !description || !quantity || !starting_bid_price || !deadline || !terms_conditions) {
    throw AppError.badRequest('Title, description, quantity, starting price, deadline, and terms are required');
  }
  const files = req.files ? req.files.map(f => f.filename) : [];
  const ref = await genRef();
  const [id] = await db('tenders').insert({
    reference_number: ref, title, description, category: category || null,
    item_name: item_name || null, quantity, starting_bid_price,
    deadline: new Date(deadline), terms_conditions,
    status: 'open', created_by: req.user.id,
    attachments: files.length ? JSON.stringify(files) : null,
  });
  const tender = await db('tenders').where('id', id).first();
  res.status(201).json({ status: 'success', data: tender });
});

exports.update = catchAsync(async (req, res) => {
  const tender = await db('tenders').where('id', req.params.id).first();
  if (!tender) throw AppError.notFound('Tender not found');
  if (!['draft', 'pending_approval'].includes(tender.status)) {
    throw AppError.badRequest('Can only edit draft or pending approval tenders');
  }
  const { title, description, category, item_name, quantity, starting_bid_price, deadline, terms_conditions } = req.body;
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (category !== undefined) updates.category = category;
  if (item_name !== undefined) updates.item_name = item_name;
  if (quantity !== undefined) updates.quantity = quantity;
  if (starting_bid_price !== undefined) updates.starting_bid_price = starting_bid_price;
  if (deadline !== undefined) updates.deadline = new Date(deadline);
  if (terms_conditions !== undefined) updates.terms_conditions = terms_conditions;
  updates.updated_at = db.fn.now();
  await db('tenders').where('id', req.params.id).update(updates);
  const updated = await db('tenders').where('id', req.params.id).first();
  res.json({ status: 'success', data: updated });
});

exports.publish = catchAsync(async (req, res) => {
  const tender = await db('tenders').where('id', req.params.id).first();
  if (!tender) throw AppError.notFound('Tender not found');
  if (tender.status !== 'draft') throw AppError.badRequest('Only draft tenders can be published');
  const value = parseFloat(tender.starting_bid_price) * parseInt(tender.quantity);
  let newStatus = 'open';
  if (value > 500000) newStatus = 'pending_approval';
  else if (value > 100000) newStatus = 'pending_approval';
  await db('tenders').where('id', req.params.id).update({ status: newStatus, updated_at: db.fn.now() });
  const updated = await db('tenders').where('id', req.params.id).first();
  if (newStatus === 'pending_approval') {
    await notificationRepository.create({ roleTarget: 'Admin', title: 'Tender Approval Needed', message: `Tender ${tender.reference_number} — ${tender.title} requires approval (value: ETB ${value.toLocaleString()})` });
    await notificationRepository.create({ roleTarget: 'CEO', title: 'Tender Approval Needed', message: `Tender ${tender.reference_number} — ${tender.title} requires approval (value: ETB ${value.toLocaleString()})` });
  } else {
    await notificationRepository.create({ roleTarget: 'Sales Manager', title: 'Tender Published', message: `Tender ${tender.reference_number} — ${tender.title} is now open for bids` });
  }
  res.json({ status: 'success', data: updated });
});

exports.approve = catchAsync(async (req, res) => {
  const tender = await db('tenders').where('id', req.params.id).first();
  if (!tender) throw AppError.notFound('Tender not found');
  if (tender.status !== 'pending_approval') throw AppError.badRequest('Tender is not pending approval');
  await db('tenders').where('id', req.params.id).update({ status: 'open', approved_by: req.user.id, updated_at: db.fn.now() });
  const updated = await db('tenders').where('id', req.params.id).first();
  await notificationRepository.create({ roleTarget: 'Sales Manager', title: 'Tender Approved', message: `Tender ${tender.reference_number} — ${tender.title} has been approved and is now open` });
  res.json({ status: 'success', data: updated });
});

exports.close = catchAsync(async (req, res) => {
  const tender = await db('tenders').where('id', req.params.id).first();
  if (!tender) throw AppError.notFound('Tender not found');
  if (tender.status !== 'open') throw AppError.badRequest('Only open tenders can be closed');
  await db('tenders').where('id', req.params.id).update({ status: 'closed', updated_at: db.fn.now() });
  res.json({ status: 'success', message: 'Tender closed' });
});

exports.extend = catchAsync(async (req, res) => {
  const { deadline } = req.body;
  if (!deadline) throw AppError.badRequest('New deadline is required');
  const tender = await db('tenders').where('id', req.params.id).first();
  if (!tender) throw AppError.notFound('Tender not found');
  if (tender.status !== 'open') throw AppError.badRequest('Only open tenders can be extended');
  await db('tenders').where('id', req.params.id).update({ deadline: new Date(deadline), updated_at: db.fn.now() });
  res.json({ status: 'success', message: 'Deadline extended' });
});

exports.cancel = catchAsync(async (req, res) => {
  const { reason } = req.body;
  if (!reason) throw AppError.badRequest('Cancellation reason is required');
  const tender = await db('tenders').where('id', req.params.id).first();
  if (!tender) throw AppError.notFound('Tender not found');
  if (['awarded', 'cancelled'].includes(tender.status)) throw AppError.badRequest('Cannot cancel an awarded or already cancelled tender');
  const bidders = await db('bids').where('tender_id', tender.id).whereNot('status', 'disqualified').select('customer_id');
  await db('tenders').where('id', req.params.id).update({ status: 'cancelled', cancellation_reason: reason, updated_at: db.fn.now() });
  for (const b of bidders) {
    await notificationRepository.create({ userId: b.customer_id, title: 'Tender Cancelled', message: `Tender ${tender.reference_number} — ${tender.title} has been cancelled. Reason: ${reason}` });
  }
  await notificationRepository.create({ roleTarget: 'Sales Manager', title: 'Tender Cancelled', message: `Tender ${tender.reference_number} — ${tender.title} was cancelled: ${reason}` });
  res.json({ status: 'success', message: 'Tender cancelled' });
});

exports.delete = catchAsync(async (req, res) => {
  const tender = await db('tenders').where('id', req.params.id).first();
  if (!tender) throw AppError.notFound('Tender not found');
  if (tender.status === 'awarded') throw AppError.badRequest('Cannot delete an awarded tender');
  await db('bids').where('tender_id', req.params.id).del();
  await db('tenders').where('id', req.params.id).del();
  res.json({ status: 'success', message: 'Tender deleted' });
});
