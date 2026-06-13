import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { formatNumber, formatDate } from '../../utils/formatters';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const AdminHome = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.get('/admin/dashboard/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="loading-state">Loading statistics...</div>;

  const userStats = stats?.userStats || {};
  const sysHealth = stats?.systemHealth || {};
  const backup = stats?.backupStatus || {};
  const audits = stats?.recentAudits || [];

  const roleData = stats?.usersByRole ? stats.usersByRole.map(r => ({
    name: r.name, count: r.count
  })) : [];

  return (
    <div className="admin-home">
      <div className="page-header">
        <h1>Admin Overview</h1>
        <p>System status and user activity at a glance</p>
      </div>

      {/* KPI Widgets */}
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
            <p>New Users Today</p>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-content">
            <h3>{formatNumber(stats?.pendingActions?.pendingUsersApproval || 0)}</h3>
            <p>Pending Approvals</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* System Health */}
        <div className="widget system-health">
          <h2>System Health</h2>
          <div className="health-metrics">
            <div className="health-bar">
              <label>CPU Usage ({Math.round(sysHealth.cpu?.usage || 0)}%)</label>
              <div className="progress-bg">
                <div className={`progress-fill ${sysHealth.cpu?.status}`} style={{ width: `${sysHealth.cpu?.usage || 0}%` }}></div>
              </div>
            </div>
            <div className="health-bar">
              <label>Memory Usage ({Math.round(sysHealth.memory?.usage || 0)}%)</label>
              <div className="progress-bg">
                <div className={`progress-fill ${sysHealth.memory?.status}`} style={{ width: `${sysHealth.memory?.usage || 0}%` }}></div>
              </div>
            </div>
            <div className="health-bar">
              <label>Disk Usage ({Math.round(sysHealth.disk?.usage || 0)}%)</label>
              <div className="progress-bg">
                <div className={`progress-fill ${sysHealth.disk?.status}`} style={{ width: `${sysHealth.disk?.usage || 0}%` }}></div>
              </div>
            </div>
          </div>

          <div className="backup-status mt-4">
            <h3>Backup Status</h3>
            <p><strong>Last Backup:</strong> {backup.lastBackup ? formatDate(backup.lastBackup) : 'Never'}</p>
            <p><strong>Next Backup:</strong> {backup.nextBackup ? formatDate(backup.nextBackup) : 'Not Scheduled'}</p>
            <p><strong>Total Backups:</strong> {backup.totalBackups || 0}</p>
          </div>
        </div>

        {/* Roles Chart */}
        <div className="widget roles-chart">
          <h2>Users by Role</h2>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Audits */}
      <div className="recent-activity section widget mt-4">
        <h2>Recent Audit Logs</h2>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Resource</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {audits.map((log) => (
                <tr key={log.id}>
                  <td>{formatDate(log.created_at)}</td>
                  <td>{log.full_name || 'System'}</td>
                  <td><span className={`badge bg-${log.action.includes('FAIL') ? 'danger' : 'primary'}`}>{log.action}</span></td>
                  <td>{log.resource || '-'}</td>
                  <td>{log.ip_address}</td>
                </tr>
              ))}
              {audits.length === 0 && (
                <tr><td colSpan="5" className="text-center">No recent activity found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
