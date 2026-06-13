const { db } = require('../../config/database');
const AppError = require('../../utils/AppError');
const { getFileInfo } = require('../middleware/upload.middleware');
const { v4: uuidv4 } = require('uuid');
const { catchAsync } = require('../../utils/catchAsync');

const requestsController = {
  // ==============================
  // CUSTOMER: Submit a new request
  // ==============================
  createRequest: catchAsync(async (req, res) => {
    const { medication_id, quantity, delivery_option, delivery_address } = req.body;
    const user = req.user;

    if (!medication_id) throw new AppError('Medication ID is required', 400);
    if (!quantity || quantity < 1) throw new AppError('Quantity must be at least 1', 400);

    // Get medication info
    const medication = await db('pharmacy_medications').where({ id: medication_id }).first();
    if (!medication) throw new AppError('Medication not found', 404);

    // Generate request number
    const count = await db('prescription_requests').count('id as c').first();
    const request_number = `RX-${String((parseInt(count.c) || 0) + 1).padStart(4, '0')}`;

    const delivery_fee = delivery_option === 'delivery' ? 50 : 0;
    const price_per_unit = parseFloat(medication.price || 0);
    const total_amount = price_per_unit * parseInt(quantity) + delivery_fee;

    let prescription_image = null;
    if (req.file) {
      prescription_image = getFileInfo(req.file).url;
    }

    const [id] = await db('prescription_requests').insert({
      request_number,
      customer_id: user.id,
      customer_name: user.fullName || user.full_name,
      customer_email: user.email,
      customer_phone: user.phone || null,
      medication_id: parseInt(medication_id),
      medication_name: medication.name,
      quantity: parseInt(quantity),
      price_per_unit,
      total_amount,
      prescription_image,
      delivery_option: delivery_option || 'pickup',
      delivery_address: delivery_address || null,
      delivery_fee,
      status: 'pending',
      requested_at: db.fn.now()
    });

    const request = await db('prescription_requests').where({ id }).first();

    // Emit real-time socket event to pharmacist dashboard
    const io = req.app.get('io');
    if (io) {
      io.emit('new-prescription-request', {
        id,
        request_number,
        customer_name: request.customer_name,
        customer_phone: request.customer_phone,
        medication_name: request.medication_name,
        quantity: request.quantity,
        total_amount: request.total_amount,
        delivery_option: request.delivery_option,
        requested_at: request.requested_at
      });
    }

    res.status(201).json({ status: 'success', data: request });
  }),

  // ==============================
  // CUSTOMER: Get own requests
  // ==============================
  getMyRequests: catchAsync(async (req, res) => {
    const requests = await db('prescription_requests')
      .where({ customer_id: req.user.id })
      .orderBy('requested_at', 'desc');

    res.json({ status: 'success', data: requests });
  }),

  // ==============================
  // PHARMACIST: Get all pending requests
  // ==============================
  getPendingRequests: catchAsync(async (req, res) => {
    const requests = await db('prescription_requests')
      .where({ status: 'pending' })
      .orderBy('requested_at', 'asc');
    res.json({ status: 'success', data: requests });
  }),

  // ==============================
  // PHARMACIST: Get ALL requests with filter
  // ==============================
  getAllRequests: catchAsync(async (req, res) => {
    const { status } = req.query;
    let query = db('prescription_requests').orderBy('requested_at', 'desc');
    if (status) query = query.where({ status });
    const requests = await query;
    res.json({ status: 'success', data: requests });
  }),

  // ==============================
  // PHARMACIST: Approve request
  // ==============================
  approveRequest: catchAsync(async (req, res) => {
    const { id } = req.params;

    const request = await db('prescription_requests').where({ id }).first();
    if (!request) throw new AppError('Request not found', 404);
    if (request.status !== 'pending') throw new AppError('Only pending requests can be approved', 400);

    // Check stock
    const medication = await db('pharmacy_medications').where({ id: request.medication_id }).first();
    if (!medication) throw new AppError('Medication not found', 404);
    if (medication.stock_quantity < request.quantity) {
      throw new AppError(`Insufficient stock. Available: ${medication.stock_quantity}`, 400);
    }

    await db.transaction(async (trx) => {
      // Update request status
      await trx('prescription_requests').where({ id }).update({
        status: 'approved',
        approved_rejected_at: trx.fn.now()
      });

      // Deduct stock
      await trx('pharmacy_medications')
        .where({ id: request.medication_id })
        .decrement('stock_quantity', request.quantity);

      // Log stock movement
      await trx('pharmacy_stock_movements').insert({
        medication_id: request.medication_id,
        quantity_change: -request.quantity,
        reason: `Prescription Request #${request.request_number} approved`,
        reference_no: request.request_number,
        created_by: req.user ? req.user.id : null
      });

      // Insert in-app notification for customer
      await trx('notifications').insert({
        user_id: request.customer_id,
        title: 'Prescription Request Approved ✅',
        message: `Your request #${request.request_number} for ${request.medication_name} has been approved and is being prepared.`,
        type: 'pharmacy',
        is_read: 0,
        created_at: trx.fn.now()
      }).catch(() => {}); // Silently skip if notifications table has different structure
    });

    const updated = await db('prescription_requests').where({ id }).first();

    // Real-time update to all connected clients
    const io = req.app.get('io');
    if (io) {
      io.emit('request-status-updated', { id, status: 'approved', request_number: request.request_number });
    }

    res.json({ status: 'success', data: updated });
  }),

  // ==============================
  // PHARMACIST: Reject request
  // ==============================
  rejectRequest: catchAsync(async (req, res) => {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    if (!rejection_reason) throw new AppError('Rejection reason is required', 400);

    const request = await db('prescription_requests').where({ id }).first();
    if (!request) throw new AppError('Request not found', 404);
    if (request.status !== 'pending') throw new AppError('Only pending requests can be rejected', 400);

    await db.transaction(async (trx) => {
      await trx('prescription_requests').where({ id }).update({
        status: 'rejected',
        rejection_reason,
        approved_rejected_at: trx.fn.now()
      });

      await trx('notifications').insert({
        user_id: request.customer_id,
        title: 'Prescription Request Rejected ❌',
        message: `Your request #${request.request_number} for ${request.medication_name} was rejected. Reason: ${rejection_reason}`,
        type: 'pharmacy',
        is_read: 0,
        created_at: trx.fn.now()
      }).catch(() => {});
    });

    const updated = await db('prescription_requests').where({ id }).first();

    const io = req.app.get('io');
    if (io) {
      io.emit('request-status-updated', { id, status: 'rejected', request_number: request.request_number });
    }

    res.json({ status: 'success', data: updated });
  }),

  // ==============================
  // PHARMACIST: Mark as Ready for Pickup
  // ==============================
  markReady: catchAsync(async (req, res) => {
    const { id } = req.params;
    const request = await db('prescription_requests').where({ id }).first();
    if (!request) throw new AppError('Request not found', 404);

    await db.transaction(async (trx) => {
      await trx('prescription_requests').where({ id }).update({
        status: 'ready_for_pickup',
        ready_at: trx.fn.now()
      });

      await trx('notifications').insert({
        user_id: request.customer_id,
        title: 'Ready for Pickup 📦',
        message: `Your request #${request.request_number} for ${request.medication_name} is ready! Please come collect it.`,
        type: 'pharmacy',
        is_read: 0,
        created_at: trx.fn.now()
      }).catch(() => {});
    });

    const updated = await db('prescription_requests').where({ id }).first();

    const io = req.app.get('io');
    if (io) {
      io.emit('request-status-updated', { id, status: 'ready_for_pickup', request_number: request.request_number });
    }

    res.json({ status: 'success', data: updated });
  }),

  // ==============================
  // PHARMACIST: Mark as Picked Up / Delivered
  // ==============================
  markComplete: catchAsync(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'picked_up' or 'delivered'

    const request = await db('prescription_requests').where({ id }).first();
    if (!request) throw new AppError('Request not found', 404);

    await db('prescription_requests').where({ id }).update({
      status: status || 'picked_up',
      completed_at: db.fn.now()
    });

    const updated = await db('prescription_requests').where({ id }).first();
    res.json({ status: 'success', data: updated });
  }),

  // ==============================
  // CUSTOMER: Cancel pending request
  // ==============================
  cancelRequest: catchAsync(async (req, res) => {
    const { id } = req.params;

    const request = await db('prescription_requests')
      .where({ id, customer_id: req.user.id }).first();
    if (!request) throw new AppError('Request not found', 404);
    if (request.status !== 'pending') throw new AppError('Only pending requests can be cancelled', 400);

    await db('prescription_requests').where({ id }).update({ status: 'rejected', rejection_reason: 'Cancelled by customer' });

    res.json({ status: 'success', message: 'Request cancelled' });
  })
};

module.exports = requestsController;
