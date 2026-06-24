import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Eye, X } from 'lucide-react';

const STATUS_COLORS = {
  STORE_REQUESTED: '#f59e0b',
  BUDGET_REQUESTED: '#3b82f6',
  BUDGET_FORWARDED_CEO: '#8b5cf6',
  BUDGET_APPROVED: '#10b981',
  BUDGET_READY: '#06b6d4',
  GOODS_PURCHASED: '#f97316',
  ADVANCE_PAID: '#6366f1',
  GOODS_RECEIVED: '#14b8a6',
  RECEIPT_CONFIRMED: '#84cc16',
  REMAINING_APPROVED: '#22c55e',
  REMAINING_PAID: '#10b981',
  CANCELLED: '#ef4444',
};

const StorePurchaseWorkflow = () => {
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [detail, setDetail] = useState(null);
  const [actionModal, setActionModal] = useState(null);
  const [form, setForm] = useState({ product_name: '', quantity: 1, estimated_cost: '', supplier_name: '', supplier_contact: '', store_notes: '' });
  const [actionData, setActionData] = useState({});
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const load = async () => {
    try {
      const res = await axios.get('/purchase/workflow');
      if (res.data.status === 'success') setRequests(res.data.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/purchase/workflow', form);
      setShowForm(false);
      setForm({ product_name: '', quantity: 1, estimated_cost: '', supplier_name: '', supplier_contact: '', store_notes: '' });
      setMsg('Request created successfully');
      setTimeout(() => setMsg(null), 4000);
      load();
    } catch (e) { setErr(e.response?.data?.message || 'Error creating'); setTimeout(() => setErr(null), 4000); }
  };

  const viewDetail = async (id) => {
    try {
      const res = await axios.get(`/purchase/workflow/${id}`);
      if (res.data.status === 'success') setDetail(res.data.data);
    } catch (e) { console.error(e); }
  };

  const doAction = async () => {
    try {
      await axios.patch(`/purchase/workflow/${actionModal.id}/status`, actionData);
      setActionModal(null);
      setActionData({});
      setMsg('Action completed successfully');
      setTimeout(() => setMsg(null), 4000);
      load();
    } catch (e) { setErr(e.response?.data?.message || 'Error'); setTimeout(() => setErr(null), 4000); }
  };

  const detailFields = [
    ['Product', 'product_name'], ['Quantity', 'quantity'], ['Est. Cost', 'estimated_cost'],
    ['Supplier', 'supplier_name'], ['Supplier Contact', 'supplier_contact'], ['Store Notes', 'store_notes'],
    ['PO Number', 'po_number'], ['Budget Request Notes', 'budget_request_notes'],
    ['Budget Amount', 'budget_amount'], ['Finance Notes', 'finance_notes'],
    ['CEO Budget Notes', 'ceo_budget_notes'], ['Purchase Notes', 'purchase_notes'],
    ['Advance Amount', 'advance_amount'], ['Advance Payment Ref', 'advance_payment_ref'],
    ['Receiving Notes', 'receiving_notes'], ['Receipt Notes', 'receipt_notes'],
    ['Remaining Notes', 'remaining_notes'], ['Remaining Payment Ref', 'remaining_payment_ref'],
    ['Finance Payment Notes', 'finance_payment_notes'],
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Purchase Budget Workflow</h2>
        <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>
          <Plus size={16} /> New Request
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Request Purchase</h3>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
          </div>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>Product Name *</label>
                <input value={form.product_name} onChange={e => setForm({ ...form, product_name: e.target.value })} required style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>Quantity *</label>
                <input type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })} required style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>Estimated Cost</label>
                <input type="number" min="0" step="0.01" value={form.estimated_cost} onChange={e => setForm({ ...form, estimated_cost: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>Supplier Name</label>
                <input value={form.supplier_name} onChange={e => setForm({ ...form, supplier_name: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>Supplier Contact</label>
                <input value={form.supplier_contact} onChange={e => setForm({ ...form, supplier_contact: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>Notes</label>
                <textarea value={form.store_notes} onChange={e => setForm({ ...form, store_notes: e.target.value })} rows={3} style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, resize: 'vertical' }} />
              </div>
            </div>
            <button type="submit" style={{ marginTop: 12, background: '#2563eb', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 6, cursor: 'pointer' }}>
              Submit Request
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
              <th style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>Est. Cost</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>Date</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>Status</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.filter(r => r.requested_by === detail?.requested_by || !detail).map((r, i) => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 12px', color: '#6b7280' }}>{i + 1}</td>
                <td style={{ padding: '10px 12px', fontWeight: 500 }}>{r.request_number}</td>
                <td style={{ padding: '10px 12px' }}>{r.product_name}</td>
                <td style={{ padding: '10px 12px' }}>{r.quantity}</td>
                <td style={{ padding: '10px 12px' }}>{r.estimated_cost ? Number(r.estimated_cost).toLocaleString() : '-'}</td>
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
              <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>No requests yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {detail && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setDetail(null)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 600, width: '90%', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>{detail.request_number}</h3>
              <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
              <tbody>
                {detailFields.map(([label, key]) => {
                  const val = detail[key];
                  if (!val && val !== 0) return null;
                  return (
                    <tr key={key} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 500, color: '#374151', width: '40%', verticalAlign: 'top' }}>{label}</td>
                      <td style={{ padding: '8px 12px', color: '#6b7280' }}>{key === 'status' ? <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, color: '#fff', background: STATUS_COLORS[val] || '#6b7280' }}>{val}</span> : String(val)}</td>
                    </tr>
                  );
                })}
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 500, color: '#374151' }}>Status</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, color: '#fff', background: STATUS_COLORS[detail.status] || '#6b7280' }}>{detail.status}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {actionModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setActionModal(null)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 450, width: '90%' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px' }}>{actionModal.title}</h3>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>{actionModal.description}</p>
            {actionModal.fields?.map(f => (
              <div key={f.key} style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>{f.label} {f.required ? '*' : ''}</label>
                {f.type === 'textarea' ? (
                  <textarea value={actionData[f.key] || ''} onChange={e => setActionData({ ...actionData, [f.key]: e.target.value })} rows={3} style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, resize: 'vertical' }} />
                ) : (
                  <input type={f.type || 'text'} value={actionData[f.key] || ''} onChange={e => setActionData({ ...actionData, [f.key]: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} />
                )}
              </div>
            ))}
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button onClick={doAction} style={{ background: actionModal.color || '#2563eb', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 6, cursor: 'pointer' }}>{actionModal.buttonText}</button>
              <button onClick={() => setActionModal(null)} style={{ background: '#6b7280', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
            </div>
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

export default StorePurchaseWorkflow;
