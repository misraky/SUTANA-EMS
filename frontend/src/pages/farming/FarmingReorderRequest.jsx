import React, { useState, useEffect } from 'react';
import axios from '../../services/apiClient';
import { ShoppingCart, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FarmingReorderRequest() {
  const nav = useNavigate();
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    axios.get('/farming/admin/products?include_inactive=false')
      .then(r => setProducts((r.data || r)?.filter(p => p.is_active !== false) || []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productId || !qty) { setErr('Select a product and enter quantity'); setTimeout(() => setErr(null), 4000); return; }
    setSubmitting(true); setErr(null); setMsg(null);
    try {
      await axios.post('/farming/reorder-requests', { product_id: parseInt(productId), quantity_requested: parseInt(qty), notes });
      setMsg('Reorder request submitted successfully');
      setTimeout(() => setMsg(null), 4000);
      setProductId(''); setQty(''); setNotes('');
    } catch (e) { setErr(e.response?.data?.message || e.message); setTimeout(() => setErr(null), 4000); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '1.5rem 2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><ArrowLeft size={18} /></button>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ShoppingCart size={18} color="#166534" /> Create Reorder Request
        </h2>
      </div>

      {msg && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 12, marginBottom: 16, color: '#16a34a', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle size={14} />{msg}</div>}
      {err && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, marginBottom: 16, color: '#dc2626', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><AlertCircle size={14} />{err}</div>}

      <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Product *</label>
          <select value={productId} onChange={e => { setProductId(e.target.value); const p = products.find(x => x.id === parseInt(e.target.value)); if (p) setQty(Math.max(p.reorder_level * 2, 10)); }} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}>
            <option value="">Select product</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock_quantity || 0})</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Suggested Quantity *</label>
          <input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, resize: 'vertical' }} />
        </div>
        <button type="submit" disabled={submitting} style={{ width: '100%', padding: '12px', background: '#166534', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}>
          {submitting ? 'Submitting...' : 'Submit Reorder Request'}
        </button>
      </form>
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
}
