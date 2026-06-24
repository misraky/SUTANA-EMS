import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import purchaseService from '../../services/purchaseService';
import authService from '../../services/authService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './PurchaseOrderDetail.module.css';

const PurchaseOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const currentUser = authService.getCurrentUser();
  const isCeo = currentUser?.roles?.some(r => r === 'CEO');

  useEffect(() => {
    const fetchPO = async () => {
      try {
        const response = await purchaseService.getPOById(id);
        setPo(response.data?.purchaseOrder || response.data?.order || null);
      } catch (error) {
        console.error('Failed to fetch PO details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPO();
  }, [id]);

  const refreshPO = async () => {
    const response = await purchaseService.getPOById(id);
    setPo(response.data?.purchaseOrder || response.data?.order || null);
  };

  const handleSubmit = async () => {
    setActionLoading(true);
    try {
      await purchaseService.submitPOForApproval(id);
      await refreshPO();
    } catch (error) {
      alert('Failed to submit PO: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await purchaseService.approvePO(id, { approved: true });
      await refreshPO();
    } catch (error) {
      alert('Failed to approve PO: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await purchaseService.approvePO(id, { approved: false, rejectionReason: rejectReason });
      setRejectModal(false);
      setRejectReason('');
      await refreshPO();
    } catch (error) {
      alert('Failed to reject PO: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      await purchaseService.cancelPO(id, { reason: cancelReason || 'Cancelled by user' });
      setCancelModal(false);
      setCancelReason('');
      await refreshPO();
    } catch (error) {
      alert('Failed to cancel PO: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  const isDraft = po?.status_name === 'Draft';
  const isPending = po?.status_name === 'Pending' || po?.status_name === 'Pending Approval';
  const isCancellable = isDraft || isPending || po?.status_name === 'Approved';

  if (loading) return <div className={styles.loading}>Loading purchase order details...</div>;
  if (!po) return <div className={styles.error}>Purchase order not found.</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.btnBack} onClick={() => navigate('/purchase/orders')}>
          &larr; Back to Orders
        </button>
        <div className={styles.headerTitleRow}>
          <div>
            <h2 className={styles.title}>Purchase Order {po.po_number}</h2>
            <p className={styles.subtitle}>Created on {formatDate(po.created_at, 'datetime')}</p>
          </div>
          <span className={`${styles.badge} ${styles[po.status_name ? po.status_name.toLowerCase().replace(' ', '') : ''] || styles.defaultBadge}`}>
            {po.status_name}
          </span>
        </div>
      </div>

      <div className={styles.mainGrid}>
        <div className={styles.leftCol}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Supplier Information</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoGroup}>
                <span className={styles.infoLabel}>Name</span>
                <span className={styles.infoValue}><strong>{po.supplier_name}</strong></span>
              </div>
              <div className={styles.infoGroup}>
                <span className={styles.infoLabel}>Email</span>
                <span className={styles.infoValue}>{po.supplier_email || 'N/A'}</span>
              </div>
              <div className={styles.infoGroup}>
                <span className={styles.infoLabel}>Phone</span>
                <span className={styles.infoValue}>{po.supplier_phone || 'N/A'}</span>
              </div>
              <div className={styles.infoGroup}>
                <span className={styles.infoLabel}>Address</span>
                <span className={styles.infoValue}>{po.supplier_address || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Order Items</h3>
            <div className={styles.tableWrapper}>
              <table className={styles.itemsTable}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className={styles.textRight}>Qty</th>
                    <th className={styles.textRight}>Unit Price</th>
                    <th className={styles.textRight}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {po.items && po.items.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div className={styles.productName}>{item.product_name}</div>
                        {item.sku && <div className={styles.productSku}>{item.sku}</div>}
                      </td>
                      <td className={styles.textRight}>{item.quantity_ordered}</td>
                      <td className={styles.textRight}>{formatCurrency(item.unit_price)}</td>
                      <td className={styles.textRight}><strong>{formatCurrency(item.total)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.totalsContainer}>
              <div className={styles.totalsRow}>
                <span>Subtotal</span>
                <span>{formatCurrency(po.subtotal)}</span>
              </div>
              <div className={styles.totalsRow}>
                <span>Tax (15%)</span>
                <span>{formatCurrency(po.tax_amount)}</span>
              </div>
              <div className={`${styles.totalsRow} ${styles.grandTotal}`}>
                <span>Total</span>
                <span>{formatCurrency(po.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.rightCol}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Order Details</h3>
            <div className={styles.infoList}>
              <div className={styles.listItem}>
                <span className={styles.listLabel}>Expected Delivery</span>
                <span className={styles.listValue}>{formatDate(po.expected_delivery_date)}</span>
              </div>
              <div className={styles.listItem}>
                <span className={styles.listLabel}>Sector/Department</span>
                <span className={styles.listValue}>{po.sector_name || 'N/A'}</span>
              </div>
              <div className={styles.listItem}>
                <span className={styles.listLabel}>Created By</span>
                <span className={styles.listValue}>{po.created_by_name}</span>
              </div>
              <div className={styles.listItem}>
                <span className={styles.listLabel}>Approved By</span>
                <span className={styles.listValue}>{po.approved_by_name || 'Pending'}</span>
              </div>
            </div>
          </div>

          {po.notes && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Notes / Terms</h3>
              <p className={styles.notesText}>{po.notes}</p>
            </div>
          )}

          {isDraft && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Submit Order</h3>
              <p className={styles.approvalText}>This purchase order is currently a Draft. Submit it to CEO for approval.</p>
              <div className={styles.approvalBtns}>
                <button className={styles.btnApprove} disabled={actionLoading} onClick={handleSubmit}>
                  {actionLoading ? 'Submitting...' : 'Submit for Approval'}
                </button>
                <button className={styles.btnSecondary} onClick={() => navigate(`/purchase/orders/edit/${po.id}`)}>
                  Edit Order
                </button>
              </div>
            </div>
          )}

          {isPending && isCeo && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Approval Actions</h3>
              <p className={styles.approvalText}>This purchase order requires your approval as CEO.</p>
              <div className={styles.approvalBtns}>
                <button className={styles.btnApprove} disabled={actionLoading} onClick={handleApprove}>
                  {actionLoading ? 'Processing...' : 'Approve'}
                </button>
                <button className={styles.btnReject} disabled={actionLoading} onClick={() => setRejectModal(true)}>
                  Reject
                </button>
              </div>
            </div>
          )}

          {isCancellable && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle} style={{ color: '#dc2626' }}>Cancel Order</h3>
              <p className={styles.approvalText}>Cancel this purchase order. This action cannot be undone.</p>
              <button className={styles.btnCancel} onClick={() => setCancelModal(true)}>
                Cancel Order
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className={styles.modalOverlay} onClick={() => setRejectModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3>Reject Purchase Order</h3>
            <p style={{ color: '#64748b', marginBottom: 12 }}>Provide a reason for rejection. This is required.</p>
            <textarea
              className={styles.modalTextarea}
              rows={4}
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setRejectModal(false)}>Cancel</button>
              <button className={styles.btnReject} disabled={!rejectReason.trim() || actionLoading} onClick={handleReject}>
                {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal && (
        <div className={styles.modalOverlay} onClick={() => setCancelModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#dc2626' }}>Cancel Purchase Order</h3>
            <p style={{ color: '#64748b', marginBottom: 12 }}>Are you sure you want to cancel this order? This cannot be undone.</p>
            <textarea
              className={styles.modalTextarea}
              rows={3}
              placeholder="Reason for cancellation (optional)"
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
            />
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setCancelModal(false)}>Go Back</button>
              <button className={styles.btnCancel} disabled={actionLoading} onClick={handleCancel}>
                {actionLoading ? 'Cancelling...' : 'Yes, Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderDetail;