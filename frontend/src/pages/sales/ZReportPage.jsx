import React, { useState, useEffect } from 'react';
import salesService from '../../services/salesService';
import { formatCurrency, formatNumber } from '../../utils/formatters';

const zreportStyles = `
  @media (max-width: 1024px) {
    .zreport-grid-2 { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 768px) {
    .zreport-page-header { flex-direction: column; align-items: stretch; gap: 1rem; }
    .zreport-page-header input { width: 100% !important; }
  }
  @media (max-width: 640px) {
    .zreport-table-wrap { overflow-x: auto; }
    .zreport-table-wrap table { min-width: 500px; }
  }
`;

const ZReportPage = () => {
  const [report, setReport] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [date]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await salesService.getZReport({ date });
      setReport(res.data?.data);
    } catch (err) {
      console.error('Failed to load Z-report:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Z-Report...</div>;

  const s = report?.summary || {};

  return (
    <div>
      <style>{zreportStyles}</style>
      <div className="page-header zreport-page-header">
        <div>
          <h1 className="page-title">Z-Report</h1>
          <p className="page-subtitle">End-of-day sales summary and reconciliation</p>
        </div>
        <div>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.875rem' }}
          />
        </div>
      </div>

      {report && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="stat-card">
              <span className="stat-label">Date</span>
              <span className="stat-value" style={{ fontSize: '1rem' }}>{report.date}</span>
              <span className="stat-badge info">Report</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Total Transactions</span>
              <span className="stat-value">{formatNumber(s.totalSales || 0)}</span>
              <span className="stat-badge info">Sales</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Gross Revenue</span>
              <span className="stat-value">{formatCurrency(s.totalRevenue || 0)}</span>
              <span className="stat-badge success">Revenue</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Total Tax (15%)</span>
              <span className="stat-value">{formatCurrency(s.totalTax || 0)}</span>
              <span className="stat-badge warning">Tax</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Total Discounts</span>
              <span className="stat-value" style={{ color: '#dc2626' }}>-{formatCurrency(s.totalDiscount || 0)}</span>
              <span className="stat-badge" style={{ background: '#fee2e2', color: '#991b1b' }}>Discounts</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Voided Transactions</span>
              <span className="stat-value" style={{ color: s.voidedCount > 0 ? '#dc2626' : '#059669' }}>
                {formatNumber(s.voidedCount || 0)}
              </span>
              <span className="stat-badge" style={{ background: s.voidedCount > 0 ? '#fee2e2' : '#d1fae5', color: s.voidedCount > 0 ? '#991b1b' : '#065f46' }}>
                {s.voidedCount > 0 ? 'Flagged' : 'Clean'}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Returns</span>
              <span className="stat-value" style={{ color: s.returnCount > 0 ? '#dc2626' : '#059669' }}>
                {formatNumber(s.returnCount || 0)}
              </span>
              <span className="stat-badge" style={{ background: '#fef3c7', color: '#92400e' }}>
                {formatCurrency(s.totalRefundAmount || 0)}
              </span>
            </div>
          </div>

          <div className="zreport-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div className="card zreport-table-wrap" style={{ padding: '24px' }}>
              <h3 style={{ fontWeight: 600, marginBottom: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
                Payment Breakdown
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.875rem' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Method</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Count</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {(report.paymentBreakdown || []).map(pm => (
                    <tr key={pm.method} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 500 }}>{pm.method}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>{formatNumber(pm.count)}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>{formatCurrency(pm.amount)}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', color: '#64748b' }}>
                        {s.totalRevenue > 0 ? ((parseFloat(pm.amount) / s.totalRevenue) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                  ))}
                  {(!report.paymentBreakdown || report.paymentBreakdown.length === 0) && (
                    <tr><td colSpan="4" style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>No payment data</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="card zreport-table-wrap" style={{ padding: '24px' }}>
              <h3 style={{ fontWeight: 600, marginBottom: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
                Cashier Performance
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.875rem' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Cashier</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Transactions</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {(report.cashierBreakdown || []).map(cb => (
                    <tr key={cb.cashierId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 500 }}>{cb.cashierName}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>{formatNumber(cb.transactions)}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>{formatCurrency(cb.total)}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', color: '#64748b' }}>
                        {cb.transactions > 0 ? formatCurrency(cb.total / cb.transactions) : '—'}
                      </td>
                    </tr>
                  ))}
                  {(!report.cashierBreakdown || report.cashierBreakdown.length === 0) && (
                    <tr><td colSpan="4" style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>No cashier data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
              Cash Reconciliation
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              {[
                { label: 'Cash Sales', value: formatCurrency(s.totalCash || 0), color: '#059669' },
                { label: 'Credit Sales', value: formatCurrency(s.totalCredit || 0), color: '#f59e0b' },
                { label: 'Bank Transfer', value: formatCurrency(s.totalTransfer || 0), color: '#3b82f6' },
                { label: 'Telebirr', value: formatCurrency(s.totalTelebirr || 0), color: '#8b5cf6' },
                { label: 'Refunds', value: `-${formatCurrency(s.totalRefundAmount || 0)}`, color: '#dc2626' },
                { label: 'Net Revenue', value: formatCurrency((s.totalRevenue || 0) - (s.totalRefundAmount || 0)), color: '#0f172a', bold: true },
              ].map(i => (
                <div key={i.label} style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>{i.label}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: i.bold ? 800 : 600, color: i.color }}>{i.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', padding: '16px' }}>
            Generated at {report.generatedAt ? new Date(report.generatedAt).toLocaleString() : '—'} &bull; Z-Report for {report.date}
          </div>
        </>
      )}
    </div>
  );
};

export default ZReportPage;
