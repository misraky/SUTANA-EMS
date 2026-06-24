import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import { formatNumber, formatDate } from '../../utils/formatters';

const DIMENSIONS = [
  { key: 'roleDesigner', label: 'Role Designer', color: '#16a34a', path: '/admin/role-designer' },
  { key: 'tenants', label: 'Tenant Management', color: '#65a30d', path: '/admin/tenants' },
  { key: 'dr', label: 'Disaster Recovery', color: '#57534e', path: '/admin/dr' },
  { key: 'apiKeys', label: 'API Access Keys', color: '#6366f1', path: '/admin/api-keys' },
];
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const AdminHome = () => {
  const [dashboardData, setDashboardData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, healthRes, drRes, apiKeysRes] = await Promise.allSettled([
          adminService.getDashboardStats(),
          adminService.getSystemHealth(),
          adminService.getDRStatus(),
          adminService.getApiKeys(),
        ]);
        setDashboardData({
          stats: statsRes.value?.data,
          health: healthRes.value?.data,
          dr: drRes.value?.data,
          apiKeys: apiKeysRes.value?.data,
        });
        const response = await apiClient.get('/admin/dashboard/stats');
        setStats(response.data?.data || response.data);
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const dimStatuses = useMemo(() => {
    const d = dashboardData;
    return {
      roleDesigner: { status: 'ok', count: 0 },
      tenants: { status: 'ok', count: 0 },
      dr: { status: d.dr?.lastTest?.status === 'passed' ? 'ok' : 'warning', count: d.dr?.lastTest ? 1 : 0 },
      apiKeys: { status: d.apiKeys?.length > 0 ? 'ok' : 'info', count: d.apiKeys?.length || 0 },
    };
  }, [dashboardData]);

  if (loading) return <div className="loading-state">Loading dashboard...</div>;

  const { stats, health } = dashboardData;
  const userStats = stats?.userStats || {};
  const sysHealth = health || {};
  const backup2 = stats?.backupStatus || {};
  const bh2 = stats?.graphs?.backupHistory || { successful: 0, total: 30 };
  const backupPct2 = bh2.total > 0 ? Math.round((bh2.successful / bh2.total) * 100) : 0;
  const backupColor2 = backupPct2 >= 97 ? '#10b981' : backupPct2 >= 90 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ padding: '4px 0' }}>
      {/* ── 4 KPI Cards ── */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-header"><span className="stat-label">Total Users</span></div>
          <div className="stat-value">{formatNumber(userStats.total || 0)}</div>
          <span className="stat-badge info">+{formatNumber(userStats.newToday || 0)} this month</span>
        </div>
        <div className="stat-card">
          <div className="stat-header"><span className="stat-label">Active Sessions</span></div>
          <div className="stat-value">{stats?.activeSessions || 0}</div>
          <span className={`stat-badge ${(stats?.activeSessions || 0) > 20 ? 'warning' : 'up'}`}>
            {(stats?.activeSessions || 0) > 20 ? 'High' : 'Normal'}
          </span>
        </div>
        <div className="stat-card purple">
          <div className="stat-content">
            <h3>{formatNumber(userStats.newToday || 0)}</h3>
            <p>New Today</p>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-content">
            <h3>{dashboardData.tiers?.coverage ? Object.keys(dashboardData.tiers.coverage).length : 0}</h3>
            <p>Admin Tiers</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-header"><span className="stat-label">Alerts Today</span></div>
          <div className="stat-value">{stats?.alertCountToday || 0}</div>
          {(stats?.alertCountToday || 0) > 0 && (
            <span className="stat-badge warning">Review required</span>
          )}
        </div>
        <div className="stat-card">
          <div className="stat-header"><span className="stat-label">Pending Actions</span></div>
          <div className="stat-value">
            {((stats?.pendingActions?.pendingOrders?.count || 0) + (stats?.pendingActions?.lowStockItems || 0))}
          </div>
          <span className="stat-badge down">Action needed</span>
        </div>
      </div>

      <div className="dashboard-grid-2col">
        <div className="widget">
          <h2>System Modules</h2>
          <div className="dimension-grid">
            {DIMENSIONS.map(dim => {
              const s = dimStatuses[dim.key] || { status: 'info', count: 0 };
              return (
                <Link to={dim.path} key={dim.key} className={`dimension-card status-${s.status}`}>
                  <div className="dim-indicator" style={{ backgroundColor: dim.color }} />
                  <div className="dim-info">
                    <span className="dim-label">{dim.label}</span>
                    <span className="dim-count">{s.count}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="widget">
          <h2>System Status</h2>
          <div className="health-metrics">
            <div className="health-bar">
              <label>CPU ({Math.round(sysHealth.cpu?.usage || 0)}%)</label>
              <div className="progress-bg">
                <div className={`progress-fill ${sysHealth.cpu?.status || 'healthy'}`} style={{ width: `${sysHealth.cpu?.usage || 0}%` }} />
              </div>
            </div>
            <div className="health-bar">
              <label>Memory ({Math.round(sysHealth.memory?.usage || 0)}%)</label>
              <div className="progress-bg">
                <div className={`progress-fill ${sysHealth.memory?.status || 'healthy'}`} style={{ width: `${sysHealth.memory?.usage || 0}%` }} />
              </div>
            </div>
            <div className="health-bar">
              <label>Disk ({Math.round(sysHealth.disk?.usage || 0)}%)</label>
              <div className="progress-bg">
                <div className={`progress-fill ${sysHealth.disk?.status || 'healthy'}`} style={{ width: `${sysHealth.disk?.usage || 0}%` }} />
              </div>
            </div>
          </div>
          <h3 style={{ marginTop: 24 }}>Access Alerts</h3>
          <div className="alert-list">
            {dimStatuses.dr?.status === 'warning' && <div className="alert-item warning">DR: No recent test passed</div>}
            {dimStatuses.apiKeys?.count === 0 && <div className="alert-item info">No API keys registered</div>}
            {dimStatuses.dr?.status === 'ok' && <div className="alert-item ok">System operations nominal</div>}
          </div>
        </div>
      </div>

      {/* ── 6 Graphs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* 1. System Uptime */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: '#0f172a' }}>System Uptime</h3>
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>6-month availability trend</p>
          {graphs.uptimeHistory && graphs.uptimeHistory.length > 0 && (
            <>
              <div style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={graphs.uptimeHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis domain={[96, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip formatter={v => [`${v.toFixed(1)}%`, 'Uptime']} />
                    <Line type="monotone" dataKey="uptime" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="stat-badge up">
                  {graphs.uptimeHistory[graphs.uptimeHistory.length - 1]?.uptime.toFixed(1)}% &check; Good
                </span>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>Target: 99%</span>
              </div>
            </>
          )}
        </div>

        {/* 2. Backup Success Rate */}
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: '#0f172a', textAlign: 'left' }}>Backup Success Rate</h3>
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12, textAlign: 'left' }}>30-day rolling</p>
          {bh.total > 0 && (
            <>
              <div style={{ position: 'relative', width: 160, height: 160, margin: '0 auto 12px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[
                      { name: 'Successful', value: bh.successful },
                      { name: 'Failed', value: Math.max(0, bh.total - bh.successful) }
                    ]} cx="50%" cy="50%" innerRadius={50} outerRadius={70} startAngle={90} endAngle={-270} dataKey="value">
                      <Cell fill={backupColor} />
                      <Cell fill="#e2e8f0" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: backupColor }}>{backupPct}%</div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>success</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#475569' }}>
                <strong>{bh.successful}/{bh.total}</strong> Successful
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                Last: {bh.lastSuccess ? formatDate(bh.lastSuccess) : 'N/A'} &middot; Next: {backup.nextBackup || 'Not scheduled'}
              </div>
            </>
          )}
        </div>

        {/* 3. Intrusion Attempts */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: '#0f172a' }}>Intrusion Attempts</h3>
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>Failed logins (last 7 days)</p>
          {graphs.intrusionHistory && graphs.intrusionHistory.length > 0 && (
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={graphs.intrusionHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip formatter={v => [v, 'Attempts']} />
                  <Bar dataKey="attempts" radius={[4, 4, 0, 0]}>
                    {graphs.intrusionHistory.map((entry, idx) => (
                      <Cell key={idx} fill={entry.attempts > 10 ? '#ef4444' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div style={{ marginTop: 8, display: 'flex', gap: 16, fontSize: 11, color: '#94a3b8' }}>
            <span>Total: <strong>{graphs.intrusionHistory?.reduce((s, d) => s + d.attempts, 0) || 0}</strong></span>
            <span>Critical: <strong style={{ color: '#ef4444' }}>{graphs.intrusionHistory?.filter(d => d.attempts > 10).length || 0}</strong></span>
          </div>
        </div>

        {/* 4. CPU & Memory Usage */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: '#0f172a' }}>CPU &amp; Memory Usage</h3>
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>24-hour trend</p>
          {graphs.cpuMemHistory && graphs.cpuMemHistory.length > 0 && (
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={graphs.cpuMemHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="cpu" stroke="#3b82f6" fill="rgba(59,130,246,0.15)" name="CPU" />
                  <Area type="monotone" dataKey="memory" stroke="#10b981" fill="rgba(16,185,129,0.15)" name="Memory" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          <div style={{ marginTop: 8, display: 'flex', gap: 16, fontSize: 12 }}>
            <span>CPU: <strong>{sysHealth.cpu?.usage?.toFixed(0) || 0}%</strong></span>
            <span>RAM: <strong>{sysHealth.memory?.usage?.toFixed(0) || 0}%</strong></span>
            <span>Disk: <strong>41%</strong></span>
          </div>
        </div>

        {/* 5. Patch Compliance */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: '#0f172a' }}>Patch Compliance</h3>
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>Systems patch status</p>
          {graphs.patchCompliance && (
            <>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span>Overall</span>
                  <span>{graphs.patchCompliance.patched}/{graphs.patchCompliance.patched + graphs.patchCompliance.unpatched} patched</span>
                </div>
                <div style={{ height: 10, background: '#e2e8f0', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(graphs.patchCompliance.patched / (graphs.patchCompliance.patched + graphs.patchCompliance.unpatched || 1)) * 100}%`, background: '#10b981', borderRadius: 5 }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span>Critical Systems</span>
                  <span>{graphs.patchCompliance.criticalPatched}% patched</span>
                </div>
                <div style={{ height: 10, background: '#e2e8f0', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${graphs.patchCompliance.criticalPatched}%`, background: '#3b82f6', borderRadius: 5 }} />
                </div>
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: '#94a3b8' }}>
                Target: 95% &middot; {graphs.patchCompliance.unpatched > 0 ? `${graphs.patchCompliance.unpatched} system(s) need update` : 'All systems up to date'}
              </div>
            </>
          )}
        </div>

        {/* 6. Incident MTTR */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: '#0f172a' }}>Incident MTTR</h3>
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>Mean time to resolution (6-month trend)</p>
          {graphs.mttrHistory && graphs.mttrHistory.length > 0 && (
            <>
              <div style={{ height: 150 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={graphs.mttrHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis domain={[0, 8]} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip formatter={v => [`${v.toFixed(1)} hrs`, 'MTTR']} />
                    <Line type="monotone" dataKey="hours" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3, fill: '#8b5cf6' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="stat-badge up">
                  {graphs.mttrHistory[graphs.mttrHistory.length - 1]?.hours.toFixed(1)} hrs &check; Good
                </span>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>Target: &lt; 4 hrs</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="widget mt-4">
        <h2>Quick Access — Modules</h2>
        <div className="quick-links">
          {DIMENSIONS.map(dim => (
            <Link key={dim.key} to={dim.path} className="quick-link" style={{ borderLeftColor: dim.color }}>
              <span>{dim.label}</span>
              <span className="arrow">&rarr;</span>
            </Link>
          ))}
          </div>
        </div>
      {/* ── System Health Row ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#0f172a' }}>System Health</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {[
            { label: 'CPU Usage', value: sysHealth.cpu?.usage || 0, status: sysHealth.cpu?.status || 'healthy' },
            { label: 'Memory Usage', value: sysHealth.memory?.usage || 0, status: sysHealth.memory?.status || 'healthy' },
            { label: 'Disk Usage', value: sysHealth.disk?.usage || 41, status: 'healthy' }
          ].map(item => (
            <div key={item.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span>{item.label}</span>
                <span style={{ fontWeight: 600 }}>{item.value.toFixed(1)}%</span>
              </div>
              <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${Math.min(item.value, 100)}%`, borderRadius: 4,
                  background: item.value > 80 ? '#ef4444' : item.value > 60 ? '#f59e0b' : '#10b981',
                  transition: 'width 0.5s'
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent Audit Logs ── */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Recent Audit Logs</h3>
          <span style={{ fontSize: 12, color: '#3b82f6', cursor: 'pointer' }}>View All &rarr;</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Time</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>User</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Action</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Resource</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>IP</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.recentAudits || []).map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 12px', color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>{formatDate(log.created_at)}</td>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{log.full_name || 'System'}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{
                      display: 'inline-flex', padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 600,
                      background: log.action?.includes('FAIL') ? '#fee2e2' : '#dcfce7',
                      color: log.action?.includes('FAIL') ? '#ef4444' : '#10b981'
                    }}>{log.action}</span>
                  </td>
                  <td style={{ padding: '8px 12px', color: '#475569' }}>{log.resource || '-'}</td>
                  <td style={{ padding: '8px 12px', color: '#94a3b8', fontSize: 12 }}>{log.ip_address}</td>
                </tr>
              ))}
              {(stats?.recentAudits || []).length === 0 && (
                <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No recent activity found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
