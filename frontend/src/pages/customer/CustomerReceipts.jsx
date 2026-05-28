import React, { useState, useEffect } from 'react';
import customerService from '../../services/customerService';
import { formatDate } from '../../utils/formatters';
import styles from './CustomerReceipts.module.css';
const CustomerReceipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  useEffect(() => {
    fetchReceipts(pagination.page);
  }, []);
  const fetchReceipts = async (page = 1) => {
    setLoading(true);
    try {
      const res = await customerService.getReceipts({ page, limit: 12 });
      const data = res?.data || {};
      const normalized = (data.receipts || []).map(r => ({
        id: r.id,
        receiptNumber: r.invoice_number,
        paymentDate: r.sale_date,
        amount: r.total_amount,
        amountPaid: r.amount_paid,
        paymentMethod: r.payment_method || 'N/A',
      }));
      setReceipts(normalized);
      setPagination({
        page: data.pagination?.page || 1,
        totalPages: data.pagination?.totalPages || 1,
      });
    } catch (err) {
      console.error('Failed to fetch receipts', err);
    } finally {
      setLoading(false);
    }
  };
  const handleDownload = async (id, receiptNumber) => {
    try {
      const res = await customerService.downloadReceipt(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Receipt_${receiptNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download receipt');
    }
  };
  const handlePageChange = (newPage) => {
    fetchReceipts(newPage);
  };
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Receipts</h1>
        <p className={styles.subtitle}>Download and view your past transaction receipts.</p>
      </div>
      {loading ? (
        <div className={styles.loadingState}>Loading receipts...</div>
      ) : receipts.length === 0 ? (
        <div className={styles.emptyState}>No receipts found.</div>
      ) : (
        <div className={styles.grid}>
          {receipts.map((receipt) => (
            <div key={receipt.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.receiptNo}>{receipt.receiptNumber}</span>
                <span className={styles.date}>{formatDate(receipt.paymentDate, 'short')}</span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.amount}>
                  ETB {Number(receipt.amount).toLocaleString('en-ET', { minimumFractionDigits: 2 })}
                </div>
                <div className={styles.method}>{receipt.paymentMethod}</div>
              </div>
              <div className={styles.cardFooter}>
                <button
                  className={styles.btnDownload}
                  onClick={() => handleDownload(receipt.id, receipt.receiptNumber)}
                >
                  Download PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            disabled={pagination.page <= 1}
            onClick={() => handlePageChange(pagination.page - 1)}
            className={styles.pageBtn}
          >
            ← Prev
          </button>
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => handlePageChange(pagination.page + 1)}
            className={styles.pageBtn}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};
export default CustomerReceipts;
