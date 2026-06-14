import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../services/apiClient';
import { ArrowLeft, Clock, User, FileText, Package, Download, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_FLOW = ['received', 'in_progress', 'quality_check', 'ready', 'delivered'];

const statusBadge = (code) => {
  const colors = { received: '#9CA3AF', in_progress: '#3B82F6', quality_check: '#F59E0B', ready: '#10B981', delivered: '#059669', cancelled: '#EF4444' };
  return { background: (colors[code] || '#6B7280') + '20', color: colors[code] || '#6B7280' };
};

const PrintingOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [orderRes, histRes] = await Promise.all([
        axios.get(`/printing/orders/${id}`),
        axios.get(`/printing/orders/${id}/history`)
      ]);
      if (orderRes.status === 'success') setOrder(orderRes.data?.order);
      if (histRes.status === 'success') setHistory(histRes.data?.history || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const updateStatus = async (status) => {
    if (!window.confirm(`Move order to "${status.replace(/_/g, ' ')}"?`)) return;
    setUpdating(true);
    try {
      const res = await axios.put(`/printing/orders/${id}/status`, { status });
      if (res.status === 'success') load();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', color: '#64748b' }}>Loading order...</div>;
  if (!order) return <div style={{ padding: '2rem', color: '#ef4444' }}>Order not found.</div>;

  const statusIdx = STATUS_FLOW.indexOf(order.status_code);
  const isDelivered = order.status_code === 'delivered';
  const isCancelled = order.status_code === 'cancelled';

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      <button onClick={() => navigate('/printing/orders')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 13, marginBottom: '1rem', padding: 0 }}>
        <ArrowLeft size={16} /> Back to Orders
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b', fontSize: 22 }}>{order.order_number}</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
            Created {new Date(order.created_at).toLocaleString()}
          </p>
        </div>
        <span style={{ ...statusBadge(order.status_code), padding: '5px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
          {order.status_name}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'white', borderRadius: 10, padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h4 style={{ margin: '0 0 0.75rem', fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Customer</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <User size={14} color="#64748b" />
            <span style={{ fontSize: 14, fontWeight: 600 }}>{order.customer_name || 'Walk-in Customer'}</span>
          </div>
          {order.customer_phone && <div style={{ fontSize: 13, color: '#475569', marginLeft: 22 }}>{order.customer_phone}</div>}
        </div>
        <div style={{ background: 'white', borderRadius: 10, padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h4 style={{ margin: '0 0 0.75rem', fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Order Info</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: 13 }}>
            <div><span style={{ color: '#94a3b8' }}>Product:</span> <span style={{ fontWeight: 600 }}>{order.product_type}</span></div>
            <div><span style={{ color: '#94a3b8' }}>Paper:</span> <span style={{ fontWeight: 600 }}>{order.paper_type}</span></div>
            <div><span style={{ color: '#94a3b8' }}>Pages:</span> <span style={{ fontWeight: 600 }}>{order.pages_per_copy}</span></div>
            <div><span style={{ color: '#94a3b8' }}>Qty:</span> <span style={{ fontWeight: 600 }}>{order.quantity}</span></div>
            <div><span style={{ color: '#94a3b8' }}>Binding:</span> <span style={{ fontWeight: 600 }}>{order.binding_type || 'None'}</span></div>
            <div><span style={{ color: '#94a3b8' }}>Color:</span> <span style={{ fontWeight: 600 }}>{order.color_printing ? 'Yes (×2)' : 'No'}</span></div>
            <div><span style={{ color: '#94a3b8' }}>Due:</span> <span style={{ fontWeight: 600 }}>{order.due_date ? new Date(order.due_date).toLocaleDateString() : '-'}</span></div>
            <div><span style={{ color: '#94a3b8' }}>Created by:</span> <span style={{ fontWeight: 600 }}>{order.created_by_name || '-'}</span></div>
          </div>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 10, padding: '1.25rem', marginBottom: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <h4 style={{ margin: '0 0 0.75rem', fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Pricing</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem' }}>
          <div><span style={{ fontSize: 12, color: '#64748b' }}>Price/Unit</span><div style={{ fontSize: 16, fontWeight: 700 }}>{parseFloat(order.price_per_unit || 0).toFixed(2)} ETB</div></div>
          <div><span style={{ fontSize: 12, color: '#64748b' }}>Binding Cost</span><div style={{ fontSize: 16, fontWeight: 700 }}>{parseFloat(order.binding_cost || 0).toFixed(2)} ETB</div></div>
          <div><span style={{ fontSize: 12, color: '#64748b' }}>Total</span><div style={{ fontSize: 20, fontWeight: 700, color: '#059669' }}>{parseFloat(order.total_price || 0).toLocaleString()} ETB</div></div>
        </div>
      </div>

      {!isDelivered && !isCancelled && (
        <div style={{ background: 'white', borderRadius: 10, padding: '1.25rem', marginBottom: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h4 style={{ margin: '0 0 0.75rem', fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Status Progress</h4>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {STATUS_FLOW.map((s, i) => {
              const done = i <= statusIdx;
              const isNext = i === statusIdx + 1;
              return (
                <button key={s} onClick={() => isNext && updateStatus(s)} disabled={!isNext || updating}
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600,
                    background: done ? '#059669' : isNext ? '#3b82f6' : '#f1f5f9',
                    color: done || isNext ? 'white' : '#94a3b8',
                    cursor: isNext && !updating ? 'pointer' : 'default',
                    opacity: isNext && updating ? 0.6 : 1
                  }}>
                  {s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {order.special_instructions && (
        <div style={{ background: '#fffbeb', borderRadius: 10, padding: '1rem', marginBottom: '1.5rem', border: '1px solid #fde68a' }}>
          <h4 style={{ margin: '0 0 0.5rem', fontSize: 12, color: '#92400e', textTransform: 'uppercase', letterSpacing: 1 }}>Special Instructions</h4>
          <p style={{ margin: 0, fontSize: 13, color: '#78350f' }}>{order.special_instructions}</p>
        </div>
      )}

      <button onClick={() => setShowHistory(!showHistory)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 13, padding: 0 }}>
        <Clock size={14} /> Status History {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {showHistory && (
        <div style={{ marginTop: '0.75rem', background: 'white', borderRadius: 10, padding: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          {history.length === 0 ? (
            <p style={{ fontSize: 13, color: '#94a3b8' }}>No history recorded.</p>
          ) : (
            history.map(h => (
              <div key={h.id || h.created_at} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                <div style={{ minWidth: 120, color: '#94a3b8' }}>{new Date(h.created_at || h.changed_at).toLocaleString()}</div>
                <div style={{ fontWeight: 600 }}>{h.status_name || h.status_code}</div>
                <div style={{ color: '#64748b' }}>{h.changed_by_name || '-'}</div>
                {h.notes && <div style={{ color: '#94a3b8' }}>- {h.notes}</div>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default PrintingOrderDetail;
