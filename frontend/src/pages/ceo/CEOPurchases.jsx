import React, { useState, useEffect, useRef } from 'react';
import purchaseService from '../../services/purchaseService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './CEOPurchases.module.css';

const CEOPurchases = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // States for handling stats
  const [purchaseStats, setPurchaseStats] = useState(null);

  // States for approval action
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // States for viewing PO details
  const [selectedPODetails, setSelectedPODetails] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // States for stat drill-downs
  const [showStatModal, setShowStatModal] = useState(false);
  const [statModalType, setStatModalType] = useState(null); // 'monthly', 'spend', 'suppliers'
  
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

      setOrders(ordersRes.data?.data?.orders || ordersRes.data?.orders || []);
      setPurchaseStats(statsRes.data?.data || statsRes.data || null);
    } catch (err) {
      console.error('Error fetching purchase data:', err);
      setError('Failed to load purchase data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this purchase order?')) return;
    
    try {
      setActionLoading(true);
      await purchaseService.approvePO(id, { approved: true });
      fetchData(); // refresh list
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
      await purchaseService.approvePO(selectedOrder.id, { 
        approved: false, 
        rejectionReason 
      });
      setShowRejectModal(false);
      fetchData(); // refresh list
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
      alert('Failed to load purchase order details.');
      setShowDetailsModal(false);
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

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner}></div>
        <p>Loading purchase records...</p>
      </div>
    );
  }

  return (
    <div className={styles.purchasesContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Purchase Approvals</h1>
        <p className={styles.subtitle}>Review pending purchase orders and monitor procurement activity.</p>
      </div>

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

      {/* Pending Orders Table */}
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td><strong>{order.po_number || order.poNumber}</strong></td>
                    <td>{order.supplier_name || order.supplierName || 'Unknown Supplier'}</td>
                    <td>{formatDate(order.created_at || order.createdAt)}</td>
                    <td>{order.sector_name || order.sectorName || '-'}</td>
                    <td className={styles.amount}>{formatCurrency(order.total_amount || order.totalPrice)}</td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button 
                          className={styles.viewBtn}
                          onClick={() => openDetailsModal(order.id)}
                          disabled={actionLoading}
                        >
                          View Details
                        </button>
                        <button 
                          className={styles.approveBtn}
                          onClick={() => handleApprove(order.id)}
                          disabled={actionLoading}
                        >
                          Approve
                        </button>
                        <button 
                          className={styles.rejectBtn}
                          onClick={() => openRejectModal(order)}
                          disabled={actionLoading}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {}
      {showRejectModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Reject Purchase Order</h3>
            <p className={styles.modalSubtitle}>PO Number: {selectedOrder?.po_number || selectedOrder?.poNumber}</p>
            
            {actionError && <div className={styles.modalError}>{actionError}</div>}
            
            <form onSubmit={handleReject}>
              <div className={styles.formGroup}>
                <label>Reason for Rejection *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejecting this PO..."
                  required
                  rows="4"
                  minLength="10"
                ></textarea>
                <small>Minimum 10 characters.</small>
              </div>
              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  className={styles.cancelBtn}
                  onClick={() => setShowRejectModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles.confirmRejectBtn}
                  disabled={actionLoading || !rejectionReason.trim()}
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} ${styles.largeModal}`} style={{ maxWidth: '800px' }}>
            <h3 className={styles.modalTitle}>Purchase Order Details</h3>
            <div className={styles.modalContent}>
              {detailsLoading || !selectedPODetails ? (
                <div className={styles.loadingState}>
                  <div className={styles.spinner}></div>
                  <p>Loading details...</p>
                </div>
              ) : (
                <>
                  <p className={styles.modalSubtitle}>PO Number: {selectedPODetails.poNumber || selectedPODetails.po_number}</p>
                  
                  <div className={styles.detailsGrid}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Requested By</span>
                      <span className={styles.detailValue}>{selectedPODetails.createdByName || selectedPODetails.created_by_name || 'System User'}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Date Requested</span>
                      <span className={styles.detailValue}>{formatDate(selectedPODetails.createdAt || selectedPODetails.created_at)}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Supplier</span>
                      <span className={styles.detailValue}>{selectedPODetails.supplierName || selectedPODetails.supplier_name}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Expected Delivery</span>
                      <span className={styles.detailValue}>{formatDate(selectedPODetails.expectedDeliveryDate || selectedPODetails.expected_delivery_date)}</span>
                    </div>
                    {selectedPODetails.notes && (
                      <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}>
                        <span className={styles.detailLabel}>Notes</span>
                        <span className={styles.detailValue}>{selectedPODetails.notes}</span>
                      </div>
                    )}
                  </div>

                  <h4 className={styles.sectionTitle} style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Line Items</h4>
                  <div className={styles.itemsTableContainer}>
                    <table className={styles.itemsTable}>
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Qty</th>
                          <th>Unit Price</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedPODetails.items || []).map((item, index) => (
                          <tr key={item.id || index}>
                            <td>{item.productName || item.product_name}</td>
                            <td>{item.quantityOrdered || item.quantity_ordered}</td>
                            <td>{formatCurrency(item.unitPrice || item.unit_price)}</td>
                            <td>{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                        <tr className={styles.totalRow}>
                          <td colSpan="3" style={{ textAlign: 'right' }}>Subtotal:</td>
                          <td>{formatCurrency(selectedPODetails.subtotal)}</td>
                        </tr>
                        <tr className={styles.totalRow}>
                          <td colSpan="3" style={{ textAlign: 'right' }}>Tax (15%):</td>
                          <td>{formatCurrency(selectedPODetails.taxAmount || selectedPODetails.tax_amount)}</td>
                        </tr>
                        <tr className={styles.totalRow} style={{ fontSize: '1.125rem' }}>
                          <td colSpan="3" style={{ textAlign: 'right' }}>Grand Total:</td>
                          <td>{formatCurrency(selectedPODetails.totalAmount || selectedPODetails.total_amount)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
            <div className={styles.modalActions}>
              <button 
                type="button" 
                className={styles.cancelBtn}
                onClick={() => setShowDetailsModal(false)}
                disabled={actionLoading}
              >
                Close
              </button>
              {!detailsLoading && selectedPODetails && (
                <>
                  <button 
                    className={styles.rejectBtn}
                    onClick={() => {
                      setShowDetailsModal(false);
                      openRejectModal({
                        id: selectedPODetails.id,
                        poNumber: selectedPODetails.poNumber || selectedPODetails.po_number
                      });
                    }}
                    disabled={actionLoading}
                  >
                    Reject PO
                  </button>
                  <button 
                    className={styles.approveBtn}
                    onClick={async () => {
                      await handleApprove(selectedPODetails.id);
                      setShowDetailsModal(false);
                    }}
                    disabled={actionLoading}
                  >
                    Approve PO
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Drill-down Stat Modal */}
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
                          <div className={styles.statListLeft}>
                            <span className={styles.statListName}>{po.po_number || po.poNumber}</span>
                            <span className={styles.statListMeta}>{po.supplier} • {formatDate(po.created_at)}</span>
                          </div>
                          <div className={styles.statListRight}>
                            {formatCurrency(po.total_amount)}
                            <div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#64748b', textAlign: 'right', marginTop: '0.25rem' }}>
                              {po.status}
                            </div>
                          </div>
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
                          <div className={styles.statListLeft}>
                            <span className={styles.statListName}>{sup.name}</span>
                            <span className={styles.statListMeta}>Supplier ID: {sup.id}</span>
                          </div>
                          <div className={styles.statListRight}>
                            {formatCurrency(sup.total_spent)}
                          </div>
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
                      <span className={styles.detailValue} style={{ fontSize: '1.5rem', color: '#0f172a' }}>
                        {formatCurrency(purchaseStats?.totalSpendThisYear || 0)}
                      </span>
                    </div>
                    <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: '1.5', margin: 0 }}>
                      This figure represents the sum of all Purchase Orders that have been approved since January 1st of the current year. It includes all taxes and fees but does not include draft or rejected orders.
                    </p>
                  </div>
                </div>
              </>
            )}

            <div className={styles.modalActions}>
              <button 
                type="button" 
                className={styles.cancelBtn}
                onClick={() => setShowStatModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CEOPurchases;
