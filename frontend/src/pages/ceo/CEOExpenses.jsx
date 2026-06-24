import React, { useState, useEffect } from 'react';
import financeService from '../../services/financeService';
import styles from './ExecutiveReports.module.css';

const formatCurrency = (num) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB', minimumFractionDigits: 2 }).format(num || 0);
const formatDate = (date) => date ? new Date(date).toLocaleDateString() : '-';

const CEOExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await financeService.getExpenses({ limit: 100 });
      setExpenses(res?.data?.expenses || []);
      setSummary(res?.data?.summary || null);
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const viewDetails = async (id) => {
    setDetailLoading(true);
    setSelected(null);
    try {
      const res = await financeService.getEnhancedExpenseById(id);
      setSelected(res?.data?.data?.expense || res?.data?.expense);
    } catch (err) {
      const fallback = expenses.find(e => e.id === id);
      if (fallback) setSelected(fallback);
    } finally {
      setDetailLoading(false);
    }
  };

  const statusBadge = (exp) => {
    if (exp.approved_at) return <span className={`${styles.badge} ${styles.ontarget}`}>Approved</span>;
    return <span className={`${styles.badge} ${styles.upcoming}`}>Pending</span>;
  };

  return (
    <div className={styles.reportsContainer}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Expense Overview</h1>
          <p className={styles.subtitle}>View all company expenses and details</p>
        </div>
      </div>

      {summary && (
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <h3>Total Expenses</h3>
            <div className={styles.value}>{formatCurrency(summary.totalAmount)}</div>
          </div>
          <div className={styles.summaryCard}>
            <h3>Approved</h3>
            <div className={styles.value}>{formatCurrency(summary.approvedAmount)}</div>
          </div>
          <div className={styles.summaryCard}>
            <h3>Pending</h3>
            <div className={styles.value}>{formatCurrency(summary.pendingAmount)}</div>
          </div>
          <div className={styles.summaryCard}>
            <h3>Total Count</h3>
            <div className={styles.value}>{summary.totalCount}</div>
          </div>
        </div>
      )}

      {selected && (
        <div className={styles.chartCard} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Expense #{selected.id} Details</h3>
            <button onClick={() => setSelected(null)}
              style={{ background: '#fee2e2', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontWeight: 600, color: '#991b1b' }}>
              Close
            </button>
          </div>
          {detailLoading ? (
            <p>Loading details...</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><strong>Amount:</strong> {formatCurrency(selected.amount)}</div>
              <div><strong>Category:</strong> {selected.category_name || selected.Category?.name || '-'}</div>
              <div><strong>Date:</strong> {formatDate(selected.date)}</div>
              <div><strong>Status:</strong> {statusBadge(selected)}</div>
              <div><strong>Payment Method:</strong> {selected.payment_method_name || selected.PaymentMethod?.name || '-'}</div>
              <div><strong>Reference:</strong> {selected.reference_number || selected.referenceNumber || '-'}</div>
              <div style={{ gridColumn: '1 / -1' }}><strong>Description:</strong> {selected.description}</div>
              <div><strong>Entered By:</strong> {selected.entered_by_name || selected.EnteredBy?.full_name || '-'}</div>
              <div><strong>Approved By:</strong> {selected.approved_by_name || selected.ApprovedBy?.full_name || '-'}</div>
              {selected.approved_at && <div style={{ gridColumn: '1 / -1' }}><strong>Approved At:</strong> {formatDate(selected.approved_at)}</div>}
              {selected.approvalHistory && selected.approvalHistory.length > 0 && (
                <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
                  <h4 style={{ margin: '0 0 8px 0' }}>Approval History</h4>
                  {selected.approvalHistory.map((step, i) => (
                    <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                      <strong>{step.tier || 'Tier'} :</strong> {step.approver_name || 'Pending'}
                      <span style={{ float: 'right' }}>{step.status} {step.actioned_at ? `(${formatDate(step.actioned_at)})` : ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className={styles.tableContainer}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>Loading expenses...</div>
        ) : expenses.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>No expenses found.</div>
        ) : (
          <table className={styles.reportTable}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(exp => (
                <tr key={exp.id}>
                  <td>{formatDate(exp.date)}</td>
                  <td className={styles.deptName}>{exp.description}</td>
                  <td>{exp.category_name || exp.Category?.name || '-'}</td>
                  <td className={styles.valueCell}>{formatCurrency(exp.amount)}</td>
                  <td>{statusBadge(exp)}</td>
                  <td>
                    <button onClick={() => viewDetails(exp.id)}
                      style={{ background: '#1C64F2', color: 'white', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontWeight: 500, fontSize: 12 }}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CEOExpenses;
