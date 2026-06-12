import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip as ChartTooltip, Legend, ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import ceoService from '../../services/ceoService';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/formatters';
import styles from './CEOHome.module.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, Legend, ArcElement);

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#6B7280'];

const CEOHome = () => {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState({ revenueVsExpenses: [], sectorPerformance: [] });
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
        
        setChartData({
          revenueVsExpenses: data.revenueVsExpenses || [],
          sectorPerformance: data.sectorPerformance || []
        });
      } catch (error) {
        console.error('CEO: Failed to fetch executive stats:', error);
        setStats({
          revenue: 0, revenueGrowth: 0,
          profit: 0, profitGrowth: 0,
          activeProjects: 0, activeProjectsGrowth: 0,
          customerRetention: 0, retentionGrowth: 0
        });
        setChartData({ revenueVsExpenses: [], sectorPerformance: [] });
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

  const barData = {
    labels: chartData.revenueVsExpenses.map(item => item.month),
    datasets: [
      {
        label: 'Revenue',
        data: chartData.revenueVsExpenses.map(item => item.revenue),
        backgroundColor: '#3B82F6',
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      },
      {
        label: 'Expenses',
        data: chartData.revenueVsExpenses.map(item => item.expenses),
        backgroundColor: '#EF4444',
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      }
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { usePointStyle: true, boxWidth: 8, padding: 20 }
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${formatCurrency(context.raw)}`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false }
      },
      y: {
        grid: { color: '#E5E7EB', drawBorder: false },
        ticks: {
          callback: (value) => `$${value >= 1000 ? (value/1000) + 'k' : value}`
        }
      }
    }
  };

  const pieDataObj = {
    labels: chartData.sectorPerformance.filter(s => s.value > 0).map(item => item.sector),
    datasets: [
      {
        data: chartData.sectorPerformance.filter(s => s.value > 0).map(item => item.value),
        backgroundColor: chartData.sectorPerformance.filter(s => s.value > 0).map((item, index) => item.color || COLORS[index % COLORS.length]),
        borderWidth: 0,
      }
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'right',
        labels: { usePointStyle: true, boxWidth: 10, padding: 20 }
      },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.label}: ${formatCurrency(context.raw)}`
        }
      }
    }
  };

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
          <div className={styles.chartContainer} style={{ height: '300px', width: '100%', marginTop: '20px' }}>
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
        
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Business Sector Performance</h2>
          <div className={styles.chartContainer} style={{ height: '300px', width: '100%', marginTop: '20px' }}>
            <Pie data={pieDataObj} options={pieOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CEOHome;
