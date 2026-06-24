import React, { useState, useEffect } from 'react';
import axios from '../../services/apiClient';
import { ClipboardList, Send, CheckCircle, XCircle, Eye, X, ShoppingCart } from 'lucide-react';

const STATUS_COLORS = {
  PENDING_PURCHASE: '#f59e0b',
  PENDING_CEO: '#3b82f6',
  MARKET_STUDY: '#8b5cf6',
  RESULTS_SUBMITTED: '#6b7280',
  APPROVED: '#10b981',
  REJECTED: '#ef4444',
};

const PurchaseResearch = () => {
  const [requests, setRequests] = useState([]);
  const [detail, setDetail] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [actionType, setActionType] = useState('');
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const isStoreRequest = (r) => {
    if (!r.requester_roles) return false;
    const roles = r.requester_roles.toLowerCase();
    return roles.includes('store manager') || roles.includes('store worker') || roles.includes('sales/cashier');
  };

  const load = async () => {
    try {
      const res = await axios.get('/store/purchase-research');
      if (res.status === 'success') setRequests((res.data || []).filter(isStoreRequest));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`/store/purchase-research/${id}/status`, { status });
      setActionId(null);
      setMsg(status === 'PENDING_CEO' ? 'Forwarded to CEO' : status);
      setTimeout(() => setMsg(null), 4000);
      load();
    } catch (e) { setErr(e.message || 'Error updating status'); setTimeout(() => setErr(null), 4000); }
  };

  const viewDetail = async (id) => {
    try {
      const res = await axios.get(`/store/purchase-research/${id}`);
      if (res.status === 'success') setDetail(res.data);
    } catch (e) { console.error(e); }
  };

  const getStatusBadge = (r) => {
    const labels = {
      PENDING_PURCHASE: 'Pending Review',
      PENDING_CEO: 'Forwarded to CEO',
      MARKET_STUDY: 'Market Research',
      RESULTS_SUBMITTED: 'Results Submitted',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
    };
    return labels[r.status] || r.status;
  };

  const getActions = (r) => {
    if (r.status === 'PENDING_PURCHASE') return (
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => setActionId(r.id)} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><Send size={12} />Forward to CEO</button>
      </div>
    );
    if (r.status === 'APPROVED') return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#059669', background: '#d1fae5', padding: '2px 10px', borderRadius: 12 }}><ShoppingCart size={12} />Ready to Execute</span>
    );
    return '-';
  };

  const pendingPurchase = requests.filter(r => r.status === 'PENDING_PURCHASE');
  const forwardedCEO = requests.filter(r => r.status === 'PENDING_CEO');
  const approved = requests.filter(r => r.status === 'APPROVED');
  const other = requests.filter(r => !['PENDING_PURCHASE', 'PENDING_CEO', 'APPROVED'].includes(r.status));

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
                <td style={{ padding: '10px 12px', fontWeight: 500, fontFamily: 'monospace', fontSize: 13 }}>{r.request_number}</td>
                <td style={{ padding: '10px 12px' }}>{r.product_name}</td>
                <td style={{ padding: '10px 12px' }}>{r.quantity_requested}</td>
                <td style={{ padding: '10px 12px' }}>{r.requester_name || '-'}</td>
                <td style={{ padding: '10px 12px', color: '#6b7280', fontSize: 13 }}>{new Date(r.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, color: '#fff', background: STATUS_COLORS[r.status] || '#6b7280' }}>{getStatusBadge(r)}</span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button onClick={() => viewDetail(r.id)} style={{ background: 'none', border: '1px solid #d1d5db', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={12} />View</button>
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
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><ClipboardList size={20} />Purchase Research</h2>
        <button onClick={load} style={{ background: 'none', border: '1px solid #d1d5db', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>Refresh</button>
      </div>
      <p style={{ color: '#6b7280', fontSize: 13, margin: '-12px 0 16px' }}>
        Review store purchase requests — forward to CEO for market research and supplier validation.
      </p>

      {renderTable(pendingPurchase, `Pending Review (${pendingPurchase.length})`)}
      {renderTable(forwardedCEO, `Forwarded to CEO (${forwardedCEO.length})`)}
      {renderTable(approved, `Approved — Ready to Execute (${approved.length})`)}
      {renderTable(other, 'In Progress / History')}

      {actionId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setActionId(null)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 400, width: '90%' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px' }}>Forward to CEO</h3>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>Send this purchase request to the CEO for market research assignment.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setActionId(null)} style={{ background: '#6b7280', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
              <button onClick={() => updateStatus(actionId, 'PENDING_CEO')} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 6, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}><Send size={14} />Forward to CEO</button>
            </div>
          </div>
        </div>
      )}

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
                  ['Current Stock', detail.current_stock ?? '-'],
                  ['Reason', detail.reason || '-'],
                  ['Status', detail.status],
                  ['Requested By', detail.requester_name ? `${detail.requester_name} (${detail.requester_roles || 'Store'})` : '-'],
                  ['CEO Instructions', detail.ceo_instructions || '-'],
                  ['Research Findings', detail.research_findings || '-'],
                  ['Prices', detail.research_prices || '-'],
                  ['Suppliers', detail.research_suppliers || '-'],
                  ['Quality', detail.research_quality || '-'],
                  ['Availability', detail.research_availability || '-'],
                  ['Market Notes', detail.research_notes || '-'],
                  ['Rejection Reason', detail.rejection_reason || '-'],
                  ['Approval Instructions', detail.approval_instructions || '-'],
                  ['Created', new Date(detail.created_at).toLocaleString()],
                ].map(([label, value]) => (
                  <tr key={label} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 500, color: '#374151', width: '40%', verticalAlign: 'top' }}>{label}</td>
                    <td style={{ padding: '8px 12px', color: '#6b7280' }}>
                      {label === 'Status' ? (
                        <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, color: '#fff', background: STATUS_COLORS[value] || '#6b7280' }}>{getStatusBadge({ status: value })}</span>
                      ) : label === 'Attachments' && Array.isArray(value) ? (
                        value.map((a, i) => <div key={i}><a href={a.url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>{a.originalName || a.filename || `File ${i + 1}`}</a></div>)
                      ) : value}
                    </td>
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

export default PurchaseResearch;