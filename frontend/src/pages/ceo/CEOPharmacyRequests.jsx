import React, { useState, useEffect } from 'react';
import axios from '../../services/apiClient';
import { ClipboardList, CheckCircle, XCircle, AlertCircle, ArrowLeft, Truck, PackageCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const statusColors = {
  pending: { bg: '#fffbeb', text: '#d97706', label: 'Pending' },
  approved: { bg: '#f0fdf4', text: '#16a34a', label: 'Approved' },
  rejected: { bg: '#fef2f2', text: '#dc2626', label: 'Rejected' },
  ready_for_pickup: { bg: '#eff6ff', text: '#2563eb', label: 'Ready' },
  picked_up: { bg: '#f0fdf4', text: '#16a34a', label: 'Shipped' },
  delivered: { bg: '#f0fdf4', text: '#16a34a', label: 'Received' },
};

const FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'pending', label: 'Pending CEO' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'picked_up', label: 'Shipped' },
  { key: 'delivered', label: 'Received' },
];

export default function CEOPharmacyRequests() {
  const nav = useNavigate();
  const [requests, setRequests] = useState([]);
  const [detail, setDetail] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [filter, setFilter] = useState('ALL');
  const filteredRequests = filter === 'ALL' ? requests : requests.filter(r => r.status === filter);

  useEffect(() => { load(); }, []);

  const load = () => {
    axios.get('/pharmacy/requests')
      .then(r => setRequests(r.data || []))
      .catch(() => {});
  };

  const loadDetail = async (id) => {
    try {
      const r = await axios.get(`/pharmacy/requests`);
      const found = (r.data || []).find(req => req.id === id);
      setDetail(found || null);
      setRejectId(null);
      setRejectReason('');
    } catch (e) { alert(e.message); }
  };

  const approve = async (id) => {
    if (!confirm('Approve this prescription request?')) return;
    try {
      await axios.post(`/pharmacy/requests/${id}/approve`);
      setDetail(null); setRejectId(null); load();
    } catch (e) { alert(e.response?.data?.message || e.message); }
  };

  const ship = async (id) => {
    if (!confirm('Mark this request as Shipped?')) return;
    try {
      await axios.put(`/pharmacy/requests/${id}/complete`, { status: 'picked_up' });
      setDetail(null); load();
    } catch (e) { alert(e.response?.data?.message || e.message); }
  };

  const receive = async (id) => {
    if (!confirm('Mark this request as Received?')) return;
    try {
      await axios.put(`/pharmacy/requests/${id}/complete`, { status: 'delivered' });
      setDetail(null); load();
    } catch (e) { alert(e.response?.data?.message || e.message); }
  };

  const reject = async (id) => {
    if (!rejectReason.trim()) { alert('Please enter a rejection reason'); return; }
    if (!confirm('Reject this prescription request?')) return;
    try {
      await axios.post(`/pharmacy/requests/${id}/reject`, { reason: rejectReason });
      setDetail(null); setRejectId(null); load();
    } catch (e) { alert(e.response?.data?.message || e.message); }
  };

  const pending = requests.filter(r => r.status === 'pending');

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><ArrowLeft size={18} /></button>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ClipboardList size={18} color="#2563eb" /> Pharmacy Prescription Approvals
        </h2>
      </div>

      {pending.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 14px', marginBottom: 16, fontSize: 13, color: '#92400e', display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertCircle size={14} /> {pending.length} request{pending.length > 1 ? 's' : ''} pending approval
        </div>
      )}

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
              <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>Customer</th>
              <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>Medication</th>
              <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>Date</th>
              <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>Status</th>
              <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '10px 12px', color: '#94a3b8', textAlign: 'center', padding: 30 }}>No pharmacy requests found.</td></tr>
              ) : (
                filteredRequests.map((r, i) => {
                const sc = statusColors[r.status] || { bg: '#f1f5f9', text: '#64748b', label: r.status };
                const isPending = r.status === 'pending';
                const isRejecting = rejectId === r.id;
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', background: isPending ? '#fffbeb' : '#fff' }}>
                    <td style={{ padding: '10px 12px', color: '#334155' }}>{i + 1}</td>
                    <td style={{ padding: '10px 12px', color: '#334155', fontWeight: 600 }}>{r.request_number}</td>
                    <td style={{ padding: '10px 12px', color: '#334155' }}>{r.customer_name || r.customer_phone || '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#334155' }}>{r.medication_name || '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#334155' }}>{r.requested_at ? new Date(r.requested_at).toLocaleDateString() : '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#334155' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: sc.text, fontWeight: 600, fontSize: 12, background: sc.bg, padding: '3px 10px', borderRadius: 20 }}>{sc.label}</span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#334155' }}>
                      {isPending && !isRejecting && (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <button onClick={() => approve(r.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#16a34a', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                            <CheckCircle size={14} /> Approve
                          </button>
                          <button onClick={() => { setRejectId(r.id); setRejectReason(''); }} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#dc2626', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                            <XCircle size={14} /> Reject
                          </button>
                        </div>
                      )}
                      {isPending && isRejecting && (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input type="text" placeholder="Rejection reason..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12, width: 180 }} />
                          <button onClick={() => reject(r.id)} disabled={!rejectReason.trim()} style={{ background: rejectReason.trim() ? '#dc2626' : '#fca5a5', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: rejectReason.trim() ? 'pointer' : 'not-allowed' }}>
                            Confirm
                          </button>
                          <button onClick={() => setRejectId(null)} style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '6px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                        </div>
                      )}
                      {r.status === 'ready_for_pickup' && (
                        <button onClick={() => ship(r.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#2563eb', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          <Truck size={14} /> Ship
                        </button>
                      )}
                      {r.status === 'picked_up' && (
                        <button onClick={() => receive(r.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#7c3aed', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          <PackageCheck size={14} /> Receive
                        </button>
                      )}
                      {r.status === 'rejected' && <span style={{ color: '#dc2626', fontSize: 12 }}>{r.rejection_reason ? `Rejected: ${r.rejection_reason}` : 'Rejected'}</span>}
                      {['approved', 'delivered'].includes(r.status) && <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
