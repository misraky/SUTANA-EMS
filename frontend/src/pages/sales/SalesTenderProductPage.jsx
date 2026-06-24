import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from '../../services/apiClient';
import { Megaphone, Package, Upload, X, CheckCircle, AlertCircle, Edit3, Trash2, RefreshCw, Search } from 'lucide-react';

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

const btn = (bg, label, icon, onClick, disabled) => (
  <button onClick={onClick} disabled={disabled} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: bg, color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600, opacity: disabled ? 0.6 : 1 }}>
    {icon}{label}
  </button>
);

const SalesTenderProductPage = ({ initialTab, initialSubtab, hideHeader }) => {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(initialTab || (searchParams.get('tab') === 'product' ? 'product' : 'tender'));
  const [subtab, setSubtab] = useState(initialSubtab || 'create');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [categories, setCategories] = useState([]);
  const notify = (message, type = 'success') => setToast({ message, type });

  const [tenderForm, setTenderForm] = useState({ title: '', description: '', category: '', item_name: '', quantity: '', starting_bid_price: '', deadline: '', terms_conditions: '' });
  const [tenderFiles, setTenderFiles] = useState([]);
  const [tenderPreviews, setTenderPreviews] = useState([]);
  const [editingTender, setEditingTender] = useState(null);
  const tenderRef = useRef(null);

  const [productForm, setProductForm] = useState({ name: '', sku: '', category_id: '', description: '', price: '', cost_price: '', stock_quantity: '0', reorder_level: '10' });
  const [productImage, setProductImage] = useState(null);
  const [productPreview, setProductPreview] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const prodRef = useRef(null);

  const [tenders, setTenders] = useState([]);
  const [products, setProducts] = useState([]);
  const [tSearch, setTSearch] = useState('');
  const [pSearch, setPSearch] = useState('');
  
  const [selectedTenderForBids, setSelectedTenderForBids] = useState(null);
  const [bids, setBids] = useState([]);
  const [bidsLoading, setBidsLoading] = useState(false);

  const genSku = (name) => {
    const prefix = (name || '').substring(0, 3).toUpperCase();
    const suffix = Date.now().toString(36).toUpperCase();
    return `RET-${prefix}${suffix}`;
  };

  const fetchTenders = useCallback(async () => {
    try {
      const res = await axios.get('/tenders');
      if (res.status === 'success') setTenders(res.data || []);
    } catch (_) {}
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await axios.get('/retail/inventory');
      if (res.status === 'success') setProducts(res.data?.products || res.data || []);
    } catch (_) {}
  }, []);

  useEffect(() => {
    axios.get('/retail/categories').then(r => { if (r.status === 'success') setCategories(r.data); }).catch(() => {});
  }, []);

  useEffect(() => { if (tab === 'tender' && subtab === 'manage') fetchTenders(); }, [tab, subtab, fetchTenders]);
  useEffect(() => { if (tab === 'product' && subtab === 'manage') fetchProducts(); }, [tab, subtab, fetchProducts]);

  const handleTenderFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    const remaining = 5 - tenderFiles.length;
    const toAdd = files.slice(0, remaining);
    setTenderFiles(prev => [...prev, ...toAdd]);
    setTenderPreviews(prev => [...prev, ...toAdd.map(f => ({ name: f.name, size: f.size }))]);
    if (e.target) e.target.value = '';
  };

  const removeTenderFile = (idx) => {
    setTenderFiles(prev => prev.filter((_, i) => i !== idx));
    setTenderPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const resetTenderForm = () => {
    setTenderForm({ title: '', description: '', category: '', item_name: '', quantity: '', starting_bid_price: '', deadline: '', terms_conditions: '' });
    setTenderFiles([]);
    setTenderPreviews([]);
    setEditingTender(null);
  };

  const handleTenderSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(tenderForm).forEach(([k, v]) => fd.append(k, v));
      tenderFiles.forEach(f => fd.append('attachments', f));
      if (editingTender) {
        await axios.put(`/tenders/${editingTender.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        notify('Tender updated successfully!');
      } else {
        await axios.post('/tenders', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        notify('Tender posted successfully! It is now live on the public page.');
      }
      resetTenderForm();
    } catch (err) {
      notify(err?.response?.data?.message || err.message || 'Failed to save tender', 'error');
    } finally {
      setSaving(false);
    }
  };

  const editTender = async (tender) => {
    try {
      const res = await axios.get(`/tenders/${tender.id}`);
      if (res.status === 'success') {
        const t = res.data;
        const deadline = t.deadline ? new Date(t.deadline).toISOString().slice(0, 16) : '';
        setTenderForm({
          title: t.title || '', description: t.description || '', category: t.category || '',
          item_name: t.item_name || '', quantity: t.quantity || '', starting_bid_price: t.starting_bid_price || '',
          deadline, terms_conditions: t.terms_conditions || ''
        });
        setEditingTender(t);
        setTab('tender');
        setSubtab('create');
      }
    } catch (err) {
      notify(err?.response?.data?.message || err.message || 'Failed to load tender', 'error');
    }
  };

  const deleteTender = async (id) => {
    if (!window.confirm('Delete this tender? This action cannot be undone.')) return;
    try {
      await axios.delete(`/tenders/${id}`);
      notify('Tender deleted');
      fetchTenders();
    } catch (err) {
      notify(err?.response?.data?.message || err.message || 'Failed to delete tender', 'error');
    }
  };

  const fetchBids = async (tenderId) => {
    setBidsLoading(true);
    try {
      const res = await axios.get(`/tenders/${tenderId}/bids`);
      if (res.status === 'success') {
        setBids(res.data || []);
      } else {
        setBids([]);
      }
    } catch (err) {
      setBids([]);
      notify(err?.response?.data?.message || 'Failed to load bids', 'error');
    } finally {
      setBidsLoading(false);
    }
  };

  const handleAwardBid = async (bidId) => {
    if (!window.confirm('Are you sure you want to award the tender to this bid?')) return;
    try {
      const res = await axios.put(`/tenders/${selectedTenderForBids.id}/award`, { bid_ids: [bidId] });
      if (res.status === 'success') {
        notify('Bid awarded successfully!');
        fetchTenders();
        fetchBids(selectedTenderForBids.id);
      }
    } catch (err) {
      notify(err?.response?.data?.message || 'Failed to award bid', 'error');
    }
  };

  const handleProductImageChange = (e) => {
    const file = e.target.files[0];
    if (file) { setProductImage(file); setProductPreview(URL.createObjectURL(file)); }
  };

  const resetProductForm = () => {
    setProductForm({ name: '', sku: '', category_id: '', description: '', price: '', cost_price: '', stock_quantity: '0', reorder_level: '10' });
    setProductImage(null);
    setProductPreview(null);
    setEditingProduct(null);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(productForm).forEach(([k, v]) => fd.append(k, v));
      if (productImage) fd.append('product_image', productImage);
      if (editingProduct) {
        await axios.put(`/retail/products/${editingProduct.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        notify('Product updated successfully!');
      } else {
        await axios.post('/retail/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        notify('Product added to retail store successfully!');
      }
      resetProductForm();
    } catch (err) {
      notify(err?.response?.data?.message || err.message || 'Failed to save product', 'error');
    } finally {
      setSaving(false);
    }
  };

  const editProduct = async (product) => {
    try {
      const res = await axios.get(`/retail/products/${product.id}`);
      if (res.status === 'success') {
        const p = res.data;
        setProductForm({
          name: p.name || '', sku: p.sku || '', category_id: p.category_id || '',
          description: p.description || '', price: p.price || p.selling_price || '',
          cost_price: p.cost_price || '', stock_quantity: p.stock_quantity || '0',
          reorder_level: p.reorder_level || '10'
        });
        setEditingProduct(p);
        setTab('product');
        setSubtab('create');
      }
    } catch (err) {
      notify(err?.response?.data?.message || err.message || 'Failed to load product', 'error');
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product? This action cannot be undone.')) return;
    try {
      await axios.delete(`/retail/products/${id}`);
      notify('Product deleted');
      fetchProducts();
    } catch (err) {
      notify(err?.response?.data?.message || err.message || 'Failed to delete product', 'error');
    }
  };

  const renderTenderManage = () => {
    const filtered = tenders.filter(t => !tSearch || [t.title, t.reference_number, t.category, t.item_name].some(f => f && f.toLowerCase().includes(tSearch.toLowerCase())));
    return (
      <div style={{ background: 'white', borderRadius: 12, padding: '1.5rem', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>Manage Tenders</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input placeholder="Search..." value={tSearch} onChange={e => setTSearch(e.target.value)} style={{ ...inputS, paddingLeft: 30, width: 200, fontSize: 12 }} />
            </div>
            <button onClick={() => { fetchTenders(); }} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: '#475569' }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>
        {filtered.length === 0 ? (
          <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '2rem 0' }}>No tenders found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  {['Image', 'Ref #', 'Title', 'Category', 'Item', 'Price (ETB)', 'Deadline', 'Status', 'Actions'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 8px', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 8px' }}>
                      {(() => {
                        if (t.attachments) {
                          try {
                            const parsed = JSON.parse(t.attachments);
                            const img = parsed.find(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
                            if (img) return <img src={`http://localhost:5000/uploads/tenders/${img}`} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6 }} />;
                          } catch(e) {}
                        }
                        return <div style={{ width: 36, height: 36, borderRadius: 6, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={16} color="#cbd5e1" /></div>;
                      })()}
                    </td>
                    <td style={{ padding: '10px 8px', fontWeight: 600, color: '#0f172a' }}>{t.reference_number}</td>
                    <td style={{ padding: '10px 8px', color: '#334155', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</td>
                    <td style={{ padding: '10px 8px', color: '#64748b' }}>{t.category || '—'}</td>
                    <td style={{ padding: '10px 8px', color: '#64748b' }}>{t.item_name || '—'}</td>
                    <td style={{ padding: '10px 8px', color: '#334155' }}>{parseFloat(t.starting_bid_price).toLocaleString()}</td>
                    <td style={{ padding: '10px 8px', color: '#64748b', whiteSpace: 'nowrap' }}>{t.deadline ? new Date(t.deadline).toLocaleDateString() : '—'}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: t.status === 'open' ? '#dcfce7' : t.status === 'closed' ? '#fef3c7' : t.status === 'draft' ? '#e0e7ff' : '#fee2e2', color: t.status === 'open' ? '#166534' : t.status === 'closed' ? '#92400e' : t.status === 'draft' ? '#3730a3' : '#991b1b' }}>{t.status}</span>
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {btn('#059669', 'Edit', <Edit3 size={12} />, () => editTender(t))}
                        {btn('#3b82f6', 'Bid Competitors', <Search size={12} />, () => {
                          setSelectedTenderForBids(t);
                          fetchBids(t.id);
                        })}
                        {btn('#ef4444', 'Delete', <Trash2 size={12} />, () => deleteTender(t.id))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedTenderForBids && (
          <div style={{ marginTop: '2rem', borderTop: '2px solid #e2e8f0', paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Bids for: {selectedTenderForBids.title} ({selectedTenderForBids.reference_number})
              </h4>
              <button onClick={() => setSelectedTenderForBids(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}>
                <X size={16} />
              </button>
            </div>
            
            {bidsLoading ? (
              <p style={{ fontSize: 13, color: '#64748b' }}>Loading bids...</p>
            ) : bids.length === 0 ? (
              <p style={{ fontSize: 13, color: '#94a3b8', padding: '1rem', background: '#f8fafc', borderRadius: 8 }}>No bids received for this tender yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                      {['Customer', 'Bid Price (ETB)', 'Qty', 'Total Value', 'Status', 'Actions'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px', color: '#64748b', fontWeight: 600 }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {bids.map(b => (
                      <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{b.customer_name || `User #${b.customer_id}`}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{b.customer_email}</div>
                        </td>
                        <td style={{ padding: '8px', fontWeight: 600, color: '#059669' }}>{parseFloat(b.bid_price_per_unit).toLocaleString()}</td>
                        <td style={{ padding: '8px', color: '#475569' }}>{b.quantity_requested}</td>
                        <td style={{ padding: '8px', fontWeight: 600, color: '#0f172a' }}>{parseFloat(b.total_bid_value).toLocaleString()}</td>
                        <td style={{ padding: '8px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, textTransform: 'capitalize', background: b.status === 'awarded' ? '#dcfce7' : '#f1f5f9', color: b.status === 'awarded' ? '#166534' : '#475569' }}>
                            {b.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '8px' }}>
                          {b.status !== 'awarded' && selectedTenderForBids.status !== 'closed' && selectedTenderForBids.status !== 'awarded' && (
                            btn('#059669', 'Award', <CheckCircle size={12} />, () => handleAwardBid(b.id))
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderProductManage = () => {
    const filtered = products.filter(p => !pSearch || [p.name, p.sku, p.category_name].some(f => f && f.toLowerCase().includes(pSearch.toLowerCase())));
    return (
      <div style={{ background: 'white', borderRadius: 12, padding: '1.5rem', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>Manage Retail Products</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input placeholder="Search..." value={pSearch} onChange={e => setPSearch(e.target.value)} style={{ ...inputS, paddingLeft: 30, width: 200, fontSize: 12 }} />
            </div>
            <button onClick={() => { fetchProducts(); }} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: '#475569' }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>
        {filtered.length === 0 ? (
          <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '2rem 0' }}>No products found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  {['Image', 'Name', 'SKU', 'Category', 'Price (ETB)', 'Stock', 'Status', 'Actions'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 8px', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 8px' }}>
                      {p.product_image ? <img src={p.product_image.startsWith('http') ? p.product_image : `http://localhost:5000${p.product_image}`} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6 }} /> : <div style={{ width: 36, height: 36, borderRadius: 6, background: '#f1f5f9' }} />}
                    </td>
                    <td style={{ padding: '10px 8px', fontWeight: 600, color: '#0f172a', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                    <td style={{ padding: '10px 8px', color: '#64748b', fontFamily: 'monospace', fontSize: 11 }}>{p.sku}</td>
                    <td style={{ padding: '10px 8px', color: '#64748b' }}>{p.category_name || '—'}</td>
                    <td style={{ padding: '10px 8px', color: '#334155' }}>{parseFloat(p.price || p.selling_price || 0).toLocaleString()}</td>
                    <td style={{ padding: '10px 8px', color: '#334155' }}>{p.stock_quantity ?? '—'}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: p.is_active ? '#dcfce7' : '#fee2e2', color: p.is_active ? '#166534' : '#991b1b' }}>{p.is_active ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {btn('#059669', 'Edit', <Edit3 size={12} />, () => editProduct(p))}
                        {btn('#ef4444', 'Delete', <Trash2 size={12} />, () => deleteProduct(p.id))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 1060, margin: '0 auto' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {!hideHeader && (
        <>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Sales &amp; Product Management</h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 1.5rem' }}>Post and manage tenders and retail store products.</p>

          <div style={{ display: 'flex', gap: 0, marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0' }}>
            <button onClick={() => { setTab('tender'); setSubtab('create'); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: tab === 'tender' && subtab === 'create' ? '#059669' : '#64748b', borderBottom: tab === 'tender' && subtab === 'create' ? '2px solid #059669' : '2px solid transparent', marginBottom: -2 }}>
              <Megaphone size={16} /> Post Tender
            </button>
            <button onClick={() => { setTab('tender'); setSubtab('manage'); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: tab === 'tender' && subtab === 'manage' ? '#059669' : '#64748b', borderBottom: tab === 'tender' && subtab === 'manage' ? '2px solid #059669' : '2px solid transparent', marginBottom: -2 }}>
              <Package size={16} /> Manage Tenders
            </button>
            <button onClick={() => { setTab('product'); setSubtab('create'); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: tab === 'product' && subtab === 'create' ? '#059669' : '#64748b', borderBottom: tab === 'product' && subtab === 'create' ? '2px solid #059669' : '2px solid transparent', marginBottom: -2 }}>
              <Package size={16} /> Add Product
            </button>
            <button onClick={() => { setTab('product'); setSubtab('manage'); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: tab === 'product' && subtab === 'manage' ? '#059669' : '#64748b', borderBottom: tab === 'product' && subtab === 'manage' ? '2px solid #059669' : '2px solid transparent', marginBottom: -2 }}>
              <Package size={16} /> Manage Products
            </button>
          </div>
        </>
      )}

      {tab === 'tender' && subtab === 'create' && (
        <form onSubmit={handleTenderSubmit} encType="multipart/form-data" style={{ background: 'white', borderRadius: 12, padding: '1.5rem', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 1rem' }}>{editingTender ? 'Edit Tender' : 'Post New Tender for Public Sale'}</h3>
          {editingTender && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem', padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, fontSize: 12, color: '#166534' }}>
              <CheckCircle size={14} /> Editing: {editingTender.reference_number} — {editingTender.title}
              <button type="button" onClick={resetTenderForm} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#059669', cursor: 'pointer', textDecoration: 'underline', fontSize: 12 }}>Cancel</button>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Field label="Title" required>
              <input style={inputS} required value={tenderForm.title} onChange={e => setTenderForm({ ...tenderForm, title: e.target.value })} placeholder="e.g. Supply of Office Furniture" />
            </Field>
            <Field label="Category">
              <input style={inputS} value={tenderForm.category} onChange={e => setTenderForm({ ...tenderForm, category: e.target.value })} placeholder="e.g. Construction, Supplies" />
            </Field>
            <Field label="Item Name">
              <input style={inputS} value={tenderForm.item_name} onChange={e => setTenderForm({ ...tenderForm, item_name: e.target.value })} placeholder="e.g. Office Desks" />
            </Field>
            <Field label="Quantity" required>
              <input style={inputS} type="number" min="1" required value={tenderForm.quantity} onChange={e => setTenderForm({ ...tenderForm, quantity: e.target.value })} placeholder="e.g. 50" />
            </Field>
            <Field label="Starting Bid Price (ETB)" required>
              <input style={inputS} type="number" step="0.01" min="0" required value={tenderForm.starting_bid_price} onChange={e => setTenderForm({ ...tenderForm, starting_bid_price: e.target.value })} placeholder="e.g. 50000" />
            </Field>
            <Field label="Deadline" required>
              <input style={inputS} type="datetime-local" required value={tenderForm.deadline} onChange={e => setTenderForm({ ...tenderForm, deadline: e.target.value })} />
            </Field>
          </div>
          <Field label="Description" required>
            <textarea style={{ ...inputS, resize: 'vertical' }} rows={3} required value={tenderForm.description} onChange={e => setTenderForm({ ...tenderForm, description: e.target.value })} placeholder="Detailed description of the tender..." />
          </Field>
          <Field label="Terms &amp; Conditions" required>
            <textarea style={{ ...inputS, resize: 'vertical' }} rows={3} required value={tenderForm.terms_conditions} onChange={e => setTenderForm({ ...tenderForm, terms_conditions: e.target.value })} placeholder="Payment terms, delivery requirements, etc." />
          </Field>
          <Field label="Attachments (PDF, JPG, PNG — max 5 files)">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => tenderRef.current?.click()} disabled={tenderFiles.length >= 5} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', border: '1.5px dashed #cbd5e1', padding: '9px 14px', borderRadius: 8, cursor: tenderFiles.length >= 5 ? 'not-allowed' : 'pointer', fontSize: 12, color: tenderFiles.length >= 5 ? '#94a3b8' : '#475569' }}>
                <Upload size={14} /> {tenderFiles.length >= 5 ? 'Max files reached' : 'Upload Files'}
              </button>
              <input ref={tenderRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.gif" onChange={handleTenderFileChange} style={{ display: 'none' }} />
              <span style={{ fontSize: 11, color: '#94a3b8' }}>{tenderFiles.length}/5 files</span>
            </div>
            {tenderPreviews.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                {tenderPreviews.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', borderRadius: 6, padding: '6px 10px', border: '1px solid #e2e8f0', fontSize: 12 }}>
                    <span style={{ color: '#374151' }}>{f.name}</span>
                    <button type="button" onClick={() => removeTenderFile(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 0, display: 'flex' }}><X size={12} /></button>
                  </div>
                ))}
              </div>
            )}
          </Field>
          <button type="submit" disabled={saving} style={{ width: '100%', background: '#059669', color: 'white', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', fontSize: 14, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : editingTender ? 'Update Tender' : 'Post Tender'}
          </button>
        </form>
      )}

      {tab === 'tender' && subtab === 'manage' && renderTenderManage()}

      {tab === 'product' && subtab === 'create' && (
        <form onSubmit={handleProductSubmit} encType="multipart/form-data" style={{ background: 'white', borderRadius: 12, padding: '1.5rem', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 1rem' }}>{editingProduct ? 'Edit Retail Product' : 'Add New Retail Product'}</h3>
          {editingProduct && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem', padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, fontSize: 12, color: '#166534' }}>
              <CheckCircle size={14} /> Editing: {editingProduct.name} ({editingProduct.sku})
              <button type="button" onClick={resetProductForm} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#059669', cursor: 'pointer', textDecoration: 'underline', fontSize: 12 }}>Cancel</button>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Field label="Product Name" required>
              <input style={inputS} required value={productForm.name} onChange={e => { setProductForm({ ...productForm, name: e.target.value, sku: productForm.sku || genSku(e.target.value) }); }} placeholder="e.g. A4 Paper Box" />
            </Field>
            <Field label="SKU" required>
              <input style={inputS} required value={productForm.sku} onChange={e => setProductForm({ ...productForm, sku: e.target.value })} placeholder="Auto-generated" />
            </Field>
            <Field label="Category">
              <select style={inputS} value={productForm.category_id} onChange={e => setProductForm({ ...productForm, category_id: e.target.value })}>
                <option value="">— Select —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Price (ETB)" required>
              <input style={inputS} type="number" step="0.01" min="0" required value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} placeholder="0.00" />
            </Field>
            <Field label="Cost Price (ETB)">
              <input style={inputS} type="number" step="0.01" min="0" value={productForm.cost_price} onChange={e => setProductForm({ ...productForm, cost_price: e.target.value })} placeholder="0.00" />
            </Field>
            <Field label="Stock Quantity">
              <input style={inputS} type="number" min="0" value={productForm.stock_quantity} onChange={e => setProductForm({ ...productForm, stock_quantity: e.target.value })} placeholder="0" />
            </Field>
            <Field label="Reorder Level">
              <input style={inputS} type="number" min="0" value={productForm.reorder_level} onChange={e => setProductForm({ ...productForm, reorder_level: e.target.value })} placeholder="10" />
            </Field>
            <Field label="Product Image">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" onClick={() => prodRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', border: '1.5px dashed #cbd5e1', padding: '9px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, color: '#475569' }}>
                  <Upload size={14} /> {productPreview ? 'Change Image' : 'Upload Image'}
                </button>
                <input ref={prodRef} type="file" accept="image/*" onChange={handleProductImageChange} style={{ display: 'none' }} />
                {!productPreview && <span style={{ fontSize: 11, color: '#94a3b8' }}>JPG, PNG, WEBP</span>}
              </div>
              {(productPreview || editingProduct?.product_image) && (
                <div style={{ position: 'relative', display: 'inline-block', marginTop: 8 }}>
                  <img src={productPreview || (editingProduct?.product_image?.startsWith('http') ? editingProduct.product_image : `http://localhost:5000${editingProduct?.product_image}`)} alt="preview" style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <button type="button" onClick={() => { setProductImage(null); setProductPreview(null); }} style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={12} /></button>
                </div>
              )}
            </Field>
          </div>
          <Field label="Description">
            <textarea style={{ ...inputS, resize: 'vertical' }} rows={2} value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} placeholder="Short product description..." />
          </Field>
          <button type="submit" disabled={saving} style={{ width: '100%', background: '#059669', color: 'white', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', fontSize: 14, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
          </button>
        </form>
      )}

      {tab === 'product' && subtab === 'manage' && renderProductManage()}
    </div>
  );
};

export default SalesTenderProductPage;
