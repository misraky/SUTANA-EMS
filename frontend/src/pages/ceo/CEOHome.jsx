import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip as ChartTooltip, Legend, ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { Link } from 'react-router-dom';
import ceoService from '../../services/ceoService';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/formatters';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, Line
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import styles from './CEOHome.module.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, Legend, ArcElement);

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#6B7280'];
const PERIODS = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'quarter', label: 'This Quarter' },
  { id: 'year', label: 'This Year' }
];

const CEOHome = () => {
  const [period, setPeriod] = useState('month');
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
  const [breakdown, setBreakdown] = useState([]);
  const [cashFlow, setCashFlow] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async (currentPeriod) => {
    try {
      // We can parallelize the requests for better performance
      const [overviewRes, breakdownRes, cfRes] = await Promise.all([
        ceoService.getDashboardOverview(), // we can still use this for KPIs as it returns current overview
        ceoService.getRevenueBreakdown(currentPeriod),
        ceoService.getCashFlow(currentPeriod === 'today' ? 'daily' : currentPeriod === 'week' ? 'daily' : 'monthly', 30)
      ]);

      const data = overviewRes.data || {};
      
      // Override revenue/profit KPIs with the selected period data if possible,
      // but overview currently hardcodes some periods. Ideally we'd call the period specific endpoints for the KPIs too.
      // Let's use the breakdown response for total revenue of the period.
      const bdData = breakdownRes.data || {};
      
      setStats({
        revenue: bdData.totalRevenue || 0,
        revenueGrowth: data.revenueGrowth || 0, // Fallback to overview
        profit: data.profit?.netProfit || 0, // Fallback to overview
        profitGrowth: data.profitGrowth || 0,
        activeProjects: data.kpis?.salesTarget?.actual || 0,
        activeProjectsGrowth: data.ordersGrowth || 0,
        customerRetention: data.kpis?.customerSatisfaction?.actual || 0,
        retentionGrowth: data.satisfactionGrowth || 0
      });

      if (bdData.breakdown) {
        setBreakdown(bdData.breakdown.filter(s => s.hasData && s.revenue > 0));
      }

      if (cfRes.data) {
        setCashFlow(cfRes.data);
      }

      if (data.alerts) {
        setAlerts(data.alerts);
      }

    } catch (error) {
      console.error('CEO: Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData(period);

    // 5-minute polling
    const intervalId = setInterval(() => {
      fetchData(period);
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [period]);

  const handleDismissAlert = async (alertId) => {
    try {
      await ceoService.dismissAlert(alertId);
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
    }
  };

  if (loading && !stats) {
    return (
      <div className={styles.loadingContainer}>
        <p>Generating strategic report...</p>
      </div>
    );
  }

  const kpis = [
    { 
      label: 'Total Revenue', 
      value: formatCurrency(stats?.revenue || 0), 
      trend: `${stats?.revenueGrowth > 0 ? '+' : ''}${stats?.revenueGrowth}%`, 
      trendType: stats?.revenueGrowth > 0 ? 'up' : stats?.revenueGrowth < 0 ? 'down' : 'neutral' 
    },
    { 
      label: 'Net Profit', 
      value: formatCurrency(stats?.profit || 0),
      isLoss: stats?.profit < 0,
      trend: `${stats?.profitGrowth > 0 ? '+' : ''}${stats?.profitGrowth}%`, 
      trendType: stats?.profitGrowth > 0 ? 'up' : stats?.profitGrowth < 0 ? 'down' : 'neutral' 
    },
    { 
      label: 'Daily Sales Actual', 
      value: formatCurrency(stats?.activeProjects || 0), 
      trend: '', 
      trendType: 'neutral' 
    },
    { 
      label: 'Customer Satisfaction', 
      value: formatPercentage(stats?.customerRetention || 0), 
      trend: `${stats?.retentionGrowth > 0 ? '+' : ''}${stats?.retentionGrowth}%`, 
      trendType: stats?.retentionGrowth > 0 ? 'up' : stats?.retentionGrowth < 0 ? 'down' : 'neutral' 
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
  // Prepare chart data for recharts
  const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
  
  const cfData = cashFlow?.inflow?.map((inf, idx) => {
    const outf = cashFlow.outflow[idx]?.amount || 0;
    return {
      period: inf.period,
      Inflow: parseFloat(inf.amount),
      Outflow: parseFloat(outf),
      Net: parseFloat(inf.amount) - parseFloat(outf)
    };
  }) || [];

  return (
    <div className={styles.homeContainer}>
      <div className={styles.headerActions}>
        <div>
          <h1 className={styles.pageTitle}>Executive Overview</h1>
          <p className={styles.pageSubtitle}>Strategic performance and growth metrics</p>
        </div>
        <div className={styles.periodSelector}>
          {PERIODS.map(p => (
            <button
              key={p.id}
              className={`${styles.periodBtn} ${period === p.id ? styles.active : ''}`}
              onClick={() => setPeriod(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      

      <div className={styles.kpiGrid}>
        {kpis.map((kpi, idx) => (
          <div key={idx} className={styles.kpiCard}>
            <div className={styles.kpiLabel}>{kpi.label}</div>
            <div className={`${styles.kpiValue} ${kpi.isLoss ? styles.loss : ''}`}>
              {kpi.value}
              {kpi.isLoss && <span className={styles.lossLabel}>(Loss)</span>}
            </div>
            {kpi.trend && (
              <div className={`${styles.kpiTrend} ${
                kpi.trendType === 'up' ? styles.trendUp : 
                kpi.trendType === 'down' ? styles.trendDown : styles.trendNeutral
              }`}>
                <span>{kpi.trendType === 'up' ? '↑' : kpi.trendType === 'down' ? '↓' : '→'}</span>
                {kpi.trend}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Revenue vs Expenses</h2>
          <div className={styles.chartContainer} style={{ height: '300px', width: '100%', marginTop: '20px' }}>
            <Bar data={barData} options={barOptions} />
      <div className={styles.mainGrid}>
        <div className={styles.chartsGrid}>
          
          <div className={styles.cashFlowCard}>
            <h2 className={styles.chartTitle}>Cash Flow</h2>
            {cashFlow && cashFlow.summary && (
              <div className={styles.cashFlowMetrics}>
                <div className={styles.cfMetric}>
                  <span className={styles.cfLabel}>Total Inflow</span>
                  <span className={`${styles.cfValue} ${styles.in}`}>{formatCurrency(cashFlow.summary.totalInflow)}</span>
                </div>
                <div className={styles.cfMetric}>
                  <span className={styles.cfLabel}>Total Outflow</span>
                  <span className={`${styles.cfValue} ${styles.out}`}>{formatCurrency(cashFlow.summary.totalOutflow)}</span>
                </div>
                <div className={styles.cfMetric}>
                  <span className={styles.cfLabel}>Net Flow</span>
                  <span className={`${styles.cfValue} ${styles.net} ${cashFlow.summary.netFlow >= 0 ? styles.positive : styles.negative}`}>
                    {formatCurrency(cashFlow.summary.netFlow)}
                  </span>
                </div>
              </div>
            )}
            
            <div className={styles.chartWrapper}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={cfData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="period" fontSize={12} tickMargin={10} />
                  <YAxis fontSize={12} tickFormatter={(val) => `${val / 1000}k`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="Inflow" fill="#10b981" barSize={20} />
                  <Bar dataKey="Outflow" fill="#ef4444" barSize={20} />
                  <Line type="monotone" dataKey="Net" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
        
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Business Sector Performance</h2>
          <div className={styles.chartContainer} style={{ height: '300px', width: '100%', marginTop: '20px' }}>
            <Pie data={pieDataObj} options={pieOptions} />

        <div className={styles.sidePanel}>
          
          <div className={styles.chartCard}>
            <h2 className={styles.chartTitle}>Sector Performance</h2>
            <div className={styles.chartWrapper} style={{ height: '250px' }}>
              {breakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={breakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="revenue"
                      nameKey="sector"
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {breakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{display:'flex', height:'100%', alignItems:'center', justifyContent:'center', color:'#64748b'}}>
                  No sector data available for this period.
                </div>
              )}
            </div>
          </div>

          <div className={styles.alertsCard}>
            <div className={styles.alertsHeader}>
              <h2 className={styles.alertsTitle}>Critical Alerts</h2>
              {alerts.length > 0 && (
                <span className={styles.alertsBadge}>{alerts.length}</span>
              )}
            </div>
            
            <div className={styles.alertsList}>
              {alerts.length === 0 ? (
                <div className={styles.noAlerts}>All clear. No critical issues requiring attention.</div>
              ) : (
                alerts.map(alert => (
                  <div key={alert.id} className={`${styles.alertItem} ${styles[alert.severity] || styles.info}`}>
                    <div className={styles.alertHeader}>
                      <span className={styles.alertTitle}>{alert.title}</span>
                      <span className={styles.alertTime}>
                        {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <div className={styles.alertMessage}>{alert.message}</div>
                    <div className={styles.alertActions}>
                      {alert.actionUrl && (
                        <Link to={alert.actionUrl} className={styles.alertActionLink}>
                          {alert.actionText}
                        </Link>
                      )}
                      <button 
                        className={styles.alertDismiss}
                        onClick={() => handleDismissAlert(alert.id)}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CEOHome;
