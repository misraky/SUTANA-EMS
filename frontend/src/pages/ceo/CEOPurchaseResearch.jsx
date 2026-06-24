import React, { useState, useEffect } from 'react';
import axios from '../../services/apiClient';
import { ClipboardList, Send, CheckCircle, XCircle, Eye, X } from 'lucide-react';

const STATUS_COLORS = {
  PENDING_PURCHASE: '#f59e0b',
  PENDING_CEO: '#3b82f6',
  MARKET_STUDY: '#8b5cf6',
  RESULTS_SUBMITTED: '#6b7280',
  APPROVED: '#10b981',
  REJECTED: '#ef4444',
};

const CEOPurchaseResearch = () => {
  const [requests, setRequests] = useState([]);
  const [detail, setDetail] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [actionType, setActionType] = useState('');
  const [formData, setFormData] = useState({ ceo_instructions: '', research_findings: '', rejection_reason: '', approval_instructions: '' });
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const load = async () => {
    try {
      const res = await axios.get('/store/purchase-research');
      if (res.status === 'success') setRequests(res.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    const body = { status };
    if (status === 'MARKET_STUDY' && formData.ceo_instructions) body.ceo_instructions = formData.ceo_instructions;
    if (status === 'APPROVED') {
      if (formData.approval_instructions) body.approval_instructions = formData.approval_instructions;
    }
    if (status === 'REJECTED') {
      if (formData.rejection_reason) body.rejection_reason = formData.rejection_reason;
      if (formData.approval_instructions) body.approval_instructions = formData.approval_instructions;
    }
    try {
      await axios.patch(`/store/purchase-research/${id}/status`, body);
      setActionId(null);
      setFormData({ ceo_instructions: '', research_findings: '', rejection_reason: '', approval_instructions: '' });
      setMsg(`Request ${actionLabels[status] || status}`);
      setTimeout(() => setMsg(null), 4000);
      load();
    } catch (e) { setErr(e.message || 'Error updating status'); setTimeout(() => setErr(null), 4000); }
  };
  const actionLabels = { MARKET_STUDY: 'Sent to Market Team', APPROVED: 'Approved', REJECTED: 'Rejected' };

  const viewDetail = async (id) => {
    try {
      const res = await axios.get(`/store/purchase-research/${id}`);
      if (res.status === 'success') setDetail(res.data);
    } catch (e) { console.error(e); }
  };

  const openAction = (id, type) => {
    setActionId(id);
    setActionType(type);
    setFormData({ ceo_instructions: '', research_findings: '', rejection_reason: '', approval_instructions: '' });
  };

  const renderActionModal = () => {
    if (!actionId) return null;
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setActionId(null)}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 450, width: '90%' }} onClick={e => e.stopPropagation()}>
          <h3 style={{ margin: '0 0 12px' }}>
            {actionType === 'MARKET_STUDY' && 'Send to Market Team'}
            {actionType === 'APPROVED' && 'Approve Request'}
            {actionType === 'REJECTED' && 'Reject Request'}
          </h3>
          {actionType === 'MARKET_STUDY' && (
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>Instructions for Market Team</label>
              <textarea value={formData.ceo_instructions} onChange={e => setFormData({ ...formData, ceo_instructions: e.target.value })} rows={4} style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, resize: 'vertical' }} />
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button onClick={() => updateStatus(actionId, 'MARKET_STUDY')} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 6, cursor: 'pointer' }}><Send size={14} style={{ marginRight: 6 }} />Send to Market</button>
                <button onClick={() => setActionId(null)} style={{ background: '#6b7280', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}
          {actionType === 'APPROVED' && (
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>Approval Instructions (optional)</label>
              <textarea value={formData.approval_instructions} onChange={e => setFormData({ ...formData, approval_instructions: e.target.value })} rows={4} style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, resize: 'vertical' }} />
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button onClick={() => updateStatus(actionId, 'APPROVED')} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 6, cursor: 'pointer' }}><CheckCircle size={14} style={{ marginRight: 6 }} />Approve</button>
                <button onClick={() => setActionId(null)} style={{ background: '#6b7280', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}
          {actionType === 'REJECTED' && (
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13 }}>Rejection Reason *</label>
              <textarea value={formData.rejection_reason} onChange={e => setFormData({ ...formData, rejection_reason: e.target.value })} rows={3} style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, resize: 'vertical' }} />
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 13, marginTop: 10 }}>Instructions (optional)</label>
              <textarea value={formData.approval_instructions} onChange={e => setFormData({ ...formData, approval_instructions: e.target.value })} rows={3} style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, resize: 'vertical' }} />
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button onClick={() => updateStatus(actionId, 'REJECTED')} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 6, cursor: 'pointer' }}><XCircle size={14} style={{ marginRight: 6 }} />Reject</button>
                <button onClick={() => setActionId(null)} style={{ background: '#6b7280', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const getActions = (r) => {
    if (r.status === 'PENDING_CEO') return (
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => openAction(r.id, 'MARKET_STUDY')} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}><Send size={12} style={{ marginRight: 4 }} />Send to Market</button>
        <button onClick={() => openAction(r.id, 'REJECTED')} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}><XCircle size={12} style={{ marginRight: 4 }} />Reject</button>
      </div>
    );
    if (r.status === 'RESULTS_SUBMITTED') return (
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => openAction(r.id, 'APPROVED')} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}><CheckCircle size={12} style={{ marginRight: 4 }} />Approve</button>
        <button onClick={() => openAction(r.id, 'REJECTED')} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}><XCircle size={12} style={{ marginRight: 4 }} />Reject</button>
      </div>
    );
    return '-';
  };

  const pendingCEO = requests.filter(r => r.status === 'PENDING_CEO');
  const resultsSubmitted = requests.filter(r => r.status === 'RESULTS_SUBMITTED');
  const other = requests.filter(r => !['PENDING_CEO', 'RESULTS_SUBMITTED', 'PENDING_PURCHASE'].includes(r.status));

  const renderTable = (data, label) => (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 15, color: '#374151' }}>{label}</h3>
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>#</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>Request #</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>Product</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>Qty</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>Requester</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>Date</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>Status</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r, i) => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 12px', color: '#6b7280' }}>{i + 1}</td>
                <td style={{ padding: '10px 12px', fontWeight: 500 }}>{r.request_number}</td>
                <td style={{ padding: '10px 12px' }}>{r.product_name}</td>
                <td style={{ padding: '10px 12px' }}>{r.quantity_requested}</td>
                <td style={{ padding: '10px 12px' }}>{r.requester_name || '-'}</td>
                <td style={{ padding: '10px 12px', color: '#6b7280', fontSize: 13 }}>{new Date(r.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, color: '#fff', background: STATUS_COLORS[r.status] || '#6b7280' }}>{r.status}</span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button onClick={() => viewDetail(r.id)} style={{ background: 'none', border: '1px solid #d1d5db', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}><Eye size={12} style={{ marginRight: 4 }} />View</button>
                    {getActions(r)}
                  </div>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>No requests in this category</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}><ClipboardList size={20} style={{ marginRight: 8 }} />Purchase Research Approvals</h2>
        <button onClick={load} style={{ background: 'none', border: '1px solid #d1d5db', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>Refresh</button>
      </div>
      {renderTable(pendingCEO, `Pending CEO Review (${pendingCEO.length})`)}
      {renderTable(resultsSubmitted, `Results Submitted — Awaiting Decision (${resultsSubmitted.length})`)}
      {renderTable(other, 'Other Requests')}
      {renderActionModal()}
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
                  ['CEO Instructions', detail.ceo_instructions || '-'],
                  ['Research Findings', detail.research_findings || '-'],
                  ['Prices', detail.research_prices || '-'],
                  ['Suppliers', detail.research_suppliers || '-'],
                  ['Quality', detail.research_quality || '-'],
                  ['Availability', detail.research_availability || '-'],
                  ['Market Notes', detail.research_notes || '-'],
                  ['Attachments', detail.research_attachments ? (JSON.parse(detail.research_attachments) || []).map((a, i) => <div key={i}><a href={a.url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>{a.originalName || a.filename || `File ${i + 1}`}</a></div>) : '-'],
                  ['Rejection Reason', detail.rejection_reason || '-'],
                  ['Approval Instructions', detail.approval_instructions || '-'],
                  ['Created', new Date(detail.created_at).toLocaleString()],
                ].map(([label, value]) => (
                  <tr key={label} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 500, color: '#374151', width: '40%', verticalAlign: 'top' }}>{label}</td>
                    <td style={{ padding: '8px 12px', color: '#6b7280' }}>{label === 'Status' ? <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, color: '#fff', background: STATUS_COLORS[value] || '#6b7280' }}>{value}</span> : value}</td>
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

export default CEOPurchaseResearch;
