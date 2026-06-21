const { db } = require('../../config/database');
const { catchAsync } = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const notificationRepository = require('../../repositories/notification.repository');
const { sendEmail } = require('../../services/email.service');

const DEPT_ROUTING = {
  'General Inquiry': { role: 'Admin' },
  Sales: { role: 'Sales Manager' },
  Support: { role: 'Customer Support Lead' },
  Complaint: { role: 'Customer Support Lead', extraRole: 'CEO', sms: true },
  Partnership: { role: 'Business Development Manager' },
};

exports.submit = catchAsync(async (req, res) => {
  const { full_name, email, phone, subject, department, message } = req.body;
  if (!full_name || !email || !subject || !department || !message) {
    throw AppError.badRequest('Full name, email, subject, department, and message are required');
  }
  if (full_name.length < 2 || full_name.length > 100) throw AppError.badRequest('Name must be 2–100 characters');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw AppError.badRequest('Invalid email format');
  if (subject.length < 5 || subject.length > 200) throw AppError.badRequest('Subject must be 5–200 characters');
  if (message.length < 10 || message.length > 2000) throw AppError.badRequest('Message must be 10–2000 characters');
  if (!DEPT_ROUTING[department]) throw AppError.badRequest('Invalid department');

  const attachment = req.file ? req.file.filename : null;

  const [id] = await db('contact_messages').insert({
    full_name, email, phone: phone || null, subject, department, message, attachment,
  });

  const routing = DEPT_ROUTING[department];
  const msgBody = `From: ${full_name} (${email}${phone ? ', ' + phone : ''})\nDept: ${department}\nSubject: ${subject}\n\n${message}`;

  const roleTargets = [routing.role];
  if (routing.extraRole) roleTargets.push(routing.extraRole);

  for (const role of roleTargets) {
    await notificationRepository.create({
      roleTarget: role,
      title: `New Contact: ${department}`,
      message: `${full_name} — ${subject}`,
    });
    const recipients = await db('users')
      .join('user_roles', 'users.id', 'user_roles.user_id')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where('roles.name', role).select('users.email');
    for (const r of recipients) {
      sendEmail({ to: r.email, subject: `[Contact] ${department}: ${subject}`, html: msgBody.replace(/\n/g, '<br>') }).catch(() => {});
    }
  }

  res.status(201).json({ status: 'success', message: 'Message sent successfully' });
});

exports.list = catchAsync(async (req, res) => {
  const { department, status, search, startDate, endDate } = req.query;
  const isAdmin = req.user.roles.includes('Admin');
  let q = db('contact_messages');

  if (!isAdmin) {
    const userRole = req.user.roles[0];
    q = q.where('department', getDeptByRole(userRole));
  }
  if (department) q = q.where('department', department);
  if (status) q = q.where('status', status);
  if (search) {
    const s = `%${search}%`;
    q = q.where(function() { this.where('full_name', 'like', s).orWhere('email', 'like', s).orWhere('subject', 'like', s); });
  }
  if (startDate) q = q.where('created_at', '>=', new Date(startDate));
  if (endDate) q = q.where('created_at', '<=', new Date(endDate));

  const messages = await q.orderBy('created_at', 'desc').limit(200);
  res.json({ status: 'success', data: messages });
});

exports.get = catchAsync(async (req, res) => {
  const msg = await db('contact_messages').where('id', req.params.id).first();
  if (!msg) throw AppError.notFound('Message not found');
  if (msg.status === 'unread') {
    await db('contact_messages').where('id', req.params.id).update({ status: 'read', read_at: db.fn.now() });
    msg.status = 'read';
  }
  res.json({ status: 'success', data: msg });
});

exports.reply = catchAsync(async (req, res) => {
  const msg = await db('contact_messages').where('id', req.params.id).first();
  if (!msg) throw AppError.notFound('Message not found');
  const { reply_body } = req.body;
  if (!reply_body) throw AppError.badRequest('Reply body is required');
  await db('contact_messages').where('id', req.params.id).update({ status: 'replied', replied_at: db.fn.now(), admin_notes: reply_body });
  sendEmail({ to: msg.email, subject: `Re: ${msg.subject}`, html: reply_body.replace(/\n/g, '<br>') }).catch(() => {});
  res.json({ status: 'success', message: 'Reply sent' });
});

exports.close = catchAsync(async (req, res) => {
  const msg = await db('contact_messages').where('id', req.params.id).first();
  if (!msg) throw AppError.notFound('Message not found');
  await db('contact_messages').where('id', req.params.id).update({ status: 'closed' });
  res.json({ status: 'success', message: 'Message closed' });
});

exports.assign = catchAsync(async (req, res) => {
  const { assigned_to } = req.body;
  if (!assigned_to) throw AppError.badRequest('User ID is required');
  const msg = await db('contact_messages').where('id', req.params.id).first();
  if (!msg) throw AppError.notFound('Message not found');
  await db('contact_messages').where('id', req.params.id).update({ assigned_to });
  res.json({ status: 'success', message: 'Assigned' });
});

exports.bulkAction = catchAsync(async (req, res) => {
  const { ids, action } = req.body;
  if (!ids?.length || !action) throw AppError.badRequest('IDs and action are required');
  const updates = {};
  if (action === 'read') updates.status = 'read';
  else if (action === 'close') updates.status = 'closed';
  else throw AppError.badRequest('Invalid action');
  await db('contact_messages').whereIn('id', ids).update(updates);
  res.json({ status: 'success', message: `${ids.length} message(s) updated` });
});

exports.exportCsv = catchAsync(async (req, res) => {
  const messages = await db('contact_messages').orderBy('created_at', 'desc').limit(500);
  const header = 'ID,Full Name,Email,Phone,Department,Subject,Message,Status,Created At\n';
  const rows = messages.map(m =>
    `"${m.id}","${m.full_name}","${m.email}","${m.phone || ''}","${m.department}","${m.subject}","${m.message.replace(/"/g, '""')}","${m.status}","${m.created_at}"`
  ).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=contact_messages.csv');
  res.send(header + rows);
});

function getDeptByRole(role) {
  const map = { 'Sales Manager': 'Sales', 'Customer Support Lead': 'Support', 'Business Development Manager': 'Partnership' };
  return map[role] || null;
}
