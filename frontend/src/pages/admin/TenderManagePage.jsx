import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../services/apiClient';
import { Plus, Edit3, Send, Check, X, Clock, AlertTriangle, Award, Download, Eye, Search, FileText, ArrowLeft } from 'lucide-react';

const shimmerKeyframes = `
@keyframes shimmer { 0% { background-position: -200px 0 } 100% { background-position: calc(200px + 100%) 0 } }
`;

const STATUS_STYLES = {
  draft: { bg: '#f1f5f9', color: '#64748b' },
  open: { bg: '#d1fae5', color: '#065f46' },
  closed: { bg: '#fef3c7', color: '#92400e' },
  awarded: { bg: '#dbeafe', color: '#1e40af' },
  cancelled: { bg: '#fee2e2', color: '#991b1b' },
  pending_approval: { bg: '#fef3c7', color: '#92400e' },
};

export default function TenderManagePage() {
  const [tab, setTab] = useState('list');
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTender, setSelectedTender] = useState(null);
  const [bids, setBids] = useState([]);
  const [message, setMessage] = useState(null);

  const [form, setForm] = useState({
    title: '', description: '', category: '', item_name: '', quantity: '', starting_bid_price: '', deadline: '', terms_conditions: '',
  });
  const [editId, setEditId] = useState(null);
  const [files, setFiles] = useState(null);
  const [saving, setSaving] = useState(false);
  const [extendDate, setExtendDate] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [selectedBids, setSelectedBids] = useState([]);
  const [bidEval, setBidEval] = useState({});

  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();
  const isCEOorAdmin = user?.role === 'CEO' || user?.role === 'Admin';

  const fetchTenders = useCallback(async () => {
    try { setLoading(true); const r = await axios.get('/tenders'); if (r.status === 'success') setTenders(r.data); }
    catch (_) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTenders(); }, [fetchTenders]);

  const fetchBids = useCallback(async (tenderId) => {
    try { const r = await axios.get(`/tenders/${tenderId}/bids`); if (r.status === 'success') setBids(r.data); }
    catch (_) { setBids([]); }
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSelect = async (t) => {
    setSelectedTender(t);
    setSelectedBids([]);
    setCancelReason('');
    setExtendDate('');
    await fetchBids(t.id);
  };

  const handleFormChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleNew = () => {
    setEditId(null);
    setForm({ title: '', description: '', category: '', item_name: '', quantity: '', starting_bid_price: '', deadline: '', terms_conditions: '' });
    setFiles(null);
    setTab('form');
  };

  const handleEdit = (t) => {
    setEditId(t.id);
    setForm({
      title: t.title, description: t.description, category: t.category || '', item_name: t.item_name || '',
      quantity: t.quantity, starting_bid_price: t.starting_bid_price, deadline: t.deadline ? new Date(t.deadline).toISOString().slice(0, 16) : '',
      terms_conditions: t.terms_conditions,
    });
    setFiles(null);
    setTab('form');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (files) for (const f of files) fd.append('attachments', f);
      const url = editId ? `/tenders/${editId}` : '/tenders';
      const method = editId ? 'put' : 'post';
      const r = await axios[method](url, fd);
      if (r.status === 'success') { showMessage('success', editId ? 'Tender updated' : 'Tender created'); setTab('list'); fetchTenders(); }
    } catch (err) { showMessage('error', err.message); }
    finally { setSaving(false); }
  };

  const handlePublish = async (id) => {
    try { const r = await axios.put(`/tenders/${id}/publish`); if (r.status === 'success') { showMessage('success', 'Published'); fetchTenders(); setSelectedTender(null); } }
    catch (err) { showMessage('error', err.message); }
  };

  const handleApprove = async (id) => {
    try { const r = await axios.put(`/tenders/${id}/approve`); if (r.status === 'success') { showMessage('success', 'Approved'); fetchTenders(); setSelectedTender(null); } }
    catch (err) { showMessage('error', err.message); }
  };

  const handleClose = async (id) => {
    try { const r = await axios.put(`/tenders/${id}/close`); if (r.status === 'success') { showMessage('success', 'Closed'); fetchTenders(); setSelectedTender(null); } }
    catch (err) { showMessage('error', err.message); }
  };

  const handleExtend = async () => {
    if (!extendDate) return;
    try { const r = await axios.put(`/tenders/${selectedTender.id}/extend`, { deadline: extendDate }); if (r.status === 'success') { showMessage('success', 'Deadline extended'); fetchTenders(); setExtendDate(''); } }
    catch (err) { showMessage('error', err.message); }
  };

  const handleCancel = async () => {
    if (!cancelReason) return;
    try { const r = await axios.put(`/tenders/${selectedTender.id}/cancel`, { reason: cancelReason }); if (r.status === 'success') { showMessage('success', 'Tender cancelled'); fetchTenders(); setSelectedTender(null); } }
    catch (err) { showMessage('error', err.message); }
  };

  const handleEvaluate = async (bidId, field, value) => {
    try { const r = await axios.put(`/tenders/bids/${bidId}/evaluate`, { [field]: value }); if (r.status === 'success') { showMessage('success', 'Evaluation updated'); await fetchBids(selectedTender.id); } }
    catch (err) { showMessage('error', err.message); }
  };

  const handleDisqualify = async (bidId) => {
    const reason = prompt('Disqualification reason:');
    if (!reason) return;
    try { const r = await axios.put(`/tenders/bids/${bidId}/disqualify`, { reason }); if (r.status === 'success') { showMessage('success', 'Bid disqualified'); await fetchBids(selectedTender.id); } }
    catch (err) { showMessage('error', err.message); }
  };

  const handleAward = async () => {
    if (!selectedBids.length) return showMessage('error', 'Select at least one bid to award');
    try {
      const r = await axios.put(`/tenders/${selectedTender.id}/award`, { bid_ids: selectedBids });
      if (r.status === 'success') { showMessage('success', r.message || 'Bid(s) awarded'); fetchTenders(); setSelectedTender(null); }
    } catch (err) { showMessage('error', err.message); }
  };

  const filteredTenders = tenders.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return t.title.toLowerCase().includes(q) || t.reference_number?.toLowerCase().includes(q);
  });

  return (<>
    <style>{shimmerKeyframes}</style>
    <div style={{ maxWidth: '95vw', margin: '0 auto', padding: '24px 20px 60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>Tender Management</h1>
        <button onClick={handleNew} style={{
          padding: '8px 18px', background: '#059669', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}><Plus size={16} /> New Tender</button>
      </div>

      {message && (
        <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, background: message.type === 'success' ? '#d1fae5' : '#fee2e2', color: message.type === 'success' ? '#065f46' : '#991b1b', fontSize: 13 }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {['list', 'form'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
              background: tab === t ? '#059669' : '#f1f5f9', color: tab === t ? 'white' : '#64748b', textTransform: 'capitalize',
            }}>
            {t === 'list' ? 'All Tenders' : 'Create / Edit'}
          </button>
        ))}
      </div>

      {tab === 'list' && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', flex: 1, maxWidth: 400 }}>
              <Search size={16} color="#94a3b8" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tenders..."
                style={{ border: 'none', outline: 'none', flex: 1, fontSize: 13, color: '#0f172a', background: 'transparent' }} />
            </div>
          </div>

          {loading ? (
            <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0' }}>
              {[1,2,3,4,5].map(i => <div key={i} style={{ height: 48, marginBottom: 8, borderRadius: 8, background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />)}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 20, flexDirection: 'column' }}>
              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 700 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      {['Ref', 'Title', 'Status', 'Item', 'Price', 'Deadline', 'Actions'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 12, textTransform: 'uppercase' }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTenders.map(t => {
                      const st = STATUS_STYLES[t.status] || {};
                      return (
                        <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: selectedTender?.id === t.id ? '#f0fdf4' : 'transparent' }}
                          onClick={() => handleSelect(t)}>
                          <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#475569' }}>{t.reference_number || `#${t.id}`}</td>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>{t.title}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, textTransform: 'capitalize', ...st }}>{t.status.replace('_', ' ')}</span>
                          </td>
                          <td style={{ padding: '10px 14px', color: '#64748b' }}>{t.item_name || '-'}</td>
                          <td style={{ padding: '10px 14px', color: '#059669', fontWeight: 600 }}>{parseFloat(t.starting_bid_price).toLocaleString()}</td>
                          <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 12 }}>{t.deadline ? new Date(t.deadline).toLocaleDateString('en-CA') : '-'}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                              {t.status === 'draft' && <>
                                <button onClick={() => handlePublish(t.id)} className="tip-wrap" style={btnSm('#059669')}><Send size={14} /><span className="tip tip-top" style={{ left: '50%', transform: 'translateX(-50%)' }}>Publish</span></button>
                                <button onClick={() => handleEdit(t)} className="tip-wrap" style={btnSm('#3b82f6')}><Edit3 size={14} /><span className="tip tip-top" style={{ left: '50%', transform: 'translateX(-50%)' }}>Edit</span></button>
                              </>}
                              {t.status === 'pending_approval' && isCEOorAdmin && (
                                <button onClick={() => handleApprove(t.id)} className="tip-wrap" style={btnSm('#059669')}><Check size={14} /><span className="tip tip-top" style={{ left: '50%', transform: 'translateX(-50%)' }}>Approve</span></button>
                              )}
                              {t.status === 'open' && <>
                                <button onClick={() => handleClose(t.id)} className="tip-wrap" style={btnSm('#f59e0b')}><Clock size={14} /><span className="tip tip-top" style={{ left: '50%', transform: 'translateX(-50%)' }}>Close</span></button>
                                <button onClick={() => handleEdit(t)} className="tip-wrap" style={btnSm('#3b82f6')}><Edit3 size={14} /><span className="tip tip-top" style={{ left: '50%', transform: 'translateX(-50%)' }}>Edit</span></button>
                              </>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredTenders.length === 0 && <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>No tenders found</td></tr>}
                  </tbody>
                </table>
              </div>

              {selectedTender && (
                <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                      {selectedTender.reference_number} — {selectedTender.title}
                    </h3>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {selectedTender.status === 'open' && <>
                        <input type="datetime-local" value={extendDate} onChange={e => setExtendDate(e.target.value)}
                          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12 }} />
                        <button onClick={handleExtend} style={btnSm('#3b82f6')} disabled={!extendDate}>Extend</button>
                      </>}
                      {['draft', 'open', 'closed'].includes(selectedTender.status) && (
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <input value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Cancel reason..."
                            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12, width: 180 }} />
                          <button onClick={handleCancel} style={btnSm('#dc2626')} disabled={!cancelReason}>
                            <AlertTriangle size={14} /> Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                    {['closed', 'open'].includes(selectedTender.status) && (
                      <button onClick={handleAward} style={{
                        padding: '8px 18px', background: '#059669', color: 'white', border: 'none', borderRadius: 8,
                        fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                      }} disabled={!selectedBids.length}>
                        <Award size={16} /> Award Selected ({selectedBids.length})
                      </button>
                    )}
                  </div>

                  <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>Bids ({bids.length})</h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 650 }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          {selectedTender.status !== 'awarded' && <th style={{ width: 40, padding: '8px 12px' }}><input type="checkbox" onChange={e => { if (e.target.checked) setSelectedBids(bids.filter(b => b.status !== 'disqualified').map(b => b.id)); else setSelectedBids([]); }} /></th>}
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase' }}>Customer</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase' }}>Price/Unit</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase' }}>Qty</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase' }}>Total</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase' }}>Status</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase' }}>Evaluation</th>
                          <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bids.map(b => (
                          <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9', background: b.status === 'disqualified' ? '#fef2f2' : b.status === 'awarded' ? '#f0fdf4' : 'transparent' }}>
                            {selectedTender.status !== 'awarded' && (
                              <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                <input type="checkbox" checked={selectedBids.includes(b.id)}
                                  disabled={b.status === 'disqualified'}
                                  onChange={e => setSelectedBids(prev => e.target.checked ? [...prev, b.id] : prev.filter(x => x !== b.id))} />
                              </td>
                            )}
                            <td style={{ padding: '8px 12px' }}>
                              <div style={{ fontWeight: 600, color: '#0f172a' }}>{b.customer_name || `User #${b.customer_id}`}</div>
                              <div style={{ fontSize: 11, color: '#94a3b8' }}>{b.customer_email}</div>
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#059669' }}>{parseFloat(b.bid_price_per_unit).toLocaleString()}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', color: '#475569' }}>{b.quantity_requested}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>{parseFloat(b.total_bid_value).toLocaleString()}</td>
                            <td style={{ padding: '8px 12px' }}>
                              <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, textTransform: 'capitalize',
                                background: b.status === 'awarded' ? '#d1fae5' : b.status === 'disqualified' ? '#fee2e2' : b.status === 'not_selected' ? '#fef3c7' : '#f1f5f9',
                                color: b.status === 'awarded' ? '#065f46' : b.status === 'disqualified' ? '#991b1b' : b.status === 'not_selected' ? '#92400e' : '#64748b',
                              }}>{b.status.replace('_', ' ')}</span>
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <select value={b.evaluation_label || ''} onChange={e => handleEvaluate(b.id, 'evaluation_label', e.target.value)}
                                style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12, width: '100%' }}>
                                <option value="">None</option>
                                <option value="shortlisted">Shortlisted</option>
                                <option value="highest">Highest</option>
                                <option value="lowest">Lowest</option>
                                <option value="disqualified">Disqualified</option>
                              </select>
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                                {b.status !== 'disqualified' && b.status !== 'awarded' && (
                                  <button onClick={() => handleDisqualify(b.id)} className="tip-wrap" style={btnSm('#dc2626')}>
                                    <X size={14} /><span className="tip tip-top" style={{ left: '50%', transform: 'translateX(-50%)' }}>Disqualify</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {bids.length === 0 && <tr><td colSpan={selectedTender.status === 'awarded' ? 7 : 8} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>No bids yet</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {tab === 'form' && (
        <form onSubmit={handleSave} style={{ background: 'white', borderRadius: 12, padding: 24, border: '1px solid #e2e8f0', maxWidth: 700 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 20px' }}>{editId ? 'Edit Tender' : 'Create New Tender'}</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Title *</label>
              <input required name="title" value={form.title} onChange={handleFormChange}
                style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Description *</label>
            <textarea required name="description" value={form.description} onChange={handleFormChange} rows={4}
              style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Category</label>
              <input name="category" value={form.category} onChange={handleFormChange} placeholder="e.g. Printing, Supplies"
                style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Item Name</label>
              <input name="item_name" value={form.item_name} onChange={handleFormChange} placeholder="e.g. A4 Paper"
                style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Quantity *</label>
              <input required type="number" min="1" name="quantity" value={form.quantity} onChange={handleFormChange}
                style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Starting Bid Price (ETB) *</label>
              <input required type="number" step="0.01" min="0" name="starting_bid_price" value={form.starting_bid_price} onChange={handleFormChange}
                style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Deadline *</label>
            <input required type="datetime-local" name="deadline" value={form.deadline} onChange={handleFormChange}
              style={inputStyle} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Terms &amp; Conditions *</label>
            <textarea required name="terms_conditions" value={form.terms_conditions} onChange={handleFormChange} rows={5}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Attachments (PDF/JPG/PNG, max 10MB each, up to 5)</label>
            <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.gif" onChange={e => setFiles(e.target.files)}
              style={{ fontSize: 13 }} />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={saving} style={{
              padding: '10px 24px', background: '#059669', color: 'white', border: 'none', borderRadius: 8,
              fontWeight: 600, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
            }}>
              {saving ? 'Saving...' : editId ? 'Update Tender' : 'Create Tender'}
            </button>
            <button type="button" onClick={() => setTab('list')} style={{
              padding: '10px 24px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  </>);
}

const inputStyle = {
  width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box',
};

const btnSm = (color) => ({
  padding: '6px 10px', background: color, color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4,
});
