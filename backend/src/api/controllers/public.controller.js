const { db } = require('../../config/database');
const { catchAsync } = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');

const CONTACT_NUMBER = '011-123-4567';

const MODULE_PREFIXES = {
  PRT: 'PRINTING',
  RNT: 'CAR_RENTAL',
  RX: 'PHARMACY',
  FRM: 'FARMING',
  RET: 'RETAIL',
  INV: 'RETAIL',
};

const STAGE_MAPS = {
  PRINTING: {
    stages: ['RECEIVED', 'IN PROGRESS', 'QUALITY CHECK', 'READY', 'DELIVERED'],
    map: (s) => ({ received: 0, in_progress: 1, quality_check: 2, ready: 3, delivered: 4 })[s] ?? -1,
  },
  CAR_RENTAL: {
    stages: ['PENDING', 'APPROVED', 'CONFIRMED', 'ACTIVE', 'COMPLETED'],
    map: (s) => ({ PENDING_APPROVAL: 0, APPROVED: 1, CONFIRMED: 2, ACTIVE: 3, COMPLETED: 4, ARCHIVED: 4 })[s] ?? -1,
  },
  PHARMACY: {
    stages: ['REQUESTED', 'APPROVED', 'READY', 'PICKED_UP'],
    map: (s) => ({ pending: 0, approved: 1, ready_for_pickup: 2, picked_up: 3, delivered: 3 })[s] ?? -1,
  },
  FARMING: {
    stages: ['ORDERED', 'PROCESSING', 'DISPATCHED', 'DELIVERED'],
    map: (s) => ({ PROCESSING: 0, AWAITING_PAYMENT: 0, CONFIRMED: 0, READY_FOR_PICKUP: 1, OUT_FOR_DELIVERY: 2, DELIVERED: 3, COMPLETED: 3 })[s] ?? -1,
  },
  RETAIL: {
    stages: ['PROCESSING', 'PACKING', 'SHIPPED', 'DELIVERED'],
    map: (s) => ({ PROCESSING: 0, PACKING: 1, SHIPPED: 2, DELIVERED: 3, CANCELLED: -1 })[s] ?? -1,
  },
};

const STATUS_LABELS = {
  PRINTING: {
    received: 'RECEIVED — Your order has been received and is in queue',
    in_progress: 'IN PROGRESS — Your order is being printed',
    quality_check: 'QUALITY CHECK — Your order is undergoing quality inspection',
    ready: 'READY — Your order is ready for pickup',
    delivered: 'DELIVERED — Your order has been delivered',
    cancelled: 'CANCELLED — This order has been cancelled',
  },
  CAR_RENTAL: {
    PENDING_APPROVAL: 'PENDING — Your reservation request is pending approval',
    APPROVED: 'APPROVED — Your reservation has been approved',
    CONFIRMED: 'CONFIRMED — Your rental is confirmed and ready',
    ACTIVE: 'ACTIVE — Your rental is currently active',
    COMPLETED: 'COMPLETED — Your rental has been completed',
    REJECTED: 'REJECTED — Your reservation request was not approved',
    CANCELLED: 'CANCELLED — This reservation has been cancelled',
  },
  PHARMACY: {
    pending: 'REQUESTED — Your prescription request has been submitted',
    approved: 'APPROVED — Your prescription has been approved',
    ready_for_pickup: 'READY — Your prescription is ready for pickup',
    picked_up: 'PICKED UP — Your prescription has been collected',
    delivered: 'DELIVERED — Your prescription has been delivered',
    rejected: 'REJECTED — Your prescription request was not approved',
  },
  FARMING: {
    PROCESSING: 'ORDERED — Your order has been placed and is being reviewed',
    AWAITING_PAYMENT: 'ORDERED — Awaiting payment confirmation',
    CONFIRMED: 'ORDERED — Your order has been confirmed',
    READY_FOR_PICKUP: 'PROCESSING — Your order is ready for pickup',
    OUT_FOR_DELIVERY: 'DISPATCHED — Your order is out for delivery',
    DELIVERED: 'DELIVERED — Your order has been delivered',
    COMPLETED: 'DELIVERED — Your order has been completed',
    CANCELLED: 'CANCELLED — This order has been cancelled',
  },
  RETAIL: {
    PROCESSING: 'PROCESSING — Your order is being processed',
    PACKING: 'PACKING — Your order is being packed',
    SHIPPED: 'SHIPPED — Your order has been shipped',
    DELIVERED: 'DELIVERED — Your order has been delivered',
    CANCELLED: 'CANCELLED — This order has been cancelled',
  },
};

const fmtDate = (d) => d ? new Date(d).toISOString().split('T')[0] : null;

const buildStages = (stages, currentIdx) =>
  stages.map((label, i) => ({ label, completed: i <= currentIdx, current: i === currentIdx }));

const getModuleFromInvoice = (invoice) => {
  const prefix = (invoice || '').split('-')[0];
  return MODULE_PREFIXES[prefix] || null;
};

exports.trackOrder = catchAsync(async (req, res) => {
  const { invoice, phone } = req.query;
  if (!invoice || !phone) throw new AppError('Invoice and Phone are required', 400);

  const phoneClean = phone.replace(/[^0-9]/g, '');
  if (phoneClean.length < 9) throw new AppError('Invalid phone number', 400);

  const moduleType = getModuleFromInvoice(invoice);
  if (!moduleType) return sendNotFound(res);

  let row = null;
  let matchedPhone = null;

  if (moduleType === 'PRINTING') {
    row = await db('printing_orders as po')
      .join('customers as c', 'po.customer_id', 'c.id')
      .where('po.order_number', invoice)
      .where('po.deleted_at', null)
      .select('po.*', 'c.phone as customer_phone')
      .first();
    if (!row) return sendNotFound(res);
    matchedPhone = row.customer_phone;
    if (!phonesMatch(phoneClean, matchedPhone)) return sendNotFound(res);

    const statusRow = await db('order_statuses').where('id', row.status_id).first();
    const statusKey = (statusRow?.name || 'received').toLowerCase().replace(/ /g, '_');
    const sm = STAGE_MAPS.PRINTING;
    const idx = sm.map(statusKey);
    const branch = await db('branches').select('name', 'address').first();

    return res.json({
      status: 'success',
      data: {
        order_id: row.order_number,
        module: moduleType,
        order_date: fmtDate(row.created_at),
        status: statusKey.toUpperCase(),
        status_label: STATUS_LABELS.PRINTING[statusKey] || STATUS_LABELS.PRINTING.received,
        stages: buildStages(sm.stages, idx),
        estimated_completion: fmtDate(row.due_date),
        product: `${row.product_type} — ${row.quantity} copy(ies), ${row.paper_type}, ${row.pages_per_copy} pages, ${row.color_printing ? 'Color' : 'B&W'}, ${row.binding_type} binding`,
        total_amount: parseFloat(row.total_price) || 0,
        payment_status: 'PAID',
        pickup_location: branch ? `${branch.name}, ${branch.address}` : 'Sutana Branch, Addis Ababa',
        working_hours: '8:00 AM — 5:00 PM',
        contact_number: CONTACT_NUMBER,
      },
    });
  }

  if (moduleType === 'CAR_RENTAL') {
    row = await db('rental_orders')
      .where('order_number', invoice)
      .where('deleted_at', null)
      .first();
    if (!row) return sendNotFound(res);
    matchedPhone = row.customer_phone;
    if (!phonesMatch(phoneClean, matchedPhone)) return sendNotFound(res);

    const car = await db('cars').where('id', row.car_id).select('name', 'model', 'plate_number').first();
    const sm = STAGE_MAPS.CAR_RENTAL;
    const idx = sm.map(row.status);

    return res.json({
      status: 'success',
      data: {
        order_id: row.order_number,
        module: moduleType,
        order_date: fmtDate(row.created_at),
        status: row.status,
        status_label: STATUS_LABELS.CAR_RENTAL[row.status] || STATUS_LABELS.CAR_RENTAL.PENDING_APPROVAL,
        stages: buildStages(sm.stages, idx),
        estimated_completion: fmtDate(row.return_date),
        product: car ? `${car.name} ${car.model} (${car.plate_number})` : 'Vehicle',
        total_amount: parseFloat(row.total_amount) || 0,
        payment_status: row.payment_status || 'PENDING',
        pickup_location: `Pickup: ${fmtDate(row.pickup_date)} — Return: ${fmtDate(row.return_date)}`,
        working_hours: '8:00 AM — 8:00 PM',
        contact_number: CONTACT_NUMBER,
      },
    });
  }

  if (moduleType === 'PHARMACY') {
    row = await db('prescription_requests')
      .where('request_number', invoice)
      .first();
    if (!row) return sendNotFound(res);
    matchedPhone = row.customer_phone;
    if (!phonesMatch(phoneClean, matchedPhone)) return sendNotFound(res);

    const sm = STAGE_MAPS.PHARMACY;
    const idx = sm.map(row.status);
    const branch = await db('pharmacy_branches').select('name', 'address', 'working_hours').first();

    return res.json({
      status: 'success',
      data: {
        order_id: row.request_number,
        module: moduleType,
        order_date: fmtDate(row.requested_at),
        status: row.status,
        status_label: STATUS_LABELS.PHARMACY[row.status] || STATUS_LABELS.PHARMACY.pending,
        stages: buildStages(sm.stages, idx),
        estimated_completion: fmtDate(row.ready_at),
        product: `${row.medication_name} — ${row.quantity} unit(s)`,
        total_amount: parseFloat(row.total_amount) || 0,
        payment_status: 'PAID',
        pickup_location: branch ? `${branch.name}, ${branch.address}` : 'Sutana Pharmacy, Addis Ababa',
        working_hours: branch ? branch.working_hours : '8:00 AM — 8:00 PM',
        contact_number: CONTACT_NUMBER,
      },
    });
  }

  if (moduleType === 'FARMING') {
    row = await db('farming_orders as fo')
      .leftJoin('users', 'fo.customer_id', 'users.id')
      .where('fo.invoice_number', invoice)
      .select('fo.*', 'users.phone as customer_phone')
      .first();
    if (!row) return sendNotFound(res);
    matchedPhone = row.customer_phone;
    if (!phonesMatch(phoneClean, matchedPhone)) return sendNotFound(res);

    const items = await db('farming_order_items')
      .join('farming_products', 'farming_order_items.product_id', 'farming_products.id')
      .where('farming_order_items.order_id', row.id)
      .select('farming_products.name', 'farming_order_items.quantity', 'farming_order_items.unit_price');
    const productDesc = items.length > 0 ? items.map(i => `${i.name} x${i.quantity}`).join(', ') : 'Farming order';

    const sm = STAGE_MAPS.FARMING;
    const idx = sm.map(row.status);

    return res.json({
      status: 'success',
      data: {
        order_id: row.invoice_number,
        module: moduleType,
        order_date: fmtDate(row.created_at),
        status: row.status,
        status_label: STATUS_LABELS.FARMING[row.status] || STATUS_LABELS.FARMING.PROCESSING,
        stages: buildStages(sm.stages, idx),
        estimated_completion: null,
        product: productDesc,
        total_amount: parseFloat(row.total_amount) || 0,
        payment_status: row.payment_method === 'cash' || row.status === 'COMPLETED' ? 'PAID' : 'PENDING',
        pickup_location: row.delivery_type === 'pickup' ? 'Sutana Branch, Addis Ababa' : row.delivery_address || null,
        working_hours: '8:00 AM — 6:00 PM',
        contact_number: CONTACT_NUMBER,
      },
    });
  }

  if (moduleType === 'RETAIL') {
    const prefix = invoice.split('-')[0];
    if (prefix === 'RET') {
      row = await db('retail_orders as ro')
        .leftJoin('users', 'ro.customer_id', 'users.id')
        .where('ro.invoice_number', invoice)
        .select('ro.*', 'users.phone as customer_phone')
        .first();
    } else {
      row = await db('retail_transactions').where('invoice_number', invoice).first();
      if (row) { row.status = 'DELIVERED'; row.payment_status = 'PAID'; }
    }
    if (!row) return sendNotFound(res);
    matchedPhone = row.customer_phone;
    if (!phonesMatch(phoneClean, matchedPhone)) return sendNotFound(res);

    const sm = STAGE_MAPS.RETAIL;
    const idx = sm.map(row.status);

    return res.json({
      status: 'success',
      data: {
        order_id: row.invoice_number,
        module: moduleType,
        order_date: fmtDate(row.created_at),
        status: row.status,
        status_label: STATUS_LABELS.RETAIL[row.status] || STATUS_LABELS.RETAIL.PROCESSING,
        stages: buildStages(sm.stages, idx >= 0 ? idx : 0),
        estimated_completion: null,
        product: 'Retail purchase',
        total_amount: parseFloat(row.total_amount) || 0,
        payment_status: row.payment_status || 'PAID',
        pickup_location: 'Sutana Branch, Addis Ababa',
        working_hours: '8:00 AM — 8:00 PM',
        contact_number: CONTACT_NUMBER,
      },
    });
  }

  return sendNotFound(res);
});

function phonesMatch(cleanPhone, dbPhone) {
  if (!dbPhone) return false;
  const dbClean = String(dbPhone).replace(/[^0-9]/g, '');
  if (dbClean.length < 9) return false;
  return dbClean === cleanPhone || dbClean.slice(-9) === cleanPhone.slice(-9);
}

function sendNotFound(res) {
  return res.status(404).json({
    status: 'error',
    message: 'We could not find an order with the provided Invoice Number and Phone Number.',
    data: null,
  });
}
