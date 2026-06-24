import React, { useState, useEffect } from 'react';
import axios from '../../services/apiClient';
import { Search, ShoppingCart, Plus, Minus, Trash2, CheckCircle, Clock, X, DollarSign, Send } from 'lucide-react';

const PAYMENT_LABELS = { cash: 'Cash', telebirr: 'Telebirr', bank_transfer: 'Bank Transfer', credit: 'Credit' };

const styles = {
  posContainer: { display: 'flex', gap: 20, height: 'calc(100vh - 160px)', padding: '0 0 20px 0' },
  productsSection: { flex: 1, overflowY: 'auto' },
  productGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 },
  productCard: { background: 'white', borderRadius: 10, padding: '12px', cursor: 'pointer', border: '1px solid #e2e8f0', transition: 'all 0.15s' },
  price: { fontWeight: 700, fontSize: 16, color: '#059669', margin: '4px 0' },
  stock: { fontSize: 11, margin: 0 },
  cartSection: { width: 360, background: 'white', borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  cartItems: { flex: 1, overflowY: 'auto', marginBottom: 12 },
  cartItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #f1f5f9' },
  itemInfo: { flex: 1 },
  itemControls: { display: 'flex', alignItems: 'center', gap: 6 },
  deleteBtn: { background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 6, width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  checkoutPanel: { borderTop: '1px solid #e2e8f0', paddingTop: 12 },
  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  paymentMethods: { display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 },
  checkoutBtn: { width: '100%', background: '#059669', color: 'white', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' },
  searchBar: { display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '8px 12px' },
};

export default () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [shift, setShift] = useState(null);
  const [shiftLoading, setShiftLoading] = useState(true);
  const [showOpenShift, setShowOpenShift] = useState(false);
  const [openingFloat, setOpeningFloat] = useState('2000');
  const [shiftType, setShiftType] = useState('morning');
  const [showCloseShift, setShowCloseShift] = useState(false);
  const [physicalCash, setPhysicalCash] = useState('');
  const [diffReason, setDiffReason] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [closeResult, setCloseResult] = useState(null);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => { fetchShift(); fetchProducts(); }, [fetchKey]);

  const fetchShift = async () => {
    try {
      setShiftLoading(true);
      const res = await axios.get('/retail/shifts/current');
      if (res.status === 'success') setShift(res.data);
      else setShift(null);
    } catch { setShift(null); }
    finally { setShiftLoading(false); }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([axios.get('/retail/products'), axios.get('/retail/categories')]);
      if (prodRes.status === 'success') setProducts(prodRes.data.products.filter(p => p.is_active));
      if (catRes.status === 'success') setCategories(catRes.data);
    } catch (err) { console.error('Failed to load products', err); }
    finally { setLoading(false); }
  };

  const handleOpenShift = async () => {
    try {
      const res = await axios.post('/retail/shifts/open', { opening_float: parseFloat(openingFloat), shift_type: shiftType });
      if (res.status === 'success') { setShift(res.data); setShowOpenShift(false); }
    } catch (err) { alert(err.response?.data?.message || err.message || 'Failed to open shift'); }
  };

  const filteredProducts = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.category_name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCategory || String(p.category_id) === filterCategory;
    return matchSearch && matchCat;
  });

  const addToCart = (product) => {
    if (product.stock_quantity <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) return prev;
        return prev.map(item => item.product_id === product.id ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price } : item);
      }
      return [...prev, { product_id: product.id, name: product.name, price: parseFloat(product.price), quantity: 1, subtotal: parseFloat(product.price) }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.product_id === id) {
        const newQ = item.quantity + delta;
        if (newQ <= 0) return null;
        const prod = products.find(p => p.id === id);
        if (prod && newQ > prod.stock_quantity) return item;
        return { ...item, quantity: newQ, subtotal: newQ * item.price };
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(item => item.product_id !== id));
  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);
    try {
      const res = await axios.post('/retail/pos/checkout', {
        items: cart.map(c => ({ product_id: c.product_id, quantity: c.quantity })),
        payment_method: paymentMethod
      });
      if (res.status === 'success') {
        setLastReceipt({ invoice_number: res.data.invoice_number, total_amount: res.data.total_amount, payment_method: paymentMethod, items: [...cart], date: new Date().toLocaleString() });
        setCart([]);
        fetchProducts();
      }
    } catch (err) { alert(err.response?.data?.message || err.message || 'Checkout failed.'); }
    finally { setIsCheckingOut(false); }
  };

  const handleCloseShift = async () => {
    setIsClosing(true);
    try {
      const res = await axios.post('/retail/shifts/close', { physical_cash_counted: parseFloat(physicalCash), difference_reason: diffReason || null });
      if (res.status === 'success') { setCloseResult(res.data); setShift(null); }
    } catch (err) { alert(err.response?.data?.message || err.message || 'Failed to close shift'); }
    finally { setIsClosing(false); }
  };

  const expectedCash = shift ? parseFloat(shift.opening_float) + (closeResult?.cash_collected || 0) : 0;
  const diffAmount = physicalCash !== '' ? (parseFloat(physicalCash || 0) - expectedCash).toFixed(2) : null;

  if (lastReceipt) {
    return (
      <div style={{ maxWidth: 500, margin: '3rem auto', background: 'white', borderRadius: 12, padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', textAlign: 'center' }}>
        <CheckCircle size={52} color="#10b981" style={{ marginBottom: '1rem' }} />
        <h2 style={{ margin: '0 0 0.5rem', color: '#1e293b' }}>Sale Completed!</h2>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{lastReceipt.date}</p>
        <div style={{ background: '#f8fafc', borderRadius: 8, padding: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ color: '#64748b' }}>Invoice:</span><strong>{lastReceipt.invoice_number}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ color: '#64748b' }}>Payment:</span><strong>{PAYMENT_LABELS[lastReceipt.payment_method]}</strong></div>
          {lastReceipt.items.map(i => (
            <div key={i.product_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569', padding: '4px 0', borderTop: '1px solid #e2e8f0' }}>
              <span>{i.name} &times; {i.quantity}</span><span>{i.subtotal.toFixed(2)} ETB</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontWeight: 700, fontSize: 16 }}>
            <span>Total</span><span style={{ color: '#10b981' }}>{parseFloat(lastReceipt.total_amount).toFixed(2)} ETB</span>
          </div>
        </div>
        <button onClick={() => setLastReceipt(null)} style={{ width: '100%', background: '#10b981', color: 'white', border: 'none', padding: '12px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 15 }}>New Sale</button>
      </div>
    );
  }

  if (closeResult) {
    return (
      <div style={{ maxWidth: 600, margin: '2rem auto', padding: '0 1rem' }}>
        <div style={{ background: 'white', borderRadius: 12, padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <CheckCircle size={56} color="#10b981" style={{ marginBottom: '1rem' }} />
          <h2 style={{ margin: '0 0 0.25rem', color: '#065f46' }}>Shift Closed!</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Shift closed. Hand over cash to the Store Manager.</p>
          <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '1rem', marginBottom: '1rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ color: '#64748b' }}>Opening Float</span><strong>{closeResult.opening_float?.toFixed(2)} ETB</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ color: '#64748b' }}>Cash Collected</span><strong>{closeResult.cash_collected?.toFixed(2)} ETB</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ color: '#64748b' }}>Expected in Drawer</span><strong>{closeResult.expected_cash?.toFixed(2)} ETB</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ color: '#64748b' }}>Physical Counted</span><strong>{closeResult.physical_cash_counted?.toFixed(2)} ETB</strong></div>
            {closeResult.difference !== 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}><span>Difference</span><strong>{closeResult.difference > 0 ? '+' : ''}{closeResult.difference?.toFixed(2)} ETB</strong></div>}
          </div>
          <button onClick={() => { setCloseResult(null); setFetchKey(k => k + 1); }} style={{ background: '#10b981', color: 'white', border: 'none', padding: '12px 32px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Open New Shift</button>
        </div>
      </div>
    );
  }

  if (!shift && !shiftLoading && showOpenShift) {
    return (
      <div style={{ maxWidth: 460, margin: '4rem auto', padding: '0 1rem' }}>
        <div style={{ background: 'white', borderRadius: 16, padding: '2.5rem 2rem', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <Clock size={48} color="#10b981" style={{ marginBottom: '1rem' }} />
          <h2 style={{ margin: '0 0 0.25rem', color: '#1e293b' }}>Open New Shift</h2>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: '1.5rem' }}>Record your opening cash float.</p>
          <div style={{ textAlign: 'left', marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Shift</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['morning', 'afternoon'].map(s => (
                <label key={s} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 8, border: `2px solid ${shiftType === s ? '#10b981' : '#e2e8f0'}`, background: shiftType === s ? '#f0fdf4' : 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: shiftType === s ? '#059669' : '#64748b' }}>
                  <input type="radio" checked={shiftType === s} onChange={() => setShiftType(s)} style={{ display: 'none' }} /> {s.charAt(0).toUpperCase() + s.slice(1)}
                </label>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Opening Cash Float (ETB)</label>
            <input type="number" value={openingFloat} onChange={e => setOpeningFloat(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 15, fontWeight: 700, boxSizing: 'border-box' }} />
          </div>
          <button onClick={handleOpenShift} style={{ width: '100%', background: '#10b981', color: 'white', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}><DollarSign size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Open Shift</button>
          <button onClick={() => setShowOpenShift(false)} style={{ width: '100%', background: 'none', border: 'none', padding: '10px', marginTop: 8, color: '#94a3b8', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
        </div>
      </div>
    );
  }

  if (!shift && !shiftLoading) {
    return (
      <div style={{ maxWidth: 460, margin: '4rem auto', padding: '0 1rem' }}>
        <div style={{ background: 'white', borderRadius: 16, padding: '3rem 2rem', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <ShoppingCart size={48} color="#94a3b8" style={{ marginBottom: '1rem' }} />
          <h2 style={{ margin: '0 0 0.25rem', color: '#1e293b' }}>No Open Shift</h2>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: '1.5rem' }}>Open a shift before selling.</p>
          <button onClick={() => setShowOpenShift(true)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '12px 32px', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Open Shift</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.posContainer}>
      {shift && (
        <div style={{ position: 'absolute', top: 70, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 16, alignItems: 'center', padding: '8px 16px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0', fontSize: 13, zIndex: 10 }}>
          <span style={{ color: '#059669', fontWeight: 600 }}><Clock size={16} style={{ verticalAlign: 'middle' }} /> {shift.shift_type?.charAt(0).toUpperCase() + shift.shift_type?.slice(1)}</span>
          <span style={{ color: '#64748b' }}>Float: <strong>{parseFloat(shift.opening_float).toFixed(2)} ETB</strong></span>
          <button onClick={() => setShowCloseShift(true)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}><X size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Close Shift</button>
        </div>
      )}

      {showCloseShift && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 480 }}>
            <h2 style={{ margin: '0 0 1rem', fontSize: 18 }}>Close Shift</h2>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Physical Cash Counted *</label>
              <input type="number" value={physicalCash} onChange={e => setPhysicalCash(e.target.value)} placeholder="Count cash in drawer" style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1.5px solid #e2e8f0', boxSizing: 'border-box' }} />
            </div>
            {diffAmount !== null && (
              <div style={{ padding: '8px 12px', borderRadius: 6, background: diffAmount === '0.00' ? '#f0fdf4' : '#fef2f2', fontSize: 12, marginBottom: '1rem' }}>
                <span style={{ fontWeight: 600 }}>Expected: {expectedCash.toFixed(2)} ETB</span> | <span style={{ fontWeight: 600, color: diffAmount === '0.00' ? '#10b981' : '#ef4444' }}>Diff: {diffAmount} ETB</span>
                {diffAmount !== '0.00' && <input type="text" value={diffReason} onChange={e => setDiffReason(e.target.value)} placeholder="Explain difference..." style={{ width: '100%', marginTop: 6, padding: '6px', borderRadius: 4, border: '1px solid #fca5a5', boxSizing: 'border-box' }} />}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowCloseShift(false)} style={{ flex: 1, background: '#f1f5f9', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCloseShift} disabled={isClosing || !physicalCash} style={{ flex: 1, background: !physicalCash ? '#e2e8f0' : '#ef4444', color: !physicalCash ? '#94a3b8' : 'white', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 700, cursor: !physicalCash ? 'not-allowed' : 'pointer' }}>
                {isClosing ? 'Closing...' : <><Send size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Close Shift</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.productsSection}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={styles.searchBar}>
            <Search size={18} />
            <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} style={{ border: 'none', outline: 'none', flex: 1, fontSize: 13 }} />
          </div>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '0 10px', fontSize: 13 }}>
            <option value="">All</option>
            {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
          </select>
        </div>

        {loading ? <p style={{ color: '#64748b' }}>Loading products...</p> : (
          <div style={styles.productGrid}>
            {filteredProducts.length === 0 && <p style={{ color: '#94a3b8' }}>No products found.</p>}
            {filteredProducts.map(p => (
              <div key={p.id} onClick={() => addToCart(p)} style={{ ...styles.productCard, opacity: p.stock_quantity <= 0 ? 0.5 : 1 }}>
                {p.product_image && <img src={p.product_image} alt={p.name} style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 6, marginBottom: 6 }} />}
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.category_name}</div>
                <h4 style={{ margin: '4px 0', fontSize: 14 }}>{p.name.length > 25 ? p.name.slice(0, 25) + '...' : p.name}</h4>
                <p style={styles.price}>{parseFloat(p.price).toFixed(2)} ETB</p>
                <p style={{ ...styles.stock, color: p.stock_quantity <= p.reorder_level ? '#ef4444' : '#10b981' }}>Stock: {p.stock_quantity}{p.stock_quantity <= 0 && ' — OUT'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.cartSection}>
        <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}><ShoppingCart size={20} /> Sale</h3>
        <div style={styles.cartItems}>
          {cart.length === 0 ? <p style={{ color: '#94a3b8', textAlign: 'center' }}>Add products</p> : cart.map(item => (
            <div key={item.product_id} style={styles.cartItem}>
              <div style={styles.itemInfo}>
                <strong style={{ fontSize: 13 }}>{item.name}</strong>
                <div style={{ color: '#64748b', fontSize: 12 }}>{item.price.toFixed(2)} ETB</div>
              </div>
              <div style={styles.itemControls}>
                <button onClick={() => updateQuantity(item.product_id, -1)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 6, width: 26, height: 26, cursor: 'pointer' }}><Minus size={13} /></button>
                <span style={{ fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.product_id, 1)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 6, width: 26, height: 26, cursor: 'pointer' }}><Plus size={13} /></button>
                <button onClick={() => removeFromCart(item.product_id)} style={styles.deleteBtn}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
        <div style={styles.checkoutPanel}>
          <div style={styles.totalRow}>
            <span>Total:</span>
            <strong style={{ fontSize: 22, color: '#059669' }}>{totalAmount.toFixed(2)} ETB</strong>
          </div>
          <div style={styles.paymentMethods}>
            {Object.entries(PAYMENT_LABELS).map(([val, label]) => (
              <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 13 }}>
                <input type="radio" value={val} checked={paymentMethod === val} onChange={e => setPaymentMethod(e.target.value)} /> {label}
              </label>
            ))}
          </div>
          <button style={styles.checkoutBtn} disabled={cart.length === 0 || isCheckingOut} onClick={handleCheckout}>
            {isCheckingOut ? 'Processing...' : '\u2713 Complete Sale'}
          </button>
        </div>
      </div>
    </div>
  );
};
