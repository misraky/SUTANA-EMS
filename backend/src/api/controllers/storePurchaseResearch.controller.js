const { db } = require('../../config/database');
const { catchAsync } = require('../../utils/catchAsync');

const ensureTable = async () => {
  await db.raw(`
    CREATE TABLE IF NOT EXISTS store_purchase_research (
      id INT AUTO_INCREMENT PRIMARY KEY,
      request_number VARCHAR(50) NOT NULL UNIQUE,
      product_name VARCHAR(255) NOT NULL,
      quantity_requested INT NOT NULL DEFAULT 1,
      reason TEXT,
      current_stock INT DEFAULT 0,
      requested_by INT NOT NULL,
      ceo_handler INT DEFAULT NULL,
      market_handler INT DEFAULT NULL,
      ceo_instructions TEXT DEFAULT NULL,
      research_findings TEXT DEFAULT NULL,
      research_prices TEXT DEFAULT NULL,
      research_suppliers TEXT DEFAULT NULL,
      research_quality TEXT DEFAULT NULL,
      research_availability TEXT DEFAULT NULL,
      research_notes TEXT DEFAULT NULL,
      research_attachments JSON DEFAULT NULL,
      rejection_reason TEXT DEFAULT NULL,
      approval_instructions TEXT DEFAULT NULL,
      status ENUM('PENDING_PURCHASE','PENDING_CEO','MARKET_STUDY','RESULTS_SUBMITTED','APPROVED','REJECTED') DEFAULT 'PENDING_PURCHASE',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  try { await db.raw(`ALTER TABLE store_purchase_research ADD COLUMN research_prices TEXT DEFAULT NULL AFTER research_findings`); } catch (e) {}
  try { await db.raw(`ALTER TABLE store_purchase_research ADD COLUMN research_suppliers TEXT DEFAULT NULL AFTER research_prices`); } catch (e) {}
  try { await db.raw(`ALTER TABLE store_purchase_research ADD COLUMN research_quality TEXT DEFAULT NULL AFTER research_suppliers`); } catch (e) {}
  try { await db.raw(`ALTER TABLE store_purchase_research ADD COLUMN research_availability TEXT DEFAULT NULL AFTER research_quality`); } catch (e) {}
  try { await db.raw(`ALTER TABLE store_purchase_research ADD COLUMN research_notes TEXT DEFAULT NULL AFTER research_availability`); } catch (e) {}
  try { await db.raw(`ALTER TABLE store_purchase_research ADD COLUMN research_attachments JSON DEFAULT NULL AFTER research_notes`); } catch (e) {}
  try { await db.raw(`ALTER TABLE store_purchase_research MODIFY COLUMN status ENUM('PENDING_PURCHASE','PENDING_CEO','MARKET_STUDY','RESULTS_SUBMITTED','APPROVED','REJECTED') DEFAULT 'PENDING_PURCHASE'`); } catch (e) {}
};

const generateRequestNumber = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PR-${ts}-${rand}`;
};

exports.createRequest = catchAsync(async (req, res) => {
  await ensureTable();
  const { product_name, quantity_requested, reason, current_stock } = req.body;
  if (!product_name || !quantity_requested) {
    return res.status(400).json({ status: 'error', message: 'product_name and quantity_requested are required' });
  }
  const request_number = generateRequestNumber();
  const [id] = await db('store_purchase_research').insert({
    request_number,
    product_name,
    quantity_requested,
    reason: reason || null,
    current_stock: current_stock || 0,
    requested_by: req.user.id,
    status: 'PENDING_PURCHASE',
  });
  const row = await db('store_purchase_research').where('id', id).first();
  res.status(201).json({ status: 'success', data: row });
});

exports.listRequests = catchAsync(async (req, res) => {
  await ensureTable();
  const { status } = req.query;
  let q = db('store_purchase_research')
    .select(
      'store_purchase_research.*',
      'req_user.full_name as requester_name',
      'ceo_user.full_name as ceo_handler_name',
      'market_user.full_name as market_handler_name',
      db.raw('GROUP_CONCAT(DISTINCT roles.name SEPARATOR ", ") as requester_roles')
    )
    .leftJoin('users as req_user', 'store_purchase_research.requested_by', 'req_user.id')
    .leftJoin('users as ceo_user', 'store_purchase_research.ceo_handler', 'ceo_user.id')
    .leftJoin('users as market_user', 'store_purchase_research.market_handler', 'market_user.id')
    .leftJoin('user_roles', 'req_user.id', 'user_roles.user_id')
    .leftJoin('roles', 'user_roles.role_id', 'roles.id');
  if (status) q = q.where('store_purchase_research.status', status);
  const rows = await q.groupBy('store_purchase_research.id').orderBy('store_purchase_research.created_at', 'desc');
  res.json({ status: 'success', data: rows });
});

exports.getRequestDetail = catchAsync(async (req, res) => {
  await ensureTable();
  const row = await db('store_purchase_research')
    .select(
      'store_purchase_research.*',
      'req_user.full_name as requester_name',
      'ceo_user.full_name as ceo_handler_name',
      'market_user.full_name as market_handler_name',
      db.raw('GROUP_CONCAT(DISTINCT roles.name SEPARATOR ", ") as requester_roles')
    )
    .leftJoin('users as req_user', 'store_purchase_research.requested_by', 'req_user.id')
    .leftJoin('users as ceo_user', 'store_purchase_research.ceo_handler', 'ceo_user.id')
    .leftJoin('users as market_user', 'store_purchase_research.market_handler', 'market_user.id')
    .leftJoin('user_roles', 'req_user.id', 'user_roles.user_id')
    .leftJoin('roles', 'user_roles.role_id', 'roles.id')
    .where('store_purchase_research.id', req.params.id)
    .first();
  if (!row) return res.status(404).json({ status: 'error', message: 'Request not found' });
  res.json({ status: 'success', data: row });
});

exports.updateStatus = catchAsync(async (req, res) => {
  await ensureTable();
  const { id } = req.params;
  const { status: newStatus, ceo_instructions, research_findings, rejection_reason, approval_instructions, product_name, quantity_requested } = req.body;

  const existing = await db('store_purchase_research').where('id', id).first();
  if (!existing) return res.status(404).json({ status: 'error', message: 'Request not found' });

  const validTransitions = {
    PENDING_PURCHASE: ['PENDING_CEO', 'REJECTED'],
    PENDING_CEO: ['MARKET_STUDY', 'REJECTED'],
    MARKET_STUDY: ['RESULTS_SUBMITTED'],
    RESULTS_SUBMITTED: ['APPROVED', 'REJECTED'],
    APPROVED: [],
    REJECTED: [],
  };

  if (!validTransitions[existing.status]?.includes(newStatus)) {
    return res.status(400).json({
      status: 'error',
      message: `Cannot transition from ${existing.status} to ${newStatus}`,
    });
  }

  const updateData = { status: newStatus };

  if (newStatus === 'MARKET_STUDY') {
    updateData.ceo_handler = req.user.id;
    if (ceo_instructions) updateData.ceo_instructions = ceo_instructions;
  }
  if (newStatus === 'RESULTS_SUBMITTED') {
    updateData.market_handler = req.user.id;
    if (research_findings) updateData.research_findings = research_findings;
    if (req.body.research_prices) updateData.research_prices = req.body.research_prices;
    if (req.body.research_suppliers) updateData.research_suppliers = req.body.research_suppliers;
    if (req.body.research_quality) updateData.research_quality = req.body.research_quality;
    if (req.body.research_availability) updateData.research_availability = req.body.research_availability;
    if (req.body.research_notes) updateData.research_notes = req.body.research_notes;
    if (req.body.research_attachments) updateData.research_attachments = JSON.stringify(req.body.research_attachments);
  }
  if (newStatus === 'APPROVED') {
    updateData.ceo_handler = req.user.id;
    if (approval_instructions) updateData.approval_instructions = approval_instructions;
  }
  if (newStatus === 'REJECTED') {
    updateData.ceo_handler = req.user.id;
    if (rejection_reason) updateData.rejection_reason = rejection_reason;
    if (approval_instructions) updateData.approval_instructions = approval_instructions;
  }
  if (product_name) updateData.product_name = product_name;
  if (quantity_requested) updateData.quantity_requested = quantity_requested;

  await db('store_purchase_research').where('id', id).update(updateData);

  const updated = await db('store_purchase_research')
    .select(
      'store_purchase_research.*',
      'req_user.full_name as requester_name',
      'ceo_user.full_name as ceo_handler_name',
      'market_user.full_name as market_handler_name',
      db.raw('GROUP_CONCAT(DISTINCT roles.name SEPARATOR ", ") as requester_roles')
    )
    .leftJoin('users as req_user', 'store_purchase_research.requested_by', 'req_user.id')
    .leftJoin('users as ceo_user', 'store_purchase_research.ceo_handler', 'ceo_user.id')
    .leftJoin('users as market_user', 'store_purchase_research.market_handler', 'market_user.id')
    .leftJoin('user_roles', 'req_user.id', 'user_roles.user_id')
    .leftJoin('roles', 'user_roles.role_id', 'roles.id')
    .where('store_purchase_research.id', id)
    .first();

  res.json({ status: 'success', data: updated });
});
