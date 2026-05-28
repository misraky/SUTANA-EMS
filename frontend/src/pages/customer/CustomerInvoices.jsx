import React, { useState, useEffect } from 'react';
import customerService from '../../services/customerService';
import { formatDate, formatCurrency } from '../../utils/formatters';
import styles from './CustomerInvoices.module.css';
const CustomerInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const res = await customerService.getInvoices(params);
      const data = res?.data?.invoices || [];
      const normalized = data.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoice_number || inv.invoiceNumber,
        createdAt: inv.created_at || inv.createdAt,
        totalAmount: inv.total_amount || inv.totalAmount,
        paidAmount: inv.amount_paid || inv.paidAmount,
        dueDate: inv.due_date || inv.dueDate,
        status: inv.status
      }));
      setInvoices(normalized);
    } catch (err) {
      console.error('Failed to fetch invoices', err);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Invoices</h1>
          <p className={styles.subtitle}>Manage your credit purchases and invoices.</p>
        </div>
        <select
          className={styles.filterSelect}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Invoices</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>
      {loading ? (
        <div className={styles.loadingState}>Loading invoices...</div>
      ) : invoices.length === 0 ? (
        <div className={styles.emptyState}>No invoices found for the selected filter.</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Total Amount</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const balance = Number(inv.totalAmount) - Number(inv.paidAmount);
                return (
                  <tr key={inv.id} className={styles.row}>
                    <td className={styles.invNumber}>{inv.invoiceNumber}</td>
                    <td>{formatDate(inv.createdAt)}</td>
                    <td>{formatCurrency(inv.totalAmount)}</td>
                    <td className={styles.textGreen}>{formatCurrency(inv.paidAmount)}</td>
                    <td className={styles.textRed}>{formatCurrency(balance)}</td>
                    <td>{formatDate(inv.dueDate)}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[inv.status]}`}>
                        {inv.status}
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
  );
};
export default CustomerInvoices;
