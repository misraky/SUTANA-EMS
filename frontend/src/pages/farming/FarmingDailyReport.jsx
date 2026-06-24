import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../services/apiClient';
import { RefreshCw, FileText, Users, Clock, TrendingUp } from 'lucide-react';

const fmt = (n) => parseFloat(n || 0).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtTime = (d) => d ? new Date(d).toLocaleString('en-ET', { hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDuration = (start, end) => {
  if (!start) return '—';
  const e = end ? new Date(end) : new Date();
  const diff = Math.floor((e - new Date(start)) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return `${h}h ${m}m`;
};

export default function FarmingDailyReport() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const today = new Date().toISOString().split('T')[0];

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/farming/audit/manager-data', { params: { startDate: today, endDate: today } });
      const d = res.data || res;
      setShifts(d.shifts || []);
    } catch (err) {
      setError(err.message || 'Failed to load daily report');
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => { load(); }, [load]);

  const totalSales = shifts.reduce((sum, s) => sum + parseFloat(s.total_sales || 0), 0);
  const activeCount = shifts.filter(s => s.status === 'OPEN').length;
  const closedCount = shifts.filter(s => s.status === 'CLOSED').length;

  const th = { padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc', whiteSpace: 'nowrap' };
  const td = { padding: '10px 12px', color: '#334155', borderBottom: '1px solid #f1f5f9', fontSize: 13 };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={20} color="#166534" /> Daily Report — {today}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            {activeCount} active · {closedCount} closed · {fmt(totalSales)} ETB total sales
          </p>
        </div>
        <button onClick={load} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#166534', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: loading ? 0.6 : 1 }}>
          <RefreshCw size={14} /> {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading daily report...</div>}
      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, color: '#dc2626', fontSize: 13, marginBottom: 16 }}>{error}</div>}

      {!loading && !error && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 20 }}>
            <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '14px 16px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: 11, color: '#166534', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>Total Workers</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#166534' }}>{shifts.length}</div>
            </div>
            <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '14px 16px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: 11, color: '#166534', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>Active</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#059669' }}>{activeCount}</div>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>Closed</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#64748b' }}>{closedCount}</div>
            </div>
            <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '14px 16px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: 11, color: '#166534', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>Total Sales</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#166534' }}>{fmt(totalSales)} ETB</div>
            </div>
          </div>

          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={16} color="#166534" /> Worker Management
          </h3>

          <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={th}>#</th>
                  <th style={th}>Worker</th>
                  <th style={th}>Shift</th>
                  <th style={th}>Clock In</th>
                  <th style={th}>Clock Out</th>
                  <th style={th}>Duration</th>
                  <th style={th}>Status</th>
                  <th style={th}>Sales Today</th>
                </tr>
              </thead>
              <tbody>
                {shifts.length === 0 ? (
                  <tr><td colSpan={8} style={{ ...td, textAlign: 'center', color: '#94a3b8', padding: 30 }}>No worker shifts found for today.</td></tr>
                ) : (
                  shifts.map((s, i) => {
                    const isActive = s.status === 'OPEN';
                    return (
                      <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9', background: isActive ? '#f0fdf4' : '#fff' }}>
                        <td style={td}>{i + 1}</td>
                        <td style={{ ...td, fontWeight: 600 }}>{s.worker_name || `Employee #${s.worker_id}`}</td>
                        <td style={td}>{s.shift_type ? s.shift_type.charAt(0).toUpperCase() + s.shift_type.slice(1) : '—'}</td>
                        <td style={{ ...td, fontWeight: 600, color: '#059669' }}>{fmtTime(s.clocked_in_at || s.opened_at)}</td>
                        <td style={{ ...td, fontWeight: 600, color: isActive ? '#f59e0b' : '#dc2626' }}>
                          {s.clocked_out_at || s.closed_at ? fmtTime(s.clocked_out_at || s.closed_at) : (isActive ? <span style={{ color: '#059669' }}>Still Open</span> : '—')}
                        </td>
                        <td style={{ ...td, fontWeight: 600 }}>{fmtDuration(s.clocked_in_at || s.opened_at, s.clocked_out_at || s.closed_at)}</td>
                        <td style={td}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600, fontSize: 12,
                            padding: '3px 10px', borderRadius: 20,
                            color: isActive ? '#059669' : '#64748b',
                            background: isActive ? '#f0fdf4' : '#f1f5f9'
                          }}>
                            {isActive ? 'ACTIVE' : 'CLOSED'}
                          </span>
                        </td>
                        <td style={{ ...td, fontWeight: 700, color: '#166534' }}>{fmt(s.total_sales)} ETB</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
