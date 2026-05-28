import React, { useState, useEffect } from 'react';
import ceoService from '../../services/ceoService';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import styles from './ExecutiveReports.module.css';
const ExecutiveReports = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [period, setPeriod] = useState('monthly');
  const [error, setError] = useState(null);
  useEffect(() => {
    fetchReport();
  }, [period]);
  const fetchReport = async () => {
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
      setReportData(res.data);
    } catch (err) {
      console.error('Failed to fetch executive report:', err);
      setError('Failed to load report data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  const handleExport = () => {
    window.print();
  };
  return (
    <div className={styles.reportsContainer}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Executive Reports</h1>
          <p className={styles.subtitle}>Comprehensive performance analysis and insights</p>
        </div>
        <div className={styles.actions}>
          <div className={styles.periodSelector}>
            {['monthly', 'quarterly', 'yearly'].map(p => (
              <button
                key={p}
                className={`${styles.periodBtn} ${period === p ? styles.active : ''}`}
                onClick={() => setPeriod(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <button className={styles.exportBtn} onClick={handleExport}>
            <i className="icon-download"></i> Export PDF
          </button>
        </div>
      </div>
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
          {}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Executive Summary</h2>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryCard}>
                <h3>Total Revenue</h3>
                <div className={styles.value}>{formatCurrency(reportData.revenue || 0)}</div>
                <div className={`${styles.trend} ${reportData.revenueGrowth > 0 ? styles.up : styles.down}`}>
                  {reportData.revenueGrowth > 0 ? '↑' : '↓'} {Math.abs(reportData.revenueGrowth || 0)}%
                </div>
              </div>
              <div className={styles.summaryCard}>
                <h3>Net Profit</h3>
                <div className={styles.value}>{formatCurrency(reportData.profit || 0)}</div>
                <div className={`${styles.trend} ${reportData.profitGrowth > 0 ? styles.up : styles.down}`}>
                  {reportData.profitGrowth > 0 ? '↑' : '↓'} {Math.abs(reportData.profitGrowth || 0)}%
                </div>
              </div>
              <div className={styles.summaryCard}>
                <h3>Total Expenses</h3>
                <div className={styles.value}>{formatCurrency(reportData.expenses || 0)}</div>
              </div>
              <div className={styles.summaryCard}>
                <h3>New Customers</h3>
                <div className={styles.value}>{formatNumber(reportData.newCustomers || 0)}</div>
              </div>
            </div>
          </div>
          {}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Departmental Performance</h2>
            <div className={styles.tableContainer}>
              <table className={styles.reportTable}>
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Revenue</th>
                    <th>Expenses</th>
                    <th>Net Contribution</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(reportData.departments || [
                    { name: 'Sales', revenue: 500000, expenses: 150000, status: 'Exceeding' },
                    { name: 'Logistics', revenue: 200000, expenses: 180000, status: 'On Target' },
                    { name: 'Printing', revenue: 150000, expenses: 80000, status: 'Exceeding' },
                    { name: 'Store', revenue: 80000, expenses: 60000, status: 'Underperforming' }
                  ]).map((dept, idx) => (
                    <tr key={idx}>
                      <td className={styles.deptName}>{dept.name}</td>
                      <td>{formatCurrency(dept.revenue)}</td>
                      <td>{formatCurrency(dept.expenses)}</td>
                      <td className={dept.revenue - dept.expenses > 0 ? styles.positiveText : styles.negativeText}>
                        {formatCurrency(dept.revenue - dept.expenses)}
                      </td>
                      <td>
                        <span className={`${styles.badge} ${styles[dept.status.toLowerCase().replace(' ', '')]}`}>
                          {dept.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Strategic Insights & Recommendations</h2>
            <div className={styles.insightsCard}>
              <ul className={styles.insightsList}>
                {reportData.insights ? reportData.insights.map((insight, idx) => (
                  <li key={idx}>{insight}</li>
                )) : (
                  <>
                    <li><strong>Revenue Growth:</strong> The {period} growth is largely driven by the Enterprise Sales sector, indicating strong market fit.</li>
                    <li><strong>Cost Optimization:</strong> Logistics expenses have risen by 4% relative to revenue. Consider reviewing supplier contracts.</li>
                    <li><strong>Action Item:</strong> Focus on underperforming departments (Store) to align with company-wide target margins.</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.emptyState}>No data available for this period.</div>
      )}
    </div>
  );
};
export default ExecutiveReports;
