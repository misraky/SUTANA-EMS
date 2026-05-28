import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import printingService from '../../services/printingService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './PrintingHome.module.css';
const PrintingHome = () => {
  const navigate = useNavigate();
  const [stats, setStats]     = useState(null);
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, ordersRes] = await Promise.all([
        printingService.getStatistics(),
        printingService.getOrders({ limit: 10 }),
      ]);
      setStats(statsRes.data);
      setOrders(ordersRes.data?.orders || []);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('PrintingHome fetch failed:', err);
      setError('Failed to load production data. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { fetchAll(); }, [fetchAll]);
  const statusBreakdown = stats?.statusBreakdown || [];
  const monthlyRevenue  = stats?.monthlyRevenue  || [];
  const pendingOrders   = stats?.pendingOrders   ?? 0;
  const pastDueOrders   = stats?.pastDueOrders   ?? 0;
  const totalOrders     = stats?.totalOrders     ?? 0;
  const getStatusCount = (code) =>
    statusBreakdown.find(s => s.status_code === code)?.count ?? 0;
  const currentMonthRevenue = monthlyRevenue[0]?.revenue ?? 0;
  const lastMonthRevenue    = monthlyRevenue[1]?.revenue ?? 0;
  const revenueChange = lastMonthRevenue > 0
    ? (((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
    : null;
  const kpiCards = [
    {
      label: 'New (Received)',
      value: getStatusCount('received'),
      icon: '📥',
      accent: '#3b82f6',
      bg: '#eff6ff',
      action: () => navigate('/printing/orders'),
    },
    {
      label: 'In Production',
      value: getStatusCount('in_progress'),
      icon: '⚙️',
      accent: '#f59e0b',
      bg: '#fffbeb',
      action: () => navigate('/printing/orders'),
    },
    {
      label: 'Quality Check',
      value: getStatusCount('quality_check'),
      icon: '🔍',
      accent: '#8b5cf6',
      bg: '#f5f3ff',
      action: () => navigate('/printing/orders'),
    },
    {
      label: 'Ready for Pickup',
      value: getStatusCount('ready'),
      icon: '✅',
      accent: '#10b981',
      bg: '#ecfdf5',
      action: () => navigate('/printing/orders'),
    },
    {
      label: 'Total Delivered',
      value: getStatusCount('delivered'),
      icon: '🚚',
      accent: '#6366f1',
      bg: '#eef2ff',
      action: () => navigate('/printing/orders'),
    },
    {
      label: 'This Month Revenue',
      value: formatCurrency(currentMonthRevenue),
      isText: true,
      icon: '💰',
      accent: '#059669',
      bg: '#f0fdf4',
      sub: revenueChange !== null
        ? `${revenueChange >= 0 ? '▲' : '▼'} ${Math.abs(revenueChange)}% vs last month`
        : 'No prior month data',
      subColor: revenueChange >= 0 ? '#059669' : '#dc2626',
    },
  ];
  const getStatusStyle = (statusCode) => {
    const map = {
      received:      { bg: '#dbeafe', color: '#1e40af', label: 'Received' },
      in_progress:   { bg: '#fef3c7', color: '#92400e', label: 'In Progress' },
      quality_check: { bg: '#ede9fe', color: '#5b21b6', label: 'Quality Check' },
      ready:         { bg: '#d1fae5', color: '#065f46', label: 'Ready' },
      delivered:     { bg: '#e0e7ff', color: '#3730a3', label: 'Delivered' },
      cancelled:     { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
    };
    return map[statusCode] || { bg: '#f1f5f9', color: '#475569', label: statusCode || 'Unknown' };
  };
  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.spinner} />
        <p>Loading production data...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className={styles.errorWrapper}>
        <span>⚠️</span>
        <p>{error}</p>
        <button onClick={fetchAll} className={styles.retryBtn}>Retry</button>
      </div>
    );
  }
  return (
    <div className={styles.page}>
      {}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Production Overview</h1>
          <p className={styles.subtitle}>
            Live data · Refreshed at {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.refreshBtn} onClick={fetchAll} title="Refresh">
            🔄 Refresh
          </button>
          <button className={styles.primaryBtn} onClick={() => navigate('/printing/orders/create')}>
            + New Order
          </button>
        </div>
      </div>
      {}
      {pastDueOrders > 0 && (
        <div className={styles.alertBanner}>
          <span>🔴</span>
          <strong>{pastDueOrders} order{pastDueOrders > 1 ? 's are' : ' is'} past due</strong>
          — immediate attention required.
          <button onClick={() => navigate('/printing/orders')} className={styles.alertLink}>
            View Orders →
          </button>
        </div>
      )}
      {}
      <div className={styles.kpiGrid}>
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className={styles.kpiCard}
            style={{ borderTop: `4px solid ${card.accent}`, background: card.bg }}
            onClick={card.action}
            role={card.action ? 'button' : undefined}
          >
            <div className={styles.kpiIcon}>{card.icon}</div>
            <div className={styles.kpiBody}>
              <div className={styles.kpiValue} style={{ color: card.accent }}>
                {card.isText ? card.value : card.value.toLocaleString()}
              </div>
              <div className={styles.kpiLabel}>{card.label}</div>
              {card.sub && (
                <div className={styles.kpiSub} style={{ color: card.subColor }}>
                  {card.sub}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {}
      <div className={styles.lowerGrid}>
        {}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Recent Orders</h2>
            <button className={styles.linkBtn} onClick={() => navigate('/printing/orders')}>
              View All →
            </button>
          </div>
          {orders.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No orders yet. <span onClick={() => navigate('/printing/orders/create')} className={styles.inlineLink}>Create the first one →</span></p>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Due Date</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const isPastDue = order.due_date && new Date(order.due_date) < new Date() && order.status_code !== 'delivered';
                    const st = getStatusStyle(order.status_code);
                    return (
                      <tr
                        key={order.id}
                        className={styles.tableRow}
                        onClick={() => navigate(`/printing/orders/${order.id}`)}
                      >
                        <td className={styles.mono}>
                          {order.order_number || `PRT-${order.id}`}
                        </td>
                        <td>{order.customer_name || 'Walk-in'}</td>
                        <td className={isPastDue ? styles.overdue : ''}>
                          {formatDate(order.due_date, 'short')}
                          {isPastDue && <span className={styles.overdueTag}> ⚠</span>}
                        </td>
                        <td>{formatCurrency(order.total_price)}</td>
                        <td>
                          <span
                            className={styles.badge}
                            style={{ background: st.bg, color: st.color }}
                          >
                            {st.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {}
        <div className={styles.sideStack}>
          {}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Status Breakdown</h2>
              <span className={styles.totalBadge}>{totalOrders} total</span>
            </div>
            {statusBreakdown.length === 0 ? (
              <p className={styles.empty}>No data yet.</p>
            ) : (
              <div className={styles.statusList}>
                {statusBreakdown.map((s) => {
                  const st = getStatusStyle(s.status_code);
                  const pct = totalOrders > 0 ? ((s.count / totalOrders) * 100).toFixed(0) : 0;
                  return (
                    <div key={s.status_code} className={styles.statusRow}>
                      <div className={styles.statusMeta}>
                        <span className={styles.statusDot} style={{ background: s.color_hex || st.color }} />
                        <span className={styles.statusName}>{s.status_name || st.label}</span>
                        <span className={styles.statusCount}>{s.count}</span>
                      </div>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${pct}%`, background: s.color_hex || st.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Monthly Revenue</h2>
              <span className={styles.subLabel}>Last 6 months</span>
            </div>
            {monthlyRevenue.length === 0 ? (
              <p className={styles.empty}>No revenue data yet.</p>
            ) : (
              <div className={styles.revenueList}>
                {monthlyRevenue.map((m) => (
                  <div key={m.month} className={styles.revenueRow}>
                    <span className={styles.revenueMonth}>{m.month}</span>
                    <span className={styles.revenueOrders}>{m.order_count} orders</span>
                    <span className={styles.revenueAmount}>{formatCurrency(m.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {}
      <div className={styles.footerRow}>
        <div className={styles.footerCard} style={{ borderLeft: '4px solid #f59e0b' }}>
          <span className={styles.footerIcon}>⏳</span>
          <div>
            <div className={styles.footerValue}>{pendingOrders}</div>
            <div className={styles.footerLabel}>Active (not delivered)</div>
          </div>
        </div>
        <div className={styles.footerCard} style={{ borderLeft: '4px solid #ef4444' }}>
          <span className={styles.footerIcon}>🔴</span>
          <div>
            <div className={styles.footerValue}>{pastDueOrders}</div>
            <div className={styles.footerLabel}>Past Due</div>
          </div>
        </div>
        <div className={styles.footerCard} style={{ borderLeft: '4px solid #6366f1' }}>
          <span className={styles.footerIcon}>📦</span>
          <div>
            <div className={styles.footerValue}>{totalOrders}</div>
            <div className={styles.footerLabel}>All Time Orders</div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PrintingHome;
