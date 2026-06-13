import React, { useState, useEffect } from 'react';
import axios from '../../services/apiClient';
import { TrendingUp, Package, ShoppingBag, AlertTriangle, RefreshCw } from 'lucide-react';

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

const FarmingOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/farming/overview/stats');
      if (res.status === 'success') setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b' }}>🌾 Farming Overview</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            {new Date().toLocaleDateString('en-ET', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={load}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', border: 'none',
            padding: '8px 14px', borderRadius: 8, cursor: 'pointer', color: '#475569', fontSize: 13 }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <p style={{ color: '#64748b' }}>Loading stats...</p>
      ) : !stats ? (
        <p style={{ color: '#ef4444' }}>Failed to load stats.</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <StatCard icon={TrendingUp} label="Today's Sales" value={`${stats.todaySales.toLocaleString()} ETB`} color="#10b981" />
            <StatCard icon={ShoppingBag} label="Pending Orders" value={stats.pendingOrders} color="#3b82f6" sub="Awaiting action" />
            <StatCard icon={Package} label="Total Products" value={stats.totalProducts} color="#8b5cf6" sub="Active listings" />
            <StatCard icon={AlertTriangle} label="Low Stock Items" value={stats.lowStockProducts.length} color="#f59e0b" sub="Need reorder" />
          </div>

          {stats.lowStockProducts.length > 0 && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '1.25rem' }}>
              <h3 style={{ margin: '0 0 1rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={18} /> Low Stock Alert
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
                {stats.lowStockProducts.map(p => (
                  <div key={p.id} style={{ background: 'white', borderRadius: 8, padding: '10px 14px', border: '1px solid #fde68a' }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{p.name}</div>
                    <div style={{ color: '#ef4444', fontSize: 12, marginTop: 2 }}>
                      Stock: {p.stock_quantity} / Min: {p.reorder_level}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FarmingOverview;
