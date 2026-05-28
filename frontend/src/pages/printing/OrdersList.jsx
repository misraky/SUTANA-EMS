import React, { useState, useEffect } from 'react';
import printingService from '../../services/printingService';
import { formatDate } from '../../utils/dateUtils';
const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await printingService.getOrders();
        setOrders(response.data?.orders || response.data?.rows || []);
      } catch (error) {
        console.error('Printing: Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);
  if (loading) return <div className="loading">Fetching production orders...</div>;
  return (
    <div className="orders-list">
      <div className="section-header">
        <div>
          <h2>All Printing Orders</h2>
          <p>Complete history and status of all customer printing requests</p>
        </div>
        <button className="btn-primary"><i className="icon-plus"></i> Manual Order Entry</button>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Product Type</th>
              <th>Quantity</th>
              <th>Date Received</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td className="font-mono text-sm">{order.orderNumber}</td>
                <td><strong>{order.customerName}</strong></td>
                <td>{order.productType}</td>
                <td>{order.quantity}</td>
                <td>{formatDate(order.createdAt)}</td>
                <td className={new Date(order.dueDate) < new Date() && order.status !== 'Delivered' ? 'text-red font-bold' : ''}>
                  {formatDate(order.dueDate)}
                </td>
                <td>
                  <span className={`badge status-${order.status.toLowerCase().replace(' ', '-')}`}>
                    {order.status}
                  </span>
                </td>
                <td>
                  <div className="action-btns">
                    <button className="btn-icon" title="View Details"><i className="icon-file-text"></i></button>
                    <button className="btn-icon" title="Update Status"><i className="icon-edit"></i></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default OrdersList;
