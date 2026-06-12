const { db } = require('../../config/database');
const { catchAsync } = require('../../utils/catchAsync');

exports.getNotifications = catchAsync(async (req, res) => {
  const { unreadOnly = false } = req.query;
  const userId = req.user.id;

  // 1. Fetch internal notifications
  let userQuery = db('user_notifications')
    .select('id', 'title', 'message', 'type', 'is_read', 'link_url', 'created_at', db.raw("'internal' as source"))
    .where('user_id', userId)
    .orderBy('created_at', 'desc')
    .limit(50);
  
  if (unreadOnly === 'true') {
    userQuery = userQuery.where('is_read', false);
  }
  const internalNotifs = await userQuery;

  // 2. Fetch customer notifications if they have a profile
  const customer = await db('customers').where('user_id', userId).orWhere('email', req.user.email).first();
  let customerNotifs = [];
  if (customer) {
    let custQuery = db('customer_notifications')
      .select('id', 'title', 'message', 'type', 'is_read', 'link_url', 'created_at', db.raw("'customer' as source"))
      .where('customer_id', customer.id)
      .orderBy('created_at', 'desc')
      .limit(50);
      
    if (unreadOnly === 'true') {
      custQuery = custQuery.where('is_read', false);
    }
    customerNotifs = await custQuery;
  }

  // 3. Merge and sort
  const notifications = [...internalNotifs, ...customerNotifs]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 50);

  res.json({
    status: 'success',
    data: { notifications }
  });
});

exports.markRead = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { source } = req.body;
  const userId = req.user.id;

  if (source === 'customer') {
    const customer = await db('customers').where('user_id', userId).orWhere('email', req.user.email).first();
    if (customer) {
      await db('customer_notifications').where({ id, customer_id: customer.id }).update({ is_read: true });
    }
  } else {
    await db('user_notifications').where({ id, user_id: userId }).update({ is_read: true });
  }

  res.json({ status: 'success', message: 'Notification marked as read' });
});

exports.markAllRead = catchAsync(async (req, res) => {
  const userId = req.user.id;
  await db('user_notifications').where({ user_id: userId, is_read: false }).update({ is_read: true });
  
  const customer = await db('customers').where('user_id', userId).orWhere('email', req.user.email).first();
  if (customer) {
    await db('customer_notifications').where({ customer_id: customer.id, is_read: false }).update({ is_read: true });
  }

  res.json({ status: 'success', message: 'All notifications marked as read' });
});
