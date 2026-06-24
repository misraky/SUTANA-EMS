import React, { useState, useRef, useEffect } from 'react';
import axios from '../../services/apiClient';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';

const inputS = { width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' };

const Field = ({ label, required, children }) => (
  <div style={{ marginBottom: '1rem' }}>
    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{label}{required && ' *'}</label>
    {children}
  </div>
);

const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10, background: type === 'success' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${type === 'success' ? '#bbf7d0' : '#fecaca'}`, borderRadius: 10, padding: '12px 18px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', maxWidth: 400 }}>
      {type === 'success' ? <CheckCircle size={18} color="#16a34a" /> : <AlertCircle size={18} color="#dc2626" />}
      <span style={{ fontSize: 13, color: type === 'success' ? '#166534' : '#991b1b', flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}><X size={14} /></button>
    </div>
  );
};

const PurchaseTenderPage = () => {
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const notify = (message, type = 'success') => setToast({ message, type });

  const [form, setForm] = useState({ title: '', description: '', category: '', item_name: '', quantity: '', starting_bid_price: '', deadline: '', terms_conditions: '' });
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const fileRef = useRef(null);

  const handleFileChange = (e) => {
    const incoming = Array.from(e.target.files || []);
    const remaining = 5 - files.length;
    const toAdd = incoming.slice(0, remaining);
    setFiles(prev => [...prev, ...toAdd]);
    setPreviews(prev => [...prev, ...toAdd.map(f => ({ name: f.name, size: f.size }))]);
    if (e.target) e.target.value = '';
  };

  const removeFile = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      files.forEach(f => fd.append('attachments', f));
      await axios.post('/tenders', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      notify('Purchase tender posted successfully!');
      setForm({ title: '', description: '', category: '', item_name: '', quantity: '', starting_bid_price: '', deadline: '', terms_conditions: '' });
      setFiles([]);
      setPreviews([]);
    } catch (err) {
      notify(err?.response?.data?.message || err.message || 'Failed to create tender', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Post Purchase Tender</h2>
      <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 1.5rem' }}>Create a tender to solicit bids from suppliers for procurement needs.</p>

      <form onSubmit={handleSubmit} encType="multipart/form-data" style={{ background: 'white', borderRadius: 12, padding: '1.5rem', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Field label="Title" required>
            <input style={inputS} required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Supply of Office Furniture" />
          </Field>
          <Field label="Category">
            <input style={inputS} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Construction, Supplies" />
          </Field>
          <Field label="Item Name">
            <input style={inputS} value={form.item_name} onChange={e => setForm({ ...form, item_name: e.target.value })} placeholder="e.g. Office Desks" />
          </Field>
          <Field label="Quantity" required>
            <input style={inputS} type="number" min="1" required value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="e.g. 50" />
          </Field>
          <Field label="Starting Bid Price (ETB)" required>
            <input style={inputS} type="number" step="0.01" min="0" required value={form.starting_bid_price} onChange={e => setForm({ ...form, starting_bid_price: e.target.value })} placeholder="e.g. 50000" />
          </Field>
          <Field label="Deadline" required>
            <input style={inputS} type="datetime-local" required value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
          </Field>
        </div>
        <Field label="Description" required>
          <textarea style={{ ...inputS, resize: 'vertical' }} rows={3} required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Detailed description of what you need to purchase..." />
        </Field>
        <Field label="Terms &amp; Conditions" required>
          <textarea style={{ ...inputS, resize: 'vertical' }} rows={3} required value={form.terms_conditions} onChange={e => setForm({ ...form, terms_conditions: e.target.value })} placeholder="Payment terms, delivery requirements, quality standards..." />
        </Field>
        <Field label="Attachments (PDF, JPG, PNG — max 5 files)">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => fileRef.current?.click()} disabled={files.length >= 5} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', border: '1.5px dashed #cbd5e1', padding: '9px 14px', borderRadius: 8, cursor: files.length >= 5 ? 'not-allowed' : 'pointer', fontSize: 12, color: files.length >= 5 ? '#94a3b8' : '#475569' }}>
              <Upload size={14} /> {files.length >= 5 ? 'Max files reached' : 'Upload Files'}
            </button>
            <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.gif" onChange={handleFileChange} style={{ display: 'none' }} />
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{files.length}/5 files</span>
          </div>
          {previews.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {previews.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', borderRadius: 6, padding: '6px 10px', border: '1px solid #e2e8f0', fontSize: 12 }}>
                  <span style={{ color: '#374151' }}>{f.name}</span>
                  <button type="button" onClick={() => removeFile(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 0, display: 'flex' }}><X size={12} /></button>
                </div>
              ))}
            </div>
          )}
        </Field>
        <button type="submit" disabled={saving} style={{ width: '100%', background: '#2563eb', color: 'white', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', fontSize: 14, opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Posting...' : 'Post Purchase Tender'}
        </button>
      </form>
    </div>
  );
};

export default PurchaseTenderPage;
