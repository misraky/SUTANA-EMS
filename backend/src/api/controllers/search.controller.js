const { db } = require('../../config/database');
const { catchAsync } = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');

const SEARCHABLE_SERVICES = [
  { id: 1, name: 'Commercial Printing', description: 'Books, Modules, Exams, Brochures, Tax Receipts, Business Cards, Flyers', subcategories: 'Books, Modules, Exams, Brochures', url: '/services/printing' },
  { id: 2, name: 'Pharmacy & Health', description: 'Medicines, Prescriptions, Health Products, Medical Supplies', subcategories: 'Medicines, Prescriptions, Health Products', url: '/services/pharmacy' },
  { id: 3, name: 'Car Rental', description: 'Vehicle rental for short and long term, Fleet management', subcategories: 'Short-term Rental, Long-term Rental, Fleet Rental', url: '/fleet-gallery' },
  { id: 4, name: 'Farming & Agriculture', description: 'Seeds, Fertilizers, Tools, Pesticides, Agricultural Supplies', subcategories: 'Seeds, Fertilizers, Tools, Pesticides', url: '/services/farming' },
  { id: 5, name: 'Retail Store', description: 'Stationery, Electronics, Office Supplies, General Merchandise', subcategories: 'Stationery, Electronics, Office Supplies', url: '/services/retail' },
];

const PAGES = [
  { id: 1, title: 'Home', url: '/' },
  { id: 2, title: 'Services', url: '/services' },
  { id: 3, title: 'Commercial Printing', url: '/services/printing' },
  { id: 4, title: 'Pharmacy & Health', url: '/services/pharmacy' },
  { id: 5, title: 'Car Rental', url: '/fleet-gallery' },
  { id: 6, title: 'Farming & Agriculture', url: '/services/farming' },
  { id: 7, title: 'Retail Store', url: '/services/retail' },
  { id: 8, title: 'Gallery', url: '/gallery' },
  { id: 9, title: 'News & Announcements', url: '/news' },
  { id: 10, title: 'Tenders & Bids', url: '/tenders' },
  { id: 11, title: 'Track Order', url: '/track-order' },
  { id: 12, title: 'About Us', url: '/about' },
  { id: 13, title: 'Contact Us', url: '/contact' },
  { id: 14, title: 'Login', url: '/login' },
  { id: 15, title: 'Register', url: '/auth/register' },
];

exports.search = catchAsync(async (req, res) => {
  let { q, category, page, limit, live } = req.query;
  if (!q || q.trim().length < 2) throw AppError.badRequest('Query must be at least 2 characters');
  if (q.length > 100) throw AppError.badRequest('Query too long (max 100 characters)');
  q = q.trim();
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.min(50, Math.max(1, parseInt(limit) || 10));
  category = category || 'all';
  live = live === 'true';

  const keyword = `%${q}%`;
  const isLive = live;

  const results = { products: [], services: [], news: [], gallery: [], pages: [] };

  const queries = [];

  if (category === 'all' || category === 'products') {
    queries.push(
      db('products').where(function() {
        this.where('name', 'like', keyword).orWhere('sku', 'like', keyword);
      }).whereNull('deleted_at').where('is_active', true).limit(isLive ? 3 : limit).select(
        'id', 'name', 'sku', 'selling_price as price', 'category_id', db.raw("'product' as entity_type")
      ).then(rows => {
        results.products = rows.map(r => ({
          id: r.id, name: r.name, sku: r.sku, price: r.price,
          stock_status: null, stock_qty: null,
          description: null, url: `/services/retail`,
          entity_type: 'product',
        }));
        return Promise.all(results.products.map(p =>
          db('inventory').where('product_id', p.id).sum('quantity as qty').first().then(inv => {
            p.stock_qty = parseInt(inv?.qty) || 0;
            p.stock_status = p.stock_qty > 10 ? 'in_stock' : p.stock_qty > 0 ? 'low_stock' : 'out_of_stock';
          })
        ));
      }),

      db('retail_products').where(function() {
        this.where('name', 'like', keyword).orWhere('sku', 'like', keyword);
      }).where('is_active', true).limit(isLive ? 3 : limit).select(
        'id', 'name', 'sku', 'price', 'stock_quantity as stock_qty', 'description', db.raw("'retail_product' as entity_type")
      ).then(rows => {
        rows.forEach(r => results.products.push({
          id: `rp-${r.id}`, name: r.name, sku: r.sku, price: r.price,
          stock_qty: r.stock_qty,
          stock_status: r.stock_qty > 10 ? 'in_stock' : r.stock_qty > 0 ? 'low_stock' : 'out_of_stock',
          description: r.description?.slice(0, 150), url: `/services/retail`,
          entity_type: 'retail_product',
        }));
      }),

      db('farming_products').where(function() {
        this.where('name', 'like', keyword).orWhere('description', 'like', keyword);
      }).where('is_active', true).limit(isLive ? 3 : limit).select(
        'id', 'name', 'description', 'price', 'stock_quantity as stock_qty'
      ).then(rows => {
        rows.forEach(r => results.products.push({
          id: `fp-${r.id}`, name: r.name, sku: null, price: r.price,
          stock_qty: r.stock_qty,
          stock_status: r.stock_qty > 10 ? 'in_stock' : r.stock_qty > 0 ? 'low_stock' : 'out_of_stock',
          description: r.description?.slice(0, 150), url: `/services/farming`,
          entity_type: 'farming_product',
        }));
      }),
    );
  }

  if (category === 'all' || category === 'services') {
    queries.push(
      Promise.resolve().then(() => {
        results.services = SEARCHABLE_SERVICES.filter(s =>
          s.name.toLowerCase().includes(q.toLowerCase()) ||
          s.description.toLowerCase().includes(q.toLowerCase()) ||
          s.subcategories.toLowerCase().includes(q.toLowerCase())
        ).slice(0, isLive ? 3 : limit).map(s => ({
          id: s.id, name: s.name, description: s.description?.slice(0, 60),
          subcategories: s.subcategories, url: s.url,
        }));
      })
    );
  }

  if (category === 'all' || category === 'news') {
    queries.push(
      db('news_posts').where('status', 'published').where(function() {
        this.where('title', 'like', keyword).orWhere('content', 'like', keyword);
      }).orderBy('created_at', 'desc').limit(isLive ? 3 : limit).select(
        'id', 'title', 'content', 'created_at', 'posted_by'
      ).then(rows => {
        results.news = rows.map(r => ({
          id: r.id, title: r.title,
          excerpt: r.content?.replace(/<[^>]*>/g, '').slice(0, 200),
          date: r.created_at, url: `/news`,
          author: r.posted_by,
        }));
      })
    );
  }

  if (category === 'all' || category === 'gallery') {
    queries.push(
      db('gallery_images').where('status', 'active').where(function() {
        this.where('title', 'like', keyword).orWhere('description', 'like', keyword).orWhere('location', 'like', keyword);
      }).orderBy('display_order', 'asc').limit(isLive ? 3 : limit).select(
        'id', 'title', 'description', 'image_path', 'category'
      ).then(rows => {
        results.gallery = rows.map(r => ({
          id: r.id, title: r.title, description: r.description?.slice(0, 100),
          image_url: r.image_path, category: r.category, url: `/gallery`,
        }));
      })
    );
  }

  if (category === 'all' || category === 'pages') {
    queries.push(
      Promise.resolve().then(() => {
        results.pages = PAGES.filter(p =>
          p.title.toLowerCase().includes(q.toLowerCase())
        ).slice(0, isLive ? 3 : limit);
      })
    );
  }

  await Promise.all(queries);

  if (isLive) {
    const flattened = [];
    const groups = ['products', 'services', 'news', 'gallery', 'pages'];
    for (const g of groups) {
      if (results[g].length) {
        flattened.push({ category: g, items: results[g] });
      }
    }
    return res.json({ status: 'success', query: q, live: true, groups: flattened, total: flattened.reduce((s, g) => s + g.items.length, 0) });
  }

  const total = Object.values(results).reduce((s, arr) => s + arr.length, 0);
  res.json({ status: 'success', query: q, page, limit, total, results });
});
