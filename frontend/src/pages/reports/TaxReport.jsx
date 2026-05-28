import React, { useState, useEffect } from 'react';
import reportService from '../../services/reportService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './TaxReport.module.css';
const TaxReport = () => {
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
      const res = await reportService.getTaxSummary(filters);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load tax report', err);
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
      const res = await reportService.exportReport('tax-audit', { 
        ...filters,
        format: 'pdf'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Tax_Report_${filters.startDate}_to_${filters.endDate}.pdf`);
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
          <h1 className={styles.title}>Tax & Audit Report</h1>
          <p className={styles.subtitle}>View VAT collections and tax summaries for compliance.</p>
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
              {loading ? 'Loading...' : 'Generate Tax Report'}
            </button>
          </div>
        </form>
      </div>
      {loading ? (
        <div className={styles.loadingState}>Calculating tax data...</div>
      ) : !data ? (
        <div className={styles.emptyState}>No tax data available for the selected period.</div>
      ) : (
        <div className={styles.grid}>
          {}
          <div className={styles.summarySection}>
            <div className={styles.summaryCard}>
              <h3>Total Taxable Sales</h3>
              <p className={styles.amount}>{formatCurrency(data.totalTaxableSales)}</p>
            </div>
            <div className={styles.summaryCard}>
              <h3>Total VAT Collected (15%)</h3>
              <p className={styles.taxAmount}>{formatCurrency(data.totalVatCollected)}</p>
            </div>
            <div className={styles.summaryCard}>
              <h3>Total Withholding Tax</h3>
              <p className={styles.amount}>{formatCurrency(data.totalWithholdingTax)}</p>
            </div>
          </div>
          {}
          <div className={styles.tableWrapper}>
            <div className={styles.tableHeader}>
              <h2>Tax Collection Details</h2>
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Receipt / Invoice #</th>
                  <th>Taxable Amount</th>
                  <th>VAT (15%)</th>
                  <th>Total Including Tax</th>
                </tr>
              </thead>
              <tbody>
                {data.details && data.details.length > 0 ? (
                  data.details.map((row, idx) => (
                    <tr key={idx} className={styles.row}>
                      <td>{formatDate(row.date, 'short')}</td>
                      <td className={styles.receiptCell}>{row.documentNumber}</td>
                      <td>{formatCurrency(row.taxableAmount)}</td>
                      <td className={styles.vatCell}>{formatCurrency(row.vatAmount)}</td>
                      <td className={styles.totalCell}>{formatCurrency(row.totalAmount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className={styles.emptyCell}>No detailed tax records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
export default TaxReport;
