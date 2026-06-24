import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, Mail, AlertTriangle, Car } from 'lucide-react';
import carService from '../../services/carService';
import OrdersLayout from '../../components/orders/OrdersLayout';
import OrderCard from '../../components/orders/OrderCard';

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
  const [noShowPrompt, setNoShowPrompt] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);

  const tabs = [
    { id: 'ALL', label: 'All', count: orders.length, badgeColor: 'progress' },
    { id: 'PENDING_APPROVAL', label: 'Pending' },
    { id: 'APPROVED', label: 'Approved' },
    { id: 'CONFIRMED', label: 'Confirmed' },
    { id: 'ACTIVE', label: 'Active' },
    { id: 'COMPLETED', label: 'Completed' },
    { id: 'REJECTED', label: 'Rejected' },
    { id: 'CANCELLED', label: 'Cancelled' }
  ];

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

  const handleToggleSelect = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedOrders(filteredOrders.map(o => o.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleDeleteSelected = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedOrders.length} rental orders?`)) {
      setOrders(orders.filter(o => !selectedOrders.includes(o.id)));
      setSelectedOrders([]);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {notification.show && (
        <div style={{ position: 'absolute', top: 10, right: 20, zIndex: 1000, padding: '1rem', background: notification.type === 'error' ? '#fee2e2' : '#dcfce7', color: notification.type === 'error' ? '#991b1b' : '#166534', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          {notification.message}
        </div>
      )}
      
      <OrdersLayout
        title="Rental Orders Management"
        tabs={tabs}
        activeTab={filter}
        onTabChange={setFilter}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onCreateOrder={() => {}}
        onExport={() => console.log('Exporting rental orders...')}
        loading={loading}
        empty={orders.length === 0}
        emptyMessage="No rental orders match your criteria."
        selectedCount={selectedOrders.length}
        totalCount={filteredOrders.length}
        onSelectAll={handleSelectAll}
        onDeleteSelected={handleDeleteSelected}
        onPrintSelected={() => window.print()}
        onUpdateSelected={() => console.log('Update selected', selectedOrders)}
        onDownloadSelected={() => console.log('Download selected', selectedOrders)}
      >
        {filteredOrders.length > 0 ? filteredOrders.map(order => (
          <OrderCard
            key={order.id}
            orderId={order.orderNumber}
            isSelected={selectedOrders.includes(order.id)}
            onSelect={() => handleToggleSelect(order.id)}
            status={order.status}
            statusLabel={order.status.replace('_', ' ')}
            amount={`ETB ${Number(order.totalAmount).toLocaleString()}`}
            date={new Date(order.createdAt).toLocaleDateString()}
            referenceLabel="Customer"
            referenceNo={order.customerName}
            providerLogo="Rental Fleet"
            actionOptions={[
              { value: order.status, label: order.status.replace('_', ' ') }
            ]}
            currentAction={order.status}
            items={[
              {
                name: order.carName,
                sku: `Driver: ${order.driverName}`,
                quantity: `${order.totalDays} days`,
                image: getImageUrl(order.carImage),
                meta: [
                  { label: 'Pickup', value: new Date(order.pickupDate).toLocaleDateString() },
                  { label: 'Return', value: new Date(order.returnDate).toLocaleDateString() },
                  { label: 'Payment', value: order.paymentMethod }
                ]
              }
            ]}
            extraContent={{
              body: (
                <div style={{ marginTop: '1rem' }}>
                  {order.status === 'APPROVED' && order.paymentStatus === 'UNPAID' && order.financeNotes && (
                    <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '1rem', borderRadius: '6px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertTriangle size={18} color="#dc2626" />
                      <p style={{ margin: 0, fontSize: '0.9rem' }}>
                        <strong>Payment Rejected by Finance:</strong> {order.financeNotes} <br/>
                        <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>(Awaiting customer to re-upload proof)</span>
                      </p>
                    </div>
                  )}

                  {/* Financials Summary */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '6px', fontSize: '0.875rem' }}>
                    <div>
                      <p style={{ margin: '0 0 0.25rem 0' }}><strong>Rent:</strong> ETB {Number(order.rentalAmount).toLocaleString()}</p>
                      <p style={{ margin: '0 0 0.25rem 0' }}><strong>Deposit:</strong> ETB {Number(order.securityDeposit).toLocaleString()}</p>
                      {Number(order.extensionFee) > 0 && <p style={{ margin: '0 0 0.25rem 0' }}><strong>Extension Fee:</strong> ETB {Number(order.extensionFee).toLocaleString()}</p>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {Number(order.additionalOwed) > 0 && <p style={{ margin: '0 0 0.25rem 0', color: '#c2410c', fontWeight: 'bold' }}>⚠️ Owed: ETB {Number(order.additionalOwed).toLocaleString()}</p>}
                      {Number(order.refundAmount) > 0 && <p style={{ margin: '0 0 0.25rem 0', color: '#15803d', fontWeight: 'bold' }}>💚 Refund: ETB {Number(order.refundAmount).toLocaleString()}</p>}
                    </div>
                  </div>

                  {/* Pickup Remarks Section */}
                  {(order.status === 'CONFIRMED' || order.status === 'ACTIVE' || order.status === 'COMPLETED') && (
                    <div style={{ background: 'white', padding: '1rem', marginTop: '1rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Car size={16} /> Pickup Condition Remarks
                      </h4>
                      {editingRemarks.orderId === order.id ? (
                        <div>
                          <textarea 
                            value={editingRemarks.text} 
                            onChange={(e) => setEditingRemarks({...editingRemarks, text: e.target.value})}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', marginBottom: '0.5rem' }}
                            rows="3"
                            placeholder="Note any scratches, condition issues..."
                          />
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => handleSaveRemarks(order.id)} style={{ background: '#10b981', color: 'white', padding: '0.4rem 0.8rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
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
                              {order.pickupRemarks ? 'Edit Remarks' : 'Add Pickup Remarks'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pending Requests & Return Forms */}
                  {order.isCancellationRequested && (
                    <div style={{ background: '#fef2f2', padding: '1rem', marginTop: '1rem', borderRadius: '6px' }}>
                      <p style={{ margin: '0 0 0.5rem 0' }}><strong>Cancellation Request:</strong> {order.cancellationReason}</p>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleApproveCancellation(order.id, true)} style={{ background: '#ef4444', color: 'white', padding: '0.4rem 0.8rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Approve</button>
                        <button onClick={() => handleApproveCancellation(order.id, false)} style={{ background: '#e2e8f0', color: '#1e293b', padding: '0.4rem 0.8rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Reject</button>
                      </div>
                    </div>
                  )}

                  {order.pendingExtensionDays && (
                    <div style={{ background: '#fef9c3', padding: '1rem', marginTop: '1rem', borderRadius: '6px' }}>
                      <p style={{ margin: '0 0 0.5rem 0' }}><strong>Extension Request:</strong> Customer requested {order.pendingExtensionDays} extra days.</p>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleApproveExtension(order.id, order.pendingExtensionDays, true)} style={{ background: '#10b981', color: 'white', padding: '0.4rem 0.8rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Approve</button>
                        <button onClick={() => handleApproveExtension(order.id, order.pendingExtensionDays, false)} style={{ background: '#ef4444', color: 'white', padding: '0.4rem 0.8rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Reject</button>
                      </div>
                    </div>
                  )}

                  {returnForm.orderId === order.id && (
                    <div style={{ background: '#f8fafc', padding: '1rem', marginTop: '1rem', border: '1px solid #cbd5e1', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <h4>Process Return</h4>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Current Odometer</label>
                        <input type="number" value={returnForm.odometer} onChange={e => setReturnForm({...returnForm, odometer: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Damage Fee</label><input type="number" value={returnForm.damageFee} onChange={e => setReturnForm({...returnForm, damageFee: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></div>
                        <div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Fuel Fee</label><input type="number" value={returnForm.fuelFee} onChange={e => setReturnForm({...returnForm, fuelFee: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></div>
                        <div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Late Fee</label><input type="number" value={returnForm.lateFee} onChange={e => setReturnForm({...returnForm, lateFee: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></div>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Notes</label>
                        <textarea value={returnForm.notes} onChange={e => setReturnForm({...returnForm, notes: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button onClick={submitProcessReturn} style={{ background: '#10b981', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Submit</button>
                        <button onClick={() => setReturnForm({ orderId: null, damageFee: 0, fuelFee: 0, lateFee: 0, odometer: '', notes: '' })} style={{ background: '#e2e8f0', color: '#475569', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                      </div>
                    </div>
                  )}
                  
                  {actionPrompt.orderId === order.id && (
                    <div style={{ background: '#eff6ff', padding: '1rem', marginTop: '1rem', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                      {actionPrompt.action === 'REJECTED' ? (
                        <>
                          <p style={{ margin: '0 0 0.5rem 0' }}>Reason for rejection:</p>
                          <input type="text" value={actionPrompt.note} onChange={(e) => setActionPrompt({...actionPrompt, note: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', marginBottom: '0.5rem' }} />
                        </>
                      ) : (
                        <p style={{ margin: '0 0 0.5rem 0' }}>Confirm approval?</p>
                      )}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => confirmAction(order.id, actionPrompt.action, actionPrompt.note)} style={{ background: '#3b82f6', color: 'white', padding: '0.4rem 0.8rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Confirm</button>
                        <button onClick={() => setActionPrompt({ orderId: null, action: null, note: '' })} style={{ background: 'white', border: '1px solid #cbd5e1', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              ),
              actions: (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {order.status === 'PENDING_APPROVAL' && actionPrompt.orderId !== order.id && (
                    <>
                      <button onClick={() => handleUpdateClick(order.id, 'APPROVED')} style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle2 size={14}/> Approve</button>
                      <button onClick={() => handleUpdateClick(order.id, 'REJECTED')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><XCircle size={14}/> Reject</button>
                      <button onClick={() => handleContactCustomer(order)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Mail size={14}/> Contact</button>
                    </>
                  )}
                  {order.status === 'CONFIRMED' && (
                    <>
                      <button onClick={() => handleStartRental(order.id)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Start Rental</button>
                      {noShowPrompt === order.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fef2f2', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                          <span style={{ fontSize: '0.8rem', color: '#991b1b' }}>Penalty?</span>
                          <button onClick={confirmNoShow} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}>Yes</button>
                          <button onClick={() => setNoShowPrompt(null)} style={{ background: 'white', border: '1px solid #cbd5e1', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}>No</button>
                        </div>
                      ) : (
                        <button onClick={() => handleNoShow(order.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>Mark No-Show</button>
                      )}
                    </>
                  )}
                  {order.status === 'ACTIVE' && returnForm.orderId !== order.id && (
                    <button onClick={() => setReturnForm({ orderId: order.id, damageFee: 0, fuelFee: 0, lateFee: 0, odometer: '', notes: '' })} style={{ background: '#8b5cf6', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                      Process Return
                    </button>
                  )}
                </div>
              )
            }}
          />
        )) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
            No orders match your search or filter.
          </div>
        )}
      </OrdersLayout>
    </div>
  );
};

export default RentalOrdersManager;
