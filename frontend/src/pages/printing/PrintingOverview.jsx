import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/apiClient';
import { Printer, ShoppingBag, AlertTriangle, Clock, RefreshCw, TrendingUp, Package, FileText, PlusCircle } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div style={{
    background: 'white', borderRadius: 12, padding: '1.5rem',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex',
    alignItems: 'flex-start', gap: '1rem', borderLeft: `4px solid ${color}`
  }}>
    <div style={{ background: color + '20', borderRadius: 8, padding: 10 }}>
      <Icon size={22} color={color} />
    </div>
    <div>
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#1e293b' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
);

const QuickAction = ({ icon: Icon, label, color, bg, onClick }) => (
  <button onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: 10, background: bg, border: 'none',
    padding: '12px 18px', borderRadius: 10, cursor: 'pointer', color: color,
    fontWeight: 600, fontSize: 13, transition: 'transform 0.1s'
  }}>
    <Icon size={20} /> {label}
  </button>
);

const PrintingOverview = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const [statsRes, ordersRes] = await Promise.all([
        axios.get('/printing/statistics'),
        axios.get('/printing/orders/pending')
      ]);
      if (statsRes.status === 'success') setStats(statsRes.data);
      if (ordersRes.status === 'success') setOrders(ordersRes.data?.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const statusBadge = (code) => {
    const colors = { received: '#9CA3AF', in_progress: '#3B82F6', quality_check: '#F59E0B', ready: '#10B981', delivered: '#059669', cancelled: '#EF4444' };
    return { background: (colors[code] || '#6B7280') + '20', color: colors[code] || '#6B7280' };
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b' }}>Printing Services Dashboard</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            {new Date().toLocaleDateString('en-ET', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', color: '#475569', fontSize: 13 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <p style={{ color: '#64748b' }}>Loading stats...</p>
      ) : !stats ? (
        <p style={{ color: '#ef4444' }}>Failed to load stats.</p>
      ) : (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: '1.5rem' }}>
            <QuickAction icon={PlusCircle} label="+ New Order" color="#3b82f6" bg="#eff6ff" onClick={() => navigate('/printing/create-order')} />
            <QuickAction icon={ShoppingBag} label="Pending Orders" color="#f59e0b" bg="#fffbeb" onClick={() => navigate('/printing/orders')} />
            <QuickAction icon={Package} label="All Orders" color="#10b981" bg="#ecfdf5" onClick={() => navigate('/printing/orders')} />
            <QuickAction icon={FileText} label="Tax Receipts" color="#8b5cf6" bg="#f5f3ff" onClick={() => navigate('/printing/tax-receipts')} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <StatCard icon={Printer} label="Orders" value={stats.totalOrders} color="#3b82f6" sub="Total orders" />
            <StatCard icon={Clock} label="Pending" value={stats.pendingOrders} color="#f59e0b" sub="Not yet delivered" />
            <StatCard icon={AlertTriangle} label="Past Due" value={stats.pastDueOrders} color="#ef4444" sub="Overdue orders" />
            <StatCard icon={TrendingUp} label="Monthly Revenue" value={stats.monthlyRevenue?.[0] ? `${parseFloat(stats.monthlyRevenue[0].revenue).toLocaleString()} ETB` : '0 ETB'} color="#10b981" sub={stats.monthlyRevenue?.[0]?.month || 'No data'} />
          </div>

          {stats.statusBreakdown && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
              {stats.statusBreakdown.map(s => (
                <div key={s.status_code} style={{
                  background: 'white', borderRadius: 8, padding: '12px', textAlign: 'center',
                  border: `1px solid ${s.color_hex || '#e2e8f0'}`, borderTop: `3px solid ${s.color_hex || '#e2e8f0'}`
                }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.color_hex }}>{s.count}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{s.status_name}</div>
                </div>
              ))}
            </div>
          )}

          <h3 style={{ margin: '0 0 1rem', color: '#1e293b', fontSize: 16 }}>Pending Orders</h3>
          {orders.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No pending orders.</p>
          ) : (
            <div style={{ background: 'white', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Order #</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Customer</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Product</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Total</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Due</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 10).map(o => (
                    <tr key={o.id} onClick={() => navigate(`/printing/orders/${o.id}`)} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>{o.order_number}</td>
                      <td style={{ padding: '12px 14px', color: '#475569' }}>{o.customer_name || 'Walk-in'}</td>
                      <td style={{ padding: '12px 14px', color: '#475569' }}>{o.product_type}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>{parseFloat(o.total_price).toLocaleString()} ETB</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ ...statusBadge(o.status_code), padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
                          {o.status_name}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#64748b' }}>{o.due_date ? new Date(o.due_date).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PrintingOverview;
