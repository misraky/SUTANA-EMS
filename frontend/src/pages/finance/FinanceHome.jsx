import React, { useState, useEffect } from 'react';
import financeService from '../../services/financeService';
const FinanceHome = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await financeService.getStatistics();
        setStats(response.data?.data || null);
      } catch (error) {
        console.error('Failed to fetch finance statistics', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0);
  };
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Financial Summary</h1>
          <p className="page-subtitle">Overview of income, expenses, and financial health at a glance.</p>
        </div>
      </div>
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Total Revenue</span>
          <span className="stat-value">{loading ? '...' : formatCurrency(stats?.monthlyRevenue)}</span>
          <span className="stat-badge up">↑ ETB</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Expenses</span>
          <span className="stat-value">{loading ? '...' : formatCurrency(stats?.monthlyExpenses)}</span>
          <span className="stat-badge down">↓ ETB</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Net Profit</span>
          <span className="stat-value">{loading ? '...' : formatCurrency(stats?.netProfit)}</span>
          <span className="stat-badge info">This Month</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Pending Payments</span>
          <span className="stat-value">{loading ? '...' : (stats?.pendingApprovals || 0)}</span>
          <span className="stat-badge warning">Review</span>
        </div>
      </div>
      <div className="card" style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>💰</div>
        <p style={{ fontSize: 15 }}>Go to <strong>Payments</strong> or <strong>Expenses</strong> to manage financial records.</p>
      </div>
    </div>
  );
};
export default FinanceHome;
