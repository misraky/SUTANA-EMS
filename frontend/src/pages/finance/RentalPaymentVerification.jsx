import React, { useState, useEffect } from 'react';
import { Search, Eye, CheckCircle, XCircle, Download, FileText, Check } from 'lucide-react';
import financeService from '../../services/financeService';
import styles from './RentalPaymentVerification.module.css';

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');
  return `${baseUrl}${path}`;
};

const RentalPaymentVerification = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Verification Form State
  const [verifiedAmount, setVerifiedAmount] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 5000);
  };

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      const res = await financeService.getPendingRentalPayments();
      if (res.status === 'success') {
        setOrders(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch pending payments', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    if (Number(order.refundAmount) > 0) {
      setVerifiedAmount(''); // No amount needed for refund input
    } else if (Number(order.additionalOwed) > 0) {
      setVerifiedAmount(order.additionalOwed);
    } else {
      setVerifiedAmount(order.totalAmount || '');
    }
    setReferenceNumber('');
    setNotes('');
  };

  const handleVerify = async (isVerified) => {
    if (isVerified && (!verifiedAmount || !referenceNumber)) {
      showNotification('Please fill in Verified Amount and Reference # to mark as paid.', 'error');
      return;
    }

    if (!isVerified && !notes) {
      showNotification('Please provide a reason in the Notes field to reject the payment.', 'error');
      return;
    }

    try {
      setVerifying(true);
      const payload = {
        isVerified,
        verifiedAmount: isVerified ? parseFloat(verifiedAmount) : null,
        referenceNumber: isVerified ? referenceNumber : null,
        notes
      };

      await financeService.verifyRentalPayment(selectedOrder.id, payload);
      showNotification(isVerified ? 'Payment marked as PAID!' : 'Payment REJECTED and sent back to customer.', 'success');
      setSelectedOrder(null);
      await fetchPendingPayments();
    } catch (error) {
      console.error('Failed to verify payment', error);
      showNotification('Failed to process payment. Please try again.', 'error');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Rental Payment Verification</h2>
        <p>Review uploaded proof of payments from customers and mark as paid manually.</p>
      </div>

      {notification.show && (
        <div className={`${styles.notification} ${styles[notification.type]}`}>
          {notification.message}
        </div>
      )}

      <div className={styles.contentGrid}>
        {/* Left Column: List of Pending Orders */}
        <div className={styles.ordersList}>
          <h3>Pending Verifications ({orders.length})</h3>
          
          {loading ? (
            <p>Loading...</p>
          ) : orders.length === 0 ? (
            <div className={styles.emptyState}>No pending payments at the moment.</div>
          ) : (
            <div className={styles.listContainer}>
              {orders.map(order => {
                const isRefund = Number(order.refundAmount) > 0;
                const isAdditional = Number(order.additionalOwed) > 0;
                const amountToShow = isRefund ? order.refundAmount : (isAdditional ? order.additionalOwed : order.totalAmount);
                const typeText = isRefund ? 'REFUND' : (isAdditional ? 'ADDITIONAL PAYMENT' : 'INITIAL PAYMENT');
                
                return (
                  <div 
                    key={order.id} 
                    className={`${styles.orderCard} ${selectedOrder?.id === order.id ? styles.selectedCard : ''}`}
                    onClick={() => handleSelectOrder(order)}
                    style={isRefund ? { borderLeft: '4px solid #10b981' } : (isAdditional ? { borderLeft: '4px solid #f59e0b' } : {})}
                  >
                    <div className={styles.cardHeader}>
                      <span className={styles.orderNum}>{order.orderNumber}</span>
                      <span className={styles.amountBadge}>{Number(amountToShow).toLocaleString()} ETB</span>
                    </div>
                    <div className={styles.cardBody}>
                      <p><strong>Customer:</strong> {order.customerName}</p>
                      <p><strong>Type:</strong> <span style={{ fontWeight: 'bold', color: isRefund ? '#10b981' : '#3b82f6' }}>{typeText}</span></p>
                      <p><strong>Status:</strong> <span className={styles.statusText}>
                        {order.paymentStatus === 'PENDING_VERIFICATION' ? 'Proof Uploaded - Verify' : 'Waiting for Payment'}
                      </span></p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Verification Details */}
        <div className={styles.verificationPanel}>
          {!selectedOrder ? (
            <div className={styles.noSelection}>
              <FileText size={48} color="#94a3b8" />
              <h3>Select an Order</h3>
              <p>Click on an order from the list to view its payment proof and verify.</p>
            </div>
          ) : (
            <div className={styles.verificationForm}>
              <div className={styles.formHeader}>
                <h3>Order Details</h3>
                <span className={styles.headerOrderNum}>#{selectedOrder.orderNumber}</span>
              </div>
              
              <div className={styles.customerInfo}>
                <p><strong>Customer:</strong> {selectedOrder.customerName} ({selectedOrder.customerPhone || selectedOrder.customerEmail})</p>
                <p><strong>Initial Total:</strong> {Number(selectedOrder.totalAmount).toLocaleString()} ETB</p>
                {Number(selectedOrder.additionalOwed) > 0 && (
                  <p><strong>Additional Owed:</strong> <span style={{ color: '#ea580c', fontWeight: 'bold' }}>{Number(selectedOrder.additionalOwed).toLocaleString()} ETB</span></p>
                )}
                {Number(selectedOrder.refundAmount) > 0 && (
                  <p><strong>Refund Amount:</strong> <span style={{ color: '#16a34a', fontWeight: 'bold' }}>{Number(selectedOrder.refundAmount).toLocaleString()} ETB</span></p>
                )}
                <p><strong>Payment Method Chosen:</strong> {selectedOrder.paymentMethod}</p>
              </div>

              {Number(selectedOrder.refundAmount) === 0 && (
                <div className={styles.proofSection}>
                  <h4>Customer Uploaded Proof:</h4>
                  {selectedOrder.paymentProofUrl ? (
                    <div className={styles.imageContainer}>
                      <img 
                        src={getImageUrl(selectedOrder.paymentProofUrl)} 
                        alt="Payment Proof" 
                        className={styles.proofImg} 
                      />
                      <a 
                        href={getImageUrl(selectedOrder.paymentProofUrl)} 
                        target="_blank" 
                        rel="noreferrer"
                        className={styles.viewFullBtn}
                      >
                        <Eye size={16} /> View Full Image
                      </a>
                    </div>
                  ) : (
                    <p className={styles.noProof}>No proof image uploaded.</p>
                  )}
                </div>
              )}

              <div className={styles.actionForm}>
                <h4>Finance Officer Action:</h4>
                {Number(selectedOrder.refundAmount) > 0 ? (
                  <>
                    <div className={styles.formGroup}>
                      <label>Notes (e.g., Transfer reference for refund):</label>
                      <textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. Transferred back to customer's account."
                        rows={3}
                      />
                    </div>
                    <div className={styles.actionButtons}>
                      <button 
                        className={styles.btnApprove} 
                        onClick={() => handleVerify(true)}
                        disabled={verifying}
                      >
                        <CheckCircle size={18} /> {verifying ? 'Processing...' : 'CONFIRM REFUND PAID'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.checks}>
                      <label><input type="checkbox" /> Checked bank statement (manually) → Payment found?</label>
                      <label><input type="checkbox" /> Checked Telebirr app → Payment found?</label>
                      <label><input type="checkbox" /> Counted cash (if in person)</label>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Verified Amount (ETB):</label>
                      <input 
                        type="number" 
                        value={verifiedAmount}
                        onChange={(e) => setVerifiedAmount(e.target.value)}
                        placeholder="e.g. 17500"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Reference # (from customer proof):</label>
                      <input 
                        type="text" 
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        placeholder="e.g. TRX-123456789"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Notes (Required for rejection):</label>
                      <textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. Verified from CBE app. Payment confirmed."
                        rows={3}
                      />
                    </div>

                    <div className={styles.actionButtons}>
                      <button 
                        className={styles.btnApprove} 
                        onClick={() => handleVerify(true)}
                        disabled={verifying}
                      >
                        <CheckCircle size={18} /> {verifying ? 'Processing...' : 'MARK AS PAID'}
                      </button>
                      <button 
                        className={styles.btnReject} 
                        onClick={() => handleVerify(false)}
                        disabled={verifying}
                      >
                        <XCircle size={18} /> REJECT & ASK AGAIN
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RentalPaymentVerification;
