import React, { useState, useEffect } from 'react';
import ceoService from '../../services/ceoService';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/formatters';
import styles from './CEOHome.module.css';
const CEOHome = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await ceoService.getDashboardOverview();
        const data = response.data || {};
        setStats({
          revenue: data.totalRevenue || 0,
          revenueGrowth: data.revenueGrowth || 0,
          profit: data.netProfit || 0,
          profitGrowth: data.profitGrowth || 0,
          activeProjects: data.activeOrders || 0,
          activeProjectsGrowth: data.ordersGrowth || 0,
          customerRetention: data.customerSatisfaction || 0,
          retentionGrowth: data.satisfactionGrowth || 0
        });
      } catch (error) {
        console.error('CEO: Failed to fetch executive stats:', error);
        setStats({
          revenue: 0, revenueGrowth: 0,
          profit: 0, profitGrowth: 0,
          activeProjects: 0, activeProjectsGrowth: 0,
          customerRetention: 0, retentionGrowth: 0
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <p>Generating strategic report...</p>
      </div>
    );
  }
  const kpis = [
    { 
      label: 'Total Revenue', 
      value: formatCurrency(stats.revenue), 
      trend: `${stats.revenueGrowth > 0 ? '+' : ''}${stats.revenueGrowth}%`, 
      trendType: stats.revenueGrowth >= 0 ? 'up' : 'down' 
    },
    { 
      label: 'Net Profit', 
      value: formatCurrency(stats.profit), 
      trend: `${stats.profitGrowth > 0 ? '+' : ''}${stats.profitGrowth}%`, 
      trendType: stats.profitGrowth >= 0 ? 'up' : 'down' 
    },
    { 
      label: 'Active Orders', 
      value: formatNumber(stats.activeProjects), 
      trend: `${stats.activeProjectsGrowth > 0 ? '+' : ''}${stats.activeProjectsGrowth}%`, 
      trendType: stats.activeProjectsGrowth >= 0 ? 'up' : 'down' 
    },
    { 
      label: 'Customer Satisfaction', 
      value: formatPercentage(stats.customerRetention), 
      trend: `${stats.retentionGrowth > 0 ? '+' : ''}${stats.retentionGrowth}%`, 
      trendType: stats.retentionGrowth >= 0 ? 'up' : 'down' 
    },
  ];
  return (
    <div className={styles.homeContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Executive Overview</h1>
        <p className={styles.pageSubtitle}>Strategic performance and growth metrics</p>
      </div>
      <div className={styles.kpiGrid}>
        {kpis.map((kpi) => (
          <div key={kpi.label} className={styles.kpiCard}>
            <div className={styles.kpiLabel}>{kpi.label}</div>
            <div className={styles.kpiValue}>{kpi.value}</div>
            <div className={`${styles.kpiTrend} ${kpi.trendType === 'up' ? styles.trendUp : styles.trendDown}`}>
              <span>{kpi.trendType === 'up' ? '↑' : '↓'}</span>
              {kpi.trend} vs last month
            </div>
          </div>
        ))}
      </div>
      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Revenue vs Expenses</h2>
          <div className={styles.mockChartContainer}>
            <div className={styles.barGroup}>
              <div className={`${styles.bar} ${styles.barRevenue}`} style={{ height: '80%' }}></div>
              <div className={`${styles.bar} ${styles.barExpense}`} style={{ height: '45%' }}></div>
            </div>
            <div className={styles.barGroup}>
              <div className={`${styles.bar} ${styles.barRevenue}`} style={{ height: '90%' }}></div>
              <div className={`${styles.bar} ${styles.barExpense}`} style={{ height: '55%' }}></div>
            </div>
          </div>
        </div>
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Business Sector Performance</h2>
          <div className={styles.pieChartContainer}>
             <div className={styles.pieChart}></div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CEOHome;
