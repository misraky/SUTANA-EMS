import React, { useState, useEffect } from 'react';
import axios from '../../services/apiClient';
import { Search, ShoppingCart, Plus, Minus, Trash2, CheckCircle, Clock, X, DollarSign, Send, FileText } from 'lucide-react';
import styles from './FarmingPOS.module.css';

const PAYMENT_LABELS = { cash: 'Cash', telebirr: 'Telebirr', bank_transfer: 'Bank Transfer' };

const FarmingPOS = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);

  // Shift state
  const [shift, setShift] = useState(null);
  const [shiftLoading, setShiftLoading] = useState(true);
  const [showOpenShift, setShowOpenShift] = useState(false);
  const [openingFloat, setOpeningFloat] = useState('2000');
  const [shiftType, setShiftType] = useState('morning');
  const [showCloseShift, setShowCloseShift] = useState(false);
  const [physicalCash, setPhysicalCash] = useState('');
  const [diffReason, setDiffReason] = useState('');
  const [refundsGiven, setRefundsGiven] = useState('0');
  const [expensesTransport, setExpensesTransport] = useState('0');
  const [expensesLoading, setExpensesLoading] = useState('0');
  const [notes, setNotes] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [closeResult, setCloseResult] = useState(null);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    fetchShift();
    fetchProducts();
  }, [fetchKey]);

  const fetchShift = async () => {
    try {
      setShiftLoading(true);
      const res = await axios.get('/farming/shifts/current');
      if (res.status === 'success') setShift(res.data);
      else setShift(null);
    } catch { setShift(null); }
    finally { setShiftLoading(false); }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        axios.get('/farming/products'),
        axios.get('/farming/categories')
      ]);
      if (prodRes.status === 'success') setProducts(prodRes.data.filter(p => p.is_active));
      if (catRes.status === 'success') setCategories(catRes.data);
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  };

  // ── OPEN SHIFT ──
  const handleOpenShift = async () => {
    try {
      const res = await axios.post('/farming/shifts/open', {
        opening_float: parseFloat(openingFloat),
        shift_type: shiftType
      });
      if (res.status === 'success') {
        setShift(res.data);
        setShowOpenShift(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to open shift');
    }
  };

  // ── CART / CHECKOUT ──
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
        return prev.map(item => item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
          : item
        );
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
      const res = await axios.post('/farming/pos/checkout', {
        items: cart.map(c => ({ product_id: c.product_id, quantity: c.quantity })),
        payment_method: paymentMethod
      });
      if (res.status === 'success') {
        setLastReceipt({
          invoice_number: res.data.invoice_number,
          total_amount: res.data.total_amount,
          payment_method: paymentMethod,
          items: [...cart],
          date: new Date().toLocaleString()
        });
        setCart([]);
        fetchProducts();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Checkout failed.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  // ── CLOSE SHIFT ──
  const handleCloseShift = async () => {
    setIsClosing(true);
    try {
      const res = await axios.post('/farming/shifts/close', {
        physical_cash_counted: parseFloat(physicalCash),
        difference_reason: diffReason || null,
        refunds_given: parseFloat(refundsGiven),
        expenses_transport: parseFloat(expensesTransport),
        expenses_loading: parseFloat(expensesLoading),
        notes: notes || null
      });
      if (res.status === 'success') {
        setCloseResult(res.data);
        setShift(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to close shift');
    } finally {
      setIsClosing(false);
    }
  };

  const expectedCash = shift ? parseFloat(shift.opening_float) + (closeResult?.cash_collected || 0) : 0;
  const diffAmount = physicalCash !== '' ? (parseFloat(physicalCash || 0) - expectedCash).toFixed(2) : null;

  // ── RECEIPT VIEW ──
  if (lastReceipt) {
    return (
      <div style={{ maxWidth: 500, margin: '3rem auto', background: 'white', borderRadius: 12, padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', textAlign: 'center' }}>
        <CheckCircle size={52} color="#10b981" style={{ marginBottom: '1rem' }} />
        <h2 style={{ margin: '0 0 0.5rem', color: '#1e293b' }}>Sale Completed!</h2>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{lastReceipt.date}</p>
        <div style={{ background: '#f8fafc', borderRadius: 8, padding: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#64748b' }}>Invoice:</span>
            <strong>{lastReceipt.invoice_number}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#64748b' }}>Payment:</span>
            <strong>{PAYMENT_LABELS[lastReceipt.payment_method]}</strong>
          </div>
          {lastReceipt.items.map(i => (
            <div key={i.product_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569', padding: '4px 0', borderTop: '1px solid #e2e8f0' }}>
              <span>{i.name} &times; {i.quantity}</span>
              <span>{i.subtotal.toFixed(2)} ETB</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontWeight: 700, fontSize: 16 }}>
            <span>Total</span>
            <span style={{ color: '#10b981' }}>{parseFloat(lastReceipt.total_amount).toFixed(2)} ETB</span>
          </div>
        </div>
        <button onClick={() => setLastReceipt(null)} style={{ width: '100%', background: '#10b981', color: 'white', border: 'none', padding: '12px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 15 }}>
          New Sale
        </button>
      </div>
    );
  }

  // ── SHIFT CLOSED RESULT ──
  if (closeResult) {
    const cashToFinance = closeResult.cash_to_handover;
    return (
      <div style={{ maxWidth: 600, margin: '2rem auto', padding: '0 1rem' }}>
        <div style={{ background: 'white', borderRadius: 12, padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <CheckCircle size={56} color="#10b981" style={{ marginBottom: '1rem' }} />
          <h2 style={{ margin: '0 0 0.25rem', color: '#065f46' }}>Shift Closed!</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Report submitted to Finance. Hand over cash and completed form to the Farming Manager.</p>

          <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '1rem', marginBottom: '1rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ color: '#64748b' }}>Total Sales (System)</span><strong>{closeResult.total_sales.toFixed(2)} ETB</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ color: '#64748b' }}>Transactions</span><strong>{closeResult.transaction_count}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ color: '#64748b' }}>Cash Sales</span><strong>{closeResult.cash_collected.toFixed(2)} ETB</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ color: '#64748b' }}>Telebirr</span><strong>{closeResult.telebirr_collected.toFixed(2)} ETB</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ color: '#64748b' }}>Bank Transfer</span><strong>{closeResult.transfer_collected.toFixed(2)} ETB</strong></div>
            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ color: '#64748b' }}>Opening Float</span><strong>{closeResult.opening_float.toFixed(2)} ETB</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ color: '#64748b' }}>Expected Cash in Drawer</span><strong>{closeResult.expected_cash.toFixed(2)} ETB</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ color: '#64748b' }}>Physical Cash Counted</span><strong>{closeResult.physical_cash_counted.toFixed(2)} ETB</strong></div>
            {closeResult.difference !== 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, color: '#ef4444' }}><span>Difference</span><strong>{closeResult.difference > 0 ? '+' : ''}{closeResult.difference.toFixed(2)} ETB</strong></div>}
            <hr style={{ border: 'none', borderTop: '2px solid #10b981', margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16 }}><span style={{ fontWeight: 700 }}>Cash to Handover (to Manager)</span><strong style={{ color: '#059669' }}>{cashToFinance.toFixed(2)} ETB</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}><span>Float kept for next shift</span><strong>{closeResult.opening_float.toFixed(2)} ETB</strong></div>
          </div>

          <div style={{ background: '#fffbeb', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: 12, color: '#92400e', textAlign: 'left' }}>
            <strong>Next step:</strong> Report to Farming Manager with the physical cash ({closeResult.physical_cash_counted.toFixed(2)} ETB). The Manager will verify, keep the float, and handover {cashToFinance.toFixed(2)} ETB to Finance.
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setCloseResult(null); setFetchKey(k => k + 1); }}
              style={{ flex: 1, background: '#f1f5f9', color: '#475569', border: 'none', padding: '10px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
              Open New Shift
            </button>
            <button onClick={() => window.location.href = '/farming/finance-report'}
              style={{ flex: 1, background: '#10b981', color: 'white', border: 'none', padding: '10px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
              <FileText size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Go to Finance Form
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── OPEN SHIFT MODAL ──
  if (!shift && !shiftLoading && showOpenShift) {
    return (
      <div style={{ maxWidth: 460, margin: '4rem auto', padding: '0 1rem' }}>
        <div style={{ background: 'white', borderRadius: 16, padding: '2.5rem 2rem', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <Clock size={48} color="#10b981" style={{ marginBottom: '1rem' }} />
          <h2 style={{ margin: '0 0 0.25rem', color: '#1e293b' }}>Open New Shift</h2>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: '1.5rem' }}>Record your opening cash float and start accepting sales.</p>

          <div style={{ textAlign: 'left', marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Shift</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['morning', 'afternoon'].map(s => (
                <label key={s} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '10px', borderRadius: 8, border: `2px solid ${shiftType === s ? '#10b981' : '#e2e8f0'}`,
                  background: shiftType === s ? '#f0fdf4' : 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                  color: shiftType === s ? '#059669' : '#64748b'
                }}>
                  <input type="radio" checked={shiftType === s} onChange={() => setShiftType(s)} style={{ display: 'none' }} />
                  {s === 'morning' ? '\u2617' : '\u2600'} {s.charAt(0).toUpperCase() + s.slice(1)}
                </label>
              ))}
            </div>
          </div>

          <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Opening Cash Float (ETB)</label>
            <input type="number" value={openingFloat} onChange={e => setOpeningFloat(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 15, fontWeight: 700, boxSizing: 'border-box' }} />
          </div>

          <button onClick={handleOpenShift}
            style={{ width: '100%', background: '#10b981', color: 'white', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
            <DollarSign size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Open Shift &mdash; Start Selling
          </button>
          <button onClick={() => setShowOpenShift(false)}
            style={{ width: '100%', background: 'none', border: 'none', padding: '10px', marginTop: 8, color: '#94a3b8', cursor: 'pointer', fontSize: 12 }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ── NO SHIFT + NOT OPENING ──
  if (!shift && !shiftLoading) {
    return (
      <div style={{ maxWidth: 460, margin: '4rem auto', padding: '0 1rem' }}>
        <div style={{ background: 'white', borderRadius: 16, padding: '3rem 2rem', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <ShoppingCart size={48} color="#94a3b8" style={{ marginBottom: '1rem' }} />
          <h2 style={{ margin: '0 0 0.25rem', color: '#1e293b' }}>No Open Shift</h2>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: '1.5rem' }}>You need to open a shift before you can sell products.</p>
          <button onClick={() => setShowOpenShift(true)}
            style={{ background: '#10b981', color: 'white', border: 'none', padding: '12px 32px', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
            Open Shift
          </button>
        </div>
      </div>
    );
  }

  // ── MAIN POS ──
  return (
    <div className={styles.posContainer}>
      {/* Shift Status Bar */}
      {shift && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 16px', background: '#f0fdf4', borderRadius: 10,
          border: '1px solid #bbf7d0', marginBottom: 12, fontSize: 13
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#059669', fontWeight: 600 }}>
              <Clock size={16} /> Shift: {shift.shift_type?.charAt(0).toUpperCase() + shift.shift_type?.slice(1) || 'Morning'}
            </span>
            <span style={{ color: '#64748b' }}>Float: <strong>{parseFloat(shift.opening_float).toFixed(2)} ETB</strong></span>
          </div>
          <button onClick={() => setShowCloseShift(true)}
            style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 18px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
            <X size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Close Shift
          </button>
        </div>
      )}

      {/* CLOSE SHIFT MODAL */}
      {showCloseShift && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 560,
            maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: 18, color: '#1e293b' }}>Close Shift</h2>
              <button onClick={() => setShowCloseShift(false)} style={{ background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}><X size={18} /></button>
            </div>

            {/* Sales Summary */}
            <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '12px 16px', marginBottom: '1rem' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 13, color: '#065f46' }}>Daily Sales Summary</h3>
              <p style={{ margin: 0, color: '#059669', fontWeight: 800, fontSize: 20 }}>{closeResult?.total_sales?.toFixed(2) || '---'} ETB</p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>Sales data will be auto-calculated when you close.</p>
            </div>

            {/* Cash Handover */}
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: 13, color: '#1e293b', margin: '0 0 8px' }}>Cash Handover</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 3 }}>Opening Float</label>
                  <input type="text" value={parseFloat(shift.opening_float).toFixed(2)} readOnly
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1.5px solid #e2e8f0', fontSize: 12, background: '#f8fafc', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 3 }}>Physical Cash Counted *</label>
                  <input type="number" step="0.01" value={physicalCash} onChange={e => setPhysicalCash(e.target.value)}
                    placeholder="Count cash in drawer"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1.5px solid #f59e0b', fontSize: 12, boxSizing: 'border-box' }} />
                </div>
              </div>
              {diffAmount !== null && (
                <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 6, background: diffAmount === '0.00' ? '#f0fdf4' : '#fef2f2', fontSize: 12 }}>
                  <span style={{ fontWeight: 600 }}>Expected: {expectedCash.toFixed(2)} ETB</span>
                  {' | '}
                  <span style={{ fontWeight: 600, color: diffAmount === '0.00' ? '#10b981' : '#ef4444' }}>
                    Difference: {parseFloat(diffAmount) > 0 ? '+' : ''}{diffAmount} ETB
                    {diffAmount !== '0.00' && (parseFloat(diffAmount) > 0 ? ' (surplus)' : ' (shortage)')}
                  </span>
                  {diffAmount !== '0.00' && (
                    <input type="text" value={diffReason} onChange={e => setDiffReason(e.target.value)}
                      placeholder="Explain the difference..."
                      style={{ width: '100%', marginTop: 6, padding: '6px 8px', borderRadius: 4, border: '1px solid #fca5a5', fontSize: 11, boxSizing: 'border-box' }} />
                  )}
                </div>
              )}
            </div>

            {/* Expenses & Notes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 3 }}>Refunds</label>
                <input type="number" value={refundsGiven} onChange={e => setRefundsGiven(e.target.value)} style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1.5px solid #e2e8f0', fontSize: 12, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 3 }}>Transport</label>
                <input type="number" value={expensesTransport} onChange={e => setExpensesTransport(e.target.value)} style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1.5px solid #e2e8f0', fontSize: 12, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 3 }}>Loading</label>
                <input type="number" value={expensesLoading} onChange={e => setExpensesLoading(e.target.value)} style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1.5px solid #e2e8f0', fontSize: 12, boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 3 }}>Notes for Manager / Finance</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1.5px solid #e2e8f0', fontSize: 12, resize: 'vertical', boxSizing: 'border-box' }}
                placeholder="Any issues, observations..." />
            </div>

            <div style={{ background: '#fffbeb', borderRadius: 8, padding: '10px 12px', marginBottom: '1rem', fontSize: 12, color: '#92400e' }}>
              After closing, you cannot make further sales. The shift report will be sent to Finance automatically. Hand over physical cash to the Farming Manager.
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowCloseShift(false)}
                style={{ flex: 1, background: '#f1f5f9', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', color: '#475569' }}>
                Cancel
              </button>
              <button onClick={handleCloseShift} disabled={isClosing || !physicalCash}
                style={{
                  flex: 1, background: !physicalCash ? '#e2e8f0' : '#ef4444', color: !physicalCash ? '#94a3b8' : 'white',
                  border: 'none', padding: '10px', borderRadius: 8, fontWeight: 700, cursor: !physicalCash ? 'not-allowed' : 'pointer'
                }}>
                {isClosing ? 'Closing...' : <><Send size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Confirm &amp; Close Shift</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Left: Products */}
      <div className={styles.productsSection}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div className={styles.searchBar} style={{ flex: 1 }}>
            <Search size={18} className={styles.searchIcon} />
            <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            style={{ border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '0 10px', fontSize: 13, color: '#475569' }}
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
          </select>
        </div>

        {loading ? <p style={{ color: '#64748b' }}>Loading products...</p> : (
          <div className={styles.productGrid}>
            {filteredProducts.length === 0 && <p style={{ color: '#94a3b8' }}>No products found.</p>}
            {filteredProducts.map(p => (
              <div
                key={p.id}
                className={`${styles.productCard} ${p.stock_quantity <= 0 ? styles.outOfStock : ''}`}
                onClick={() => addToCart(p)}
              >
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{p.category_name}</div>
                <h4 style={{ margin: '0 0 6px', fontSize: 14 }}>{p.name}</h4>
                <p className={styles.price}>{parseFloat(p.price).toFixed(2)} ETB</p>
                <p className={styles.stock} style={{ color: p.stock_quantity <= p.reorder_level ? '#ef4444' : '#10b981' }}>
                  Stock: {p.stock_quantity}
                  {p.stock_quantity <= 0 && <span style={{ fontWeight: 700 }}> &mdash; OUT OF STOCK</span>}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Cart */}
      <div className={styles.cartSection}>
        <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShoppingCart size={20} /> Current Sale
        </h3>

        <div className={styles.cartItems}>
          {cart.length === 0 ? (
            <p className={styles.emptyCart}>Add products to start a sale</p>
          ) : (
            cart.map(item => (
              <div key={item.product_id} className={styles.cartItem}>
                <div className={styles.itemInfo}>
                  <strong>{item.name}</strong>
                  <span style={{ color: '#64748b', fontSize: 13 }}>{item.price.toFixed(2)} ETB each</span>
                </div>
                <div className={styles.itemControls}>
                  <button onClick={() => updateQuantity(item.product_id, -1)}><Minus size={13} /></button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product_id, 1)}><Plus size={13} /></button>
                  <button onClick={() => removeFromCart(item.product_id)} className={styles.deleteBtn}><Trash2 size={13} /></button>
                </div>
                <div className={styles.itemSubtotal}>{item.subtotal.toFixed(2)} ETB</div>
              </div>
            ))
          )}
        </div>

        <div className={styles.checkoutPanel}>
          <div className={styles.totalRow}>
            <span>Total:</span>
            <strong style={{ fontSize: 20, color: '#10b981' }}>{totalAmount.toFixed(2)} ETB</strong>
          </div>

          <div className={styles.paymentMethods}>
            {Object.entries(PAYMENT_LABELS).map(([val, label]) => (
              <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="radio" value={val} checked={paymentMethod === val} onChange={e => setPaymentMethod(e.target.value)} />
                {label}
              </label>
            ))}
          </div>

          <button
            className={styles.checkoutBtn}
            disabled={cart.length === 0 || isCheckingOut}
            onClick={handleCheckout}
          >
            {isCheckingOut ? 'Processing...' : '\u2713 Complete Sale'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FarmingPOS;