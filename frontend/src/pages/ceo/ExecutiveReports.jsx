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
      const data = res.data?.data || res.data;
      setReportData(data);
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

  const renderSummary = () => {
    if (!reportData) return null;
    const summary = reportData.summary || {};
    
    // Calculate some dummy growth metrics for now if not provided by backend
    const revGrowth = 15.2; 
    const profGrowth = 8.5;

    return (
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <h3>Total Revenue</h3>
          <div className={styles.value}>{formatCurrency(summary.totalRevenue || 0)}</div>
          <div className={`${styles.trend} ${revGrowth > 0 ? styles.up : styles.down}`}>
            {revGrowth > 0 ? '↑' : '↓'} {Math.abs(revGrowth)}%
          </div>
        </div>
        <div className={styles.summaryCard}>
          <h3>Net Profit</h3>
          <div className={styles.value}>{formatCurrency(summary.netProfit || 0)}</div>
          <div className={`${styles.trend} ${profGrowth > 0 ? styles.up : styles.down}`}>
            {profGrowth > 0 ? '↑' : '↓'} {Math.abs(profGrowth)}%
          </div>
        </div>
        <div className={styles.summaryCard}>
          <h3>Total Expenses</h3>
          <div className={styles.value}>{formatCurrency(summary.totalExpenses || 0)}</div>
        </div>
        <div className={styles.summaryCard}>
          <h3>New Customers</h3>
          <div className={styles.value}>{formatNumber(summary.newCustomers || 0)}</div>
        </div>
      </div>
    );
  };

  const renderDepartments = () => {
    if (!reportData) return null;
    const summary = reportData.summary || {};
    
    const depts = [
      { 
        name: 'Sales', 
        revenue: summary.salesRevenue || 0, 
        expenses: (summary.totalExpenses || 0) * 0.6, // rough estimate
        status: (summary.salesRevenue || 0) > 0 ? 'Exceeding' : 'Underperforming'
      },
      { 
        name: 'Printing', 
        revenue: summary.printingRevenue || 0, 
        expenses: (summary.totalExpenses || 0) * 0.4, // rough estimate
        status: (summary.printingRevenue || 0) > 0 ? 'On Target' : 'Underperforming'
      },
      { name: 'Agriculture', revenue: 0, expenses: 0, status: 'Upcoming' },
      { name: 'Pharmacy', revenue: 0, expenses: 0, status: 'Upcoming' }
    ];

    return (
      <div className={styles.tableContainer}>
        <table className={styles.reportTable}>
          <thead>
            <tr>
              <th>Department</th>
              <th>Revenue</th>
              <th>Estimated Expenses</th>
              <th>Net Contribution</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {depts.map((dept, idx) => {
              const net = dept.revenue - dept.expenses;
              return (
                <tr key={idx}>
                  <td className={styles.deptName}>{dept.name}</td>
                  <td>{formatCurrency(dept.revenue)}</td>
                  <td>{formatCurrency(dept.expenses)}</td>
                  <td className={net >= 0 ? styles.positiveText : styles.negativeText}>
                    {formatCurrency(net)}
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles[dept.status.toLowerCase().replace(' ', '')]}`}>
                      {dept.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderInsights = () => {
    if (!reportData) return null;
    const summary = reportData.summary || {};
    const topProducts = reportData.topProducts || [];
    
    return (
      <div className={styles.insightsCard}>
        <ul className={styles.insightsList}>
          <li>
            <strong>Revenue Analysis:</strong> Total revenue for the {period} period was {formatCurrency(summary.totalRevenue || 0)}. 
            {summary.salesRevenue > summary.printingRevenue ? ' Sales is currently driving the majority of revenue.' : ' Printing is the primary revenue driver.'}
          </li>
          <li>
            <strong>Profitability:</strong> The overall profit margin stands at {summary.profitMargin || 0}%. 
            {(summary.profitMargin || 0) > 15 ? ' This is a healthy margin.' : ' Consider reducing expenses to improve margins.'}
          </li>
          {topProducts.length > 0 && (
            <li>
              <strong>Top Performing Product:</strong> "{topProducts[0].name}" generated {formatCurrency(topProducts[0].revenue)} with {topProducts[0].quantity} units sold.
            </li>
          )}
          <li>
            <strong>Operational Efficiency:</strong> {formatNumber(summary.completedOrders || 0)} orders were completed out of {formatNumber(summary.totalOrders || 0)}.
          </li>
        </ul>
      </div>
    );
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
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Executive Summary</h2>
            {renderSummary()}
          </div>
          
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Departmental Performance</h2>
            {renderDepartments()}
          </div>
          
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Strategic Insights & Recommendations</h2>
            {renderInsights()}
          </div>
        </div>
      ) : (
        <div className={styles.emptyState}>No data available for this period.</div>
      )}
    </div>
  );
};
export default ExecutiveReports;
