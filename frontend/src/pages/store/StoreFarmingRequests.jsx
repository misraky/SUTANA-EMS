import React, { useState, useEffect } from 'react';
import axios from '../../services/apiClient';
import { ClipboardList, CheckCircle, AlertCircle, ArrowLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const statusColors = {
  PENDING_STORE: { bg: '#fffbeb', text: '#d97706', label: 'Pending Store' },
  FORWARDED_TO_CEO: { bg: '#fef2f2', text: '#dc2626', label: 'With CEO' },
  APPROVED: { bg: '#f0fdf4', text: '#16a34a', label: 'Approved' },
  REJECTED: { bg: '#fef2f2', text: '#dc2626', label: 'Rejected' },
  SHIPPED: { bg: '#eff6ff', text: '#2563eb', label: 'Shipped' },
  RECEIVED: { bg: '#f0fdf4', text: '#16a34a', label: 'Received' },
};

export default function StoreFarmingRequests() {
  const nav = useNavigate();
  const [requests, setRequests] = useState([]);
  const [detail, setDetail] = useState(null);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => { load(); }, []);

  const load = () => {
    axios.get('/farming/store-requests')
      .then(r => setRequests((r.data || r) || []))
      .catch(() => {});
  };

  const loadDetail = async (id) => {
    try {
      const r = await axios.get(`/farming/store-requests/${id}`);
      setDetail(r.data);
    } catch (e) { alert(e.message); }
  };

  const forwardToCEO = async (id) => {
    try {
      await axios.patch(`/farming/store-requests/${id}/status`, { status: 'FORWARDED_TO_CEO' });
      setDetail(null); setConfirm(null); load();
    } catch (e) { alert(e.response?.data?.message || e.message); }
  };

  const markShipped = async (id) => {
    try {
      await axios.patch(`/farming/store-requests/${id}/status`, { status: 'SHIPPED' });
      setDetail(null); setConfirm(null); load();
    } catch (e) { alert(e.response?.data?.message || e.message); }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><ArrowLeft size={18} /></button>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ClipboardList size={18} color="#166534" /> Farming Product Requests
        </h2>
      </div>

      {!detail ? (
        <>
          {requests.filter(r => r.status === 'FORWARDED_TO_CEO').length > 0 && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 14px', marginBottom: 16, fontSize: 13, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertCircle size={14} /> {requests.filter(r => r.status === 'FORWARDED_TO_CEO').length} request{requests.filter(r => r.status === 'FORWARDED_TO_CEO').length > 1 ? 's' : ''} waiting for CEO approval
            </div>
          )}
          <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>#</th>
                  <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>Request #</th>
                  <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>Requested By</th>
                  <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>Date</th>
                  <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>Status</th>
                  <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '10px 12px', color: '#94a3b8', textAlign: 'center', padding: 30 }}>No requests.</td></tr>
                ) : (
                  requests.map((r, i) => {
                    const sc = statusColors[r.status] || { bg: '#f1f5f9', text: '#64748b', label: r.status };
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => loadDetail(r.id)}>
                        <td style={{ padding: '10px 12px', color: '#334155' }}>{i + 1}</td>
                        <td style={{ padding: '10px 12px', color: '#334155', fontWeight: 600 }}>{r.request_number}</td>
                        <td style={{ padding: '10px 12px', color: '#334155' }}>{r.requester_name || '—'}</td>
                        <td style={{ padding: '10px 12px', color: '#334155' }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
                        <td style={{ padding: '10px 12px', color: '#334155' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: sc.text, fontWeight: 600, fontSize: 12, background: sc.bg, padding: '3px 10px', borderRadius: 20 }}>{sc.label}</span>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#334155' }}>
                          {r.status === 'PENDING_STORE' && (
                            <button onClick={(e) => { e.stopPropagation(); setConfirm({ action: 'forward', id: r.id }); }} style={{ background: '#166534', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                              Forward to CEO
                            </button>
                          )}
                          {r.status === 'APPROVED' && (
                            <button onClick={(e) => { e.stopPropagation(); setConfirm({ action: 'ship', id: r.id }); }} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                              Mark Shipped
                            </button>
                          )}
                          {!['PENDING_STORE', 'APPROVED'].includes(r.status) && <span style={{ color: '#94a3b8', fontSize: 12 }}><ChevronRight size={14} /></span>}
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
            <p style={{ margin: '0 0 8px', fontSize: 13, color: '#475569' }}>Requested by: <strong>{detail.requester_name || '—'}</strong> on {detail.created_at ? new Date(detail.created_at).toLocaleString() : '—'}</p>
            {detail.notes && <p style={{ margin: '0 0 8px', fontSize: 13, color: '#475569' }}>Notes: {detail.notes}</p>}
            {detail.rejection_reason && <p style={{ margin: '0 0 8px', fontSize: 13, color: '#dc2626' }}>Rejection reason: {detail.rejection_reason}</p>}
          </div>
          <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>#</th>
                  <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>Product</th>
                  <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>Requested</th>
                  <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>Shipped</th>
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
          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            {detail.status === 'PENDING_STORE' && (
              <button onClick={() => setConfirm({ action: 'forward', id: detail.id })} style={{ background: '#166534', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Forward to CEO</button>
            )}
            {detail.status === 'APPROVED' && (
              <button onClick={() => setConfirm({ action: 'ship', id: detail.id })} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Mark as Shipped</button>
            )}
          </div>
        </div>
      )}
      {confirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setConfirm(null)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, maxWidth: 400, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
              {confirm.action === 'forward' ? 'Forward to CEO?' : 'Mark as Shipped?'}
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: '#475569' }}>
              {confirm.action === 'forward'
                ? 'This request will be sent to the CEO for review and approval.'
                : 'This will mark the items as shipped to the Farming Manager.'}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirm(null)} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#475569' }}>Cancel</button>
              <button onClick={() => confirm.action === 'forward' ? forwardToCEO(confirm.id) : markShipped(confirm.id)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: confirm.action === 'forward' ? '#166534' : '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
