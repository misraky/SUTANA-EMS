import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/apiClient';
import inventoryService from '../../services/inventoryService';
import { formatNumber } from '../../utils/formatters';
import { useAuth } from '../../hooks/useAuth';
import styles from './StoreHome.module.css';
const StoreHome = () => {
  const [stats, setStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [pendingAdjustments, setPendingAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canApprove = hasPermission('inventory:manager_approve');

  const handleApprove = async (id) => {
    try {
      await inventoryService.approveAdjustment(id);
      setPendingAdjustments(prev => prev.filter(a => a.id !== id));
      // Refresh stats
      inventoryService.getStatistics().then(res => setStats(res.data));
    } catch (e) {
      alert('Failed to approve adjustment');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;
    try {
      await inventoryService.rejectAdjustment(id, reason);
      setPendingAdjustments(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      alert('Failed to reject adjustment');
    }
  };
  const [purchaseItem, setPurchaseItem] = useState(null);
  const [purchaseForm, setPurchaseForm] = useState({ quantity_requested: 1, reason: '' });
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseMsg, setPurchaseMsg] = useState(null);
  const [purchaseRowId, setPurchaseRowId] = useState(null);
  const [myRequests, setMyRequests] = useState([]);
  const [requestDetail, setRequestDetail] = useState(null);
  const activeProductRequests = new Set(
    myRequests.filter(r => !['APPROVED', 'REJECTED'].includes(r.status)).map(r => r.product_name.toLowerCase().trim())
  );
  const loadReqs = () => axios.get('/store/purchase-research').then(r => {
    if (r.status === 'success') setMyRequests(r.data);
  });
  const viewDetail = async (id) => {
    try {
      const res = await axios.get(`/store/purchase-research/${id}`);
      if (res.status === 'success') setRequestDetail(res.data);
    } catch (e) { console.error(e); }
  };

  const openPurchaseModal = (item) => {
    setPurchaseItem(item);
    setPurchaseForm({ quantity_requested: Math.max(1, item.reorder_level || 1), reason: `Low stock alert: only ${item.current_stock} ${item.unit || 'units'} remaining` });
  };

  const createPurchaseRequest = async (e) => {
    e.preventDefault();
    if (!purchaseItem) return;
    setPurchaseLoading(true);
    try {
      const payload = {
        product_name: purchaseItem.name,
        quantity_requested: purchaseForm.quantity_requested,
        reason: purchaseForm.reason,
        current_stock: purchaseItem.current_stock,
      };
      await axios.post('/store/purchase-research', payload);
      const rowId = purchaseItem.id;
      setPurchaseItem(null);
      setPurchaseForm({ quantity_requested: 1, reason: '' });
      setPurchaseRowId(rowId);
      setPurchaseMsg('Purchase request submitted');
      loadReqs();
      setTimeout(() => { setPurchaseMsg(null); setPurchaseRowId(null); }, 4000);
    } catch (e) {
      alert(e.message || 'Failed to create purchase request');
    } finally {
      setPurchaseLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, lowStockRes] = await Promise.all([
          inventoryService.getStatistics(),
          inventoryService.getLowStock(),
        ]);
        setStats(statsRes.data);
        setLowStock(lowStockRes.data.products || []);
      } catch (err) {
        console.error('Failed to fetch store stats:', err);
        setError('Failed to load store data. Please refresh.');
      }

      try {
        const pendingRes = await inventoryService.getPendingAdjustments();
        setPendingAdjustments(pendingRes.data?.adjustments || []);
      } catch (err) {
        // user might not have inventory:approve permission, ignore
      }
      loadReqs();
      setLoading(false);
    };
    fetchData();
  }, []);
  if (loading) return (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner}></div>
      <p>Analysing warehouse stock…</p>
    </div>
  );
  if (error) return (
    <div className={styles.errorContainer}>
      <span>⚠️</span>
      <p>{error}</p>
      <button onClick={() => window.location.reload()}>Retry</button>
    </div>
  );
  const quickActions = [
    {
      icon: '➕',
      label: 'Register New Stock',
      desc: 'Add stock to existing products',
      path: '/store/adjustment',
      color: '#10b981',
    },
    {
      icon: '📋',
      label: 'Inventory List',
      desc: 'View & manage all products',
      path: '/store/inventory',
      color: '#3b82f6',
    },
    {
      icon: '🔄',
      label: 'Stock Movements',
      desc: 'Full transaction history',
      path: '/store/movements',
      color: '#8b5cf6',
    },
    {
      icon: '⚙️',
      label: 'Stock Adjustment',
      desc: 'Manually correct stock levels',
      path: '/store/adjustment',
      color: '#f59e0b',
    },
    {
      icon: '📄',
      label: 'Inventory Report',
      desc: 'Generate and export reports',
      path: '/reports/inventory',
      color: '#06b6d4',
    },
    {
      icon: '🚛',
      label: 'Receive Purchase Order',
      desc: 'Accept new deliveries',
      path: '/store/receive',
      color: '#ef4444',
    },
  ];
  return (
    <div className={styles.storeHome}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Store Manager Dashboard</h1>
          <p className={styles.pageSubtitle}>
            Real-time status of inventory levels, stock adjustments and approvals
          </p>
        </div>
        <div className={styles.headerMeta}>
          <span className={styles.timestamp}>
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      <div className={styles.quickActionsSection}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.actionGrid}>
          {quickActions.map((action) => (
            <button
              key={action.label}
              className={styles.actionCard}
              onClick={() => navigate(action.path)}
            >
              <span className={styles.actionIcon} style={{ background: action.color + '20', color: action.color }}>
                {action.icon}
              </span>
              <div className={styles.actionText}>
                <span className={styles.actionLabel}>{action.label}</span>
                <span className={styles.actionDesc}>{action.desc}</span>
              </div>
              <span className={styles.actionArrow}>→</span>
            </button>
          ))}
        </div>
      </div>
      {}
      {myRequests.length > 0 && (
        <div className={styles.pendingSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 className={styles.sectionTitle} style={{ margin: 0 }}>📋 My Purchase Requests</h2>
            <button onClick={loadReqs} style={{ background: 'none', border: '1px solid #d1d5db', padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: '#374151' }}>Refresh</button>
          </div>
          <div className={styles.alertTable}>
            <table>
              <thead>
                <tr>
                  <th>Request #</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Stage</th>
                  <th>Handler</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {myRequests.map((r) => {
                  const stageLabel = r.status === 'PENDING_PURCHASE' ? '⏳ With Purchase Team' : r.status === 'PENDING_CEO' ? '⏳ Awaiting CEO Review' : r.status === 'MARKET_STUDY' ? '🔍 Market Research' : r.status === 'RESULTS_SUBMITTED' ? '⏳ CEO Decision Pending' : r.status === 'APPROVED' ? '✅ Approved' : '❌ Rejected';
                  const handlerName = r.ceo_handler_name || r.market_handler_name || (r.status === 'PENDING_PURCHASE' ? 'Purchase Team' : '-');
                  return (
                    <tr key={r.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#6b7280', fontWeight: 500 }}>{r.request_number}</td>
                      <td><strong style={{ fontSize: '0.85rem' }}>{r.product_name}</strong></td>
                      <td style={{ fontSize: '0.85rem' }}>{r.quantity_requested}</td>
                      <td>
                        <span className={r.status === 'PENDING_PURCHASE' ? styles.pendingBadge : r.status === 'PENDING_CEO' ? styles.ceoBadge : r.status === 'MARKET_STUDY' ? styles.marketBadge : r.status === 'RESULTS_SUBMITTED' ? styles.ceoBadge : r.status === 'APPROVED' ? styles.approvedBadge : styles.rejectedBadge} style={{ fontSize: '0.7rem', padding: '3px 10px' }}>
                          {stageLabel}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#6b7280' }}>{handlerName}</td>
                      <td style={{ color: '#6b7280', fontSize: '0.78rem' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                      <td>
                        <button onClick={() => viewDetail(r.id)} style={{ background: 'none', border: '1px solid #d1d5db', padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 0.75, color: '#374151', whiteSpace: 'nowrap' }}>View</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {requestDetail && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setRequestDetail(null)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 500, width: '90%', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>{requestDetail.request_number}</h3>
              <button onClick={() => setRequestDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#6b7280' }}>×</button>
            </div>
            <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
              <tbody>
                {[
                  ['Product', requestDetail.product_name],
                  ['Quantity Requested', requestDetail.quantity_requested],
                  ['Current Stock', requestDetail.current_stock ?? '-'],
                  ['Reason', requestDetail.reason || '-'],
                  ['Status', requestDetail.status],
                  ['Stage', requestDetail.status === 'PENDING_PURCHASE' ? 'Waiting for Purchase Team review' : requestDetail.status === 'PENDING_CEO' ? 'Forwarded to CEO for market research assignment' : requestDetail.status === 'MARKET_STUDY' ? 'Market research in progress' : requestDetail.status === 'RESULTS_SUBMITTED' ? 'Results submitted, awaiting CEO decision' : requestDetail.status === 'APPROVED' ? 'Approved — ready for execution' : 'Rejected'],
                  ['Handler', requestDetail.ceo_handler_name || requestDetail.market_handler_name || (requestDetail.status === 'PENDING_PURCHASE' ? 'Purchase Team' : '-')],
                  ['CEO Instructions', requestDetail.ceo_instructions || '-'],
                  ['Research Findings', requestDetail.research_findings || '-'],
                  ['Prices', requestDetail.research_prices || '-'],
                  ['Suppliers', requestDetail.research_suppliers || '-'],
                  ['Quality', requestDetail.research_quality || '-'],
                  ['Availability', requestDetail.research_availability || '-'],
                  ['Market Notes', requestDetail.research_notes || '-'],
                  ['Rejection Reason', requestDetail.rejection_reason || '-'],
                  ['Approval Instructions', requestDetail.approval_instructions || '-'],
                  ['Created', new Date(requestDetail.created_at).toLocaleString()],
                ].map(([label, value]) => (
                  <tr key={label} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 500, color: '#374151', width: '40%', verticalAlign: 'top', fontSize: 13 }}>{label}</td>
                    <td style={{ padding: '8px 12px', color: '#6b7280', fontSize: 13 }}>
                      {label === 'Status' ? (
                        <span className={requestDetail.status === 'APPROVED' ? styles.approvedBadge : requestDetail.status === 'REJECTED' ? styles.rejectedBadge : styles.pendingBadge} style={{ fontSize: '0.72rem', padding: '2px 10px' }}>{value}</span>
                      ) : value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {lowStock.length > 0 && (
        <div className={styles.alertSection}>
          <div className={styles.alertHeader}>
            <h2 className={styles.sectionTitle}>⚠️ Low Stock Alerts</h2>
            <button className={styles.viewAllBtn} onClick={() => navigate('/store/inventory')}>
              View All Inventory →
            </button>
          </div>
          <div className={styles.alertTable}>
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Reorder Level</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.slice(0, 8).map((item) => {
                  const hasActiveReq = activeProductRequests.has(item.name.toLowerCase().trim());
                  return (
                  <tr key={item.id}>
                    <td className={styles.skuCell}>{item.sku}</td>
                    <td><strong>{item.name}</strong></td>
                    <td>{item.category_name || '—'}</td>
                    <td>
                      <span className={item.current_stock === 0 ? styles.outBadge : styles.lowBadge}>
                        {formatNumber(item.current_stock)} {item.unit || ''}
                      </span>
                    </td>
                    <td>{formatNumber(item.reorder_level)}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${item.current_stock === 0 ? styles.outStatus : styles.lowStatus}`}>
                        {item.current_stock === 0 ? 'Out of Stock' : 'Low Stock'}
                      </span>
                    </td>
                    <td>
                      {purchaseRowId === item.id && purchaseMsg ? (
                        <span className={styles.inlineToast}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0}}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                          {purchaseMsg}
                          <button onClick={() => { setPurchaseMsg(null); setPurchaseRowId(null); }} className={styles.toastClose}>×</button>
                        </span>
                      ) : hasActiveReq ? (
                        <span className={styles.requestedBadge}>Request Pending</span>
                      ) : (
                        <button className={styles.purchaseBtn} onClick={() => openPurchaseModal(item)}>
                          Create Purchase Request
                        </button>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {}
      {stats?.topMovingProducts?.length > 0 && (
        <div className={styles.topMovingSection}>
          <h2 className={styles.sectionTitle}>🏆 Top Moving Products (Last 30 Days)</h2>
          <div className={styles.topMovingGrid}>
            {stats.topMovingProducts.slice(0, 5).map((p, idx) => (
              <div key={p.id} className={styles.topMovingCard}>
                <span className={styles.rankBadge}>#{idx + 1}</span>
                <div className={styles.topMovingInfo}>
                  <strong>{p.name}</strong>
                  <span>{p.sku}</span>
                </div>
                <span className={styles.movementCount}>{formatNumber(p.total_movement)} units</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingAdjustments.length > 0 && (
        <div className={styles.alertSection} style={{ marginTop: '2rem' }}>
          <div className={styles.alertHeader}>
            <h2 className={styles.sectionTitle}>⏳ Pending Adjustments (Manager Approval)</h2>
          </div>
          <div className={styles.alertTable}>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Requested Change</th>
                  <th>Reason</th>
                  <th>Requested By</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingAdjustments.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.product_name}</strong></td>
                    <td className={styles.skuCell}>{item.sku}</td>
                    <td>
                      <span className={item.quantity_change > 0 ? styles.positiveStatus : styles.negativeStatus} style={{ fontWeight: 'bold', color: item.quantity_change > 0 ? '#10b981' : '#ef4444' }}>
                        {item.quantity_change > 0 ? '+' : ''}{item.quantity_change}
                      </span>
                    </td>
                    <td>{item.reason}</td>
                    <td>{item.requester_name}</td>
                    <td>{new Date(item.created_at).toLocaleDateString()}</td>
                    <td>
                      {canApprove ? (
                        <>
                          <button onClick={() => handleApprove(item.id)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', marginRight: '8px' }}>Approve</button>
                          <button onClick={() => handleReject(item.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Reject</button>
                        </>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Awaiting Manager</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {purchaseItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setPurchaseItem(null)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 420, width: '90%' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px' }}>Create Purchase Request</h3>
            <form onSubmit={createPurchaseRequest}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13, color: '#374151' }}>Product</label>
                <input type="text" value={purchaseItem.name} disabled style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, background: '#f9fafb', color: '#6b7280' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13, color: '#374151' }}>Current Stock</label>
                <input type="text" value={`${formatNumber(purchaseItem.current_stock)} ${purchaseItem.unit || ''}`} disabled style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, background: '#f9fafb', color: '#6b7280' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13, color: '#374151' }}>Quantity Requested *</label>
                <input type="number" min="1" value={purchaseForm.quantity_requested} onChange={e => setPurchaseForm({ ...purchaseForm, quantity_requested: parseInt(e.target.value) || 1 })} required style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13, color: '#374151' }}>Reason *</label>
                <textarea value={purchaseForm.reason} onChange={e => setPurchaseForm({ ...purchaseForm, reason: e.target.value })} rows={3} required style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setPurchaseItem(null)} style={{ background: '#6b7280', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                <button type="submit" disabled={purchaseLoading} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 6, cursor: 'pointer', fontSize: 14, opacity: purchaseLoading ? 0.6 : 1 }}>
                  {purchaseLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default StoreHome;
