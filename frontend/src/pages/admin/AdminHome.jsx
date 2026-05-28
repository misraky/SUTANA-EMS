import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { formatNumber } from '../../utils/formatters';
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
  if (loading) return <div>Loading statistics...</div>;
  const statCards = [
    { label: 'Total Users', value: stats?.userStats?.total || 0, icon: 'users', color: 'blue' },
    { label: 'Active Sessions', value: stats?.userStats?.active || 0, icon: 'activity', color: 'green' },
    { label: 'Total Logs', value: stats?.recentAudits?.length || 0, icon: 'list', color: 'purple' },
    { label: 'System Uptime', value: '99.9%', icon: 'clock', color: 'orange' },
  ];
  return (
    <div className="admin-home">
      <div className="page-header">
        <h1>Admin Overview</h1>
        <p>System status and user activity at a glance</p>
      </div>
      <div className="stats-grid">
        {statCards.map((stat) => (
          <div key={stat.label} className={`stat-card ${stat.color}`}>
            <div className="stat-icon">
              <i className={`icon-${stat.icon}`}></i>
            </div>
            <div className="stat-content">
              <h3>{formatNumber(stat.value)}</h3>
              <p>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="recent-activity section">
        <h2>Recent System Activity</h2>
        {}
      </div>
    </div>
  );
};
export default AdminHome;
