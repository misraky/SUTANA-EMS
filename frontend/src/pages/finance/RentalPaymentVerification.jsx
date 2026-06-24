import React, { useState, useEffect, useRef } from 'react';
import { Search, Eye, CheckCircle, XCircle, Download, FileText, Check, Upload } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const [verifiedAmount, setVerifiedAmount] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [selectedProofFile, setSelectedProofFile] = useState(null);
  const fileInputRef = useRef(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 5000);
  };

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  useEffect(() => {
    if (showSearch && searchQuery.length >= 2) {
      const timer = setTimeout(() => searchOrders(), 300);
      return () => clearTimeout(timer);
    }
    if (searchQuery.length < 2) {
      setSearchResults([]);
    }
  }, [searchQuery, showSearch]);

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      const res = await financeService.getRentalPaymentVerification();
      if (res.status === 'success') {
        setOrders(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch pending payments', error);
    } finally {
      setLoading(false);
    }
  };

  const searchOrders = async () => {
    try {
      setSearching(true);
      const res = await financeService.searchRentalOrders(searchQuery);
      if (res.status === 'success') {
        setSearchResults(res.data);
      }
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setSearching(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setSelectedProofFile(e.target.files[0]);
    }
  };

  const handleUploadProof = async () => {
    if (!selectedProofFile) {
      showNotification('Please select a proof file to upload.', 'error');
      return;
    }
    try {
      setUploadingProof(true);
      await financeService.uploadRentalPaymentProof(selectedOrder.id, selectedProofFile);
      showNotification('Payment proof uploaded successfully. You can now verify the payment below.', 'success');
      setSelectedProofFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSelectedOrder(null);
      await fetchPendingPayments();
    } catch (error) {
      console.error('Failed to upload proof', error);
      showNotification('Failed to upload proof. Please try again.', 'error');
    } finally {
      setUploadingProof(false);
    }
  };

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setShowSearch(false);
    if (Number(order.refundAmount) > 0) {
      setVerifiedAmount('');
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

  const allOrders = [...orders, ...searchResults.filter(sr => !orders.find(o => o.id === sr.id))];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Rental Payment Verification</h2>
        <p>Verify customer-uploaded payments or record in-person payments.</p>
      </div>

      {notification.show && (
        <div className={`${styles.notification} ${styles[notification.type]}`}>
          {notification.message}
        </div>
      )}

      <div className={styles.contentGrid}>
        <div className={styles.ordersList}>
          <div className={styles.listHeader}>
            <h3>Pending Verifications ({orders.length})</h3>
            <button className={styles.searchToggle} onClick={() => { setShowSearch(!showSearch); setSearchQuery(''); setSearchResults([]); }}>
              <Search size={16} /> {showSearch ? 'Cancel Search' : 'Search Orders'}
            </button>
          </div>

          {showSearch && (
            <div className={styles.searchBar}>
              <input
                type="text"
                placeholder="Search by order #, customer name, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
                autoFocus
              />
              {searching && <span className={styles.searchSpinner}>Searching...</span>}
            </div>
          )}

          {loading ? (
            <p>Loading...</p>
          ) : allOrders.length === 0 ? (
            <div className={styles.emptyState}>
              {showSearch && searchQuery.length >= 2
                ? 'No orders match your search.'
                : 'No pending payments at the moment. Use Search to find an order and record an in-person payment.'}
            </div>
          ) : (
            <div className={styles.listContainer}>
              {allOrders.map(order => {
                const isRefund = Number(order.refundAmount) > 0;
                const isAdditional = Number(order.additionalOwed) > 0;
                const isSearchResult = !orders.find(o => o.id === order.id);
                const amountToShow = isRefund ? order.refundAmount : (isAdditional ? order.additionalOwed : order.totalAmount);
                const typeText = isRefund ? 'REFUND' : (isAdditional ? 'ADDITIONAL PAYMENT' : 'INITIAL PAYMENT');

                return (
                  <div
                    key={order.id}
                    className={`${styles.orderCard} ${selectedOrder?.id === order.id ? styles.selectedCard : ''} ${isSearchResult ? styles.searchResultCard : ''}`}
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
                        {isSearchResult ? order.status : (order.paymentStatus === 'PENDING_VERIFICATION' ? 'Proof Uploaded - Verify' : 'Waiting for Payment')}
                      </span></p>
                      {isSearchResult && <p className={styles.searchLabel}>Found via search — in-person payment</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={styles.verificationPanel}>
          {!selectedOrder ? (
            <div className={styles.noSelection}>
              <FileText size={48} color="#94a3b8" />
              <h3>Select an Order</h3>
              <p>Click on an order from the list or search for an order to record an in-person payment.</p>
            </div>
          ) : (
            <div className={styles.verificationForm}>
              <div className={styles.formHeader}>
                <h3>Order Details</h3>
                <span className={styles.headerOrderNum}>#{selectedOrder.orderNumber}</span>
              </div>

              <div className={styles.customerInfo}>
                <p><strong>Customer:</strong> {selectedOrder.customerName} ({selectedOrder.customerPhone || selectedOrder.customerEmail})</p>
                <p><strong>Car:</strong> {selectedOrder.carName}</p>
                <p><strong>Initial Total:</strong> {Number(selectedOrder.totalAmount).toLocaleString()} ETB</p>
                <p><strong>Payment Method:</strong> {selectedOrder.paymentMethod}</p>
                <p><strong>Order Status:</strong> {selectedOrder.status}</p>
                <p><strong>Payment Status:</strong> {selectedOrder.paymentStatus}</p>
                {Number(selectedOrder.additionalOwed) > 0 && (
                  <p><strong>Additional Owed:</strong> <span style={{ color: '#ea580c', fontWeight: 'bold' }}>{Number(selectedOrder.additionalOwed).toLocaleString()} ETB</span></p>
                )}
                {Number(selectedOrder.refundAmount) > 0 && (
                  <p><strong>Refund Amount:</strong> <span style={{ color: '#16a34a', fontWeight: 'bold' }}>{Number(selectedOrder.refundAmount).toLocaleString()} ETB</span></p>
                )}
              </div>

              {Number(selectedOrder.refundAmount) === 0 && selectedOrder.paymentProofUrl && (
                <div className={styles.proofSection}>
                  <h4>Customer Uploaded Proof:</h4>
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
                </div>
              )}

              {Number(selectedOrder.refundAmount) === 0 && !selectedOrder.paymentProofUrl && (
                <div className={styles.proofSection}>
                  <h4>Upload Proof Document (for in-person payments):</h4>
                  <div className={styles.uploadRow}>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      ref={fileInputRef}
                    />
                    <button
                      className={styles.uploadBtn}
                      onClick={handleUploadProof}
                      disabled={!selectedProofFile || uploadingProof}
                    >
                      <Upload size={16} /> {uploadingProof ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                  {selectedProofFile && (
                    <p className={styles.uploadHint}>Selected: {selectedProofFile.name}</p>
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
                      <label><input type="checkbox" /> Checked bank statement → Payment found?</label>
                      <label><input type="checkbox" /> Checked Telebirr app → Payment found?</label>
                      <label><input type="checkbox" /> Cash received in person</label>
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
                      <label>Reference #:</label>
                      <input
                        type="text"
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        placeholder="e.g. TRX-123456789 or CASH-IN-PERSON"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Notes:</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. Customer paid in cash at the office."
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
                        <XCircle size={18} /> REJECT
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