import React, { useState, useEffect } from 'react';
import reportService from '../../services/reportService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './SalesReport.module.css';
const SalesReport = () => {
  const [salesData, setSalesData] = useState([]);
  const [summary, setSummary] = useState({ totalSales: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  const [filters, setFilters] = useState({
    startDate: firstDay,
    endDate: lastDay,
    groupBy: 'day'
  });
  useEffect(() => {
    fetchReport();
  }, []);
  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await reportService.getSalesByPeriod(filters);
      const data = res.data;
      setSalesData(data.sales || []);
      setSummary({
        totalSales: data.summary?.totalCount || 0,
        totalRevenue: data.summary?.totalRevenue || 0
      });
    } catch (err) {
      console.error('Failed to load sales report', err);
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
      const res = await reportService.exportReport('sales', { 
        ...filters,
        format: 'pdf'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Sales_Report_${filters.startDate}_to_${filters.endDate}.pdf`);
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
          <h1 className={styles.title}>Sales Report</h1>
          <p className={styles.subtitle}>Analyze your revenue and sales volume over time.</p>
        </div>
        <button 
          className={styles.btnExport} 
          onClick={handleExportPDF}
          disabled={exporting || salesData.length === 0}
        >
          {exporting ? 'Generating PDF...' : '⬇ Export PDF'}
        </button>
      </div>
      {}
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
          <div className={styles.formGroup}>
            <label>Group By</label>
            <select 
              name="groupBy" 
              value={filters.groupBy} 
              onChange={handleFilterChange}
              className={styles.select}
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>
          </div>
          <div className={styles.formAction}>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? 'Loading...' : 'Generate Report'}
            </button>
          </div>
        </form>
      </div>
      {}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <h3>Total Revenue</h3>
          <p className={styles.revenueAmount}>{formatCurrency(summary.totalRevenue)}</p>
        </div>
        <div className={styles.summaryCard}>
          <h3>Total Sales Count</h3>
          <p className={styles.countAmount}>{summary.totalSales}</p>
        </div>
      </div>
      {}
      <div className={styles.tableWrapper}>
        <div className={styles.tableHeader}>
          <h2>Detailed Breakdown</h2>
        </div>
        {loading ? (
          <div className={styles.loadingState}>Fetching data...</div>
        ) : salesData.length === 0 ? (
          <div className={styles.emptyState}>No sales data found for this period.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Period</th>
                <th>Sales Count</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {salesData.map((row, idx) => (
                <tr key={idx} className={styles.row}>
                  <td className={styles.periodCell}>
                    {filters.groupBy === 'day' ? formatDate(row.date || row.period, 'short') : row.period}
                  </td>
                  <td>{row.count}</td>
                  <td className={styles.revenueCell}>{formatCurrency(row.revenue)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className={styles.totalRow}>
                <td>Total</td>
                <td>{summary.totalSales}</td>
                <td>{formatCurrency(summary.totalRevenue)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
};
export default SalesReport;
