import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import printingService from '../../services/printingService';
import { formatDate } from '../../utils/formatters';
import styles from './OrderList.module.css';
const OrderList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    fetchOrders();
  }, []);
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await printingService.getOrders({ limit: 100 });
      setOrders(response.data?.orders || response.data?.rows || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load printing orders.');
    } finally {
      setLoading(false);
    }
  };
  const getStatusBadgeClass = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'received': return styles.received;
      case 'in progress': return styles.inProgress;
      case 'quality check': return styles.qualityCheck;
      case 'ready': return styles.ready;
      case 'delivered': return styles.delivered;
      default: return styles.pending;
    }
  };
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Printing Orders</h1>
          <p className={styles.subtitle}>Manage and track all production requests</p>
        </div>
        <button 
          className={styles.primaryBtn} 
          onClick={() => navigate('/printing/orders/create')}
        >
          + Create New Order
        </button>
      </div>
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading orders...</p>
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <p>{error}</p>
            <button onClick={fetchOrders} className={styles.retryBtn}>Retry</button>
          </div>
        ) : orders.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No orders found. Create a new order to get started.</p>
          </div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className={styles.tableRow} onClick={() => navigate(`/printing/orders/${order.id}`)}>
                    <td className={styles.boldText}>PRT-{order.id}</td>
                    <td>{order.Customer?.name || 'Walk-in'}</td>
                    <td>
                      <div className={styles.productInfo}>
                        <span className={styles.productType}>{order.productType}</span>
                        <span className={styles.productSpecs}>
                          {order.paperType}, {order.colorPrinting ? 'Color' : 'B&W'}, {order.pagesPerCopy}pgs
                        </span>
                      </div>
                    </td>
                    <td>{order.quantity}</td>
                    <td className={new Date(order.dueDate) < new Date() && order.status !== 'Delivered' ? styles.overdue : ''}>
                      {formatDate(order.dueDate)}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${getStatusBadgeClass(order.status)}`}>
                        {order.status || 'Received'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className={styles.viewBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/printing/orders/${order.id}`);
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
export default OrderList;
