import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, XCircle, Car, Calendar, CreditCard, Upload, AlertTriangle } from 'lucide-react';
import carService from '../../services/carService';
import styles from './CustomerRentals.module.css';

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');
  return `${baseUrl}${path}`;
};

const CustomerRentals = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingFor, setUploadingFor] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [extendPrompt, setExtendPrompt] = useState({ orderId: null, days: 1 });
  const [cancelPrompt, setCancelPrompt] = useState({ orderId: null, reason: '' });
  const [editingRemarks, setEditingRemarks] = useState({ orderId: null, text: '' });

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 5000);
  };

  useEffect(() => {
    fetchMyOrders();
  }, []);

  const fetchMyOrders = async () => {
    try {
      setLoading(true);
      const res = await carService.getMyRentalOrders();
      if (res.status === 'success') {
        setOrders(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch my rental orders', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadProof = async (orderId) => {
    if (!selectedFile) {
      showNotification('Please select a file to upload as proof.', 'error');
      return;
    }

    try {
      setUploadingFor(orderId);
      const formData = new FormData();
      formData.append('proof', selectedFile);

      await carService.uploadPaymentProof(orderId, formData);
      showNotification('Payment proof uploaded successfully. Finance is reviewing it.', 'success');
      setSelectedFile(null);
      await fetchMyOrders();
    } catch (error) {
      console.error('Failed to upload proof', error);
      showNotification('Failed to upload payment proof. Please try again.', 'error');
    } finally {
      setUploadingFor(null);
    }
  };

  const handleCancelOrder = async (orderId, reason) => {
    if (!reason.trim()) {
      showNotification('Please provide a reason for cancellation.', 'error');
      return;
    }
    try {
      await carService.cancelRentalOrder(orderId, reason);
      showNotification('Cancellation requested. Waiting for manager approval.', 'success');
      setCancelPrompt({ orderId: null, reason: '' });
      fetchMyOrders();
    } catch (e) {
      showNotification('Failed to request cancellation.', 'error');
    }
  };

  const handleExtendOrder = async (orderId, days) => {
    try {
      await carService.extendRentalOrder(orderId, days);
      showNotification('Extension requested successfully.', 'success');
      setExtendPrompt({ orderId: null, days: 1 });
      fetchMyOrders();
    } catch (e) {
      showNotification('Failed to request extension.', 'error');
    }
  };

  const handleSaveRemarks = async (orderId) => {
    try {
      await carService.updatePickupRemarks(orderId, editingRemarks.text);
      setEditingRemarks({ orderId: null, text: '' });
      fetchOrders();
    } catch (error) {
      console.error('Failed to save remarks', error);
      alert('Failed to save remarks');
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading your reservations...</div>;
  }

  return (
    <div className={styles.rentalsContainer}>
      <div className={styles.header}>
        <h2>My Car Rentals</h2>
        <p>Track your reservation statuses and history</p>
      </div>

      {notification.show && (
        <div className={`${styles.notification} ${styles[notification.type]}`}>
          {notification.message}
        </div>
      )}

      <div className={styles.ordersList}>
        {orders.length === 0 ? (
          <div className={styles.emptyState}>
            <Car size={48} className={styles.emptyIcon} />
            <h3>No reservations found</h3>
            <p>You haven't rented any cars yet. Visit our fleet gallery to book your first ride!</p>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className={styles.orderCard}>
              <div className={styles.orderHeader}>
                <span className={styles.orderNum}>Order #{order.orderNumber}</span>
                <span className={`${styles.statusBadge} ${styles[order.status.toLowerCase()]}`}>
                  {order.status === 'PENDING_APPROVAL' && <Clock size={16} />}
                  {order.status === 'APPROVED' && <CheckCircle2 size={16} />}
                  {order.status === 'REJECTED' && <XCircle size={16} />}
                  {order.status.replace('_', ' ')}
                </span>
              </div>

              <div className={styles.orderBody}>
                <div className={styles.carSection}>
                  {order.carImage ? (
                    <img src={getImageUrl(order.carImage)} alt={order.carName} className={styles.carImg} />
                  ) : (
                    <div className={styles.carImgPlaceholder}><Car size={32} /></div>
                  )}
                  <div className={styles.carDetails}>
                    <h3>{order.carName}</h3>
                    <p className={styles.driverName}>Driver: {order.driverName}</p>
                  </div>
                </div>

                <div className={styles.detailsGrid}>
                  <div className={styles.detailItem}>
                    <Calendar size={18} className={styles.detailIcon} />
                    <div>
                      <span className={styles.detailLabel}>Rental Period</span>
                      <span className={styles.detailValue}>
                        {new Date(order.pickupDate).toLocaleDateString()} - {new Date(order.returnDate).toLocaleDateString()}
                      </span>
                      <span className={styles.detailSub}>({order.totalDays} days)</span>
                    </div>
                  </div>

                  <div className={styles.detailItem}>
                    <CreditCard size={18} className={styles.detailIcon} />
                    <div>
                      <span className={styles.detailLabel}>Total Cost</span>
                      <span className={styles.detailValue}>ETB {Number(order.totalAmount).toLocaleString()}</span>
                      <span className={styles.detailSub}>(incl. ETB {Number(order.securityDeposit).toLocaleString()} deposit)</span>
                    </div>
                  </div>
                </div>
              </div>

              {['PENDING_APPROVAL', 'APPROVED', 'CONFIRMED'].includes(order.status) && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                  {order.isCancellationRequested ? (
                    <div className={styles.statusMessage} style={{ backgroundColor: '#fef2f2', color: '#991b1b' }}>
                      <Clock size={16} /> Cancellation request is pending manager approval.
                    </div>
                  ) : cancelPrompt.orderId === order.id ? (
                    <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: '6px' }}>
                      <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: '#991b1b' }}>Why are you cancelling?</p>
                      <input 
                        type="text" 
                        placeholder="Cancellation reason"
                        value={cancelPrompt.reason} 
                        onChange={(e) => setCancelPrompt({...cancelPrompt, reason: e.target.value})}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #fca5a5', borderRadius: '4px', marginBottom: '0.5rem' }}
                      />
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => handleCancelOrder(order.id, cancelPrompt.reason)}
                          style={{ background: '#ef4444', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Submit Cancellation
                        </button>
                        <button 
                          onClick={() => setCancelPrompt({ orderId: null, reason: '' })}
                          style={{ background: '#e2e8f0', color: '#475569', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Keep Order
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setCancelPrompt({ orderId: order.id, reason: '' })}
                      style={{ background: '#ef4444', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              )}

              {order.status === 'PENDING_APPROVAL' && (
                <div className={styles.statusMessage}>
                  <div className={styles.msgIcon}><Clock size={20} color="#d97706" /></div>
                  <p>Your reservation is waiting for manager confirmation. You will be notified shortly.</p>
                </div>
              )}

              {order.status === 'APPROVED' && order.paymentStatus === 'UNPAID' && (
                <div className={styles.paymentSection}>
                  {order.financeNotes ? (
                    <div className={`${styles.statusMessage} ${styles.rejectedMsg}`} style={{ backgroundColor: '#fef2f2', color: '#991b1b', marginBottom: '1rem' }}>
                      <div className={styles.msgIcon}><AlertTriangle size={20} color="#dc2626" /></div>
                      <p><strong>Payment Rejected:</strong> {order.financeNotes}. Please review and submit your payment again.</p>
                    </div>
                  ) : (
                    <div className={`${styles.statusMessage} ${styles.approvedMsg}`}>
                      <div className={styles.msgIcon}><CheckCircle2 size={20} color="#059669" /></div>
                      <p>Reservation confirmed! Please complete your payment to finalize the rental.</p>
                    </div>
                  )}
                  
                  <div className={styles.howToPay}>
                    <h3>HOW TO PAY</h3>
                    
                    <div className={styles.payOption}>
                      <h4>Option 1: CASH</h4>
                      <p>Visit Finance Counter at our main office.<br/>Bring your Order #: <strong>{order.orderNumber}</strong><br/>Pay cash → Receive receipt → Done.</p>
                    </div>

                    <div className={styles.payOption}>
                      <h4>Option 2: BANK TRANSFER (Manual)</h4>
                      <p>Bank: <strong>Commercial Bank of Ethiopia</strong><br/>Account Name: <strong>Sutana PLC</strong><br/>Account Number: <strong>1000 1234 5678</strong></p>
                      <p>Reference: <strong>{order.orderNumber}</strong> (MUST include this)</p>
                      <p className={styles.payWarning}>⚠️ Finance officer will verify payment manually (can take 1-24 hours)</p>
                    </div>

                    <div className={styles.payOption}>
                      <h4>Option 3: TELEBIRR (Manual)</h4>
                      <p>Send to: <strong>Sutana ERP</strong> (Merchant Code: <strong>123456</strong>)<br/>Amount: <strong>{Number(order.totalAmount).toLocaleString()} ETB</strong><br/>Reference: <strong>{order.orderNumber}</strong></p>
                    </div>

                    <div className={styles.uploadProofBox}>
                      <h4>UPLOAD PROOF OF PAYMENT (OPTIONAL)</h4>
                      <p>If you paid via Bank Transfer or Telebirr, you can optionally upload your receipt/screenshot here. Finance will also manually check for payments.</p>
                      <input type="file" accept="image/*" onChange={handleFileChange} className={styles.fileInput} />
                      <button 
                        className={styles.uploadBtn} 
                        onClick={() => handleUploadProof(order.id)}
                        disabled={uploadingFor === order.id}
                      >
                        <Upload size={16} /> 
                        {uploadingFor === order.id ? 'Uploading...' : 'Submit Proof'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {order.status === 'APPROVED' && order.paymentStatus === 'PENDING_VERIFICATION' && (
                <div className={`${styles.statusMessage} ${styles.pendingVerificationMsg}`}>
                  <div className={styles.msgIcon}><Clock size={20} color="#b45309" /></div>
                  <p><strong>Proof of payment uploaded!</strong> Our finance team is reviewing it. This can take 1-24 hours.</p>
                </div>
              )}

              {order.status === 'CONFIRMED' && (
                <div className={`${styles.statusMessage} ${styles.paidMsg}`}>
                  <div className={styles.msgIcon}><CheckCircle2 size={20} color="#15803d" /></div>
                  <p><strong>Payment Verified!</strong> Your rental is fully confirmed. Please pickup the car on {new Date(order.pickupDate).toLocaleDateString()}.</p>
                </div>
              )}

              {order.status === 'ACTIVE' && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                  <div className={`${styles.statusMessage} ${styles.paidMsg}`} style={{ marginBottom: '1rem' }}>
                    <div className={styles.msgIcon}><Car size={20} color="#15803d" /></div>
                    <p><strong>Car is active!</strong> You currently have the car. Please return by {new Date(order.returnDate).toLocaleDateString()}.</p>
                  </div>
                  
                  {Number(order.additionalOwed) > 0 && (
                    <div className={styles.paymentSection} style={{ marginBottom: '1rem' }}>
                      <div className={`${styles.statusMessage} ${styles.rejectedMsg}`} style={{ backgroundColor: '#fff7ed', color: '#c2410c' }}>
                        <div className={styles.msgIcon}><AlertTriangle size={20} color="#ea580c" /></div>
                        <div>
                          <p style={{ margin: '0 0 0.5rem 0' }}><strong>Outstanding Balance: {Number(order.additionalOwed).toLocaleString()} ETB</strong></p>
                          <p style={{ margin: 0 }}>You have an additional balance due (e.g. extension fee). Please make the payment and upload proof below.</p>
                        </div>
                      </div>
                      
                      {order.paymentStatus === 'PENDING_VERIFICATION' ? (
                        <div className={`${styles.statusMessage} ${styles.pendingVerificationMsg}`} style={{ marginTop: '0.5rem' }}>
                          <Clock size={16} /> Proof of payment uploaded. Finance is reviewing it.
                        </div>
                      ) : (
                        <div className={styles.uploadProofBox}>
                          <h4>UPLOAD PROOF OF ADDITIONAL PAYMENT</h4>
                          <input type="file" accept="image/*" onChange={handleFileChange} className={styles.fileInput} />
                          <button 
                            className={styles.uploadBtn} 
                            onClick={() => handleUploadProof(order.id)}
                            disabled={uploadingFor === order.id}
                          >
                            <Upload size={16} /> 
                            {uploadingFor === order.id ? 'Uploading...' : 'Submit Proof'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {order.pendingExtensionDays ? (
                    <div className={styles.statusMessage}>
                      <Clock size={16} /> Extension request for {order.pendingExtensionDays} days is pending manager approval.
                    </div>
                  ) : extendPrompt.orderId === order.id ? (
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px' }}>
                      <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>Request Extension</p>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input 
                          type="number" 
                          min="1" 
                          value={extendPrompt.days} 
                          onChange={(e) => setExtendPrompt({...extendPrompt, days: e.target.value})}
                          style={{ width: '80px', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                        /> days
                        <button 
                          onClick={() => handleExtendOrder(order.id, extendPrompt.days)}
                          style={{ background: '#3b82f6', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Submit
                        </button>
                        <button 
                          onClick={() => setExtendPrompt({ orderId: null, days: 1 })}
                          style={{ background: '#e2e8f0', color: '#475569', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setExtendPrompt({ orderId: order.id, days: 1 })}
                      style={{ background: '#3b82f6', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Request Extension
                    </button>
                  )}
                </div>
              )}

              {order.status === 'REJECTED' && (
                <div className={`${styles.statusMessage} ${styles.rejectedMsg}`}>
                  <div className={styles.msgIcon}><XCircle size={20} color="#dc2626" /></div>
                  <p>Reservation could not be processed.</p>
                  {order.managerNote && (
                    <div className={styles.rejectReason}><strong>Reason:</strong> {order.managerNote}</div>
                  )}
                </div>
              )}

              {['COMPLETED', 'CANCELLED'].includes(order.status) && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                  {order.status === 'COMPLETED' && (
                    <div className={`${styles.statusMessage} ${styles.paidMsg}`} style={{ marginBottom: '1rem' }}>
                      <div className={styles.msgIcon}><CheckCircle2 size={20} color="#15803d" /></div>
                      <p><strong>Order Completed!</strong> Thank you for renting with us.</p>
                    </div>
                  )}
                  {order.status === 'CANCELLED' && (
                    <div className={`${styles.statusMessage} ${styles.rejectedMsg}`} style={{ marginBottom: '1rem', backgroundColor: '#fef2f2', color: '#991b1b' }}>
                      <div className={styles.msgIcon}><XCircle size={20} color="#dc2626" /></div>
                      <p><strong>Order Cancelled.</strong></p>
                    </div>
                  )}

                  {Number(order.additionalOwed) > 0 && (
                    <div className={styles.paymentSection} style={{ marginBottom: '1rem' }}>
                      <div className={`${styles.statusMessage} ${styles.rejectedMsg}`} style={{ backgroundColor: '#fff7ed', color: '#c2410c' }}>
                        <div className={styles.msgIcon}><AlertTriangle size={20} color="#ea580c" /></div>
                        <div>
                          <p style={{ margin: '0 0 0.5rem 0' }}><strong>Outstanding Balance: {Number(order.additionalOwed).toLocaleString()} ETB</strong></p>
                          <p style={{ margin: 0 }}>You have an additional balance due for late/damage fees. Please make the payment and upload proof below.</p>
                        </div>
                      </div>
                      
                      {order.paymentStatus === 'PENDING_VERIFICATION' ? (
                        <div className={`${styles.statusMessage} ${styles.pendingVerificationMsg}`} style={{ marginTop: '0.5rem' }}>
                          <Clock size={16} /> Proof of payment uploaded. Finance is reviewing it.
                        </div>
                      ) : (
                        <div className={styles.uploadProofBox}>
                          <h4>UPLOAD PROOF OF PAYMENT</h4>
                          <input type="file" accept="image/*" onChange={handleFileChange} className={styles.fileInput} />
                          <button 
                            className={styles.uploadBtn} 
                            onClick={() => handleUploadProof(order.id)}
                            disabled={uploadingFor === order.id}
                          >
                            <Upload size={16} /> 
                            {uploadingFor === order.id ? 'Uploading...' : 'Submit Proof'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {Number(order.refundAmount) > 0 && (
                    <div className={`${styles.statusMessage} ${styles.paidMsg}`} style={{ backgroundColor: '#f0fdf4', color: '#166534', marginTop: '1rem' }}>
                      <div className={styles.msgIcon}><CheckCircle2 size={20} color="#15803d" /></div>
                      <div>
                        <p style={{ margin: '0 0 0.25rem 0' }}><strong>Refund Processing: {Number(order.refundAmount).toLocaleString()} ETB</strong></p>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>Our finance team is currently processing a refund for this order.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CustomerRentals;
