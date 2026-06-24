import React, { useState, useEffect } from 'react';
import axios from '../../services/apiClient';
import { ClipboardList, Send, Eye, X, FileText, Upload } from 'lucide-react';

const STATUS_COLORS = {
  PENDING_CEO: '#f59e0b',
  MARKET_STUDY: '#3b82f6',
  RESULTS_SUBMITTED: '#8b5cf6',
  APPROVED: '#10b981',
  REJECTED: '#ef4444',
};

const MarketPurchaseResearch = () => {
  const [requests, setRequests] = useState([]);
  const [detail, setDetail] = useState(null);
  const [submitId, setSubmitId] = useState(null);
  const [form, setForm] = useState({ prices: '', suppliers: '', quality: '', availability: '', notes: '' });
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const load = async () => {
    try {
      const res = await axios.get('/store/purchase-research');
      if (res.status === 'success') setRequests(res.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, []);

  const viewDetail = async (id) => {
    try {
      const res = await axios.get(`/store/purchase-research/${id}`);
      if (res.status === 'success') setDetail(res.data);
    } catch (e) { console.error(e); }
  };

  const openSubmit = (id) => {
    setSubmitId(id);
    setForm({ prices: '', suppliers: '', quality: '', availability: '', notes: '' });
    setFiles([]);
    setAttachments([]);
  };

  const activeTasks = requests.filter(r => r.status === 'MARKET_STUDY');
  const submittedTasks = requests.filter(r => r.status === 'RESULTS_SUBMITTED');
  const otherTasks = requests.filter(r => !['MARKET_STUDY', 'RESULTS_SUBMITTED'].includes(r.status));

  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
  };

  const uploadFiles = async () => {
    if (files.length === 0) return [];
    setUploading(true);
    const uploaded = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await axios.post('/store/purchase-research/upload', fd);
        if (res.status === 'success') uploaded.push(res.data);
      } catch (e) { console.error('Upload failed', e); }
    }
    setUploading(false);
    return uploaded;
  };

  const submitFindings = async () => {
    const uploaded = await uploadFiles();
    const body = {
      status: 'RESULTS_SUBMITTED',
      research_prices: form.prices,
      research_suppliers: form.suppliers,
      research_quality: form.quality,
      research_availability: form.availability,
      research_notes: form.notes,
    };
    if (uploaded.length > 0) body.research_attachments = uploaded;
    try {
      await axios.patch(`/store/purchase-research/${submitId}/status`, body);
      setSubmitId(null);
      setMsg('Research findings submitted to CEO');
      setTimeout(() => setMsg(null), 4000);
      load();
    } catch (e) { setErr(e.message || 'Error submitting findings'); setTimeout(() => setErr(null), 4000); }
  };

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
              <th style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>Instructions</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>Date</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>Status</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r, i) => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6', background: r.status === 'MARKET_STUDY' ? '#eff6ff' : 'transparent' }}>
                <td style={{ padding: '10px 12px', color: '#6b7280' }}>{i + 1}</td>
                <td style={{ padding: '10px 12px', fontWeight: 500 }}>{r.request_number}</td>
                <td style={{ padding: '10px 12px' }}>{r.product_name}</td>
                <td style={{ padding: '10px 12px' }}>{r.quantity_requested}</td>
                <td style={{ padding: '10px 12px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.ceo_instructions || '-'}</td>
                <td style={{ padding: '10px 12px', color: '#6b7280', fontSize: 13 }}>{new Date(r.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, color: '#fff', background: STATUS_COLORS[r.status] || '#6b7280' }}>{r.status}</span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => viewDetail(r.id)} style={{ background: 'none', border: '1px solid #d1d5db', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}><Eye size={12} style={{ marginRight: 4 }} />View</button>
                    {r.status === 'MARKET_STUDY' && (
                      <button onClick={() => openSubmit(r.id)} style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}><Send size={12} style={{ marginRight: 4 }} />Submit Findings</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>No requests in this section</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}><ClipboardList size={20} style={{ marginRight: 8 }} />Purchase Research Tasks</h2>
        <button onClick={load} style={{ background: 'none', border: '1px solid #d1d5db', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>Refresh</button>
      </div>

      {renderTable(activeTasks, `Active Tasks — Research Pending (${activeTasks.length})`)}
      {renderTable(submittedTasks, `Submitted to CEO (${submittedTasks.length})`)}
      {renderTable(otherTasks, 'Other Requests')}

      {submitId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setSubmitId(null)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 520, width: '90%', maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 4px' }}>Submit Research Findings</h3>
            {(() => { const req = requests.find(r => r.id === submitId); return req ? <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280' }}>{req.request_number} — {req.product_name}</p> : null; })()}

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 13, color: '#374151' }}>Prices</label>
              <textarea value={form.prices} onChange={e => setForm({ ...form, prices: e.target.value })} rows={2} placeholder="Price quotes, comparisons, unit costs..." style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, resize: 'vertical' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 13, color: '#374151' }}>Suppliers</label>
              <textarea value={form.suppliers} onChange={e => setForm({ ...form, suppliers: e.target.value })} rows={2} placeholder="Supplier names, contact info, lead times..." style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, resize: 'vertical' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 13, color: '#374151' }}>Quality</label>
              <textarea value={form.quality} onChange={e => setForm({ ...form, quality: e.target.value })} rows={2} placeholder="Product quality assessment, certifications, samples..." style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, resize: 'vertical' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 13, color: '#374151' }}>Availability</label>
              <textarea value={form.availability} onChange={e => setForm({ ...form, availability: e.target.value })} rows={2} placeholder="Stock availability, delivery timelines, minimum orders..." style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, resize: 'vertical' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 13, color: '#374151' }}>Additional Notes</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Any other relevant information..." style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, resize: 'vertical' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 13, color: '#374151' }}>Attachments (optional)</label>
              <div style={{ border: '1px dashed #d1d5db', borderRadius: 6, padding: 12, textAlign: 'center', background: '#f9fafb' }}>
                <input type="file" multiple onChange={handleFileChange} style={{ fontSize: 13 }} />
                {files.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>{files.length} file(s) selected</div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setSubmitId(null)} style={{ background: '#6b7280', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
              <button onClick={submitFindings} disabled={uploading} style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 6, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, opacity: uploading ? 0.6 : 1 }}>
                {uploading ? <><Upload size={14} /> Uploading...</> : <><Send size={14} /> Submit to CEO</>}
              </button>
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
                  ['Current Stock', detail.current_stock],
                  ['Reason', detail.reason || '-'],
                  ['CEO Instructions', detail.ceo_instructions || '-'],
                  ['Status', detail.status],
                  ['Research : Prices', detail.research_prices || '-'],
                  ['Research : Suppliers', detail.research_suppliers || '-'],
                  ['Research : Quality', detail.research_quality || '-'],
                  ['Research : Availability', detail.research_availability || '-'],
                  ['Research : Notes', detail.research_notes || '-'],
                  ['Attachments', detail.research_attachments ? (JSON.parse(detail.research_attachments) || []).map((a, i) => <div key={i}><a href={a.url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>{a.originalName || a.filename || `File ${i + 1}`}</a></div>) : '-'],
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

export default MarketPurchaseResearch;
