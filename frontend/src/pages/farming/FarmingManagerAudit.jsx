import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../services/apiClient';
import { RefreshCw, Printer, ExternalLink, Users, ShoppingCart, Clock, TrendingUp } from 'lucide-react';

const fmt = (n) => parseFloat(n || 0).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtTime = (d) => d ? new Date(d).toLocaleString('en-ET', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';
const fmtShortDate = (d) => d ? new Date(d).toLocaleString('en-ET', { dateStyle: 'medium' }) : '—';
const fmtDuration = (start, end) => {
  if (!start) return '—';
  const e = end ? new Date(end) : new Date();
  const diff = Math.floor((e - new Date(start)) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return `${h}h ${m}m`;
};

const SectionTitle = ({ icon: Icon, title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
    {Icon && <Icon size={18} color="#166534" />}
    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#166534' }}>{title}</h3>
    <div style={{ flex: 1, height: 1, background: '#bbf7d0', marginLeft: 8 }} />
  </div>
);

const StatCard = ({ label, value, color }) => (
  <div style={{ background: '#fff', borderRadius: 10, padding: '14px 16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 700, color: color || '#1e293b' }}>{value}</div>
  </div>
);

export default function FarmingManagerAudit() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [dateFrom, setDateFrom] = useState(() => new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/farming/audit/manager-data', { params: { startDate: dateFrom, endDate: dateTo } });
      setData(res.data?.data || res);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load audit data');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { loadData(); }, [loadData]);

  const shifts = data?.shifts || [];
  const posSales = data?.posSales || [];
  const onlineOrders = data?.onlineOrders || [];

  // Manager attendance is captured via farming_shifts (clocked_in_at on open, clocked_out_at on close)
  const managerAttendance = shifts.map(sh => ({
    id: `shift-${sh.id}`,
    name: sh.worker_name,
    phone: sh.worker_phone,
    shiftType: sh.shift_type,
    workerId: sh.worker_id,
    clockIn: sh.clocked_in_at || sh.opened_at,
    clockOut: sh.clocked_out_at || sh.closed_at,
    date: sh.opened_at,
    duration: null
  })).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  // Group workers from shifts
  const workerMap = {};
  shifts.forEach(sh => {
    const wid = sh.worker_id || 'unknown';
    if (!workerMap[wid]) {
      workerMap[wid] = { id: wid, name: sh.worker_name, phone: sh.worker_phone, shifts: [], totalSales: 0, totalCash: 0, totalTelebirr: 0, totalTransfer: 0 };
    }
    workerMap[wid].shifts.push(sh);
    workerMap[wid].totalSales += parseFloat(sh.total_sales || 0);
    workerMap[wid].totalCash += parseFloat(sh.cash_collected || 0);
    workerMap[wid].totalTelebirr += parseFloat(sh.telebirr_collected || 0);
    workerMap[wid].totalTransfer += parseFloat(sh.transfer_collected || 0);
  });
  const workers = Object.values(workerMap);

  // Sales totals
  const totalWalkin = posSales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);
  const totalOnline = onlineOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
  const totalCash = shifts.reduce((sum, sh) => sum + parseFloat(sh.cash_collected || 0), 0);
  const totalTelebirr = shifts.reduce((sum, sh) => sum + parseFloat(sh.telebirr_collected || 0), 0);
  const totalTransfer = shifts.reduce((sum, sh) => sum + parseFloat(sh.transfer_collected || 0), 0);
  const grandTotal = totalWalkin + totalOnline;

  const hasShifts = shifts.length > 0;
  const hasSales = posSales.length > 0 || onlineOrders.length > 0;
  const hasAttendance = managerAttendance.length > 0;

  const th = { padding: '9px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc', whiteSpace: 'nowrap' };
  const td = { padding: '8px 12px', color: '#334155', borderBottom: '1px solid #f1f5f9', fontSize: 12 };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1e293b' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Farming Manager Audit</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Period: {dateFrom} — {dateTo}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '4px 10px' }}>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              style={{ border: 'none', padding: '4px 0', fontSize: 13, outline: 'none', color: '#1e293b', fontFamily: 'inherit' }} />
            <span style={{ color: '#94a3b8' }}>—</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              style={{ border: 'none', padding: '4px 0', fontSize: 13, outline: 'none', color: '#1e293b', fontFamily: 'inherit' }} />
          </div>
          <button onClick={loadData} disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#166534', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: loading ? 0.6 : 1 }}>
            <RefreshCw size={14} /> {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button onClick={() => window.print()}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#fff', border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#475569', fontWeight: 500 }}>
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading audit data...</div>}
      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, color: '#dc2626', fontSize: 13, marginBottom: 16 }}>{error}</div>}

      {!loading && data && (
        <>
          {/* ── 1. WORKER SUMMARY CARDS ── */}
          <SectionTitle icon={Users} title="Worker Summary" />
          {!hasShifts ? (
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13, marginBottom: 20 }}>No worker data found for this period.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 24 }}>
              {workers.map(w => (
                <div key={w.id} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 8 }}>{w.name || 'Unknown'}</div>
                  <div style={{ fontSize: 12, color: '#475569', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
                    <span style={{ color: '#64748b' }}>Shifts:</span><span style={{ fontWeight: 600 }}>{w.shifts.length}</span>
                    <span style={{ color: '#64748b' }}>Sales:</span><span style={{ fontWeight: 600 }}>{fmt(w.totalSales)} ETB</span>
                    <span style={{ color: '#64748b' }}>Cash:</span><span style={{ fontWeight: 600 }}>{fmt(w.totalCash)} ETB</span>
                    <span style={{ color: '#64748b' }}>Telebirr:</span><span style={{ fontWeight: 600 }}>{fmt(w.totalTelebirr)} ETB</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── 2. SALES ── */}
          <SectionTitle icon={ShoppingCart} title="Sales Summary" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 24 }}>
            <StatCard label="Walk-in Sales" value={`${fmt(totalWalkin)} ETB`} />
            <StatCard label="Online Sales" value={`${fmt(totalOnline)} ETB`} />
            <StatCard label="Cash" value={`${fmt(totalCash)} ETB`} />
            <StatCard label="Telebirr" value={`${fmt(totalTelebirr)} ETB`} />
            <StatCard label="Bank Transfer" value={`${fmt(totalTransfer)} ETB`} />
            <StatCard label="Grand Total" value={`${fmt(grandTotal)} ETB`} color="#166534" />
            {!hasSales && !hasShifts && <div style={{ fontSize: 12, color: '#94a3b8', gridColumn: '1 / -1', textAlign: 'center', padding: 12 }}>No sales data for this period.</div>}
          </div>

          {/* ── 3. WORKER DETAILS TABLE ── */}
          <SectionTitle icon={TrendingUp} title="Worker Details" />
          {!hasShifts ? (
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13, marginBottom: 24 }}>No worker details for this period.</div>
          ) : (
            <div style={{ overflowX: 'auto', marginBottom: 24, borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={th}>Worker</th>
                    <th style={th}>Phone</th>
                    <th style={th}>Shifts</th>
                    <th style={th}>Cash</th>
                    <th style={th}>Telebirr</th>
                    <th style={th}>Transfer</th>
                    <th style={th}>Total Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map(w => (
                    <tr key={w.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={td}><strong>{w.name || '—'}</strong></td>
                      <td style={td}>{w.phone || '—'}</td>
                      <td style={td}>{w.shifts.length}</td>
                      <td style={td}>{fmt(w.totalCash)}</td>
                      <td style={td}>{fmt(w.totalTelebirr)}</td>
                      <td style={td}>{fmt(w.totalTransfer)}</td>
                      <td style={{ ...td, fontWeight: 700 }}>{fmt(w.totalSales)} ETB</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── 4. ATTENDANCE ── */}
          <SectionTitle icon={Clock} title="Attendance" />
          {!hasAttendance ? (
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13, marginBottom: 24 }}>
              Clock in when you open a shift — clock out when you close it. Attendance records will appear here.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={th}>Manager Name</th>
                    <th style={th}>Phone</th>
                    <th style={th}>Shift</th>
                    <th style={th}>Track</th>
                    <th style={th}>Clock In</th>
                    <th style={th}>Clock Out</th>
                    <th style={th}>Duration</th>
                    <th style={th}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {managerAttendance.map(a => (
                    <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={td}><strong>{a.name || '—'}</strong></td>
                      <td style={td}>{a.phone || '—'}</td>
                      <td style={td}>{a.shiftType || '—'}</td>
                      <td style={td}>
                        {a.workerId ? (
                          <a href={`/farming-worker/dashboard?id=${a.workerId}`} target="_blank" rel="noopener noreferrer"
                            style={{ color: '#166534', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                            Dashboard <ExternalLink size={12} />
                          </a>
                        ) : '—'}
                      </td>
                      <td style={{ ...td, fontWeight: 600, color: '#059669' }}>
                        {a.clockIn ? fmtTime(a.clockIn) : '—'}
                      </td>
                      <td style={{ ...td, fontWeight: 600, color: '#dc2626' }}>
                        {a.clockOut ? fmtTime(a.clockOut) : (a.clockIn ? <span style={{ color: '#f59e0b' }}>In progress</span> : '—')}
                      </td>
                      <td style={{ ...td, fontWeight: 600 }}>
                        {a.duration != null ? `${Math.floor(a.duration / 60)}h ${a.duration % 60}m` : fmtDuration(a.clockIn, a.clockOut)}
                      </td>
                      <td style={td}>{a.date ? fmtShortDate(a.date) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Print optimised */}
          <style>{`
            @media print {
              body { font-family: 'Courier New', monospace; font-size: 9px; color: #000; background: #fff; }
              button, input, select { display: none !important; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; }
              a { color: #000 !important; text-decoration: underline !important; }
              .section-title { color: #000 !important; }
              * { box-shadow: none !important; border-color: #000 !important; }
            }
            @page { margin: 15mm; }
          `}</style>
        </>
      )}
    </div>
  );
}
