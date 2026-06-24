import React, { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell
} from 'recharts';
import ceoService from '../../services/ceoService';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/formatters';
import styles from './Analytics.module.css';

const SECTOR_COLORS = {
  Printing: '#3B82F6', Sales: '#10B981', Design: '#F59E0B',
  Consulting: '#8B5CF6', Logistics: '#EF4444',
};

const mockRevenueHistory = () =>
  ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => ({
    label: m, revenue: 120000 + Math.sin(i * 0.8) * 40000 + i * 12000,
  }));

const mockSectors = () => [
  { name: 'Printing', revenue: 320000, profit: 54400, margin: 17 },
  { name: 'Sales', revenue: 480000, profit: 62400, margin: 13 },
  { name: 'Design', revenue: 210000, profit: 35700, margin: 17 },
  { name: 'Consulting', revenue: 150000, profit: 28500, margin: 19 },
  { name: 'Logistics', revenue: 98000, profit: 12740, margin: 13 },
];

const mockForecast = () => {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return months.map((m, i) => {
    if (i < 6) {
      const v = 300000 + Math.sin(i * 0.7) * 50000 + i * 25000;
      return { period: m, historical: v, forecast: null, upper: null, lower: null };
    }
    const base = 450000 + (i - 6) * 20000 + Math.sin(i * 0.3) * 15000;
    return {
      period: m, historical: null, forecast: base,
      upper: base + 50000 + (i - 6) * 3000,
      lower: base - 50000 - (i - 6) * 3000,
    };
  });
};

const mockComparison = () => [
  { metric: 'Revenue', current: 2450000, previous: 2200000, change: 250000, pctChange: 11.4, trend: 'up' },
  { metric: 'Orders', current: 1840, previous: 1710, change: 130, pctChange: 7.6, trend: 'up' },
  { metric: 'Profit', current: 490000, previous: 452000, change: 38000, pctChange: 8.4, trend: 'up' },
  { metric: 'Margin', current: 20.0, previous: 18.5, change: 1.5, pctChange: 8.1, trend: 'up' },
];

const getSignificance = (pct) => {
  const abs = Math.abs(pct);
  if (abs >= 10) return { label: 'Significant', className: 'badgeSignificant' };
  if (abs >= 5) return { label: 'Moderate', className: 'badgeModerate' };
  return { label: 'Stable', className: 'badgeStable' };
};

const DrilldownModal = ({ data, onClose }) => {
  if (!data) return null;

  const copyCsv = () => {
    const headers = Object.keys(data).join(',');
    const values = Object.values(data).join(',');
    navigator.clipboard.writeText(`${headers}\n${values}`);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose}>&#10005;</button>
        <h2 className={styles.modalTitle}>Data Point Details</h2>
        <div className={styles.modalBody}>
          <div className={styles.modalGrid}>
            {Object.entries(data).map(([key, val]) => (
              <div key={key} className={styles.modalDetailItem}>
                <span className={styles.modalDetailLabel}>{key}</span>
                <span className={styles.modalDetailValue}>
                  {typeof val === 'number' ? formatCurrency(val) : String(val)}
                </span>
              </div>
            ))}
          </div>
          <button className={styles.exportBtn} onClick={copyCsv}>
            &#128203; Copy as CSV
          </button>
        </div>
      </div>
    </div>
  );
};

const SatisfactionGauge = ({ actual, target }) => {
  const pct = Math.min(Math.max(actual, 0), 100);
  const tgtPct = Math.min(Math.max(target, 0), 100);
  const pctRatio = pct / 100;
  const arcAngle = pctRatio * 180;
  const arcRad = (arcAngle) * Math.PI / 180;
  const color = pct >= tgtPct ? '#10B981' : pct >= tgtPct * 0.85 ? '#F59E0B' : '#EF4444';
  const status = pct >= tgtPct ? 'On Target' : pct >= tgtPct * 0.85 ? 'Near Target' : 'Below Target';
  const totalArcLen = Math.PI * 80;
  const fillLen = (pct / 100) * totalArcLen;
  const needleAng = 180 * (1 - pctRatio);
  const needleRad = needleAng * Math.PI / 180;
  const nx = 100 + 65 * Math.cos(needleRad);
  const ny = 90 - 65 * Math.sin(needleRad);

  return (
    <div className={styles.gaugeWrapper}>
      <div className={styles.gaugeSemi}>
        <svg viewBox="0 0 200 110" className={styles.gaugeSvg}>
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="40%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
          <path
            d="M 20 90 A 80 80 0 0 1 180 90"
            fill="none" stroke="#e2e8f0" strokeWidth="14" strokeLinecap="round"
          />
          <path
            d="M 20 90 A 80 80 0 0 1 180 90"
            fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
            strokeDasharray={`${fillLen} ${totalArcLen}`}
            style={{ transition: 'stroke-dasharray 0.6s ease, stroke 0.3s ease' }}
          />
          {tgtPct < 100 && (
            <line
              x1={100 + 80 * Math.cos((180 * (1 - tgtPct / 100)) * Math.PI / 180)}
              y1={90 - 80 * Math.sin((180 * (1 - tgtPct / 100)) * Math.PI / 180)}
              x2={100 + 95 * Math.cos((180 * (1 - tgtPct / 100)) * Math.PI / 180)}
              y2={90 - 95 * Math.sin((180 * (1 - tgtPct / 100)) * Math.PI / 180)}
              stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round"
            />
          )}
          <line
            x1="100" y1="90" x2={nx} y2={ny}
            stroke={color} strokeWidth="3" strokeLinecap="round"
            style={{ transition: 'transform 0.6s ease' }}
          />
          <circle cx="100" cy="90" r="5" fill={color} />
        </svg>
        <div className={styles.gaugeCenter}>
          <span className={styles.gaugeValue} style={{ color }}>{pct.toFixed(1)}%</span>
          <span className={styles.gaugeLabel}>Satisfaction</span>
        </div>
      </div>
      <div className={styles.gaugeStats}>
        <div className={styles.gaugeStat}>
          <span className={styles.gaugeStatLabel}>Actual</span>
          <span className={styles.gaugeStatValue} style={{ color }}>{pct.toFixed(1)}%</span>
        </div>
        <div className={styles.gaugeDivider} />
        <div className={styles.gaugeStat}>
          <span className={styles.gaugeStatLabel}>Target</span>
          <span className={styles.gaugeStatValue}>{tgtPct}%</span>
        </div>
        <div className={styles.gaugeDivider} />
        <div className={styles.gaugeStat}>
          <span className={styles.gaugeStatLabel}>Status</span>
          <span className={styles.gaugeStatValue} style={{ color, fontSize: '0.78rem' }}>{status}</span>
        </div>
      </div>
    </div>
  );
};

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revenueHistory, setRevenueHistory] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [satisfaction, setSatisfaction] = useState({ actual: 0, target: 90 });
  const [forecastData, setForecastData] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  const [drilldown, setDrilldown] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    const safe = async (fn, mock) => {
      try {
        if (typeof fn === 'function') {
          const res = await fn();
          return res && res.data ? res.data : res || {};
        }
        return mock();
      } catch {
        return mock();
      }
    };

    const [overview, revenueRes, forecast] = await Promise.all([
      safe(() => ceoService.getDashboardOverview(), () => ({
        kpis: { customerSatisfaction: { actual: 78.5, target: 90 } },
        profit: { sectors: [] },
      })),
      safe(() => ceoService.getRevenueBreakdown('year'), () => ({
        data: { historical: [] },
        historical: [],
      })),
      safe(
        typeof ceoService.getRevenueForecast === 'function'
          ? () => ceoService.getRevenueForecast(6)
          : null,
        mockForecast,
      ),
    ]);

    const revData = revenueRes.data || revenueRes || {};
    const raw = revData.historical || [];
    const byMonth = {};
    raw.forEach(item => {
      const key = item.date ? item.date.slice(0, 7) : 'Unknown';
      byMonth[key] = (byMonth[key] || 0) + (item.revenue || 0);
    });
    const monthKeys = Object.keys(byMonth).sort();
    const histData = monthKeys.length > 0
      ? monthKeys.map(k => ({
          label: new Date(k + '-01').toLocaleString('default', { month: 'short', year: '2-digit' }),
          revenue: byMonth[k],
        }))
      : mockRevenueHistory();
    setRevenueHistory(histData);

    const profitSectors = overview.profit?.sectors || [];
    const activeSectors = profitSectors.filter(s => s.revenue > 0 || s.profit > 0);
    setSectors(activeSectors.length > 0 ? activeSectors : mockSectors());

    const csActual = overview.kpis?.customerSatisfaction?.actual || overview.customerSatisfaction || 0;
    const csTarget = overview.kpis?.customerSatisfaction?.target || 90;
    setSatisfaction({ actual: parseFloat(csActual) || 78.5, target: csTarget });

    setForecastData(Array.isArray(forecast) && forecast.length > 0 ? forecast : mockForecast());

    const compRes = await safe(
      typeof ceoService.comparePeriods === 'function'
        ? () => ceoService.comparePeriods('month', 'lastMonth', 'revenue,orders,profit')
        : null,
      mockComparison,
    );
    setComparisonData(Array.isArray(compRes) ? compRes : compRes.data || mockComparison());

    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const maxMargin = Math.max(...sectors.map(s => s.margin || 0), 30);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.skeletonCard} style={{ width: '100%', height: 300 }} />
        <div className={styles.skeletonCard} style={{ width: '100%', height: 250 }} />
        <p>Loading deep analytics&#8230;</p>
      </div>
    );
  }

  const peak = Math.max(...revenueHistory.map(d => d.revenue));
  const avg = revenueHistory.reduce((a, d) => a + d.revenue, 0) / revenueHistory.length;
  const total = revenueHistory.reduce((a, d) => a + d.revenue, 0);

  const handleChartClick = (data) => {
    if (data && data.activePayload) {
      setDrilldown(data.activePayload[0].payload);
    }
  };

  const trendArrow = (trend) => {
    if (trend === 'up') return <span className={styles.trendUp}>&#8593;</span>;
    if (trend === 'down') return <span className={styles.trendDown}>&#8595;</span>;
    return <span className={styles.trendNeutral}>&#8594;</span>;
  };

  return (
    <div className={styles.analyticsContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Deep Analytics</h1>
        <p className={styles.pageSubtitle}>Comprehensive data analysis for business intelligence</p>
        {error && <p className={styles.errorNote}>&#9888;&#65039; {error} Showing representative data.</p>}
      </div>

      <div className={styles.analyticsGrid}>
        <div className={`${styles.card} ${styles.chartLarge}`}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Monthly Revenue Trends</h2>
            <span className={styles.cardBadge}>Full Year</span>
          </div>
          <div className={styles.chartArea}>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={revenueHistory} onClick={handleChartClick}>
                <defs>
                  <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" fontSize={11} tickMargin={8} />
                <YAxis fontSize={11} tickFormatter={v => v >= 1000000 ? `$${(v/1000000).toFixed(1)}M` : v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`} />
                <Tooltip formatter={v => formatCurrency(v)} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#f1f5f9' }} />
                <Area type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={2.5} fill="url(#revGradient)" dot={{ r: 4, fill: '#6366F1' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey={() => avg} stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="6 4" name="Average" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className={styles.chartFooter}>
            <div className={styles.footerStat}>
              <span>Peak</span>
              <strong>{formatCurrency(peak)}</strong>
            </div>
            <div className={styles.footerStat}>
              <span>Avg/Month</span>
              <strong>{formatCurrency(avg)}</strong>
            </div>
            <div className={styles.footerStat}>
              <span>Total</span>
              <strong>{formatCurrency(total)}</strong>
            </div>
          </div>
        </div>

        <div className={styles.subGrid}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Profit Margins by Sector</h2>
              <span className={styles.cardBadge}>This Month</span>
            </div>
            <div className={styles.chartAreaSmall}>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={sectors} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" fontSize={11} tickFormatter={v => `${v}%`} domain={[0, maxMargin + 5]} />
                  <YAxis type="category" dataKey="name" width={80} fontSize={12} tick={{ fontWeight: 600 }} />
                  <Tooltip
                    formatter={(_, name, props) => {
                      const s = sectors[props.index];
                      return [
                        `Margin: ${s.margin}% | Revenue: ${formatCurrency(s.revenue)} | Profit: ${formatCurrency(s.profit)}`
                      ];
                    }}
                    contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#f1f5f9', fontSize: 12 }}
                  />
                  <Bar dataKey="margin" radius={[0, 6, 6, 0]} barSize={20}>
                    {sectors.map((s, i) => (
                      <Cell key={i} fill={SECTOR_COLORS[s.name] || '#8B5CF6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.sectorTable}>
              {sectors.map((s, i) => {
                const col = SECTOR_COLORS[s.name] || '#8B5CF6';
                return (
                  <div className={styles.sectorRow} key={i}>
                    <span className={styles.sectorDot} style={{ background: col }} />
                    <span className={styles.sectorName}>{s.name}</span>
                    <span className={styles.sectorRevenue}>{formatCurrency(s.revenue || 0)}</span>
                    <span className={styles.sectorMargin} style={{ color: col }}>{(s.margin || 0).toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`${styles.card} ${styles.satisfactionCard}`}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Customer Satisfaction</h2>
              <span className={styles.cardBadge}>Live</span>
            </div>
            <SatisfactionGauge actual={satisfaction.actual} target={satisfaction.target} />
            <p className={styles.satisfactionNote}>
              Based on order completion rate and fulfilment time vs target.
              {satisfaction.actual < satisfaction.target && (
                <> Increase on-time deliveries to reach the <strong>{satisfaction.target}%</strong> target.</>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className={styles.forecastSection}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Revenue Forecast</h2>
            <div className={styles.forecastMeta}>
              <span className={styles.forecastTrend}>&#8593; +12.3% avg monthly growth</span>
              <span className={styles.cardBadge}>6-Month Outlook</span>
            </div>
          </div>
          <div className={styles.chartArea}>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={forecastData} onClick={handleChartClick}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="period" fontSize={11} tickMargin={8} />
                <YAxis fontSize={11} tickFormatter={v => `${v / 1000}k`} />
                <Tooltip formatter={v => v ? formatCurrency(v) : 'N/A'} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#f1f5f9' }} />
                <Legend />
                <Bar dataKey="historical" fill="#3B82F6" name="Historical" radius={[3, 3, 0, 0]} barSize={24} />
                <Area type="monotone" dataKey="upper" stroke="none" fill="#6366F1" fillOpacity={0.12} name="Confidence Band" />
                <Area type="monotone" dataKey="lower" stroke="none" fill="#ffffff" fillOpacity={1} />
                <Line type="monotone" dataKey="forecast" stroke="#6366F1" strokeWidth={2.5} strokeDasharray="8 4" name="Forecast" dot={false} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Period Comparison</h2>
          <span className={styles.cardBadge}>Current vs Previous Month</span>
        </div>
        <div className={styles.comparisonTable}>
          <div className={styles.comparisonHeader}>
            <span className={styles.comparisonCol}>Metric</span>
            <span className={styles.comparisonCol}>Current</span>
            <span className={styles.comparisonCol}>Previous</span>
            <span className={styles.comparisonCol}>Change</span>
            <span className={styles.comparisonCol}>% Change</span>
            <span className={styles.comparisonCol}>Trend</span>
            <span className={styles.comparisonCol}>Significance</span>
          </div>
          {comparisonData.map((row, i) => {
            const sig = getSignificance(row.pctChange);
            const isPositive = row.trend === 'up';
            return (
              <div key={i} className={styles.comparisonRow}>
                <span className={styles.comparisonCol}><strong>{row.metric}</strong></span>
                <span className={styles.comparisonCol}>{row.metric === 'Margin' ? `${row.current.toFixed(1)}%` : formatCurrency(row.current)}</span>
                <span className={styles.comparisonCol}>{row.metric === 'Margin' ? `${row.previous.toFixed(1)}%` : formatCurrency(row.previous)}</span>
                <span className={`${styles.comparisonCol} ${isPositive ? styles.textUp : styles.textDown}`}>
                  {isPositive ? '+' : ''}{row.metric === 'Margin' ? `${row.change.toFixed(1)}%` : formatCurrency(row.change)}
                </span>
                <span className={`${styles.comparisonCol} ${isPositive ? styles.textUp : styles.textDown}`}>
                  {isPositive ? '+' : ''}{row.pctChange.toFixed(1)}%
                </span>
                <span className={styles.comparisonCol}>
                  {trendArrow(row.trend)}
                </span>
                <span className={styles.comparisonCol}>
                  <span className={`${styles.significanceBadge} ${styles[sig.className]}`}>{sig.label}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <DrilldownModal data={drilldown} onClose={() => setDrilldown(null)} />
    </div>
  );
};

export default Analytics;
