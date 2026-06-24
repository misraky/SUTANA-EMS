import React, { useState, useEffect, useRef } from 'react';
import axios from '../../services/apiClient';
import {
  ShoppingCart, Search, Plus, Minus, Trash2, Package,
  CheckCircle, AlertCircle, CreditCard, Banknote, Receipt,
  X, RefreshCw, User, Phone, Hash, Printer
} from 'lucide-react';

/* ─── helpers ─── */
const fmt = (n) => parseFloat(n || 0).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Toast = ({ msg, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const ok = type === 'success';
  return (
    <div style={{
      position: 'fixed', top: 20, right: 20, zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: 10,
      background: ok ? '#f0fdf4' : '#fef2f2',
      border: `1.5px solid ${ok ? '#86efac' : '#fca5a5'}`,
      borderRadius: 12, padding: '12px 18px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)', maxWidth: 380,
    }}>
      {ok ? <CheckCircle size={18} color="#16a34a" /> : <AlertCircle size={18} color="#dc2626" />}
      <span style={{ fontSize: 13, flex: 1, color: ok ? '#166534' : '#991b1b', fontWeight: 500 }}>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={14} /></button>
    </div>
  );
};

/* ─── Receipt Modal ─── */
const ReceiptModal = ({ receipt, onClose }) => {
  const printRef = useRef();
  const handlePrint = () => {
    const w = window.open('', '_blank');
    w.document.write('<html><head><title>Receipt</title><style>body{font-family:monospace;padding:20px;max-width:320px;margin:0 auto}hr{border:1px dashed #999}table{width:100%}td{padding:2px 0}.bold{font-weight:700}.right{text-align:right}.center{text-align:center}.big{font-size:18px}</style></head><body>');
    w.document.write(printRef.current.innerHTML);
    w.document.write('</body></html>');
    w.document.close();
    w.print();
  };
  if (!receipt) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'white', borderRadius: 20, width: 420, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Receipt size={20} color="#059669" /> Receipt
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={22} /></button>
        </div>
        <div ref={printRef} style={{ padding: 24 }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>SUTANA ERP</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Retail Sales Receipt</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{new Date().toLocaleString()}</div>
          </div>
          <hr style={{ border: '1px dashed #e2e8f0', margin: '12px 0' }} />
          <div style={{ fontSize: 12, marginBottom: 8 }}>
            <strong>Invoice:</strong> {receipt.invoice_number}<br />
            {receipt.customer_name && <><strong>Customer:</strong> {receipt.customer_name}<br /></>}
            {receipt.customer_phone && <><strong>Phone:</strong> {receipt.customer_phone}<br /></>}
            <strong>Payment:</strong> {receipt.payment_method}
            {receipt.payment_ref && <> — Ref: {receipt.payment_ref}</>}
          </div>
          <hr style={{ border: '1px dashed #e2e8f0', margin: '12px 0' }} />
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '4px 0', color: '#64748b' }}>Item</th>
                <th style={{ textAlign: 'center', padding: '4px 0', color: '#64748b' }}>Qty</th>
                <th style={{ textAlign: 'right', padding: '4px 0', color: '#64748b' }}>Price</th>
              </tr>
            </thead>
            <tbody>
              {(receipt.items || []).map((item, i) => (
                <tr key={i}>
                  <td style={{ padding: '4px 0', maxWidth: 160 }}>{item.name}</td>
                  <td style={{ textAlign: 'center', padding: '4px 0' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', fontWeight: 600 }}>{fmt(item.subtotal)} ETB</td>
                </tr>
              ))}
            </tbody>
          </table>
          <hr style={{ border: '1px dashed #e2e8f0', margin: '12px 0' }} />
          {receipt.discount_amount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#dc2626', marginBottom: 4 }}>
              <span>Discount</span><span>-{fmt(receipt.discount_amount)} ETB</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 16, color: '#059669' }}>
            <span>TOTAL</span><span>{fmt(receipt.total_amount)} ETB</span>
          </div>
          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: '#94a3b8' }}>Thank you for your business!</div>
        </div>
        <div style={{ padding: '0 24px 24px', display: 'flex', gap: 10 }}>
          <button onClick={handlePrint} style={{ flex: 1, background: '#0f172a', color: 'white', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Printer size={16} /> Print
          </button>
          <button onClick={onClose} style={{ flex: 1, background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            New Sale
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Component ─── */
const RetailOrderPage = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]); // [{product, quantity}]
  const [toast, setToast] = useState(null);
  const [shift, setShift] = useState(null);
  const [shiftLoading, setShiftLoading] = useState(true);
  const [openingFloat, setOpeningFloat] = useState('');
  const [openingShift, setOpeningShift] = useState(false);

  const [payMethod, setPayMethod] = useState('Cash');
  const [payRef, setPayRef] = useState('');
  const [discount, setDiscount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [checking, setChecking] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const notify = (msg, type = 'success') => setToast({ msg, type });

  /* fetch shift */
  const fetchShift = async () => {
    setShiftLoading(true);
    try {
      const r = await axios.get('/retail/shifts/current');
      setShift(r.data || null);
    } catch { setShift(null); }
    finally { setShiftLoading(false); }
  };

  /* fetch products */
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const r = await axios.get('/retail/products');
      const data = r.data?.products || r.data || [];
      setProducts(Array.isArray(data) ? data.filter(p => p.is_active !== 0 && p.is_active !== false) : []);
    } catch { setProducts([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchShift(); fetchProducts(); }, []);

  /* open shift */
  const handleOpenShift = async () => {
    if (!openingFloat && openingFloat !== 0) return notify('Enter opening float amount', 'error');
    setOpeningShift(true);
    try {
      await axios.post('/retail/shifts/open', { opening_float: parseFloat(openingFloat) || 0, shift_type: 'morning' });
      notify('Shift opened successfully!');
      setOpeningFloat('');
      fetchShift();
    } catch (e) { notify(e.response?.data?.message || 'Failed to open shift', 'error'); }
    finally { setOpeningShift(false); }
  };

  /* cart helpers */
  const addToCart = (product) => {
    setCart(prev => {
      const ex = prev.find(c => c.product.id === product.id);
      if (ex) {
        if (ex.quantity >= product.stock_quantity) { notify('Max stock reached', 'error'); return prev; }
        return prev.map(c => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      if (product.stock_quantity < 1) { notify('Out of stock', 'error'); return prev; }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const setQty = (productId, qty) => {
    if (qty < 1) return removeFromCart(productId);
    setCart(prev => prev.map(c => c.product.id === productId
      ? { ...c, quantity: Math.min(qty, c.product.stock_quantity) }
      : c
    ));
  };

  const removeFromCart = (productId) => setCart(prev => prev.filter(c => c.product.id !== productId));
  const clearCart = () => setCart([]);

  /* totals */
  const subtotal = cart.reduce((s, c) => s + parseFloat(c.product.price || 0) * c.quantity, 0);
  const discountAmt = subtotal * (Math.min(parseFloat(discount) || 0, 5) / 100);
  const total = subtotal - discountAmt;

  /* checkout */
  const handleCheckout = async () => {
    if (cart.length === 0) return notify('Cart is empty', 'error');
    if (!shift) return notify('No open shift. Please open a shift first.', 'error');
    if (payMethod !== 'Cash' && !payRef) return notify('Payment reference required for non-cash methods', 'error');
    setChecking(true);
    try {
      const r = await axios.post('/retail/pos/checkout', {
        items: cart.map(c => ({ product_id: c.product.id, quantity: c.quantity })),
        payment_method: payMethod,
        payment_ref: payRef || null,
        discount_percent: parseFloat(discount) || 0,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
      });
      const data = r.data || {};
      setReceipt({
        invoice_number: data.invoice_number,
        total_amount: data.total_amount,
        discount_amount: discountAmt,
        payment_method: payMethod,
        payment_ref: payRef,
        customer_name: customerName,
        customer_phone: customerPhone,
        items: cart.map(c => ({ name: c.product.name, quantity: c.quantity, subtotal: parseFloat(c.product.price) * c.quantity })),
      });
      clearCart();
      setPayRef('');
      setDiscount('');
      setCustomerName('');
      setCustomerPhone('');
      fetchProducts();
    } catch (e) { notify(e.response?.data?.message || 'Checkout failed', 'error'); }
    finally { setChecking(false); }
  };

  const filtered = products.filter(p =>
    !search ||
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase()) ||
    p.category_name?.toLowerCase().includes(search.toLowerCase())
  );

  /* ─── No Shift screen ─── */
  if (shiftLoading) return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading…</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, fontFamily: "'Inter', sans-serif", height: '100%' }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {receipt && <ReceiptModal receipt={receipt} onClose={() => { setReceipt(null); fetchProducts(); }} />}

      {/* ─── Header bar ─── */}
      <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '12px 12px 0 0', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingCart size={20} color="#34d399" /> Walk-In Retail Sale
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Process walk-in customer sales with cash or bank payment</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {shift ? (
            <div style={{ background: 'rgba(5,150,105,0.2)', border: '1px solid rgba(5,150,105,0.4)', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 7, height: 7, background: '#34d399', borderRadius: '50%' }} /> Shift Open
            </div>
          ) : (
            <div style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, color: '#fca5a5' }}>No Shift</div>
          )}
          <button onClick={() => { fetchShift(); fetchProducts(); }} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* ─── Open shift panel ─── */}
      {!shift && (
        <div style={{ background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: 12, padding: '20px 24px', margin: '16px 0', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <AlertCircle size={22} color="#d97706" />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#92400e', fontSize: 14 }}>No open shift detected</div>
            <div style={{ fontSize: 12, color: '#b45309', marginTop: 2 }}>Open a shift to process sales. Enter your opening float:</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="number" min="0" step="0.01" placeholder="Opening float (ETB)"
              value={openingFloat} onChange={e => setOpeningFloat(e.target.value)}
              style={{ padding: '8px 12px', border: '1.5px solid #fcd34d', borderRadius: 8, fontSize: 13, width: 180, outline: 'none', background: 'white' }}
            />
            <button onClick={handleOpenShift} disabled={openingShift} style={{ background: '#d97706', color: 'white', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, cursor: 'pointer', fontSize: 13, opacity: openingShift ? 0.7 : 1 }}>
              {openingShift ? 'Opening…' : 'Open Shift'}
            </button>
          </div>
        </div>
      )}

      {/* ─── Main POS layout ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 20, flex: 1, minHeight: 0, marginTop: 16 }}>

        {/* ── LEFT: Product Catalog ── */}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '8px 14px', flex: 1, transition: '0.2s' }}>
              <Search size={15} color="#94a3b8" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, SKU, category…"
                style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: 13, fontFamily: 'inherit', color: '#0f172a' }}
              />
            </div>
            <span style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>{filtered.length} items</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {loading ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>Loading products…</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))', gap: 12 }}>
                {filtered.map(p => {
                  const oos = !p.stock_quantity || p.stock_quantity <= 0;
                  const inCart = cart.find(c => c.product.id === p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => !oos && addToCart(p)}
                      style={{
                        border: inCart ? '2px solid #059669' : '1.5px solid #e2e8f0',
                        borderRadius: 12, overflow: 'hidden', cursor: oos ? 'not-allowed' : 'pointer',
                        opacity: oos ? 0.55 : 1, background: 'white', transition: 'all 0.2s',
                        boxShadow: inCart ? '0 4px 14px rgba(5,150,105,0.2)' : 'none',
                      }}
                    >
                      <div style={{ position: 'relative', height: 110, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {p.product_image ? (
                          <img
                            src={p.product_image.startsWith('http') ? p.product_image : 'http://localhost:5000' + p.product_image}
                            alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : <Package size={32} color="#cbd5e1" />}
                        {inCart && (
                          <div style={{ position: 'absolute', top: 6, right: 6, background: '#059669', color: 'white', borderRadius: '50%', width: 22, height: 22, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {inCart.quantity}
                          </div>
                        )}
                        {oos && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white' }}>OUT OF STOCK</div>}
                      </div>
                      <div style={{ padding: '10px 12px' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 2, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>{p.sku} • {p.stock_quantity} left</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#059669' }}>{fmt(p.price)} <span style={{ fontSize: 10, fontWeight: 500 }}>ETB</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Cart + Payment ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Cart */}
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 7 }}>
                <ShoppingCart size={16} color="#059669" /> Cart
                {cart.length > 0 && <span style={{ background: '#059669', color: 'white', borderRadius: 99, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>{cart.reduce((a, b) => a + b.quantity, 0)}</span>}
              </h3>
              {cart.length > 0 && (
                <button onClick={clearCart} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Trash2 size={13} /> Clear
                </button>
              )}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#cbd5e1', padding: '40px 0' }}>
                  <ShoppingCart size={44} opacity={0.3} style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Click products to add to cart</p>
                </div>
              ) : (
                cart.map(({ product, quantity }) => (
                  <div key={product.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f1f5f9', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {product.product_image
                        ? <img src={product.product_image.startsWith('http') ? product.product_image : 'http://localhost:5000' + product.product_image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                        : <Package size={16} color="#cbd5e1" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</div>
                      <div style={{ fontSize: 12, color: '#059669', fontWeight: 700 }}>{fmt(parseFloat(product.price) * quantity)} ETB</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => setQty(product.id, quantity - 1)} style={{ width: 24, height: 24, borderRadius: 6, border: '1.5px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}><Minus size={11} /></button>
                      <input
                        type="number" min="1" max={product.stock_quantity}
                        value={quantity}
                        onChange={e => setQty(product.id, parseInt(e.target.value) || 1)}
                        style={{ width: 36, textAlign: 'center', border: '1.5px solid #e2e8f0', borderRadius: 6, fontSize: 13, fontWeight: 700, padding: '2px 4px', outline: 'none', fontFamily: 'inherit' }}
                      />
                      <button onClick={() => setQty(product.id, quantity + 1)} style={{ width: 24, height: 24, borderRadius: 6, border: '1.5px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}><Plus size={11} /></button>
                      <button onClick={() => removeFromCart(product.id)} style={{ marginLeft: 4, background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', borderRadius: 6, padding: 2 }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Payment Form */}
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: '18px' }}>
            <h4 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Payment & Customer</h4>

            {/* Customer info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  <User size={10} style={{ marginRight: 4 }} />Customer Name
                </label>
                <input
                  value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Optional"
                  style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 12, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  <Phone size={10} style={{ marginRight: 4 }} />Phone
                </label>
                <input
                  value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="+251..."
                  style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 12, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
            </div>

            {/* Payment method */}
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Payment Method</label>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {['Cash', 'Bank Transfer', 'Mobile Money', 'Cheque'].map(m => (
                <button
                  key={m} onClick={() => setPayMethod(m)}
                  style={{
                    flex: 1, padding: '8px 4px', borderRadius: 8, border: '1.5px solid',
                    borderColor: payMethod === m ? '#059669' : '#e2e8f0',
                    background: payMethod === m ? '#f0fdf4' : '#f8fafc',
                    color: payMethod === m ? '#059669' : '#64748b',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                >
                  {m === 'Cash' ? '💵' : m === 'Bank Transfer' ? '🏦' : m === 'Mobile Money' ? '📱' : '📄'} {m}
                </button>
              ))}
            </div>

            {payMethod !== 'Cash' && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  <Hash size={10} style={{ marginRight: 4 }} />Payment Reference *
                </label>
                <input
                  value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="Transaction ID / Cheque No."
                  style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 12, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Discount % (max 5%)</label>
              <input
                type="number" min="0" max="5" step="0.1"
                value={discount} onChange={e => setDiscount(Math.min(5, parseFloat(e.target.value) || 0))}
                placeholder="0"
                style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 12, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
              />
            </div>

            {/* Totals */}
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                <span>Subtotal</span><span>{fmt(subtotal)} ETB</span>
              </div>
              {discountAmt > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#dc2626', marginBottom: 4 }}>
                  <span>Discount ({discount}%)</span><span>-{fmt(discountAmt)} ETB</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 800, color: '#059669', paddingTop: 8, borderTop: '1px solid #e2e8f0', marginTop: 4 }}>
                <span>TOTAL</span><span>{fmt(total)} ETB</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={checking || cart.length === 0 || !shift}
              style={{
                width: '100%', background: cart.length > 0 && shift
                  ? 'linear-gradient(135deg,#059669,#10b981)'
                  : '#e2e8f0',
                color: cart.length > 0 && shift ? 'white' : '#94a3b8',
                border: 'none', padding: '14px', borderRadius: 12,
                fontWeight: 800, fontSize: 15, cursor: checking || cart.length === 0 || !shift ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s', fontFamily: 'inherit',
                boxShadow: cart.length > 0 && shift ? '0 4px 14px rgba(5,150,105,0.35)' : 'none',
              }}
            >
              {checking ? 'Processing…' : <><CreditCard size={18} /> Complete Sale & Print Receipt</>}
            </button>
            {!shift && <p style={{ fontSize: 11, color: '#ef4444', textAlign: 'center', margin: '8px 0 0', fontWeight: 600 }}>⚠ Open a shift above before processing sales</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RetailOrderPage;
