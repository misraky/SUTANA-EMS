import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/apiClient';
import { PublicNav } from './PublicNavFooter';
import { Store, ShoppingCart, Search, Package, Plus, Minus, Trash2, X, CheckCircle, Star, Zap, TrendingUp, ArrowRight } from 'lucide-react';

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

@keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
@keyframes shimmerAnim { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
@keyframes slideIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
@keyframes cartBounce { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }

.rsp-root {
  font-family: 'Inter', -apple-system, sans-serif;
  background: #f0f2f5;
  min-height: 100vh;
}

/* Hero */
.rsp-hero {
  width: 100%;
  position: relative;
  overflow: hidden;
  height: 420px;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f4c35 100%);
}
.rsp-hero-orbs {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.rsp-hero-orb1 {
  position: absolute;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%);
  top: -150px; right: -100px;
}
.rsp-hero-orb2 {
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(5,150,105,0.2) 0%, transparent 70%);
  bottom: -100px; left: -50px;
}
.rsp-hero-grid {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 50px 50px;
}
.rsp-hero-content {
  position: relative;
  z-index: 10;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 60px;
}
.rsp-hero-text { flex: 1; }
.rsp-hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(59,130,246,0.2);
  border: 1px solid rgba(59,130,246,0.4);
  backdrop-filter: blur(8px);
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  color: #93c5fd;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 20px;
}
.rsp-hero-title {
  font-size: clamp(32px, 5vw, 56px);
  font-weight: 900;
  color: white;
  margin: 0 0 16px;
  line-height: 1.1;
  letter-spacing: -1px;
}
.rsp-hero-title span { color: #34d399; }
.rsp-hero-sub {
  font-size: 18px;
  color: rgba(255,255,255,0.7);
  margin: 0 0 32px;
  max-width: 480px;
  line-height: 1.6;
}
.rsp-hero-stats {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
}
.rsp-hero-stat { text-align: left; }
.rsp-hero-stat-num { font-size: 28px; font-weight: 800; color: white; line-height: 1; }
.rsp-hero-stat-label { font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 4px; font-weight: 500; }

/* Toolbar */
.rsp-toolbar {
  background: white;
  border-bottom: 1px solid #e4e6ea;
  padding: 14px 0;
  position: sticky;
  top: 68px;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.rsp-toolbar-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.rsp-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 20px;
  flex: 1;
  max-width: 380px;
  transition: all 0.2s;
}
.rsp-search:focus-within { border-color: #059669; box-shadow: 0 0 0 3px rgba(5,150,105,0.1); background: white; }
.rsp-search input { border: none; outline: none; flex: 1; font-size: 13px; color: #0f172a; background: transparent; font-family: inherit; }
.rsp-cat-pill {
  padding: 7px 18px;
  border-radius: 20px;
  border: 1.5px solid #e2e8f0;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
  background: #f8fafc;
  color: #64748b;
  font-family: inherit;
}
.rsp-cat-pill:hover { background: #e2e8f0; color: #334155; }
.rsp-cat-pill.active { background: linear-gradient(135deg,#059669,#10b981); color: white; border-color: transparent; box-shadow: 0 4px 12px rgba(5,150,105,0.3); }

/* Main */
.rsp-main {
  max-width: 1440px;
  margin: 0 auto;
  padding: 32px 24px 100px;
}

/* Grid */
.rsp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}
.rsp-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #e4e6ea;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
  display: flex;
  flex-direction: column;
  animation: fadeUp 0.4s both;
}
.rsp-card:hover { box-shadow: 0 12px 32px rgba(0,0,0,0.1); transform: translateY(-4px); border-color: #c7e7dc; }
.rsp-card-img-wrap {
  position: relative;
  overflow: hidden;
  aspect-ratio: 4/3;
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  display: flex;
  align-items: center;
  justify-content: center;
}
.rsp-card-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
.rsp-card:hover .rsp-card-img { transform: scale(1.06); }
.rsp-card-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(6px);
  padding: 4px 12px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: 0.3px;
}
.rsp-card-oos {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: white;
  letter-spacing: 1px;
}
.rsp-card-body { padding: 18px 20px 20px; flex: 1; display: flex; flex-direction: column; }
.rsp-card-name { font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 6px; line-height: 1.4; }
.rsp-card-desc { font-size: 12px; color: #64748b; margin: 0 0 16px; line-height: 1.5; flex: 1; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.rsp-card-footer { margin-top: auto; display: flex; align-items: center; justify-content: space-between; }
.rsp-price { font-size: 20px; font-weight: 800; color: #059669; }
.rsp-price-sub { font-size: 11px; color: #94a3b8; margin-top: 2px; }
.rsp-add-btn {
  background: linear-gradient(135deg,#0f172a,#1e293b);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-size: 13px;
  transition: all 0.2s;
  font-family: inherit;
}
.rsp-add-btn:hover:not(:disabled) { background: linear-gradient(135deg,#059669,#10b981); transform: scale(1.03); }
.rsp-add-btn:disabled { opacity: 0.45; cursor: not-allowed; }

/* Shimmer */
.rsp-shimmer {
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 600px 100%;
  animation: shimmerAnim 1.5s infinite;
  border-radius: 16px;
  height: 320px;
}

/* Cart FAB */
.rsp-cart-fab {
  position: fixed;
  bottom: 32px;
  right: 32px;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg,#059669,#10b981);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(5,150,105,0.45);
  cursor: pointer;
  z-index: 100;
  transition: transform 0.2s;
  border: none;
  animation: cartBounce 2s ease-in-out infinite;
}
.rsp-cart-fab:hover { transform: scale(1.08); }
.rsp-cart-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ef4444;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

/* Cart sidebar */
.rsp-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.45); z-index: 200; backdrop-filter: blur(4px); opacity: 0; pointer-events: none; transition: 0.3s; }
.rsp-overlay.open { opacity: 1; pointer-events: auto; }
.rsp-sidebar { position: fixed; top: 0; right: -440px; bottom: 0; width: 440px; background: white; z-index: 210; box-shadow: -12px 0 48px rgba(0,0,0,0.12); transition: right 0.4s cubic-bezier(0.16,1,0.3,1); display: flex; flex-direction: column; }
.rsp-sidebar.open { right: 0; }
.rsp-sidebar-header { padding: 24px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; background: #f8fafc; }
.rsp-sidebar-items { flex: 1; overflow-y: auto; padding: 20px 24px; }
.rsp-ci { display: flex; gap: 14px; padding: 16px 0; border-bottom: 1px solid #f1f5f9; animation: slideIn 0.3s both; }
.rsp-ci-img { width: 64px; height: 64px; border-radius: 10px; object-fit: cover; background: #f1f5f9; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.rsp-ci-info { flex: 1; min-width: 0; }
.rsp-ci-name { font-size: 14px; font-weight: 600; color: #0f172a; margin: 0 0 4px; }
.rsp-ci-price { font-size: 13px; color: #059669; font-weight: 700; }
.rsp-ci-ctrl { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
.rsp-ci-btn { width: 26px; height: 26px; border-radius: 6px; border: 1.5px solid #e2e8f0; background: white; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #475569; transition: all 0.15s; }
.rsp-ci-btn:hover { background: #f1f5f9; border-color: #cbd5e1; }
.rsp-sidebar-footer { padding: 20px 24px; border-top: 1px solid #e2e8f0; background: white; }

/* Order form */
.rsp-order-form { display: flex; flex-direction: column; gap: 12px; }
.rsp-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.rsp-form-label { font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 5px; display: block; }
.rsp-form-input {
  width: 100%;
  padding: 9px 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  color: #0f172a;
  background: #f8fafc;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}
.rsp-form-input:focus { border-color: #059669; background: white; }
.rsp-total-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 15px; font-weight: 700; color: #0f172a; border-top: 2px solid #f1f5f9; margin-top: 6px; }
.rsp-place-btn {
  width: 100%;
  background: linear-gradient(135deg,#059669,#10b981);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 12px;
  font-weight: 800;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  font-family: inherit;
  box-shadow: 0 4px 14px rgba(5,150,105,0.3);
}
.rsp-place-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(5,150,105,0.4); }
.rsp-place-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.rsp-success { text-align: center; padding: 32px 16px; }
.rsp-success-icon { width: 64px; height: 64px; background: #dcfce7; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }

@media (max-width: 768px) {
  .rsp-sidebar { width: 100%; right: -100%; }
  .rsp-form-row { grid-template-columns: 1fr; }
  .rsp-hero-content { padding: 0 16px; gap: 0; }
  .rsp-hero-stats { gap: 20px; }
}
`;

const RetailStorePage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  const [orderForm, setOrderForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    delivery_address: '',
    notes: '',
  });

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) try {
      const parsed = JSON.parse(u);
      setUser(parsed);
      setOrderForm(prev => ({
        ...prev,
        customer_name: parsed.full_name || '',
        customer_email: parsed.email || '',
        customer_phone: parsed.phone || '',
      }));
    } catch {}
  }, []);

  useEffect(() => {
    axios.get('/retail/products').then(r => {
      const data = r.data?.products || r.data || [];
      setProducts(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));

    axios.get('/retail/categories').then(r => {
      setCategories(r.data || []);
    }).catch(() => {});
  }, []);

  const loadCart = () => {
    if (!user) return;
    axios.get('/retail/cart').then(r => {
      const items = r.data?.items || r.data || [];
      setCartItems(Array.isArray(items) ? items : []);
    }).catch(() => {});
  };

  useEffect(() => { loadCart(); }, [user]);

  const addToCart = async (product) => {
    if (!user) return navigate('/login');
    try {
      await axios.post('/retail/cart/add', { product_id: product.id, quantity: 1 });
      loadCart();
      setCartOpen(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add to cart');
    }
  };

  const updateQty = async (itemId, newQty) => {
    if (newQty < 1) return removeItem(itemId);
    try {
      await axios.put('/retail/cart/item/' + itemId, { quantity: newQty });
      loadCart();
    } catch (_) {}
  };

  const removeItem = async (itemId) => {
    try {
      await axios.delete('/retail/cart/item/' + itemId);
      loadCart();
    } catch (_) {}
  };

  const placeOrder = async () => {
    if (cartItems.length === 0) return;
    setPlacingOrder(true);
    try {
      const res = await axios.post('/retail/orders/place', {
        delivery_type: orderForm.delivery_address ? 'delivery' : 'pickup',
        ...orderForm
      });
      const invoice = res.data?.data?.invoice_number || res.data?.invoice_number || 'N/A';
      setOrderSuccess(invoice);
      setCartItems([]);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

  const filtered = products.filter(p => {
    const matchSearch = !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.category_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || String(p.category_id) === String(catFilter);
    return matchSearch && matchCat && p.is_active !== 0 && p.is_active !== false;
  });

  const cartCount = cartItems.reduce((a, b) => a + (b.quantity || 0), 0);
  const cartTotal = cartItems.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);

  const imgSrc = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : 'http://localhost:5000' + url;
  };

  return (
    <div className="rsp-root">
      <style>{STYLES}</style>
      <PublicNav />

      {/* ─── Hero ─── */}
      <div className="rsp-hero">
        <div className="rsp-hero-orbs">
          <div className="rsp-hero-orb1" />
          <div className="rsp-hero-orb2" />
        </div>
        <div className="rsp-hero-grid" />
        <div className="rsp-hero-content">
          <div className="rsp-hero-text">
            <div className="rsp-hero-badge">
              <Zap size={13} /> Retail Marketplace
            </div>
            <h1 className="rsp-hero-title">
              Shop Premium <span>Commercial</span> Goods
            </h1>
            <p className="rsp-hero-sub">
              Discover high-quality products from our retail store — office supplies, electronics, furniture and more. Place your order directly and our sales team will confirm.
            </p>
            <div className="rsp-hero-stats">
              <div className="rsp-hero-stat">
                <div className="rsp-hero-stat-num">{products.length}+</div>
                <div className="rsp-hero-stat-label">Products</div>
              </div>
              <div className="rsp-hero-stat">
                <div className="rsp-hero-stat-num">{categories.length}</div>
                <div className="rsp-hero-stat-label">Categories</div>
              </div>
              <div className="rsp-hero-stat">
                <div className="rsp-hero-stat-num">24h</div>
                <div className="rsp-hero-stat-label">Fast Response</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Sticky Toolbar ─── */}
      <div className="rsp-toolbar">
        <div className="rsp-toolbar-inner">
          <button
            className={'rsp-cat-pill' + (catFilter === 'all' ? ' active' : '')}
            onClick={() => setCatFilter('all')}
          >
            All
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              className={'rsp-cat-pill' + (String(catFilter) === String(c.id) ? ' active' : '')}
              onClick={() => setCatFilter(String(c.id))}
            >
              {c.name}
            </button>
          ))}
          <div className="rsp-search" style={{ marginLeft: 'auto' }}>
            <Search size={15} color="#94a3b8" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
            />
          </div>
        </div>
      </div>

      {/* ─── Product Grid ─── */}
      <div className="rsp-main">
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>
              {catFilter === 'all' ? 'All Products' : categories.find(c => String(c.id) === catFilter)?.name || 'Products'}
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0' }}>{filtered.length} item{filtered.length !== 1 ? 's' : ''} found</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#059669', fontWeight: 600 }}>
            <TrendingUp size={15} /> Live Stock
          </div>
        </div>

        {loading ? (
          <div className="rsp-grid">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="rsp-shimmer" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', background: 'white', borderRadius: 20, border: '1px solid #e2e8f0' }}>
            <Package size={56} color="#cbd5e1" style={{ marginBottom: 16 }} />
            <h3 style={{ fontSize: 20, color: '#0f172a', margin: '0 0 8px' }}>No products found</h3>
            <p style={{ color: '#64748b', margin: 0 }}>Try a different search term or category.</p>
          </div>
        ) : (
          <div className="rsp-grid">
            {filtered.map((p, i) => (
              <div key={p.id} className="rsp-card" style={{ animationDelay: i * 0.05 + 's' }}>
                <div className="rsp-card-img-wrap">
                  {imgSrc(p.product_image) ? (
                    <img src={imgSrc(p.product_image)} className="rsp-card-img" alt={p.name} />
                  ) : (
                    <Package size={44} color="#cbd5e1" />
                  )}
                  {p.category_name && <div className="rsp-card-badge">{p.category_name}</div>}
                  {(!p.stock_quantity || p.stock_quantity <= 0) && (
                    <div className="rsp-card-oos">OUT OF STOCK</div>
                  )}
                </div>
                <div className="rsp-card-body">
                  <h3 className="rsp-card-name">{p.name}</h3>
                  {p.description && <p className="rsp-card-desc">{p.description}</p>}
                  <div className="rsp-card-footer">
                    <div>
                      <div className="rsp-price">{parseFloat(p.price || p.selling_price || 0).toLocaleString()} ETB</div>
                      <div className="rsp-price-sub">{p.stock_quantity > 0 ? p.stock_quantity + ' in stock' : 'Out of stock'}</div>
                    </div>
                    <button
                      className="rsp-add-btn"
                      disabled={!p.stock_quantity || p.stock_quantity <= 0}
                      onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                    >
                      <ShoppingCart size={16} /> Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Cart FAB ─── */}
      <button className="rsp-cart-fab" onClick={() => setCartOpen(true)}>
        <ShoppingCart size={26} />
        {cartCount > 0 && <div className="rsp-cart-badge">{cartCount}</div>}
      </button>

      {/* ─── Cart Overlay & Sidebar ─── */}
      <div className={'rsp-overlay' + (cartOpen ? ' open' : '')} onClick={() => setCartOpen(false)} />
      <div className={'rsp-sidebar' + (cartOpen ? ' open' : '')}>

        <div className="rsp-sidebar-header">
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
            <ShoppingCart size={20} color="#059669" /> My Cart
            {cartCount > 0 && <span style={{ background: '#059669', color: 'white', borderRadius: 99, padding: '2px 10px', fontSize: 12 }}>{cartCount}</span>}
          </h2>
          <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#64748b', borderRadius: 8 }}>
            <X size={22} />
          </button>
        </div>

        <div className="rsp-sidebar-items">
          {orderSuccess ? (
            <div className="rsp-success">
              <div className="rsp-success-icon">
                <CheckCircle size={32} color="#059669" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>Order Submitted!</h3>
              <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 4px' }}>Invoice: <strong style={{ color: '#059669' }}>{orderSuccess}</strong></p>
              <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 24px' }}>Our sales team will confirm your order shortly.</p>
              <button onClick={() => { setOrderSuccess(null); setCartOpen(false); }} style={{ background: '#059669', color: 'white', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                Continue Shopping
              </button>
            </div>
          ) : cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '60px 24px' }}>
              <ShoppingCart size={56} opacity={0.3} style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px', color: '#64748b' }}>Cart is empty</h3>
              <p style={{ fontSize: 13, margin: 0 }}>Add products to get started</p>
              <button onClick={() => setCartOpen(false)} style={{ marginTop: 20, background: '#059669', color: 'white', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                Browse Products <ArrowRight size={15} />
              </button>
            </div>
          ) : (
            <>
              {cartItems.map(item => (
                <div key={item.id} className="rsp-ci">
                  <div className="rsp-ci-img">
                    {imgSrc(item.product_image)
                      ? <img src={imgSrc(item.product_image)} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 10 }} alt={item.name} />
                      : <Package size={22} color="#cbd5e1" />
                    }
                  </div>
                  <div className="rsp-ci-info">
                    <div className="rsp-ci-name">{item.name}</div>
                    <div className="rsp-ci-price">{parseFloat(item.price).toLocaleString()} ETB</div>
                    <div className="rsp-ci-ctrl">
                      <button className="rsp-ci-btn" onClick={() => updateQty(item.id, item.quantity - 1)}><Minus size={12} /></button>
                      <span style={{ fontSize: 14, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                      <button className="rsp-ci-btn" onClick={() => updateQty(item.id, item.quantity + 1)}><Plus size={12} /></button>
                      <button onClick={() => removeItem(item.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', borderRadius: 6, padding: 4 }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {!orderSuccess && cartItems.length > 0 && (
          <div className="rsp-sidebar-footer">
            <div className="rsp-order-form">
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Order Details</div>
              <div className="rsp-form-row">
                <div>
                  <label className="rsp-form-label">Your Name *</label>
                  <input className="rsp-form-input" placeholder="Full name" value={orderForm.customer_name} onChange={e => setOrderForm({ ...orderForm, customer_name: e.target.value })} />
                </div>
                <div>
                  <label className="rsp-form-label">Phone</label>
                  <input className="rsp-form-input" placeholder="+251..." value={orderForm.customer_phone} onChange={e => setOrderForm({ ...orderForm, customer_phone: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="rsp-form-label">Email</label>
                <input className="rsp-form-input" placeholder="your@email.com" value={orderForm.customer_email} onChange={e => setOrderForm({ ...orderForm, customer_email: e.target.value })} />
              </div>
              <div>
                <label className="rsp-form-label">Delivery Address (optional)</label>
                <input className="rsp-form-input" placeholder="Leave blank for pickup" value={orderForm.delivery_address} onChange={e => setOrderForm({ ...orderForm, delivery_address: e.target.value })} />
              </div>
              <div>
                <label className="rsp-form-label">Notes</label>
                <input className="rsp-form-input" placeholder="Any special requests..." value={orderForm.notes} onChange={e => setOrderForm({ ...orderForm, notes: e.target.value })} />
              </div>
            </div>

            <div className="rsp-total-row">
              <span>Total</span>
              <span style={{ color: '#059669' }}>{cartTotal.toLocaleString()} ETB</span>
            </div>

            <button
              className="rsp-place-btn"
              onClick={placeOrder}
              disabled={placingOrder || !orderForm.customer_name}
            >
              {placingOrder ? 'Submitting...' : <><CheckCircle size={18} /> Submit Order to Sales</>}
            </button>
            {!user && (
              <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 10 }}>
                <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: '#059669', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline', fontSize: 12 }}>
                  Sign in
                </button> to save your order history
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RetailStorePage;
