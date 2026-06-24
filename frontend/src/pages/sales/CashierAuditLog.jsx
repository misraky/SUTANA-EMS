import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from '../../services/apiClient';
import { useAuth } from '../../hooks/useAuth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const fmt = (n) => parseFloat(n || 0).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleString('en-ET', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const fmtDuration = (open, close, now) => {
  if (!open) return '—';
  const end = close ? new Date(close) : new Date(now || Date.now());
  const diff = Math.floor((end - new Date(open)) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return `${h}h ${m}m`;
};

const PAYMENT_COLORS = { Cash: '#10b981', Telebirr: '#3b82f6', 'Bank Transfer': '#8b5cf6', Credit: '#f59e0b', Check: '#6b7280' };

export default function CashierAuditLog({ source, currentShiftOnly }) {
  const { hasPermission } = useAuth();
  const canVerify = hasPermission('pos:verify');

  const [sales, setSales] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [expandedSale, setExpandedSale] = useState(null);
  const [saleItems, setSaleItems] = useState({});
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(null);
  const [dateFrom, setDateFrom] = useState(() => new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [currentShift, setCurrentShift] = useState(null);
  const [search, setSearch] = useState('');
  const [summary, setSummary] = useState(null);
  const [now, setNow] = useState(Date.now());

  /* Live elapsed timer — tick every second for open shifts */
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  /* Load current shift + its data when in currentShiftOnly mode */
  const loadCurrentShift = useCallback(async () => {
    if (!currentShiftOnly) return;
    try {
      const endpoint = source === 'farming' ? '/farming/shifts/current' : '/pos/shifts/current';
      const res = await axios.get(endpoint);
      const s = res.data?.data || res.data;
      if (s && s.id) {
        setCurrentShift(s);
        /* Format in LOCAL time so the DB comparison is correct (DB stores sale_date in local time) */
        const fmtLocal = (d) => {
          const y = d.getFullYear();
          const mo = String(d.getMonth() + 1).padStart(2, '0');
          const da = String(d.getDate()).padStart(2, '0');
          const h = String(d.getHours()).padStart(2, '0');
          const mi = String(d.getMinutes()).padStart(2, '0');
          const se = String(d.getSeconds()).padStart(2, '0');
          return `${y}-${mo}-${da} ${h}:${mi}:${se}`;
        };
        const fmtLocalDate = (d) => {
          const y = d.getFullYear();
          const mo = String(d.getMonth() + 1).padStart(2, '0');
          const da = String(d.getDate()).padStart(2, '0');
          return `${y}-${mo}-${da}`;
        };
        const fromTs = fmtLocal(new Date(s.opened_at));
        const toTs = fmtLocal(new Date());
        setDateFrom(fmtLocalDate(new Date(s.opened_at)));
        setDateTo(fmtLocalDate(new Date()));
        /* Only sales *after* this shift opened */
        const salesRes = await axios.get('/pos/sales', { params: { startDate: fromTs, endDate: toTs, source: source || undefined, limit: 500 } });
        const list = salesRes.data?.sales || salesRes.data?.data?.sales || [];
        setSales(list);
        const totals = { cash: 0, telebirr: 0, bank: 0, credit: 0, check: 0, total: 0, count: list.length, walkIn: 0, online: 0 };
        list.forEach(sale => {
          const a = parseFloat(sale.total_amount || 0);
          totals.total += a;
          const m = sale.payment_method_name || '';
          if (m === 'Cash') totals.cash += a;
          else if (m === 'Telebirr') totals.telebirr += a;
          else if (m === 'Bank Transfer') totals.bank += a;
          else if (m === 'Credit') totals.credit += a;
          else if (m === 'Check') totals.check += a;
          if (sale.sale_type === 'online') totals.online += a;
          else totals.walkIn += a;
        });
        setSummary(totals);
        setShifts([{ ...s, _source: source || 'pos', cashier_name: s.worker_name || s.cashier_name || `Employee #${s.worker_id || s.cashier_id}` }]);
      } else {
        setCurrentShift(null);
        setSales([]);
        setShifts([]);
        setSummary(null);
      }
    } catch (_) { setCurrentShift(null); setSales([]); setShifts([]); setSummary(null); }
  }, [currentShiftOnly, source]);

  const loadSales = useCallback(async () => {
    try {
      let startDate = dateFrom;
      let endDate = dateTo;
      if (currentShiftOnly && currentShift) {
        startDate = new Date(currentShift.opened_at).toISOString().split('T')[0];
        endDate = new Date().toISOString().split('T')[0];
      }
      const params = { startDate, endDate: (endDate || startDate) + 'T23:59:59', search, limit: 500 };
      if (source) params.source = source;
      const res = await axios.get('/pos/sales', { params });
      const list = res.data?.sales || res.data?.data?.sales || [];
      setSales(list);
      const totals = { cash: 0, telebirr: 0, bank: 0, credit: 0, check: 0, total: 0, count: list.length, walkIn: 0, online: 0 };
      list.forEach(s => {
        const a = parseFloat(s.total_amount || 0);
        totals.total += a;
        const m = s.payment_method_name || '';
        if (m === 'Cash') totals.cash += a;
        else if (m === 'Telebirr') totals.telebirr += a;
        else if (m === 'Bank Transfer') totals.bank += a;
        else if (m === 'Credit') totals.credit += a;
        else if (m === 'Check') totals.check += a;
        if (s.sale_type === 'online') totals.online += a;
        else totals.walkIn += a;
      });
      setSummary(totals);
    } catch (e) { console.error(e); }
  }, [dateFrom, dateTo, search, source, currentShiftOnly, currentShift]);

  const loadShifts = useCallback(async () => {
    try {
      /* When in currentShiftOnly mode, just show the current shift (if loaded), otherwise clear */
      if (currentShiftOnly) {
        if (currentShift) {
          setShifts([{ ...currentShift, _source: source || 'pos', cashier_name: currentShift.worker_name || currentShift.cashier_name || `Employee #${currentShift.worker_id || currentShift.cashier_id}` }]);
        } else {
          setShifts([]);
        }
        return;
      }
      const params = { limit: 200 };
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo + 'T23:59:59';
      const posEndpoint = canVerify ? '/pos/shifts/all-history' : '/pos/shifts/history';
      const posRes = await axios.get(posEndpoint, { params });
      let all = (posRes.data || []).map(sh => ({ ...sh, _source: 'pos' }));
      if (source === 'farming') {
        try {
          const farmRes = await axios.get('/farming/shifts/history', { params: { limit: 500 } });
          const farmShifts = (farmRes.data || []).map(sh => ({
            ...sh,
            cashier_id: sh.worker_id,
            cashier_name: sh.worker_name || `Employee #${sh.worker_id}`,
            _source: 'farming',
          }));
          all = [...all, ...farmShifts];
        } catch (_) {}
      }
      setShifts(all);
    } catch (e) { console.error(e); }
  }, [source, canVerify, dateFrom, dateTo, currentShiftOnly, currentShift]);

  /* Initial data load — always run on mount */
  useEffect(() => {
    setLoading(true);
    if (currentShiftOnly) {
      loadCurrentShift().finally(() => setLoading(false));
    } else {
      Promise.all([loadSales(), loadShifts()]).finally(() => setLoading(false));
    }
  }, []); // eslint-disable-line
  /* Refresh when dependencies change (but not on first mount) */
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (!currentShiftOnly) Promise.all([loadSales(), loadShifts()]);
  }, [loadSales, loadShifts]);
  const loadSalesRef = useRef(loadSales);
  const loadShiftsRef = useRef(loadShifts);
  const loadCurrentShiftRef = useRef(loadCurrentShift);
  loadSalesRef.current = loadSales;
  loadShiftsRef.current = loadShifts;
  loadCurrentShiftRef.current = loadCurrentShift;
  /* Polling — every 5s in currentShiftOnly mode, otherwise 15s */
  useEffect(() => {
    const interval = currentShiftOnly ? 5000 : 15000;
    const id = setInterval(() => {
      if (currentShiftOnly) {
        loadCurrentShiftRef.current();
      } else {
        loadSalesRef.current();
        loadShiftsRef.current();
      }
    }, interval);
    return () => clearInterval(id);
  }, [currentShiftOnly]);
  /* Visibility change — refresh immediately when user returns to tab */
  useEffect(() => {
    const onShow = () => {
      if (currentShiftOnly) {
        loadCurrentShiftRef.current();
      } else {
        loadSalesRef.current();
        loadShiftsRef.current();
      }
    };
    document.addEventListener('visibilitychange', onShow);
    return () => document.removeEventListener('visibilitychange', onShow);
  }, [currentShiftOnly]);

  const loadSaleItems = async (saleId) => {
    if (saleItems[saleId]) return;
    try {
      const res = await axios.get(`/pos/sales/${saleId}`);
      const data = res.data?.data || res.data;
      setSaleItems(prev => ({ ...prev, [saleId]: data?.items || data?.sale?.items || [] }));
    } catch (e) { setSaleItems(prev => ({ ...prev, [saleId]: [] })); }
  };

  const toggleExpand = (id) => {
    const next = expandedSale === id ? null : id;
    setExpandedSale(next);
    if (next) loadSaleItems(next);
  };

  const printPDF = () => {
    const win = window.open('', '_blank');
    const now = new Date().toLocaleString();
    const dateRange = `${dateFrom} to ${dateTo}`;

    const salesRows = sales.map(s => `
      <tr>
        <td>${s.invoice_number}</td>
        <td>${fmtDate(s.sale_date)}</td>
        <td>${s.cashier_name || '—'}</td>
        <td>${s.customer_name || 'Walk-in'}${s.customer_phone ? ' ' + s.customer_phone : ''}</td>
        <td><span class="badge" style="background:${s.sale_type === 'online' ? '#8b5cf6' : '#10b981'}20;color:${s.sale_type === 'online' ? '#8b5cf6' : '#10b981'}">${s.sale_type === 'online' ? 'Online' : 'Walk-in'}</span></td>
        <td><span class="badge" style="background:${PAYMENT_COLORS[s.payment_method_name] || '#9ca3af'}20;color:${PAYMENT_COLORS[s.payment_method_name] || '#6b7280'}">${s.payment_method_name || '—'}</span></td>
        <td class="num">${fmt(s.total_amount)} ETB</td>
        <td><span class="status ${s.status === 'Completed' ? 'ok' : 'pend'}">${s.status || 'Completed'}</span></td>
      </tr>`).join('');

    const shiftRows = shifts.map(sh => `
      <tr>
        <td>${sh.cashier_name || `Employee #${sh.cashier_id}`}</td>
        <td style="text-transform:capitalize">${sh.shift_type || 'Morning'}</td>
        <td>${fmtDate(sh.opened_at)}</td>
        <td>${sh.closed_at ? fmtDate(sh.closed_at) : '<span class="open">Still Open</span>'}</td>
        <td>${fmtDuration(sh.opened_at, sh.closed_at)}</td>
        <td class="num">${fmt(sh.opening_float)} ETB</td>
        <td class="num">${fmt(parseFloat(sh.opening_float || 0) + parseFloat(sh.total_sales || 0))} ETB</td>
        <td class="num">${sh.transaction_count || 0}</td>
        <td class="num">${fmt(sh.cash_collected)} ETB</td>
        <td class="num">${fmt(sh.telebirr_collected)} ETB</td>
        <td class="num">${fmt(sh.transfer_collected)} ETB</td>
        <td><span class="status ${sh.status === 'OPEN' ? 'open2' : sh.status === 'VERIFIED' ? 'ok' : 'pend'}">${sh.status}</span></td>
      </tr>`).join('');

    const shiftTotals = {
      sales: shifts.reduce((a, sh) => a + parseFloat(sh.total_sales || 0), 0),
      txns: shifts.reduce((a, sh) => a + parseInt(sh.transaction_count || 0), 0),
      cash: shifts.reduce((a, sh) => a + parseFloat(sh.cash_collected || 0), 0),
      telebirr: shifts.reduce((a, sh) => a + parseFloat(sh.telebirr_collected || 0), 0),
      bank: shifts.reduce((a, sh) => a + parseFloat(sh.transfer_collected || 0), 0),
    };

    win.document.write(`<!DOCTYPE html><html><head>
      <title>SUTANA ERP — Full Audit Report</title>
      <style>
        @page { margin: 15mm; }
        * { box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10px; color: #111; margin: 0; }
        .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 3px solid #0f172a; margin-bottom: 16px; }
        .header h1 { font-size: 20px; margin: 0; }
        .header .meta { font-size: 9px; color: #555; text-align: right; }
        .section-title { font-size: 13px; font-weight: bold; color: #1e293b; margin: 22px 0 8px; border-left: 5px solid #10b981; padding-left: 10px; }
        .section-divider { border: none; border-top: 3px solid #0f172a; margin: 24px 0; }
        .summary-grid { display: grid; grid-template-columns: repeat(6,1fr); gap: 8px; margin-bottom: 14px; }
        .sum-card { border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px; text-align: center; border-top: 3px solid #1e293b; }
        .sum-label { font-size: 8px; color: #6b7280; margin-bottom: 4px; }
        .sum-val { font-size: 11px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        th { background: #0f172a; color: white; padding: 5px 7px; text-align: left; font-size: 9px; white-space: nowrap; }
        td { padding: 4px 7px; border-bottom: 1px solid #f1f5f9; font-size: 9px; vertical-align: middle; }
        tr:nth-child(even) td { background: #f8fafc; }
        tfoot td { background: #1e293b !important; color: white; font-weight: bold; font-size: 9px; padding: 5px 7px; }
        .num { text-align: right; font-family: monospace; }
        .badge { padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 8px; }
        .status { padding: 2px 6px; border-radius: 4px; font-size: 8px; font-weight: 600; }
        .ok { background: #dcfce7; color: #166534; }
        .pend { background: #fef3c7; color: #92400e; }
        .open { color: #10b981; font-weight: 700; }
        .open2 { background: #dbeafe; color: #1d4ed8; }
        .footer { text-align: center; font-size: 8px; color: #9ca3af; margin-top: 28px; border-top: 1px solid #e5e7eb; padding-top: 8px; }
        @media print { button { display: none; } }
      </style>
    </head><body>
      <div class="header">
        <div>
          <h1>SUTANA ERP</h1>
          <div style="font-size:12px;color:#374151;margin-top:3px;font-weight:600">Full Audit Report — Sales & Attendance Log</div>
        </div>
        <div class="meta">
          Generated: ${now}<br>
          Period: ${dateRange}<br>
          <strong style="color:#0f172a">OFFICIAL AUDIT DOCUMENT</strong>
        </div>
      </div>

      <!-- SALES SECTION -->
      <div class="section-title">Sales Transactions (${dateRange})</div>
      <div class="summary-grid">
        <div class="sum-card"><div class="sum-label">Total Transactions</div><div class="sum-val">${sales.length}</div></div>
        <div class="sum-card"><div class="sum-label">Total Revenue</div><div class="sum-val">${summary ? fmt(summary.total) : '0.00'} ETB</div></div>
        <div class="sum-card" style="border-top:3px solid #10b981"><div class="sum-label">Cash</div><div class="sum-val">${summary ? fmt(summary.cash) : '0.00'} ETB</div></div>
        <div class="sum-card" style="border-top:3px solid #3b82f6"><div class="sum-label">Telebirr</div><div class="sum-val">${summary ? fmt(summary.telebirr) : '0.00'} ETB</div></div>
        <div class="sum-card" style="border-top:3px solid #8b5cf6"><div class="sum-label">Bank Transfer</div><div class="sum-val">${summary ? fmt(summary.bank) : '0.00'} ETB</div></div>
        <div class="sum-card" style="border-top:3px solid #f59e0b"><div class="sum-label">Credit</div><div class="sum-val">${summary ? fmt(summary.credit) : '0.00'} ETB</div></div>
        <div class="sum-card" style="border-top:3px solid #8b5cf6"><div class="sum-label">Online</div><div class="sum-val">${summary ? fmt(summary.online) : '0.00'} ETB</div></div>
        <div class="sum-card" style="border-top:3px solid #10b981"><div class="sum-label">Walk-in</div><div class="sum-val">${summary ? fmt(summary.walkIn) : '0.00'} ETB</div></div>
      </div>
      <table>
        <thead><tr>
          <th>Invoice #</th><th>Date & Time</th><th>Cashier</th><th>Customer</th>
          <th>Source</th><th>Payment</th><th class="num">Total (ETB)</th><th>Status</th>
        </tr></thead>
        <tbody>${salesRows || '<tr><td colspan="8" style="text-align:center;color:#9ca3af;padding:1rem">No transactions.</td></tr>'}</tbody>
      </table>

      <hr class="section-divider">

      <!-- ATTENDANCE SECTION -->
      <div class="section-title">Attendance & Shift Records</div>
      <div class="summary-grid">
        <div class="sum-card"><div class="sum-label">Total Shifts</div><div class="sum-val">${shifts.length}</div></div>
        <div class="sum-card"><div class="sum-label">Total Sales</div><div class="sum-val">${fmt(shiftTotals.sales)} ETB</div></div>
        <div class="sum-card"><div class="sum-label">Total Transactions</div><div class="sum-val">${shiftTotals.txns}</div></div>
        <div class="sum-card" style="border-top:3px solid #10b981"><div class="sum-label">Cash</div><div class="sum-val">${fmt(shiftTotals.cash)} ETB</div></div>
        <div class="sum-card" style="border-top:3px solid #3b82f6"><div class="sum-label">Telebirr</div><div class="sum-val">${fmt(shiftTotals.telebirr)} ETB</div></div>
        <div class="sum-card" style="border-top:3px solid #8b5cf6"><div class="sum-label">Bank</div><div class="sum-val">${fmt(shiftTotals.bank)} ETB</div></div>
      </div>
      <table>
        <thead><tr>
          <th>Employee</th><th>Shift</th><th>Clock In</th><th>Clock Out</th><th>Duration</th>
          <th class="num">Float</th><th class="num">Float+Sales</th><th class="num">Txns</th>
          <th class="num">Cash</th><th class="num">Telebirr</th><th class="num">Bank</th><th>Status</th>
        </tr></thead>
        <tbody>${shiftRows || '<tr><td colspan="12" style="text-align:center;color:#9ca3af;padding:1rem">No shift records.</td></tr>'}</tbody>
        <tfoot><tr>
          <td colspan="6">TOTALS</td>
          <td class="num">${fmt(shiftTotals.sales)} ETB</td>
          <td class="num">${shiftTotals.txns}</td>
          <td class="num">${fmt(shiftTotals.cash)} ETB</td>
          <td class="num">${fmt(shiftTotals.telebirr)} ETB</td>
          <td class="num">${fmt(shiftTotals.bank)} ETB</td>
          <td></td>
        </tr></tfoot>
      </table>

      <div class="footer">
        SUTANA ERP System — Official Audit Document — Generated ${now} — All figures in Ethiopian Birr (ETB)
      </div>
      <script>window.onload = () => window.print();</script>
    </body></html>`);
    win.document.close();
  };

  const handleVerifyShift = async (shiftId, status, shift) => {
    setVerifying(shiftId);
    const endpoint = shift._source === 'farming' ? `/farming/shifts/${shiftId}/verify` : `/pos/shifts/${shiftId}/verify`;
    try {
      await axios.post(endpoint, { status });
      setShifts(prev => prev.map(sh => sh.id === shiftId ? { ...sh, status } : sh));
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to update shift status';
      alert(msg);
    } finally {
      setVerifying(null);
    }
  };

  const downloadBlob = async (url, filename) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(API_BASE + url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) { const err = await response.json().catch(() => ({})); alert(err.message || 'Export failed'); return; }
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (e) {
      alert('Download failed: ' + e.message);
    }
  };

  const exportCSV = () => {
    const headers = ['Invoice #', 'Date', 'Cashier', 'Customer', 'Phone', 'Source', 'Payment', 'Total (ETB)', 'Status'];
    const rows = sales.map(s => [
      s.invoice_number, fmtDate(s.sale_date), s.cashier_name || '',
      s.customer_name || 'Walk-in', s.customer_phone || '',
      s.sale_type === 'online' ? 'Online' : 'Walk-in',
      s.payment_method_name || '', fmt(s.total_amount), s.status || 'Completed'
    ]);
    const shiftHeaders = ['', '', '', '', '', '', '', '']; // separator row
    const sHeaders = ['Employee', 'Shift', 'Clock In', 'Clock Out', 'Duration', 'Float', 'Float+Sales', 'Txns', 'Cash', 'Telebirr', 'Bank', 'Status'];
    const sRows = shifts.map(sh => [
      sh.cashier_name || `Employee #${sh.cashier_id}`,
      sh.shift_type || 'Morning', fmtDate(sh.opened_at),
      sh.closed_at ? fmtDate(sh.closed_at) : 'Still Open',
      fmtDuration(sh.opened_at, sh.closed_at), fmt(sh.opening_float),
      fmt(parseFloat(sh.opening_float || 0) + parseFloat(sh.total_sales || 0)), sh.transaction_count || 0,
      fmt(sh.cash_collected), fmt(sh.telebirr_collected),
      fmt(sh.transfer_collected), sh.status
    ]);
    const csv = [
      'SUTANA ERP — Audit Report',
      `Period: ${dateFrom} to ${dateTo}`,
      '',
      'SALES TRANSACTIONS',
      headers.join(','),
      ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')),
      '',
      'SHIFT RECORDS',
      sHeaders.join(','),
      ...sRows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit_report_${dateFrom}_to_${dateTo}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const s = {
    page: { padding: '1.5rem', fontFamily: "'Inter', sans-serif", background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', minHeight: '100%', color: '#0f172a' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem', background: '#fff', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' },
    title: { fontSize: '1.75rem', fontWeight: 800, margin: 0, background: 'linear-gradient(90deg, #1e293b, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' },
    subtitle: { fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0', fontWeight: 500 },
    controls: { display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.5)' },
    input: { padding: '10px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: '#fff', transition: 'all 0.2s', outline: 'none' },
    printBtn: { padding: '10px 24px', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(16,185,129,0.3)', transition: 'all 0.2s' },
    card: { background: '#fff', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,.04)', overflow: 'hidden', border: '1px solid #f1f5f9' },
    summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '1rem', marginBottom: '1.5rem' },
    sumCard: (color) => ({ background: '#fff', border: '1px solid #e2e8f0', borderTop: `4px solid ${color}`, borderRadius: '12px', padding: '1rem 1.25rem', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', transition: 'transform 0.2s' }),
    sumLabel: { fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' },
    sumVal: { fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginTop: '6px', letterSpacing: '-0.5px' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { background: '#0f172a', color: '#fff', padding: '14px 16px', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', letterSpacing: '0.5px' },
    td: { padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem', color: '#334155', verticalAlign: 'middle' },
    badge: (color) => ({ display: 'inline-block', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: color + '20', color, border: `1px solid ${color}40` }),
    expandBtn: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', padding: '4px 12px', fontSize: '0.85rem', color: '#475569', fontWeight: 600, transition: 'all 0.2s' },
    statusBadge: (st) => ({ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, background: st === 'OPEN' ? '#dbeafe' : st === 'VERIFIED' ? '#dcfce7' : st === 'CLOSED' ? '#f1f5f9' : '#fef3c7', color: st === 'OPEN' ? '#1d4ed8' : st === 'VERIFIED' ? '#166534' : st === 'CLOSED' ? '#475569' : '#92400e', textTransform: 'uppercase' }),
    hr: { border: 'none', borderTop: '3px solid #0f172a', margin: '2rem 0' },
    sectionTitle: { fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', margin: '0 0 1rem', borderLeft: '5px solid #10b981', paddingLeft: '12px' },
  };

  const filteredSales = sales.filter(s => !search || s.invoice_number?.toLowerCase().includes(search.toLowerCase()) || s.cashier_name?.toLowerCase().includes(search.toLowerCase()) || s.customer_name?.toLowerCase().includes(search.toLowerCase()) || (s.customer_phone || '').includes(search));

  return (
    <div style={s.page}>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Audit Log & History</h1>
          <p style={s.subtitle}>Sales transactions — combined walk-in & online — with attendance & shift records</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button style={{ ...s.printBtn, background: '#0D7C66' }} onClick={() => downloadBlob(`/pos/reports/audit-pdf?startDate=${dateFrom}&endDate=${dateTo}${source ? `&source=${source}` : ''}`, `audit_${dateFrom}_to_${dateTo}.pdf`)}>
            Export PDF
          </button>
          <button style={{ ...s.printBtn, background: '#3b82f6' }} onClick={() => downloadBlob(`/pos/reports/audit-excel?startDate=${dateFrom}&endDate=${dateTo}${source ? `&source=${source}` : ''}`, `audit_${dateFrom}_to_${dateTo}.xlsx`)}>
            Export Excel
          </button>
          <button style={{ ...s.printBtn, background: '#8b5cf6' }} onClick={exportCSV}>
            Export CSV
          </button>
          <button style={s.printBtn} onClick={printPDF}>
            Print Full Report
          </button>
        </div>
      </div>

      {/* Controls */}
      <div style={s.controls}>
        {currentShiftOnly && currentShift && (
          <span style={{ fontSize: '0.85rem', padding: '4px 12px', background: '#dbeafe', borderRadius: 6, color: '#1e40af', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', animation: 'pulse 1.5s infinite', display: 'inline-block' }} />
            Shift #{currentShift.id} — {fmtDuration(currentShift.opened_at, null, now)}
          </span>
        )}
        <label style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
          From: <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={s.input} disabled={currentShiftOnly} />
        </label>
        <label style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
          To: <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={s.input} disabled={currentShiftOnly} />
        </label>
        <input type="text" placeholder="Search invoice, cashier, customer, phone..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...s.input, width: 280 }} disabled={currentShiftOnly} />
        <button onClick={() => { setLoading(true); Promise.all([loadSales(), loadShifts()]).finally(() => setLoading(false)); }} style={{ ...s.printBtn, background: '#3b82f6' }} disabled={currentShiftOnly}>Search</button>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading records...</div>}

      {currentShiftOnly && !currentShift && !loading && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8', fontSize: '0.9rem' }}>
          No open shift — start a shift from the POS page to see live data here.
        </div>
      )}

      {/* ===== SALES SECTION ===== */}
      {!loading && (currentShiftOnly ? currentShift : true) && (
        <>
          {summary && (
            <div style={s.summaryGrid}>
              <div style={s.sumCard('#0f172a')}><div style={s.sumLabel}>Total Transactions</div><div style={s.sumVal}>{summary.count}</div></div>
              <div style={s.sumCard('#0f172a')}><div style={s.sumLabel}>Total Revenue</div><div style={s.sumVal}>{fmt(summary.total)} ETB</div></div>
              <div style={s.sumCard('#10b981')}><div style={s.sumLabel}>Cash</div><div style={s.sumVal}>{fmt(summary.cash)} ETB</div></div>
              <div style={s.sumCard('#3b82f6')}><div style={s.sumLabel}>Telebirr</div><div style={s.sumVal}>{fmt(summary.telebirr)} ETB</div></div>
              <div style={s.sumCard('#8b5cf6')}><div style={s.sumLabel}>Bank Transfer</div><div style={s.sumVal}>{fmt(summary.bank)} ETB</div></div>
              <div style={s.sumCard('#f59e0b')}><div style={s.sumLabel}>Credit</div><div style={s.sumVal}>{fmt(summary.credit)} ETB</div></div>
              <div style={s.sumCard('#8b5cf6')}><div style={s.sumLabel}>Online</div><div style={s.sumVal}>{fmt(summary.online)} ETB</div></div>
              <div style={s.sumCard('#10b981')}><div style={s.sumLabel}>Walk-in</div><div style={s.sumVal}>{fmt(summary.walkIn)} ETB</div></div>
            </div>
          )}
          <div style={s.card}>
            <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}></th>
                  <th style={s.th}>Invoice #</th>
                  <th style={s.th}>Date & Time</th>
                  <th style={s.th}>Cashier</th>
                  <th style={s.th}>Customer / Phone</th>
                  <th style={s.th}>Order Source</th>
                  <th style={s.th}>Payment Method</th>
                  <th style={{ ...s.th, textAlign: 'right' }}>Total (ETB)</th>
                  <th style={s.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.length === 0 && (
                  <tr><td colSpan={9} style={{ ...s.td, textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>No records found for this period.</td></tr>
                )}
                {filteredSales.map((sale, i) => (
                  <React.Fragment key={sale.id}>
                    <tr style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      <td style={s.td}>
                        <button style={s.expandBtn} onClick={() => toggleExpand(sale.id)}>
                          {expandedSale === sale.id ? 'Hide' : 'Items'}
                        </button>
                      </td>
                      <td style={{ ...s.td, fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>{sale.invoice_number}</td>
                      <td style={s.td}>{fmtDate(sale.sale_date)}</td>
                      <td style={s.td}>{sale.cashier_name || '—'}</td>
                      <td style={s.td}>{sale.customer_name || 'Walk-in'}{sale.customer_phone ? <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: 6 }}>{sale.customer_phone}</span> : null}</td>
                      <td style={s.td}><span style={s.badge(sale.sale_type === 'online' ? '#8b5cf6' : '#10b981')}>{sale.sale_type === 'online' ? 'Online' : 'Walk-in'}</span></td>
                      <td style={s.td}><span style={s.badge(PAYMENT_COLORS[sale.payment_method_name] || '#6b7280')}>{sale.payment_method_name || '—'}</span></td>
                      <td style={{ ...s.td, textAlign: 'right', fontWeight: 700, color: '#059669', fontFamily: 'monospace' }}>{fmt(sale.total_amount)}</td>
                      <td style={s.td}><span style={s.statusBadge(sale.status === 'Completed' ? 'VERIFIED' : (sale.status === 'Voided' || sale.status === 'Void' ? 'REJECTED' : 'OPEN'))}>{(sale.status !== 'Completed' && sale.status !== 'Voided' && sale.status !== 'Void') && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />}{sale.status || 'Completed'}</span></td>
                    </tr>
                    {expandedSale === sale.id && (
                      <tr>
                        <td colSpan={9} style={{ padding: 0, background: '#f0fdf4' }}>
                          <table style={{ ...s.table, margin: 0 }}>
                            <thead>
                              <tr>
                                <th style={{ ...s.th, background: '#166534', padding: '6px 14px', fontSize: '0.75rem' }}>Product</th>
                                <th style={{ ...s.th, background: '#166534', padding: '6px 14px', fontSize: '0.75rem' }}>Department</th>
                                <th style={{ ...s.th, background: '#166534', padding: '6px 14px', fontSize: '0.75rem', textAlign: 'right' }}>Qty</th>
                                <th style={{ ...s.th, background: '#166534', padding: '6px 14px', fontSize: '0.75rem', textAlign: 'right' }}>Unit Price</th>
                                <th style={{ ...s.th, background: '#166534', padding: '6px 14px', fontSize: '0.75rem', textAlign: 'right' }}>Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(saleItems[sale.id] || []).length === 0 && (
                                <tr><td colSpan={5} style={{ ...s.td, textAlign: 'center', color: '#9ca3af' }}>No item details available.</td></tr>
                              )}
                              {(saleItems[sale.id] || []).map((item, j) => (
                                <tr key={j}>
                                  <td style={{ ...s.td, paddingLeft: '2rem', fontWeight: 600 }}>{item.product_name || `Product #${item.product_id}`}</td>
                                  <td style={s.td}><span style={s.badge(PAYMENT_COLORS[item.source === 'farming' ? 'Cash' : item.source === 'pharmacy' ? 'Telebirr' : 'Check'] || '#9ca3af')}>{item.source || 'Retail'}</span></td>
                                  <td style={{ ...s.td, textAlign: 'right', fontWeight: 700 }}>{item.quantity}</td>
                                  <td style={{ ...s.td, textAlign: 'right', fontFamily: 'monospace' }}>{fmt(item.unit_price)} ETB</td>
                                  <td style={{ ...s.td, textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', color: '#059669' }}>{fmt(item.subtotal || item.total)} ETB</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          <hr style={s.hr} />

          {/* ===== ATTENDANCE SECTION ===== */}
          <h3 style={s.sectionTitle}>Attendance & Shift Records</h3>
          {shifts.length > 0 && (
            <div style={s.summaryGrid}>
              <div style={s.sumCard('#0f172a')}><div style={s.sumLabel}>Total Shifts</div><div style={s.sumVal}>{shifts.length}</div></div>
              <div style={s.sumCard('#10b981')}><div style={s.sumLabel}>Total Sales</div><div style={s.sumVal}>{fmt(shifts.reduce((a, sh) => a + parseFloat(sh.total_sales || 0), 0))} ETB</div></div>
              <div style={s.sumCard('#3b82f6')}><div style={s.sumLabel}>Total Transactions</div><div style={s.sumVal}>{shifts.reduce((a, sh) => a + parseInt(sh.transaction_count || 0), 0)}</div></div>
              <div style={s.sumCard('#8b5cf6')}><div style={s.sumLabel}>Cash</div><div style={s.sumVal}>{fmt(shifts.reduce((a, sh) => a + parseFloat(sh.cash_collected || 0), 0))} ETB</div></div>
              <div style={s.sumCard('#f59e0b')}><div style={s.sumLabel}>Telebirr</div><div style={s.sumVal}>{fmt(shifts.reduce((a, sh) => a + parseFloat(sh.telebirr_collected || 0), 0))} ETB</div></div>
              <div style={s.sumCard('#ef4444')}><div style={s.sumLabel}>Bank</div><div style={s.sumVal}>{fmt(shifts.reduce((a, sh) => a + parseFloat(sh.transfer_collected || 0), 0))} ETB</div></div>
            </div>
          )}
          <div style={s.card}>
            <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Employee</th>
                  <th style={s.th}>Shift</th>
                  <th style={s.th}>Clock In</th>
                  <th style={s.th}>Clock Out</th>
                  <th style={s.th}>Duration</th>
                  <th style={{ ...s.th, textAlign: 'right' }}>Float</th>
                  <th style={{ ...s.th, textAlign: 'right' }}>Float + Sales</th>
                  <th style={{ ...s.th, textAlign: 'right' }}>Txns</th>
                  <th style={{ ...s.th, textAlign: 'right' }}>Cash</th>
                  <th style={{ ...s.th, textAlign: 'right' }}>Telebirr</th>
                  <th style={{ ...s.th, textAlign: 'right' }}>Bank</th>
                  <th style={s.th}>Status</th>
                  {canVerify && <th style={s.th}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {shifts.length === 0 && (
                  <tr><td colSpan={canVerify ? 13 : 12} style={{ ...s.td, textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>No shift records found.</td></tr>
                )}
                {shifts.map((sh, i) => (
                  <tr key={sh._source + '-' + sh.id} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                    <td style={{ ...s.td, fontWeight: 700, color: '#0f172a' }}>{sh.cashier_name || `Employee #${sh.cashier_id}`}</td>
                    <td style={s.td}><span style={{ textTransform: 'capitalize' }}>{sh.shift_type || 'Morning'}</span></td>
                    <td style={{ ...s.td, color: '#059669', fontWeight: 600 }}>{fmtDate(sh.opened_at)}</td>
                    <td style={s.td}>{sh.closed_at ? fmtDate(sh.closed_at) : <span style={{ color: '#10b981', fontWeight: 700 }}>Still Open</span>}</td>
                    <td style={{ ...s.td, fontWeight: 600, color: '#7c3aed' }}>
                      {fmtDuration(sh.opened_at, sh.closed_at, now)}
                      {!sh.closed_at && <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#10b981', marginLeft: 6, animation: 'pulse 1.5s infinite', verticalAlign: 'middle' }} />}
                    </td>
                    <td style={{ ...s.td, textAlign: 'right', fontFamily: 'monospace' }}>{fmt(sh.opening_float)} ETB</td>
                    <td style={{ ...s.td, textAlign: 'right', fontWeight: 700, color: '#059669', fontFamily: 'monospace' }}>{fmt(parseFloat(sh.opening_float || 0) + parseFloat(sh.total_sales || 0))} ETB</td>
                    <td style={{ ...s.td, textAlign: 'right', fontWeight: 700 }}>{sh.transaction_count || 0}</td>
                    <td style={{ ...s.td, textAlign: 'right', fontFamily: 'monospace', color: '#10b981' }}>{fmt(sh.cash_collected)} ETB</td>
                    <td style={{ ...s.td, textAlign: 'right', fontFamily: 'monospace', color: '#3b82f6' }}>{fmt(sh.telebirr_collected)} ETB</td>
                    <td style={{ ...s.td, textAlign: 'right', fontFamily: 'monospace', color: '#8b5cf6' }}>{fmt(sh.transfer_collected)} ETB</td>
                    <td style={s.td}><span style={s.statusBadge(sh.status)}>{sh.status === 'OPEN' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />}{sh.status}</span></td>
                    {canVerify && (
                      <td style={s.td}>
                        {sh.status === 'CLOSED' ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              onClick={() => handleVerifyShift(sh.id, 'VERIFIED', sh)}
                              disabled={verifying === sh.id}
                              style={{ padding: '4px 10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, opacity: verifying === sh.id ? 0.6 : 1 }}
                            >Verify</button>
                            <button
                              onClick={() => handleVerifyShift(sh.id, 'REJECTED', sh)}
                              disabled={verifying === sh.id}
                              style={{ padding: '4px 10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, opacity: verifying === sh.id ? 0.6 : 1 }}
                            >Reject</button>
                          </div>
                        ) : <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>—</span>}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
