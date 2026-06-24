import React, { useState, useEffect } from 'react';
import axios from '../../services/apiClient';
import { Search, Package, AlertTriangle, ChevronDown, ChevronUp, Edit3, Save, X } from 'lucide-react';

export default () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editQty, setEditQty] = useState(0);
  const [editType, setEditType] = useState('set');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', sku: '', category_id: '', price: '', cost_price: '', stock_quantity: '0', reorder_level: '10', description: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([axios.get('/retail/inventory'), axios.get('/retail/categories')]);
      if (prodRes.status === 'success') setProducts(prodRes.data);
      if (catRes.status === 'success') setCategories(catRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const filtered = products.filter(p => {
    if (showLowStock && p.stock_quantity > p.reorder_level) return false;
    if (filterCategory && String(p.category_id) !== filterCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q);
    }
    return true;
  });

  const handleStockUpdate = async (id) => {
    try {
      await axios.put(`/retail/products/${id}/stock`, { quantity: parseInt(editQty), operation: editType });
      setEditingId(null);
      fetchData();
    } catch (err) { alert(err.response?.data?.message || 'Update failed'); }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.sku || !newProduct.price) { alert('Name, SKU, and price are required'); return; }
    try {
      await axios.post('/retail/products', { ...newProduct, price: parseFloat(newProduct.price), cost_price: parseFloat(newProduct.cost_price || 0), stock_quantity: parseInt(newProduct.stock_quantity), reorder_level: parseInt(newProduct.reorder_level) });
      setShowAddProduct(false);
      setNewProduct({ name: '', sku: '', category_id: '', price: '', cost_price: '', stock_quantity: '0', reorder_level: '10', description: '' });
      fetchData();
    } catch (err) { alert(err.response?.data?.message || 'Create failed'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Inventory</h2>
        <button onClick={() => setShowAddProduct(true)} style={{ background: '#059669', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}><Package size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Add Product</button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', flex: 1 }}>
          <Search size={18} color="#94a3b8" />
          <input type="text" placeholder="Search by name or SKU..." value={search} onChange={e => setSearch(e.target.value)} style={{ border: 'none', outline: 'none', flex: 1, fontSize: 13 }} />
        </div>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', fontSize: 13 }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: '#dc2626', whiteSpace: 'nowrap' }}>
          <input type="checkbox" checked={showLowStock} onChange={e => setShowLowStock(e.target.checked)} /> <AlertTriangle size={14} /> Low Stock Only
        </label>
      </div>

      {loading ? <p>Loading...</p> : (
        <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', color: '#475569', fontWeight: 600 }}>Product</th>
                <th style={{ padding: '12px 14px', color: '#475569', fontWeight: 600 }}>SKU</th>
                <th style={{ padding: '12px 14px', color: '#475569', fontWeight: 600 }}>Category</th>
                <th style={{ padding: '12px 14px', color: '#475569', fontWeight: 600 }}>Price</th>
                <th style={{ padding: '12px 14px', color: '#475569', fontWeight: 600 }}>Cost</th>
                <th style={{ padding: '12px 14px', color: '#475569', fontWeight: 600 }}>Stock</th>
                <th style={{ padding: '12px 14px', color: '#475569', fontWeight: 600 }}>Reorder</th>
                <th style={{ padding: '12px 14px', color: '#475569', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const isLow = p.stock_quantity <= p.reorder_level;
                const isCritical = p.stock_quantity <= p.reorder_level * 0.5;
                return (
                  <tr key={p.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {p.product_image && <img src={p.product_image} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />}
                      <span style={{ fontWeight: 500 }}>{p.name}</span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748b', fontFamily: 'monospace', fontSize: 12 }}>{p.sku}</td>
                    <td style={{ padding: '12px 14px' }}>{p.category_name}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>{parseFloat(p.price).toFixed(2)}</td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>{parseFloat(p.cost_price || 0).toFixed(2)}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, background: isCritical ? '#fef2f2' : isLow ? '#fffbeb' : '#f0fdf4', color: isCritical ? '#dc2626' : isLow ? '#d97706' : '#059669', fontWeight: 600, fontSize: 12 }}>
                        {p.stock_quantity}
                        {isCritical && <AlertTriangle size={12} />}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>{p.reorder_level}</td>
                    <td style={{ padding: '12px 14px' }}>
                      {editingId === p.id ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <input type="number" value={editQty} onChange={e => setEditQty(e.target.value)} style={{ width: 60, padding: '4px 6px', borderRadius: 4, border: '1px solid #e2e8f0', fontSize: 12 }} />
                          <select value={editType} onChange={e => setEditType(e.target.value)} style={{ borderRadius: 4, border: '1px solid #e2e8f0', fontSize: 11, padding: '2px' }}>
                            <option value="set">Set</option><option value="add">Add</option><option value="subtract">Sub</option>
                          </select>
                          <button onClick={() => handleStockUpdate(p.id)} style={{ background: '#059669', color: 'white', border: 'none', borderRadius: 4, width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Save size={13} /></button>
                          <button onClick={() => setEditingId(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 4, width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={13} /></button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingId(p.id); setEditQty(p.stock_quantity); }} style={{ background: '#f1f5f9', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><Edit3 size={12} /> Adjust</button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No products found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showAddProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 520, maxHeight: '80vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 1.25rem' }}>Add Product</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {['name', 'sku', 'price', 'cost_price', 'stock_quantity', 'reorder_level'].map(f => (
                <div key={f}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>{f.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</label>
                  <input type={f.includes('price') || f.includes('quantity') || f === 'reorder_level' ? 'number' : 'text'} value={newProduct[f]} onChange={e => setNewProduct(p => ({ ...p, [f]: e.target.value }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1.5px solid #e2e8f0', boxSizing: 'border-box', fontSize: 13 }} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Category</label>
                <select value={newProduct.category_id} onChange={e => setNewProduct(p => ({ ...p, category_id: e.target.value }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1.5px solid #e2e8f0', fontSize: 13 }}>
                  <option value="">None</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Description</label>
                <textarea value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))} rows={2} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1.5px solid #e2e8f0', boxSizing: 'border-box', fontSize: 13, resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: '1.5rem' }}>
              <button onClick={() => setShowAddProduct(false)} style={{ flex: 1, background: '#f1f5f9', border: 'none', padding: '10px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={handleAddProduct} style={{ flex: 1, background: '#059669', color: 'white', border: 'none', padding: '10px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>Create Product</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
