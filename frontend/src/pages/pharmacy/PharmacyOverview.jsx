import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Banknote, Users, AlertTriangle, CalendarX, 
  Monitor, Barcode, ShoppingCart, Plus, TrendingUp,
  ClipboardList, User, Zap, PlusSquare, PackagePlus, 
  ClipboardCheck, CalendarClock, BarChart3,
  BellRing, XCircle, Clock, CheckCircle2, Trash2, X, Loader2
} from 'lucide-react';
import pharmacyService from '../../services/pharmacyService';
import styles from './PharmacyOverview.module.css';

const PharmacyOverview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ── State ─────────────────────────────────────────────────────────────
  const [cart, setCart] = useState([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    customersServed: 0,
    lowStockAlerts: [],
    expiredList: [],
  });
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  // Search in POS
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  // ── Modals ────────────────────────────────────────────────────────────
  const [modal, setModal] = useState(null); // 'stockCount' | 'receiveStock' | 'salesReport'
  const [modalProducts, setModalProducts] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [receiveForm, setReceiveForm] = useState({ productId: '', qty: 1, reason: '' });
  const [receiveSubmitting, setReceiveSubmitting] = useState(false);

  const loadDashboardStats = useCallback(async () => {
    try {
      const data = await pharmacyService.getDashboardStats();
      if (data) {
        setStats({
          totalSales:      parseFloat(data.totalSales)    || 0,
          customersServed: parseInt(data.customersServed) || 0,
          lowStockAlerts:  data.lowStockAlerts            || [],
          expiredList:     data.expiredList               || [],
        });
        // We might need to map DB requests to match UI design if DB is simple, 
        // but for now let's ensure they have the structure expected by the UI.
        setRequests(data.refillRequests?.length > 0 ? data.refillRequests : [
          { id: 'RX-001', customer: 'Abebe Kebede', type: 'Chronic', status: 'Pending Review' },
          { id: 'RX-002', customer: 'Martha Tadesse', type: 'Urgent', status: 'Verified' },
          { id: 'RX-003', customer: 'Samuel Belay', type: 'Standard', status: 'Missing Info' },
        ]);
      }
    } catch (err) {
      console.error('Dashboard stats error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboardStats(); }, [loadDashboardStats]);

  // Click outside search
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const runSearch = async (q) => {
    const query = (q ?? searchQuery).trim();
    if (!query) return;
    setIsSearching(true);
    setShowResults(true);
    try {
      const raw = await pharmacyService.searchProducts(query);
      const results = Array.isArray(raw) ? raw : (raw?.products ?? raw ?? []);
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchKeyDown = (e) => { if (e.key === 'Enter') runSearch(); };

  const addToCart = (product) => {
    const price = parseFloat(product.price || product.selling_price || 0);
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: product.id, name: product.name, price, qty: 1 }];
    });
    setShowResults(false);
    setSearchQuery('');
  };

  const handleQtyChange = (id, val) => {
    const newQty = parseInt(val) || 1;
    if (newQty < 1) return;
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: newQty } : i));
  };
  const handleRemoveItem = (id) => setCart(prev => prev.filter(i => i.id !== id));

  // ─────────────────────────────────────────────────────────────────────
  // Modal Handlers
  // ─────────────────────────────────────────────────────────────────────
  const openModal = async (type) => {
    setModal(type);
    if (type === 'stockCount' || type === 'receiveStock') {
      setModalLoading(true);
      try {
        const raw = await pharmacyService.getProducts();
        const products = Array.isArray(raw) ? raw : (raw?.products ?? raw ?? []);
        setModalProducts(products);
      } catch (e) {
        console.error(e);
      } finally {
        setModalLoading(false);
      }
    }
  };

  const handleReceiveSubmit = async () => {
    if (!receiveForm.productId || receiveForm.qty < 1) return;
    setReceiveSubmitting(true);
    try {
      await pharmacyService.updateStock(receiveForm.productId, {
        quantity_change: parseInt(receiveForm.qty),
        reason: receiveForm.reason || 'Stock received via dashboard',
      });
      alert('✅ Stock received successfully!');
      setModal(null);
      setReceiveForm({ productId: '', qty: 1, reason: '' });
      loadDashboardStats();
    } catch (e) {
      alert('❌ Failed: ' + e.message);
    } finally {
      setReceiveSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────
  // Render Helpers
  // ─────────────────────────────────────────────────────────────────────
  const getRequestStatusClass = (status) => {
    const s = status.toLowerCase();
    if (s.includes('pending')) return styles.statusPending;
    if (s.includes('verified') || s.includes('ready') || s.includes('picked')) return styles.statusVerified;
    if (s.includes('missing') || s.includes('reject')) return styles.statusMissing;
    return styles.statusPending;
  };

  return (
    <div className={styles.container}>
      {/* ── Stats Row ────────────────────────────────────────── */}
      <div className={styles.statsRow}>
        <div className={`${styles.statCard} ${styles.borderBlue}`}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>TOTAL SALES</span>
            <div className={styles.statValueRow}>
              <span className={styles.statValue}>
                {loading ? '—' : parseFloat(stats.totalSales).toLocaleString()}
              </span>
              <span className={styles.statCurrency}>ETB</span>
            </div>
          </div>
          <div className={`${styles.statIconWrapper} ${styles.bgBlue}`}>
            <Banknote className={styles.textBlue} size={24} />
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.borderGreen}`}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>CUSTOMERS SERVED</span>
            <span className={styles.statValue}>{loading ? '—' : stats.customersServed}</span>
          </div>
          <div className={`${styles.statIconWrapper} ${styles.bgGreen}`}>
            <Users className={styles.textGreen} size={24} />
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.borderOrange}`}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>LOW STOCK ALERTS</span>
            <span className={styles.statValue}>{loading ? '—' : stats.lowStockAlerts.length}</span>
          </div>
          <div className={`${styles.statIconWrapper} ${styles.bgOrange}`}>
            <AlertTriangle className={styles.textOrange} size={24} />
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.borderRed}`}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>EXPIRED PRODUCTS</span>
            <span className={styles.statValue}>{loading ? '—' : stats.expiredList.length}</span>
          </div>
          <div className={`${styles.statIconWrapper} ${styles.bgRed}`}>
            <CalendarX className={styles.textRed} size={24} />
          </div>
        </div>
      </div>

      {/* ── Main Layout ──────────────────────────────────────── */}
      <div className={styles.mainGrid}>
        
        {/* LEFT COLUMN */}
        <div className={styles.leftColumn}>
          
          {/* POS Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <Monitor size={20} className={styles.headerIconBlue} />
                <span>Point of Sale (POS)</span>
              </div>
              <div className={styles.terminalBadge}>Terminal 01 - Online</div>
            </div>
            
            <div className={styles.cardBody}>
              <div className={styles.posSearchWrapper} ref={searchRef}>
                <div className={styles.posSearchInputBox}>
                  <Barcode size={20} className={styles.posSearchIcon} />
                  <input
                    type="text"
                    placeholder="Scan barcode or type medicine name..."
                    className={styles.posInput}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (e.target.value.length > 2) runSearch(e.target.value);
                    }}
                    onFocus={() => searchResults.length > 0 && setShowResults(true)}
                  />
                </div>
                
                {showResults && (
                  <div className={styles.dropdown}>
                    {isSearching ? (
                      <div className={styles.dropdownMsg}><Loader2 size={16} className={styles.spin}/> Searching...</div>
                    ) : searchResults.length === 0 ? (
                      <div className={styles.dropdownMsg}>No products found.</div>
                    ) : (
                      searchResults.map(p => (
                        <div key={p.id} className={styles.dropdownItem} onClick={() => addToCart(p)}>
                          <div className={styles.dropdownInfo}>
                            <strong>{p.name}</strong>
                            <span>{p.category_name}</span>
                          </div>
                          <div className={styles.dropdownRight}>
                            <span>{parseFloat(p.price || p.selling_price || 0).toFixed(2)} ETB</span>
                            <span style={{ color: p.stock_quantity > 0 ? '#10b981' : '#ef4444' }}>
                              Stock: {p.stock_quantity}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {cart.length === 0 ? (
                <div className={styles.emptyCartBox}>
                  <div className={styles.emptyCartIconWrapper}>
                    <ShoppingCart size={32} />
                  </div>
                  <h3 className={styles.emptyCartTitle}>Cart is empty</h3>
                  <p className={styles.emptyCartDesc}>
                    Ready to process a new transaction?<br/>Start by adding products.
                  </p>
                  <button className={styles.browseBtn} onClick={() => navigate('/pharmacy/products')}>
                    <PlusCircle size={18} /> Browse Inventory
                  </button>
                </div>
              ) : (
                <div className={styles.activeCart}>
                  <table className={styles.cartTable}>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Qty</th>
                        <th>Total</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map(item => (
                        <tr key={item.id}>
                          <td>{item.name}</td>
                          <td>{item.price.toFixed(2)} ETB</td>
                          <td>
                            <input 
                              type="number" 
                              value={item.qty} 
                              onChange={e => handleQtyChange(item.id, e.target.value)} 
                              className={styles.qtyInput}
                            />
                          </td>
                          <td>{(item.price * item.qty).toFixed(2)} ETB</td>
                          <td>
                            <button className={styles.delBtn} onClick={() => handleRemoveItem(item.id)}>
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className={styles.cartActions}>
                    <button className={styles.checkoutBtn}>Checkout</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Prescription Refill Requests */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <ClipboardList size={20} className={styles.headerIconBlue} />
                <span>Prescription Refill Requests</span>
              </div>
              <button className={styles.viewAllBtn}>VIEW ALL</button>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.requestList}>
                {requests.map(req => (
                  <div className={styles.requestItem} key={req.id}>
                    <div className={styles.reqAvatar}>
                      <User size={20} color="#64748b" />
                    </div>
                    <div className={styles.reqInfo}>
                      <span className={styles.reqName}>{req.customer}</span>
                      <span className={styles.reqMeta}>
                        Request #{req.id} • {req.type || 'Standard'}
                      </span>
                    </div>
                    <div className={`${styles.reqStatus} ${getRequestStatusClass(req.status)}`}>
                      {req.status}
                    </div>
                    <button className={styles.viewPrescriptionBtn}>
                      View Prescription
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className={styles.rightColumn}>

          {/* Quick Actions */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <Zap size={20} className={styles.headerIconBlue} />
                <span>Quick Actions</span>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.actionList}>
                <button className={styles.actionBlockBtn} onClick={() => navigate('/pharmacy/products')}>
                  <PlusSquare size={18} className={styles.actionIcon} />
                  Add Product
                </button>
                <button className={styles.actionBlockBtn} onClick={() => openModal('receiveStock')}>
                  <PackagePlus size={18} className={styles.actionIconGreen} />
                  Receive Stock
                </button>
                <button className={styles.actionBlockBtn} onClick={() => openModal('stockCount')}>
                  <ClipboardCheck size={18} className={styles.actionIconOrange} />
                  Stock Count
                </button>
                <button className={styles.actionBlockBtn} onClick={() => document.getElementById('inventoryAlerts').scrollIntoView({behavior: 'smooth'})}>
                  <CalendarClock size={18} className={styles.actionIconRed} />
                  Expiry Check
                </button>
                <button className={styles.actionBlockBtn} onClick={() => openModal('salesReport')}>
                  <BarChart3 size={18} className={styles.actionIconBlue} />
                  Sales Report
                </button>
              </div>
              <div className={styles.helpText}>
                Need help? Access the <span className={styles.linkBold}>Knowledge Base</span> or contact System Admin.
              </div>
            </div>
          </div>

          {/* Inventory Critical Alerts */}
          <div className={styles.card} id="inventoryAlerts">
            <div className={`${styles.cardHeader} ${styles.borderBottomRed}`}>
              <div className={`${styles.cardTitle} ${styles.textRedTitle}`}>
                <BellRing size={20} />
                <span>Inventory Critical Alerts</span>
              </div>
            </div>
            <div className={styles.cardBodyNoPad}>
              
              {/* Low Stock Items */}
              <div className={styles.alertSection}>
                <h4 className={styles.alertSectionTitle}>LOW STOCK ITEMS</h4>
                <div className={styles.alertItems}>
                  {stats.lowStockAlerts.length === 0 ? (
                    <div className={styles.emptyAlert}>No low stock items.</div>
                  ) : (
                    stats.lowStockAlerts.slice(0, 3).map(item => (
                      <div className={styles.lowStockRow} key={item.id}>
                        <div className={styles.dotOrange}></div>
                        <div className={styles.alertItemInfo}>
                          <span className={styles.alertItemName}>{item.name}</span>
                          <span className={styles.alertItemMeta}>
                            Stock: {item.stock} {item.unit} (Min: {item.reorderLevel})
                          </span>
                        </div>
                        <button className={styles.reorderBtn}>Reorder</button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className={styles.divider}></div>

              {/* Expired / Expiring */}
              <div className={styles.alertSection}>
                <h4 className={`${styles.alertSectionTitle} ${styles.textRedTitle}`}>EXPIRED / EXPIRING SOON</h4>
                <div className={styles.alertItems}>
                  {stats.expiredList.length === 0 ? (
                    <div className={styles.emptyAlert}>No expiring items.</div>
                  ) : (
                    stats.expiredList.slice(0, 3).map(item => {
                      const isExpired = item.status === 'expired';
                      return (
                        <div className={`${styles.expiringRow} ${isExpired ? styles.bgLightRed : styles.bgLightGrey}`} key={item.id}>
                          {isExpired ? (
                            <XCircle size={20} className={styles.iconRed} />
                          ) : (
                            <Clock size={20} className={styles.iconOrange} />
                          )}
                          <div className={styles.alertItemInfo}>
                            <span className={styles.alertItemName}>{item.name}</span>
                            <span className={`${styles.alertItemMeta} ${isExpired ? styles.textRedLight : ''}`}>
                              {isExpired ? 'EXPIRED' : 'Expires in'} ({item.date})
                            </span>
                          </div>
                          {isExpired ? (
                            <button className={styles.writeOffBtn}>Write Off</button>
                          ) : (
                            <button className={styles.discountBtn}>Discount Sell</button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ── MODALS ──────────────────────────────────────────────── */}
      {modal && (
        <div className={styles.modalOverlay} onClick={() => setModal(null)}>
          <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              {modal === 'stockCount'   && <><ClipboardCheck size={20} /> Stock Count</>}
              {modal === 'receiveStock' && <><PackagePlus size={20} /> Receive Stock</>}
              {modal === 'salesReport'  && <><BarChart3 size={20} /> Sales Report</>}
              <button className={styles.modalClose} onClick={() => setModal(null)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>

              {/* ── Stock Count ── */}
              {modal === 'stockCount' && (
                modalLoading ? (
                  <div className={styles.modalLoading}><Loader2 size={24} className={styles.spin} /> Loading products…</div>
                ) : (
                  <table className={styles.stockTable}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Current Stock</th>
                        <th>Reorder Level</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalProducts.map((p, idx) => (
                        <tr key={p.id}>
                          <td>{idx + 1}</td>
                          <td>{p.name}</td>
                          <td>{p.category_name || '—'}</td>
                          <td><strong>{p.stock_quantity}</strong> {p.price_unit || ''}</td>
                          <td>{p.reorder_level}</td>
                          <td>
                            {p.stock_quantity <= p.reorder_level
                              ? <span className={styles.badgeDanger}>⚠️ Low</span>
                              : <span className={styles.badgeOk}>✅ OK</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}

              {/* ── Receive Stock ── */}
              {modal === 'receiveStock' && (
                <div className={styles.receiveForm}>
                  <label>Select Product</label>
                  {modalLoading ? (
                    <div className={styles.modalLoading}><Loader2 size={18} className={styles.spin} /> Loading…</div>
                  ) : (
                    <select
                      value={receiveForm.productId}
                      onChange={e => setReceiveForm(f => ({ ...f, productId: e.target.value }))}
                    >
                      <option value="">— Choose product —</option>
                      {modalProducts.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Current: {p.stock_quantity})
                        </option>
                      ))}
                    </select>
                  )}

                  <label>Quantity to Add</label>
                  <input
                    type="number"
                    min="1"
                    value={receiveForm.qty}
                    onChange={e => setReceiveForm(f => ({ ...f, qty: e.target.value }))}
                  />

                  <label>Reason / Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. Purchase Order #123"
                    value={receiveForm.reason}
                    onChange={e => setReceiveForm(f => ({ ...f, reason: e.target.value }))}
                  />

                  <button
                    className={styles.receiveSubmitBtn}
                    onClick={handleReceiveSubmit}
                    disabled={receiveSubmitting || !receiveForm.productId}
                  >
                    {receiveSubmitting
                      ? <><Loader2 size={16} className={styles.spin} /> Updating…</>
                      : <><CheckCircle2 size={16} /> Confirm Receipt</>}
                  </button>
                </div>
              )}

              {/* ── Sales Report ── */}
              {modal === 'salesReport' && (
                <div className={styles.salesReport}>
                  <div className={styles.reportGrid}>
                    <div className={styles.reportCard} style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
                      <Banknote size={28} style={{ color: '#2563eb' }} />
                      <span className={styles.reportLabel}>Total Revenue</span>
                      <span className={styles.reportValue}>
                        {parseFloat(stats.totalSales).toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB
                      </span>
                    </div>
                    <div className={styles.reportCard} style={{ background: '#dcfce7', borderColor: '#bbf7d0' }}>
                      <Users size={28} style={{ color: '#059669' }} />
                      <span className={styles.reportLabel}>Customers Served</span>
                      <span className={styles.reportValue}>{stats.customersServed}</span>
                    </div>
                    <div className={styles.reportCard} style={{ background: '#ffedd5', borderColor: '#fed7aa' }}>
                      <AlertTriangle size={28} style={{ color: '#b45309' }} />
                      <span className={styles.reportLabel}>Low Stock Items</span>
                      <span className={styles.reportValue}>{stats.lowStockAlerts.length}</span>
                    </div>
                    <div className={styles.reportCard} style={{ background: '#fee2e2', borderColor: '#fecaca' }}>
                      <CalendarX size={28} style={{ color: '#dc2626' }} />
                      <span className={styles.reportLabel}>Expired/Expiring</span>
                      <span className={styles.reportValue}>{stats.expiredList.length}</span>
                    </div>
                  </div>
                  <p style={{ marginTop: 16, color: '#64748b', fontSize: '0.85rem', textAlign: 'center' }}>
                    Data reflects all-time totals from the database.
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Quick fix for PlusCircle icon
const PlusCircle = ({size}) => <Plus size={size} />;

export default PharmacyOverview;
