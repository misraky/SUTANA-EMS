import React, { useState, useEffect } from 'react';
import axios from '../../services/apiClient';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, Search, RefreshCw, Printer } from 'lucide-react';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'telebirr', label: 'Telebirr' },
  { value: 'bank_transfer', label: 'Bank Transfer' }
];

const statusColors = {
  received: '#9CA3AF', in_progress: '#3B82F6', quality_check: '#F59E0B',
  ready: '#10B981', delivered: '#059669', cancelled: '#EF4444'
};

const PrintingPOS = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ready');
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
      const res = await axios.get('/printing/orders', { params });
      if (res?.status === 'success' || res.status === 'success') {
        setOrders(res?.data?.orders || res.data?.orders || []);
      }
    } catch (err) {
      showMsg('error', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const markDelivered = async (orderId, pMethod) => {
    if (!window.confirm(`Mark order #${orderId} as Delivered with ${pMethod} payment?`)) return;
    try {
      setIsProcessing(true);
      await axios.put(`/printing/orders/${orderId}/status`, {
        status: 'delivered',
        notes: `Payment received via ${pMethod}. Delivered by worker.`
      });
      showMsg('success', `Order #${orderId} marked as Delivered!`);
      fetchOrders();
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Failed to mark delivered');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredOrders = orders.filter(o =>
    !search ||
    (o.order_number && o.order_number.toLowerCase().includes(search.toLowerCase())) ||
    (o.customer_name && o.customer_name.toLowerCase().includes(search.toLowerCase()))
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
        <button onClick={() => setActiveTab('ready')} style={tabStyle('ready')}>
          Ready for Pickup / Payment
        </button>
        <button onClick={() => setActiveTab('in_progress')} style={tabStyle('in_progress')}>
          In Production
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
          <h2 style={{ margin: 0, color: '#1e293b', fontSize: 18, flex: 1 }}>
            {activeTab === 'ready' ? '✅ Ready for Delivery' : activeTab === 'in_progress' ? '🔄 In Production' : '📋 All Orders'}
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
            <button
              onClick={() => navigate('/printing-worker/create-order')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#3b82f6', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', color: 'white', fontWeight: 600, fontSize: 13 }}
            >
              <Printer size={14} /> New Order
            </button>
          </div>
        </div>

        {loading ? (
          <p style={{ color: '#64748b' }}>Loading orders...</p>
        ) : filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', background: '#f8fafc', borderRadius: 8 }}>
            No orders found.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {filteredOrders.map(order => (
              <div
                key={order.id}
                style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>{order.order_number}</span>
                    <span style={{
                      background: (statusColors[order.status_code] || '#9CA3AF') + '20',
                      color: statusColors[order.status_code] || '#9CA3AF',
                      padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600
                    }}>{order.status_name || order.status_code}</span>
                  </div>
                  <div style={{ color: '#64748b', fontSize: 13, marginBottom: 4 }}>
                    Customer: <strong>{order.customer_name || 'Walk-in'}</strong>
                    {order.customer_phone && ` | ${order.customer_phone}`}
                  </div>
                  <div style={{ color: '#475569', fontSize: 13 }}>
                    {order.product_type} &mdash; {order.quantity} copies &times; {order.pages_per_copy} pages &mdash;{' '}
                    {order.paper_type} {order.color_printing ? '(Color)' : '(B&W)'}
                    {order.binding_type && order.binding_type !== 'None' && ` | Binding: ${order.binding_type}`}
                  </div>
                  {order.due_date && (
                    <div style={{ fontSize: 12, marginTop: 4, color: new Date(order.due_date) < new Date() ? '#dc2626' : '#10b981' }}>
                      Due: {new Date(order.due_date).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
                    {parseFloat(order.total_price).toLocaleString()} ETB
                  </div>

                  {(order.status_code === 'ready' || order.status_name?.toLowerCase() === 'ready') ? (
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <select
                        id={`pmethod-${order.id}`}
                        defaultValue="cash"
                        style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13 }}
                      >
                        {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                      <button
                        onClick={() => {
                          const pMethod = document.getElementById(`pmethod-${order.id}`).value;
                          markDelivered(order.id, pMethod);
                        }}
                        disabled={isProcessing}
                        style={{ padding: '6px 14px', background: '#10b981', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}
                      >
                        Mark Delivered & Paid
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => navigate(`/printing-worker/orders/${order.id}`)}
                      style={{ padding: '6px 14px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                    >
                      View Details
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

export default PrintingPOS;
