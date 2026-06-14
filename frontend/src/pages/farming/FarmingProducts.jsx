import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from '../../services/apiClient';
import { Plus, Edit2, TrendingUp, Package, X, Upload, CheckCircle, AlertCircle, Image } from 'lucide-react';

const CATEGORY_TYPES = [
  { value: 'seeds', label: 'Seeds', icon: '🌱' },
  { value: 'fertilizers', label: 'Fertilizers', icon: '🧪' },
  { value: 'tools', label: 'Tools & Equipment', icon: '🔧' },
  { value: 'pesticides', label: 'Pesticides', icon: '🧴' },
  { value: 'animal_feed', label: 'Animal Feed', icon: '🌾' },
  { value: 'general', label: 'General', icon: '📦' },
];

const inputS = { width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' };

const Field = ({ label, children }) => (
  <div style={{ marginBottom: '1rem' }}>
    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{label}</label>
    {children}
  </div>
);

const ImagePreview = ({ src, onClear }) => (
  <div style={{ position: 'relative', display: 'inline-block', marginTop: 8 }}>
    <img src={src} alt="preview" style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }} />
    <button type="button" onClick={onClear} style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={12} /></button>
  </div>
);

const Toast = ({ message, type, onClose }) => {
  const icon = type === 'success' ? <CheckCircle size={18} color="#16a34a" /> : <AlertCircle size={18} color="#dc2626" />;
  const bg = type === 'success' ? '#f0fdf4' : '#fef2f2';
  const border = type === 'success' ? '#bbf7d0' : '#fecaca';
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10, background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: '12px 18px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', maxWidth: 400, animation: 'slideIn 0.3s ease' }}>
      {icon}
      <span style={{ fontSize: 13, color: type === 'success' ? '#166534' : '#991b1b', flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}><X size={14} /></button>
    </div>
  );
};

const Modal = ({ title, onClose, children, wide }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
    <div style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: wide ? 720 : 520, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: 0, color: '#1e293b' }}>{title}</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
      </div>
      <div style={{ padding: '1.5rem' }}>{children}</div>
    </div>
  </div>
);

function resolveImg(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${axios.defaults.baseURL.replace('/api/v1', '')}${url}`;
}

const typeInfo = (t) => CATEGORY_TYPES.find(ct => ct.value === t) || CATEGORY_TYPES[CATEGORY_TYPES.length - 1];

const FarmingProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showStockModal, setShowStockModal] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [productForm, setProductForm] = useState({
    name: '', category_id: '', description: '', usage_instructions: '',
    price: '', stock_quantity: '', reorder_level: '10'
  });
  const [productImageFile, setProductImageFile] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState(null);

  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', type: 'general' });
  const [categoryImageFile, setCategoryImageFile] = useState(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState(null);

  const [stockForm, setStockForm] = useState({ quantity: '', operation: 'add', notes: '' });

  const prodImgRef = useRef(null);
  const catImgRef = useRef(null);

  const notify = useCallback((message, type = 'success') => setToast({ message, type }), []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        axios.get('/farming/admin/products?include_inactive=true'),
        axios.get('/farming/categories')
      ]);
      if (prodRes.status === 'success') setProducts(prodRes.data);
      if (catRes.status === 'success') setCategories(catRes.data);
    } catch (err) {
      notify(err.message || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (product) => {
    setEditProduct(product);
    setProductForm({
      name: product.name,
      category_id: product.category_id || '',
      description: product.description || '',
      usage_instructions: product.usage_instructions || '',
      price: product.price,
      stock_quantity: product.stock_quantity,
      reorder_level: product.reorder_level
    });
    setProductImageFile(null);
    setProductImagePreview(product.product_image ? resolveImg(product.product_image) : null);
    setShowProductForm(true);
  };

  const buildFormData = (data, imageFile, imageFieldName) => {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => fd.append(k, v));
    if (imageFile) fd.append(imageFieldName, imageFile);
    return fd;
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = buildFormData(productForm, productImageFile, 'product_image');
      if (editProduct) {
        await axios.put(`/farming/admin/products/${editProduct.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        notify('Product updated successfully');
      } else {
        await axios.post('/farming/admin/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        notify('Product created successfully');
      }
      setShowProductForm(false);
      setEditProduct(null);
      setProductForm({ name: '', category_id: '', description: '', usage_instructions: '', price: '', stock_quantity: '', reorder_level: '10' });
      setProductImageFile(null);
      setProductImagePreview(null);
      await load();
    } catch (err) {
      notify(err?.response?.data?.message || err.message || 'Failed to save product', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = buildFormData(categoryForm, categoryImageFile, 'cover_image');
      await axios.post('/farming/admin/categories', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      notify('Category created successfully');
      setShowCategoryForm(false);
      setCategoryForm({ name: '', description: '', type: 'general' });
      setCategoryImageFile(null);
      setCategoryImagePreview(null);
      await load();
    } catch (err) {
      notify(err?.response?.data?.message || err.message || 'Failed to save category', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.patch(`/farming/admin/products/${showStockModal.id}/stock`, stockForm);
      notify(`Stock updated. New: ${stockForm.operation === 'set' ? stockForm.quantity : stockForm.operation === 'add' ? showStockModal.stock_quantity + parseInt(stockForm.quantity || 0) : showStockModal.stock_quantity - parseInt(stockForm.quantity || 0)}`);
      setShowStockModal(null);
      setStockForm({ quantity: '', operation: 'add', notes: '' });
      await load();
    } catch (err) {
      notify(err?.response?.data?.message || err.message || 'Failed to update stock', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleProdImageChange = (e) => {
    const file = e.target.files[0];
    if (file) { setProductImageFile(file); setProductImagePreview(URL.createObjectURL(file)); }
  };

  const handleCatImageChange = (e) => {
    const file = e.target.files[0];
    if (file) { setCategoryImageFile(file); setCategoryImagePreview(URL.createObjectURL(file)); }
  };

  const clearProdImage = () => { setProductImageFile(null); setProductImagePreview(null); if (prodImgRef.current) prodImgRef.current.value = ''; };
  const clearCatImage = () => { setCategoryImageFile(null); setCategoryImagePreview(null); if (catImgRef.current) catImgRef.current.value = ''; };

  return (
    <div style={{ padding: '2rem' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>🌱 Products & Stock</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => { setShowCategoryForm(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', border: 'none', padding: '9px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#475569', fontWeight: 600 }}>
            <Plus size={15} /> Add Category
          </button>
          <button onClick={() => { setEditProduct(null); setProductForm({ name: '', category_id: '', description: '', usage_instructions: '', price: '', stock_quantity: '', reorder_level: '10' }); setProductImageFile(null); setProductImagePreview(null); setShowProductForm(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#10b981', border: 'none', padding: '9px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: 'white', fontWeight: 600 }}>
            <Plus size={15} /> Add Product
          </button>
        </div>
      </div>

      {/* Category Grid */}
      {categories.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#64748b', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Categories</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {categories.map(c => {
              const ti = typeInfo(c.type);
              return (
                <div key={c.id} style={{ background: 'white', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', transition: 'box-shadow 0.2s', cursor: 'default' }}>
                  {c.cover_image ? (
                    <div style={{ height: 90, overflow: 'hidden' }}>
                      <img src={resolveImg(c.cover_image)} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div style={{ height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#cbd5e1', fontSize: 28 }}><Image size={28} /></div>
                  )}
                  <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 16 }}>{ti.icon}</span>
                      <span style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{c.name}</span>
                    </div>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{products.filter(p => p.category_id === c.id).length} products</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Product Cards */}
      {loading ? <p style={{ color: '#64748b' }}>Loading products...</p> : (
        <>
          {products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', background: 'white', borderRadius: 12, border: '2px dashed #e2e8f0' }}>
              <Package size={40} style={{ marginBottom: 12, color: '#cbd5e1' }} />
              <p style={{ fontWeight: 600, color: '#64748b' }}>No products yet</p>
              <p style={{ fontSize: 13 }}>Click "Add Product" to create your first product.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {products.map(p => {
                const isLow = p.stock_quantity <= p.reorder_level;
                const isOut = p.stock_quantity <= 0;
                const cat = categories.find(c => c.id === p.category_id);
                return (
                  <div key={p.id} style={{ background: 'white', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', borderLeft: `4px solid ${isOut ? '#ef4444' : isLow ? '#f59e0b' : '#10b981'}` }}>
                    {p.product_image && (
                      <div style={{ width: '100%', height: 140, overflow: 'hidden' }}>
                        <img src={resolveImg(p.product_image)} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <div style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                            {cat && typeInfo(cat.type).icon} {p.category_name || 'Uncategorized'}
                          </div>
                          <h4 style={{ margin: 0, fontSize: 15, color: '#1e293b' }}>{p.name}</h4>
                        </div>
                        <span style={{ background: p.is_active ? '#dcfce7' : '#fee2e2', color: p.is_active ? '#166534' : '#991b1b', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '12px 0', fontSize: 13 }}>
                        <div style={{ background: '#f8fafc', borderRadius: 6, padding: '8px 10px' }}>
                          <div style={{ color: '#64748b', fontSize: 11 }}>Price</div>
                          <div style={{ fontWeight: 700, color: '#1e293b' }}>{parseFloat(p.price).toFixed(2)} ETB</div>
                        </div>
                        <div style={{ background: isOut ? '#fee2e2' : isLow ? '#fffbeb' : '#f0fdf4', borderRadius: 6, padding: '8px 10px' }}>
                          <div style={{ color: '#64748b', fontSize: 11 }}>Stock</div>
                          <div style={{ fontWeight: 700, color: isOut ? '#ef4444' : isLow ? '#f59e0b' : '#10b981' }}>
                            {p.stock_quantity} <span style={{ fontSize: 10, fontWeight: 400 }}>/ min {p.reorder_level}</span>
                          </div>
                        </div>
                      </div>
                      {p.description && <p style={{ margin: '0 0 12px', fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>{p.description.substring(0, 80)}{p.description.length > 80 ? '...' : ''}</p>}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => openEdit(p)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: '#475569' }}>
                          <Edit2 size={13} /> Edit
                        </button>
                        <button onClick={() => { setShowStockModal(p); setStockForm({ quantity: '', operation: 'add', notes: '' }); }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: '#eff6ff', border: 'none', padding: '8px', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: '#1d4ed8' }}>
                          <TrendingUp size={13} /> Update Stock
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ─── Product Form Modal ─── */}
      {showProductForm && (
        <Modal title={editProduct ? 'Edit Product' : 'Add New Product'} onClose={() => setShowProductForm(false)} wide>
          <form onSubmit={handleProductSubmit} encType="multipart/form-data">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Field label="Product Name *">
                <input style={inputS} required value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} placeholder="e.g. Wheat Seed" />
              </Field>
              <Field label="Category">
                <select style={inputS} value={productForm.category_id} onChange={e => setProductForm({ ...productForm, category_id: e.target.value })}>
                  <option value="">— Select —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Price (ETB) *">
                <input style={inputS} type="number" step="0.01" required value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} placeholder="0.00" />
              </Field>
              {!editProduct ? (
                <Field label="Initial Stock">
                  <input style={inputS} type="number" value={productForm.stock_quantity} onChange={e => setProductForm({ ...productForm, stock_quantity: e.target.value })} placeholder="0" />
                </Field>
              ) : (
                <Field label="Reorder Level">
                  <input style={inputS} type="number" value={productForm.reorder_level} onChange={e => setProductForm({ ...productForm, reorder_level: e.target.value })} placeholder="10" />
                </Field>
              )}
              <Field label="Reorder Level">
                <input style={inputS} type="number" value={productForm.reorder_level} onChange={e => setProductForm({ ...productForm, reorder_level: e.target.value })} placeholder="10" />
              </Field>
              <Field label="Product Image">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => prodImgRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', border: '1.5px dashed #cbd5e1', padding: '9px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, color: '#475569' }}>
                    <Upload size={14} /> {productImagePreview ? 'Change' : 'Upload Image'}
                  </button>
                  <input ref={prodImgRef} type="file" accept="image/*" onChange={handleProdImageChange} style={{ display: 'none' }} />
                  {!productImagePreview && <span style={{ fontSize: 11, color: '#94a3b8' }}>JPG, PNG, WEBP</span>}
                  {productImagePreview && <ImagePreview src={productImagePreview} onClear={clearProdImage} />}
                </div>
              </Field>
            </div>
            <Field label="Description">
              <textarea style={{ ...inputS, resize: 'vertical' }} rows={2} value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} placeholder="Short description..." />
            </Field>
            <Field label="Usage Instructions">
              <textarea style={{ ...inputS, resize: 'vertical' }} rows={2} value={productForm.usage_instructions} onChange={e => setProductForm({ ...productForm, usage_instructions: e.target.value })} placeholder="How to use this product..." />
            </Field>
            {editProduct && (
              <Field label="Active">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={productForm.is_active !== false} onChange={e => setProductForm({ ...productForm, is_active: e.target.checked })} />
                  Product is visible to customers
                </label>
              </Field>
            )}
            <button type="submit" disabled={saving} style={{ width: '100%', background: '#10b981', color: 'white', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
              {saving ? 'Saving...' : (editProduct ? 'Save Changes' : 'Create Product')}
            </button>
          </form>
        </Modal>
      )}

      {/* ─── Category Form Modal ─── */}
      {showCategoryForm && (
        <Modal title="Add New Category" onClose={() => setShowCategoryForm(false)} wide>
          <form onSubmit={handleCategorySubmit} encType="multipart/form-data">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Field label="Category Name *">
                <input style={inputS} required value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} placeholder="e.g. Seeds, Fertilizers..." />
              </Field>
              <Field label="Category Type">
                <select style={inputS} value={categoryForm.type} onChange={e => setCategoryForm({ ...categoryForm, type: e.target.value })}>
                  {CATEGORY_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                </select>
              </Field>
              <Field label="Cover Image">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => catImgRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', border: '1.5px dashed #cbd5e1', padding: '9px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, color: '#475569' }}>
                    <Upload size={14} /> {categoryImagePreview ? 'Change Image' : 'Upload Cover'}
                  </button>
                  <input ref={catImgRef} type="file" accept="image/*" onChange={handleCatImageChange} style={{ display: 'none' }} />
                  {!categoryImagePreview && <span style={{ fontSize: 11, color: '#94a3b8' }}>JPG, PNG, WEBP</span>}
                </div>
                {categoryImagePreview && <ImagePreview src={categoryImagePreview} onClear={clearCatImage} />}
              </Field>
              <Field label="Description">
                <textarea style={{ ...inputS, resize: 'vertical' }} rows={2} value={categoryForm.description} onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })} placeholder="Describe this category..." />
              </Field>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="button" onClick={() => setShowCategoryForm(false)} style={{ background: '#f1f5f9', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, color: '#64748b', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              <button type="submit" disabled={saving} style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', fontSize: 13, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Creating...' : 'Create Category'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── Stock Modal ─── */}
      {showStockModal && (
        <Modal title={`Update Stock: ${showStockModal.name}`} onClose={() => setShowStockModal(null)}>
          <div style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 16px', marginBottom: '1.25rem' }}>
            <span style={{ color: '#64748b', fontSize: 13 }}>Current Stock: </span>
            <strong style={{ fontSize: 18, color: '#1e293b' }}>{showStockModal.stock_quantity}</strong>
          </div>
          <form onSubmit={handleStockUpdate}>
            <Field label="Operation">
              <select style={inputS} value={stockForm.operation} onChange={e => setStockForm({ ...stockForm, operation: e.target.value })}>
                <option value="add"> + Add (received from supplier)</option>
                <option value="subtract"> - Remove (damaged/returned)</option>
                <option value="set">  Set exact (physical count)</option>
              </select>
            </Field>
            <Field label="Quantity *">
              <input style={inputS} type="number" required min={1} value={stockForm.quantity} onChange={e => setStockForm({ ...stockForm, quantity: e.target.value })} placeholder="Enter quantity" />
            </Field>
            {stockForm.quantity && (
              <div style={{ background: '#eff6ff', borderRadius: 6, padding: '8px 12px', marginBottom: '1rem', fontSize: 13 }}>
                New stock will be: <strong>
                  {stockForm.operation === 'set' ? stockForm.quantity :
                   stockForm.operation === 'add' ? showStockModal.stock_quantity + parseInt(stockForm.quantity || 0) :
                   showStockModal.stock_quantity - parseInt(stockForm.quantity || 0)}
                </strong>
              </div>
            )}
            <Field label="Notes (PO number, reason)">
              <input style={inputS} value={stockForm.notes} onChange={e => setStockForm({ ...stockForm, notes: e.target.value })} placeholder="Optional..." />
            </Field>
            <button type="submit" disabled={saving} style={{ width: '100%', background: '#3b82f6', color: 'white', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Updating...' : 'Update Stock'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default FarmingProducts;
