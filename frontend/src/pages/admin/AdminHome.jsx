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

  return (
    <div className="admin-home">
      <div className="page-header">
        <h1>ERP Admin Dashboard</h1>
        <p>Enterprise administration and system governance</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-content">
            <h3>{formatNumber(userStats.total || 0)}</h3>
            <p>Total Users</p>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-content">
            <h3>{formatNumber(userStats.active || 0)}</h3>
            <p>Active Users</p>
          </div>
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
    </div>
  );
};
export default AdminHome;