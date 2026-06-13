import React, { useState, useEffect, useRef } from 'react';
import axios from '../../services/apiClient';
import { Search, ShoppingCart, Plus, Minus, Trash2, CheckCircle, Printer } from 'lucide-react';
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
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
      const payload = {
        items: cart.map(c => ({ product_id: c.product_id, quantity: c.quantity })),
        payment_method: paymentMethod
      };
      const res = await axios.post('/farming/pos/checkout', payload);
      if (res.status === 'success') {
        setLastReceipt({
          invoice_number: res.data.invoice_number,
          total_amount: res.data.total_amount,
          payment_method: paymentMethod,
          items: [...cart],
          date: new Date().toLocaleString()
        });
        setCart([]);
        fetchData();
      }
    } catch (err) {
      alert(err.message || 'Checkout failed. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handlePrintManualForm = () => {
    const win = window.open('', '_blank');
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-GB');
    const timeStr = today.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const rows = [1,2,3,4,5,6,7,8].map(i =>
      `<tr><td>${i}</td><td></td><td></td><td></td><td></td><td></td></tr>`
    ).join('');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
<title>SUTANA Farming Manual Sale Form</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;font-size:12px;color:#000;background:#fff}
.toolbar{display:flex;gap:10px;justify-content:center;padding:14px;background:#1e293b;position:sticky;top:0;z-index:99}
.toolbar button{padding:10px 28px;border:none;border-radius:6px;font-size:14px;font-weight:bold;cursor:pointer}
.btn-dl{background:#10b981;color:#fff}
.btn-cl{background:#ef4444;color:#fff}
@media print{.toolbar{display:none!important}@page{size:A4 portrait;margin:12mm}}
.page{width:210mm;min-height:297mm;padding:12mm 16mm;margin:0 auto}
/* header */
.hdr{border:1.5px solid #000;padding:10px 14px;margin-bottom:8px;text-align:center}
.hdr h1{font-size:14px;text-transform:uppercase;letter-spacing:1px}
.hdr p{font-size:9px;color:#444;margin-top:3px}
/* info grid */
.info{display:grid;grid-template-columns:1fr 1fr;border:1px solid #000;margin-bottom:8px}
.ic{padding:5px 8px;border-right:1px solid #000;border-bottom:1px solid #000}
.ic:nth-child(even){border-right:none}
.ic:nth-last-child(-n+2){border-bottom:none}
.il{font-size:9px;color:#555;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px}
.iv{font-size:12px;font-weight:bold;border-bottom:1px solid #000;min-height:18px;padding-bottom:2px}
/* section box */
.sb{border:1px solid #000;margin-bottom:8px}
.st{background:#222;color:#fff;padding:4px 10px;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:.5px}
.sbody{padding:8px 10px}
/* products table */
table{width:100%;border-collapse:collapse}
th,td{border:1px solid #000;padding:6px 8px;font-size:11px}
th{background:#f0f0f0;font-size:10px;text-transform:uppercase;text-align:center;font-weight:bold}
td:first-child{text-align:center;width:26px}
td:nth-child(3),td:nth-child(4){text-align:center;width:48px}
td:nth-child(5),td:nth-child(6){text-align:right;width:90px}
.trow td{font-weight:bold;background:#f8f8f8}
/* payment */
.pgrid{display:flex;border:1px solid #ddd}
.pc{flex:1;padding:5px 8px;border-right:1px solid #ddd;font-size:11px}
.pc:last-child{border-right:none}
.pl{font-size:9px;color:#555;margin-bottom:3px}
.pv{border-bottom:1px solid #000;min-height:17px}
/* checkboxes */
.cbrow{display:flex;gap:20px;margin:6px 0 10px;flex-wrap:wrap}
.cbi{display:flex;align-items:center;gap:5px;font-size:11px}
.cb{display:inline-block;width:13px;height:13px;border:1.5px solid #000;vertical-align:middle;flex-shrink:0}
/* signatures */
.srow{display:flex}
.sc{flex:1;padding:7px 10px;border-right:1px solid #000}
.sc:last-child{border-right:none}
.slbl{font-size:9px;color:#555;margin-bottom:22px}
.sline{border-bottom:1px solid #000;min-height:1px}
/* footer */
.ft{margin-top:10px;text-align:center;font-size:9px;color:#666;border-top:1px dashed #aaa;padding-top:6px}
</style></head><body>
<div class="toolbar">
  <button class="btn-dl" onclick="window.print()">⬇ Download / Print PDF</button>
  <button class="btn-cl" onclick="window.close()">✕ Close</button>
</div>
<div class="page">
  <div class="hdr">
    <h1>&#127807; SUTANA Enterprise &mdash; Farming Division</h1>
    <p>MANUAL CASHIER SALE FORM &nbsp;|&nbsp; Copy 1: Cashier &nbsp;&bull;&nbsp; Copy 2: Customer &nbsp;&bull;&nbsp; Original: Finance Officer (end of shift)</p>
  </div>
  <div class="info">
    <div class="ic"><div class="il">Date</div><div class="iv">${dateStr}</div></div>
    <div class="ic"><div class="il">Time</div><div class="iv">${timeStr}</div></div>
    <div class="ic"><div class="il">Cashier Name</div><div class="iv">&nbsp;</div></div>
    <div class="ic">
      <div class="il">Shift</div>
      <div class="iv" style="display:flex;gap:16px">
        <span><span class="cb"></span> Morning</span>
        <span><span class="cb"></span> Afternoon</span>
        <span><span class="cb"></span> Evening</span>
      </div>
    </div>
  </div>
  <div class="sb">
    <div class="st">Products Sold</div>
    <table>
      <thead><tr><th>#</th><th>Product Name</th><th>Unit</th><th>Qty</th><th>Unit Price (ETB)</th><th>Total (ETB)</th></tr></thead>
      <tbody>
        ${rows}
        <tr class="trow"><td colspan="5" style="text-align:right;padding-right:10px">SUBTOTAL</td><td></td></tr>
        <tr class="trow"><td colspan="5" style="text-align:right;padding-right:10px;font-style:italic;font-size:10px">VAT (0% &mdash; Agriculture Exempt)</td><td style="text-align:center;font-size:10px">0.00</td></tr>
        <tr class="trow"><td colspan="5" style="text-align:right;padding-right:10px;font-size:13px">TOTAL SALE</td><td style="font-size:13px;border-top:2px solid #000"></td></tr>
      </tbody>
    </table>
  </div>
  <div class="sb">
    <div class="st">Payment Details</div>
    <div class="sbody">
      <div style="font-size:11px;font-weight:bold;margin-bottom:5px">Payment Method:</div>
      <div class="cbrow">
        <div class="cbi"><span class="cb"></span> Cash</div>
        <div class="cbi"><span class="cb"></span> Telebirr</div>
        <div class="cbi"><span class="cb"></span> Bank Transfer</div>
        <div class="cbi"><span class="cb"></span> Credit (Manager Approval Required)</div>
      </div>
      <div class="pgrid">
        <div class="pc"><div class="pl">Amount Received (ETB)</div><div class="pv"></div></div>
        <div class="pc"><div class="pl">Change Given (ETB)</div><div class="pv"></div></div>
        <div class="pc"><div class="pl">Transaction Ref # (Telebirr / Transfer)</div><div class="pv"></div></div>
      </div>
    </div>
  </div>
  <div class="sb">
    <div class="st">Customer Information (Optional for Walk-in)</div>
    <div class="sbody">
      <div class="pgrid" style="border:none">
        <div class="pc" style="border-right:1px solid #ddd"><div class="pl">Customer Name</div><div class="pv"></div></div>
        <div class="pc" style="border-right:1px solid #ddd"><div class="pl">Phone Number</div><div class="pv"></div></div>
        <div class="pc"><div class="pl">Delivery Address (if applicable)</div><div class="pv"></div></div>
      </div>
    </div>
  </div>
  <div class="sb">
    <div class="st">Authorization &amp; Handover Signatures</div>
    <div class="srow">
      <div class="sc"><div class="slbl">Cashier Signature</div><div class="sline"></div></div>
      <div class="sc"><div class="slbl">Farming Manager Signature (Verified)</div><div class="sline"></div></div>
      <div class="sc"><div class="slbl">Finance Officer Signature (Received)</div><div class="sline"></div></div>
    </div>
  </div>
  <div class="ft">&#9888; All manual sales must be entered into the POS system and physical cash handed over to the Finance Officer by END OF SHIFT &nbsp;|&nbsp; Form No: _____________  &nbsp;|&nbsp; SUTANA Enterprise &mdash; Farming Division</div>
</div>
</body></html>`);
    win.document.close();
  };

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
              <span>{i.name} × {i.quantity}</span>
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

  return (
    <div className={styles.posContainer}>
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
                  {p.stock_quantity <= 0 && <span style={{ fontWeight: 700 }}> — OUT OF STOCK</span>}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Cart */}
      <div className={styles.cartSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingCart size={20} /> Current Sale
          </h3>
          <button
            onClick={handlePrintManualForm}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: '#475569' }}
          >
            <Printer size={14} /> Manual Form
          </button>
        </div>

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
            {isCheckingOut ? 'Processing...' : '✓ Complete Sale'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FarmingPOS;
