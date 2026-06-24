import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../services/apiClient';
import { Search, Filter, Mail, CheckCircle, XCircle, Send, Download, Eye, MessageSquare, User, Calendar } from 'lucide-react';

const STATUS_STYLES = {
  unread: { bg: '#dbeafe', color: '#1e40af', icon: '🔵' },
  read: { bg: '#d1fae5', color: '#065f46', icon: '🟢' },
  replied: { bg: '#fef3c7', color: '#92400e', icon: '✅' },
  closed: { bg: '#f1f5f9', color: '#64748b', icon: '✅' },
};

const DEPARTMENTS = ['', 'General Inquiry', 'Sales', 'Support', 'Complaint', 'Partnership'];

export default function ContactMessagesManager() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [detail, setDetail] = useState(null);
  const [replyBody, setReplyBody] = useState('');

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterDept) params.set('department', filterDept);
      if (filterStatus) params.set('status', filterStatus);
      if (search) params.set('search', search);
      const r = await axios.get(`/contact?${params}`);
      if (r.status === 'success') setMessages(r.data);
    } catch (_) {} finally { setLoading(false); }
  }, [filterDept, filterStatus, search]);

  useEffect(() => { fetch(); }, [fetch]);

  const viewDetail = async (msg) => {
    try { const r = await axios.get(`/contact/${msg.id}`); if (r.status === 'success') setDetail(r.data); }
    catch (_) { setDetail(msg); }
  };

  const handleReply = async () => {
    if (!replyBody.trim()) return;
    try { const r = await axios.put(`/contact/${detail.id}/reply`, { reply_body: replyBody }); if (r.status === 'success') { setReplyBody(''); setDetail(null); fetch(); } }
    catch (_) {}
  };

  const handleClose = async (id) => {
    try { const r = await axios.put(`/contact/${id}/close`); if (r.status === 'success') { setDetail(null); fetch(); } }
    catch (_) {}
  };

  const handleBulk = async (action) => {
    if (!selected.length) return;
    try { const r = await axios.post('/contact/bulk', { ids: selected, action }); if (r.status === 'success') { setSelected([]); fetch(); } }
    catch (_) {}
  };

  const filtered = messages.filter(m => {
    if (filterDept && m.department !== filterDept) return false;
    if (filterStatus && m.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return m.full_name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.subject.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>Contact Messages</h2>
        <a href="/api/v1/contact/export/csv" target="_blank" rel="noopener noreferrer" style={{
          padding: '8px 16px', background: '#f1f5f9', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: 8,
          fontWeight: 600, fontSize: 13, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
        }}><Download size={14} /> Export CSV</a>
      </div>

      {selected.length > 0 && (
        <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center', padding: '8px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{selected.length} selected</span>
          <button onClick={() => handleBulk('read')} style={btnSm('#3b82f6')}>Mark Read</button>
          <button onClick={() => handleBulk('close')} style={btnSm('#64748b')}>Close</button>
          <button onClick={() => setSelected([])} style={btnSm('#ef4444')}>Clear</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', flex: 1, maxWidth: 300 }}>
          <Search size={16} color="#94a3b8" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            style={{ border: 'none', outline: 'none', flex: 1, fontSize: 13, background: 'transparent' }} />
        </div>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={selectStyle}>
          <option value="">All Departments</option>
          {DEPARTMENTS.filter(Boolean).map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selectStyle}>
          <option value="">All Status</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
          <option value="replied">Replied</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {loading ? (
        <p style={{ color: '#94a3b8' }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem 0' }}>No messages found.</p>
      ) : (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 700 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ width: 36, padding: '10px 12px' }}><input type="checkbox" onChange={e => setSelected(e.target.checked ? filtered.map(m => m.id) : [])} checked={selected.length === filtered.length && filtered.length > 0} /></th>
                {['Status', 'Date', 'From', 'Department', 'Subject', 'Action'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => {
                const st = STATUS_STYLES[m.status] || {};
                return (
                  <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9', background: m.status === 'unread' ? '#f8fafc' : 'white' }}>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <input type="checkbox" checked={selected.includes(m.id)} onChange={e => setSelected(prev => e.target.checked ? [...prev, m.id] : prev.filter(x => x !== m.id))} />
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, ...st }}>
                        {st.icon} {m.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>{new Date(m.created_at).toLocaleDateString('en-CA')}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{m.full_name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{m.email}</div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: '#f1f5f9', color: '#475569' }}>{m.department}</span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#475569', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.subject}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <button onClick={() => viewDetail(m)} style={btnSm('#3b82f6')}><Eye size={14} /> View</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {detail && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }} onClick={e => { if (e.target === e.currentTarget) setDetail(null); }}>
          <div style={{ background: 'white', borderRadius: 12, maxWidth: 600, width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: 28, position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <button onClick={() => setDetail(null)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><XCircle size={20} /></button>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, color: '#1e293b' }}>Message Detail</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, fontSize: 13 }}>
              <div><span style={{ color: '#64748b' }}>From:</span> <strong>{detail.full_name}</strong></div>
              <div><span style={{ color: '#64748b' }}>Email:</span> <strong>{detail.email}</strong></div>
              <div><span style={{ color: '#64748b' }}>Phone:</span> <strong>{detail.phone || '—'}</strong></div>
              <div><span style={{ color: '#64748b' }}>Department:</span> <strong>{detail.department}</strong></div>
              <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#64748b' }}>Subject:</span> <strong>{detail.subject}</strong></div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ color: '#64748b' }}>Date:</span> <strong>{new Date(detail.created_at).toLocaleString()}</strong>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Message</label>
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: 14, fontSize: 13, color: '#1e293b', lineHeight: 1.6, maxHeight: 200, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                {detail.message}
              </div>
            </div>

            {detail.attachment && (
              <div style={{ marginBottom: 16 }}>
                <a href={`/uploads/contact/${detail.attachment}`} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#f1f5f9', borderRadius: 8, fontSize: 13, color: '#0f172a', textDecoration: 'none' }}>
                  <Download size={14} /> {detail.attachment}
                </a>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <button onClick={() => handleClose(detail.id)} style={btnSm('#64748b')}><XCircle size={14} /> Close</button>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Reply</label>
              <textarea value={replyBody} onChange={e => setReplyBody(e.target.value)} rows={4} placeholder="Type your reply..."
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box', resize: 'vertical', marginBottom: 8 }} />
              <button onClick={handleReply} disabled={!replyBody.trim()} style={{
                padding: '8px 20px', background: replyBody.trim() ? '#1E3A5F' : '#e2e8f0', color: 'white', border: 'none', borderRadius: 8,
                fontWeight: 600, fontSize: 13, cursor: replyBody.trim() ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 6,
              }}><Send size={14} /> Send Reply</button>
            </div>

            {detail.admin_notes && (
              <div style={{ marginTop: 16, padding: 12, background: '#fef3c7', borderRadius: 8, fontSize: 13, color: '#92400e' }}>
                <strong>Admin Notes:</strong> {detail.admin_notes}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const btnSm = (color) => ({
  padding: '6px 12px', background: color, color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4,
});

const selectStyle = {
  padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', background: 'white',
};
