import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import printingService from '../../services/printingService';
import { formatDate } from '../../utils/dateUtils';
import styles from './ProductionQueue.module.css';

const LANES = [
  { code: 'received', label: 'Received', icon: '📥', accent: '#3b82f6' },
  { code: 'in_progress', label: 'In Progress', icon: '⚙️', accent: '#f59e0b' },
  { code: 'quality_check', label: 'Quality Check', icon: '🔍', accent: '#8b5cf6' },
];

const ACTION_MAP = {
  received: { next: 'in_progress', label: 'Start Production', color: '#2563eb' },
  in_progress: { next: 'quality_check', label: 'To Quality Check', color: '#d97706' },
  quality_check: { next: 'ready', label: 'Mark Ready', color: '#059669' },
};

const ProductionQueue = () => {
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => { fetchQueue(); }, []);

  const fetchQueue = async () => {
    try {
      const response = await printingService.getProductionQueue();
      setQueue(response.data?.data?.orders || []);
    } catch (error) {
      console.error('Failed to fetch queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    setActionLoading(id);
    try {
      await printingService.updateOrderStatus(id, status);
      await fetchQueue();
    } catch (error) {
      alert('Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <p>Organizing production line...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Production Queue</h1>
          <p className={styles.subtitle}>Real-time Kanban view of orders in production</p>
        </div>
        <button className={styles.refreshBtn} onClick={fetchQueue}>
          🔄 Refresh
        </button>
      </div>

      <div className={styles.lanes}>
        {LANES.map(lane => {
          const items = queue.filter(o => o.status_code === lane.code);
          return (
            <div key={lane.code} className={styles.lane}>
              <div className={styles.laneHeader} style={{ borderTopColor: lane.accent }}>
                <span className={styles.laneIcon}>{lane.icon}</span>
                <h3 className={styles.laneTitle}>{lane.label}</h3>
                <span className={styles.laneCount} style={{ background: lane.accent }}>{items.length}</span>
              </div>
              <div className={styles.laneBody}>
                {items.length === 0 ? (
                  <div className={styles.emptyLane}>
                    <span>No orders</span>
                  </div>
                ) : (
                  items.map(order => (
                    <div
                      key={order.id}
                      className={styles.card}
                      onClick={() => navigate(`/printing/orders/${order.id}`)}
                    >
                      <div className={styles.cardTop}>
                        <span className={styles.orderNum}>#{order.order_number || order.id}</span>
                        <span className={styles.dueDate}>
                          {order.due_date ? formatDate(order.due_date) : '—'}
                        </span>
                      </div>
                      <h4 className={styles.productName}>{order.product_type || 'Print'}</h4>
                      <div className={styles.cardMeta}>
                        <span className={styles.metaBadge}>Qty: {order.quantity}</span>
                        <span className={styles.metaBadge}>{order.customer_name || 'Walk-in'}</span>
                        {order.paper_type && (
                          <span className={styles.metaBadge}>{order.paper_type}</span>
                        )}
                      </div>
                      <div className={styles.cardActions}>
                        {ACTION_MAP[lane.code] && (
                          <button
                            className={styles.actionBtn}
                            style={{ background: ACTION_MAP[lane.code].color }}
                            onClick={e => {
                              e.stopPropagation();
                              updateStatus(order.id, ACTION_MAP[lane.code].next);
                            }}
                            disabled={actionLoading === order.id}
                          >
                            {actionLoading === order.id ? '...' : ACTION_MAP[lane.code].label}
                          </button>
                        )}
                        {lane.code === 'quality_check' && (
                          <button
                            className={styles.actionBtn}
                            style={{ background: '#64748b' }}
                            onClick={e => {
                              e.stopPropagation();
                              updateStatus(order.id, 'ready');
                            }}
                            disabled={actionLoading === order.id}
                          >
                            {actionLoading === order.id ? '...' : 'Mark Ready'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductionQueue;
