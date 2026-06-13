import React, { useState, useEffect } from 'react';
import axios from '../../services/apiClient';
import { Plus, Edit2, TrendingUp, Package, X, Check } from 'lucide-react';

const FarmingProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showStockModal, setShowStockModal] = useState(null); // product
  const [editProduct, setEditProduct] = useState(null);
  const [saving, setSaving] = useState(false);

  const [productForm, setProductForm] = useState({
    name: '', category_id: '', description: '', usage_instructions: '',
    price: '', stock_quantity: '', reorder_level: '10'
  });
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [stockForm, setStockForm] = useState({ quantity: '', operation: 'add', notes: '' });

  const load = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        axios.get('/farming/admin/products?include_inactive=true'),
        axios.get('/farming/categories')
      ]);
      if (prodRes.status === 'success') setProducts(prodRes.data);
      if (catRes.status === 'success') setCategories(catRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

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
    setShowProductForm(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editProduct) {
        await axios.put(`/farming/admin/products/${editProduct.id}`, productForm);
      } else {
        await axios.post('/farming/admin/products', productForm);
      }
      setShowProductForm(false);
      setEditProduct(null);
      setProductForm({ name: '', category_id: '', description: '', usage_instructions: '', price: '', stock_quantity: '', reorder_level: '10' });
      await load();
    } catch (err) {
      alert(err.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post('/farming/admin/categories', categoryForm);
      setShowCategoryForm(false);
      setCategoryForm({ name: '', description: '' });
      await load();
    } catch (err) {
      alert(err.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.patch(`/farming/admin/products/${showStockModal.id}/stock`, stockForm);
      setShowStockModal(null);
      setStockForm({ quantity: '', operation: 'add', notes: '' });
      await load();
    } catch (err) {
      alert(err.message || 'Failed to update stock');
    } finally {
      setSaving(false);
    }
  };

  const Modal = ({ title, onClose, children }) => (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: 0, color: '#1e293b' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
        </div>
        <div style={{ padding: '1.5rem' }}>{children}</div>
      </div>
    </div>
  );

  const Field = ({ label, children }) => (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );

  const inputStyle = { width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ margin: 0 }}>🌱 Products & Stock Management</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setShowCategoryForm(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', border: 'none', padding: '9px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#475569', fontWeight: 600 }}
          >
            <Plus size={15} /> Add Category
          </button>
          <button
            onClick={() => { setEditProduct(null); setProductForm({ name: '', category_id: '', description: '', usage_instructions: '', price: '', stock_quantity: '', reorder_level: '10' }); setShowProductForm(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#10b981', border: 'none', padding: '9px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: 'white', fontWeight: 600 }}
          >
            <Plus size={15} /> Add Product
          </button>
        </div>
      </div>

      {/* Categories summary */}
      {categories.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {categories.map(c => (
            <span key={c.id} style={{ background: '#eff6ff', color: '#1d4ed8', padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
              {c.name}
            </span>
          ))}
        </div>
      )}

      {loading ? <p style={{ color: '#64748b' }}>Loading products...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {products.map(p => {
            const isLow = p.stock_quantity <= p.reorder_level;
            const isOut = p.stock_quantity <= 0;
            return (
              <div key={p.id} style={{ background: 'white', borderRadius: 10, padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', borderLeft: `4px solid ${isOut ? '#ef4444' : isLow ? '#f59e0b' : '#10b981'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>{p.category_name || 'Uncategorized'}</div>
                    <h4 style={{ margin: 0, fontSize: 15, color: '#1e293b' }}>{p.name}</h4>
                  </div>
                  <span style={{ background: p.is_active ? '#dcfce7' : '#fee2e2', color: p.is_active ? '#166534' : '#991b1b', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>
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
                  <button
                    onClick={() => openEdit(p)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: '#475569' }}
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => { setShowStockModal(p); setStockForm({ quantity: '', operation: 'add', notes: '' }); }}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: '#eff6ff', border: 'none', padding: '8px', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: '#1d4ed8' }}
                  >
                    <TrendingUp size={13} /> Update Stock
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Form Modal */}
      {showProductForm && (
        <Modal title={editProduct ? 'Edit Product' : 'Add New Product'} onClose={() => setShowProductForm(false)}>
          <form onSubmit={handleProductSubmit}>
            <Field label="Product Name *">
              <input style={inputStyle} required value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} placeholder="e.g. Wheat Seed" />
            </Field>
            <Field label="Category">
              <select style={inputStyle} value={productForm.category_id} onChange={e => setProductForm({ ...productForm, category_id: e.target.value })}>
                <option value="">— Select Category —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Price (ETB) *">
                <input style={inputStyle} type="number" step="0.01" required value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} placeholder="0.00" />
              </Field>
              {!editProduct && (
                <Field label="Initial Stock">
                  <input style={inputStyle} type="number" value={productForm.stock_quantity} onChange={e => setProductForm({ ...productForm, stock_quantity: e.target.value })} placeholder="0" />
                </Field>
              )}
              <Field label="Reorder Level">
                <input style={inputStyle} type="number" value={productForm.reorder_level} onChange={e => setProductForm({ ...productForm, reorder_level: e.target.value })} placeholder="10" />
              </Field>
            </div>
            <Field label="Description">
              <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} placeholder="Short description..." />
            </Field>
            <Field label="Usage Instructions">
              <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} value={productForm.usage_instructions} onChange={e => setProductForm({ ...productForm, usage_instructions: e.target.value })} placeholder="How to use this product..." />
            </Field>
            {editProduct && (
              <Field label="Active">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={productForm.is_active !== false} onChange={e => setProductForm({ ...productForm, is_active: e.target.checked })} />
                  Product is visible to customers
                </label>
              </Field>
            )}
            <button
              type="submit"
              disabled={saving}
              style={{ width: '100%', background: '#10b981', color: 'white', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
            >
              {saving ? 'Saving...' : (editProduct ? 'Save Changes' : 'Create Product')}
            </button>
          </form>
        </Modal>
      )}

      {/* Category Form Modal */}
      {showCategoryForm && (
        <Modal title="Add New Category" onClose={() => setShowCategoryForm(false)}>
          <form onSubmit={handleCategorySubmit}>
            <Field label="Category Name *">
              <input style={inputStyle} required value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} placeholder="e.g. Seeds, Fertilizers, Tools..." />
            </Field>
            <Field label="Description">
              <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} value={categoryForm.description} onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })} />
            </Field>
            <button type="submit" disabled={saving} style={{ width: '100%', background: '#3b82f6', color: 'white', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
              {saving ? 'Saving...' : 'Create Category'}
            </button>
          </form>
        </Modal>
      )}

      {/* Stock Update Modal */}
      {showStockModal && (
        <Modal title={`Update Stock: ${showStockModal.name}`} onClose={() => setShowStockModal(null)}>
          <div style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 16px', marginBottom: '1.25rem' }}>
            <span style={{ color: '#64748b', fontSize: 13 }}>Current Stock: </span>
            <strong style={{ fontSize: 18, color: '#1e293b' }}>{showStockModal.stock_quantity}</strong>
          </div>
          <form onSubmit={handleStockUpdate}>
            <Field label="Operation">
              <select style={inputStyle} value={stockForm.operation} onChange={e => setStockForm({ ...stockForm, operation: e.target.value })}>
                <option value="add">➕ Add to stock (received from supplier)</option>
                <option value="subtract">➖ Remove from stock (damaged/returned)</option>
                <option value="set">📋 Set exact quantity (physical count)</option>
              </select>
            </Field>
            <Field label="Quantity *">
              <input style={inputStyle} type="number" required min={1} value={stockForm.quantity} onChange={e => setStockForm({ ...stockForm, quantity: e.target.value })} placeholder="Enter quantity" />
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
            <Field label="Notes (e.g. PO number, reason)">
              <input style={inputStyle} value={stockForm.notes} onChange={e => setStockForm({ ...stockForm, notes: e.target.value })} placeholder="Optional notes..." />
            </Field>
            <button type="submit" disabled={saving} style={{ width: '100%', background: '#3b82f6', color: 'white', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
              {saving ? 'Updating...' : 'Update Stock'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default FarmingProducts;
