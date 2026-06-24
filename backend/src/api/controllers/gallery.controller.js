const { db } = require('../../config/database');
const AppError = require('../../utils/AppError');
const { catchAsync } = require('../../utils/catchAsync');
const path = require('path');
const fs = require('fs');

const CATEGORIES = ['cars', 'workplace', 'events', 'products'];
const UPLOAD_DIR = './uploads/gallery';
const THUMB_DIR = './uploads/gallery/thumbnails';

// Ensure directories exist
[UPLOAD_DIR, THUMB_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const imgUrl = (file) => file ? `/uploads/gallery/${file.filename}` : null;
const thumbUrl = (filename) => filename ? `/uploads/gallery/thumbnails/${filename}` : null;

// ── PUBLIC Endpoints ───────────────────────────────────────────

exports.getPublicImages = catchAsync(async (req, res) => {
  const { category } = req.query;
  let query = db('gallery_images').where('status', 'active');
  if (category && CATEGORIES.includes(category)) query = query.andWhere('category', category);
  const images = await query.orderBy('category').orderBy('display_order', 'asc');
  res.json({ status: 'success', data: images });
});

exports.getPublicImageById = catchAsync(async (req, res) => {
  const img = await db('gallery_images').where({ id: req.params.id, status: 'active' }).first();
  if (!img) throw new AppError('Image not found', 404);
  res.json({ status: 'success', data: img });
});

// ── ADMIN Endpoints ────────────────────────────────────────────

exports.getAllImages = catchAsync(async (req, res) => {
  const { category } = req.query;
  let query = db('gallery_images')
    .select('gallery_images.*', db.raw('COALESCE(u.full_name, u.email, \'Unknown\') as uploader_name'))
    .leftJoin('users as u', 'gallery_images.uploaded_by', 'u.id');
  if (category && CATEGORIES.includes(category)) query = query.where('gallery_images.category', category);
  const images = await query.orderBy('gallery_images.category').orderBy('gallery_images.display_order', 'asc');
  res.json({ status: 'success', data: images });
});

exports.createImage = catchAsync(async (req, res) => {
  const { category, title, description, date_taken, location, display_order, status } = req.body;

  if (!category || !CATEGORIES.includes(category)) throw new AppError(`Invalid category. Must be one of: ${CATEGORIES.join(', ')}`, 400);
  if (!title || title.length > 255) throw new AppError('Title is required (max 255 chars)', 400);
  if (!req.file) throw new AppError('Image file is required (JPG, PNG, WEBP, max 5MB)', 400);

  const imagePath = imgUrl(req.file);

  const [id] = await db('gallery_images').insert({
    category, title, description: description || null,
    image_path: imagePath, thumbnail_path: thumbUrl(req.file.filename),
    date_taken: date_taken || null, location: location || null,
    display_order: parseInt(display_order || 0), status: status || 'active',
    uploaded_by: req.user.id, created_at: db.fn.now(), updated_at: db.fn.now()
  });

  const img = await db('gallery_images').where({ id }).first();
  res.status(201).json({ status: 'success', message: 'Image uploaded!', data: img });
});

exports.updateImage = catchAsync(async (req, res) => {
  const { id } = req.params;
  const existing = await db('gallery_images').where({ id }).first();
  if (!existing) throw new AppError('Image not found', 404);

  const updates = {};
  ['category', 'title', 'description', 'date_taken', 'location', 'display_order', 'status'].forEach(k => {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  });
  if (updates.category && !CATEGORIES.includes(updates.category)) throw new AppError('Invalid category', 400);
  if (req.file) {
    updates.image_path = imgUrl(req.file);
    updates.thumbnail_path = thumbUrl(req.file.filename);
    // Delete old image files
    if (existing.image_path) {
      const oldPath = path.join(process.cwd(), existing.image_path.replace(/^\//, ''));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    if (existing.thumbnail_path) {
      const oldThumb = path.join(process.cwd(), existing.thumbnail_path.replace(/^\//, ''));
      if (fs.existsSync(oldThumb)) fs.unlinkSync(oldThumb);
    }
  }
  if (Object.keys(updates).length === 0) throw new AppError('No fields to update', 400);
  updates.updated_at = db.fn.now();
  await db('gallery_images').where({ id }).update(updates);

  const img = await db('gallery_images').where({ id }).first();
  res.json({ status: 'success', message: 'Image updated!', data: img });
});

exports.deleteImage = catchAsync(async (req, res) => {
  const { id } = req.params;
  const img = await db('gallery_images').where({ id }).first();
  if (!img) throw new AppError('Image not found', 404);

  // Delete files from server
  if (img.image_path) {
    const fullPath = path.join(process.cwd(), img.image_path.replace(/^\//, ''));
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  }
  if (img.thumbnail_path) {
    const thumbPath = path.join(process.cwd(), img.thumbnail_path.replace(/^\//, ''));
    if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
  }

  await db('gallery_images').where({ id }).delete();
  res.json({ status: 'success', message: 'Image deleted' });
});
