import React, { useState, useEffect, useRef } from 'react';
import axios from '../../services/apiClient';
import { Plus, Edit3, Trash2, X, Save, Send, Eye, EyeOff, FileText, Video, Image, Briefcase, Bell } from 'lucide-react';

const POST_TYPES = [
  { key: 'news', label: 'News', icon: <FileText size={16} /> },
  { key: 'hiring', label: 'Hiring', icon: <Briefcase size={16} /> },
  { key: 'notice', label: 'Notice', icon: <Bell size={16} /> },
  { key: 'video', label: 'Video', icon: <Video size={16} /> },
  { key: 'photo_gallery', label: 'Photo Gallery', icon: <Image size={16} /> },
];

const TYPE_ICONS = { news: '\uD83D\uDCF0', hiring: '\uD83D\uDCBC', notice: '\uD83D\uDD14', video: '\uD83C\uDFAC', photo_gallery: '\uD83D\uDDBC\uFE0F' };
const TYPE_LABELS = { news: 'News', hiring: 'Hiring', notice: 'Notice', video: 'Video', photo_gallery: 'Photo Gallery' };

const INITIAL_FORM = {
  type: 'news', title: '', content: '', visibility: 'public',
  youtube_url: '', hiring_position: '', hiring_deadline: '', hiring_email: '', hiring_location: '',
  status: 'draft', send_notification: true,
};

export default () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/news');
      if (res.status === 'success') setPosts(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setForm({ ...INITIAL_FORM });
    setEditing(null);
    setImageFiles([]);
    setImagePreview(null);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const openEdit = (p) => {
    setForm({
      type: p.type, title: p.title, content: p.content || '',
      visibility: p.visibility, youtube_url: p.youtube_url || '',
      hiring_position: p.hiring_position || '', hiring_deadline: p.hiring_deadline ? p.hiring_deadline.split('T')[0] : '',
      hiring_email: p.hiring_email || '', hiring_location: p.hiring_location || '',
      status: p.status, send_notification: p.send_notification !== false,
    });
    setEditing(p.id);
    setImageFiles([]);
    setImagePreview(null);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const validate = () => {
    if (!form.title.trim()) { setError('Title is required'); return false; }
    if (form.type === 'video') {
      if (!form.youtube_url.trim()) { setError('YouTube URL is required for video posts'); return false; }
      const re = /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
      if (!re.test(form.youtube_url)) { setError('Invalid YouTube URL format'); return false; }
    }
    if (form.type === 'hiring') {
      if (!form.hiring_position.trim()) { setError('Position is required'); return false; }
      if (!form.hiring_deadline) { setError('Deadline is required'); return false; }
      if (new Date(form.hiring_deadline) <= new Date()) { setError('Deadline must be a future date'); return false; }
      if (form.hiring_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.hiring_email)) { setError('Invalid email format'); return false; }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true); setError(''); setSuccess('');

    try {
      const action = e.nativeEvent.submitter?.value || 'draft';
      const payload = { ...form, status: action };
      if (!payload.content) delete payload.content;
      if (payload.type !== 'video') { delete payload.youtube_url; }
      if (payload.type !== 'hiring') {
        delete payload.hiring_position; delete payload.hiring_deadline;
        delete payload.hiring_email; delete payload.hiring_location;
      }

      if (editing) {
        const res = await axios.put(`/news/${editing}`, payload);
        if (res.data?.status === 'success') setSuccess('Post updated!');
      } else {
        const res = await axios.post('/news', payload);
        if (res.data?.status === 'success') setSuccess('Post created!');
      }
      setShowForm(false);
      fetchPosts();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (p) => {
    if (!confirm('Delete this post permanently?')) return;
    try {
      const res = await axios.delete(`/news/${p.id}`);
      if (res.status === 'success') { setSuccess('Post deleted'); fetchPosts(); }
    } catch (err) { alert(err.response?.data?.message || 'Delete failed'); }
  };

  const statusBadge = (s) => {
    const m = { draft: ['#fef3c7', '#92400e'], published: ['#f0fdf4', '#059669'], archived: ['#f1f5f9', '#64748b'] };
    const [bg, color] = m[s] || m.draft;
    return <span style={{ background: bg, color, padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{s}</span>;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>News & Notices Manager</h2>
        <button onClick={openAdd} style={{
          background: '#059669', color: 'white', border: 'none', padding: '10px 20px',
          borderRadius: 8, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
        }}>
          <Plus size={16} /> New Post
        </button>
      </div>

      {success && (
        <div style={{ padding: '10px 14px', background: '#f0fdf4', color: '#059669', borderRadius: 8, marginBottom: 12, fontSize: 13, fontWeight: 600 }}>
          {success}
        </div>
      )}

      {loading ? <p>Loading...</p> : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8' }}>
          <p>No posts yet. Click "New Post" to create one.</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 600 }}>
            <thead>
              <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px' }}>Type</th>
                <th style={{ padding: '12px 14px' }}>Title</th>
                <th style={{ padding: '12px 14px' }}>Date</th>
                <th style={{ padding: '12px 14px' }}>Status</th>
                <th style={{ padding: '12px 14px' }}>Visibility</th>
                <th style={{ padding: '12px 14px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map(p => (
                <tr key={p.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>{TYPE_ICONS[p.type] || '\uD83D\uDCCB'} {TYPE_LABELS[p.type] || p.type}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 500 }}>{p.title}</td>
                  <td style={{ padding: '10px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>{new Date(p.created_at).toLocaleDateString('en-CA')}</td>
                  <td style={{ padding: '10px 14px' }}>{statusBadge(p.status)}</td>
                  <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                    {p.visibility === 'public' ? <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={14} /> Public</span>
                      : <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4 }}><EyeOff size={14} /> Employees</span>}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(p)} style={{ background: '#eff6ff', color: '#3b82f6', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Edit3 size={12} /> Edit
                      </button>
                      <button onClick={() => handleDelete(p)} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
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

      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 640,
            maxHeight: '85vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>{editing ? 'Edit Post' : 'New Post'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} />
              </button>
            </div>

            {error && <div style={{ padding: '10px', background: '#fef2f2', color: '#dc2626', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Post Type *</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {POST_TYPES.map(t => (
                    <label key={t.key} style={{
                      display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
                      padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      background: form.type === t.key ? '#f0fdf4' : '#f8fafc',
                      border: `2px solid ${form.type === t.key ? '#059669' : '#e2e8f0'}`,
                      color: form.type === t.key ? '#059669' : '#475569',
                      transition: 'all 0.1s'
                    }}>
                      <input type="radio" name="ptype" value={t.key} checked={form.type === t.key}
                        onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={{ display: 'none' }} />
                      {t.icon} {t.label}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Title *</label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} maxLength={255}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1.5px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box' }} />
              </div>

              {form.type !== 'photo_gallery' && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Content {form.type !== 'hiring' && form.type !== 'video' ? '*' : ''}</label>
                  <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1.5px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
                    placeholder="Write your post content here..." />
                </div>
              )}

              {form.type === 'video' && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>YouTube URL *</label>
                  <input type="text" value={form.youtube_url} onChange={e => setForm(f => ({ ...f, youtube_url: e.target.value }))}
                    placeholder="https://youtube.com/watch?v=..."
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1.5px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box' }} />
                  {form.youtube_url && /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/.test(form.youtube_url) && (
                    <div style={{ marginTop: 8, aspectRatio: '16/9', background: '#0f172a', borderRadius: 8, overflow: 'hidden' }}>
                      <iframe src={`https://www.youtube.com/embed/${form.youtube_url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)[1]}`}
                        title="Preview" style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen />
                    </div>
                  )}
                </div>
              )}

              {form.type === 'hiring' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Position *</label>
                    <input type="text" value={form.hiring_position} onChange={e => setForm(f => ({ ...f, hiring_position: e.target.value }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1.5px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Location</label>
                    <input type="text" value={form.hiring_location} onChange={e => setForm(f => ({ ...f, hiring_location: e.target.value }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1.5px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Deadline *</label>
                    <input type="date" value={form.hiring_deadline} onChange={e => setForm(f => ({ ...f, hiring_deadline: e.target.value }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1.5px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Apply Email</label>
                    <input type="email" value={form.hiring_email} onChange={e => setForm(f => ({ ...f, hiring_email: e.target.value }))} placeholder="hr@sutana.com" style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1.5px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                </div>
              )}

              {form.type === 'photo_gallery' && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Images (JPG/PNG, max 5MB each)</label>
                  <input type="file" accept="image/jpeg,image/png" multiple
                    onChange={e => setImageFiles([...e.target.files])}
                    style={{ width: '100%', fontSize: 13 }} />
                  {imageFiles.length > 0 && <p style={{ fontSize: 12, color: '#059669', margin: '4px 0 0' }}>{imageFiles.length} image(s) selected</p>}
                </div>
              )}

              <div style={{ display: 'flex', gap: 24, marginBottom: 12, alignItems: 'center' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Visibility *</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 13 }}>
                      <input type="radio" value="public" checked={form.visibility === 'public'} onChange={e => setForm(f => ({ ...f, visibility: e.target.value }))} /> Public
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 13 }}>
                      <input type="radio" value="employees_only" checked={form.visibility === 'employees_only'} onChange={e => setForm(f => ({ ...f, visibility: e.target.value }))} /> Employees Only
                    </label>
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" checked={form.send_notification} onChange={e => setForm(f => ({ ...f, send_notification: e.target.checked }))} />
                  Send Notification
                </label>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ flex: 1, background: '#f1f5f9', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" name="status" value="draft"
                  style={{ flex: 1, background: '#fef3c7', color: '#92400e', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Save size={16} /> Save Draft
                </button>
                <button type="submit" name="status" value="published"
                  disabled={saving}
                  style={{
                    flex: 1, background: saving ? '#e2e8f0' : '#059669', color: saving ? '#94a3b8' : 'white',
                    border: 'none', padding: '10px', borderRadius: 8, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}>
                  <Send size={16} /> {saving ? 'Saving...' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
