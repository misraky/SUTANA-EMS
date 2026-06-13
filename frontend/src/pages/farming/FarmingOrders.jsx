import React, { useState, useEffect } from 'react';
import axios from '../../services/apiClient';
import { Package, Plus, Edit2, TrendingUp, X, Check, RefreshCw } from 'lucide-react';

const STATUS_COLORS = {
  AWAITING_PAYMENT: { bg: '#fef3c7', color: '#92400e' },
  CONFIRMED:        { bg: '#dbeafe', color: '#1e40af' },
  PROCESSING:       { bg: '#ede9fe', color: '#6d28d9' },
  READY_FOR_PICKUP: { bg: '#d1fae5', color: '#065f46' },
  OUT_FOR_DELIVERY: { bg: '#cffafe', color: '#155e75' },
  DELIVERED:        { bg: '#dcfce7', color: '#166534' },
  COMPLETED:        { bg: '#f0fdf4', color: '#166534' },
  CANCELLED:        { bg: '#fee2e2', color: '#991b1b' }
};

const NEXT_STATUSES = {
  AWAITING_PAYMENT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED:        ['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'CANCELLED'],
  PROCESSING:       ['CONFIRMED', 'CANCELLED'],
  READY_FOR_PICKUP: ['COMPLETED', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED:        ['COMPLETED'],
  COMPLETED:        [],
  CANCELLED:        []
};

const PAYMENT_METHODS = ['cash', 'telebirr', 'bank_transfer'];

const FarmingOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [updating, setUpdating] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);
      const res = await axios.get(`/farming/admin/orders?${params}`);
      if (res.status === 'success') setOrders(res.data.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter, search]);

  const handleStatusUpdate = async (orderId, newStatus, payment_method) => {
    setUpdating(orderId);
    try {
      await axios.patch(`/farming/admin/orders/${orderId}/status`, { status: newStatus, payment_method });
      await load();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>📦 Online Farming Orders</h2>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by invoice or customer..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '9px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '9px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#475569' }}
        >
          <option value="">All Statuses</option>
          {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {loading ? <p style={{ color: '#64748b' }}>Loading orders...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orders.length === 0 && <p style={{ color: '#94a3b8', textAlign: 'center', padding: '3rem' }}>No orders found.</p>}
          {orders.map(order => {
            const style = STATUS_COLORS[order.status] || { bg: '#f1f5f9', color: '#334155' };
            const nextSteps = NEXT_STATUSES[order.status] || [];
            const isExpanded = expanded === order.id;

            return (
              <div key={order.id} style={{ background: 'white', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                <div
                  onClick={() => setExpanded(isExpanded ? null : order.id)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', cursor: 'pointer', gap: 12 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, flexWrap: 'wrap' }}>
                    <strong style={{ fontFamily: 'monospace', fontSize: 13, color: '#1e293b' }}>{order.invoice_number}</strong>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{order.customer_name || 'Walk-in'}</span>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{order.delivery_type === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <strong style={{ color: '#10b981' }}>{parseFloat(order.total_amount).toFixed(2)} ETB</strong>
                    <span style={{ background: style.bg, color: style.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(order.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: '0 18px 18px', borderTop: '1px solid #f1f5f9' }}>
                    {/* Items */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', margin: '12px 0', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569' }}>Product</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right', color: '#475569' }}>Qty</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right', color: '#475569' }}>Unit Price</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right', color: '#475569' }}>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items?.map(item => (
                          <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '8px 12px' }}>{item.product_name}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>{item.quantity}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>{parseFloat(item.unit_price).toFixed(2)} ETB</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>{parseFloat(item.subtotal).toFixed(2)} ETB</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {order.delivery_address && (
                      <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0' }}>📍 {order.delivery_address}</p>
                    )}

                    {/* Actions */}
                    {nextSteps.length > 0 && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>Move to:</span>
                        {nextSteps.map(ns => (
                          <button
                            key={ns}
                            disabled={updating === order.id}
                            onClick={() => handleStatusUpdate(order.id, ns, ns === 'CONFIRMED' ? order.payment_method : undefined)}
                            style={{
                              padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                              background: ns === 'CANCELLED' ? '#fee2e2' : '#dbeafe',
                              color: ns === 'CANCELLED' ? '#991b1b' : '#1e40af'
                            }}
                          >
                            {updating === order.id ? '...' : ns.replace(/_/g, ' ')}
                          </button>
                        ))}
                        {order.status === 'AWAITING_PAYMENT' && (
                          <select
                            defaultValue={order.payment_method}
                            onChange={e => {}}
                            style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '5px 8px', fontSize: 12 }}
                          >
                            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FarmingOrders;
