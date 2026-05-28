import React, { useState, useEffect } from 'react';
import salesService from '../../services/salesService';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import styles from './SalesReports.module.css';
const SalesReports = () => {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const response = await salesService.getSalesReports({ range: dateRange });
        setReports(response.data?.data || response.data);
      } catch (error) {
        console.error('Sales: Failed to fetch reports:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [dateRange]);
  if (loading && !reports) return <div className={styles.loading}>Compiling sales data...</div>;
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Sales Reports</h2>
          <p className={styles.subtitle}>Detailed breakdown of revenue and sales performance</p>
        </div>
        <div className={styles.filters}>
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className={styles.select}>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <button className={styles.btnSecondary} onClick={() => window.print()}>Export PDF</button>
        </div>
      </div>
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.blue}`}>
          <h3>{formatCurrency(reports?.totalRevenue || 0)}</h3>
          <p>Gross Revenue</p>
        </div>
        <div className={`${styles.statCard} ${styles.green}`}>
          <h3>{formatNumber(reports?.totalTransactions || 0)}</h3>
          <p>Transactions</p>
        </div>
        <div className={`${styles.statCard} ${styles.purple}`}>
          <h3>{formatCurrency(reports?.averageOrderValue || 0)}</h3>
          <p>Avg Order Value</p>
        </div>
        <div className={`${styles.statCard} ${styles.orange}`}>
          <h3>{formatNumber(reports?.uniqueCustomers || 0)}</h3>
          <p>Unique Customers</p>
        </div>
      </div>
      <div className={styles.mainGrid}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Top Selling Products</h3>
          <div className={styles.tableWrapper}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th className={styles.textRight}>Units Sold</th>
                  <th className={styles.textRight}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {reports?.topProducts?.map((item, index) => (
                  <tr key={index}>
                    <td className={styles.fontMedium}>{item.name}</td>
                    <td className={styles.textRight}>{formatNumber(item.quantity)}</td>
                    <td className={`${styles.textRight} ${styles.fontBold}`}>{formatCurrency(item.revenue)}</td>
                  </tr>
                ))}
                {(!reports?.topProducts || reports.topProducts.length === 0) && (
                  <tr>
                    <td colSpan="3" className={styles.emptyState}>No data available for this period.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Sales by Payment Method</h3>
          <div className={styles.methodList}>
            {reports?.salesByMethod?.map((method, index) => (
              <div key={index} className={styles.methodRow}>
                <span className={styles.fontMedium}>{method.name}</span>
                <div className={styles.textRight}>
                  <div className={styles.fontBold}>{formatCurrency(method.amount)}</div>
                  <div className={styles.methodPercent}>{formatPercentage(method.percentage)} of total</div>
                </div>
              </div>
            ))}
            {(!reports?.salesByMethod || reports.salesByMethod.length === 0) && (
              <div className={styles.emptyState}>No data available.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
function formatPercentage(value) {
  if (!value) return '0%';
  return `${value.toFixed(1)}%`;
}
export default SalesReports;
