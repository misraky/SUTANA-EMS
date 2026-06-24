import React, { useState, useEffect } from 'react';
import notificationService from '../../services/notificationService';
import { Bell, FileText, Briefcase, Video, CheckCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'news', label: 'News' },
  { key: 'hiring', label: 'Hiring' },
  { key: 'notice', label: 'Notice' },
  { key: 'video', label: 'Video' },
];

const TYPE_ICONS = { news: '\uD83D\uDCF0', hiring: '\uD83D\uDCBC', notice: '\uD83D\uDD14', video: '\uD83C\uDFAC', photo_gallery: '\uD83D\uDDBC\uFE0F' };

export default () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => { fetchNotifications(); }, [filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getMyNotifications(filter);
      if (res.status === 'success') setNotifications(res.data);
    } catch (_) { /* ignore */ }
    finally { setLoading(false); }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      fetchNotifications();
    } catch (_) { /* ignore */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      fetchNotifications();
    } catch (_) { /* ignore */ }
  };

  const unread = notifications.filter(n => !n.isRead).length;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>Notifications</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>{unread} unread</p>
        </div>
        {unread > 0 && (
          <button onClick={handleMarkAllRead} style={{
            background: '#f0fdf4', color: '#059669', border: 'none', padding: '8px 16px',
            borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
          }}>
            <CheckCircle size={14} /> Mark All Read
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{
              padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12,
              background: filter === f.key ? '#059669' : '#f1f5f9',
              color: filter === f.key ? 'white' : '#64748b',
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: '#94a3b8' }}>Loading...</p>
      ) : notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8' }}>
          <Bell size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p>No notifications yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.map(n => (
            <div key={n.id} style={{
              display: 'flex', gap: 14, padding: '16px 18px',
              background: n.isRead ? 'white' : '#f0fdf4',
              borderRadius: 12, border: `1px solid ${n.isRead ? '#e2e8f0' : '#bbf7d0'}`,
              alignItems: 'flex-start', transition: 'all 0.15s'
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: n.isRead ? '#f1f5f9' : '#dcfce7', fontSize: 18, flexShrink: 0
              }}>
                {TYPE_ICONS[n._type] || '\uD83D\uDD14'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{n.title}</h3>
                {n.message && (
                  <p style={{ margin: '0 0 6px', fontSize: 13, color: '#475569', lineHeight: 1.5 }}>{n.message}</p>
                )}
                {n._type === 'hiring' && n.hiringPosition && (
                  <div style={{ fontSize: 12, color: '#059669', marginBottom: 6 }}>
                    {n.hiringPosition} — Deadline: {n.hiringDeadline ? new Date(n.hiringDeadline).toLocaleDateString('en-CA') : ''}
                    {n.hiringEmail && (
                      <a href={`mailto:${n.hiringEmail}`} style={{ marginLeft: 12, color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}>Apply Now</a>
                    )}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 11, color: '#94a3b8' }}>
                  <span>{new Date(n.createdAt).toLocaleString()}</span>
                  {!n.isRead && (
                    <button onClick={() => handleMarkRead(n.id)} style={{
                      background: 'none', border: 'none', color: '#059669', cursor: 'pointer', fontWeight: 600, fontSize: 11,
                      display: 'flex', alignItems: 'center', gap: 3, padding: 0
                    }}>
                      <Eye size={12} /> Mark as Read
                    </button>
                  )}
                  {n.isRead && <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3 }}><EyeOff size={12} /> Read</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
