import React, { useState, useEffect } from 'react';
import axios from '../../services/apiClient';
import { BarChart2, DollarSign, ShoppingCart, Users, TrendingUp, Clock, Package, AlertTriangle } from 'lucide-react';

export default () => {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dashRes, trendRes] = await Promise.all([axios.get('/retail/manager/dashboard'), axios.get('/retail/manager/sales-trends?period=daily')]);
      if (dashRes.status === 'success') setStats(dashRes.data);
      if (trendRes.status === 'success') setTrends(trendRes.data.trends || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const cards = [
    { label: 'Total Sales (Today)', value: stats?.totalSales || 0, icon: <DollarSign size={24} />, color: '#059669', bg: '#ecfdf5', fmt: 'etb' },
    { label: 'Transactions', value: stats?.transactionCount || 0, icon: <ShoppingCart size={24} />, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Cash Sales', value: stats?.cashSales || 0, icon: <TrendingUp size={24} />, color: '#d97706', bg: '#fffbeb', fmt: 'etb' },
    { label: 'Avg / Transaction', value: stats?.avgTransaction || 0, icon: <BarChart2 size={24} />, color: '#8b5cf6', bg: '#f5f3ff', fmt: 'etb' },
    { label: 'Open Shifts', value: stats?.openShifts || 0, icon: <Clock size={24} />, color: '#ec4899', bg: '#fdf2f8' },
    { label: 'Low Stock Items', value: stats?.lowStockItems || 0, icon: <AlertTriangle size={24} />, color: '#dc2626', bg: '#fef2f2' },
  ];

  return (
    <div>
      <h2 style={{ margin: '0 0 1.5rem' }}>Retail Manager Dashboard</h2>

      {loading ? <p>Loading dashboard...</p> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
            {cards.map(c => (
              <div key={c.label} style={{ background: 'white', borderRadius: 12, padding: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{c.label}</span>
                  <span style={{ color: c.color, background: c.bg, borderRadius: 8, padding: '6px', display: 'flex' }}>{c.icon}</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>
                  {c.fmt === 'etb' ? `${parseFloat(c.value).toFixed(2)} ETB` : c.value}
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: 'white', borderRadius: 12, padding: '1.5rem', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><TrendingUp size={18} /> Sales Trends (Last 30 days)</h3>
            {trends.length === 0 ? <p style={{ color: '#94a3b8' }}>No sales data yet.</p> : (
              <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 120 }}>
                {trends.slice().reverse().map((t, i) => {
                  const maxVal = Math.max(...trends.map(x => parseFloat(x.revenue)), 1);
                  const pct = (parseFloat(t.revenue) / maxVal) * 100;
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: '100%', background: '#059669', borderRadius: '4px 4px 0 0', height: `${Math.max(pct, 2)}%`, minHeight: 4, transition: 'height 0.3s' }} title={`${t.date}: ${parseFloat(t.revenue).toFixed(2)} ETB`} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
