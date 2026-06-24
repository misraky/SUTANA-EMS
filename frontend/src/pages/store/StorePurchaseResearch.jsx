import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingCart, Plus, Eye, X } from 'lucide-react';

const STATUS_COLORS = {
  PENDING_CEO: '#f59e0b',
  MARKET_STUDY: '#3b82f6',
  RESULTS_SUBMITTED: '#8b5cf6',
  APPROVED: '#10b981',
  REJECTED: '#ef4444',
};

const StorePurchaseResearch = () => {
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({ product_name: '', quantity_requested: 1, reason: '', current_stock: 0 });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const load = async () => {
    try {
      const res = await axios.get('/store/purchase-research');
      if (res.data.status === 'success') setRequests(res.data.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/store/purchase-research', form);
      setShowForm(false);
      setForm({ product_name: '', quantity_requested: 1, reason: '', current_stock: 0 });
      setMsg('Request submitted successfully');
      setTimeout(() => setMsg(null), 4000);
      load();
    } catch (e) { setErr(e.response?.data?.message || 'Error creating request'); setTimeout(() => setErr(null), 4000); }
    setLoading(false);
  };

  const viewDetail = async (id) => {
    try {
      const res = await axios.get(`/store/purchase-research/${id}`);
      if (res.data.status === 'success') setDetail(res.data.data);
    } catch (e) { console.error(e); }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}><ShoppingCart size={20} style={{ marginRight: 8 }} />Purchase Research Requests</h2>
        <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>
          <Plus size={16} /> New Request
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Request Purchase Authorization</h3>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
          </div>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>Product Name *</label>
                <input value={form.product_name} onChange={e => setForm({ ...form, product_name: e.target.value })} required style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>Quantity Requested *</label>
                <input type="number" min="1" value={form.quantity_requested} onChange={e => setForm({ ...form, quantity_requested: parseInt(e.target.value) || 1 })} required style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>Current Stock Level</label>
                <input type="number" min="0" value={form.current_stock} onChange={e => setForm({ ...form, current_stock: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>Reason</label>
                <textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} rows={3} style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, resize: 'vertical' }} />
              </div>
            </div>
            <button type="submit" disabled={loading} style={{ marginTop: 12, background: '#2563eb', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 6, cursor: 'pointer' }}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>#</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>Request #</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>Product</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>Qty</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>Date</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>Status</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r, i) => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 12px', color: '#6b7280' }}>{i + 1}</td>
                <td style={{ padding: '10px 12px', fontWeight: 500 }}>{r.request_number}</td>
                <td style={{ padding: '10px 12px' }}>{r.product_name}</td>
                <td style={{ padding: '10px 12px' }}>{r.quantity_requested}</td>
                <td style={{ padding: '10px 12px', color: '#6b7280', fontSize: 13 }}>{new Date(r.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, color: '#fff', background: STATUS_COLORS[r.status] || '#6b7280' }}>{r.status}</span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <button onClick={() => viewDetail(r.id)} style={{ background: 'none', border: '1px solid #d1d5db', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}><Eye size={14} style={{ marginRight: 4 }} />View</button>
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>No requests yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {detail && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setDetail(null)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 500, width: '90%', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>{detail.request_number}</h3>
              <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
              <tbody>
                {[
                  ['Product', detail.product_name],
                  ['Quantity Requested', detail.quantity_requested],
                  ['Current Stock', detail.current_stock],
                  ['Reason', detail.reason || '-'],
                  ['Status', detail.status],
                  ['Requested By', detail.requester_name || '-'],
                  ['CEO Handler', detail.ceo_handler_name || '-'],
                  ['Market Handler', detail.market_handler_name || '-'],
                  ['CEO Instructions', detail.ceo_instructions || '-'],
                  ['Research Findings', detail.research_findings || '-'],
                  ['Rejection Reason', detail.rejection_reason || '-'],
                  ['Approval Instructions', detail.approval_instructions || '-'],
                  ['Created', new Date(detail.created_at).toLocaleString()],
                ].map(([label, value]) => (
                  <tr key={label} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 500, color: '#374151', width: '40%', verticalAlign: 'top' }}>{label}</td>
                    <td style={{ padding: '8px 12px', color: label === 'Status' ? STATUS_COLORS[value] || '#6b7280' : '#6b7280', fontWeight: label === 'Status' ? 600 : 400 }}>{label === 'Status' ? <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, color: '#fff', background: STATUS_COLORS[value] || '#6b7280' }}>{value}</span> : value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {msg && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 20px', color: '#16a34a', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 9999, maxWidth: 360 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <span style={{ flex: 1 }}>{msg}</span>
          <button onClick={() => setMsg(null)} style={{ background: 'none', border: 'none', color: '#16a34a', cursor: 'pointer', padding: 2, marginLeft: 8, fontSize: 16, lineHeight: 1 }}>×</button>
        </div>
      )}
      {err && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '14px 20px', color: '#dc2626', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 9999, maxWidth: 360 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          <span style={{ flex: 1 }}>{err}</span>
          <button onClick={() => setErr(null)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 2, marginLeft: 8, fontSize: 16, lineHeight: 1 }}>×</button>
        </div>
      )}
    </div>
  );
};

export default StorePurchaseResearch;
