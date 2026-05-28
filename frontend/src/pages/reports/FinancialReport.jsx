import React, { useState, useEffect } from 'react';
import reportService from '../../services/reportService';
import { formatCurrency } from '../../utils/formatters';
import styles from './FinancialReport.module.css';
const FinancialReport = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  const [filters, setFilters] = useState({
    startDate: firstDay,
    endDate: lastDay
  });
  useEffect(() => {
    fetchReport();
  }, []);
  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await reportService.getProfitAndLoss(filters);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load financial report', err);
    } finally {
      setLoading(false);
    }
  };
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  const handleGenerate = (e) => {
    e.preventDefault();
    fetchReport();
  };
  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const res = await reportService.exportReport('pnl', { 
        ...filters,
        format: 'pdf'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `PnL_Report_${filters.startDate}_to_${filters.endDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Profit & Loss Statement</h1>
          <p className={styles.subtitle}>View your business revenue, expenses, and net profit.</p>
        </div>
        <button 
          className={styles.btnExport} 
          onClick={handleExportPDF}
          disabled={exporting || !data}
        >
          {exporting ? 'Generating PDF...' : '⬇ Export PDF'}
        </button>
      </div>
      <div className={styles.filterCard}>
        <form onSubmit={handleGenerate} className={styles.filterForm}>
          <div className={styles.formGroup}>
            <label>Start Date</label>
            <input 
              type="date" 
              name="startDate" 
              value={filters.startDate} 
              onChange={handleFilterChange}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>End Date</label>
            <input 
              type="date" 
              name="endDate" 
              value={filters.endDate} 
              onChange={handleFilterChange}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.formAction}>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? 'Loading...' : 'Generate P&L'}
            </button>
          </div>
        </form>
      </div>
      {loading ? (
        <div className={styles.loadingState}>Calculating financials...</div>
      ) : !data ? (
        <div className={styles.emptyState}>No data available for the selected period.</div>
      ) : (
        <div className={styles.pnlCard}>
          <div className={styles.pnlHeader}>
            <h2>Statement for Period: {filters.startDate} to {filters.endDate}</h2>
          </div>
          <div className={styles.pnlBody}>
            {}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Revenue</h3>
              <div className={styles.lineItem}>
                <span>Sales Revenue</span>
                <span>{formatCurrency(data.totalRevenue)}</span>
              </div>
              <div className={styles.subtotalRow}>
                <span>Total Revenue</span>
                <span>{formatCurrency(data.totalRevenue)}</span>
              </div>
            </div>
            {}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Cost of Goods & Expenses</h3>
              <div className={styles.lineItem}>
                <span>Cost of Goods Sold (COGS)</span>
                <span>{formatCurrency(data.cogs || 0)}</span>
              </div>
              <div className={styles.lineItem}>
                <span>Operating Expenses</span>
                <span>{formatCurrency(data.totalExpenses)}</span>
              </div>
              <div className={styles.subtotalRow}>
                <span>Total Expenses</span>
                <span>{formatCurrency((data.cogs || 0) + Number(data.totalExpenses))}</span>
              </div>
            </div>
            {}
            <div className={styles.netProfitSection}>
              <span>Net Profit / Loss</span>
              <span className={data.netProfit >= 0 ? styles.positive : styles.negative}>
                {formatCurrency(data.netProfit)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default FinancialReport;
