import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, Search, Mail, AlertTriangle, Car } from 'lucide-react';
import carService from '../../services/carService';
import styles from './RentalOrdersManager.module.css';

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');
  return `${baseUrl}${path}`;
};

const RentalOrdersManager = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [actionPrompt, setActionPrompt] = useState({ orderId: null, action: null, note: '' });
  const [returnForm, setReturnForm] = useState({ orderId: null, damageFee: 0, fuelFee: 0, lateFee: 0, odometer: '', notes: '' });
  const [editingRemarks, setEditingRemarks] = useState({ orderId: null, text: '' });
  const [noShowPrompt, setNoShowPrompt] = useState(null); // orderId

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 5000);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await carService.getAllRentalOrders();
      if (res.status === 'success') {
        setOrders(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch rental orders', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClick = (orderId, action) => {
    setActionPrompt({ orderId, action, note: '' });
  };

  const confirmAction = async (orderId, newStatus, note) => {
    try {
      await carService.updateRentalOrderStatus(orderId, { status: newStatus, managerNote: note });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus, managerNote: note } : o));
      showNotification(`Order ${newStatus.toLowerCase()} successfully.`, 'success');
    } catch (error) {
      console.error('Failed to update status', error);
      showNotification('Failed to update order status.', 'error');
    } finally {
      setActionPrompt({ orderId: null, action: null, note: '' });
    }
  };

  const handleApproveExtension = async (orderId, days, isApproved) => {
    try {
      await carService.approveExtension(orderId, { isApproved, days });
      showNotification(`Extension ${isApproved ? 'approved' : 'rejected'}.`, 'success');
      fetchOrders();
    } catch (e) {
      showNotification('Failed to process extension.', 'error');
    }
  };

  const handleNoShow = async (orderId) => {
    setNoShowPrompt(orderId);
  };

  const confirmNoShow = async () => {
    try {
      await carService.markNoShow(noShowPrompt);
      showNotification('Order marked as No-Show successfully.', 'success');
      setNoShowPrompt(null);
      fetchOrders();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to mark as No-Show', 'error');
      setNoShowPrompt(null);
    }
  };

  const handleSaveRemarks = async (orderId) => {
    try {
      await carService.updatePickupRemarks(orderId, editingRemarks.text);
      showNotification('Pickup remarks saved successfully.', 'success');
      setEditingRemarks({ orderId: null, text: '' });
      fetchOrders();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to save remarks', 'error');
    }
  };



  const handleApproveCancellation = async (orderId, isApproved) => {
    try {
      await carService.approveCancellation(orderId, isApproved);
      showNotification(`Cancellation ${isApproved ? 'approved' : 'rejected'}.`, 'success');
      fetchOrders();
    } catch (e) {
      showNotification('Failed to process cancellation.', 'error');
    }
  };

  const handleStartRental = async (orderId) => {
    try {
      await carService.updateRentalOrderStatus(orderId, { status: 'ACTIVE' });
      showNotification('Rental started (Car is active).', 'success');
      fetchOrders();
    } catch (e) {
      showNotification('Failed to start rental.', 'error');
    }
  };

  const submitProcessReturn = async () => {
    try {
      await carService.processReturn(returnForm.orderId, returnForm);
      showNotification('Return processed successfully.', 'success');
      setReturnForm({ orderId: null, damageFee: 0, fuelFee: 0, lateFee: 0, odometer: '', notes: '' });
      fetchOrders();
    } catch (e) {
      showNotification('Failed to process return.', 'error');
    }
  };

  const handleContactCustomer = (order) => {
    // Generate a mailto link or use the same local notification system as before
    const subject = `Regarding your Rental Order: ${order.orderNumber}`;
    const body = `Dear ${order.customerName},\n\nRegarding your reservation for the ${order.carName}...\n\nThank you,\nSUTANA Car Rental`;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(order.customerEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
  };

  const filteredOrders = orders.filter(o => {
    if (filter !== 'ALL' && o.status !== filter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return o.orderNumber.toLowerCase().includes(term) ||
             o.customerName.toLowerCase().includes(term) ||
             o.carName.toLowerCase().includes(term);
    }
    return true;
  });

  if (loading) {
    return <div className={styles.loading}>Loading orders...</div>;
  }

  return (
    <div className={styles.managerContainer}>
      <div className={styles.header}>
        <h2>Rental Orders Management</h2>
        
        {notification.show && (
          <div className={`${styles.notification} ${styles[notification.type]}`}>
            {notification.message}
          </div>
        )}

        <div className={styles.controls}>
          <div className={styles.searchBox}>
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search orders..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className={styles.filterSelect}
          >
          <option value="ALL">All Orders</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="ACTIVE">Active</option>
            <option value="REJECTED">Rejected</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      <div className={styles.ordersList}>
        {filteredOrders.length === 0 ? (
          <div className={styles.emptyState}>No orders found matching your criteria.</div>
        ) : (
          filteredOrders.map(order => (
            <div key={order.id} className={styles.orderCard}>
              <div className={styles.orderHeader}>
                <div className={styles.orderIdInfo}>
                  <span className={styles.orderBadge}>Order #: {order.orderNumber}</span>
                  <span className={`${styles.statusBadge} ${styles[order.status.toLowerCase()]}`}>
                    {order.status === 'PENDING_APPROVAL' && <Clock size={14} />}
                    {order.status === 'APPROVED' && <CheckCircle2 size={14} />}
                    {order.status === 'REJECTED' && <XCircle size={14} />}
                    {order.status.replace('_', ' ')}
                  </span>
                </div>
                <div className={styles.datesInfo}>
                  {new Date(order.createdAt).toLocaleDateString()}
                </div>
              </div>

              {order.status === 'APPROVED' && order.paymentStatus === 'UNPAID' && order.financeNotes && (
                <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '1rem', borderBottom: '1px solid #fee2e2', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={18} color="#dc2626" />
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>
                    <strong>Payment Rejected by Finance:</strong> {order.financeNotes} <br/>
                    <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>(Awaiting customer to re-upload proof)</span>
                  </p>
                </div>
              )}

              <div className={styles.orderBody}>
                <div className={styles.customerInfo}>
                  <h4>Customer Details</h4>
                  <p><strong>Name:</strong> {order.customerName}</p>
                  <p><strong>Email:</strong> {order.customerEmail}</p>
                  <p><strong>Phone:</strong> {order.customerPhone}</p>
                  <p><strong>Driver:</strong> {order.driverName} (Lic: {order.driverLicense})</p>
                </div>

                <div className={styles.rentalInfo}>
                  <h4>Rental Details</h4>
                  <div className={styles.carInfo}>
                    {order.carImage && <img src={getImageUrl(order.carImage)} alt={order.carName} className={styles.carThumb} />}
                    <span><strong>Car:</strong> {order.carName}</span>
                  </div>
                  <p><strong>Dates:</strong> {new Date(order.pickupDate).toLocaleDateString()} to {new Date(order.returnDate).toLocaleDateString()} ({order.totalDays} days)</p>
                  <p><strong>Payment:</strong> {order.paymentMethod}</p>
                  {order.specialRequests && (
                    <p className={styles.specialReq}><strong>Note:</strong> {order.specialRequests}</p>
                  )}
                </div>

                <div className={styles.financialInfo}>
                  <h4>Financials</h4>
                  <p><strong>Rent:</strong> ETB {Number(order.rentalAmount).toLocaleString()}</p>
                  <p><strong>Deposit:</strong> ETB {Number(order.securityDeposit).toLocaleString()}</p>
                  {Number(order.extensionFee) > 0 && (
                    <p><strong>Extension Fee:</strong> ETB {Number(order.extensionFee).toLocaleString()}</p>
                  )}
                  <hr className={styles.divider} />
                  <p className={styles.totalAmount}><strong>Total:</strong> ETB {Number(order.totalAmount).toLocaleString()}</p>
                  {Number(order.additionalOwed) > 0 && (
                    <p style={{ color: '#c2410c', fontWeight: 'bold', fontSize: '0.9rem', marginTop: '4px' }}>
                      ⚠️ Outstanding Balance: ETB {Number(order.additionalOwed).toLocaleString()}
                    </p>
                  )}
                  {Number(order.refundAmount) > 0 && (
                    <p style={{ color: '#15803d', fontWeight: 'bold', fontSize: '0.9rem', marginTop: '4px' }}>
                      💚 Refund Pending: ETB {Number(order.refundAmount).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Pickup Remarks Section */}
              {(order.status === 'CONFIRMED' || order.status === 'ACTIVE' || order.status === 'COMPLETED') && (
                <div style={{ background: '#f8fafc', padding: '1rem', marginTop: '1rem', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Car size={16} /> Pickup Condition Remarks (Manager & Customer View)
                  </h4>
                  {editingRemarks.orderId === order.id ? (
                    <div>
                      <textarea 
                        value={editingRemarks.text} 
                        onChange={(e) => setEditingRemarks({...editingRemarks, text: e.target.value})}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', marginBottom: '0.5rem' }}
                        rows="3"
                        placeholder="Note any scratches, condition issues, or details upon pickup..."
                      />
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleSaveRemarks(order.id)} style={{ background: '#10b981', color: 'white', padding: '0.4rem 0.8rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save Remarks</button>
                        <button onClick={() => setEditingRemarks({ orderId: null, text: '' })} style={{ background: '#e2e8f0', padding: '0.4rem 0.8rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontSize: '14px', color: order.pickupRemarks ? '#333' : '#94a3b8', margin: '0 0 0.5rem 0' }}>
                        {order.pickupRemarks || 'No remarks recorded.'}
                      </p>
                      {(order.status === 'CONFIRMED' || order.status === 'ACTIVE') && (
                        <button 
                          onClick={() => setEditingRemarks({ orderId: order.id, text: order.pickupRemarks || '' })}
                          style={{ background: 'transparent', border: '1px solid #cbd5e1', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
                        >
                          {order.pickupRemarks ? 'Edit Remarks' : 'Add Pickup Remarks (Optional)'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {order.status === 'PENDING_APPROVAL' && actionPrompt.orderId !== order.id && (
                <div className={styles.orderActions}>
                  <button className={styles.approveBtn} onClick={() => handleUpdateClick(order.id, 'APPROVED')}>
                    <CheckCircle2 size={16} /> Approve
                  </button>
                  <button className={styles.rejectBtn} onClick={() => handleUpdateClick(order.id, 'REJECTED')}>
                    <XCircle size={16} /> Reject
                  </button>
                  <button className={styles.contactBtn} onClick={() => handleContactCustomer(order)}>
                    <Mail size={16} /> Contact Customer
                  </button>
                </div>
              )}

              {actionPrompt.orderId === order.id && (
                <div className={styles.inlinePrompt}>
                  {actionPrompt.action === 'REJECTED' ? (
                    <div className={styles.promptForm}>
                      <p>Please enter a reason for rejection:</p>
                      <input 
                        type="text" 
                        value={actionPrompt.note} 
                        onChange={(e) => setActionPrompt({...actionPrompt, note: e.target.value})} 
                        placeholder="e.g. Car unavailable"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <p>Are you sure you want to approve this reservation?</p>
                  )}
                  <div className={styles.promptActions}>
                    <button 
                      className={styles.confirmBtn} 
                      onClick={() => confirmAction(order.id, actionPrompt.action, actionPrompt.note)}
                    >
                      Confirm
                    </button>
                    <button 
                      className={styles.cancelBtn} 
                      onClick={() => setActionPrompt({ orderId: null, action: null, note: '' })}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Pending Cancellation Request */}
              {order.isCancellationRequested ? (
                <div style={{ background: '#fef2f2', padding: '1rem', marginTop: '1rem', borderRadius: '6px' }}>
                  <p><strong>Cancellation Request:</strong> Customer wants to cancel.</p>
                  <p><strong>Reason:</strong> {order.cancellationReason}</p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button onClick={() => handleApproveCancellation(order.id, true)} style={{ background: '#ef4444', color: 'white', padding: '0.4rem 0.8rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Approve Cancel</button>
                    <button onClick={() => handleApproveCancellation(order.id, false)} style={{ background: '#e2e8f0', color: '#1e293b', padding: '0.4rem 0.8rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Reject Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Pending Extension Request */}
                  {order.pendingExtensionDays && (
                    <div style={{ background: '#fef9c3', padding: '1rem', marginTop: '1rem', borderRadius: '6px' }}>
                      <p><strong>Extension Request:</strong> Customer requested {order.pendingExtensionDays} extra days.</p>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button onClick={() => handleApproveExtension(order.id, order.pendingExtensionDays, true)} style={{ background: '#10b981', color: 'white', padding: '0.4rem 0.8rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Approve</button>
                        <button onClick={() => handleApproveExtension(order.id, order.pendingExtensionDays, false)} style={{ background: '#ef4444', color: 'white', padding: '0.4rem 0.8rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Reject</button>
                      </div>
                    </div>
                  )}

                  {/* Start Rental / No-Show */}
                  {order.status === 'CONFIRMED' && (
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button onClick={() => handleStartRental(order.id)} style={{ background: '#3b82f6', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Start Rental (Handover Car)
                      </button>
                      
                      {noShowPrompt === order.id ? (
                        <div style={{ background: '#fef2f2', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid #fca5a5', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.9rem', color: '#991b1b', fontWeight: 'bold' }}>Confirm No-Show penalty?</span>
                          <button onClick={confirmNoShow} style={{ background: '#ef4444', color: 'white', padding: '0.3rem 0.7rem', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>Yes, Charge Penalty</button>
                          <button onClick={() => setNoShowPrompt(null)} style={{ background: '#e2e8f0', color: '#475569', padding: '0.3rem 0.7rem', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => handleNoShow(order.id)} style={{ background: '#ef4444', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                          Mark as No-Show (Penalty)
                        </button>
                      )}
                    </div>
                  )}

                  {/* Process Return */}
                  {order.status === 'ACTIVE' && returnForm.orderId !== order.id && (
                    <div style={{ marginTop: '1rem' }}>
                      <button onClick={() => setReturnForm({ orderId: order.id, damageFee: 0, fuelFee: 0, lateFee: 0, odometer: '', notes: '' })} style={{ background: '#8b5cf6', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Process Return
                      </button>
                    </div>
                  )}
                </>
              )}

              {returnForm.orderId === order.id && (
                <div style={{ background: '#f8fafc', padding: '1rem', marginTop: '1rem', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <h4>Process Return Inspection</h4>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Current Odometer</label>
                    <input type="number" value={returnForm.odometer} onChange={e => setReturnForm({...returnForm, odometer: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Damage Fee (ETB)</label>
                      <input type="number" value={returnForm.damageFee} onChange={e => setReturnForm({...returnForm, damageFee: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Fuel Fee (ETB)</label>
                      <input type="number" value={returnForm.fuelFee} onChange={e => setReturnForm({...returnForm, fuelFee: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Late Fee (ETB)</label>
                      <input type="number" value={returnForm.lateFee} onChange={e => setReturnForm({...returnForm, lateFee: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                    </div>
                  </div>

                  {/* Live Preview */}
                  {(() => {
                    const extraCharges = (parseFloat(returnForm.damageFee)||0) + (parseFloat(returnForm.fuelFee)||0) + (parseFloat(returnForm.lateFee)||0);
                    const deposit = parseFloat(order.securityDeposit) || 0;
                    const extensionOwed = parseFloat(order.additionalOwed) || 0;
                    const totalOwed = extraCharges + extensionOwed;
                    const netDue = Math.max(0, totalOwed - deposit);
                    const refund = totalOwed <= deposit ? deposit - totalOwed : 0;
                    return (
                      <div style={{ background: netDue > 0 ? '#fff7ed' : '#f0fdf4', border: `1px solid ${netDue > 0 ? '#fed7aa' : '#bbf7d0'}`, borderRadius: '6px', padding: '0.75rem', fontSize: '13px' }}>
                        <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#1e293b' }}>Settlement Preview:</p>
                        <p style={{ margin: '2px 0', color: '#64748b' }}>Extra Charges: <strong>{extraCharges.toLocaleString()} ETB</strong></p>
                        {extensionOwed > 0 && <p style={{ margin: '2px 0', color: '#64748b' }}>Extension Owed: <strong>{extensionOwed.toLocaleString()} ETB</strong></p>}
                        <p style={{ margin: '2px 0', color: '#64748b' }}>Security Deposit: <strong>({deposit.toLocaleString()} ETB)</strong></p>
                        <hr style={{ margin: '6px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />
                        {netDue > 0
                          ? <p style={{ margin: 0, fontWeight: 'bold', color: '#c2410c' }}>Customer Owes: {netDue.toLocaleString()} ETB</p>
                          : <p style={{ margin: 0, fontWeight: 'bold', color: '#15803d' }}>Refund to Customer: {refund.toLocaleString()} ETB</p>
                        }
                      </div>
                    );
                  })()}

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Inspection Notes</label>
                    <textarea value={returnForm.notes} onChange={e => setReturnForm({...returnForm, notes: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button onClick={submitProcessReturn} style={{ background: '#10b981', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Submit Return</button>
                    <button onClick={() => setReturnForm({ orderId: null, damageFee: 0, fuelFee: 0, lateFee: 0, odometer: '', notes: '' })} style={{ background: '#e2e8f0', color: '#475569', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              )}
              
              {order.managerNote && (
                <div className={styles.managerNoteDisplay}>
                  <strong>Manager Note:</strong> {order.managerNote}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RentalOrdersManager;
