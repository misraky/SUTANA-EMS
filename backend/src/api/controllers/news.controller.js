const { db } = require('../../config/database');
const { catchAsync } = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');

const YOUTUBE_REGEX = /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

const validateYoutubeUrl = (url) => YOUTUBE_REGEX.test(url);

const extractYoutubeId = (url) => {
  const m = url.match(YOUTUBE_REGEX);
  return m ? m[1] : null;
};

exports.listPosts = catchAsync(async (req, res) => {
  const posts = await db('news_posts').orderBy('created_at', 'desc').limit(50);
  res.json({ status: 'success', data: posts });
});

exports.getPost = catchAsync(async (req, res) => {
  const post = await db('news_posts').where('id', req.params.id).first();
  if (!post) throw new AppError('Post not found', 404);
  res.json({ status: 'success', data: post });
});

exports.createPost = catchAsync(async (req, res) => {
  const { type, title, content, visibility, youtube_url, images,
    hiring_position, hiring_deadline, hiring_email, hiring_location,
    status, send_notification } = req.body;

  if (!type || !title) throw new AppError('Type and title are required', 400);

  if (type === 'video') {
    if (!youtube_url) throw new AppError('YouTube URL is required for video posts', 400);
    if (!validateYoutubeUrl(youtube_url)) throw new AppError('Invalid YouTube URL format', 400);
  }

  if (type === 'hiring') {
    if (!hiring_position) throw new AppError('Position is required for hiring posts', 400);
    if (!hiring_deadline) throw new AppError('Deadline is required for hiring posts', 400);
    if (new Date(hiring_deadline) <= new Date()) throw new AppError('Deadline must be a future date', 400);
    if (hiring_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(hiring_email)) throw new AppError('Invalid apply email format', 400);
  }

  const parsedImages = images ? (typeof images === 'string' ? JSON.parse(images) : images) : null;

  const [id] = await db('news_posts').insert({
    type, title, content: content || null,
    visibility: visibility || 'public',
    youtube_url: youtube_url || null,
    images: parsedImages ? JSON.stringify(parsedImages) : null,
    hiring_position: hiring_position || null,
    hiring_deadline: hiring_deadline || null,
    hiring_email: hiring_email || null,
    hiring_location: hiring_location || null,
    status: status || 'draft',
    posted_by: req.user.id,
    send_notification: send_notification !== false,
  });

  const post = await db('news_posts').where('id', id).first();
  await createNotifications(post);
  res.status(201).json({ status: 'success', data: post });
});

exports.updatePost = catchAsync(async (req, res) => {
  const existing = await db('news_posts').where('id', req.params.id).first();
  if (!existing) throw new AppError('Post not found', 404);

  const { type, title, content, visibility, youtube_url, images,
    hiring_position, hiring_deadline, hiring_email, hiring_location,
    status, send_notification } = req.body;

  if (type === 'video' && youtube_url) {
    if (!validateYoutubeUrl(youtube_url)) throw new AppError('Invalid YouTube URL format', 400);
  }

  if (type === 'hiring' && hiring_deadline) {
    if (new Date(hiring_deadline) <= new Date()) throw new AppError('Deadline must be a future date', 400);
  }

  const parsedImages = images ? (typeof images === 'string' ? JSON.parse(images) : images) : existing.images;

  const updates = {};
  if (type !== undefined) updates.type = type;
  if (title !== undefined) updates.title = title;
  if (content !== undefined) updates.content = content;
  if (visibility !== undefined) updates.visibility = visibility;
  if (youtube_url !== undefined) updates.youtube_url = youtube_url;
  if (images !== undefined) updates.images = parsedImages ? JSON.stringify(parsedImages) : null;
  if (hiring_position !== undefined) updates.hiring_position = hiring_position;
  if (hiring_deadline !== undefined) updates.hiring_deadline = hiring_deadline;
  if (hiring_email !== undefined) updates.hiring_email = hiring_email;
  if (hiring_location !== undefined) updates.hiring_location = hiring_location;
  if (status !== undefined) updates.status = status;
  if (send_notification !== undefined) updates.send_notification = send_notification;
  updates.updated_at = db.fn.now();

  await db('news_posts').where('id', req.params.id).update(updates);
  const post = await db('news_posts').where('id', req.params.id).first();

  if (post.status === 'published' && post.send_notification) {
    await createNotifications(post);
  }

  res.json({ status: 'success', data: post });
});

exports.deletePost = catchAsync(async (req, res) => {
  const deleted = await db('news_posts').where('id', req.params.id).del();
  if (!deleted) throw new AppError('Post not found', 404);
  res.json({ status: 'success', message: 'Post deleted' });
});

exports.publicPosts = catchAsync(async (req, res) => {
  const posts = await db('news_posts')
    .where('status', 'published')
    .where('visibility', 'public')
    .whereIn('type', ['news', 'hiring', 'video', 'photo_gallery'])
    .orderBy('created_at', 'desc')
    .limit(20);
  res.json({ status: 'success', data: posts });
});

exports.myNotifications = catchAsync(async (req, res) => {
  const { filter } = req.query;
  let query = db('notifications as n')
    .join('news_posts as p', 'n.news_post_id', 'p.id')
    .where('n.user_id', req.user.id)
    .select('n.*', 'p.title', 'p.type', 'p.content', 'p.status',
      'p.hiring_position', 'p.hiring_deadline', 'p.hiring_email',
      'p.youtube_url', 'p.images', 'p.posted_by');

  if (filter === 'unread') query = query.where('n.is_read', false);
  if (filter && ['news', 'hiring', 'notice', 'video'].includes(filter)) {
    query = query.where('p.type', filter);
  }

  const notifications = await query.orderBy('n.created_at', 'desc').limit(50);
  res.json({ status: 'success', data: notifications });
});

exports.markRead = catchAsync(async (req, res) => {
  const updated = await db('notifications')
    .where('id', req.params.id)
    .where('user_id', req.user.id)
    .update({ is_read: true, read_at: db.fn.now() });
  if (!updated) throw new AppError('Notification not found', 404);
  res.json({ status: 'success', message: 'Marked as read' });
});

exports.markAllRead = catchAsync(async (req, res) => {
  await db('notifications')
    .where('user_id', req.user.id)
    .where('is_read', false)
    .update({ is_read: true, read_at: db.fn.now() });
  res.json({ status: 'success', message: 'All marked as read' });
});

exports.unreadCount = catchAsync(async (req, res) => {
  const count = await db('notifications')
    .where('user_id', req.user.id)
    .where('is_read', false)
    .count('id as cnt').first();
  res.json({ status: 'success', data: { count: parseInt(count.cnt) || 0 } });
});

async function createNotifications(post) {
  if (post.status !== 'published') return;
  if (!post.send_notification) return;

  const employees = await db('users')
    .where('is_active', true)
    .where('is_deleted', false)
    .whereNot('id', post.posted_by)
    .select('id');

  if (employees.length === 0) return;

  const rows = employees.map(e => ({
    user_id: e.id,
    news_post_id: post.id,
  }));

  try {
    await db.raw('INSERT IGNORE INTO notifications (user_id, news_post_id) VALUES ?', [rows.map(r => [r.user_id, r.news_post_id])]);
  } catch (_) { /* silently ignore duplicate/insert errors */ }
}
