import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/apiClient';
import { ShoppingCart, Search, Package, ChevronRight, Star, Truck, Shield, CreditCard } from 'lucide-react';

const styles = {
  container: { maxWidth: 1200, margin: '0 auto', padding: '0 20px' },
  hero: { background: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)', color: 'white', padding: '60px 20px', textAlign: 'center' },
  heroTitle: { fontSize: 36, fontWeight: 800, margin: '0 0 12px' },
  heroSub: { fontSize: 16, opacity: 0.9, maxWidth: 600, margin: '0 auto 24px' },
  section: { padding: '40px 0' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 },
  card: { background: 'white', borderRadius: 12, padding: '16px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' },
  price: { fontSize: 20, fontWeight: 800, color: '#059669', margin: '8px 0' },
  searchBar: { display: 'flex', alignItems: 'center', gap: 8, background: 'white', borderRadius: 10, padding: '10px 16px', maxWidth: 500, margin: '0 auto 24px' },
  badge: { display: 'inline-block', background: '#f0fdf4', color: '#059669', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 },
  featureGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 20, marginTop: 32 },
  featureCard: { textAlign: 'center', padding: '24px' },
};

const features = [
  { icon: <Truck size={32} />, title: 'Fast Delivery', desc: 'Get your supplies delivered to your campus or office' },
  { icon: <Shield size={32} />, title: 'Quality Assured', desc: 'All products are sourced from trusted suppliers' },
  { icon: <CreditCard size={32} />, title: 'Flexible Payment', desc: 'Pay by Cash, Telebirr, or Bank Transfer' },
  { icon: <Star size={32} />, title: 'Student Discounts', desc: 'Special pricing for SUTANA students' },
];

const RetailStorePage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([axios.get('/retail/products'), axios.get('/retail/categories')]);
        if (prodRes.status === 'success') setProducts(prodRes.data.products || []);
        if (catRes.status === 'success') setCategories(catRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const filtered = products.filter(p => {
    if (filterCategory && String(p.category_id) !== filterCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div>
      <div style={styles.hero}>
        <div style={styles.container}>
          <Package size={48} style={{ marginBottom: 16 }} />
          <h1 style={styles.heroTitle}>SUTANA Retail Store</h1>
          <p style={styles.heroSub}>Stationery, office supplies, electronics, furniture and more — for students, staff, and the community.</p>
          <div style={styles.searchBar}>
            <Search size={20} color="#94a3b8" />
            <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14 }} />
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.container}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={() => setFilterCategory('')} style={{ padding: '8px 16px', borderRadius: 20, border: `2px solid ${filterCategory === '' ? '#059669' : '#e2e8f0'}`, background: filterCategory === '' ? '#f0fdf4' : 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: filterCategory === '' ? '#059669' : '#64748b' }}>All</button>
            {categories.map(c => (
              <button key={c.id} onClick={() => setFilterCategory(String(c.id))} style={{ padding: '8px 16px', borderRadius: 20, border: `2px solid ${filterCategory === String(c.id) ? '#059669' : '#e2e8f0'}`, background: filterCategory === String(c.id) ? '#f0fdf4' : 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: filterCategory === String(c.id) ? '#059669' : '#64748b' }}>{c.name}</button>
            ))}
          </div>

          {loading ? <p style={{ textAlign: 'center', color: '#64748b' }}>Loading products...</p> : (
            <div style={styles.grid}>
              {filtered.length === 0 && <p style={{ color: '#94a3b8', gridColumn: '1 / -1', textAlign: 'center' }}>No products found.</p>}
              {filtered.map(p => (
                <div key={p.id} style={styles.card} onClick={() => navigate(`/contact`)}>
                  {p.product_image && <img src={p.product_image} alt={p.name} style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, marginBottom: 10 }} />}
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{p.category_name}</div>
                  <h4 style={{ margin: '0 0 4px', fontSize: 14 }}>{p.name}</h4>
                  <p style={styles.price}>{parseFloat(p.price).toFixed(2)} ETB</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: p.stock_quantity > 0 ? '#059669' : '#dc2626' }}>{p.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}</span>
                    <span style={styles.badge}>{p.stock_quantity > 5 ? 'Available' : p.stock_quantity > 0 ? 'Low Stock' : 'Sold Out'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ ...styles.section, background: '#f8fafc' }}>
        <div style={styles.container}>
          <h2 style={{ textAlign: 'center', margin: '0 0 8px', fontSize: 24 }}>Why Shop at SUTANA Retail?</h2>
          <p style={{ textAlign: 'center', color: '#64748b', maxWidth: 600, margin: '0 auto 0', fontSize: 14 }}>Everything you need in one place, with campus-friendly prices.</p>
          <div style={styles.featureGrid}>
            {features.map((f, i) => (
              <div key={i} style={styles.featureCard}>
                <div style={{ color: '#059669', marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ margin: '0 0 6px', fontSize: 16 }}>{f.title}</h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ ...styles.section, textAlign: 'center' }}>
        <div style={styles.container}>
          <h2 style={{ fontSize: 22, margin: '0 0 8px' }}>Ready to Order?</h2>
          <p style={{ color: '#64748b', marginBottom: 20, fontSize: 14 }}>Visit our campus store or place an order online through your customer portal.</p>
          <button onClick={() => navigate('/login')} style={{ background: '#059669', color: 'white', border: 'none', padding: '14px 36px', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}><ShoppingCart size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} /> Sign In to Order</button>
        </div>
      </div>
    </div>
  );
};

export default RetailStorePage;
