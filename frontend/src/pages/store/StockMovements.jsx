import React, { useState, useEffect } from 'react';
import inventoryService from '../../services/inventoryService';
import { formatDateTime } from '../../utils/dateUtils';
import { formatNumber } from '../../utils/formatters';
import styles from './StockMovements.module.css';
const StockMovements = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchMovements = async () => {
      try {
        const response = await inventoryService.getMovements();
        setMovements(response.data.movements || []);
      } catch (error) {
        console.error('Failed to fetch stock movements:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMovements();
  }, []);
  if (loading) return <div className={styles.loadingContainer}>Fetching transaction history...</div>;
  return (
    <div className={styles.stockMovements}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.title}>Stock Movements</h2>
          <p className={styles.subtitle}>History of all inventory adjustments and transfers</p>
        </div>
        <button className={styles.btnSecondary}>Export CSV</button>
      </div>
      <div className={styles.tableContainer}>
        {movements.length === 0 ? (
          <div className={styles.emptyState}>No stock movement records found.</div>
        ) : (
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Type</th>
                <th>Change</th>
                <th>Before</th>
                <th>After</th>
                <th>Performed By</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id}>
                  <td className={styles.textMuted}>{formatDateTime(m.createdAt || m.created_at)}</td>
                  <td><strong>{m.productName || m.product_name}</strong></td>
                  <td>
                    <span className={`${styles.badge} ${styles['type' + (m.transactionType || m.transaction_type || '').replace(/\s+/g, '')]}`}>
                      {m.transactionType || m.transaction_type}
                    </span>
                  </td>
                  <td className={(m.quantityChange || m.quantity_change) > 0 ? styles.textGreen : styles.textRed}>
                    {(m.quantityChange || m.quantity_change) > 0 ? '+' : ''}{formatNumber(m.quantityChange || m.quantity_change)}
                  </td>
                  <td>{formatNumber(m.quantityBefore || m.quantity_before)}</td>
                  <td>{formatNumber(m.quantityAfter || m.quantity_after)}</td>
                  <td>{m.userName || m.user_name}</td>
                  <td className={`${styles.textSm} ${styles.italic}`}>"{m.reason}"</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
export default StockMovements;
