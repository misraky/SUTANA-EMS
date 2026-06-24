import React, { useState, useEffect } from 'react';
import axios from '../../services/apiClient';
import { ClipboardList, CheckCircle, XCircle, AlertCircle, ArrowLeft, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const statusColors = {
  PENDING_STORE: { bg: '#fffbeb', text: '#d97706', label: 'Pending Store' },
  FORWARDED_TO_CEO: { bg: '#fef2f2', text: '#dc2626', label: 'Pending CEO Approval' },
  APPROVED: { bg: '#f0fdf4', text: '#16a34a', label: 'Approved' },
  REJECTED: { bg: '#fef2f2', text: '#dc2626', label: 'Rejected' },
  SHIPPED: { bg: '#eff6ff', text: '#2563eb', label: 'Shipped' },
  RECEIVED: { bg: '#f0fdf4', text: '#16a34a', label: 'Received' },
};

const FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'FORWARDED_TO_CEO', label: 'Pending CEO' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'SHIPPED', label: 'Shipped' },
  { key: 'RECEIVED', label: 'Received' },
];

export default function CEOFarmingRequests() {
  const nav = useNavigate();
  const [requests, setRequests] = useState([]);
  const [detail, setDetail] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const filteredRequests = filter === 'ALL' ? requests : requests.filter(r => r.status === filter);

  useEffect(() => { load(); }, []);

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); } }, [toast]);

  const load = () => {
    axios.get('/farming/store-requests')
      .then(r => setRequests((r.data || r) || []))
      .catch(() => {});
  };

  const loadDetail = async (id) => {
    try {
      const r = await axios.get(`/farming/store-requests/${id}`);
      setDetail(r.data);
      setRejectId(null);
      setRejectReason('');
    } catch (e) { setToast({ type: 'error', msg: e.message }); }
  };

  const approve = async (id) => {
    try {
      await axios.patch(`/farming/store-requests/${id}/status`, { status: 'APPROVED' });
      setDetail(null); setRejectId(null); setConfirm(null); setToast({ type: 'success', msg: 'Request approved' }); load();
    } catch (e) { setToast({ type: 'error', msg: e.response?.data?.message || e.message }); }
  };

  const reject = async (id) => {
    if (!rejectReason.trim()) { setToast({ type: 'error', msg: 'Please enter a rejection reason' }); return; }
    try {
      await axios.patch(`/farming/store-requests/${id}/status`, { status: 'REJECTED', rejection_reason: rejectReason });
      setDetail(null); setRejectId(null); setConfirm(null); setToast({ type: 'success', msg: 'Request rejected' }); load();
    } catch (e) { setToast({ type: 'error', msg: e.response?.data?.message || e.message }); }
  };

  const pendingCEO = requests.filter(r => r.status === 'FORWARDED_TO_CEO');

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><ArrowLeft size={18} /></button>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ClipboardList size={18} color="#b45309" /> Farming Product Approvals
        </h2>
      </div>

      {pendingCEO.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 14px', marginBottom: 16, fontSize: 13, color: '#92400e', display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertCircle size={14} /> {pendingCEO.length} request{pendingCEO.length > 1 ? 's' : ''} pending your approval
        </div>
      )}

      {!detail ? (
        <>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: '6px 16px', borderRadius: 20, border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', background: filter === f.key ? '#0f172a' : '#fff', color: filter === f.key ? '#fff' : '#475569'
            }}>{f.label}</button>
          ))}
        </div>
        <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>#</th>
                <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>Request #</th>
                <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>Requested By</th>
                <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>Date</th>
                <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>Status</th>
                <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '10px 12px', color: '#94a3b8', textAlign: 'center', padding: 30 }}>No requests found.</td></tr>
                ) : (
                  filteredRequests.map((r, i) => {
                  const sc = statusColors[r.status] || { bg: '#f1f5f9', text: '#64748b', label: r.status };
                  const needsCEO = r.status === 'FORWARDED_TO_CEO';
                  const isRejecting = rejectId === r.id;
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', background: needsCEO ? '#fffbeb' : '#fff' }}>
                      <td style={{ padding: '10px 12px', color: '#334155' }}>{i + 1}</td>
                      <td style={{ padding: '10px 12px', color: '#334155', fontWeight: 600, cursor: 'pointer' }} onClick={() => loadDetail(r.id)}>{r.request_number}</td>
                      <td style={{ padding: '10px 12px', color: '#334155', cursor: 'pointer' }} onClick={() => loadDetail(r.id)}>{r.requester_name || '—'}</td>
                      <td style={{ padding: '10px 12px', color: '#334155', cursor: 'pointer' }} onClick={() => loadDetail(r.id)}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
                      <td style={{ padding: '10px 12px', color: '#334155', cursor: 'pointer' }} onClick={() => loadDetail(r.id)}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: sc.text, fontWeight: 600, fontSize: 12, background: sc.bg, padding: '3px 10px', borderRadius: 20 }}>{sc.label}</span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#334155' }}>
                        {needsCEO && !isRejecting && (
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <button onClick={() => setConfirm({ action: 'approve', id: r.id })} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#16a34a', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                              <CheckCircle size={14} /> Approve
                            </button>
                            <button onClick={() => { setRejectId(r.id); setRejectReason(''); }} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#dc2626', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                              <XCircle size={14} /> Reject
                            </button>
                          </div>
                        )}
                        {needsCEO && isRejecting && (
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input type="text" placeholder="Rejection reason..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12, width: 180 }} />
                            <button onClick={() => { if (!rejectReason.trim()) { setToast({ type: 'error', msg: 'Please enter a rejection reason' }); return; } setConfirm({ action: 'reject', id: r.id }); }} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                              Confirm Reject
                            </button>
                            <button onClick={() => setRejectId(null)} style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '6px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                          </div>
                        )}
                        {!needsCEO && (
                          <button onClick={() => loadDetail(r.id)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>View</button>
                        )}
                      </td>
                    </tr>
                  );
              })
              )}
            </tbody>
          </table>
        </div>
        </>
      ) : (
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
                </tr>
              </thead>
              <tbody>
                {(detail.items || []).map((it, i) => (
                  <tr key={it.id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px', color: '#334155' }}>{i + 1}</td>
                    <td style={{ padding: '10px 12px', color: '#334155', fontWeight: 600 }}>{it.product_name || '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#334155' }}>{it.quantity_requested || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {detail.status === 'FORWARDED_TO_CEO' && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <button onClick={() => setConfirm({ action: 'approve', id: detail.id })} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#16a34a', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                <CheckCircle size={16} /> Approve
              </button>
              <div style={{ flex: 1, minWidth: 250 }}>
                <textarea placeholder="Rejection reason (required)" value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={2} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, marginBottom: 6, boxSizing: 'border-box' }} />
                <button onClick={() => { if (!rejectReason.trim()) { setToast({ type: 'error', msg: 'Please enter a rejection reason' }); return; } setConfirm({ action: 'reject', id: detail.id }); }} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#dc2626', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                  <XCircle size={16} /> Reject
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 99999, padding: '12px 20px', borderRadius: 10, background: toast.type === 'success' ? '#f0fdf4' : '#fef2f2', border: toast.type === 'success' ? '1px solid #bbf7d0' : '1px solid #fecaca', color: toast.type === 'success' ? '#16a34a' : '#dc2626', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {toast.msg}
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, marginLeft: 8 }}><X size={14} /></button>
        </div>
      )}

      {confirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setConfirm(null)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, maxWidth: 400, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
              {confirm.action === 'approve' ? 'Approve this request?' : 'Reject this request?'}
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: '#475569' }}>
              {confirm.action === 'approve'
                ? 'This will mark the request as approved. The Store Manager can then proceed with shipping.'
                : 'This will reject the request and notify the requester.'}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirm(null)} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#475569' }}>Cancel</button>
              <button onClick={() => confirm.action === 'approve' ? approve(confirm.id) : reject(confirm.id)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: confirm.action === 'approve' ? '#16a34a' : '#dc2626', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
