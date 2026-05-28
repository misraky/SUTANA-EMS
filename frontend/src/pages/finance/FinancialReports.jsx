import React, { useState, useEffect } from 'react';
import financeService from '../../services/financeService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './FinancialReports.module.css';
const FinancialReports = () => {
  const [activeTab, setActiveTab] = useState('ar'); 
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    fetchReport(activeTab);
  }, [activeTab]);
  const fetchReport = async (tab) => {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (tab === 'ar') {
        res = await financeService.getAccountsReceivable();
      } else {
        res = await financeService.getAccountsPayable();
      }
      setReportData(res?.data?.data?.aging || []);
    } catch (err) {
      console.error(`Failed to fetch ${tab.toUpperCase()} report:`, err);
      setError(`Failed to load ${tab === 'ar' ? 'Accounts Receivable' : 'Accounts Payable'} data.`);
    } finally {
      setLoading(false);
    }
  };
  const handleExport = () => {
    window.print();
  };
  const totalAmount = reportData.reduce((sum, item) => sum + (parseFloat(item.amount || item.totalAmount) || 0), 0);
  const totalPaid = reportData.reduce((sum, item) => sum + (parseFloat(item.paidAmount) || 0), 0);
  const totalOutstanding = totalAmount - totalPaid;
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Financial Reports</h1>
          <p className={styles.subtitle}>Detailed aging reports and financial statements</p>
        </div>
        <button className={styles.exportBtn} onClick={handleExport}>
          <i className="icon-download"></i> Export Report
        </button>
      </div>
      <div className={styles.tabsContainer}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'ar' ? styles.active : ''}`}
          onClick={() => setActiveTab('ar')}
        >
          Accounts Receivable (AR)
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'ap' ? styles.active : ''}`}
          onClick={() => setActiveTab('ap')}
        >
          Accounts Payable (AP)
        </button>
      </div>
      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Compiling {activeTab === 'ar' ? 'AR' : 'AP'} report...</p>
        </div>
      ) : error ? (
        <div className={styles.errorState}>
          <p>{error}</p>
          <button onClick={() => fetchReport(activeTab)} className={styles.retryBtn}>Retry</button>
        </div>
      ) : (
        <div className={styles.reportContent}>
          {}
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <h3>Total {activeTab === 'ar' ? 'Invoiced' : 'Billed'}</h3>
              <div className={styles.value}>{formatCurrency(totalAmount)}</div>
            </div>
            <div className={styles.summaryCard}>
              <h3>Total Paid</h3>
              <div className={`${styles.value} ${styles.positiveText}`}>{formatCurrency(totalPaid)}</div>
            </div>
            <div className={`${styles.summaryCard} ${styles.highlightCard}`}>
              <h3>Total Outstanding</h3>
              <div className={`${styles.value} ${activeTab === 'ar' ? styles.warningText : styles.negativeText}`}>
                {formatCurrency(totalOutstanding)}
              </div>
            </div>
          </div>
          {}
          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <h2>{activeTab === 'ar' ? 'Outstanding Invoices' : 'Outstanding POs & Expenses'}</h2>
            </div>
            {reportData.length === 0 ? (
              <div className={styles.emptyState}>No records found.</div>
            ) : (
              <div className={styles.tableResponsive}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Reference</th>
                      <th>Entity</th>
                      <th className={styles.amountCol}>Total Amount</th>
                      <th className={styles.amountCol}>Paid</th>
                      <th className={styles.amountCol}>Balance</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((item, idx) => {
                      const amount = parseFloat(item.amount || item.totalAmount) || 0;
                      const paid = parseFloat(item.paidAmount) || 0;
                      const balance = amount - paid;
                      return (
                        <tr key={item.id || idx}>
                          <td>{formatDate(item.date || item.createdAt)}</td>
                          <td className={styles.boldText}>
                            {activeTab === 'ar' ? `INV-${item.id}` : (item.referenceNumber || `PO-${item.id}`)}
                          </td>
                          <td>
                            {activeTab === 'ar' ? (item.Customer?.name || 'Walk-in') : (item.Supplier?.name || item.Category?.name || '-')}
                          </td>
                          <td className={styles.amountCol}>{formatCurrency(amount)}</td>
                          <td className={styles.amountCol}>{formatCurrency(paid)}</td>
                          <td className={`${styles.amountCol} ${styles.boldText}`}>{formatCurrency(balance)}</td>
                          <td>
                            <span className={`${styles.badge} ${balance <= 0 ? styles.paid : styles.pending}`}>
                              {balance <= 0 ? 'Paid' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default FinancialReports;
