import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import financeService from '../../services/financeService';
import printingService from '../../services/printingService';
import styles from './FinanceHome.module.css';

const FinanceHome = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [printingStats, setPrintingStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [financeRes, printRes] = await Promise.allSettled([
          financeService.getStatistics(),
          printingService.getStatistics(),
        ]);
        if (financeRes.status === 'fulfilled') setStats(financeRes.value.data || null);
        if (printRes.status  === 'fulfilled') setPrintingStats(printRes.value.data);
      } catch (error) {
        console.error('Failed to fetch finance statistics', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const fmt = (amount) =>
    new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0);

  const quickActions = [
    { label: 'Payments',  icon: '💳', path: '/finance/payments'  },
    { label: 'Expenses',  icon: '🧾', path: '/finance/expenses'  },
    { label: 'Budget',    icon: '📊', path: '/finance/budget'    },
    { label: 'Reports',   icon: '📈', path: '/finance/reports'   },
    { label: 'Approvals', icon: '✅', path: '/finance/approvals' },
  ];

  return (
    <div className={styles.page}>

      {/* ── Header ─────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerIcon}>💰</div>
        <div>
          <h1 className={styles.pageTitle}>Financial Summary</h1>
          <p className={styles.pageSubtitle}>Overview of income, expenses, and financial health at a glance.</p>
        </div>
      </div>

      {/* ── KPI Stat Cards ─────────────────────────────── */}
      <div className={styles.statGrid}>
        <div className={`${styles.statCard} ${styles.statCardRevenue}`}>
          <span className={styles.statIcon}>📈</span>
          <span className={styles.statValue}>{loading ? '—' : `ETB ${fmt(stats?.monthlyRevenue)}`}</span>
          <span className={styles.statLabel}>Total Revenue</span>
          <span className={`${styles.statBadge} ${styles.badgeUp}`}>↑ This Month</span>
        </div>
        <div className={`${styles.statCard} ${styles.statCardExpenses}`}>
          <span className={styles.statIcon}>💸</span>
          <span className={styles.statValue}>{loading ? '—' : `ETB ${fmt(stats?.monthlyExpenses)}`}</span>
          <span className={styles.statLabel}>Total Expenses</span>
          <span className={`${styles.statBadge} ${styles.badgeDown}`}>↓ This Month</span>
        </div>
        <div className={`${styles.statCard} ${styles.statCardProfit}`}>
          <span className={styles.statIcon}>💎</span>
          <span className={styles.statValue}>{loading ? '—' : `ETB ${fmt(stats?.netProfit)}`}</span>
          <span className={styles.statLabel}>Net Profit</span>
          <span className={`${styles.statBadge} ${styles.badgeInfo}`}>This Month</span>
        </div>
        <div className={`${styles.statCard} ${styles.statCardPending}`}>
          <span className={styles.statIcon}>⏳</span>
          <span className={styles.statValue}>{loading ? '—' : (stats?.pendingApprovals || 0)}</span>
          <span className={styles.statLabel}>Pending Approvals</span>
          <span className={`${styles.statBadge} ${styles.badgeWarning}`}>Needs Review</span>
        </div>
      </div>

      {/* ── Printing Revenue ────────────────────────────── */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>🖨️ Printing Revenue</h2>
          <button className={styles.sectionBtn} onClick={() => navigate('/printing/overview')}>
            View Printing →
          </button>
        </div>
        <div className={styles.miniGrid}>
          <div className={`${styles.miniTile} ${styles.blue}`}>
            <span className={styles.miniLabel}>Current Month</span>
            <span className={styles.miniValue}>ETB {fmt(printingStats?.monthlyRevenue?.[0]?.revenue || 0)}</span>
          </div>
          <div className={`${styles.miniTile} ${styles.green}`}>
            <span className={styles.miniLabel}>Total Orders</span>
            <span className={styles.miniValue}>{printingStats?.totalOrders ?? 0}</span>
          </div>
          <div className={`${styles.miniTile} ${styles.amber}`}>
            <span className={styles.miniLabel}>Pending Orders</span>
            <span className={styles.miniValue}>{printingStats?.pendingOrders ?? 0}</span>
          </div>
          <div className={`${styles.miniTile} ${styles.red}`}>
            <span className={styles.miniLabel}>Past Due</span>
            <span className={`${styles.miniValue} ${styles.danger}`}>{printingStats?.pastDueOrders ?? 0}</span>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ────────────────────────────────── */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>⚡ Quick Actions</h2>
        </div>
        <div className={styles.quickActions}>
          {quickActions.map(a => (
            <button key={a.path} className={styles.quickBtn} onClick={() => navigate(a.path)}>
              <span className={styles.quickBtnIcon}>{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};

export default FinanceHome;
