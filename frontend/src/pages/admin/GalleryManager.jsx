import React, { useState, useEffect, useRef } from 'react';
import axios from '../../services/apiClient';
import { Upload, Edit3, Trash2, X, Save, Image as ImageIcon, Eye, EyeOff } from 'lucide-react';

const resolveImg = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${axios.defaults.baseURL.replace('/api/v1', '')}${url}`;
};

const CATEGORIES = [
  { key: 'cars', label: 'Cars & Fleet' },
  { key: 'workplace', label: 'Workers & Workplace' },
  { key: 'events', label: 'Events & Activities' },
  { key: 'products', label: 'Products Showcase' },
];

const INITIAL_FORM = {
  category: 'cars', title: '', description: '', date_taken: '', location: '',
  display_order: '0', status: 'active', image: null
};

export default () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('cars');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef(null);

  useEffect(() => { fetchImages(); }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/gallery');
      if (res.status === 'success') setImages(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const filtered = images.filter(i => i.category === activeTab);

  const openAdd = () => {
    setForm({ ...INITIAL_FORM, category: activeTab });
    setEditing(null);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const openEdit = (img) => {
    setForm({
      category: img.category, title: img.title, description: img.description || '',
      date_taken: img.date_taken ? img.date_taken.split('T')[0] : '',
      location: img.location || '', display_order: String(img.display_order),
      status: img.status, image: null
    });
    setEditing(img.id);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!editing && !form.image) { setError('Image file is required'); return; }
    setSaving(true); setError(''); setSuccess('');

    try {
      const fd = new FormData();
      fd.append('category', form.category);
      fd.append('title', form.title.trim());
      if (form.description) fd.append('description', form.description);
      if (form.date_taken) fd.append('date_taken', form.date_taken);
      if (form.location) fd.append('location', form.location);
      fd.append('display_order', form.display_order);
      fd.append('status', form.status);
      if (form.image) fd.append('image', form.image);

      if (editing) {
        const res = await axios.put(`/gallery/${editing}`, fd);
        if (res.status === 'success') setSuccess('Image updated!');
      } else {
        const res = await axios.post('/gallery', fd);
        if (res.status === 'success') setSuccess('Image uploaded!');
      }
      setShowForm(false);
      fetchImages();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (img) => {
    if (!confirm('Are you sure you want to delete this image? This cannot be undone.')) return;
    try {
      const res = await axios.delete(`/gallery/${img.id}`);
      if (res.status === 'success') { setSuccess('Image deleted'); fetchImages(); }
    } catch (err) { alert(err.response?.data?.message || 'Delete failed'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Gallery Manager</h2>
        <button onClick={openAdd} style={{
          background: '#059669', color: 'white', border: 'none', padding: '10px 20px',
          borderRadius: 8, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
        }}>
          <Upload size={16} /> Add New Image
        </button>
      </div>

      {success && (
        <div style={{ padding: '10px 14px', background: '#f0fdf4', color: '#059669', borderRadius: 8, marginBottom: 12, fontSize: 13, fontWeight: 600 }}>
          {success}
        </div>
      )}

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '2px solid #e2e8f0' }}>
        {CATEGORIES.map(c => (
          <button key={c.key} onClick={() => setActiveTab(c.key)}
            style={{
              padding: '10px 20px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
              background: activeTab === c.key ? '#f0fdf4' : 'transparent',
              color: activeTab === c.key ? '#059669' : '#64748b',
              borderBottom: activeTab === c.key ? '2px solid #059669' : '2px solid transparent',
              marginBottom: -2
            }}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Image Table */}
      {loading ? <p>Loading...</p> : (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', color: '#475569', fontWeight: 600 }}>Image</th>
                <th style={{ padding: '12px 14px', color: '#475569', fontWeight: 600 }}>Title</th>
                <th style={{ padding: '12px 14px', color: '#475569', fontWeight: 600 }}>Description</th>
                <th style={{ padding: '12px 14px', color: '#475569', fontWeight: 600 }}>Order</th>
                <th style={{ padding: '12px 14px', color: '#475569', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 14px', color: '#475569', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                  No images in this category. Click "Add New Image" to upload.
                </td></tr>
              ) : filtered.map(img => (
                <tr key={img.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ width: 56, height: 40, borderRadius: 6, background: '#f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {img.image_path ? (
                        <img src={resolveImg(img.image_path)} alt={img.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => { e.target.style.display = 'none'; }} />
                      ) : <ImageIcon size={20} color="#94a3b8" />}
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 500 }}>{img.title}</td>
                  <td style={{ padding: '10px 14px', color: '#64748b', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {img.description || '-'}
                  </td>
                  <td style={{ padding: '10px 14px' }}>{img.display_order}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                      background: img.status === 'active' ? '#f0fdf4' : '#fef2f2',
                      color: img.status === 'active' ? '#059669' : '#dc2626'
                    }}>
                      {img.status === 'active' ? <Eye size={12} /> : <EyeOff size={12} />}
                      {img.status === 'active' ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(img)}
                        style={{ background: '#eff6ff', color: '#3b82f6', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Edit3 size={12} /> Edit
                      </button>
                      <button onClick={() => handleDelete(img)}
                        style={{ background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 560,
            maxHeight: '85vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>{editing ? 'Edit Image' : 'Add New Image'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} />
              </button>
            </div>

            {error && (
              <div style={{ padding: '10px', background: '#fef2f2', color: '#dc2626', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>{error}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Category *</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1.5px solid #e2e8f0', fontSize: 13 }}>
                    {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Display Order *</label>
                  <input type="number" value={form.display_order} onChange={e => setForm(f => ({ ...f, display_order: e.target.value }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1.5px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Title *</label>
                  <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} maxLength={255} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1.5px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1.5px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box', resize: 'vertical' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Date Taken</label>
                  <input type="date" value={form.date_taken} onChange={e => setForm(f => ({ ...f, date_taken: e.target.value }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1.5px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Location</label>
                  <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} maxLength={255} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1.5px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Image File {!editing ? '*' : ''}</label>
                  <input type="file" accept="image/jpeg,image/png,image/webp" ref={fileRef}
                    onChange={e => setForm(f => ({ ...f, image: e.target.files[0] }))}
                    style={{ width: '100%', fontSize: 13 }} />
                  {form.image && <p style={{ fontSize: 12, color: '#059669', margin: '4px 0 0' }}>{form.image.name}</p>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Status</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 13 }}>
                      <input type="radio" value="active" checked={form.status === 'active'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} /> Active
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 13 }}>
                      <input type="radio" value="hidden" checked={form.status === 'hidden'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} /> Hidden
                    </label>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ flex: 1, background: '#f1f5f9', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  style={{
                    flex: 1, background: saving ? '#e2e8f0' : '#059669', color: saving ? '#94a3b8' : 'white',
                    border: 'none', padding: '10px', borderRadius: 8, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}>
                  <Save size={16} /> {saving ? 'Saving...' : editing ? 'Update Image' : 'Upload Image'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
