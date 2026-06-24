import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../services/apiClient';
import { RefreshCw, Package, AlertTriangle, CheckCircle, FileText, DollarSign, ClipboardList, TrendingUp, CalendarDays, Download } from 'lucide-react';

const fmt = (n) => parseFloat(n || 0).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const cropCalendarData = [
  { crop: 'Teff', planting: 'Jul–Aug', harvest: 'Nov–Dec', status: 'Planting', bestSeed: 'DZ-Cr-387 (Kora)' },
  { crop: 'Wheat', planting: 'Jun–Jul', harvest: 'Oct–Nov', status: 'Growing', bestSeed: 'Hidase (ETBW 7011)' },
  { crop: 'Maize', planting: 'Apr–May', harvest: 'Sep–Oct', status: 'Growing', bestSeed: 'BH-547' },
  { crop: 'Barley', planting: 'Jun–Jul', harvest: 'Oct–Nov', status: 'Growing', bestSeed: 'HB 1307' },
];

const cropStatusColors = { Planting: { bg: '#fef2f2', text: '#dc2626' }, Growing: { bg: '#fffbeb', text: '#d97706' }, Harvesting: { bg: '#f0fdf4', text: '#16a34a' } };

export default function FarmingQuickLinks() {
  const [products, setProducts] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [budgetData, setBudgetData] = useState([]);
  const [reorderRequests, setReorderRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const today = new Date().toISOString().split('T')[0];

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodRes, topProdRes, budgetRes, reorderRes] = await Promise.all([
        axios.get('/farming/admin/products?include_inactive=false'),
        axios.get('/farming/top-products'),
        axios.get('/farming/budget-summary'),
        axios.get('/farming/reorder-requests', { params: { status: 'PENDING' } })
      ]);
      setProducts((prodRes.data || prodRes)?.filter(p => p.is_active !== false) || []);
      setTopProducts((topProdRes.data || topProdRes) || []);
      setBudgetData((budgetRes.data || budgetRes) || []);
      setReorderRequests((reorderRes.data || reorderRes) || []);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => { load(); }, [load]);

  const lowStockCount = products.filter(p => (p.stock_quantity || 0) < (p.reorder_level || 0)).length;

  const exportAllData = () => {
    const rows = [];
    rows.push(['QUICK LINKS REPORT', '', '', '', '', '', '', '']);
    rows.push(['Generated:', new Date().toLocaleString(), '', '', '', '', '', '']);
    rows.push(['']);
    rows.push(['STOCK OVERVIEW']);
    rows.push(['#','Product','Current Stock','Reorder Level','Status','Action','','']);
    products.forEach((p,i) => { const q=p.stock_quantity||0; const r=p.reorder_level||0; rows.push([i+1,p.name,q,r,q<r?'LOW':'OK',q<r?'Request Reorder':'—','','']); });
    rows.push(['']);
    rows.push(['EXPENSE & BUDGET SUMMARY']);
    rows.push(['#','Category','Budget','Used','Remaining','Status','','']);
    budgetData.forEach(b => rows.push([b.id,b.category,b.budget,b.used,b.remaining,b.status,'','']));
    rows.push(['']);
    rows.push(['PENDING REORDER REQUESTS']);
    rows.push(['#','Product','Requested By','Current Stock','Suggested Qty','Priority','Date','Status']);
    reorderRequests.forEach((r,i) => rows.push([i+1,r.product_name||'—',r.requester_name||'—',r.current_stock||'—',r.quantity_requested||0,r.priority||'MEDIUM',r.created_at?r.created_at.split('T')[0]:'—','Pending CEO']));
    rows.push(['']);
    rows.push(['TOP SELLING PRODUCTS TODAY']);
    rows.push(['#','Product','Qty Sold','Revenue','','','','']);
    topProducts.forEach((p,i) => rows.push([i+1,p.name,p.total_qty||0,p.total_revenue||0,'','','','']));
    rows.push(['']);
    rows.push(['CROP CALENDAR']);
    rows.push(['#','Crop','Planting','Harvest','Status','Best Seed','','']);
    cropCalendarData.forEach((c,i) => rows.push([i+1,c.crop,c.planting,c.harvest,c.status,c.bestSeed,'','']));

    const csv = rows.map(r => r.map(c => typeof c === 'string' && (c.includes(',')||c.includes('"')||c.includes('\n')) ? '"'+c.replace(/"/g,'""')+'"' : c).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `QuickLinks_Report_${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const th = { padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc', whiteSpace: 'nowrap' };
  const td = { padding: '10px 12px', color: '#334155', borderBottom: '1px solid #f1f5f9', fontSize: 13 };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={20} color="#166534" /> Quick Links
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            {lowStockCount} low-stock items · {topProducts.length} top products today · {reorderRequests.length} pending reorders
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={exportAllData}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#b45309', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            <Download size={14} /> Export to CEO
          </button>
          <button onClick={load} disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#166534', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: loading ? 0.6 : 1 }}>
            <RefreshCw size={14} /> {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading...</div>}
      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, color: '#dc2626', fontSize: 13, marginBottom: 16 }}>{error}</div>}

      {!loading && !error && (
        <>
          {/* ─── STOCK OVERVIEW ─── */}
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Package size={16} color="#166534" /> Stock Overview
          </h3>
          <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', marginBottom: 28 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={th}>#</th>
                  <th style={th}>Product</th>
                  <th style={th}>Current Stock</th>
                  <th style={th}>Reorder Level</th>
                  <th style={th}>Status</th>
                  <th style={th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: '#94a3b8', padding: 30 }}>No products found.</td></tr>
                ) : (
                  products.map((p, i) => {
                    const qty = p.stock_quantity || 0;
                    const reorder = p.reorder_level || 0;
                    const isLow = qty < reorder;
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', background: isLow ? '#fffbeb' : '#fff' }}>
                        <td style={td}>{i + 1}</td>
                        <td style={{ ...td, fontWeight: 600 }}>{p.name}</td>
                        <td style={{ ...td, fontWeight: 600, color: isLow ? '#dc2626' : '#059669' }}>{qty}</td>
                        <td style={td}>{reorder}</td>
                        <td style={td}>
                          {isLow ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#dc2626', fontWeight: 600, fontSize: 12, background: '#fef2f2', padding: '3px 10px', borderRadius: 20 }}>
                              <AlertTriangle size={12} /> LOW
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#059669', fontWeight: 600, fontSize: 12, background: '#f0fdf4', padding: '3px 10px', borderRadius: 20 }}>
                              <CheckCircle size={12} /> OK
                            </span>
                          )}
                        </td>
                        <td style={td}>
                          {isLow ? (
                            <span style={{ color: '#d97706', fontWeight: 600, fontSize: 12, cursor: 'default' }}>Request Reorder</span>
                          ) : <span style={{ color: '#94a3b8' }}>—</span>}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ─── EXPENSE & BUDGET SUMMARY ─── */}
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
            <DollarSign size={16} color="#166534" /> Expense & Budget Summary
          </h3>
          <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', marginBottom: 28 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={th}>#</th>
                  <th style={th}>Category</th>
                  <th style={th}>Budget</th>
                  <th style={th}>Used</th>
                  <th style={th}>Remaining</th>
                  <th style={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {budgetData.length === 0 ? (
                  <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: '#94a3b8', padding: 30 }}>No budget data available.</td></tr>
                ) : (
                  budgetData.map((b) => {
                    const isOver = b.status === 'OVER';
                    const isTotal = b.category === 'Total';
                    return (
                      <tr key={b.id} style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: isTotal ? '#f8fafc' : isOver ? '#fffbeb' : '#fff',
                        fontWeight: isTotal ? 700 : 400
                      }}>
                        <td style={td}>{b.id}</td>
                        <td style={{ ...td, fontWeight: isTotal ? 700 : 600 }}>{b.category}</td>
                        <td style={td}>{fmt(b.budget)} ETB</td>
                        <td style={{ ...td, fontWeight: 600, color: isOver ? '#dc2626' : '#1e293b' }}>{fmt(b.used)} ETB</td>
                        <td style={{ ...td, fontWeight: 600, color: b.remaining < 0 ? '#dc2626' : '#059669' }}>{fmt(b.remaining)} ETB</td>
                        <td style={td}>
                          {isOver ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#dc2626', fontWeight: 600, fontSize: 12, background: '#fef2f2', padding: '3px 10px', borderRadius: 20 }}>
                              <AlertTriangle size={12} /> OVER
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#059669', fontWeight: 600, fontSize: 12, background: '#f0fdf4', padding: '3px 10px', borderRadius: 20 }}>
                              <CheckCircle size={12} /> OK
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ─── PENDING REORDER REQUESTS ─── */}
          <div style={{ border: 'none', borderTop: '2px solid #e2e8f0', margin: '0 0 28px' }} />
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ClipboardList size={16} color="#b45309" /> Pending Reorder Requests <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>(To CEO)</span>
          </h3>
          <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', marginBottom: 28 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={th}>#</th>
                  <th style={th}>Product</th>
                  <th style={th}>Requested By</th>
                  <th style={th}>Current Stock</th>
                  <th style={th}>Suggested Qty</th>
                  <th style={th}>Priority</th>
                  <th style={th}>Date</th>
                  <th style={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {reorderRequests.length === 0 ? (
                  <tr><td colSpan={8} style={{ ...td, textAlign: 'center', color: '#94a3b8', padding: 30 }}>No pending reorder requests.</td></tr>
                ) : (
                  reorderRequests.map((r, idx) => {
                    const prio = (r.priority || 'MEDIUM').toUpperCase();
                    const isHigh = prio === 'HIGH';
                    const prioColor = isHigh ? { bg: '#fef2f2', text: '#dc2626' } : prio === 'LOW' ? { bg: '#f0fdf4', text: '#16a34a' } : { bg: '#fffbeb', text: '#d97706' };
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={td}>{idx + 1}</td>
                        <td style={{ ...td, fontWeight: 600 }}>{r.product_name || '—'}</td>
                        <td style={td}>{r.requester_name || '—'}</td>
                        <td style={td}>{r.current_stock != null ? `${r.current_stock} ${r.unit || ''}`.trim() : '—'}</td>
                        <td style={{ ...td, fontWeight: 600 }}>{r.quantity_requested || 0}</td>
                        <td style={td}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: prioColor.text, fontWeight: 600, fontSize: 12, background: prioColor.bg, padding: '3px 10px', borderRadius: 20 }}>
                            <AlertTriangle size={12} /> {prio}
                          </span>
                        </td>
                        <td style={td}>{r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : '—'}</td>
                        <td style={td}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f0fdf4', color: '#16a34a', fontWeight: 600, fontSize: 12, padding: '3px 10px', borderRadius: 20 }}>
                            Pending CEO
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ─── TOP SELLING PRODUCTS (TODAY) ─── */}
          <div style={{ border: 'none', borderTop: '2px solid #e2e8f0', margin: '0 0 28px' }} />
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendingUp size={16} color="#166534" /> Top Selling Products <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>(Today)</span>
          </h3>
          <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', marginBottom: 28 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={th}>#</th>
                  <th style={th}>Product</th>
                  <th style={th}>Qty Sold</th>
                  <th style={th}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.length === 0 ? (
                  <tr><td colSpan={4} style={{ ...td, textAlign: 'center', color: '#94a3b8', padding: 30 }}>No sales recorded today.</td></tr>
                ) : (
                  topProducts.map((p, i) => (
                    <tr key={p.id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={td}>{i + 1}</td>
                      <td style={{ ...td, fontWeight: 600 }}>{p.name}</td>
                      <td style={{ ...td, fontWeight: 600, color: '#166534' }}>{p.total_qty || 0}</td>
                      <td style={{ ...td, fontWeight: 700, color: '#166534' }}>{fmt(p.total_revenue)} ETB</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ─── CROP CALENDAR ─── */}
          <div style={{ border: 'none', borderTop: '2px solid #e2e8f0', margin: '0 0 28px' }} />
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CalendarDays size={16} color="#166534" /> Crop Calendar
          </h3>
          <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', marginBottom: 28 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={th}>#</th>
                  <th style={th}>Crop</th>
                  <th style={th}>Planting</th>
                  <th style={th}>Harvest</th>
                  <th style={th}>Status</th>
                  <th style={th}>Best Seed</th>
                </tr>
              </thead>
              <tbody>
                {cropCalendarData.map((c, i) => {
                  const sc = cropStatusColors[c.status] || { bg: '#f1f5f9', text: '#64748b' };
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={td}>{i + 1}</td>
                      <td style={{ ...td, fontWeight: 600 }}>{c.crop}</td>
                      <td style={td}>{c.planting}</td>
                      <td style={td}>{c.harvest}</td>
                      <td style={td}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: sc.text, fontWeight: 600, fontSize: 12, background: sc.bg, padding: '3px 10px', borderRadius: 20 }}>
                          {c.status}
                        </span>
                      </td>
                      <td style={td}>{c.bestSeed}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
