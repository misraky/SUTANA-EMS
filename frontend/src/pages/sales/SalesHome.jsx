import React, { useState, useEffect } from 'react';
import salesService from '../../services/salesService';
import { formatCurrency, formatNumber } from '../../utils/formatters';
const SalesHome = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await salesService.getSalesReports({ range: 'today' });
        setStats(response.data?.data || response.data);
      } catch (error) {
        console.error('Failed to fetch sales overview:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);
  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading sales overview...</div>;
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Overview</h1>
          <p className="page-subtitle">Monitor revenue, customer activity, and daily sales performance.</p>
        </div>
      </div>
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Today's Revenue</span>
          <span className="stat-value">{formatCurrency(stats?.totalRevenue || 0)}</span>
          <span className="stat-badge success">Live</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Orders Today</span>
          <span className="stat-value">{formatNumber(stats?.totalTransactions || 0)}</span>
          <span className="stat-badge info">Sales</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Active Customers</span>
          <span className="stat-value">{formatNumber(stats?.uniqueCustomers || 0)}</span>
          <span className="stat-badge info">Customers</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Avg Order Value</span>
          <span className="stat-value">{formatCurrency(stats?.averageOrderValue || 0)}</span>
          <span className="stat-badge warning">Metric</span>
        </div>
      </div>
      <div className="card" style={{ padding: '32px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
          Top Selling Products Today
        </h3>
        {stats?.topProducts && stats.topProducts.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.875rem' }}>
                <th style={{ padding: '0.75rem 0' }}>Product</th>
                <th style={{ padding: '0.75rem 0' }}>Units Sold</th>
                <th style={{ padding: '0.75rem 0' }}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {stats.topProducts.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem 0', fontWeight: 500 }}>{item.name}</td>
                  <td style={{ padding: '1rem 0' }}>{formatNumber(item.quantity)}</td>
                  <td style={{ padding: '1rem 0', fontWeight: 600, color: '#0f172a' }}>{formatCurrency(item.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
            <p>No sales recorded today. Head to the Point of Sale to make your first transaction!</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default SalesHome;
