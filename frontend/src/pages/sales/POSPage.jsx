import React, { useState, useEffect, useCallback, useRef } from 'react';
import salesService from '../../services/salesService';
import { formatCurrency } from '../../utils/formatters';
import { Eye } from 'lucide-react';
import styles from './POSPage.module.css';

const POSPage = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const roles = (user.roles || []).map(r => r.toLowerCase());
  const dept = (user.department || '').toLowerCase();
  const userSource = roles.includes('admin') || roles.includes('ceo') ? 'all'
    : roles.some(r => r.includes('farming')) || dept === 'farming' ? 'farming'
    : roles.some(r => r.includes('pharma') || r.includes('pharmacist')) || dept === 'pharmacy' ? 'pharmacy'
    : roles.some(r => r.includes('car renting') || r.includes('renting')) || dept === 'car renting' ? 'rental'
    : 'all';
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [cartDetails, setCartDetails] = useState({ subtotal: 0, taxAmount: 0, totalAmount: 0 });
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState(userSource);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [message, setMessage] = useState(null);

  /* Shift state */
  const [shift, setShift] = useState(null);
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [shiftFloat, setShiftFloat] = useState('');

  /* Close shift state */
  const [showCloseShiftDialog, setShowCloseShiftDialog] = useState(false);
  const [physicalCash, setPhysicalCash] = useState('');
  const [diffReason, setDiffReason] = useState('');

  /* Discount state */
  const [showDiscountUI, setShowDiscountUI] = useState(false);
  const [discountPercent, setDiscountPercent] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  const [discountScope, setDiscountScope] = useState('cart');

  /* Receipt modal state */
  const [receipt, setReceipt] = useState(null);

  /* Image preview state */
  const [imagePreview, setImagePreview] = useState(null);

  /* Customer info for receipt */
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://localhost:5000${path}`;
  };

  /* Quantity dialog */
  const [qtyDialog, setQtyDialog] = useState(null);
  const [qtyValue, setQtyValue] = useState(1);

  /* Barcode scanner */
  const barcodeBuf = useRef('');
  const barcodeTimer = useRef(null);

  const searchRef = useRef(null);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchCart = async () => {
    try {
      const response = await salesService.getCart();
      const cartData = response.data?.data || response.data;
      if (cartData) {
        setCartItems(cartData.items || []);
        setCartDetails({
          subtotal: cartData.subtotal || 0,
          taxAmount: cartData.taxAmount || 0,
          totalAmount: cartData.totalAmount || 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    }
  };

  const fetchShift = async () => {
    try {
      const res = await salesService.getCurrentShift();
      const s = res.data?.data || res.data;
      if (s && s.id) setShift(s);
      else setShift(null);
    } catch { setShift(null); }
  };

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [productsRes, customersRes, shiftRes] = await Promise.all([
        salesService.getPOSProducts({ limit: 200 }),
        salesService.getCustomers({ limit: 100 }),
        salesService.getCurrentShift()
      ]);
      setProducts(productsRes.data?.products || productsRes.data?.data?.products || []);
      setCustomers(customersRes.data?.customers || customersRes.data?.data?.customers || []);
      const s = shiftRes.data?.data || shiftRes.data;
      if (s && s.id) setShift(s);
      await fetchCart();
    } catch (error) {
      console.error('POS Initialization failed:', error);
      showMsg('error', 'Failed to initialize POS.');
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => { loadInitialData(); }, [loadInitialData]);

  useEffect(() => { fetchShift(); }, []);

  /* Barcode scanner handler */
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === 'Enter') {
        const code = barcodeBuf.current.trim();
        if (code) {
          e.preventDefault();
          handleBarcode(code);
        }
        barcodeBuf.current = '';
        return;
      }
      if (e.key.length === 1) {
        barcodeBuf.current += e.key;
        clearTimeout(barcodeTimer.current);
        barcodeTimer.current = setTimeout(() => { barcodeBuf.current = ''; }, 100);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleBarcode = async (code) => {
    try {
      const res = await salesService.getProductByBarcode(code);
      const product = res.data?.data || res.data;
      if (product?.id) {
        setQtyValue(1);
        setQtyDialog(product);
      } else {
        showMsg('error', 'Product not found for barcode: ' + code);
      }
    } catch {
      showMsg('error', 'Barcode scan failed');
    }
  };

  const addToCart = async (product, qty) => {
    const stock = product.stock_quantity ?? 0;
    if (stock <= 0) {
      showMsg('error', `❌ "${product.name}" is out of stock and cannot be added.`);
      return;
    }
    const quantity = qty || 1;
    if (quantity > stock) {
      showMsg('error', `⚠️ Only ${stock} unit(s) of "${product.name}" available in stock.`);
      return;
    }
    try {
      await salesService.addToCart({ productId: product.id, quantity });
      await fetchCart();
    } catch (error) {
      showMsg('error', error.response?.data?.message || 'Failed to add item');
    }
  };

  const updateQuantity = async (itemId, delta, currentQty) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;
    try {
      await salesService.updateCartItem(itemId, { quantity: newQty });
      await fetchCart();
    } catch (error) {
      showMsg('error', error.response?.data?.message || 'Failed to update quantity');
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      await salesService.removeFromCart(itemId);
      await fetchCart();
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const clearCart = async () => {
    try {
      await salesService.clearCart();
      await fetchCart();
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  };

  /* Discount handlers */
  const handleApplyDiscount = async () => {
    if (!discountPercent || parseFloat(discountPercent) <= 0) {
      showMsg('error', 'Enter a valid discount percentage');
      return;
    }
    try {
      await salesService.applyDiscount({ type: 'percentage', value: parseFloat(discountPercent), reason: discountReason });
      await fetchCart();
      setShowDiscountUI(false);
      showMsg('success', `Discount of ${discountPercent}% applied`);
    } catch (error) {
      showMsg('error', error.response?.data?.message || 'Failed to apply discount');
    }
  };

  const handleRemoveDiscount = async () => {
    try {
      await salesService.removeDiscount();
      await fetchCart();
      showMsg('success', 'Discount removed');
    } catch (error) {
      showMsg('error', 'Failed to remove discount');
    }
  };

  /* Shift handlers */
  const handleOpenShift = async () => {
    try {
      const res = await salesService.openShift({ opening_float: parseFloat(shiftFloat || 0) });
      setShift(res.data?.data || res.data);
      setShowShiftDialog(false);
      showMsg('success', 'Shift opened');
    } catch (error) {
      showMsg('error', error.response?.data?.message || 'Failed to open shift');
    }
  };

  const handleCloseShift = async () => {
    try {
      const res = await salesService.closeShift({
        physical_cash_counted: parseFloat(physicalCash || 0),
        difference_reason: diffReason
      });
      setShift(null);
      setShowCloseShiftDialog(false);
      showMsg('success', 'Shift closed');
    } catch (error) {
      showMsg('error', error.response?.data?.message || 'Failed to close shift');
    }
  };

  /* Checkout */
  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    if (!shift) { showMsg('error', 'Open a shift before processing sales'); return; }
    if (paymentMethod === 'Credit' && !selectedCustomerId) {
      showMsg('error', 'Credit sales require a customer selected.');
      return;
    }
    const needsRef = ['Bank Transfer', 'Telebirr', 'Check'];
    if (needsRef.includes(paymentMethod) && !paymentReference.trim()) {
      showMsg('error', `${paymentMethod} requires a reference number`);
      return;
    }
    setShowCustomerForm(true);
  };

  const processCheckout = async () => {
    setShowCustomerForm(false);
    setCheckoutLoading(true);
    try {
      const payload = {
        customerId: selectedCustomerId ? parseInt(selectedCustomerId) : undefined,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        paymentMethod,
        amountPaid: paymentMethod === 'Credit' ? 0 : cartDetails.totalAmount,
        paymentReference: ['Bank Transfer', 'Telebirr', 'Check'].includes(paymentMethod) ? paymentReference.trim() : undefined
      };
      const response = await salesService.createSale(payload);
      const result = response.data?.data || response.data;
      result.customerName = customerName.trim() || 'Walk-in Customer';
      result.customerPhone = customerPhone.trim() || '';
      setReceipt(result);
      setSelectedCustomerId('');
      setPaymentMethod('Cash');
      setPaymentReference('');
      setCustomerName('');
      setCustomerPhone('');
      await fetchCart();
      await fetchShift();
    } catch (error) {
      showMsg('error', error.response?.data?.message || 'Checkout failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const closeReceipt = () => {
    setReceipt(null);
  };

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
    const matchSource = sourceFilter === 'all' || (p.source || 'retail') === sourceFilter;
    return matchSearch && matchSource;
  });

  if (loading) return <div className={styles.loading}>Initializing POS Terminal...</div>;

  return (
    <div className={styles.container}>
      {/* Shift bar */}
      <div className={styles.shiftBar}>
        <div className={styles.shiftInfo}>
          {shift ? (
            <>
              <span className={styles.shiftBadge}>Shift OPEN</span>
              <span>Opened: {new Date(shift.opened_at).toLocaleTimeString()}</span>
              <span>Float: {formatCurrency(shift.opening_float)}</span>
              <span>Sales: {shift.transaction_count || 0} txns / {formatCurrency(shift.total_sales || 0)}</span>
            </>
          ) : (
            <span className={styles.shiftBadgeClosed}>No open shift</span>
          )}
        </div>
        <div className={styles.shiftActions}>
          {!shift ? (
            <button className={styles.btnShift} onClick={() => setShowShiftDialog(true)}>Start Shift</button>
          ) : (
            <button className={styles.btnShiftClose} onClick={() => { setPhysicalCash(''); setDiffReason(''); setShowCloseShiftDialog(true); }}>Close Shift</button>
          )}
        </div>
      </div>

      {/* Shift start dialog */}
      {showShiftDialog && (
        <div className={styles.overlay} onClick={() => setShowShiftDialog(false)}>
          <div className={styles.dialog} onClick={e => e.stopPropagation()}>
            <h3>Open New Shift</h3>
            <label>Opening Float (ETB)
              <input type="number" value={shiftFloat} onChange={e => setShiftFloat(e.target.value)} placeholder="0.00" autoFocus />
            </label>
            <div className={styles.dialogActions}>
              <button className={styles.btnCancel} onClick={() => setShowShiftDialog(false)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleOpenShift}>Open Shift</button>
            </div>
          </div>
        </div>
      )}

      {/* Close shift dialog */}
      {showCloseShiftDialog && (
        <div className={styles.overlay} onClick={() => setShowCloseShiftDialog(false)}>
          <div className={styles.dialog} onClick={e => e.stopPropagation()}>
            <h3>Close Shift</h3>
            <label>Physical Cash Counted (ETB)
              <input type="number" value={physicalCash} onChange={e => setPhysicalCash(e.target.value)} placeholder="0.00" autoFocus />
            </label>
            <label>Difference Reason (if any)
              <textarea value={diffReason} onChange={e => setDiffReason(e.target.value)} placeholder="Explain any cash discrepancy..." />
            </label>
            <div className={styles.dialogActions}>
              <button className={styles.btnCancel} onClick={() => setShowCloseShiftDialog(false)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleCloseShift}>Close Shift</button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.contentWrapper}>
        <div className={styles.mainArea}>
        <div className={styles.searchHeader}>
          <h2 className={styles.title}>Point of Sale</h2>
          <div className={styles.searchBox}>
            <input
              ref={searchRef}
              type="text"
              placeholder="Search products by SKU or name... (scan barcode anywhere)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>
        {userSource === 'all' ? (
          <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 0', flexWrap: 'wrap' }}>
            {['all', 'retail', 'farming', 'pharmacy', 'rental'].map(s => (
              <button
                key={s}
                onClick={() => setSourceFilter(s)}
                style={{
                  padding: '4px 14px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  background: sourceFilter === s
                    ? (s === 'farming' ? '#059669' : s === 'pharmacy' ? '#2563eb' : s === 'retail' ? '#7c3aed' : s === 'rental' ? '#d97706' : '#1f2937')
                    : '#f3f4f6',
                  color: sourceFilter === s ? 'white' : '#374151',
                  textTransform: 'capitalize'
                }}
              >
                {s === 'all' ? 'All Departments' : s}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 0', flexWrap: 'wrap' }}>
            <span style={{
              padding: '4px 14px',
              borderRadius: '20px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.8rem',
              background: userSource === 'farming' ? '#059669' : userSource === 'pharmacy' ? '#2563eb' : userSource === 'rental' ? '#d97706' : '#7c3aed',
              color: 'white',
              textTransform: 'capitalize'
            }}>
              {userSource}
            </span>
          </div>
        )}

        {message && (
          <div className={`${styles.alert} ${styles[message.type]}`}>{message.text}</div>
        )}

        <div className={styles.productGrid}>
          {filteredProducts.map(product => {
            const stock = product.stock_quantity ?? 0;
            const isOutOfStock = stock <= 0;
            const sourceColors = { farming: '#059669', pharmacy: '#2563eb', retail: '#7c3aed', rental: '#d97706' };
            const sc = sourceColors[product.source] || '#6b7280';
            return (
              <div key={product.id} className={`${styles.productCard} ${isOutOfStock ? styles.outOfStock : ''}`} onClick={() => { if (!isOutOfStock) { setQtyValue(1); setQtyDialog(product); } }}>
                <div className={styles.productImageWrapper}>
                  {product.product_image ? (
                    <img
                      src={getImageUrl(product.product_image)}
                      alt={product.name}
                      className={styles.productImage}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className={styles.productPlaceholder}>{product.name?.charAt(0)?.toUpperCase() || '?'}</div>
                  )}
                  <button className={styles.eyeIconBtn} onClick={(e) => { e.stopPropagation(); setImagePreview(product); }} title="View details">
                    <Eye size={18} />
                  </button>
                  <div className={styles.productImageBadges}>
                    {product.source && (
                      <span className={styles.sourceBadge} style={{ background: sc, color: '#fff' }}>{product.source}</span>
                    )}
                    {isOutOfStock && <span className={styles.outOfStockBadge}>Out of Stock</span>}
                  </div>
                  <div className={styles.priceTag}>
                    <span className={styles.priceCurrency}>ETB</span>
                    <span className={styles.priceValue}>{parseFloat(product.selling_price || product.sellingPrice || 0).toFixed(2)}</span>
                  </div>
                </div>
                <div className={styles.productInfo}>
                  <h3 className={styles.productName} title={product.name}>{product.name}</h3>
                  {product.category_name && <span className={styles.productCategory}>{product.category_name}</span>}
                  {product.sku && <span className={styles.productSku}>{product.sku}</span>}
                  <div className={styles.priceRow}>
                    <span className={styles.salePrice}>{formatCurrency(product.selling_price || product.sellingPrice)}</span>
                    <span className={`${styles.stockNum} ${isOutOfStock ? styles.stockZero : stock <= 5 ? styles.stockLow : styles.stockOk}`}>
                      {isOutOfStock ? '0 in stock' : `${stock} in stock`}
                    </span>
                  </div>
                  <div className={styles.stockSection}>
                    <div className={styles.stockBarTrack}>
                      <div className={styles.stockBarFill} style={{ width: `${Math.min(100, (stock / 50) * 100)}%`, background: isOutOfStock ? '#ef4444' : stock < 5 ? '#f59e0b' : '#10b981' }} />
                    </div>
                  </div>
                  <button className={styles.addToCartBtn} disabled={isOutOfStock} onClick={(e) => { e.stopPropagation(); if (!isOutOfStock) { setQtyValue(1); setQtyDialog(product); } }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                    {isOutOfStock ? 'Unavailable' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            );
          })}
          {filteredProducts.length === 0 && (
            <div className={styles.emptyProducts}>No products found matching '{search}'</div>
          )}
        </div>

      </div>

      <div className={styles.sidebar}>
        <div className={styles.cartHeader}>
          <h2>Current Order</h2>
          <button className={styles.btnClear} onClick={clearCart} disabled={cartItems.length === 0}>Clear</button>
        </div>

        <div className={styles.customerSelect}>
          <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} className={styles.selectInput}>
            <option value="">Walk-in Customer</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className={styles.customerSelect}>
          <select value={paymentMethod} onChange={(e) => { setPaymentMethod(e.target.value); setPaymentReference(''); }} className={styles.selectInput}>
            <option value="Cash">Cash</option>
            <option value="Credit">Credit (Invoice)</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Telebirr">Telebirr</option>
            <option value="Check">Check</option>
          </select>
          {paymentMethod === 'Credit' && !selectedCustomerId && (
            <p className={styles.warnText}>Select a customer for credit sales</p>
          )}
        </div>

        {/* Payment reference field */}
        {['Bank Transfer', 'Telebirr', 'Check'].includes(paymentMethod) && (
          <div className={styles.customerSelect}>
            <input
              type="text"
              placeholder={paymentMethod === 'Check' ? 'Check number' : 'Transaction reference'}
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              className={styles.selectInput}
            />
          </div>
        )}

        <div className={styles.cartItems}>
          {cartItems.length === 0 ? (
            <div className={styles.emptyCart}>Cart is empty</div>
          ) : (
            cartItems.map(item => (
              <div key={item.id} className={styles.cartItem}>
                <div className={styles.itemInfo}>
                  <h4 className={styles.itemName}>{item.productName}</h4>
                  <span className={styles.itemPrice}>{formatCurrency(item.unitPrice)} x {item.quantity}</span>
                </div>
                <div className={styles.itemControls}>
                  <button className={styles.btnQty} onClick={() => updateQuantity(item.id, -1, item.quantity)}>-</button>
                  <span className={styles.qtyValue}>{item.quantity}</span>
                  <button className={styles.btnQty} onClick={() => updateQuantity(item.id, 1, item.quantity)}>+</button>
                  <button className={styles.btnRemove} onClick={() => removeFromCart(item.id)}>&times;</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className={styles.cartFooter}>
          {/* Discount section */}
          <div className={styles.discountSection}>
            {cartDetails.discountAmount > 0 ? (
              <div className={styles.discountRow}>
                <span>Discount ({cartDetails.discountPercent}%)</span>
                <span>-{formatCurrency(cartDetails.discountAmount || 0)}
                  <button className={styles.btnRemoveDiscount} onClick={handleRemoveDiscount}>&times;</button>
                </span>
              </div>
            ) : (
              cartItems.length > 0 && !showDiscountUI && (
                <button className={styles.btnDiscount} onClick={() => setShowDiscountUI(true)}>+ Add Discount</button>
              )
            )}
          </div>

          {showDiscountUI && (
            <div className={styles.discountForm}>
              <input type="number" placeholder="Discount %" value={discountPercent} onChange={e => setDiscountPercent(e.target.value)} className={styles.selectInput} />
              <input type="text" placeholder="Reason (optional)" value={discountReason} onChange={e => setDiscountReason(e.target.value)} className={styles.selectInput} />
              <div className={styles.discountActions}>
                <button className={styles.btnPrimary} onClick={handleApplyDiscount}>Apply</button>
                <button className={styles.btnCancel} onClick={() => { setShowDiscountUI(false); setDiscountPercent(''); setDiscountReason(''); }}>Cancel</button>
              </div>
            </div>
          )}

          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span>{formatCurrency(cartDetails.subtotal)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Tax (15%)</span>
            <span>{formatCurrency(cartDetails.taxAmount)}</span>
          </div>
          <div className={`${styles.summaryRow} ${styles.totalRow}`}>
            <span>Total</span>
            <span>{formatCurrency(cartDetails.totalAmount)}</span>
          </div>
          <button
            className={styles.btnCheckout}
            disabled={cartItems.length === 0 || checkoutLoading || !shift || (paymentMethod === 'Credit' && !selectedCustomerId)}
            onClick={handleCheckout}
          >
            {checkoutLoading ? 'Processing...' : paymentMethod === 'Credit'
              ? `Issue Invoice ${formatCurrency(cartDetails.totalAmount)}`
              : `Checkout ${formatCurrency(cartDetails.totalAmount)}`
            }
          </button>
        </div>
      </div>
      </div>

      {/* Quantity dialog */}
      {qtyDialog && (() => {
        const maxStock = qtyDialog.stock_quantity ?? 0;
        const qtyExceedsStock = qtyValue > maxStock;
        return (
          <div className={styles.overlay} onClick={() => setQtyDialog(null)}>
            <div className={styles.dialog} onClick={e => e.stopPropagation()}>
              <h3>Add to Cart</h3>
              <p style={{margin:'0 0 4px',fontSize:'.9rem'}}><strong>{qtyDialog.name}</strong></p>
              <p style={{margin:'0 0 4px',fontSize:'.8rem',color:'#6b7280'}}>
                SKU: {qtyDialog.sku} &middot; Price: {formatCurrency(qtyDialog.selling_price || qtyDialog.sellingPrice)}
              </p>
              <p style={{
                margin:'0 0 14px',
                fontSize:'.85rem',
                fontWeight: 700,
                color: maxStock === 0 ? '#ef4444' : maxStock < 5 ? '#f59e0b' : '#10b981'
              }}>
                {maxStock === 0
                  ? '❌ Out of stock'
                  : maxStock < 5
                  ? `⚠️ Only ${maxStock} unit(s) left in stock`
                  : `✅ ${maxStock} in stock`}
              </p>
              <label>Quantity
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginTop:'4px'}}>
                  <button className={styles.btnQty} onClick={() => setQtyValue(Math.max(1, qtyValue - 1))}>-</button>
                  <input
                    type="number"
                    min="1"
                    max={maxStock}
                    value={qtyValue}
                    onChange={e => setQtyValue(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{
                      width:'60px',
                      textAlign:'center',
                      padding:'.5rem',
                      border: qtyExceedsStock ? '2px solid #ef4444' : '1px solid #d1d5db',
                      borderRadius:'6px',
                      fontSize:'1rem'
                    }}
                  />
                  <button
                    className={styles.btnQty}
                    onClick={() => setQtyValue(Math.min(maxStock, qtyValue + 1))}
                    disabled={qtyValue >= maxStock}
                  >+</button>
                </div>
              </label>
              {qtyExceedsStock && (
                <p style={{color:'#ef4444',fontSize:'.8rem',marginTop:'6px',fontWeight:600}}>
                  ⚠️ Quantity exceeds available stock ({maxStock} available)
                </p>
              )}
              <div className={styles.dialogActions}>
                <button className={styles.btnCancel} onClick={() => setQtyDialog(null)}>Cancel</button>
                <button
                  className={styles.btnPrimary}
                  disabled={maxStock === 0 || qtyExceedsStock}
                  style={{ opacity: (maxStock === 0 || qtyExceedsStock) ? 0.5 : 1, cursor: (maxStock === 0 || qtyExceedsStock) ? 'not-allowed' : 'pointer' }}
                  onClick={() => { addToCart(qtyDialog, qtyValue); setQtyDialog(null); }}
                >
                  {maxStock === 0 ? 'Out of Stock' : `Add ${qtyValue} to Cart`}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Customer info dialog */}
      {showCustomerForm && (
        <div className={styles.overlay} onClick={() => setShowCustomerForm(false)}>
          <div className={styles.dialog} onClick={e => e.stopPropagation()}>
            <h3>Customer Information</h3>
            <p style={{fontSize:'0.85rem',color:'#64748b',margin:'0 0 16px'}}>Enter customer details for the receipt</p>
            <label>Customer Name
              <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="e.g. Abebe Kebede" autoFocus />
            </label>
            <label>Phone Number
              <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="e.g. 0911xxxxxx" />
            </label>
            <div className={styles.dialogActions}>
              <button className={styles.btnCancel} onClick={() => setShowCustomerForm(false)}>Skip</button>
              <button className={styles.btnPrimary} onClick={processCheckout}>Continue to Payment</button>
            </div>
          </div>
        </div>
      )}

      {receipt && (
        <div className={styles.overlay} onClick={closeReceipt}>
          <div className={styles.receiptModal} onClick={e => e.stopPropagation()}>
            <h2>Receipt</h2>
            {receipt.customerName && (
              <div style={{textAlign:'center',marginBottom:'12px',fontSize:'0.85rem',color:'#334155'}}>
                <strong>{receipt.customerName}</strong>
                {receipt.customerPhone && <span> &middot; {receipt.customerPhone}</span>}
              </div>
            )}
            <div className={styles.receiptBody}>
              <p><strong>Invoice:</strong> {receipt.invoiceNumber}</p>
              <p><strong>Payment:</strong> {receipt.paymentMethod}</p>
              <p><strong>Total:</strong> {formatCurrency(receipt.totalAmount)}</p>
              {receipt.changeAmount > 0 && <p><strong>Change:</strong> {formatCurrency(receipt.changeAmount)}</p>}
              <p><strong>Items:</strong> {receipt.itemsSold}</p>
            </div>
            <div className={styles.dialogActions}>
              <button className={styles.btnPrimary} onClick={() => window.print()}>Print Receipt</button>
              <button className={styles.btnCancel} onClick={closeReceipt}>Close</button>
            </div>
          </div>
        </div>
      )}

      {imagePreview && (
        <div className={styles.imageOverlay} onClick={() => setImagePreview(null)}>
          <div className={styles.imageModal} onClick={e => e.stopPropagation()}>
            <button className={styles.imageCloseBtn} onClick={() => setImagePreview(null)}>&times;</button>
            <div className={styles.imageModalBody}>
              <img
                src={getImageUrl(imagePreview.product_image)}
                alt={imagePreview.name}
                className={styles.imagePreviewImg}
              />
              <div className={styles.imageModalInfo}>
                <h3>{imagePreview.name}</h3>
                {imagePreview.category_name && <span className={styles.imageCategory}>{imagePreview.category_name}</span>}
                <span className={styles.imagePrice}>{formatCurrency(imagePreview.selling_price || imagePreview.sellingPrice)}</span>
                {imagePreview.sku && <span className={styles.imageSku}>SKU: {imagePreview.sku}</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default POSPage;