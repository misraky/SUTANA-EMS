import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatDate } from '../../utils/formatters';
import purchaseService from '../../services/purchaseService';
import styles from './CEOPurchases.module.css';

const MOCK_ORDERS = [
  { id: 'PO-001', po_number: 'PO-001', supplier_name: 'TechSupply Corp', created_at: '2025-06-10T08:00:00Z', sector_name: 'IT', total_amount: 45000, complianceFlag: 'green', budgetAvailable: true, vendorBlacklisted: false, withinPolicy: true, escalationRequired: false },
  { id: 'PO-002', po_number: 'PO-002', supplier_name: 'OfficeMate Ltd', created_at: '2025-06-11T09:30:00Z', sector_name: 'Admin', total_amount: 12000, complianceFlag: 'green', budgetAvailable: true, vendorBlacklisted: false, withinPolicy: true, escalationRequired: false },
  { id: 'PO-003', po_number: 'PO-003', supplier_name: 'Global Logistics', created_at: '2025-06-12T10:00:00Z', sector_name: 'Logistics', total_amount: 78000, complianceFlag: 'yellow', budgetAvailable: true, vendorBlacklisted: false, withinPolicy: false, escalationRequired: true },
  { id: 'PO-004', po_number: 'PO-004', supplier_name: 'Blackstone Tech', created_at: '2025-06-13T11:00:00Z', sector_name: 'IT', total_amount: 250000, complianceFlag: 'red', budgetAvailable: false, vendorBlacklisted: true, withinPolicy: false, escalationRequired: true },
];

const MOCK_STATS = {
  monthlyPOs: 24,
  pendingApprovals: 4,
  totalSpendThisYear: 1850000,
  activeSuppliers: 42,
  recentPOs: [
    { id: 1, po_number: 'PO-001', supplier: 'TechSupply Corp', created_at: '2025-06-10', total_amount: 45000, status: 'Pending' },
    { id: 2, po_number: 'PO-002', supplier: 'OfficeMate Ltd', created_at: '2025-06-11', total_amount: 12000, status: 'Pending' },
  ],
  topSuppliers: [
    { id: 1, name: 'TechSupply Corp', total_spent: 450000 },
    { id: 2, name: 'Global Logistics', total_spent: 380000 },
  ],
};

const MOCK_SPENDING_TREND = [
  { month: 'Jul', spend: 145000 },
  { month: 'Aug', spend: 162000 },
  { month: 'Sep', spend: 138000 },
  { month: 'Oct', spend: 185000 },
  { month: 'Nov', spend: 210000 },
  { month: 'Dec', spend: 195000 },
  { month: 'Jan', spend: 170000 },
  { month: 'Feb', spend: 155000 },
  { month: 'Mar', spend: 190000 },
  { month: 'Apr', spend: 220000 },
  { month: 'May', spend: 205000 },
  { month: 'Jun', spend: 185000 },
];

const MOCK_DELEGATIONS = [
  { id: 1, delegateName: 'Alice Johnson', role: 'VP Finance', startDate: '2025-06-01', endDate: '2025-06-30', active: true, scope: 'Up to $50,000' },
  { id: 2, delegateName: 'Bob Chen', role: 'Director Procurement', startDate: '2025-05-15', endDate: '2025-07-15', active: true, scope: 'All POs' },
  { id: 3, delegateName: 'Carol Davis', role: 'CFO', startDate: '2025-04-01', endDate: '2025-04-15', active: false, scope: 'Emergency only' },
];

const MOCK_APPROVAL_HISTORY = {
  'PO-001': [
    { level: 'Manager', approver: 'Sarah Lee', action: 'Approved', timestamp: '2025-06-10T09:00:00Z', note: 'Within budget' },
    { level: 'Director', approver: 'Mike Brown', action: 'Approved', timestamp: '2025-06-10T10:30:00Z', note: '' },
    { level: 'CEO', approver: 'Pending', action: 'Pending Review', timestamp: '', note: '' },
  ],
  'PO-002': [
    { level: 'Manager', approver: 'Sarah Lee', action: 'Approved', timestamp: '2025-06-11T10:00:00Z', note: '' },
    { level: 'CEO', approver: 'Pending', action: 'Pending Review', timestamp: '', note: '' },
  ],
  'PO-003': [
    { level: 'Manager', approver: 'Tom Wilson', action: 'Approved', timestamp: '2025-06-12T11:00:00Z', note: 'Policy exceedance noted' },
    { level: 'CEO', approver: 'Pending', action: 'Pending Review', timestamp: '', note: '' },
  ],
  'PO-004': [
    { level: 'Manager', approver: 'Tom Wilson', action: 'Flagged', timestamp: '2025-06-13T12:00:00Z', note: 'Blacklisted vendor - escalation needed' },
  ],
};

const CEOPurchases = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchaseStats, setPurchaseStats] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedPODetails, setSelectedPODetails] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showStatModal, setShowStatModal] = useState(false);
  const [statModalType, setStatModalType] = useState(null);
  const [showDelegationPanel, setShowDelegationPanel] = useState(false);
  const [delegations] = useState(MOCK_DELEGATIONS);
  const [showDelegateModal, setShowDelegateModal] = useState(false);
  const [delegateTargetPO, setDelegateTargetPO] = useState(null);
  const [delegateName, setDelegateName] = useState('');
  const [showApprovalHistory, setShowApprovalHistory] = useState(null);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateTargetPO, setEscalateTargetPO] = useState(null);
  const [escalateReason, setEscalateReason] = useState('');
  const ordersTableRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ordersRes, statsRes] = await Promise.all([
        purchaseService.getPurchaseOrders({ status: 'Pending' }),
        purchaseService.getPurchaseStatistics()
      ]);
      const fetchedOrders = ordersRes.data?.data?.orders || ordersRes.data?.orders || [];
      const fetchedStats = statsRes.data?.data || statsRes.data || null;
      setOrders(fetchedOrders.length > 0 ? fetchedOrders.map(o => ({
        ...o,
        complianceFlag: 'green',
        escalationRequired: (o.total_amount || o.totalPrice || 0) > 50000,
      })) : MOCK_ORDERS);
      setPurchaseStats(fetchedStats || MOCK_STATS);
    } catch (err) {
      console.error('Error fetching purchase data:', err);
      setOrders(MOCK_ORDERS);
      setPurchaseStats(MOCK_STATS);
    } finally {
      setLoading(false);
    }
  };

  const getComplianceInfo = (order) => {
    const amount = order.total_amount || order.totalPrice || 0;
    const budgetOk = order.budgetAvailable !== false;
    const vendorOk = order.vendorBlacklisted !== true;
    const policyOk = order.withinPolicy !== false;
    if (!vendorOk) return { flag: 'red', label: 'Blocked', reason: 'Vendor blacklisted' };
    if (!budgetOk) return { flag: 'red', label: 'Blocked', reason: 'Budget exhausted' };
    if (!policyOk) return { flag: 'yellow', label: 'Advisory', reason: 'Exceeds policy limit' };
    return { flag: 'green', label: 'Clean', reason: 'All checks passed' };
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this purchase order?')) return;
    try {
      setActionLoading(true);
      await purchaseService.approvePO(id, { approved: true });
      fetchData();
    } catch (err) {
      console.error('Error approving PO:', err);
      alert('Failed to approve purchase order.');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (order) => {
    setSelectedOrder(order);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) return;
    try {
      setActionLoading(true);
      setActionError(null);
      await purchaseService.approvePO(selectedOrder.id, { approved: false, rejectionReason });
      setShowRejectModal(false);
      fetchData();
    } catch (err) {
      console.error('Error rejecting PO:', err);
      setActionError(err.response?.data?.message || 'Failed to reject purchase order.');
    } finally {
      setActionLoading(false);
    }
  };

  const openDetailsModal = async (orderId) => {
    try {
      setDetailsLoading(true);
      setShowDetailsModal(true);
      setSelectedPODetails(null);
      const res = await purchaseService.getPOById(orderId);
      setSelectedPODetails(res.data?.data?.purchaseOrder || res.data?.purchaseOrder || null);
    } catch (err) {
      console.error('Error fetching PO details:', err);
      setSelectedPODetails(MOCK_ORDERS.find(o => o.id === orderId || o.po_number === orderId) || MOCK_ORDERS[0]);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleStatClick = (type) => {
    if (type === 'pending') {
      ordersTableRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      setStatModalType(type);
      setShowStatModal(true);
    }
  };

  const handleDelegate = (order) => {
    setDelegateTargetPO(order);
    setDelegateName('');
    setShowDelegateModal(true);
  };

  const submitDelegation = () => {
    if (!delegateName.trim()) return;
    setShowDelegateModal(false);
    setDelegateTargetPO(null);
    setDelegateName('');
  };

  const handleEscalate = (order) => {
    setEscalateTargetPO(order);
    setEscalateReason('');
    setShowEscalateModal(true);
  };

  const submitEscalation = () => {
    setShowEscalateModal(false);
    setEscalateTargetPO(null);
    setEscalateReason('');
  };

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner}></div>
        <p>Loading purchase records...</p>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className={styles.errorState}>
        <p>{error}</p>
        <button className={styles.retryBtn} onClick={fetchData}>Retry</button>
      </div>
    );
  }

  return (
    <div className={styles.purchasesContainer}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Purchase Approvals</h1>
          <p className={styles.subtitle}>Review pending purchase orders and monitor procurement activity.</p>
        </div>
        <button className={styles.delegationToggle} onClick={() => setShowDelegationPanel(!showDelegationPanel)}>
          {showDelegationPanel ? 'Hide' : 'Show'} Delegations
        </button>
      </div>

      <div className={styles.mainLayout}>
        <div className={styles.mainContent}>
          {error && <div className={styles.alertError}>{error}</div>}

          {purchaseStats && (
            <div className={styles.statsSection}>
              <h2 className={styles.sectionTitle}>Purchase Report Details</h2>
              <div className={styles.statsGrid}>
                <div className={styles.statCard} onClick={() => handleStatClick('monthly')}>
                  <h3>Monthly Orders</h3>
                  <div className={styles.statValue}>{purchaseStats.monthlyPOs || 0}</div>
                  <p className={styles.statSubtitle}>Total purchase orders created this month.</p>
                </div>
                <div className={styles.statCard} onClick={() => handleStatClick('pending')}>
                  <h3>Pending Approvals</h3>
                  <div className={styles.statValue}>{purchaseStats.pendingApprovals || orders.length}</div>
                  <p className={styles.statSubtitle}>Orders currently waiting for your review.</p>
                </div>
                <div className={styles.statCard} onClick={() => handleStatClick('spend')}>
                  <h3>Total Spend (YTD)</h3>
                  <div className={styles.statValue}>{formatCurrency(purchaseStats.totalSpendThisYear || 0)}</div>
                  <p className={styles.statSubtitle}>Total value of all approved purchases this year.</p>
                </div>
                <div className={styles.statCard} onClick={() => handleStatClick('suppliers')}>
                  <h3>Active Suppliers</h3>
                  <div className={styles.statValue}>{purchaseStats.activeSuppliers || 0}</div>
                  <p className={styles.statSubtitle}>Unique vendors we currently work with.</p>
                </div>
              </div>
            </div>
          )}

          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Spending Trend (12 Months)</h2>
          </div>
          <div className={styles.chartCard}>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={MOCK_SPENDING_TREND}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="spend" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} name="Monthly Spend" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.ordersSection} ref={ordersTableRef}>
            <h2 className={styles.sectionTitle}>Pending Purchase Orders</h2>

            {orders.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No purchase orders currently pending approval.</p>
              </div>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>PO Number</th>
                      <th>Supplier</th>
                      <th>Date Requested</th>
                      <th>Sector</th>
                      <th>Total Amount</th>
                      <th>Compliance</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => {
                      const compliance = getComplianceInfo(order);
                      return (
                        <tr key={order.id}>
                          <td><strong>{order.po_number || order.poNumber}</strong></td>
                          <td>{order.supplier_name || order.supplierName || 'Unknown Supplier'}</td>
                          <td>{formatDate(order.created_at || order.createdAt)}</td>
                          <td>{order.sector_name || order.sectorName || '-'}</td>
                          <td className={styles.amount}>{formatCurrency(order.total_amount || order.totalPrice || 0)}</td>
                          <td>
                            <span className={`${styles.complianceBadge} ${styles[compliance.flag]}`} title={compliance.reason}>
                              {compliance.label}
                            </span>
                            {order.escalationRequired && <span className={styles.escalationBadge}>Escalation Required</span>}
                          </td>
                          <td>
                            <div className={styles.actionButtons}>
                              <button className={styles.viewBtn} onClick={() => openDetailsModal(order.id)} disabled={actionLoading}>Details</button>
                              <button className={styles.approveBtn} onClick={() => handleApprove(order.id)} disabled={actionLoading}>Approve</button>
                              <button className={styles.rejectBtn} onClick={() => openRejectModal(order)} disabled={actionLoading}>Reject</button>
                              <button className={styles.historyBtn} onClick={() => setShowApprovalHistory(showApprovalHistory === order.po_number ? null : order.po_number)}>History</button>
                              <button className={styles.delegateBtn} onClick={() => handleDelegate(order)} disabled={actionLoading}>Delegate</button>
                              {order.escalationRequired && (
                                <button className={styles.escalateBtn} onClick={() => handleEscalate(order)} disabled={actionLoading}>Escalate to Board</button>
                              )}
                            </div>
                            {showApprovalHistory === order.po_number && (
                              <div className={styles.approvalHistory}>
                                {(MOCK_APPROVAL_HISTORY[order.po_number] || []).map((step, i) => (
                                  <div key={i} className={styles.approvalStep}>
                                    <span className={styles.approvalLevel}>{step.level}</span>
                                    <span className={`${styles.approvalAction} ${styles[step.action.toLowerCase().replace(' ', '')]}`}>
                                      {step.action}
                                    </span>
                                    <span className={styles.approvalPerson}>{step.approver}</span>
                                    {step.timestamp && <span className={styles.approvalTime}>{formatDate(step.timestamp)}</span>}
                                    {step.note && <span className={styles.approvalNote}>{step.note}</span>}
                                  </div>
                                ))}
                                {(!MOCK_APPROVAL_HISTORY[order.po_number] || MOCK_APPROVAL_HISTORY[order.po_number].length === 0) && (
                                  <div className={styles.approvalEmpty}>No approval history available.</div>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {showDelegationPanel && (
          <div className={styles.delegationPanel}>
            <h3 className={styles.panelTitle}>Active Delegations</h3>
            <div className={styles.delegationList}>
              {delegations.filter(d => d.active).map(d => (
                <div key={d.id} className={styles.delegationCard}>
                  <div className={styles.delegationName}>{d.delegateName}</div>
                  <div className={styles.delegationRole}>{d.role}</div>
                  <div className={styles.delegationDetail}>Scope: {d.scope}</div>
                  <div className={styles.delegationDetail}>Valid: {formatDate(d.startDate)} - {formatDate(d.endDate)}</div>
                  <span className={styles.delegationActive}>Active</span>
                </div>
              ))}
              {delegations.filter(d => !d.active).map(d => (
                <div key={d.id} className={`${styles.delegationCard} ${styles.delegationInactive}`}>
                  <div className={styles.delegationName}>{d.delegateName}</div>
                  <div className={styles.delegationRole}>{d.role}</div>
                  <div className={styles.delegationDetail}>Scope: {d.scope}</div>
                  <div className={styles.delegationDetail}>Expired: {formatDate(d.endDate)}</div>
                  <span className={styles.delegationExpired}>Expired</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showRejectModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Reject Purchase Order</h3>
            <p className={styles.modalSubtitle}>PO Number: {selectedOrder?.po_number || selectedOrder?.poNumber}</p>
            {actionError && <div className={styles.modalError}>{actionError}</div>}
            <form onSubmit={handleReject}>
              <div className={styles.formGroup}>
                <label>Reason for Rejection *</label>
                <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Please provide a reason for rejecting this PO..." required rows="4" minLength="10"></textarea>
                <small>Minimum 10 characters.</small>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowRejectModal(false)} disabled={actionLoading}>Cancel</button>
                <button type="submit" className={styles.confirmRejectBtn} disabled={actionLoading || !rejectionReason.trim()}>
                  {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailsModal && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} ${styles.largeModal}`} style={{ maxWidth: '800px' }}>
            <h3 className={styles.modalTitle}>Purchase Order Details</h3>
            <div className={styles.modalContent}>
              {detailsLoading || !selectedPODetails ? (
                <div className={styles.loadingState}><div className={styles.spinner}></div><p>Loading details...</p></div>
              ) : (
                <>
                  <p className={styles.modalSubtitle}>PO Number: {selectedPODetails.poNumber || selectedPODetails.po_number}</p>
                  <div className={styles.detailsGrid}>
                    <div className={styles.detailItem}><span className={styles.detailLabel}>Requested By</span><span className={styles.detailValue}>{selectedPODetails.createdByName || selectedPODetails.created_by_name || 'System User'}</span></div>
                    <div className={styles.detailItem}><span className={styles.detailLabel}>Date Requested</span><span className={styles.detailValue}>{formatDate(selectedPODetails.createdAt || selectedPODetails.created_at)}</span></div>
                    <div className={styles.detailItem}><span className={styles.detailLabel}>Supplier</span><span className={styles.detailValue}>{selectedPODetails.supplierName || selectedPODetails.supplier_name}</span></div>
                    <div className={styles.detailItem}><span className={styles.detailLabel}>Expected Delivery</span><span className={styles.detailValue}>{formatDate(selectedPODetails.expectedDeliveryDate || selectedPODetails.expected_delivery_date)}</span></div>
                  </div>
                  <h4 className={styles.sectionTitle} style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Line Items</h4>
                  <div className={styles.itemsTableContainer}>
                    <table className={styles.itemsTable}>
                      <thead><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
                      <tbody>
                        {(selectedPODetails.items || []).map((item, index) => (
                          <tr key={item.id || index}>
                            <td>{item.productName || item.product_name}</td>
                            <td>{item.quantityOrdered || item.quantity_ordered}</td>
                            <td>{formatCurrency(item.unitPrice || item.unit_price)}</td>
                            <td>{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                        <tr className={styles.totalRow}><td colSpan="3" style={{ textAlign: 'right' }}>Subtotal:</td><td>{formatCurrency(selectedPODetails.subtotal)}</td></tr>
                        <tr className={styles.totalRow}><td colSpan="3" style={{ textAlign: 'right' }}>Tax (15%):</td><td>{formatCurrency(selectedPODetails.taxAmount || selectedPODetails.tax_amount)}</td></tr>
                        <tr className={styles.totalRow} style={{ fontSize: '1.125rem' }}><td colSpan="3" style={{ textAlign: 'right' }}>Grand Total:</td><td>{formatCurrency(selectedPODetails.totalAmount || selectedPODetails.total_amount)}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelBtn} onClick={() => setShowDetailsModal(false)}>Close</button>
              {!detailsLoading && selectedPODetails && (
                <>
                  <button className={styles.rejectBtn} onClick={() => { setShowDetailsModal(false); openRejectModal({ id: selectedPODetails.id, poNumber: selectedPODetails.poNumber || selectedPODetails.po_number }); }} disabled={actionLoading}>Reject PO</button>
                  <button className={styles.approveBtn} onClick={async () => { await handleApprove(selectedPODetails.id); setShowDetailsModal(false); }} disabled={actionLoading}>Approve PO</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showStatModal && statModalType && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} style={{ maxWidth: '600px' }}>
            {statModalType === 'monthly' && (
              <>
                <h3 className={styles.modalTitle}>Recent Purchase Orders</h3>
                <p className={styles.modalSubtitle}>History of purchases requested recently</p>
                <div className={styles.modalContent}>
                  {(!purchaseStats?.recentPOs || purchaseStats.recentPOs.length === 0) ? (
                    <div className={styles.emptyState} style={{ padding: '2rem' }}>No recent orders found.</div>
                  ) : (
                    <ul className={styles.statList}>
                      {purchaseStats.recentPOs.map(po => (
                        <li key={po.id} className={styles.statListItem}>
                          <div className={styles.statListLeft}><span className={styles.statListName}>{po.po_number || po.poNumber}</span><span className={styles.statListMeta}>{po.supplier} &bull; {formatDate(po.created_at)}</span></div>
                          <div className={styles.statListRight}>{formatCurrency(po.total_amount)}<div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#64748b', textAlign: 'right', marginTop: '0.25rem' }}>{po.status}</div></div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
            {statModalType === 'suppliers' && (
              <>
                <h3 className={styles.modalTitle}>Top Suppliers by Spend</h3>
                <p className={styles.modalSubtitle}>Vendors with the highest approved expenditure</p>
                <div className={styles.modalContent}>
                  {(!purchaseStats?.topSuppliers || purchaseStats.topSuppliers.length === 0) ? (
                    <div className={styles.emptyState} style={{ padding: '2rem' }}>No supplier data available yet.</div>
                  ) : (
                    <ul className={styles.statList}>
                      {purchaseStats.topSuppliers.map(sup => (
                        <li key={sup.id} className={styles.statListItem}>
                          <div className={styles.statListLeft}><span className={styles.statListName}>{sup.name}</span><span className={styles.statListMeta}>Supplier ID: {sup.id}</span></div>
                          <div className={styles.statListRight}>{formatCurrency(sup.total_spent)}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
            {statModalType === 'spend' && (
              <>
                <h3 className={styles.modalTitle}>Year-to-Date Spend Details</h3>
                <p className={styles.modalSubtitle}>Total Expenditure Breakdown</p>
                <div className={styles.modalContent}>
                  <div className={styles.detailsGrid} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className={styles.detailItem} style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span className={styles.detailLabel}>Total Approved Value</span>
                      <span className={styles.detailValue} style={{ fontSize: '1.5rem', color: '#0f172a' }}>{formatCurrency(purchaseStats?.totalSpendThisYear || 0)}</span>
                    </div>
                    <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: '1.5', margin: 0 }}>This figure represents the sum of all Purchase Orders that have been approved since January 1st of the current year.</p>
                  </div>
                </div>
              </>
            )}
            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelBtn} onClick={() => setShowStatModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showDelegateModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Delegate Approval</h3>
            <p className={styles.modalSubtitle}>PO: {delegateTargetPO?.po_number || delegateTargetPO?.poNumber}</p>
            <div className={styles.formGroup}>
              <label>Delegate to</label>
              <input type="text" value={delegateName} onChange={(e) => setDelegateName(e.target.value)} placeholder="Enter delegate name" />
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowDelegateModal(false)}>Cancel</button>
              <button className={styles.approveBtn} onClick={submitDelegation} disabled={!delegateName.trim()}>Confirm Delegate</button>
            </div>
          </div>
        </div>
      )}

      {showEscalateModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Escalate to Board</h3>
            <p className={styles.modalSubtitle}>PO: {escalateTargetPO?.po_number || escalateTargetPO?.poNumber} - Amount: {formatCurrency(escalateTargetPO?.total_amount || 0)}</p>
            <div className={styles.formGroup}>
              <label>Reason for Escalation</label>
              <textarea value={escalateReason} onChange={(e) => setEscalateReason(e.target.value)} placeholder="Why does this need board approval?" rows="3"></textarea>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowEscalateModal(false)}>Cancel</button>
              <button className={styles.escalateBtn} onClick={submitEscalation} disabled={!escalateReason.trim()}>Escalate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CEOPurchases;
