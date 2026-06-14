import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/apiClient';
import { TrendingUp, Package, ShoppingBag, AlertTriangle, RefreshCw, ShoppingCart, ClipboardList, DollarSign, Send } from 'lucide-react';

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
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 10, background: bg, border: 'none',
      padding: '12px 18px', borderRadius: 10, cursor: 'pointer', color: color,
      fontWeight: 600, fontSize: 13, transition: 'transform 0.1s',
    }}
    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
    onMouseOut={e => e.currentTarget.style.transform = 'none'}
  >
    <Icon size={20} /> {label}
  </button>
);

const FarmingOverview = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [shift, setShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reorderLoading, setReorderLoading] = useState(null);
  const [reorderMsg, setReorderMsg] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const [statsRes, shiftRes] = await Promise.all([
        axios.get('/farming/overview/stats'),
        axios.get('/farming/shifts/current')
      ]);
      if (statsRes.status === 'success') setStats(statsRes.data);
      if (shiftRes.status === 'success') setShift(shiftRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRequestReorder = async (product) => {
    setReorderLoading(product.id);
    setReorderMsg('');
    try {
      await axios.post('/farming/reorder-requests', {
        product_id: product.id,
        quantity_requested: Math.max(product.reorder_level * 2, 10),
        notes: `Auto request: current stock ${product.stock_quantity}, reorder at ${product.reorder_level}`
      });
      setReorderMsg(`${product.name} reorder request sent to Purchase Officer`);
    } catch (err) {
      setReorderMsg(err.response?.data?.message || 'Failed to send reorder request');
    } finally {
      setReorderLoading(null);
      setTimeout(() => setReorderMsg(''), 3000);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b' }}>Farming Worker Dashboard</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            {new Date().toLocaleDateString('en-ET', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={load}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', border: 'none',
              padding: '8px 14px', borderRadius: 8, cursor: 'pointer', color: '#475569', fontSize: 13 }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Shift Status */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px', borderRadius: 10, marginBottom: '1rem',
        background: shift ? '#f0fdf4' : '#fef2f2',
        border: `1px solid ${shift ? '#bbf7d0' : '#fecaca'}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
          {shift ? (
            <><span style={{ fontWeight: 600, color: '#059669' }}>Shift Open</span>
              <span style={{ color: '#64748b' }}>Float: {parseFloat(shift.opening_float).toFixed(2)} ETB</span>
              <span style={{ color: '#64748b' }}>{shift.shift_type?.charAt(0).toUpperCase() + shift.shift_type?.slice(1)} Shift</span></>
          ) : (
            <><span style={{ fontWeight: 600, color: '#dc2626' }}>No Open Shift</span>
              <span style={{ color: '#64748b' }}>Open a shift in POS to start selling</span></>
          )}
        </div>
        <button onClick={() => navigate('/farming/pos')}
          style={{
            background: shift ? '#ef4444' : '#10b981', color: 'white',
            border: 'none', padding: '8px 18px', borderRadius: 6, cursor: 'pointer',
            fontWeight: 600, fontSize: 12
          }}>
          {shift ? 'Close Shift (POS)' : 'Open Shift (POS)'}
        </button>
      </div>

      {reorderMsg && (
        <div style={{
          padding: '10px 16px', borderRadius: 8, marginBottom: '1rem', fontSize: 13,
          background: reorderMsg.includes('sent') ? '#f0fdf4' : '#fef2f2',
          color: reorderMsg.includes('sent') ? '#15803d' : '#dc2626',
          border: `1px solid ${reorderMsg.includes('sent') ? '#bbf7d0' : '#fecaca'}`
        }}>
          {reorderMsg}
        </div>
      )}

      {loading ? (
        <p style={{ color: '#64748b' }}>Loading stats...</p>
      ) : !stats ? (
        <p style={{ color: '#ef4444' }}>Failed to load stats.</p>
      ) : (
        <>
          {/* Quick Actions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: '1.5rem' }}>
            <QuickAction icon={ShoppingCart} label="+ New Sale (POS)" color="#10b981" bg="#ecfdf5" onClick={() => navigate('/farming/pos')} />
            <QuickAction icon={Package} label="Receive Stock" color="#3b82f6" bg="#eff6ff" onClick={() => navigate('/farming/products')} />
            <QuickAction icon={ClipboardList} label="Stock Count" color="#8b5cf6" bg="#f5f3ff" onClick={() => navigate('/farming/products')} />
            <QuickAction icon={DollarSign} label="Daily Report" color="#f59e0b" bg="#fffbeb" onClick={() => navigate('/farming/finance-report')} />
            <QuickAction icon={Send} label="Close Shift" color="#ef4444" bg="#fef2f2" onClick={() => navigate('/farming/pos')} />
          </div>

          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <StatCard icon={TrendingUp} label="Today's Sales" value={`${stats.todaySales.toLocaleString()} ETB`} color="#10b981" />
            <StatCard icon={ShoppingBag} label="Pending Orders" value={stats.pendingOrders} color="#3b82f6" sub="Awaiting action" />
            <StatCard icon={Package} label="Total Products" value={stats.totalProducts} color="#8b5cf6" sub="Active listings" />
            <StatCard icon={AlertTriangle} label="Low Stock Items" value={stats.lowStockProducts.length} color="#f59e0b" sub="Need reorder" />
          </div>

          {/* Low Stock Alerts with Request Reorder */}
          {stats.lowStockProducts.length > 0 && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '1.25rem' }}>
              <h3 style={{ margin: '0 0 1rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={18} /> Low Stock Alert
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {stats.lowStockProducts.map(p => (
                  <div key={p.id} style={{ background: 'white', borderRadius: 8, padding: '12px 14px', border: '1px solid #fde68a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{p.name}</div>
                      <div style={{ color: '#ef4444', fontSize: 12, marginTop: 2 }}>
                        Stock: {p.stock_quantity} / Min: {p.reorder_level}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRequestReorder(p)}
                      disabled={reorderLoading === p.id}
                      style={{
                        background: reorderLoading === p.id ? '#e2e8f0' : '#f59e0b',
                        color: reorderLoading === p.id ? '#94a3b8' : 'white',
                        border: 'none', padding: '6px 14px', borderRadius: 6,
                        cursor: reorderLoading === p.id ? 'not-allowed' : 'pointer',
                        fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap'
                      }}
                    >
                      {reorderLoading === p.id ? 'Sending...' : 'Request Reorder'}
                    </button>
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
