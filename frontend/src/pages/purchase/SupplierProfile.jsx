import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import purchaseService from '../../services/purchaseService';
import { formatCurrency, formatDate } from '../../utils/formatters';
const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');
import styles from './SupplierProfile.module.css';

const SupplierProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [recentPOs, setRecentPOs] = useState([]);
  const [priceHistory, setPriceHistory] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('priceHistory');
  const [priceFilter, setPriceFilter] = useState('');
  
  // Award Form State
  const [awardDocument, setAwardDocument] = useState(null);
  const [awardProducts, setAwardProducts] = useState([{ product_name: '', awarded_unit_price: '' }]);
  const [isSubmittingAward, setIsSubmittingAward] = useState(false);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const res = await purchaseService.getSupplierById(id);
      const { supplier: s, recentPOs: pos, priceHistory: ph, documents: docs, catalog: cat } = res.data;
      setSupplier(s);
      setRecentPOs(pos || []);
      setPriceHistory(ph || []);
      setDocuments(docs || []);
      setCatalog(cat || []);
    } catch (err) {
      setError('Failed to load supplier profile. The supplier may not exist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [id]);

  const handleAddProductRow = () => setAwardProducts([...awardProducts, { product_name: '', awarded_unit_price: '' }]);
  const handleRemoveProductRow = (index) => setAwardProducts(awardProducts.filter((_, i) => i !== index));
  const handleProductChange = (index, field, value) => {
    const newProducts = [...awardProducts];
    newProducts[index][field] = value;
    setAwardProducts(newProducts);
  };

  const handleAwardSubmit = async (e) => {
    e.preventDefault();
    if (!awardDocument && awardProducts.length === 0) return;
    try {
      setIsSubmittingAward(true);
      const formData = new FormData();
      if (awardDocument) formData.append('document', awardDocument);
      formData.append('products', JSON.stringify(awardProducts.filter(p => p.product_name && p.awarded_unit_price)));
      
      await purchaseService.awardSupplierBid(id, formData);
      alert('Supplier award details saved successfully!');
      setAwardDocument(null);
      setAwardProducts([{ product_name: '', awarded_unit_price: '' }]);
      fetchProfileData();
    } catch (error) {
      alert('Failed to save award details: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmittingAward(false);
    }
  };

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
        <button
          className={`${styles.tab} ${activeTab === 'awardBid' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('awardBid')}
        >
          🏆 Bid Award & Catalog
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

      {/* Tab: Award Bid */}
      {activeTab === 'awardBid' && (
        <div className={styles.tabPanel}>
          <div className={styles.panelToolbar}>
            <p className={styles.panelHint}>
              Upload a bid award document or contract and register the approved catalog prices for this supplier.
            </p>
          </div>
          
          <form className={styles.awardForm} onSubmit={handleAwardSubmit}>
            <div className={styles.formSection}>
              <h3>1. Upload Bid Award Document</h3>
              <input 
                type="file" 
                accept=".pdf,.doc,.docx,.jpg,.png" 
                onChange={e => setAwardDocument(e.target.files[0])}
                className={styles.fileInput}
              />
            </div>
            
            <div className={styles.formSection}>
              <h3>2. Register Awarded Products & Prices</h3>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Product / Description</th>
                    <th>Awarded Unit Price (ETB)</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {awardProducts.map((p, idx) => (
                    <tr key={idx}>
                      <td>
                        <input 
                          type="text" 
                          placeholder="e.g. Dell XPS 15" 
                          value={p.product_name}
                          onChange={e => handleProductChange(idx, 'product_name', e.target.value)}
                          style={{ width: '100%', padding: '8px' }}
                          required
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00" 
                          value={p.awarded_unit_price}
                          onChange={e => handleProductChange(idx, 'awarded_unit_price', e.target.value)}
                          style={{ width: '100%', padding: '8px' }}
                          required
                        />
                      </td>
                      <td>
                        <button type="button" onClick={() => handleRemoveProductRow(idx)} style={{color: 'red', cursor: 'pointer', background: 'none', border: 'none'}}>
                          ✕ Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="button" className={styles.btnAddRow} onClick={handleAddProductRow} style={{ marginTop: '10px', padding: '8px', cursor: 'pointer'}}>
                + Add Another Product
              </button>
            </div>
            
            <div style={{ marginTop: '20px' }}>
              <button type="submit" disabled={isSubmittingAward} className={styles.btnCreatePO}>
                {isSubmittingAward ? 'Saving...' : 'Save Award Details'}
              </button>
            </div>
          </form>

          {/* Read-Only Existing Data */}
          <div style={{ display: 'flex', gap: '2rem', marginTop: '3rem' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ marginBottom: '1rem' }}>Registered Catalog</h3>
              {catalog.length === 0 ? <p>No items registered.</p> : (
                <table className={styles.dataTable}>
                  <thead><tr><th>Product</th><th>Price</th><th>Effective Date</th></tr></thead>
                  <tbody>
                    {catalog.map(c => (
                      <tr key={c.id}>
                        <td>{c.product_name}</td>
                        <td>{formatCurrency(c.awarded_unit_price)}</td>
                        <td>{formatDate(c.effective_date, 'short')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ marginBottom: '1rem' }}>Award Documents</h3>
              {documents.length === 0 ? <p>No documents uploaded.</p> : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {documents.map(d => (
                    <li key={d.id} style={{ marginBottom: '10px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
                      📄 <strong>{d.document_name}</strong> <br/>
                      <small>Type: {d.document_type} | Uploaded: {formatDate(d.uploaded_at, 'short')}</small>
                      {d.file_url && (
                        <a href={`${API_ORIGIN}${d.file_url}`} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: '5px', color: '#0d6efd' }}>
                          Download / View
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierProfile;
