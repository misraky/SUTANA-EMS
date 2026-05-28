import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import purchaseService from '../../services/purchaseService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './PurchaseHome.module.css';
const PurchaseHome = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await purchaseService.getPurchaseStatistics();
        setStats(response.data?.data || response.data);
      } catch (error) {
        console.error('Failed to fetch purchase statistics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStatistics();
  }, []);
  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner}></div>
        <p>Loading purchasing dashboard...</p>
      </div>
    );
  }
  if (!stats) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>⚠️</div>
          <p>Failed to load purchasing statistics. Please try again later.</p>
        </div>
      </div>
    );
  }
  const recentPOs = stats.recentPOs || [];
  const topSuppliers = stats.topSuppliers || [];
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Purchasing Summary</h1>
          <p className={styles.subtitle}>Overview of purchase orders, suppliers, and pending deliveries.</p>
        </div>
      </div>
      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>POs This Month</span>
          <span className={styles.statValue}>{stats.monthlyPOs}</span>
          <span className={`${styles.statBadge} ${styles.info}`}>Active Period</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Pending Approvals</span>
          <span className={styles.statValue}>{stats.pendingApprovals}</span>
          <span className={`${styles.statBadge} ${stats.pendingApprovals > 0 ? styles.warning : styles.success}`}>
            {stats.pendingApprovals > 0 ? 'Requires Action' : 'All Clear'}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Spend (YTD)</span>
          <span className={styles.statValue}>{formatCurrency(stats.totalSpendThisYear)}</span>
          <span className={`${styles.statBadge} ${styles.info}`}>Budget Check</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Active Suppliers</span>
          <span className={styles.statValue}>{stats.activeSuppliers}</span>
          <span className={`${styles.statBadge} ${styles.success}`}>Network</span>
        </div>
      </div>
      <div className={styles.contentGrid}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Recent Purchase Orders</h2>
          {recentPOs.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPOs.map(po => (
                  <tr key={po.id}>
                    <td>
                      <Link to={`/purchase/orders/${po.id}`} className={styles.poLink}>
                        {po.po_number}
                      </Link>
                    </td>
                    <td>{po.supplier}</td>
                    <td>{formatDate(po.created_at)}</td>
                    <td>{formatCurrency(po.total_amount)}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[po.status ? po.status.toLowerCase().replace(' ', '_') : ''] || ''}`}>
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className={styles.emptyState}>
              <p>No recent purchase orders found.</p>
            </div>
          )}
        </div>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Top Suppliers by Spend</h2>
          {topSuppliers.length > 0 ? (
            <div>
              {topSuppliers.map((supplier, idx) => (
                <div key={supplier.id || idx} className={styles.supplierItem}>
                  <div className={styles.supplierInfo}>
                    <h4>{supplier.name}</h4>
                  </div>
                  <div className={styles.supplierSpend}>
                    {formatCurrency(supplier.total_spent)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>No supplier data available yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default PurchaseHome;
