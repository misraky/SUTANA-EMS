import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../../services/apiClient';
import { TrendingUp, Package, AlertTriangle, RefreshCw, ShoppingCart, ClipboardList, DollarSign, Users, Clock, PieChart, XCircle, Boxes, UserCog, FileText, Coins, CalendarDays, FileDown, Download, Truck } from 'lucide-react';

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

const QuickAction = ({ icon: Icon, label, color, bg, onClick, title }) => (
  <button
    onClick={onClick}
    title={title}
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
  const location = useLocation();
  const basePath = location.pathname.startsWith('/farming-manager') ? '/farming-manager' : '/farming';
  const [stats, setStats] = useState(null);
  const [shift, setShift] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showOpenForm, setShowOpenForm] = useState(false);
  const [showCloseForm, setShowCloseForm] = useState(false);
  const [openFloat, setOpenFloat] = useState('');
  const [shiftType, setShiftType] = useState('morning');
  const [cashCounted, setCashCounted] = useState('');
  const [diffReason, setDiffReason] = useState('');
  const [expensesTrans, setExpensesTrans] = useState('');
  const [expensesLoad, setExpensesLoad] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [quickActions, setQuickActions] = useState([]);

  const ICON_MAP = {
    'fa-boxes': Boxes,
    'fa-users': UserCog,
    'fa-file-alt': FileText,
    'fa-coins': Coins,
    'fa-cart-plus': ShoppingCart,
    'fa-clock': Clock,
    'fa-calendar-alt': CalendarDays,
    'fa-file-export': FileDown,
    'fa-truck': Truck,
  };

  const load = async () => {
    try {
      setLoading(true);
      const [statsRes, shiftRes, qaRes] = await Promise.all([
        axios.get('/farming/overview/stats'),
        axios.get('/farming/shifts/current'),
        axios.get('/farming/quick-actions')
      ]);
      if (statsRes?.status === 'success') setStats(statsRes.data);
      if (shiftRes?.status === 'success') setShift(shiftRes.data);
      if (qaRes?.status === 'success') setQuickActions(qaRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleOpenShift = async () => {
    setActionLoading(true);
    setActionMsg('');
    try {
      const res = await axios.post('/farming/shifts/open', { opening_float: parseFloat(openFloat || 0), shift_type: shiftType });
      if (res.status === 'success' || res.status === 201) {
        setActionMsg('Shift opened successfully');
        setShowOpenForm(false);
        setOpenFloat('');
        await load();
      }
    } catch (err) {
      setActionMsg(err.response?.data?.message || 'Failed to open shift');
    } finally {
      setActionLoading(false);
      setTimeout(() => setActionMsg(''), 4000);
    }
  };

  const handleCloseShift = async () => {
    setActionLoading(true);
    setActionMsg('');
    try {
      const res = await axios.post('/farming/shifts/close', {
        physical_cash_counted: parseFloat(cashCounted || 0),
        difference_reason: diffReason || undefined,
        refunds_given: 0,
        expenses_transport: parseFloat(expensesTrans || 0),
        expenses_loading: parseFloat(expensesLoad || 0),
        notes: closeNotes || undefined
      });
      if (res.status === 'success') {
        setActionMsg('Shift closed successfully');
        setShowCloseForm(false);
        setCashCounted('');
        setDiffReason('');
        setExpensesTrans('');
        setExpensesLoad('');
        setCloseNotes('');
        await load();
      }
    } catch (err) {
      setActionMsg(err.response?.data?.message || 'Failed to close shift');
    } finally {
      setActionLoading(false);
      setTimeout(() => setActionMsg(''), 4000);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <button
          onClick={load}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', border: 'none',
            padding: '8px 14px', borderRadius: 8, cursor: 'pointer', color: '#475569', fontSize: 13 }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div style={{
        padding: '12px 16px', borderRadius: 10, marginBottom: '1rem',
        background: shift ? '#f0fdf4' : '#fef2f2',
        border: `1px solid ${shift ? '#bbf7d0' : '#fecaca'}`
      }}>
        {actionMsg && (
          <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, color: actionMsg.includes('success') ? '#15803d' : '#dc2626' }}>{actionMsg}</div>
        )}

        {shift && !showCloseForm && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
              <span style={{ fontWeight: 600, color: '#059669' }}>Shift Open</span>
              <span style={{ color: '#64748b' }}>Float: {parseFloat(shift.opening_float).toFixed(2)} ETB</span>
              <span style={{ color: '#64748b' }}>{shift.shift_type?.charAt(0).toUpperCase() + shift.shift_type?.slice(1)} Shift</span>
            </div>
            <button onClick={() => setShowCloseForm(true)}
              style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 18px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>Close Shift</button>
          </div>
        )}

        {shift && showCloseForm && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: 13 }}>
              <span style={{ fontWeight: 600, color: '#059669' }}>Close Shift</span>
              <span style={{ color: '#64748b' }}>Float: {parseFloat(shift.opening_float).toFixed(2)} ETB</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end' }}>
              <div>
                <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 2 }}>Cash Counted (ETB)</label>
                <input type="number" step="0.01" value={cashCounted} onChange={e => setCashCounted(e.target.value)}
                  style={{ width: 130, padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 2 }}>Transport</label>
                <input type="number" step="0.01" value={expensesTrans} onChange={e => setExpensesTrans(e.target.value)}
                  style={{ width: 100, padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 2 }}>Loading</label>
                <input type="number" step="0.01" value={expensesLoad} onChange={e => setExpensesLoad(e.target.value)}
                  style={{ width: 100, padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 2 }}>Reason (if diff)</label>
                <input type="text" value={diffReason} onChange={e => setDiffReason(e.target.value)} placeholder="Discrepancy reason"
                  style={{ width: 160, padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 2 }}>Notes</label>
                <input type="text" value={closeNotes} onChange={e => setCloseNotes(e.target.value)} placeholder="Optional notes"
                  style={{ width: 140, padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }} />
              </div>
              <button onClick={handleCloseShift} disabled={actionLoading}
                style={{ background: actionLoading ? '#9ca3af' : '#ef4444', color: 'white', border: 'none', padding: '7px 18px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
                {actionLoading ? 'Closing...' : 'Confirm Close'}
              </button>
              <button onClick={() => setShowCloseForm(false)}
                style={{ background: 'transparent', border: '1px solid #d1d5db', padding: '7px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                <XCircle size={14} />
              </button>
            </div>
          </div>
        )}

        {!shift && !showOpenForm && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
              <span style={{ fontWeight: 600, color: '#dc2626' }}>No Open Shift</span>
              <span style={{ color: '#64748b' }}>Open a shift to start recording sales</span>
            </div>
            <button onClick={() => setShowOpenForm(true)}
              style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 18px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>Open Shift</button>
          </div>
        )}

        {!shift && showOpenForm && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>Open a New Shift</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end' }}>
              <div>
                <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 2 }}>Opening Float (ETB)</label>
                <input type="number" step="0.01" value={openFloat} onChange={e => setOpenFloat(e.target.value)}
                  style={{ width: 130, padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 2 }}>Shift Type</label>
                <select value={shiftType} onChange={e => setShiftType(e.target.value)}
                  style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, background: 'white' }}>
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                </select>
              </div>
              <button onClick={handleOpenShift} disabled={actionLoading}
                style={{ background: actionLoading ? '#9ca3af' : '#10b981', color: 'white', border: 'none', padding: '7px 18px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
                {actionLoading ? 'Opening...' : 'Confirm Open'}
              </button>
              <button onClick={() => setShowOpenForm(false)}
                style={{ background: 'transparent', border: '1px solid #d1d5db', padding: '7px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                <XCircle size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <p style={{ color: '#64748b' }}>Loading stats...</p>
      ) : !stats ? (
        <p style={{ color: '#ef4444' }}>Failed to load stats.</p>
      ) : (
        <>
          {quickActions.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: '1.5rem' }}>
              {quickActions.map((qa) => {
                const IconComp = ICON_MAP[qa.icon_class] || Package;
                const colors = [
                  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
                  '#ef4444', '#06b6d4', '#6366f1', '#ec4899'
                ];
                const color = colors[qa.sort_order % colors.length];
                return (
                  <QuickAction key={qa.id} icon={IconComp} label={qa.action_name} color={color}
                    bg={color + '15'} title={qa.action_description}
                    onClick={() => {
                      if (qa.route_path === '/farming/export-reports') {
                        const base = axios.defaults.baseURL;
                        const w = window.open('', '_blank');
                        w.document.write('<html><body style="font-family:sans-serif;padding:40px;text-align:center">' +
                          '<h2>Export Reports</h2>' +
                          '<p style="margin:20px 0;color:#555">Quick Links Report — all sections</p>' +
                          '<div style="display:flex;justify-content:center;gap:16px;flex-wrap:wrap">' +
                          '<a href="' + base + '/farming/export-report?format=excel" style="background:#166534;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-flex;align-items:center;gap:6px"> Download Excel</a>' +
                          '<a href="' + base + '/farming/export-report?format=pdf" style="background:#b45309;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-flex;align-items:center;gap:6px"> Download PDF</a>' +
                          '</div>' +
                          '<p style="margin-top:40px;font-size:12px;color:#999">Click a format to download. Close this window when done.</p>' +
                          '</body></html>');
                        w.document.close();
                      } else {
                        navigate(qa.route_path.replace('/farming', basePath));
                      }
                    }} />
                );
              })}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <StatCard icon={DollarSign} label="Today's Revenue" value={`${stats.todayRevenue.toLocaleString()} ETB`} color="#10b981" />
            <StatCard icon={TrendingUp} label="Monthly Revenue" value={`${stats.monthlyRevenue.toLocaleString()} ETB`} color="#3b82f6" />
            <StatCard icon={Users} label="Active Workers" value={stats.activeWorkers} color="#8b5cf6" sub="Clocked in" />
            <StatCard icon={AlertTriangle} label="Low Stock Items" value={stats.lowStockCount} color="#f59e0b" sub="Need reorder" />
            <StatCard icon={ClipboardList} label="Pending Reorders" value={stats.pendingReorders} color="#f97316" sub="Awaiting approval" />
            <StatCard icon={Clock} label="Open Shifts" value={stats.openShifts} color="#06b6d4" sub="Currently active" />
            <StatCard icon={ShoppingCart} label="Today's Orders" value={stats.todayOrders} color="#6366f1" sub="All statuses" />
            <StatCard icon={PieChart} label="Budget Used" value={`${stats.budgetPercent}%`} color="#e11d48" sub={stats.monthlyBudget > 0 ? `${stats.monthlyExpenses.toLocaleString()} / ${stats.monthlyBudget.toLocaleString()} ETB` : 'No budget set'} />
          </div>

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
                      onClick={() => navigate(basePath + '/store-request')}
                      style={{
                        background: '#166534',
                        color: 'white',
                        border: 'none', padding: '6px 14px', borderRadius: 6,
                        cursor: 'pointer',
                        fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap'
                      }}
                    >
                      Request from Store
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
