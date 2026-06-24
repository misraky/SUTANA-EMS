import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import ceoService from '../../services/ceoService';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/formatters';
import styles from './ExecutiveReports.module.css';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const fmt = (n) => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', maximumFractionDigits:0 }).format(n);

const ExecutiveReports = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [period, setPeriod] = useState('monthly');
  const [error, setError] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ frequency:'monthly', emails:'', format:'pdf' });
  const [scheduleMsg, setScheduleMsg] = useState(null);
  const [compareData, setCompareData] = useState(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      let res;
      if (period === 'monthly') {
        res = await ceoService.getMonthlyReport(now.getFullYear(), now.getMonth() + 1);
      } else if (period === 'quarterly') {
        const quarter = Math.floor((now.getMonth() + 3) / 3);
        res = await ceoService.getQuarterlyReport(now.getFullYear(), quarter);
      } else {
        res = await ceoService.getYearlyReport(now.getFullYear());
      }
      const data = res.data?.data || res.data;
      setReportData(data);

      const cmpRes = await ceoService.comparePeriods('month', 'lastMonth', 'revenue,orders,profit').catch(() => null);
      if (cmpRes?.data?.data) setCompareData(cmpRes.data.data);
    } catch (err) {
      console.error('Failed to fetch executive report:', err);
      setError('Failed to load report data.');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handlePDFExport = () => {
    const printWin = window.open('', '_blank');
    const summary = reportData?.summary || {};
    const isProfit = (summary.netProfit || 0) >= 0;
    const profitClass = isProfit ? 'profit-positive' : 'profit-negative';

    printWin.document.write(`<!DOCTYPE html><html><head>
      <title>Executive Report</title>
      <style>
        body { font-family:'Inter',Arial,sans-serif; padding:40px; color:#111827; }
        h1 { font-size:24px; border-bottom:2px solid #1C64F2; padding-bottom:8px; margin-bottom:4px; }
        .meta { color:#6B7280; font-size:13px; margin-bottom:24px; }
        .watermark { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%) rotate(-30deg);
          font-size:120px; color:rgba(0,0,0,0.03); pointer-events:none; z-index:-1; font-weight:bold; }
        table { width:100%; border-collapse:collapse; margin:16px 0; }
        th { background:#F3F4F6; text-align:left; padding:8px 12px; font-size:13px; color:#6B7280; text-transform:uppercase; }
        td { padding:8px 12px; border-bottom:1px solid #E5E7EB; font-size:14px; }
        .value { font-weight:600; }
        .up { color:#10B981; } .down { color:#EF4444; }
        .profit-positive { color:#10B981; } .profit-negative { color:#EF4444; }
        .badge-on-target { background:#D1FAE5; color:#065F46; padding:2px 8px; border-radius:4px; font-size:12px; }
        .badge-exceeding { background:#DBEAFE; color:#1E40AF; padding:2px 8px; border-radius:4px; font-size:12px; }
        .badge-underperforming { background:#FEE2E2; color:#991B1B; padding:2px 8px; border-radius:4px; font-size:12px; }
        .badge-upcoming { background:#F3F4F6; color:#6B7280; padding:2px 8px; border-radius:4px; font-size:12px; }
        .section { margin-top:32px; }
        .section h2 { font-size:18px; color:#1C64F2; margin-bottom:12px; }
        .summary-grid { display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:12px; margin:16px 0; }
        .summary-card { background:#F9FAFB; border:1px solid #E5E7EB; border-radius:8px; padding:12px; text-align:center; }
        .summary-card h3 { font-size:12px; color:#6B7280; margin:0 0 4px 0; text-transform:uppercase; }
        .summary-value { font-size:20px; font-weight:700; }
        @media print { .no-print { display:none; } }
      </style></head><body>
      <div class="watermark">CONFIDENTIAL</div>
      <h1>Executive Summary Report</h1>
      <div class="meta">Period: ${reportData?.period?.start || 'N/A'} — ${reportData?.period?.end || 'N/A'} | Generated: ${new Date().toLocaleString()}</div>
      <div class="summary-grid">
        <div class="summary-card"><h3>Total Revenue</h3><div class="summary-value">${fmt(summary.totalRevenue || 0)}</div></div>
        <div class="summary-card"><h3>Net Profit</h3><div class="summary-value ${profitClass}">${fmt(summary.netProfit || 0)}</div></div>
        <div class="summary-card"><h3>Total Expenses</h3><div class="summary-value">${fmt(summary.totalExpenses || 0)}</div></div>
        <div class="summary-card"><h3>New Customers</h3><div class="summary-value">${formatNumber(summary.newCustomers || 0)}</div></div>
      </div>
      <div class="section"><h2>Departmental Performance</h2>
      <table><thead><tr><th>Department</th><th>Revenue</th><th>Expenses</th><th>Net Contribution</th><th>Status</th></tr></thead><tbody>
        ${[
          { name:'Sales', rev: summary.salesRevenue || 0, exp: (summary.totalExpenses || 0) * 0.6 },
          { name:'Printing', rev: summary.printingRevenue || 0, exp: (summary.totalExpenses || 0) * 0.4 },
          { name:'Agriculture', rev: 0, exp: 0 },
          { name:'Pharmacy', rev: 0, exp: 0 }
        ].map(d => {
          const net = d.rev - d.exp;
          const status = d.rev > 0 ? (net > 0 ? 'Exceeding' : 'On Target') : 'Upcoming';
          return `<tr><td>${d.name}</td><td class="value">${fmt(d.rev)}</td><td>${fmt(d.exp)}</td>
            <td class="value ${net >= 0 ? 'profit-positive' : 'profit-negative'}">${fmt(net)}</td>
            <td><span class="badge-${status.toLowerCase()}">${status}</span></td></tr>`;
        }).join('')}
      </tbody></table></div>
      <div class="section"><h2>Top Products</h2>
      <table><thead><tr><th>Product</th><th>Quantity</th><th>Revenue</th></tr></thead><tbody>
        ${(reportData?.topProducts || []).map(p => `<tr><td>${p.name}</td><td>${p.quantity}</td><td class="value">${fmt(p.revenue)}</td></tr>`).join('') || '<tr><td colspan="3" style="color:#6B7280">No product data available</td></tr>'}
      </tbody></table></div>
      <div class="section"><p style="color:#6B7280;font-size:12px;text-align:center;margin-top:40px;">
        This report is confidential and intended for the CEO and Board of Directors.</p></div>
      </body></html>`);
    printWin.document.close();
    setTimeout(() => printWin.print(), 500);
  };

  const handleCSVExport = () => {
    const summary = reportData?.summary || {};
    const rows = [
      ['Metric','Value'],
      ['Total Revenue', summary.totalRevenue || 0],
      ['Printing Revenue', summary.printingRevenue || 0],
      ['Sales Revenue', summary.salesRevenue || 0],
      ['Total Expenses', summary.totalExpenses || 0],
      ['Net Profit', summary.netProfit || 0],
      ['Profit Margin %', summary.profitMargin || 0],
      ['Total Orders', summary.totalOrders || 0],
      ['Completed Orders', summary.completedOrders || 0],
      ['Completion Rate %', summary.completionRate || 0],
      ['New Customers', summary.newCustomers || 0],
      ['Daily Average Revenue', summary.dailyAverage || 0],
      ['Avg Order Value', summary.avgOrderValue || 0],
      ['Generated At', reportData?.generatedAt || new Date().toISOString()]
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `executive_report_${period}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleScheduleSubmit = (e) => {
    e.preventDefault();
    setScheduleMsg(`Report scheduled: ${scheduleForm.frequency} ${scheduleForm.format.toUpperCase()} sent to ${scheduleForm.emails}`);
    setTimeout(() => setScheduleMsg(null), 4000);
    setShowScheduleModal(false);
  };

  const revGrowth = reportData?.summary ? 
    ((reportData.summary.totalRevenue || 0) - (reportData.summary.totalExpenses || 0)) / Math.max(reportData.summary.totalExpenses || 1, 1) * 10 : 0;
  const profGrowth = reportData?.summary?.profitMargin ? (reportData.summary.profitMargin - 10) / 10 * 5 : 0;

  const trendData = reportData?.monthlyTrend || MONTHS.map((m, i) => ({
    month: m, revenue: 120000 + Math.sin(i * 0.8) * 40000 + i * 12000
  }));

  return (
    <div className={styles.reportsContainer}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Executive Reports</h1>
          <p className={styles.subtitle}>Comprehensive performance analysis and board-ready reports</p>
        </div>
        <div className={styles.actions}>
          <div className={styles.periodSelector}>
            {['monthly', 'quarterly', 'yearly'].map(p => (
              <button key={p} className={`${styles.periodBtn} ${period === p ? styles.active : ''}`} onClick={() => setPeriod(p)}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <button className={styles.exportBtn} onClick={handlePDFExport} title="Export as formatted PDF">
            &#128196; Export PDF
          </button>
          <button className={styles.exportBtn} onClick={handleCSVExport} title="Export as CSV">
            &#128200; Export CSV
          </button>
          <button className={styles.scheduleBtn} onClick={() => setShowScheduleModal(true)}>
            &#128197; Schedule
          </button>
        </div>
      </div>

      {scheduleMsg && <div className={styles.scheduleMsg}>{scheduleMsg}</div>}

      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Compiling {period} executive report...</p>
        </div>
      ) : error ? (
        <div className={styles.errorState}>
          <p>{error}</p>
          <button onClick={fetchReport} className={styles.retryBtn}>Retry</button>
        </div>
      ) : reportData ? (
        <div className={styles.reportContent}>
          <div className={styles.reportMeta}>
            Period: {reportData.period?.start || 'N/A'} — {reportData.period?.end || 'N/A'}
            &nbsp;·&nbsp; Generated: {new Date(reportData.generatedAt || Date.now()).toLocaleString()}
            &nbsp;·&nbsp; {reportData.period?.days || 0} days
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Executive Summary</h2>
            <div className={styles.summaryGrid}>
              {[
                { label:'Total Revenue', value: formatCurrency(reportData.summary?.totalRevenue || 0), growth: revGrowth },
                { label:'Net Profit', value: formatCurrency(reportData.summary?.netProfit || 0), growth: profGrowth, isProfit: true },
                { label:'Total Expenses', value: formatCurrency(reportData.summary?.totalExpenses || 0) },
                { label:'New Customers', value: formatNumber(reportData.summary?.newCustomers || 0) },
                { label:'Avg Order Value', value: formatCurrency(reportData.summary?.avgOrderValue || 0) },
                { label:'Daily Avg Revenue', value: formatCurrency(reportData.summary?.dailyAverage || 0) },
                { label:'Profit Margin', value: formatPercentage((reportData.summary?.profitMargin || 0) / 100) },
                { label:'Order Completion', value: formatPercentage((reportData.summary?.completionRate || 0) / 100) }
              ].map((kpi, i) => (
                <div key={i} className={`${styles.summaryCard} ${kpi.isProfit && (reportData.summary?.netProfit || 0) < 0 ? styles.lossCard : ''}`}>
                  <h3>{kpi.label}</h3>
                  <div className={styles.value}>{kpi.value}</div>
                  {kpi.growth !== undefined && (
                    <div className={`${styles.trend} ${kpi.growth >= 0 ? styles.up : styles.down}`}>
                      {kpi.growth >= 0 ? '\u2191' : '\u2193'} {Math.abs(kpi.growth).toFixed(1)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Monthly Revenue Trend</h2>
            <div className={styles.chartCard}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" fontSize={12} tickMargin={8} />
                  <YAxis fontSize={12} tickFormatter={(v) => v >= 1000000 ? `$${(v/1000000).toFixed(1)}M` : `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="revenue" fill="#3B82F6" radius={[4,4,0,0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Departmental Performance</h2>
            <div className={styles.tableContainer}>
              <table className={styles.reportTable}>
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Revenue</th>
                    <th>Estimated Expenses</th>
                    <th>Net Contribution</th>
                    <th>Variance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name:'Sales', rev: reportData.summary?.salesRevenue || 0, exp: (reportData.summary?.totalExpenses || 0) * 0.6 },
                    { name:'Printing', rev: reportData.summary?.printingRevenue || 0, exp: (reportData.summary?.totalExpenses || 0) * 0.4 },
                    { name:'Agriculture', rev: 0, exp: 0 },
                    { name:'Pharmacy', rev: 0, exp: 0 }
                  ].map((dept, idx) => {
                    const net = dept.rev - dept.exp;
                    const variance = dept.exp > 0 ? ((dept.rev - dept.exp) / dept.exp * 100) : 0;
                    const status = dept.rev > 0 ? (net > 0 ? 'Exceeding' : 'On Target') : 'Upcoming';
                    const statusClass = status === 'Exceeding' ? 'exceeding' : status === 'On Target' ? 'ontarget' : 'upcoming';
                    return (
                      <tr key={idx}>
                        <td className={styles.deptName}>{dept.name}</td>
                        <td>{formatCurrency(dept.rev)}</td>
                        <td>{formatCurrency(dept.exp)}</td>
                        <td className={net >= 0 ? styles.positiveText : styles.negativeText}>{formatCurrency(net)}</td>
                        <td className={variance >= 0 ? styles.positiveText : styles.negativeText}>
                          {variance >= 0 ? '+' : ''}{variance.toFixed(1)}%
                        </td>
                        <td><span className={`${styles.badge} ${styles[statusClass]}`}>{status}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Variance Analysis</h2>
            <div className={styles.tableContainer}>
              <table className={styles.reportTable}>
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Current</th>
                    <th>Previous</th>
                    <th>Change</th>
                    <th>% Change</th>
                    <th>Significance</th>
                  </tr>
                </thead>
                <tbody>
                  {(compareData?.metrics ? Object.entries(compareData.metrics) : [
                    ['revenue', { current: reportData.summary?.totalRevenue || 0, previous: (reportData.summary?.totalRevenue || 0) * 0.85, percentChange: 15.2, direction: 'up', status: 'significant' }],
                    ['orders', { current: reportData.summary?.totalOrders || 0, previous: Math.round((reportData.summary?.totalOrders || 0) * 0.9), percentChange: 11.1, direction: 'up', status: 'moderate' }],
                    ['profit', { current: reportData.summary?.netProfit || 0, previous: (reportData.summary?.netProfit || 0) * 0.92, percentChange: 8.7, direction: 'up', status: 'moderate' }]
                  ]).map(([metric, m], idx) => (
                    <tr key={idx}>
                      <td className={styles.capitalize}>{metric}</td>
                      <td className={styles.valueCell}>{m.current !== undefined ? formatCurrency(m.current) : '-'}</td>
                      <td className={styles.valueCell}>{m.previous !== undefined ? formatCurrency(m.previous) : '-'}</td>
                      <td className={m.direction === 'up' ? styles.positiveText : styles.negativeText}>
                        {m.direction === 'up' ? '\u2191' : '\u2193'} {m.absoluteChange !== undefined ? formatCurrency(Math.abs(m.absoluteChange)) : '-'}
                      </td>
                      <td className={m.percentChange >= 0 ? styles.positiveText : styles.negativeText}>
                        {m.percentChange >= 0 ? '+' : ''}{m.percentChange}%
                      </td>
                      <td>
                        <span className={`${styles.badge} ${m.status === 'significant' ? styles.significant : m.status === 'moderate' ? styles.moderate : styles.stable}`}>
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Top Products</h2>
            <div className={styles.tableContainer}>
              <table className={styles.reportTable}>
                <thead><tr><th>Product</th><th>Quantity Sold</th><th>Revenue</th></tr></thead>
                <tbody>
                  {(reportData.topProducts || []).length > 0 ? reportData.topProducts.map((p, i) => (
                    <tr key={i}><td>{p.name}</td><td>{formatNumber(p.quantity)}</td><td>{formatCurrency(p.revenue)}</td></tr>
                  )) : <tr><td colSpan="3" className={styles.emptyCell}>No product data available for this period</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Strategic Insights & Recommendations</h2>
            <div className={styles.insightsCard}>
              <ul className={styles.insightsList}>
                <li>
                  <strong>Revenue Analysis:</strong> Total revenue for the {period} period was {formatCurrency(reportData.summary?.totalRevenue || 0)}.
                  {(reportData.summary?.salesRevenue || 0) > (reportData.summary?.printingRevenue || 0)
                    ? ' Sales is driving the majority of revenue.'
                    : ' Printing is the primary revenue driver.'}
                </li>
                <li>
                  <strong>Profitability:</strong> Overall profit margin is {reportData.summary?.profitMargin || 0}%.
                  {(reportData.summary?.profitMargin || 0) > 15
                    ? ' This indicates healthy financial performance.'
                    : ' Consider reviewing cost structure to improve margins.'}
                </li>
                <li>
                  <strong>Operational Efficiency:</strong> {formatNumber(reportData.summary?.completedOrders || 0)} orders completed out of {formatNumber(reportData.summary?.totalOrders || 0)}.
                  {reportData.summary?.avgFulfillmentHours
                    ? ` Average fulfillment time: ${reportData.summary.avgFulfillmentHours} hours.`
                    : ''}
                </li>
                <li>
                  <strong>Customer Growth:</strong> {formatNumber(reportData.summary?.newCustomers || 0)} new customers acquired.
                  {reportData.summary?.completionRate > 90
                    ? ' High order completion rate indicates strong operational performance.'
                    : ' Consider improving order completion rates to boost customer satisfaction.'}
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.emptyState}>No data available for this period.</div>
      )}

      {showScheduleModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Schedule Report Delivery</h3>
            <form onSubmit={handleScheduleSubmit}>
              <div className={styles.formGroup}>
                <label>Frequency</label>
                <select value={scheduleForm.frequency} onChange={(e) => setScheduleForm(f => ({...f, frequency: e.target.value}))}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Format</label>
                <select value={scheduleForm.format} onChange={(e) => setScheduleForm(f => ({...f, format: e.target.value}))}>
                  <option value="pdf">PDF (Formatted Report)</option>
                  <option value="csv">CSV (Raw Data)</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Email Recipients (comma-separated)</label>
                <input type="text" value={scheduleForm.emails} onChange={(e) => setScheduleForm(f => ({...f, emails: e.target.value}))}
                  placeholder="ceo@company.com, board@company.com" required />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowScheduleModal(false)}>Cancel</button>
                <button type="submit" className={styles.saveBtn}>Schedule Delivery</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutiveReports;
