import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import customerService from '../../services/customerService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './CustomerOrders.module.css';
const STATUS_COLORS = {
  'Received':      { bg: '#eff6ff', text: '#1d4ed8' },
  'In Progress':   { bg: '#fefce8', text: '#a16207' },
  'Quality Check': { bg: '#f0fdf4', text: '#15803d' },
  'Ready':         { bg: '#faf5ff', text: '#7e22ce' },
  'Delivered':     { bg: '#f0fdf4', text: '#166534' },
};
const CustomerOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  useEffect(() => {
    fetchOrders(pagination.page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);
  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (filterStatus) params.status = filterStatus;
      const res = await customerService.getOrders(params);
      const data = res?.data || {};
      const normalizedOrders = (data.orders || []).map(o => ({
        id: o.id,
        orderNumber: o.order_number,
        productType: o.product_type || o.productType,
        quantity: o.quantity,
        totalAmount: o.total_price || o.totalAmount,
        dueDate: o.due_date || o.dueDate,
        status: o.status
      }));
      setOrders(normalizedOrders);
      setPagination({
        page: data.pagination?.page || 1,
        totalPages: data.pagination?.totalPages || 1,
        total: data.pagination?.total || 0,
      });
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };
  const handlePageChange = (newPage) => {
    fetchOrders(newPage);
    setPagination((p) => ({ ...p, page: newPage }));
  };
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Orders</h1>
          <p className={styles.subtitle}>{pagination.total} total orders</p>
        </div>
        <div className={styles.actions}>
          <select
            className={styles.filterSelect}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            {['Received', 'In Progress', 'Quality Check', 'Ready', 'Delivered'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            id="place-order-btn"
            className={styles.btnPrimary}
            onClick={() => navigate('/customer/new-order')}
          >
            + Place New Order
          </button>
        </div>
      </div>
      {loading ? (
        <div className={styles.loadingState}>Loading your orders...</div>
      ) : orders.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No orders found.</p>
          <button className={styles.btnPrimary} onClick={() => navigate('/customer/new-order')}>
            Place Your First Order
          </button>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Product Type</th>
                <th>Qty</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const sc = STATUS_COLORS[order.status] || { bg: '#f3f4f6', text: '#374151' };
                return (
                  <tr key={order.id} className={styles.row}>
                    <td className={styles.orderId}>#{order.id}</td>
                    <td>{order.productType}</td>
                    <td>{order.quantity}</td>
                    <td>{formatCurrency(order.totalAmount)}</td>
                    <td>{formatDate(order.dueDate)}</td>
                    <td>
                      <span
                        className={styles.badge}
                        style={{ backgroundColor: sc.bg, color: sc.text }}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className={styles.btnTrack}
                        onClick={() => navigate(`/customer/orders/${order.id}/track`)}
                      >
                        Track
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            disabled={pagination.page <= 1}
            onClick={() => handlePageChange(pagination.page - 1)}
            className={styles.pageBtn}
          >
            ← Prev
          </button>
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => handlePageChange(pagination.page + 1)}
            className={styles.pageBtn}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};
export default CustomerOrders;
