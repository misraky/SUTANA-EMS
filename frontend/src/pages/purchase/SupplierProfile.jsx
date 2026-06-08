import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import purchaseService from '../../services/purchaseService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './SupplierProfile.module.css';

const SupplierProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [recentPOs, setRecentPOs] = useState([]);
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('priceHistory');
  const [priceFilter, setPriceFilter] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await purchaseService.getSupplierById(id);
        const { supplier: s, recentPOs: pos, priceHistory: ph } = res.data;
        setSupplier(s);
        setRecentPOs(pos || []);
        setPriceHistory(ph || []);
      } catch (err) {
        setError('Failed to load supplier profile. The supplier may not exist.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const filteredHistory = priceHistory.filter(item =>
    priceFilter === '' ||
    item.product_name?.toLowerCase().includes(priceFilter.toLowerCase()) ||
    item.sku?.toLowerCase().includes(priceFilter.toLowerCase()) ||
    item.po_number?.toLowerCase().includes(priceFilter.toLowerCase())
  );

  // Compute unique products and cheapest vs latest price for negotiation insight
  const priceInsights = React.useMemo(() => {
    const byProduct = {};
    priceHistory.forEach(item => {
      const key = item.product_name;
      if (!byProduct[key]) {
        byProduct[key] = { product: key, sku: item.sku, prices: [] };
      }
      byProduct[key].prices.push({ price: parseFloat(item.unit_price), date: item.order_date });
    });
    return Object.values(byProduct).map(p => {
      const sorted = [...p.prices].sort((a, b) => new Date(b.date) - new Date(a.date));
      const latest = sorted[0]?.price;
      const lowest = Math.min(...p.prices.map(x => x.price));
      const highest = Math.max(...p.prices.map(x => x.price));
      const trend = sorted.length > 1 ? (sorted[0].price > sorted[1].price ? 'up' : sorted[0].price < sorted[1].price ? 'down' : 'stable') : 'stable';
      return { ...p, latest, lowest, highest, trend, count: p.prices.length };
    });
  }, [priceHistory]);

  const getStatusClass = (status) => {
    const s = (status || '').toLowerCase().replace(/\s+/g, '_');
    return styles[s] || styles.draft;
  };

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner}></div>
        <p>Loading supplier profile...</p>
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className={styles.errorState}>
        <div className={styles.errorIcon}>⚠️</div>
        <p>{error || 'Supplier not found.'}</p>
        <button className={styles.btnBack} onClick={() => navigate('/purchase/suppliers')}>← Back to Suppliers</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.btnBack} onClick={() => navigate('/purchase/suppliers')}>
          ← Back to Suppliers
        </button>
        <div className={styles.headerInfo}>
          <div className={styles.avatarCircle}>
            {supplier.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className={styles.supplierName}>{supplier.name}</h1>
            <div className={styles.supplierMeta}>
              <span className={`${styles.statusBadge} ${supplier.is_active ? styles.active : styles.inactive}`}>
                {supplier.is_active ? '● Active' : '● Inactive'}
              </span>
              {supplier.payment_terms_name && (
                <span className={styles.metaTag}>💳 {supplier.payment_terms_name}</span>
              )}
              {supplier.lead_time_days != null && (
                <span className={styles.metaTag}>🚚 {supplier.lead_time_days} day lead time</span>
              )}
            </div>
          </div>
        </div>
        <button
          className={styles.btnCreatePO}
          onClick={() => navigate('/purchase/orders/create', { state: { supplierId: supplier.id, supplierName: supplier.name } })}
        >
          + New PO for this Supplier
        </button>
      </div>

      {/* Info Cards Row */}
      <div className={styles.infoGrid}>
        <div className={styles.infoCard}>
          <span className={styles.infoLabel}>Contact Person</span>
          <span className={styles.infoValue}>{supplier.contact_person || '—'}</span>
        </div>
        <div className={styles.infoCard}>
          <span className={styles.infoLabel}>Phone</span>
          <span className={styles.infoValue}>{supplier.phone || '—'}</span>
        </div>
        <div className={styles.infoCard}>
          <span className={styles.infoLabel}>Email</span>
          <span className={styles.infoValue}>{supplier.email || '—'}</span>
        </div>
        <div className={styles.infoCard}>
          <span className={styles.infoLabel}>Address</span>
          <span className={styles.infoValue}>{supplier.address || '—'}</span>
        </div>
        <div className={styles.infoCard}>
          <span className={styles.infoLabel}>Tax ID</span>
          <span className={styles.infoValue}>{supplier.tax_id || '—'}</span>
        </div>
        <div className={styles.infoCard}>
          <span className={styles.infoLabel}>Bank Account</span>
          <span className={styles.infoValue}>{supplier.bank_account || '—'}</span>
        </div>
      </div>

      {/* Price Insight Summary */}
      {priceInsights.length > 0 && (
        <div className={styles.insightBanner}>
          <div className={styles.insightTitle}>📊 Procurement Intelligence — {priceInsights.length} product(s) tracked</div>
          <div className={styles.insightGrid}>
            {priceInsights.slice(0, 4).map((item, idx) => (
              <div key={idx} className={styles.insightCard}>
                <div className={styles.insightProduct}>{item.product}</div>
                <div className={styles.insightRow}>
                  <span className={styles.insightLatestLabel}>Latest Price</span>
                  <span className={styles.insightLatest}>{formatCurrency(item.latest)}</span>
                  <span className={`${styles.trendBadge} ${styles[`trend_${item.trend}`]}`}>
                    {item.trend === 'up' ? '↑' : item.trend === 'down' ? '↓' : '→'}
                  </span>
                </div>
                <div className={styles.insightRange}>
                  Low: {formatCurrency(item.lowest)} · High: {formatCurrency(item.highest)} · {item.count} orders
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabBar}>
        <button
          className={`${styles.tab} ${activeTab === 'priceHistory' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('priceHistory')}
        >
          📊 Price History Catalog {priceHistory.length > 0 && <span className={styles.tabBadge}>{priceHistory.length}</span>}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'recentPOs' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('recentPOs')}
        >
          📄 Recent Purchase Orders {recentPOs.length > 0 && <span className={styles.tabBadge}>{recentPOs.length}</span>}
        </button>
      </div>

      {/* Tab: Price History */}
      {activeTab === 'priceHistory' && (
        <div className={styles.tabPanel}>
          <div className={styles.panelToolbar}>
            <p className={styles.panelHint}>
              Complete price catalog from all approved/completed POs. Use this to negotiate better deals.
            </p>
            <input
              className={styles.searchInput}
              placeholder="🔍 Filter by product, SKU or PO..."
              value={priceFilter}
              onChange={e => setPriceFilter(e.target.value)}
            />
          </div>
          {filteredHistory.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📋</div>
              <p>{priceFilter ? 'No items match your filter.' : 'No price history yet. Price data will appear after POs are approved and completed.'}</p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>PO Number</th>
                    <th>Order Date</th>
                    <th>Product / Description</th>
                    <th>SKU</th>
                    <th className={styles.textRight}>Qty</th>
                    <th className={styles.textRight}>Unit Price</th>
                    <th className={styles.textRight}>Line Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((item, idx) => (
                    <tr key={idx} className={styles.dataRow}>
                      <td className={styles.poNum}>{item.po_number}</td>
                      <td>{formatDate(item.order_date, 'short')}</td>
                      <td><strong>{item.product_name}</strong></td>
                      <td className={styles.skuText}>{item.sku || '—'}</td>
                      <td className={styles.textRight}>{item.quantity_ordered}</td>
                      <td className={`${styles.textRight} ${styles.priceCell}`}>{formatCurrency(item.unit_price)}</td>
                      <td className={`${styles.textRight} ${styles.totalCell}`}>{formatCurrency(item.line_total)}</td>
                      <td>
                        <span className={`${styles.statusPill} ${getStatusClass(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Recent POs */}
      {activeTab === 'recentPOs' && (
        <div className={styles.tabPanel}>
          {recentPOs.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📄</div>
              <p>No purchase orders have been placed with this supplier yet.</p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>PO Number</th>
                    <th>Order Date</th>
                    <th>Expected Delivery</th>
                    <th className={styles.textRight}>Total Amount</th>
                    <th className={styles.textRight}>Paid</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recentPOs.map(po => (
                    <tr key={po.id} className={styles.dataRow}>
                      <td className={styles.poNum}>{po.po_number}</td>
                      <td>{formatDate(po.created_at, 'short')}</td>
                      <td>{po.expected_delivery_date ? formatDate(po.expected_delivery_date, 'short') : '—'}</td>
                      <td className={`${styles.textRight} ${styles.priceCell}`}>{formatCurrency(po.total_amount)}</td>
                      <td className={`${styles.textRight} ${po.paid_amount >= po.total_amount ? styles.paidFull : styles.paidPartial}`}>
                        {formatCurrency(po.paid_amount || 0)}
                      </td>
                      <td>
                        <span className={`${styles.statusPill} ${getStatusClass(po.status)}`}>
                          {po.status}
                        </span>
                      </td>
                      <td>
                        <Link to={`/purchase/orders/${po.id}`} className={styles.viewLink}>View →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SupplierProfile;
