import React, { useState, useEffect } from 'react';
import ceoService from '../../services/ceoService';
import purchaseService from '../../services/purchaseService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './PurchaseApprovals.module.css';

const STATUS_MAP = {
  pending: { label: 'Pending', color: '#f59e0b' },
  approved: { label: 'Approved', color: '#10b981' },
  rejected: { label: 'Rejected', color: '#ef4444' }
};

const PurchaseApprovals = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await ceoService.getPendingPOApprovals();
      setOrders(res.data?.data?.orders || []);
    } catch (err) {
      console.error('Failed to load pending approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openDetail = async (order) => {
    setSelectedOrder(order);
    setOrderDetail(null);
    setRejectReason('');
    try {
      const res = await purchaseService.getPOById(order.id);
      setOrderDetail(res.data?.data?.purchaseOrder || null);
    } catch (err) {
      console.error('Failed to load order detail:', err);
    }
  };

  const closeDetail = () => {
    setSelectedOrder(null);
    setOrderDetail(null);
    setRejectReason('');
  };

  const handleApprove = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      await ceoService.approvePO(selectedOrder.id);
      closeDetail();
      fetchOrders();
    } catch (err) {
      console.error('Failed to approve:', err);
      alert('Failed to approve purchase order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedOrder || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await ceoService.rejectPO(selectedOrder.id, rejectReason.trim());
      closeDetail();
      fetchOrders();
    } catch (err) {
      console.error('Failed to reject:', err);
      alert('Failed to reject purchase order');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading pending approvals...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Purchase Order Approvals</h1>
          <p className={styles.pageSubtitle}>{orders.length} order{orders.length !== 1 ? 's' : ''} pending your review</p>
        </div>
        <button className={styles.refreshBtn} onClick={fetchOrders}>Refresh</button>
      </div>

      {orders.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>✓</div>
          <p>All purchase orders have been reviewed.</p>
          <p className={styles.emptySub}>No pending approvals at this time.</p>
        </div>
      ) : (
        <div className={styles.ordersList}>
          <div className={styles.tableHeader}>
            <span className={styles.colPo}>PO Number</span>
            <span className={styles.colSupplier}>Supplier</span>
            <span className={styles.colSector}>Sector</span>
            <span className={styles.colAmount}>Amount</span>
            <span className={styles.colRequested}>Requested By</span>
            <span className={styles.colDate}>Date</span>
            <span className={styles.colAction}>Action</span>
          </div>
          {orders.map(order => (
            <div key={order.id} className={styles.tableRow}>
              <span className={styles.colPo}>{order.po_number}</span>
              <span className={styles.colSupplier}>{order.supplier_name}</span>
              <span className={styles.colSector}>{order.sector_name || '-'}</span>
              <span className={styles.colAmount}>{formatCurrency(order.total_amount)}</span>
              <span className={styles.colRequested}>{order.created_by_name}</span>
              <span className={styles.colDate}>{formatDate(order.created_at)}</span>
              <span className={styles.colAction}>
                <button className={styles.reviewBtn} onClick={() => openDetail(order)}>
                  Review
                </button>
              </span>
            </div>
          ))}
        </div>
      )}

      {selectedOrder && (
        <div className={styles.modalOverlay} onClick={closeDetail}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                Purchase Order {selectedOrder.po_number}
              </h2>
              <button className={styles.closeBtn} onClick={closeDetail}>×</button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Supplier</span>
                  <span className={styles.detailValue}>{orderDetail?.supplier_name || selectedOrder.supplier_name}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Sector</span>
                  <span className={styles.detailValue}>{orderDetail?.sector_name || selectedOrder.sector_name || '-'}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Total Amount</span>
                  <span className={styles.detailValue}>{formatCurrency(orderDetail?.total_amount || selectedOrder.total_amount)}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Requested By</span>
                  <span className={styles.detailValue}>{orderDetail?.created_by_name || selectedOrder.created_by_name}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Status</span>
                  <span className={styles.detailValue}>
                    <span style={{ color: STATUS_MAP.pending.color, fontWeight: 600 }}>Pending</span>
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Created</span>
                  <span className={styles.detailValue}>{formatDate(orderDetail?.created_at || selectedOrder.created_at)}</span>
                </div>
              </div>

              {orderDetail?.items && orderDetail.items.length > 0 && (
                <div className={styles.itemsSection}>
                  <h3 className={styles.sectionTitle}>Order Items</h3>
                  <div className={styles.itemsTable}>
                    <div className={styles.itemHeader}>
                      <span>Product</span>
                      <span>Qty</span>
                      <span>Unit Price</span>
                      <span>Total</span>
                    </div>
                    {orderDetail.items.map((item, idx) => (
                      <div key={idx} className={styles.itemRow}>
                        <span>{item.product_name || 'Unknown'}</span>
                        <span>{item.quantity}</span>
                        <span>{formatCurrency(item.unit_price)}</span>
                        <span>{formatCurrency(item.total_price || item.quantity * item.unit_price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {orderDetail?.supplier_phone && (
                <div className={styles.supplierInfo}>
                  <h3 className={styles.sectionTitle}>Supplier Contact</h3>
                  <p>{orderDetail.supplier_phone}</p>
                  {orderDetail.supplier_email && <p>{orderDetail.supplier_email}</p>}
                </div>
              )}

              {orderDetail?.notes && (
                <div className={styles.notesSection}>
                  <h3 className={styles.sectionTitle}>Notes</h3>
                  <p>{orderDetail.notes}</p>
                </div>
              )}

              <div className={styles.rejectSection}>
                <h3 className={styles.sectionTitle}>Rejection Reason</h3>
                <textarea
                  className={styles.rejectInput}
                  placeholder="Enter reason if rejecting..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.rejectBtn}
                onClick={handleReject}
                disabled={actionLoading || !rejectReason.trim()}
              >
                {actionLoading ? 'Processing...' : 'Reject'}
              </button>
              <button
                className={styles.approveBtn}
                onClick={handleApprove}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseApprovals;
