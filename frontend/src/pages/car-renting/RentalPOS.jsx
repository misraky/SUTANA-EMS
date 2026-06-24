import React, { useState, useEffect } from 'react';
import axios from '../../services/apiClient';
import { Clock, CheckCircle, Search, RefreshCw, Car } from 'lucide-react';

const PAYMENT_METHODS = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Telebirr', label: 'Telebirr' },
  { value: 'Bank Transfer', label: 'Bank Transfer' },
  { value: 'Check', label: 'Check' }
];

const statusColors = {
  PENDING: '#F59E0B', APPROVED: '#3B82F6', ACTIVE: '#10B981',
  COMPLETED: '#059669', CANCELLED: '#EF4444', REJECTED: '#dc2626'
};

const RentalPOS = () => {
  const [activeTab, setActiveTab] = useState('approved');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => { fetchOrders(); }, [activeTab]);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = { limit: 50 };
      if (activeTab !== 'all') params.status = activeTab;
      const res = await axios.get('/rental-orders', { params });
      const data = res?.data || res.data || {};
      setOrders(data.orders || data || []);
    } catch (err) {
      showMsg('error', 'Failed to load rental orders');
    } finally {
      setLoading(false);
    }
  };

  const markActive = async (orderId, pMethod) => {
    if (!window.confirm(`Confirm pickup and payment (${pMethod}) for order #${orderId}?`)) return;
    try {
      setIsProcessing(true);
      await axios.put(`/rental-orders/${orderId}/status`, {
        status: 'ACTIVE',
        payment_method: pMethod,
        manager_note: `Payment received via ${pMethod}. Car picked up.`
      });
      showMsg('success', 'Order marked ACTIVE — car is now rented!');
      fetchOrders();
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Failed to update order');
    } finally {
      setIsProcessing(false);
    }
  };

  const processReturn = async (orderId) => {
    if (!window.confirm(`Process return for order #${orderId}?`)) return;
    try {
      setIsProcessing(true);
      await axios.post(`/rental-orders/${orderId}/process-return`, {
        actual_return_time: new Date().toISOString(),
        damage_fee: 0,
        fuel_fee: 0,
        late_fee: 0
      });
      showMsg('success', 'Return processed successfully!');
      fetchOrders();
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Failed to process return');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredOrders = orders.filter(o =>
    !search ||
    (o.order_number && o.order_number.toLowerCase().includes(search.toLowerCase())) ||
    (o.customer_name && o.customer_name.toLowerCase().includes(search.toLowerCase())) ||
    (o.customer_phone && o.customer_phone.includes(search))
  );

  const tabStyle = (tab) => ({
    flex: 1, padding: '10px', border: 'none', borderRadius: 6,
    background: activeTab === tab ? '#3b82f6' : '#e2e8f0',
    color: activeTab === tab ? '#fff' : '#475569',
    fontWeight: 600, cursor: 'pointer'
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 10, background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <button onClick={() => setActiveTab('approved')} style={tabStyle('approved')}>
          Approved (Awaiting Pickup)
        </button>
        <button onClick={() => setActiveTab('ACTIVE')} style={tabStyle('ACTIVE')}>
          Active Rentals
        </button>
        <button onClick={() => setActiveTab('all')} style={tabStyle('all')}>
          All Orders
        </button>
      </div>

      {message && (
        <div style={{ padding: '10px 16px', borderRadius: 8, background: message.type === 'error' ? '#fee2e2' : '#dcfce7', color: message.type === 'error' ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
          {message.text}
        </div>
      )}

      <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: '#1e293b', fontSize: 18, flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Car size={22} color="#3b82f6" />
            {activeTab === 'approved' ? 'Approved — Awaiting Pickup & Payment' : activeTab === 'ACTIVE' ? 'Active Rentals' : 'All Rental Orders'}
          </h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0 12px' }}>
              <Search size={14} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search order # or customer..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ border: 'none', outline: 'none', padding: '8px 10px', fontSize: 13, background: 'transparent', width: 200 }}
              />
            </div>
            <button onClick={fetchOrders} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', color: '#475569', fontSize: 13 }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <p style={{ color: '#64748b' }}>Loading rental orders...</p>
        ) : filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', background: '#f8fafc', borderRadius: 8 }}>
            No orders found for this filter.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {filteredOrders.map(order => (
              <div
                key={order.id}
                style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 20, background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>{order.order_number}</span>
                    <span style={{
                      background: (statusColors[order.status] || '#9CA3AF') + '20',
                      color: statusColors[order.status] || '#9CA3AF',
                      padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600
                    }}>{order.status}</span>
                  </div>
                  <div style={{ color: '#64748b', fontSize: 13, marginBottom: 4 }}>
                    Customer: <strong>{order.customer_name}</strong>
                    {order.customer_phone && ` | ${order.customer_phone}`}
                    {order.customer_email && ` | ${order.customer_email}`}
                  </div>
                  <div style={{ color: '#475569', fontSize: 13, marginBottom: 4 }}>
                    Pickup: {order.pickup_date ? new Date(order.pickup_date).toLocaleDateString() : 'N/A'} &rarr;{' '}
                    Return: {order.return_date ? new Date(order.return_date).toLocaleDateString() : 'N/A'}
                    &nbsp;({order.total_days} days)
                  </div>
                  {order.driver_name && (
                    <div style={{ fontSize: 12, color: '#64748b' }}>Driver: {order.driver_name} | License: {order.driver_license}</div>
                  )}
                  {order.special_requests && (
                    <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', marginTop: 4 }}>Note: {order.special_requests}</div>
                  )}
                </div>

                <div style={{ textAlign: 'right', minWidth: 200 }}>
                  <div style={{ marginBottom: 4 }}>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Daily Rate</div>
                    <div style={{ fontWeight: 600 }}>{parseFloat(order.daily_rate || 0).toLocaleString()} ETB/day</div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
                    Total: {parseFloat(order.total_amount || order.rental_amount || 0).toLocaleString()} ETB
                  </div>

                  {order.status === 'APPROVED' && (
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <select
                        id={`rp-${order.id}`}
                        defaultValue="Cash"
                        style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13 }}
                      >
                        {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                      <button
                        onClick={() => markActive(order.id, document.getElementById(`rp-${order.id}`).value)}
                        disabled={isProcessing}
                        style={{ padding: '6px 14px', background: '#10b981', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}
                      >
                        Confirm Pickup & Pay
                      </button>
                    </div>
                  )}

                  {order.status === 'ACTIVE' && (
                    <button
                      onClick={() => processReturn(order.id)}
                      disabled={isProcessing}
                      style={{ padding: '6px 14px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}
                    >
                      Process Return
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RentalPOS;
