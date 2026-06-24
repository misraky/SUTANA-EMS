import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, Line, AreaChart, Area
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import ceoService from '../../services/ceoService';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/formatters';
import styles from './CEOHome.module.css';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#6B7280'];
const PERIODS = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'quarter', label: 'This Quarter' },
  { id: 'year', label: 'This Year' }
];

const mockOverview = () => ({
  revenue: 2450000, revenueGrowth: 12.5, revenuePrevGrowth: -3.2, revenueTarget: 3000000,
  revenueSparkline: Array.from({length: 8}, (_, i) => 1800000 + Math.sin(i * 0.6) * 200000 + i * 80000),
  profit: 490000, profitGrowth: 8.3, profitPrevGrowth: 2.1, profitTarget: 600000,
  profitSparkline: Array.from({length: 8}, (_, i) => 350000 + Math.sin(i * 0.5) * 50000 + i * 20000),
  dailySalesActual: 82000, dailySalesTarget: 100000,
  customerSatisfaction: 87.5, satisfactionTarget: 90, satisfactionTrend: 2.1,
  cashPosition: 1850000, cashForecast: 'positive', cashPositionChange: 3.2,
  inventoryTurnover: 6.2, inventoryTarget: 8.0, inventoryTrend: -0.8,
});

const mockRevExpenses = () =>
  ['Jan','Feb','Mar','Apr','May','Jun'].map((m, i) => ({
    month: m, revenue: 350000 + Math.sin(i * 0.7) * 50000 + i * 25000,
    expenses: 280000 + Math.cos(i * 0.5) * 40000 + i * 15000,
    target: 400000 + i * 20000,
  }));

const mockCashFlow = () => ({
  summary: { totalInflow: 1250000, totalOutflow: 980000, netFlow: 270000 },
  periods: Array.from({length: 13}, (_, i) => ({
    period: `W${i + 1}`, Inflow: 90000 + Math.sin(i * 0.8) * 15000 + i * 2000,
    Outflow: 75000 + Math.cos(i * 0.6) * 12000 + i * 1500,
    Net: 15000 + Math.sin(i * 0.4) * 8000 + i * 500,
  })),
});

const mockProjection = () =>
  Array.from({length: 13}, (_, i) => ({
    period: `W${i + 1}`,
    projected: 1850000 + i * 25000 + Math.sin(i * 0.5) * 50000,
    upperBound: 1850000 + i * 35000 + Math.sin(i * 0.5) * 50000 + 80000,
    lowerBound: 1850000 + i * 15000 + Math.sin(i * 0.5) * 50000 - 80000,
  }));

const mockSectors = () => [
  { sector: 'Printing', revenue: 820000, color: '#3B82F6' },
  { sector: 'Sales', revenue: 650000, color: '#10B981' },
  { sector: 'Design', revenue: 430000, color: '#F59E0B' },
  { sector: 'Consulting', revenue: 320000, color: '#8B5CF6' },
  { sector: 'Logistics', revenue: 230000, color: '#EF4444' },
];

const mockAlerts = () => [
  { id: 1, title: 'Revenue Target at Risk', message: 'Q2 revenue is 15% behind target. Immediate action needed to close pipeline deals.', severity: 'critical', createdAt: new Date(Date.now() - 3600000).toISOString(), actionUrl: '/ceo/reports', actionText: 'View Report' },
  { id: 2, title: 'Cash Flow Warning', message: 'Operating cash flow projected to dip below minimum threshold next month.', severity: 'warning', createdAt: new Date(Date.now() - 7200000).toISOString(), actionUrl: '/ceo/cash-flow', actionText: 'Review' },
  { id: 3, title: 'Inventory Stock Alert', message: '3 key SKUs are below reorder point. Production delay risk.', severity: 'info', createdAt: new Date(Date.now() - 14400000).toISOString(), actionUrl: '/inventory', actionText: 'Check Inventory' },
];

const mockKpiHistory = () =>
  Array.from({length: 12}, (_, i) => ({ period: `M${i + 1}`, value: 200000 + Math.sin(i * 0.8) * 40000 + i * 15000 }));

const TrendArrow = ({ type }) => {
  if (type === 'up') return <span className={styles.trendArrowUp}>&#8593;</span>;
  if (type === 'down') return <span className={styles.trendArrowDown}>&#8595;</span>;
  return <span className={styles.trendArrowNeutral}>&#8594;</span>;
};

const KpiDrilldownModal = ({ kpi, onClose }) => {
  if (!kpi) return null;
  const history = kpi.history || mockKpiHistory();
  const status = kpi.status || (kpi.current >= kpi.target ? 'on_track' : kpi.current >= kpi.target * 0.85 ? 'at_risk' : 'behind');
  const statusLabel = status === 'on_track' ? 'On Track' : status === 'at_risk' ? 'At Risk' : 'Behind';
  const statusColor = status === 'on_track' ? '#10B981' : status === 'at_risk' ? '#F59E0B' : '#EF4444';

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose}>&#10005;</button>
        <h2 className={styles.modalTitle}>{kpi.label}</h2>
        <div className={styles.modalBody}>
          <div className={styles.modalComparison}>
            <div className={styles.modalStat}>
              <span className={styles.modalStatLabel}>Current</span>
              <span className={styles.modalStatValue}>{kpi.currentFormatted || formatCurrency(kpi.current || 0)}</span>
            </div>
            <div className={styles.modalStat}>
              <span className={styles.modalStatLabel}>Target</span>
              <span className={styles.modalStatValue}>{kpi.targetFormatted || formatCurrency(kpi.target || 0)}</span>
            </div>
            <div className={styles.modalStat}>
              <span className={styles.modalStatLabel}>Previous</span>
              <span className={styles.modalStatValue}>{kpi.previousFormatted || formatCurrency(kpi.previous || 0)}</span>
            </div>
          </div>
          <div className={styles.modalStatus} style={{ color: statusColor }}>
            <span className={styles.modalStatusDot} style={{ background: statusColor }} />
            {statusLabel}
          </div>
          <div className={styles.modalChart}>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={history}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="period" fontSize={11} />
                <Tooltip formatter={v => formatCurrency(v)} />
                <Area type="monotone" dataKey="value" stroke="#3B82F6" fill="rgba(59,130,246,0.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className={styles.modalActions}>
            <h4 className={styles.modalActionsTitle}>Suggested Actions</h4>
            <ul className={styles.modalActionsList}>
              {kpi.suggestions && kpi.suggestions.length > 0 ? kpi.suggestions.map((s, i) => (
                <li key={i} className={styles.modalActionItem}>{s}</li>
              )) : (
                <>
                  <li className={styles.modalActionItem}>Review current strategy and adjust targets if needed</li>
                  <li className={styles.modalActionItem}>Analyze contributing factors and identify improvement areas</li>
                  <li className={styles.modalActionItem}>Schedule review meeting with department heads</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const SectorDrilldownModal = ({ sector, onClose }) => {
  if (!sector) return null;
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose}>&#10005;</button>
        <h2 className={styles.modalTitle}>{sector.sector} Sector Details</h2>
        <div className={styles.modalBody}>
          <div className={styles.sectorKpiGrid}>
            <div className={styles.sectorKpiCard}>
              <span className={styles.sectorKpiLabel}>Revenue</span>
              <span className={styles.sectorKpiValue}>{formatCurrency(sector.revenue)}</span>
              <span className={styles.sectorKpiDelta}>+12.5%</span>
            </div>
            <div className={styles.sectorKpiCard}>
              <span className={styles.sectorKpiLabel}>Profit</span>
              <span className={styles.sectorKpiValue}>{formatCurrency(sector.revenue * 0.2)}</span>
              <span className={styles.sectorKpiDelta}>+8.3%</span>
            </div>
            <div className={styles.sectorKpiCard}>
              <span className={styles.sectorKpiLabel}>Margin</span>
              <span className={styles.sectorKpiValue}>20.0%</span>
              <span className={styles.sectorKpiDelta}>+2.1%</span>
            </div>
            <div className={styles.sectorKpiCard}>
              <span className={styles.sectorKpiLabel}>Growth</span>
              <span className={styles.sectorKpiValue}>+15.2%</span>
              <span className={styles.sectorKpiDelta}>YoY</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CEOHome = () => {
  const [period, setPeriod] = useState('month');
  const [overview, setOverview] = useState(null);
  const [revExpenses, setRevExpenses] = useState([]);
  const [cfData, setCfData] = useState({ summary: { totalInflow: 0, totalOutflow: 0, netFlow: 0 }, periods: [] });
  const [cfProjection, setCfProjection] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [drilldownKpi, setDrilldownKpi] = useState(null);
  const [drilldownSector, setDrilldownSector] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setWsConnected(true), 800);
    return () => clearTimeout(t);
  }, []);

  const fetchAll = useCallback(async (currentPeriod) => {
    setLoading(true);
    setError(null);

    const safeFetch = async (fn, mockFn) => {
      try {
        if (typeof fn === 'function') {
          const res = await fn();
          if (res && res.data && res.data.status === 'success' && res.data.data) {
            return res.data.data;
          }
          if (res && res.data) return res.data;
          return res || {};
        }
        return mockFn();
      } catch {
        return mockFn();
      }
    };

    const rawOv = await safeFetch(() => ceoService.getDashboardOverview(), mockOverview);
    const revExpRaw = await safeFetch(() => ceoService.getRevenueBreakdown(currentPeriod), () => ({
      breakdown: mockSectors(),
      revenueVsExpenses: mockRevExpenses(),
      totalRevenue: 2450000,
    }));
    const cf = await safeFetch(() => ceoService.getCashFlow(
      currentPeriod === 'today' || currentPeriod === 'week' ? 'daily' : 'monthly', 30
    ), mockCashFlow);
    const al = await safeFetch(() => ceoService.getCriticalAlerts(), mockAlerts);
    const proj = await safeFetch(
      typeof ceoService.getCashFlowProjection === 'function'
        ? () => ceoService.getCashFlowProjection(3)
        : null,
      mockProjection
    );

    const overview = {
      revenue: rawOv.totalRevenue ?? rawOv.summary?.totalRevenue ?? mockOverview().revenue,
      revenueGrowth: rawOv.revenueGrowth ?? mockOverview().revenueGrowth,
      revenuePrevGrowth: rawOv.revenuePrevGrowth ?? mockOverview().revenuePrevGrowth,
      revenueTarget: rawOv.revenueTarget ?? rawOv.summary?.revenueTarget ?? mockOverview().revenueTarget,
      revenueSparkline: rawOv.revenueSparkline ?? mockOverview().revenueSparkline,
      profit: rawOv.netProfit ?? rawOv.profit?.netProfit ?? rawOv.summary?.netProfit ?? mockOverview().profit,
      profitGrowth: rawOv.profitGrowth ?? mockOverview().profitGrowth,
      profitPrevGrowth: rawOv.profitPrevGrowth ?? mockOverview().profitPrevGrowth,
      profitTarget: rawOv.profitTarget ?? mockOverview().profitTarget,
      profitSparkline: rawOv.profitSparkline ?? mockOverview().profitSparkline,
      dailySalesActual: rawOv.kpis?.salesTarget?.actual ?? rawOv.dailySalesActual ?? mockOverview().dailySalesActual,
      dailySalesTarget: rawOv.kpis?.salesTarget?.target ?? rawOv.dailySalesTarget ?? mockOverview().dailySalesTarget,
      customerSatisfaction: rawOv.kpis?.customerSatisfaction?.actual ?? rawOv.customerSatisfaction ?? mockOverview().customerSatisfaction,
      satisfactionTarget: rawOv.kpis?.customerSatisfaction?.target ?? rawOv.satisfactionTarget ?? mockOverview().satisfactionTarget,
      satisfactionTrend: rawOv.satisfactionTrend ?? mockOverview().satisfactionTrend,
      cashPosition: rawOv.cashFlow?.netFlow ?? rawOv.cashPosition ?? mockOverview().cashPosition,
      cashForecast: rawOv.cashForecast ?? mockOverview().cashForecast,
      cashPositionChange: rawOv.cashPositionChange ?? mockOverview().cashPositionChange,
      inventoryTurnover: rawOv.kpis?.inventoryTurnover?.actual ?? rawOv.inventoryTurnover ?? mockOverview().inventoryTurnover,
      inventoryTarget: rawOv.kpis?.inventoryTurnover?.target ?? rawOv.inventoryTarget ?? mockOverview().inventoryTarget,
      inventoryTrend: rawOv.inventoryTrend ?? mockOverview().inventoryTrend,
      sectorPerformance: rawOv.sectorPerformance,
    };
    setOverview(overview);
    setRevExpenses(rawOv.revenueVsExpenses || revExpRaw.revenueVsExpenses || revExpRaw || mockRevExpenses());
    setSectors(revExpRaw.breakdown || rawOv.sectorPerformance || mockSectors());
    setAlerts(Array.isArray(al) ? al : al.alerts || mockAlerts());
    setCfData({ summary: cf.summary || { totalInflow: 0, totalOutflow: 0, netFlow: 0 }, periods: cf.periods || cf || mockCashFlow().periods });
    setCfProjection(proj || mockProjection());
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll(period);
    const interval = setInterval(() => fetchAll(period), 300000);
    return () => clearInterval(interval);
  }, [period, fetchAll]);

  const handleDismissAlert = async (alertId) => {
    try {
      if (typeof ceoService.dismissAlert === 'function') {
        await ceoService.dismissAlert(alertId);
      }
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch { /* silent */ }
  };

  const formatDelta = (val) => {
    if (val == null) return '';
    return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
  };

  const getTrendType = (val) => {
    if (val == null) return 'neutral';
    if (val > 0) return 'up';
    if (val < 0) return 'down';
    return 'neutral';
  };

  const kpiCards = overview ? [
    {
      id: 'revenue',
      label: 'Total Revenue',
      value: overview.revenue,
      currentFormatted: formatCurrency(overview.revenue),
      targetFormatted: formatCurrency(overview.revenueTarget),
      previousFormatted: formatCurrency(overview.revenue / (1 + (overview.revenueGrowth || 0) / 100)),
      current: overview.revenue,
      target: overview.revenueTarget,
      previous: overview.revenue / (1 + (overview.revenueGrowth || 0) / 100),
      delta: formatDelta(overview.revenueGrowth),
      trend: getTrendType(overview.revenueGrowth),
      sparkline: overview.revenueSparkline,
      history: mockKpiHistory(),
      status: overview.revenue >= overview.revenueTarget ? 'on_track' : overview.revenue >= overview.revenueTarget * 0.85 ? 'at_risk' : 'behind',
      suggestions: ['Increase sales team capacity by 15%', 'Launch Q3 marketing campaign early', 'Review pricing strategy for top products'],
    },
    {
      id: 'profit',
      label: 'Net Profit',
      value: overview.profit,
      currentFormatted: formatCurrency(overview.profit),
      targetFormatted: formatCurrency(overview.profitTarget),
      previousFormatted: formatCurrency(overview.profit / (1 + (overview.profitGrowth || 0) / 100)),
      current: overview.profit,
      target: overview.profitTarget,
      previous: overview.profit / (1 + (overview.profitGrowth || 0) / 100),
      delta: formatDelta(overview.profitGrowth),
      trend: getTrendType(overview.profitGrowth),
      sparkline: overview.profitSparkline,
      history: mockKpiHistory(),
      isLoss: overview.profit < 0,
      status: overview.profit >= overview.profitTarget ? 'on_track' : overview.profit >= overview.profitTarget * 0.85 ? 'at_risk' : 'behind',
      suggestions: ['Reduce operational costs by 8%', 'Optimize supply chain for better margins', 'Focus on high-margin product lines'],
    },
    {
      id: 'sales',
      label: 'Daily Sales Actual',
      value: overview.dailySalesActual,
      currentFormatted: formatCurrency(overview.dailySalesActual),
      targetFormatted: formatCurrency(overview.dailySalesTarget),
      current: overview.dailySalesActual,
      target: overview.dailySalesTarget,
      progress: Math.min(overview.dailySalesActual / overview.dailySalesTarget * 100, 100),
      status: overview.dailySalesActual >= overview.dailySalesTarget ? 'on_track' : overview.dailySalesActual >= overview.dailySalesTarget * 0.85 ? 'at_risk' : 'behind',
      suggestions: ['Increase daily outreach by 20%', 'Implement sales incentive program', 'Shorten sales cycle with automation'],
    },
    {
      id: 'satisfaction',
      label: 'Customer Satisfaction',
      value: overview.customerSatisfaction,
      currentFormatted: formatPercentage(overview.customerSatisfaction),
      targetFormatted: formatPercentage(overview.satisfactionTarget),
      current: overview.customerSatisfaction,
      target: overview.satisfactionTarget,
      delta: formatDelta(overview.satisfactionTrend),
      trend: getTrendType(overview.satisfactionTrend),
      isPercentage: true,
      status: overview.customerSatisfaction >= overview.satisfactionTarget ? 'on_track' : overview.customerSatisfaction >= overview.satisfactionTarget * 0.85 ? 'at_risk' : 'behind',
      suggestions: ['Improve response time by 30%', 'Enhance product quality control', 'Launch customer feedback program'],
    },
    {
      id: 'cash',
      label: 'Cash Position',
      value: overview.cashPosition,
      currentFormatted: formatCurrency(overview.cashPosition),
      delta: formatDelta(overview.cashPositionChange),
      trend: getTrendType(overview.cashPositionChange),
      forecastStatus: overview.cashForecast,
      suggestions: ['Review accounts receivable aging', 'Optimize payment terms with suppliers', 'Consider short-term investment options'],
    },
    {
      id: 'inventory',
      label: 'Inventory Turnover',
      value: overview.inventoryTurnover,
      currentFormatted: `${overview.inventoryTurnover.toFixed(1)}x`,
      targetFormatted: `${overview.inventoryTarget.toFixed(1)}x`,
      current: overview.inventoryTurnover,
      target: overview.inventoryTarget,
      delta: formatDelta(overview.inventoryTrend),
      trend: getTrendType(overview.inventoryTrend),
      status: overview.inventoryTurnover >= overview.inventoryTarget ? 'on_track' : 'behind',
      suggestions: ['Implement just-in-time inventory', 'Identify slow-moving stock', 'Negotiate better supplier terms'],
    },
  ] : [];

  const renderSparkline = (data) => {
    if (!data || data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const w = 80, h = 24;
    const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
    return (
      <svg width={w} height={h} className={styles.sparkline}>
        <polyline points={points} fill="none" stroke="#3B82F6" strokeWidth="1.5" />
      </svg>
    );
  };

  if (loading && !overview) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.skeletonGrid}>
          {Array.from({length: 6}, (_, i) => (
            <div key={i} className={styles.skeletonCard}>
              <div className={styles.skeletonLine} style={{width: '60%'}} />
              <div className={styles.skeletonLine} style={{width: '80%', height: '2rem'}} />
              <div className={styles.skeletonLine} style={{width: '40%'}} />
            </div>
          ))}
        </div>
        <p className={styles.loadingText}>Generating strategic report...</p>
      </div>
    );
  }

  const revExpChartData = Array.isArray(revExpenses) && revExpenses.length > 0
    ? revExpenses
    : mockRevExpenses();

  const cfPeriods = cfData.periods && cfData.periods.length > 0 ? cfData.periods : [];
  const projectionData = cfProjection.length > 0 ? cfProjection : mockProjection();

  return (
    <div className={styles.homeContainer}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.pageTitle}>Executive Overview</h1>
          <p className={styles.pageSubtitle}>Strategic performance and growth metrics</p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.realtimeIndicator}>
            <span className={`${styles.wsDot} ${wsConnected ? styles.wsConnected : styles.wsDisconnected}`} />
            <span className={styles.wsLabel}>{wsConnected ? 'Connected' : 'Connecting...'}</span>
            {lastUpdated && (
              <span className={styles.lastUpdated}>
                Last updated: {Math.floor((new Date() - lastUpdated) / 60000)} min ago
              </span>
            )}
            <button className={styles.refreshBtn} onClick={() => fetchAll(period)} disabled={loading}>
              &#8635; Refresh
            </button>
          </div>
          <div className={styles.periodSelector}>
            {PERIODS.map(p => (
              <button
                key={p.id}
                className={`${styles.periodBtn} ${period === p.id ? styles.periodBtnActive : ''}`}
                onClick={() => setPeriod(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <span>{error}</span>
          <button className={styles.retryBtn} onClick={() => fetchAll(period)}>Retry</button>
        </div>
      )}

      <div className={styles.kpiGrid}>
        {kpiCards.map((kpi, idx) => (
          <div key={kpi.id || idx} className={styles.kpiCard} onClick={() => setDrilldownKpi(kpi)}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiLabel}>{kpi.label}</span>
              {renderSparkline(kpi.sparkline)}
            </div>
            <div className={`${styles.kpiValue} ${kpi.isLoss ? styles.kpiLoss : ''}`}>
              {kpi.currentFormatted || formatCurrency(kpi.value || 0)}
            </div>
            <div className={styles.kpiMeta}>
              {kpi.delta && (
                <span className={`${styles.kpiDelta} ${styles[`kpiDelta${kpi.trend === 'up' ? 'Up' : kpi.trend === 'down' ? 'Down' : 'Neutral'}`]}`}>
                  <TrendArrow type={kpi.trend} />
                  {kpi.delta}
                </span>
              )}
              {kpi.target && (
                <span className={styles.kpiTarget}>target: {kpi.targetFormatted || formatCurrency(kpi.target)}</span>
              )}
            </div>
            {kpi.progress !== undefined && (
              <div className={styles.progressBar}>
                <div
                  className={`${styles.progressFill} ${kpi.progress >= 100 ? styles.progressComplete : kpi.progress >= 85 ? styles.progressWarn : styles.progressLow}`}
                  style={{ width: `${Math.min(kpi.progress, 100)}%` }}
                />
              </div>
            )}
            {kpi.forecastStatus && (
              <span className={`${styles.forecastBadge} ${kpi.forecastStatus === 'positive' ? styles.forecastPositive : styles.forecastNegative}`}>
                {kpi.forecastStatus === 'positive' ? '&#9650; Positive' : '&#9660; Negative'} Forecast
              </span>
            )}
          </div>
        ))}
      </div>

      <div className={styles.sectionGrid}>
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Revenue vs Expenses</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revExpChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" fontSize={12} tickMargin={10} />
              <YAxis fontSize={12} tickFormatter={v => `${v / 1000}k`} />
              <Tooltip formatter={v => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#EF4444" name="Expenses" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="target" stroke="#F59E0B" strokeWidth={2} strokeDasharray="6 4" name="Target" dot={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.cashFlowSection}>
          <h2 className={styles.chartTitle}>Cash Flow</h2>
          <div className={styles.cfSummary}>
            <div className={styles.cfSummaryCard}>
              <span className={styles.cfSummaryLabel}>Inflow</span>
              <span className={styles.cfSummaryValue}>{formatCurrency(cfData.summary.totalInflow)}</span>
            </div>
            <div className={styles.cfSummaryCard}>
              <span className={styles.cfSummaryLabel}>Outflow</span>
              <span className={styles.cfSummaryValue}>{formatCurrency(cfData.summary.totalOutflow)}</span>
            </div>
            <div className={styles.cfSummaryCard}>
              <span className={styles.cfSummaryLabel}>Net Flow</span>
              <span className={`${styles.cfSummaryValue} ${cfData.summary.netFlow >= 0 ? styles.cfPositive : styles.cfNegative}`}>
                {formatCurrency(cfData.summary.netFlow)}
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={cfPeriods}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="period" fontSize={11} tickMargin={8} />
              <YAxis fontSize={11} tickFormatter={v => `${v / 1000}k`} />
              <Tooltip formatter={v => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="Inflow" fill="#10B981" name="Inflow" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Outflow" fill="#EF4444" name="Outflow" radius={[3, 3, 0, 0]} />
              <Line type="monotone" dataKey="Net" stroke="#3B82F6" strokeWidth={2} name="Net" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
          <h3 className={styles.subTitle}>13-Week Projection Forecast</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="period" fontSize={11} tickMargin={8} />
              <YAxis fontSize={11} tickFormatter={v => `${v / 1000}k`} />
              <Tooltip formatter={v => formatCurrency(v)} />
              <Legend />
              <Area type="monotone" dataKey="upperBound" fill="#3B82F6" stroke="none" fillOpacity={0.1} name="Upper Bound" />
              <Area type="monotone" dataKey="lowerBound" fill="#3B82F6" stroke="none" fillOpacity={0.05} name="Lower Bound" />
              <Line type="monotone" dataKey="projected" stroke="#3B82F6" strokeWidth={2} name="Projected Balance" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.bottomGrid}>
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Sector Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sectors.filter(s => s.revenue > 0)}
                cx="50%" cy="50%"
                innerRadius={70} outerRadius={100}
                paddingAngle={4}
                dataKey="revenue"
                nameKey="sector"
                cursor="pointer"
                onClick={(entry) => setDrilldownSector(entry)}
              >
                {sectors.filter(s => s.revenue > 0).map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.color || COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={v => formatCurrency(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.alertsHeader}>
            <h2 className={styles.chartTitle}>Critical Alerts</h2>
            {alerts.length > 0 && <span className={styles.alertsBadge}>{alerts.length}</span>}
          </div>
          <div className={styles.alertsList}>
            {alerts.length === 0 ? (
              <div className={styles.noAlerts}>All clear.</div>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} className={`${styles.alertItem} ${styles[`alert${alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}`] || styles.alertInfo}`}>
                  <div className={styles.alertHeader}>
                    <span className={styles.alertTitle}>{alert.title}</span>
                    <span className={styles.alertTime}>{formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}</span>
                  </div>
                  <div className={styles.alertMessage}>{alert.message}</div>
                  <div className={styles.alertActions}>
                    {alert.actionUrl && (
                      <a href={alert.actionUrl} className={styles.alertActionLink}>{alert.actionText || 'View'}</a>
                    )}
                    <button className={styles.alertDismiss} onClick={() => handleDismissAlert(alert.id)}>Dismiss</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <KpiDrilldownModal kpi={drilldownKpi} onClose={() => setDrilldownKpi(null)} />
      <SectorDrilldownModal sector={drilldownSector} onClose={() => setDrilldownSector(null)} />
    </div>
  );
};

export default CEOHome;
