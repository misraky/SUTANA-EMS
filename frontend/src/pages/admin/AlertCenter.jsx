import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { formatDateTime } from '../../utils/formatters';

const SEVERITY_ORDER = { critical: 0, warning: 1, info: 2 };
const SEVERITY_COLORS = {
  critical: { bg: '#fef2f2', border: '#fecaca', icon: '#ef4444', label: 'Critical' },
  warning: { bg: '#fffbeb', border: '#fde68a', icon: '#f59e0b', label: 'Warning' },
  info: { bg: '#eff6ff', border: '#bfdbfe', icon: '#3b82f6', label: 'Info' }
};

const AlertCenter = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/alerts');
      setAlerts(res.data?.data?.alerts || []);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlerts(); }, []);

  const handleDismiss = async (alertId) => {
    try {
      await apiClient.post(`/admin/alerts/${alertId}/dismiss`);
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
    }
  };

  const handleDismissAll = async () => {
    for (const alert of alerts) {
      await apiClient.post(`/admin/alerts/${alert.id}/dismiss`);
    }
    setAlerts([]);
  };

  const visible = filter === 'all' ? alerts : alerts.filter(a => a.severity === filter);
  const sorted = [...visible].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || new Date(b.timestamp) - new Date(a.timestamp));

  const counts = { critical: alerts.filter(a => a.severity === 'critical').length, warning: alerts.filter(a => a.severity === 'warning').length, info: alerts.filter(a => a.severity === 'info').length };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Alert Center</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>System notifications and security events</p>
        </div>
        {alerts.length > 0 && (
          <button onClick={handleDismissAll} style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#475569' }}>
            Mark All Read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { key: 'all', label: 'All', count: alerts.length },
          { key: 'critical', label: 'Critical', count: counts.critical },
          { key: 'warning', label: 'Warning', count: counts.warning },
          { key: 'info', label: 'Info', count: counts.info }
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            style={{
              padding: '6px 14px', borderRadius: 9999, border: '1px solid', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              background: filter === tab.key ? '#0f172a' : 'white',
              color: filter === tab.key ? 'white' : '#475569',
              borderColor: filter === tab.key ? '#0f172a' : '#e2e8f0'
            }}>
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>Loading alerts...</div>
      ) : sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>&#10003;</div>
          <p style={{ margin: 0, fontWeight: 600 }}>All clear!</p>
          <p style={{ margin: '4px 0 0', fontSize: 13 }}>No alerts at this time.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.map(alert => {
            const colors = SEVERITY_COLORS[alert.severity] || SEVERITY_COLORS.info;
            return (
              <div key={alert.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '14px 16px', background: colors.bg, borderRadius: 12,
                border: `1px solid ${colors.border}`
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  background: colors.bg, border: `2px solid ${colors.icon}`, fontSize: 14
                }}>
                  {alert.severity === 'critical' ? '!' : alert.severity === 'warning' ? '!' : 'i'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <strong style={{ fontSize: 14, color: '#0f172a' }}>{alert.title}</strong>
                    <span style={{
                      padding: '1px 8px', borderRadius: 9999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                      background: colors.icon, color: 'white'
                    }}>{colors.label}</span>
                    <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto' }}>{formatDateTime(alert.timestamp)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>{alert.description}</p>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    {alert.actionLabel && (
                      <button style={{
                        padding: '5px 12px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 6,
                        cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#0f172a'
                      }}>
                        {alert.actionLabel}
                      </button>
                    )}
                    <button onClick={() => handleDismiss(alert.id)}
                      style={{
                        padding: '5px 12px', background: 'transparent', border: '1px solid transparent', borderRadius: 6,
                        cursor: 'pointer', fontSize: 12, color: '#94a3b8'
                      }}>
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AlertCenter;