import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import styles from './HRHome.module.css';

const HRHome = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await hrService.getSummary();
        setSummary(res.data?.data || res.data);
      } catch (err) {
        console.error('Failed to fetch HR summary:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading) {
    return <div className={styles.loading}>Loading HR dashboard...</div>;
  }

  const data = summary || {};

  const summaryCards = [
    { label: 'Total Employees', value: formatNumber(data.totalEmployees || 0), icon: '👥', color: '#3b82f6' },
    { label: 'Present Today',   value: formatNumber(data.presentToday || 0),   icon: '✅', color: '#10b981' },
    { label: 'Pending Leaves',  value: formatNumber(data.pendingLeaves || 0),  icon: '📋', color: '#f59e0b' },
    { label: 'Monthly Salary Cost', value: formatCurrency(data.monthlySalaryCost || 0), icon: '💰', color: '#8b5cf6' },
  ];

  const departments = data.departments || [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>HR Dashboard</h1>
        <p className={styles.pageSubtitle}>Human resources overview and key metrics</p>
      </div>

      <div className={styles.cardsGrid}>
        {summaryCards.map((card, idx) => (
          <div key={idx} className={styles.summaryCard} style={{ borderTop: `4px solid ${card.color}` }}>
            <div className={styles.cardIcon}>{card.icon}</div>
            <div className={styles.cardValue}>{card.value}</div>
            <div className={styles.cardLabel}>{card.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>Department Breakdown</h2>
        {departments.length > 0 ? (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Headcount</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept, idx) => (
                  <tr key={idx}>
                    <td>{dept.name || dept.department}</td>
                    <td className={styles.headcount}>{formatNumber(dept.count || dept.headcount || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyState}>No department data available.</div>
        )}
      </div>
    </div>
  );
};

export default HRHome;
