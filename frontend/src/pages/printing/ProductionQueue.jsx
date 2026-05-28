import React, { useState, useEffect } from 'react';
import printingService from '../../services/printingService';
import { formatDate } from '../../utils/dateUtils';
const ProductionQueue = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchQueue();
  }, []);
  const fetchQueue = async () => {
    try {
      const response = await printingService.getProductionQueue();
      setQueue(response.data.queue);
    } catch (error) {
      console.error('Printing: Failed to fetch queue:', error);
    } finally {
      setLoading(false);
    }
  };
  const updateStatus = async (id, status) => {
    try {
      await printingService.updateOrderStatus(id, status);
      fetchQueue();
    } catch (error) {
      alert('Failed to update status');
    }
  };
  if (loading) return <div className="loading">Organizing production line...</div>;
  return (
    <div className="production-queue">
      <div className="section-header">
        <div>
          <h2>Production Queue</h2>
          <p>Real-time view of orders currently in production</p>
        </div>
      </div>
      <div className="queue-grid grid-3">
        {['Received', 'In Progress', 'Quality Check'].map(status => (
          <div key={status} className="queue-column section">
            <div className="column-header">
              <h3>{status}</h3>
              <span className="count">{queue.filter(o => o.status === status).length}</span>
            </div>
            <div className="queue-list">
              {queue.filter(o => o.status === status).map(order => (
                <div key={order.id} className="queue-card">
                  <div className="card-top">
                    <span className="order-num">#{order.orderNumber}</span>
                    <span className="due-date">Due: {formatDate(order.dueDate)}</span>
                  </div>
                  <h4>{order.productType}</h4>
                  <div className="card-details">
                    <span>{order.quantity} units</span>
                    <span>{order.customerName}</span>
                  </div>
                  <div className="card-actions">
                    {status === 'Received' && (
                      <button className="btn-sm blue" onClick={() => updateStatus(order.id, 'In Progress')}>Start Production</button>
                    )}
                    {status === 'In Progress' && (
                      <button className="btn-sm orange" onClick={() => updateStatus(order.id, 'Quality Check')}>To Quality Check</button>
                    )}
                    {status === 'Quality Check' && (
                      <button className="btn-sm green" onClick={() => updateStatus(order.id, 'Ready')}>Mark as Ready</button>
                    )}
                  </div>
                </div>
              ))}
              {queue.filter(o => o.status === status).length === 0 && (
                <div className="empty-column">No orders in this stage.</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default ProductionQueue;
