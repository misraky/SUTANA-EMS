import React, { useState, useEffect } from 'react';
import axios from '../../services/apiClient';
import { Package, Clock, CheckCircle, XCircle, Truck, Search } from 'lucide-react';

const STATUS_ICONS = {
  PROCESSING: <Clock size={20} color="#f59e0b" />,
  SHIPPED: <Truck size={20} color="#3b82f6" />,
  DELIVERED: <CheckCircle size={20} color="#10b981" />,
  CANCELLED: <XCircle size={20} color="#ef4444" />,
};
const STATUS_LABELS = {
  PROCESSING: 'Processing', SHIPPED: 'Shipped', DELIVERED: 'Delivered', CANCELLED: 'Cancelled', AWAITING_PAYMENT: 'Awaiting Payment', AWAITING_PICKUP: 'Awaiting Pickup',
};

export default () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/retail/orders/my-orders');
        if (res.status === 'success') setOrders(res.data);
      } catch (err) { setError(err.response?.data?.message || 'Failed to load orders'); }
      finally { setLoading(false); }
    };
    fetchOrders();
  }, []);

  const filtered = orders.filter(o => !search || o.invoice_number?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}><Package size={40} style={{ marginBottom: 12 }} /><p>Loading your orders...</p></div>;
  if (error) return <div style={{ textAlign: 'center', padding: '3rem', color: '#dc2626' }}><XCircle size={40} style={{ marginBottom: 12 }} /><p>{error}</p></div>;

  return (
    <div>
      <h2 style={{ margin: '0 0 1rem' }}>My Retail Orders</h2>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', flex: 1, maxWidth: 400 }}>
          <Search size={18} color="#94a3b8" />
          <input type="text" placeholder="Search by invoice number..." value={search} onChange={e => setSearch(e.target.value)} style={{ border: 'none', outline: 'none', flex: 1, fontSize: 13 }} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', background: 'white', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <Package size={48} style={{ marginBottom: 12, color: '#d1d5db' }} />
          <p>No retail orders yet. Visit the store to place an order!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(order => (
            <div key={order.id} style={{ background: 'white', borderRadius: 12, padding: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {STATUS_ICONS[order.status] || <Package size={20} color="#64748b" />}
                  <div>
                    <strong>#{order.invoice_number}</strong>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{new Date(order.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <span style={{
                  padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  background: order.status === 'DELIVERED' ? '#f0fdf4' : order.status === 'CANCELLED' ? '#fef2f2' : '#fffbeb',
                  color: order.status === 'DELIVERED' ? '#059669' : order.status === 'CANCELLED' ? '#dc2626' : '#d97706'
                }}>
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>

              {order.items && order.items.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  {order.items.map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderTop: '1px solid #f1f5f9', fontSize: 13 }}>
                      {item.product_image && <img src={item.product_image} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />}
                      <span style={{ flex: 1 }}>{item.product_name}</span>
                      <span style={{ color: '#64748b' }}>&times;{item.quantity}</span>
                      <span style={{ fontWeight: 600 }}>{parseFloat(item.subtotal).toFixed(2)} ETB</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: 10, fontSize: 13, color: '#64748b' }}>
                <span>Status: <strong>{order.payment_status}</strong></span>
                <span>Total: <strong style={{ color: '#059669', fontSize: 16 }}>{parseFloat(order.total_amount).toFixed(2)} ETB</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
