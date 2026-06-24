import React, { useState, useEffect, useMemo } from 'react';
import salesService from '../../services/salesService';
import apiClient from '../../services/apiClient';
import {
  ShoppingCart, Plus, Minus, Trash2, X, Search, Sprout, Package,
  AlertTriangle, CheckCircle, CreditCard, Building2, DollarSign,
  LogOut, LogIn, ListOrdered, Eye
} from 'lucide-react';
import styles from './FarmingPOS.module.css';

const PAYMENT_METHODS = [
  { value: 'Cash', icon: DollarSign, color: '#059669' },
  { value: 'Telebirr', icon: CreditCard, color: '#2563eb' },
  { value: 'Bank Transfer', icon: Building2, color: '#7c3aed' }
];

const generateTxRef = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TXN-${ts}-${rnd}`;
};

const FarmingPOS = () => {
  /* ── Products ── */
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  /* ── Stats ── */
  const [stats, setStats] = useState(null);

  /* ── Cart ── */
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [processing, setProcessing] = useState(false);

  /* ── Shift ── */
  const [shift, setShift] = useState(null);
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [shiftAction, setShiftAction] = useState(null);
  const [openingBalance, setOpeningBalance] = useState('');
  const [physicalCashCounted, setPhysicalCashCounted] = useState('');
  const [closingNote, setClosingNote] = useState('');
  const [shiftProcessing, setShiftProcessing] = useState(false);

  /* ── Image Preview ── */
  const [previewImage, setPreviewImage] = useState(null);

  /* ── Online Orders (inline) ── */
  const [awaitingOrders, setAwaitingOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [payingOrderId, setPayingOrderId] = useState(null);
  const [payingMethod, setPayingMethod] = useState('Cash');

  /* ── Feedback ── */
  const [message, setMessage] = useState(null);
  const [receipt, setReceipt] = useState(null);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  /* ── Data fetching ── */
  const fetchShift = async () => {
    try {
      const res = await apiClient.get('/farming/shifts/current');
      const s = res?.data?.data || res?.data;
      if (s && s.id) {
        setShift(s);
      } else {
        setShift(null);
        /* auto-prompt shift opening when no open shift */
        openShiftDialog();
      }
    } catch (_) {
      setShift(null);
      openShiftDialog();
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await salesService.getPOSProducts({ source: 'farming', limit: 500 });
      const data = res?.data || res;
      const prods = data?.products || [];
      setProducts(prods);
      const cats = [...new Set(prods.filter(p => p.category_name).map(p => p.category_name))];
      setCategories(cats);
    } catch (_) { showMsg('error', 'Failed to load products'); }
    finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const res = await apiClient.get('/farming/overview/stats');
      const data = res?.data || res;
      if (data) setStats({ ...data, lowStockItems: data.lowStockProducts?.length || 0 });
    } catch (_) {}
  };

  useEffect(() => {
    fetchProducts();
    fetchStats();
    fetchShift();
    fetchAwaitingOrders();
  }, []);

  /* ── Derived ── */
  const filtered = useMemo(() => {
    let list = products;
    if (activeCategory !== 'all') list = list.filter(p => p.category_name === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q));
    }
    return list;
  }, [products, activeCategory, search]);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartSubtotal = cart.reduce((s, i) => s + i.quantity * i.selling_price, 0);
  const TAX_RATE = 0.15;
  const cartTotal = cartSubtotal * (1 + TAX_RATE);

  /* ── Cart actions ── */
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  };

  const removeItem = (id) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  /* ── Checkout ── */
  const openCheckout = () => {
    if (!shift) { showMsg('error', 'Open a shift first'); return; }
    setCheckoutStep('payment');
    setPaymentMethod('Cash');
    setAmountPaid(cartTotal.toFixed(2));
    setCustomerName('');
    setCustomerPhone('');
  };

  const openShiftDialog = () => {
    setOpeningBalance('');
    setPhysicalCashCounted('');
    setClosingNote('');
    setShowShiftDialog(true);
  };

  const closeShiftDialog = () => {
    setShowShiftDialog(false);
  };

  const handleCheckout = async () => {
    if (!shift) { showMsg('error', 'Open a shift first'); return; }
    if (cart.length === 0) { showMsg('error', 'Cart is empty'); return; }
    try {
      setProcessing(true);
      const pm = paymentMethod;
      const autoRef = generateTxRef();
      const rawPaid = pm === 'Cash' ? amountPaid : cartTotal;
      const paid = parseFloat(parseFloat(rawPaid || cartTotal).toFixed(2));
      if (pm === 'Cash' && (isNaN(paid) || paid < cartTotal)) {
        showMsg('error', isNaN(paid) ? 'Enter a valid amount' : `Amount (${paid.toFixed(2)}) is less than total (${cartTotal.toFixed(2)})`);
        setProcessing(false);
        return;
      }
      /* Sync client cart → server cart */
      await salesService.clearCart();
      for (const item of cart) {
        const pid = parseInt(item.id, 10);
        const qty = parseInt(item.quantity, 10);
        if (!pid || pid < 1 || !qty || qty < 1) {
          showMsg('error', `Invalid item: ${item.name}`);
          setProcessing(false);
          return;
        }
        await salesService.addToCart({ productId: pid, quantity: qty });
      }
      /* Build payload matching backend checkoutValidation rules */
      const payload = {
        paymentMethod: pm,
        amountPaid: paid,
        paymentReference: autoRef,
      };
      if (customerName.trim()) {
        payload.customer = { name: customerName.trim() };
        const phone = customerPhone.trim();
        if (phone) payload.customer.phone = phone;
      }
      console.log('🔵 Checkout payload:', JSON.stringify(payload, null, 2));
      const res = await salesService.createSale(payload);
      const sale = res?.data?.sale || res?.data || res;
      /* Update stock in local products state immediately (no refresh needed) */
      setProducts(prev => prev.map(p => {
        const sold = cart.find(c => String(c.id) === String(p.id));
        return sold ? { ...p, stock_quantity: Math.max(0, (p.stock_quantity || 0) - sold.quantity) } : p;
      }));
      setReceipt(sale);
      setCart([]);
      setCheckoutStep(null);
      setShowCart(false);
      showMsg('success', `Sale complete — Invoice #${sale.invoice_number || sale.id}`);
      fetchStats();
      setTimeout(() => setReceipt(null), 15000);
    } catch (err) {
      const body = err.response?.data;
      const fieldErr = body?.errors?.[0]?.message;
      const msg = fieldErr || body?.message || err.message;
      console.error('🔴 Checkout failed — full response:', JSON.stringify(body || err, null, 2));
      showMsg('error', msg || 'Checkout failed');
    } finally { setProcessing(false); }
  };

  /* ── Shift actions (optimistic) ── */
  const openShift = async () => {
    const prevShift = shift;
    setShift({ id: '...', status: 'OPEN', opened_at: new Date().toISOString() });
    closeShiftDialog();
    setShiftProcessing(true);
    try {
      await apiClient.post('/farming/shifts/open', { opening_float: parseFloat(parseFloat(openingBalance || '0').toFixed(2)) });
      showMsg('success', 'Shift opened');
      fetchShift();
    } catch (err) {
      setShift(prevShift);
      const detail = err.response?.data?.errors?.[0]?.message || err.response?.data?.message;
      showMsg('error', detail || err.message || 'Failed to open shift');
    } finally { setShiftProcessing(false); }
  };

  const closeShift = async () => {
    const counted = parseFloat(physicalCashCounted);
    if (isNaN(counted) || counted < 0) {
      showMsg('error', 'Enter a valid cash amount in drawer');
      return;
    }
    const prevShift = shift;
    setShift(null);
    closeShiftDialog();
    setShiftProcessing(true);
    try {
      await apiClient.post('/farming/shifts/close', {
        physical_cash_counted: parseFloat(counted.toFixed(2)),
        difference_reason: closingNote.trim() || undefined
      });
      showMsg('success', 'Shift closed');
    } catch (err) {
      setShift(prevShift);
      const detail = err.response?.data?.errors?.[0]?.message || err.response?.data?.message;
      showMsg('error', detail || err.message || 'Failed to close shift');
    } finally { setShiftProcessing(false); }
  };

  /* ── Online orders (inline) ── */
  const fetchAwaitingOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await apiClient.get('/farming/admin/orders?status=AWAITING_PAYMENT');
      const orders = res?.data?.orders || res?.orders || [];
      setAwaitingOrders(orders);
    } catch (_) {} finally { setLoadingOrders(false); }
  };

  const processOrderPayment = async (orderId, method) => {
    if (!shift) { showMsg('error', 'Open a shift first'); return; }
    try {
      setProcessing(true);
      const methodMap = { Cash: 'cash', Telebirr: 'telebirr', 'Bank Transfer': 'bank_transfer' };
      const res = await apiClient.patch(`/farming/admin/orders/${orderId}/status`, {
        status: 'READY_FOR_PICKUP', payment_method: methodMap[method] || 'cash', payment_reference: generateTxRef()
      });
      const orderData = res?.data?.order || res?.order;
      if (orderData) setReceipt({ ...orderData, payment_method: method });
      const paidOrder = awaitingOrders.find(o => o.id === orderId);
      if (paidOrder?.items) {
        setProducts(prev => prev.map(p => {
          const ordered = paidOrder.items.find(i => {
            const fpId = parseInt((p.sku || '').replace('FARM-', ''), 10);
            return fpId === i.product_id;
          });
          return ordered ? { ...p, stock_quantity: Math.max(0, (p.stock_quantity || 0) - ordered.quantity) } : p;
        }));
      }
      showMsg('success', `Order #${paidOrder?.invoice_number || orderId} marked as paid (${method})`);
      setPayingOrderId(null);
      setPayingMethod('Cash');
      fetchAwaitingOrders();
      fetchProducts();
      fetchStats();
      setTimeout(() => setReceipt(null), 15000);
    } catch (err) {
      showMsg('error', err.response?.data?.message || err.message || 'Failed');
    } finally { setProcessing(false); }
  };

  /* ── Helpers ── */
  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://localhost:5000${path}`;
  };

  const paidNum = parseFloat(amountPaid);
  const changeAmount = paymentMethod === 'Cash' && !isNaN(paidNum) ? paidNum - cartTotal : 0;

  const renderProductGrid = () => {
    if (loading) return <div className={styles.loadingState}>Loading products...</div>;
    if (filtered.length === 0) return <div className={styles.emptyState}><Package size={36} /><p>No products found</p></div>;
    return (
      <div className={styles.productGrid}>
        {filtered.map(p => (
          <div key={p.id} className={`${styles.productCard} ${(p.stock_quantity || 0) <= 0 ? styles.outOfStock : ''}`}>
            <div className={styles.cardImgWrap}>
              {getImageUrl(p.product_image) ? (
                <>
                  <img className={styles.cardImg} src={getImageUrl(p.product_image)} alt={p.name} />
                  <button className={styles.eyeBtn} onClick={() => setPreviewImage(p)} title="Preview image">
                    <Eye size={16} />
                  </button>
                </>
              ) : (
                <div className={styles.cardImgPlaceholder}><Package size={26} /></div>
              )}
              {(p.stock_quantity || 0) <= 0 && <span className={styles.outBadge}>Out</span>}
            </div>
            <div className={styles.cardBody}>
              <h3 className={styles.cardName}>{p.name}</h3>
              <span className={styles.cardCat}>{p.category_name}</span>
              <span className={styles.cardPrice}>{p.selling_price?.toFixed?.(2) || p.selling_price} <small>ETB</small></span>
              {p.unit && <span className={styles.cardUnit}>/ {p.unit}</span>}
              <div className={styles.cardFoot}>
                <span className={`${styles.cardStock} ${(p.stock_quantity || 0) <= 5 && (p.stock_quantity || 0) > 0 ? styles.stockLow : ''} ${(p.stock_quantity || 0) <= 0 ? styles.stockOut : ''}`}>
                  {p.stock_quantity || 0}
                </span>
                <button className={styles.addBtn} disabled={(p.stock_quantity || 0) <= 0} onClick={() => addToCart(p)}>
                  <Plus size={13} /> Add
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  /* Show name/phone from either walk-in form state or receipt data (online orders) */
  const dispName = customerName || receipt?.contact_name || receipt?.customer_name || '';
  const dispPhone = customerPhone || receipt?.contact_phone || receipt?.customer_phone || '';

  const renderPrintDoc = (r, cName, cPhone) => {
    const esc = (s) => (s || '').replace(/[<>&]/g, '');
    const name = cName || r?.contact_name || r?.customer_name || '';
    const phone = cPhone || r?.contact_phone || r?.customer_phone || '';
    const txRef = r?.payment_reference || (r?.paymentReference || '');
    return '<html><head><title>Receipt</title><style>body{font-family:monospace;padding:16px;text-align:center}hr{border-top:1px dashed #999}.row{display:flex;justify-content:space-between;padding:3px 0;font-size:14px;border-bottom:1px dotted #eee}</style></head><body>' +
      '<h2>SUTANA-EMS</h2><h3>Receipt</h3>' +
      '<p>Invoice #' + esc(r?.invoice_number || r?.id) + '</p><hr>' +
      (name ? '<div class="row"><span>Customer</span><span>' + esc(name) + '</span></div>' : '') +
      (phone ? '<div class="row"><span>Phone</span><span>' + esc(phone) + '</span></div>' : '') +
      (txRef ? '<div class="row"><span>Ref</span><span>' + esc(txRef) + '</span></div>' : '') +
      '<div class="row"><span>Total</span><strong>' + parseFloat(r?.total_amount || cartTotal).toFixed(2) + ' ETB</strong></div>' +
      '<div class="row"><span>Payment</span><span>' + esc(r?.payment_method_name || paymentMethod) + '</span></div>' +
      '<div class="row"><span>Invoice</span><span>#' + esc(r?.invoice_number || r?.id) + '</span></div><hr>' +
      '<p style="color:#888;font-size:12px">Thank you for your purchase!</p>' +
      '<script>setTimeout(function(){window.print();window.close()},500)<' + '/script></body></html>';
  };

  const handlePrint = (r) => {
    const w = window.open('', '_blank', 'width=320,height=500');
    w.document.write(renderPrintDoc(r, customerName, customerPhone));
    w.document.close();
    setReceipt(null);
  };

  return (
    <div className={styles.page}>
      {/* ── Fixed Header ── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Sprout size={20} className={styles.headerIcon} />
          <h1 className={styles.headerTitle}>Farming POS</h1>
        </div>

        <div className={styles.headerCenter}>
          <div className={styles.searchWrap}>
            <Search size={15} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button className={styles.searchClear} onClick={() => setSearch('')}><X size={13} /></button>}
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.shiftSection}>
            <div className={`${styles.shiftStatus} ${shift ? styles.shiftOpen : styles.shiftClosed}`}>
              <span className={`${styles.shiftDot} ${shift ? styles.shiftDotOpen : styles.shiftDotClosed}`} />
              <span>{shift ? `Shift #${shift.id}` : 'Closed'}</span>
            </div>
            <button
              className={`${styles.shiftBtn} ${shift ? styles.shiftBtnClose : styles.shiftBtnOpen}`}
              onClick={openShiftDialog}
            >
              {shift ? <><LogOut size={13} /> Close</> : <><LogIn size={13} /> Open</>}
            </button>
          </div>
          <button className={styles.cartBtn} onClick={() => setShowCart(true)}>
            <ShoppingCart size={19} />
            {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
          </button>
        </div>
      </header>

      {/* ── Alert ── */}
      {message && (
        <div className={`${styles.alert} ${styles[message.type]}`}>
          {message.type === 'success' ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
          {message.text}
        </div>
      )}

      {/* ── Scrollable Content Area ── */}
      <div className={styles.scrollArea}>

        {/* Stats Cards */}
            <div className={styles.statsRow}>
              <div className={`${styles.statCard} ${styles.statSales}`}>
                <DollarSign size={20} className={styles.statIcon} />
                <div className={styles.statInfo}>
                  <span className={styles.statVal}>{stats?.todaySales?.toFixed?.(2) || '0.00'}</span>
                  <span className={styles.statLabel}>Today (ETB)</span>
                </div>
              </div>
              <div className={`${styles.statCard} ${styles.statProducts}`}>
                <Package size={20} className={styles.statIcon} />
                <div className={styles.statInfo}>
                  <span className={styles.statVal}>{stats?.totalProducts || products.length}</span>
                  <span className={styles.statLabel}>Products</span>
                </div>
              </div>
              <div className={`${styles.statCard} ${styles.statLow}`}>
                <AlertTriangle size={20} className={styles.statIcon} />
                <div className={styles.statInfo}>
                  <span className={styles.statVal}>{stats?.lowStockItems || 0}</span>
                  <span className={styles.statLabel}>Low Stock</span>
                </div>
              </div>
              <div className={`${styles.statCard} ${styles.statOrders}`}>
                <ListOrdered size={20} className={styles.statIcon} />
                <div className={styles.statInfo}>
                  <span className={styles.statVal}>{stats?.pendingOrders || 0}</span>
                  <span className={styles.statLabel}>Pending</span>
                </div>
              </div>
            </div>

            {/* ── Two‑column layout: Walk‑in left, Online right ── */}
            <div className={styles.posColumns}>

              {/* ── Left: Walk‑in POS ── */}
              <div className={styles.posColumnLeft}>
                {/* Category Tabs */}
                <div className={styles.catBar}>
                  <button className={`${styles.catBtn} ${activeCategory === 'all' ? styles.catActive : ''}`} onClick={() => setActiveCategory('all')}>All</button>
                  {categories.map(cat => (
                    <button key={cat} className={`${styles.catBtn} ${activeCategory === cat ? styles.catActive : ''}`} onClick={() => setActiveCategory(cat)}>{cat}</button>
                  ))}
                </div>
                {/* Product Grid */}
                {renderProductGrid()}
              </div>

              {/* ── Right: Pending Online Orders ── */}
              <div className={styles.posColumnRight}>
                <div className={styles.pendingHeader}>
                  <h4>Pending Online Orders {awaitingOrders.length > 0 && <span className={styles.pendingBadge}>{awaitingOrders.length}</span>}</h4>
                  <button className={styles.pendingRefreshBtn} onClick={fetchAwaitingOrders} disabled={loadingOrders}>
                    {loadingOrders ? 'Loading...' : 'Refresh'}
                  </button>
                </div>
                {loadingOrders && awaitingOrders.length === 0 ? (
                  <div className={styles.pendingEmpty}>Loading orders...</div>
                ) : awaitingOrders.length === 0 ? (
                  <div className={styles.pendingEmpty}>
                    <CheckCircle size={16} color="#10b981" />
                    <span>All orders processed</span>
                  </div>
                ) : (
                  <div className={styles.pendingListVertical}>
                    {awaitingOrders.map(order => (
                      <div key={order.id} className={styles.pendingCard}>
                        <div className={styles.pendingCardTop}>
                          <div>
                            <strong>#{order.invoice_number}</strong>
                            <span className={styles.pendingDate}>{new Date(order.created_at).toLocaleString()}</span>
                          </div>
                          <span className={styles.pendingTotal}>{parseFloat(order.total_amount).toFixed(2)} ETB</span>
                        </div>
                        <p className={styles.pendingCustomer}>
                          {order.customer_name || 'Walk-in'}
                          <span className={styles.pendingPhone}>{order.customer_phone || order.contact_phone || ''}</span>
                        </p>
                        <ul className={styles.pendingItems}>
                          {order.items?.map(item => (
                            <li key={item.id}>{item.quantity}x {item.product_name} — {parseFloat(item.subtotal).toFixed(2)} ETB</li>
                          ))}
                        </ul>
                        <button className={styles.pendingPayBtn} disabled={processing} onClick={() => { setPayingOrderId(order.id); setPayingMethod('Cash'); }}>
                          Mark as Paid & Ready
                        </button>
                        {payingOrderId === order.id && (
                          <div className={styles.payPicker}>
                            <span className={styles.payPickerLabel}>Payment:</span>
                            <div className={styles.payPickerMethods}>
                              {PAYMENT_METHODS.map(pm => (
                                <button key={pm.value}
                                  className={`${styles.payPickerMethod} ${payingMethod === pm.value ? styles.payPickerActive : ''}`}
                                  onClick={() => setPayingMethod(pm.value)}>
                                  <pm.icon size={12} />
                                  {pm.value}
                                </button>
                              ))}
                            </div>
                            <div className={styles.payPickerActions}>
                              <button className={styles.payPickerConfirm} disabled={processing} onClick={() => processOrderPayment(order.id, payingMethod)}>
                                {processing ? 'Processing...' : 'Confirm'}
                              </button>
                              <button className={styles.payPickerCancel} onClick={() => setPayingOrderId(null)}>Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>{/* end posColumnRight */}

            </div>{/* end posColumns */}

        {/* bottom spacer so content doesn't stick to bottom */}
        <div style={{ height: 24 }} />
      </div>

      {/* ── Cart Popup ── */}
      {showCart && (
        <div className={styles.overlay} onClick={() => { if (!checkoutStep) setShowCart(false); }}>
          <div className={styles.cartPopup} onClick={e => e.stopPropagation()}>
            <div className={styles.cartHead}>
              <h2><ShoppingCart size={17} /> Cart ({cartCount})</h2>
              <button className={styles.closeBtn} onClick={() => { setShowCart(false); setCheckoutStep(null); }}><X size={17} /></button>
            </div>

            {!checkoutStep ? (
              <>
                {cart.length === 0 ? (
                  <div className={styles.emptyCart}><ShoppingCart size={36} /><p>Cart is empty</p></div>
                ) : (
                  <div className={styles.cartItems}>
                    {cart.map(item => (
                      <div key={item.id} className={styles.cartItem}>
                        <div className={styles.cartItemInfo}>
                          <span className={styles.cartItemName}>{item.name}</span>
                          <span className={styles.cartItemPrice}>{item.selling_price?.toFixed?.(2) || item.selling_price} ETB</span>
                        </div>
                        <div className={styles.cartItemRow}>
                          <div className={styles.cartQty}>
                            <button className={styles.qtyBtn} onClick={() => updateQty(item.id, -1)}><Minus size={11} /></button>
                            <span className={styles.qtyVal}>{item.quantity}</span>
                            <button className={styles.qtyBtn} onClick={() => updateQty(item.id, 1)}><Plus size={11} /></button>
                            <button className={styles.removeBtn} onClick={() => removeItem(item.id)}><Trash2 size={13} /></button>
                          </div>
                          <span className={styles.cartSubtotal}>{(item.quantity * item.selling_price).toFixed(2)} ETB</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className={styles.cartFoot}>
                  <div style={{ fontSize: 12, color: '#64748b', textAlign: 'right', marginBottom: 4 }}>
                    Subtotal: {cartSubtotal.toFixed(2)} ETB &nbsp;|&nbsp; VAT (15%): {(cartTotal - cartSubtotal).toFixed(2)} ETB
                  </div>
                  <div className={styles.cartTotal}><span>Total</span><strong>{cartTotal.toFixed(2)} ETB</strong></div>
                  <button className={styles.checkoutBtn} disabled={cart.length === 0} onClick={openCheckout}>Checkout</button>
                </div>
              </>
            ) : (
              /* ── Checkout Panel ── */
              <div className={styles.checkoutPanel}>
                <h3 className={styles.chkTitle}>Checkout</h3>
                <div className={styles.chkSummary}>
                  {cart.map(item => (
                    <div key={item.id} className={styles.chkItem}>
                      <span>{item.quantity}x {item.name}</span>
                      <span>{(item.quantity * item.selling_price).toFixed(2)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', padding: '4px 0' }}>
                    <span>Subtotal</span><span>{cartSubtotal.toFixed(2)} ETB</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', padding: '4px 0' }}>
                    <span>VAT (15%)</span><span>{(cartTotal - cartSubtotal).toFixed(2)} ETB</span>
                  </div>
                  <div className={styles.chkTotal}><span>Total</span><strong>{cartTotal.toFixed(2)} ETB</strong></div>
                </div>

                <div className={styles.fg}><label>Customer Name</label><input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Walk-in" /></div>
                <div className={styles.fg}><label>Phone</label><input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="+251..." /></div>

                <div className={styles.fg}>
                  <label>Payment</label>
                  <div className={styles.pmRow}>
                    {PAYMENT_METHODS.map(m => {
                      const Icon = m.icon;
                      return (
                        <button key={m.value}
                          className={`${styles.pmBtn} ${paymentMethod === m.value ? styles.pmActive : ''}`}
                          style={paymentMethod === m.value ? { borderColor: m.color, background: m.color + '10' } : {}}
                          onClick={() => { setPaymentMethod(m.value); if (m.value === 'Cash') setAmountPaid(cartTotal.toFixed(2)); }}
                        ><Icon size={16} /> {m.value}</button>
                      );
                    })}
                  </div>
                </div>

                {paymentMethod === 'Cash' && (
                  <div className={styles.fg}>
                    <label>Amount Paid</label>
                    <input type="number" step="0.01" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} min={cartTotal} />
                    {changeAmount >= 0 && <span className={styles.change}>Change: {changeAmount.toFixed(2)} ETB</span>}
                  </div>
                )}
                <div className={styles.chkActions}>
                  <button className={styles.backBtn} onClick={() => setCheckoutStep(null)}>Back</button>
                  <button className={styles.confirmBtn} disabled={processing} onClick={handleCheckout}>
                    {processing ? 'Processing...' : `Pay ${cartTotal.toFixed(2)} ETB`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Shift Dialog ── */}
      {showShiftDialog && (
        <div className={styles.overlay} onClick={closeShiftDialog}>
          <div className={styles.dialog} onClick={e => e.stopPropagation()}>
            <h3>{shift ? 'Close Shift' : 'Open Shift'}</h3>
            {shift ? (
              <>
                <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.75rem' }}>
                  Shift #{shift.id} — opened {new Date(shift.opened_at).toLocaleString()}
                </p>
                <div className={styles.fg}>
                  <label>Cash in Drawer (ETB) *</label>
                  <input type="number" step="0.01" min="0" value={physicalCashCounted} onChange={e => setPhysicalCashCounted(e.target.value)} placeholder="0.00" required />
                </div>
                <div className={styles.fg}>
                  <label>Closing Note (optional)</label>
                  <input value={closingNote} onChange={e => setClosingNote(e.target.value)} placeholder="Reason if there's a discrepancy" />
                </div>
                <div className={styles.dlgActions}>
                  <button className={styles.cancelBtn} onClick={closeShiftDialog}>Cancel</button>
                  <button className={styles.dangerBtn} disabled={shiftProcessing || !physicalCashCounted} onClick={closeShift}>
                    {shiftProcessing ? 'Closing...' : 'Close Shift'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={styles.fg}>
                  <label>Opening Balance (ETB)</label>
                  <input type="number" step="0.01" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} placeholder="Starting cash amount" />
                </div>
                <div className={styles.dlgActions}>
                  <button className={styles.cancelBtn} onClick={closeShiftDialog}>Cancel</button>
                  <button className={styles.confirmBtnSmall} disabled={shiftProcessing} onClick={openShift}>
                    {shiftProcessing ? 'Opening...' : 'Open Shift'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Image Preview Modal ── */}
      {previewImage && (
        <div className={styles.overlay} onClick={() => setPreviewImage(null)}>
          <div className={styles.imgPreview} onClick={e => e.stopPropagation()}>
            <button className={styles.imgPreviewClose} onClick={() => setPreviewImage(null)}><X size={20} /></button>
            {getImageUrl(previewImage.product_image) ? (
              <img className={styles.imgPreviewImg} src={getImageUrl(previewImage.product_image)} alt={previewImage.name} />
            ) : (
              <div className={styles.imgPreviewPlaceholder}><Package size={48} /></div>
            )}
            <div className={styles.imgPreviewInfo}>
              <h3>{previewImage.name}</h3>
              <span className={styles.imgPreviewCat}>{previewImage.category_name}</span>
              <span className={styles.imgPreviewPrice}>{previewImage.selling_price?.toFixed?.(2) || previewImage.selling_price} ETB</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Receipt ── */}
      {receipt && (
        <div className={styles.overlay} onClick={() => setReceipt(null)}>
          <div className={styles.receipt} onClick={e => e.stopPropagation()}>
            <div className={styles.receiptIcon}><CheckCircle size={44} /></div>
            <h2>Paid</h2>
            <p>Invoice #{receipt.invoice_number || receipt.id}</p>
            <div className={styles.receiptDetails}>
              {dispName ? <div><span>Customer</span><span>{dispName}</span></div> : null}
              {dispPhone ? <div><span>Phone</span><span>{dispPhone}</span></div> : null}
              {receipt.payment_reference ? <div><span>Ref</span><span>{receipt.payment_reference}</span></div> : null}
              <div><span>Total</span><strong>{parseFloat(receipt.total_amount || cartTotal).toFixed(2)} ETB</strong></div>
              <div><span>Payment</span><span>{receipt.payment_method_name || paymentMethod}</span></div>
              <div><span>Invoice</span><span>#{receipt.invoice_number || receipt.id}</span></div>
            </div>
            <button className={styles.closeReceiptBtn} onClick={() => handlePrint(receipt)}>Print Receipt</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmingPOS;
