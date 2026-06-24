import React, { useState, useEffect } from 'react';
import axios from '../../services/apiClient';
import { ShoppingCart, Package, CheckCircle, AlertCircle, ArrowLeft, Clock, XCircle, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const statusColors = {
  PENDING_STORE: { bg: '#fffbeb', text: '#d97706', label: 'Pending Store' },
  FORWARDED_TO_CEO: { bg: '#fef2f2', text: '#dc2626', label: 'With CEO' },
  APPROVED: { bg: '#f0fdf4', text: '#16a34a', label: 'Approved' },
  REJECTED: { bg: '#fef2f2', text: '#dc2626', label: 'Rejected' },
  SHIPPED: { bg: '#eff6ff', text: '#2563eb', label: 'Shipped' },
  RECEIVED: { bg: '#f0fdf4', text: '#16a34a', label: 'Received' },
};

export default function FarmingStoreRequest() {
  const nav = useNavigate();
  const [products, setProducts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [tab, setTab] = useState('list');
  const [items, setItems] = useState([{ product_id: '', qty: '' }]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [detail, setDetail] = useState(null);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    axios.get('/farming/admin/products?include_inactive=false')
      .then(r => setProducts((r.data || r)?.filter(p => p.is_active !== false) || []))
      .catch(() => {});
    loadRequests();
  }, []);

  const loadRequests = () => {
    axios.get('/farming/store-requests')
      .then(r => setRequests((r.data || r) || []))
      .catch(() => {});
  };

  const loadDetail = async (id) => {
    try {
      const r = await axios.get(`/farming/store-requests/${id}`);
      setDetail(r.data);
    } catch (e) { setErr(e.response?.data?.message || e.message); setTimeout(() => setErr(null), 4000); }
  };

  const addItem = () => setItems([...items, { product_id: '', qty: '' }]);
  const rmItem = (i) => { if (items.length > 1) setItems(items.filter((_, idx) => idx !== i)); };
  const setItem = (i, f, v) => { const n = [...items]; n[i][f] = v; setItems(n); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const valid = items.filter(i => i.product_id && i.qty);
    if (!valid.length) { setErr('Add at least one product with quantity'); return; }
    setSubmitting(true); setErr(null); setMsg(null);
    try {
      await axios.post('/farming/store-requests', {
        items: valid.map(i => ({ product_id: parseInt(i.product_id), quantity_requested: parseInt(i.qty) })),
        notes
      });
      setMsg('Request submitted to Store');
      setTimeout(() => setMsg(null), 4000);
      setItems([{ product_id: '', qty: '' }]); setNotes(''); setTab('list');
      loadRequests();
    } catch (e) { setErr(e.response?.data?.message || e.message); setTimeout(() => setErr(null), 4000); }
    finally { setSubmitting(false); }
  };

  const confirmReceived = async (id) => {
    try {
      await axios.patch(`/farming/store-requests/${id}/status`, { status: 'RECEIVED' });
      setConfirm(null); setDetail(null);
      setMsg('Receipt confirmed successfully');
      loadRequests();
      setTimeout(() => setMsg(null), 4000);
    } catch (e) { setErr(e.response?.data?.message || e.message); setTimeout(() => setErr(null), 4000); }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><ArrowLeft size={18} /></button>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ShoppingCart size={18} color="#166534" /> Product Request from Store
        </h2>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setTab('list')} style={{ padding: '8px 16px', borderRadius: 8, border: tab === 'list' ? '2px solid #166534' : '1px solid #e2e8f0', background: tab === 'list' ? '#f0fdf4' : '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>My Requests</button>
        <button onClick={() => { setTab('new'); setErr(null); setMsg(null); }} style={{ padding: '8px 16px', borderRadius: 8, border: tab === 'new' ? '2px solid #166534' : '1px solid #e2e8f0', background: tab === 'new' ? '#f0fdf4' : '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>+ New Request</button>
        <button onClick={loadRequests} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 12, marginLeft: 'auto' }}>Refresh</button>
      </div>

      {msg && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 20px', color: '#16a34a', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 9999, maxWidth: 360, animation: 'fadeIn 0.2s ease' }}>
          <CheckCircle size={18} />
          <span style={{ flex: 1 }}>{msg}</span>
          <button onClick={() => setMsg(null)} style={{ background: 'none', border: 'none', color: '#16a34a', cursor: 'pointer', padding: 2, marginLeft: 8, fontSize: 16, lineHeight: 1 }}>×</button>
        </div>
      )}
      {err && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '14px 20px', color: '#dc2626', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 9999, maxWidth: 360, animation: 'fadeIn 0.2s ease' }}>
          <AlertCircle size={18} />
          <span style={{ flex: 1 }}>{err}</span>
          <button onClick={() => setErr(null)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 2, marginLeft: 8, fontSize: 16, lineHeight: 1 }}>×</button>
        </div>
      )}

      {tab === 'new' && (
        <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Request Products from Store</h3>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
              <select value={item.product_id} onChange={e => setItem(i, 'product_id', e.target.value)} style={{ flex: 1, padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
                <option value="">Select product</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock_quantity||0})</option>)}
              </select>
              <input type="number" min="1" placeholder="Qty" value={item.qty} onChange={e => setItem(i, 'qty', e.target.value)} style={{ width: 90, padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }} />
              {items.length > 1 && <button type="button" onClick={() => rmItem(i)} style={{ background: '#fef2f2', border: 'none', color: '#dc2626', borderRadius: 6, padding: '8px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>X</button>}
            </div>
          ))}
          <button type="button" onClick={addItem} style={{ background: 'none', border: '1px dashed #cbd5e1', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13, color: '#64748b', marginBottom: 16 }}>+ Add Item</button>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }} />
          </div>
          <button type="submit" disabled={submitting} style={{ padding: '12px 28px', background: '#166534', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}>
            {submitting ? 'Submitting...' : 'Send Request to Store'}
          </button>
        </form>
      )}

      {tab === 'list' && (
        <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>#</th>
                <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>Request #</th>
                <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>Date</th>
                <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>Items</th>
                <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>Status</th>
                <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '10px 12px', color: '#94a3b8', textAlign: 'center', padding: 30 }}>No requests found.</td></tr>
              ) : (
                requests.map((r, i) => {
                  const sc = statusColors[r.status] || { bg: '#f1f5f9', text: '#64748b', label: r.status };
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px', color: '#334155' }}>{i + 1}</td>
                      <td style={{ padding: '10px 12px', color: '#334155', fontWeight: 600 }}>{r.request_number}</td>
                      <td style={{ padding: '10px 12px', color: '#334155' }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
                      <td style={{ padding: '10px 12px', color: '#334155' }}><span style={{ background: '#f1f5f9', borderRadius: 12, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>{r.item_count || '—'}</span></td>
                      <td style={{ padding: '10px 12px', color: '#334155' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: sc.text, fontWeight: 600, fontSize: 12, background: sc.bg, padding: '3px 10px', borderRadius: 20 }}>{sc.label}</span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#334155' }}>
                        <button onClick={() => loadDetail(r.id)} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', marginRight: 6 }}>
                          Detail
                        </button>
                        {r.status === 'SHIPPED' && (
                          <button onClick={() => setConfirm({ id: r.id })} style={{ background: '#166534', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                            <CheckCircle size={12} style={{ marginRight: 4 }} /> Confirm Receipt
                          </button>
                        )}
                        {r.status === 'REJECTED' && r.rejection_reason && (
                          <span style={{ fontSize: 12, color: '#dc2626' }} title={r.rejection_reason}>Reason: {r.rejection_reason.substring(0, 30)}...</span>
                        )}
                        {r.status === 'RECEIVED' && <span style={{ color: '#16a34a', fontSize: 12, fontWeight: 600 }}>✓ Received</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {detail && (
        <div>
          <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer', fontWeight: 600, fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}><ArrowLeft size={14} /> Back to list</button>
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{detail.request_number}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13, color: '#475569', marginBottom: 8 }}>
              <div>Requested by: <strong>{detail.requester_name || '—'}</strong></div>
              <div>Store handler: <strong>{detail.store_handler_name || '—'}</strong></div>
              <div>Date: <strong>{detail.created_at ? new Date(detail.created_at).toLocaleString() : '—'}</strong></div>
              <div>Status: <strong style={{ color: (statusColors[detail.status] || {}).text }}>{(statusColors[detail.status] || {}).label || detail.status}</strong></div>
            </div>
            {detail.notes && <p style={{ margin: '0 0 4px', fontSize: 13, color: '#475569' }}>Notes: {detail.notes}</p>}
            {detail.rejection_reason && <p style={{ margin: '0', fontSize: 13, color: '#dc2626' }}>Rejection: {detail.rejection_reason}</p>}
          </div>
          <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>#</th>
                  <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>Product</th>
                  <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>Qty Requested</th>
                  <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>Qty Shipped</th>
                </tr>
              </thead>
              <tbody>
                {(detail.items || []).map((it, i) => (
                  <tr key={it.id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px', color: '#334155' }}>{i + 1}</td>
                    <td style={{ padding: '10px 12px', color: '#334155', fontWeight: 600 }}>{it.product_name || '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#334155' }}>{it.quantity_requested || 0}</td>
                    <td style={{ padding: '10px 12px', color: '#334155' }}>{it.quantity_shipped || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {detail.status === 'SHIPPED' && (
            <button onClick={() => setConfirm({ id: detail.id })} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#166534', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              <CheckCircle size={16} /> Confirm Receipt
            </button>
          )}
        </div>
      )}

      {confirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setConfirm(null)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, maxWidth: 400, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Confirm Receipt?</h3>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: '#475569' }}>
              Confirm that all items in this request have been received?
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirm(null)} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#475569' }}>Cancel</button>
              <button onClick={() => confirmReceived(confirm.id)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#166534', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
