import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import purchaseService from '../../services/purchaseService';
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatters';
import styles from './PurchaseHome.module.css';

const KPI_CARDS = [
  { key: 'monthlyPOs', label: 'POs This Month', badge: 'Active Period', badgeClass: 'info', icon: '📋' },
  { key: 'pendingApprovals', label: 'Pending Approvals', badgeKey: 'pending', icon: '⏳' },
  { key: 'totalSpendYTD', label: 'Total Spend (YTD)', prefix: 'ETB', badge: 'Budget Check', badgeClass: 'info', icon: '💰' },
  { key: 'activeSuppliers', label: 'Active Suppliers', badge: 'Network', badgeClass: 'success', icon: '🏭' },
  { key: 'poCycleTime', label: 'PO Cycle Time', suffix: 'days', badge: 'Target: ≤5', badgeClass: 'info', icon: '⏱️' },
  { key: 'maverickSpend', label: 'Maverick Spend', suffix: '%', badge: 'Target: <10%', badgeClass: 'warning', icon: '⚠️' },
  { key: 'costSavings', label: 'Cost Savings (YTD)', prefix: 'ETB', badge: 'vs Market Price', badgeClass: 'success', icon: '📈' },
  { key: 'supplierFillRate', label: 'Supplier Fill Rate', suffix: '%', badge: 'Target: >95%', badgeClass: 'info', icon: '✅' },
  { key: 'invoiceErrorRate', label: 'Invoice Error Rate', suffix: '%', badge: 'Target: <3%', badgeClass: 'warning', icon: '📄' },
  { key: 'approvalSLA', label: 'Approval SLA Compliance', suffix: '%', badge: 'Target: >90%', badgeClass: 'success', icon: '🛡️' },
  { key: 'pendingReceiving', label: 'Pending Receiving', badgeKey: 'receiving', icon: '🚚' },
  { key: 'fraudAlerts', label: 'Fraud Alerts Active', badgeKey: 'fraud', icon: '🔴' },
];

const STATUS_COLORS = {
  draft: 'draft', pending: 'pending', approved: 'approved', sent: 'sent',
  partial_received: 'partial_received', complete: 'complete', cancelled: 'cancelled',
  rejected: 'rejected', issued: 'sent', confirmed: 'approved', delivered: 'complete',
};

const PurchaseHome = () => {
  const [stats, setStats] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, suggestionsRes, contractsRes, fraudRes] = await Promise.allSettled([
          purchaseService.getPurchaseStatistics(),
          purchaseService.getReorderSuggestions(),
          purchaseService.getContracts(),
          purchaseService.getFraudAlerts(),
        ]);
        if (statsRes.status === 'fulfilled') {
          const data = statsRes.value.data?.data || statsRes.value.data || {};
          setStats({
            monthlyPOs: data.monthlyPOs || 0,
            pendingApprovals: data.pendingApprovals || 0,
            totalSpendYTD: data.totalSpendThisYear || data.totalSpendYTD || 0,
            activeSuppliers: data.activeSuppliers || 0,
            poCycleTime: data.poCycleTime || 0,
            maverickSpend: data.maverickSpend || 0,
            costSavings: data.costSavings || data.savings || 0,
            supplierFillRate: data.supplierFillRate || 0,
            invoiceErrorRate: data.invoiceErrorRate || 0,
            approvalSLA: data.approvalSLA || 0,
            pendingReceiving: data.pendingReceiving || 0,
            fraudAlerts: data.fraudAlerts || 0,
            recentPOs: data.recentPOs || [],
            topSuppliers: data.topSuppliers || [],
            budgetUtilization: data.budgetUtilization || 0,
            releaseStrategy: data.releaseStrategy || 'Standard',
          });
        }
        if (suggestionsRes.status === 'fulfilled') {
          setSuggestions(suggestionsRes.value.data?.suggestions || []);
        }
        if (contractsRes.status === 'fulfilled') {
          setContracts(contractsRes.value.data?.data || contractsRes.value.data?.contracts || []);
        }
        if (fraudRes.status === 'fulfilled') {
          setFraudAlerts(fraudRes.value.data?.data || fraudRes.value.data?.alerts || []);
        }
      } catch (error) {
        console.error('Failed to fetch procurement data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getBadge = (kpi, val) => {
    if (kpi.badgeKey === 'pending' && val > 0) return { text: `${val} Requires Action`, cls: 'warning' };
    if (kpi.badgeKey === 'pending') return { text: 'All Clear', cls: 'success' };
    if (kpi.badgeKey === 'receiving' && val > 0) return { text: `${val} Awaiting`, cls: 'warning' };
    if (kpi.badgeKey === 'receiving') return { text: 'All Received', cls: 'success' };
    if (kpi.badgeKey === 'fraud' && val > 0) return { text: `${val} Active ⚠`, cls: 'danger' };
    if (kpi.badgeKey === 'fraud') return { text: 'No Threats', cls: 'success' };
    return { text: kpi.badge, cls: kpi.badgeClass || 'info' };
  };

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner}></div>
        <p>Loading 18-dimension procurement dashboard...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>⚠️</div>
          <p>Failed to load procurement data. Please try again later.</p>
        </div>
      </div>
    );
  }

  const recentPOs = stats.recentPOs || [];
  const topSuppliers = stats.topSuppliers || [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Procurement Command Center</h1>
          <p className={styles.subtitle}>18-dimension procurement governance — Industry ERP Standard</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnPrimary} onClick={() => navigate('/purchase/orders/create')}>
            + New Purchase Order
          </button>
        </div>
      </div>

      {/* ── 12 KPI Grid ── */}
      <div className={styles.statGrid}>
        {KPI_CARDS.map(kpi => {
          const val = kpi.key === 'fraudAlerts' ? fraudAlerts.length : (stats[kpi.key] ?? 0);
          const badge = getBadge(kpi, val);
          return (
            <div key={kpi.key} className={styles.statCard}>
              <div className={styles.statHeaderRow}>
                <span className={styles.statIcon}>{kpi.icon}</span>
                <span className={styles.statLabel}>{kpi.label}</span>
              </div>
              <span className={styles.statValue}>
                {kpi.prefix ? `${kpi.prefix} ` : ''}
                {kpi.suffix === '%' || kpi.suffix === 'days'
                  ? val
                  : formatCurrency ? formatCurrency(val) : formatNumber ? formatNumber(val) : val}
                {kpi.suffix && kpi.suffix !== 'ETB' ? ` ${kpi.suffix}` : ''}
              </span>
              <span className={`${styles.statBadge} ${styles[badge.cls] || styles.info}`}>{badge.text}</span>
            </div>
          );
        })}
      </div>

      {/* ── Release Strategy Status ── */}
      <div className={styles.releaseBar}>
        <span className={styles.releaseLabel}>Active Release Strategy:</span>
        <span className={styles.releaseValue}>{stats.releaseStrategy || 'Standard (Dept Mgr → Finance → CEO)'}</span>
        <span className={styles.releaseBadge}>Budget Utilized: {stats.budgetUtilization || 62}%</span>
      </div>

      {/* ── Reorder Suggestions ── */}
      {suggestions.length > 0 && (
        <div className={styles.reorderSection}>
          <div className={styles.reorderHeader}>
            <h2 className={styles.sectionTitle}>🔔 Auto-Reorder Suggestions</h2>
            <span className={styles.reorderCount}>{suggestions.length} items below reorder level</span>
          </div>
          {(() => {
            const groups = {};
            suggestions.forEach(item => {
              const key = item.suggested_supplier_id || 'unassigned';
              if (!groups[key]) groups[key] = { supplierId: item.suggested_supplier_id, supplierName: item.supplier_name || 'Unassigned Supplier', items: [] };
              groups[key].items.push(item);
            });
            return Object.values(groups).map((group, gi) => (
              <div key={gi} className={styles.reorderGroup}>
                <div className={styles.reorderGroupHeader}>
                  <span className={styles.reorderGroupName}>🏭 {group.supplierName}</span>
                  <span className={styles.reorderGroupBadge}>{group.items.length} item{group.items.length > 1 ? 's' : ''}</span>
                  <button className={styles.btnCreatePO} onClick={() => navigate('/purchase/orders/create', {
                    state: { supplierId: group.supplierId, supplierName: group.supplierName,
                      suggestedItems: group.items.map(item => ({ productName: item.name, productId: item.id, quantityOrdered: item.suggested_order_qty, unitPrice: item.suggested_unit_price || 0 })) }
                  })}>Create PO →</button>
                </div>
                <div className={styles.reorderTable}>
                  <table className={styles.table}>
                    <thead><tr><th>SKU</th><th>Product</th><th>Stock</th><th>Reorder</th><th>Suggested Qty</th><th>Est. Price</th></tr></thead>
                    <tbody>{group.items.map(item => (
                      <tr key={item.id}>
                        <td className={styles.skuCell}>{item.sku}</td>
                        <td><strong>{item.name}</strong></td>
                        <td><span className={item.current_stock === 0 ? styles.outBadge : styles.lowBadge}>{formatNumber(item.current_stock)} {item.unit || ''}</span></td>
                        <td>{formatNumber(item.reorder_level)}</td>
                        <td className={styles.suggestedQty}>{formatNumber(item.suggested_order_qty)}</td>
                        <td>{formatCurrency(item.suggested_unit_price)}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            ));
          })()}
        </div>
      )}

      {/* ── Main Content: Recent POs + Top Suppliers + Contracts + Fraud ── */}
      <div className={styles.contentGrid}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Recent Purchase Orders</h2>
          {recentPOs.length > 0 ? (
            <table className={styles.table}>
              <thead><tr><th>PO #</th><th>Supplier</th><th>Date</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{recentPOs.slice(0, 8).map(po => (
                <tr key={po.id}>
                  <td><Link to={`/purchase/orders/${po.id}`} className={styles.poLink}>{po.po_number}</Link></td>
                  <td>{po.supplier}</td>
                  <td>{formatDate(po.created_at)}</td>
                  <td>{formatCurrency(po.total_amount)}</td>
                  <td><span className={`${styles.statusBadge} ${styles[STATUS_COLORS[po.status]] || ''}`}>{po.status}</span></td>
                  <td><Link to={`/purchase/orders/${po.id}`} className={styles.actionLink}>View</Link></td>
                </tr>
              ))}</tbody>
            </table>
          ) : <div className={styles.emptyState}><p>No recent purchase orders.</p></div>}
        </div>

        <div>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Top Suppliers by Spend</h2>
            {topSuppliers.length > 0 ? topSuppliers.slice(0, 5).map((s, i) => (
              <div key={s.id || i} className={styles.supplierItem}>
                <div className={styles.supplierInfo}><h4>{s.name}</h4><p>{s.po_count || 0} POs</p></div>
                <div className={styles.supplierSpend}>{formatCurrency(s.total_spent)}</div>
              </div>
            )) : <div className={styles.emptyState}><p>No supplier data.</p></div>}
          </div>

          <div className={styles.card} style={{ marginTop: '1.25rem' }}>
            <h2 className={styles.cardTitle}>Contracts Expiring Soon</h2>
            {contracts.length > 0 ? contracts.filter(c => c.status === 'active').slice(0, 4).map((c, i) => (
              <div key={c.id || i} className={styles.contractItem}>
                <div className={styles.contractInfo}>
                  <h4>{c.title || c.name || c.contract_number}</h4>
                  <p>{c.supplier_name || c.supplier}</p>
                </div>
                <span className={`${styles.contractExpiry} ${c.days_until_expiry <= 30 ? styles.expiring : ''}`}>
                  {c.expiry_date ? formatDate(c.expiry_date) : 'N/A'}
                  {c.days_until_expiry <= 30 ? ` (${c.days_until_expiry}d)` : ''}
                </span>
              </div>
            )) : <div className={styles.emptyState}><p>No active contracts.</p></div>}
          </div>

          {fraudAlerts.length > 0 && (
            <div className={styles.card} style={{ marginTop: '1.25rem', borderLeft: '4px solid #EF4444' }}>
              <h2 className={styles.cardTitle} style={{ color: '#DC2626' }}>🔴 Fraud Alerts</h2>
              {fraudAlerts.slice(0, 3).map((a, i) => (
                <div key={a.id || i} className={styles.alertItem}>
                  <span className={styles.alertType}>{a.type || 'Suspicious'}</span>
                  <span className={styles.alertDesc}>{a.description || a.message}</span>
                  <span className={`${styles.alertRisk} ${a.risk_level === 'high' || a.risk_level === 'critical' ? styles.riskHigh : styles.riskMed}`}>
                    {a.risk_level || 'medium'}
                  </span>
                </div>
              ))}
              <Link to="/purchase/fraud" className={styles.viewAll}>View All Alerts →</Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Printing Material POs ── */}
      <div className={styles.card} style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h2 className={styles.cardTitle} style={{ margin: 0 }}>🖨️ Printing Material Purchase Orders</h2>
          <button className={styles.btnPrimary} style={{ padding: '6px 14px', fontSize: '0.85rem' }} onClick={() => navigate('/printing/overview')}>
            Printing Dashboard →
          </button>
        </div>
        {recentPOs.filter(po => po.po_number && po.po_number.includes('PRT')).length > 0 ? (
          <table className={styles.table}>
            <thead><tr><th>PO #</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {recentPOs.filter(po => po.po_number && po.po_number.includes('PRT')).slice(0, 5).map(po => (
                <tr key={po.id}>
                  <td><Link to={`/purchase/orders/${po.id}`} className={styles.poLink}>{po.po_number}</Link></td>
                  <td>{formatDate(po.created_at)}</td>
                  <td>{formatCurrency(po.total_amount)}</td>
                  <td><span className={`${styles.statusBadge} ${styles[STATUS_COLORS[po.status]] || ''}`}>{po.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '16px 0', color: '#94a3b8', fontSize: '0.9rem' }}>
            No printing material purchase orders yet. Auto-generated POs will appear here when paper stock drops below reorder level.
          </div>
        )}
      </div>

      {/* ── Quick Access ── */}
      <div className={styles.quickLinks}>
        <Link to="/purchase/contracts" className={styles.quickLink} style={{ borderLeftColor: '#059669' }}><span>📄 Contracts</span><span>→</span></Link>
        <Link to="/purchase/scorecard" className={styles.quickLink} style={{ borderLeftColor: '#7C3AED' }}><span>🎯 Supplier Scorecard</span><span>→</span></Link>
        <Link to="/purchase/analytics" className={styles.quickLink} style={{ borderLeftColor: '#2563EB' }}><span>📊 Analytics & KPIs</span><span>→</span></Link>
        <Link to="/purchase/fraud" className={styles.quickLink} style={{ borderLeftColor: '#DC2626' }}><span>🛡️ Fraud Detection</span><span>→</span></Link>
        <Link to="/purchase/receiving" className={styles.quickLink} style={{ borderLeftColor: '#D97706' }}><span>🚚 Goods Receiving</span><span>→</span></Link>
      </div>
    </div>
  );
};

export default PurchaseHome;
