import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import salesService from '../../services/salesService';
import printingService from '../../services/printingService';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters';

const salesHomeStyles = `
  @media (max-width: 768px) {
    .saleshome-table-wrap { overflow-x: auto; }
    .saleshome-table-wrap table { min-width: 400px; }
    .saleshome-print-grid { grid-template-columns: repeat(2, 1fr) !important; }
  }
  @media (max-width: 480px) {
    .saleshome-print-grid { grid-template-columns: 1fr !important; }
  }
`;
const SalesHome = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [printingStats, setPrintingStats] = useState(null);
  const [printingOrders, setPrintingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [salesRes, printStatsRes, printOrdersRes] = await Promise.allSettled([
          salesService.getSalesReports({ range: 'today' }),
          printingService.getStatistics(),
          printingService.getOrders({ limit: 5 }),
        ]);
        if (salesRes.status === 'fulfilled') {
          setStats(salesRes.value.data?.data || salesRes.value.data);
        }
        if (printStatsRes.status === 'fulfilled') {
          setPrintingStats(printStatsRes.value.data?.data);
        }
        if (printOrdersRes.status === 'fulfilled') {
          setPrintingOrders(printOrdersRes.value.data?.data?.orders || []);
        }
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
      <style>{salesHomeStyles}</style>
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
          <div className="saleshome-table-wrap">
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
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
            <p>No sales recorded today. Head to the Point of Sale to make your first transaction!</p>
          </div>
        )}
      </div>
      <div className="card" style={{ padding: '24px', marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>🖨️ Printing Orders</h3>
          <button onClick={() => navigate('/printing/orders')} style={{ background: 'none', border: '1px solid #e2e8f0', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
            View All →
          </button>
        </div>
        <div className="saleshome-print-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div style={{ background: '#f0f9ff', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>This Month Revenue</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{formatCurrency(printingStats?.monthlyRevenue?.[0]?.revenue || 0)}</div>
          </div>
          <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Pending Orders</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{printingStats?.pendingOrders ?? 0}</div>
          </div>
          <div style={{ background: '#fffbeb', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Past Due</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#dc2626' }}>{printingStats?.pastDueOrders ?? 0}</div>
          </div>
          <div style={{ background: '#f5f3ff', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Orders</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{printingStats?.totalOrders ?? 0}</div>
          </div>
        </div>
        {printingOrders.length > 0 && (
          <div className="saleshome-table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.875rem' }}>
                <th style={{ padding: '0.5rem 0' }}>Order #</th>
                <th style={{ padding: '0.5rem 0' }}>Customer</th>
                <th style={{ padding: '0.5rem 0' }}>Product</th>
                <th style={{ padding: '0.5rem 0' }}>Amount</th>
                <th style={{ padding: '0.5rem 0' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {printingOrders.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => navigate(`/printing/orders/${order.id}`)}>
                  <td style={{ padding: '0.75rem 0', fontWeight: 500 }}>{order.order_number}</td>
                  <td style={{ padding: '0.75rem 0' }}>{order.customer_name}</td>
                  <td style={{ padding: '0.75rem 0' }}>{order.product_type}</td>
                  <td style={{ padding: '0.75rem 0', fontWeight: 600 }}>{formatCurrency(order.total_price)}</td>
                  <td style={{ padding: '0.75rem 0' }}><span style={{ padding: '2px 8px', borderRadius: '4px', background: order.status_code === 'delivered' ? '#dcfce7' : order.status_code === 'in_progress' ? '#dbeafe' : '#fef3c7', fontSize: '0.8rem' }}>{order.status_name}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
};
export default SalesHome;
