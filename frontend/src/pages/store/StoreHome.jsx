import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import inventoryService from '../../services/inventoryService';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { useAuth } from '../../hooks/useAuth';
import styles from './StoreHome.module.css';
const StoreHome = () => {
  const [stats, setStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [pendingAdjustments, setPendingAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canApprove = hasPermission('inventory:manager_approve');

  const handleApprove = async (id) => {
    try {
      await inventoryService.approveAdjustment(id);
      setPendingAdjustments(prev => prev.filter(a => a.id !== id));
      // Refresh stats
      inventoryService.getStatistics().then(res => setStats(res.data));
    } catch (e) {
      alert('Failed to approve adjustment');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;
    try {
      await inventoryService.rejectAdjustment(id, reason);
      setPendingAdjustments(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      alert('Failed to reject adjustment');
    }
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, lowStockRes] = await Promise.all([
          inventoryService.getStatistics(),
          inventoryService.getLowStock(),
        ]);
        setStats(statsRes.data);
        setLowStock(lowStockRes.data.products || []);
      } catch (err) {
        console.error('Failed to fetch store stats:', err);
        setError('Failed to load store data. Please refresh.');
      }

      try {
        const pendingRes = await inventoryService.getPendingAdjustments();
        setPendingAdjustments(pendingRes.data?.adjustments || []);
      } catch (err) {
        // user might not have inventory:approve permission, ignore
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  if (loading) return (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner}></div>
      <p>Analysing warehouse stock…</p>
    </div>
  );
  if (error) return (
    <div className={styles.errorContainer}>
      <span>⚠️</span>
      <p>{error}</p>
      <button onClick={() => window.location.reload()}>Retry</button>
    </div>
  );
  const cards = [
    {
      label: 'Total Products',
      value: formatNumber(stats?.totalProducts ?? 0),
      icon: '📦',
      colorClass: styles.colorBlue,
      sub: 'Active SKUs in catalogue',
    },
    {
      label: 'Low Stock Alerts',
      value: formatNumber(stats?.lowStockCount ?? 0),
      icon: '⚠️',
      colorClass: styles.colorOrange,
      sub: 'Items at or below reorder level',
    },
    {
      label: 'Out of Stock',
      value: formatNumber(stats?.outOfStockCount ?? 0),
      icon: '❌',
      colorClass: styles.colorRed,
      sub: 'Items with zero quantity',
    },
    {
      label: 'Total Inventory Value',
      value: formatCurrency(stats?.totalInventoryValue ?? 0),
      icon: '💰',
      colorClass: styles.colorGreen,
      sub: 'Current stock valuation',
    },
    {
      label: 'Expiring Soon',
      value: formatNumber(stats?.expiringCount ?? 0),
      icon: '📅',
      colorClass: styles.colorPurple,
      sub: 'Items expiring within 30 days',
    },
    {
      label: 'Movements (7 days)',
      value: formatNumber(stats?.recentMovements ?? 0),
      icon: '🔄',
      colorClass: styles.colorTeal,
      sub: 'Stock transactions this week',
    },
  ];
  const quickActions = [
    {
      icon: '➕',
      label: 'Register New Stock',
      desc: 'Add stock to existing products',
      path: '/store/adjustment',
      color: '#10b981',
    },
    {
      icon: '📋',
      label: 'Inventory List',
      desc: 'View & manage all products',
      path: '/store/inventory',
      color: '#3b82f6',
    },
    {
      icon: '🔄',
      label: 'Stock Movements',
      desc: 'Full transaction history',
      path: '/store/movements',
      color: '#8b5cf6',
    },
    {
      icon: '⚙️',
      label: 'Stock Adjustment',
      desc: 'Manually correct stock levels',
      path: '/store/adjustment',
      color: '#f59e0b',
    },
    {
      icon: '📄',
      label: 'Inventory Report',
      desc: 'Generate and export reports',
      path: '/reports/inventory',
      color: '#06b6d4',
    },
    {
      icon: '🚛',
      label: 'Receive Purchase Order',
      desc: 'Accept new deliveries',
      path: '/store/receive',
      color: '#ef4444',
    },
  ];
  return (
    <div className={styles.storeHome}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Store Manager Dashboard</h1>
          <p className={styles.pageSubtitle}>
            Real-time status of inventory levels, stock adjustments and approvals
          </p>
        </div>
        <div className={styles.headerMeta}>
          <span className={styles.timestamp}>
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>
      {}
      <div className={styles.statsGrid}>
        {cards.map((card) => (
          <div key={card.label} className={`${styles.statCard} ${card.colorClass}`}>
            <div className={styles.statIcon}>{card.icon}</div>
            <div className={styles.statContent}>
              <h3 className={styles.statValue}>{card.value}</h3>
              <p className={styles.statLabel}>{card.label}</p>
              <span className={styles.statSub}>{card.sub}</span>
            </div>
          </div>
        ))}
      </div>
      {}
      <div className={styles.quickActionsSection}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.actionGrid}>
          {quickActions.map((action) => (
            <button
              key={action.label}
              className={styles.actionCard}
              onClick={() => navigate(action.path)}
            >
              <span className={styles.actionIcon} style={{ background: action.color + '20', color: action.color }}>
                {action.icon}
              </span>
              <div className={styles.actionText}>
                <span className={styles.actionLabel}>{action.label}</span>
                <span className={styles.actionDesc}>{action.desc}</span>
              </div>
              <span className={styles.actionArrow}>→</span>
            </button>
          ))}
        </div>
      </div>
      {}
      {lowStock.length > 0 && (
        <div className={styles.alertSection}>
          <div className={styles.alertHeader}>
            <h2 className={styles.sectionTitle}>⚠️ Low Stock Alerts</h2>
            <button className={styles.viewAllBtn} onClick={() => navigate('/store/inventory')}>
              View All Inventory →
            </button>
          </div>
          <div className={styles.alertTable}>
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Reorder Level</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.slice(0, 8).map((item) => (
                  <tr key={item.id}>
                    <td className={styles.skuCell}>{item.sku}</td>
                    <td><strong>{item.name}</strong></td>
                    <td>{item.category_name || '—'}</td>
                    <td>
                      <span className={item.current_stock === 0 ? styles.outBadge : styles.lowBadge}>
                        {formatNumber(item.current_stock)} {item.unit || ''}
                      </span>
                    </td>
                    <td>{formatNumber(item.reorder_level)}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${item.current_stock === 0 ? styles.outStatus : styles.lowStatus}`}>
                        {item.current_stock === 0 ? 'Out of Stock' : 'Low Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {}
      {stats?.topMovingProducts?.length > 0 && (
        <div className={styles.topMovingSection}>
          <h2 className={styles.sectionTitle}>🏆 Top Moving Products (Last 30 Days)</h2>
          <div className={styles.topMovingGrid}>
            {stats.topMovingProducts.slice(0, 5).map((p, idx) => (
              <div key={p.id} className={styles.topMovingCard}>
                <span className={styles.rankBadge}>#{idx + 1}</span>
                <div className={styles.topMovingInfo}>
                  <strong>{p.name}</strong>
                  <span>{p.sku}</span>
                </div>
                <span className={styles.movementCount}>{formatNumber(p.total_movement)} units</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingAdjustments.length > 0 && (
        <div className={styles.alertSection} style={{ marginTop: '2rem' }}>
          <div className={styles.alertHeader}>
            <h2 className={styles.sectionTitle}>⏳ Pending Adjustments (Manager Approval)</h2>
          </div>
          <div className={styles.alertTable}>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Requested Change</th>
                  <th>Reason</th>
                  <th>Requested By</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingAdjustments.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.product_name}</strong></td>
                    <td className={styles.skuCell}>{item.sku}</td>
                    <td>
                      <span className={item.quantity_change > 0 ? styles.positiveStatus : styles.negativeStatus} style={{ fontWeight: 'bold', color: item.quantity_change > 0 ? '#10b981' : '#ef4444' }}>
                        {item.quantity_change > 0 ? '+' : ''}{item.quantity_change}
                      </span>
                    </td>
                    <td>{item.reason}</td>
                    <td>{item.requester_name}</td>
                    <td>{new Date(item.created_at).toLocaleDateString()}</td>
                    <td>
                      {canApprove ? (
                        <>
                          <button onClick={() => handleApprove(item.id)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', marginRight: '8px' }}>Approve</button>
                          <button onClick={() => handleReject(item.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Reject</button>
                        </>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Awaiting Manager</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
export default StoreHome;
