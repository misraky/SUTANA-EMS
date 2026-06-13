import React, { useState, useEffect } from 'react';
import axios from '../../services/apiClient';
import { Package, Truck, CheckCircle, Clock } from 'lucide-react';
import PrescriptionViewer from '../shared/PrescriptionViewer';
import styles from './CustomerPortal.module.css'; // Reusing standard portal styles

const CustomerFarmingOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewImage, setViewImage] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/farming/orders/my-orders');
      if (res.data.status === 'success') {
        setOrders(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load farming orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
      case 'DELIVERED': return <CheckCircle size={18} color="#10b981" />;
      case 'OUT_FOR_DELIVERY':
      case 'READY_FOR_PICKUP': return <Truck size={18} color="#3b82f6" />;
      default: return <Clock size={18} color="#f59e0b" />;
    }
  };

  const getStatusBadgeClass = (status) => {
    if (['COMPLETED', 'DELIVERED'].includes(status)) return styles.statusCompleted;
    if (['OUT_FOR_DELIVERY', 'READY_FOR_PICKUP'].includes(status)) return styles.statusActive;
    return styles.statusPending;
  };

  const handleImageClick = (imageUrl, name) => {
    const url = new URL(window.location);
    url.searchParams.set('viewImage', imageUrl);
    url.searchParams.set('imageName', name);
    window.history.pushState({}, '', url);
    setViewImage({ url: imageUrl, name });
  };

  const handleCloseViewer = () => {
    const url = new URL(window.location);
    url.searchParams.delete('viewImage');
    url.searchParams.delete('imageName');
    window.history.pushState({}, '', url);
    setViewImage(null);
  };

  if (loading) return <div className={styles.loadingContainer}>Loading orders...</div>;
  if (error) return <div className={styles.errorContainer}>{error}</div>;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>My Farming Orders</h1>
        <p>Track your agricultural supplies and deliveries.</p>
      </div>

      {orders.length === 0 ? (
        <div className={styles.emptyState}>
          <Package size={48} className={styles.emptyIcon} />
          <p>You have no farming orders yet.</p>
        </div>
      ) : (
        <div className={styles.ordersList}>
          {orders.map(order => (
            <div key={order.id} className={styles.orderCard}>
              <div className={styles.orderCardHeader}>
                <div>
                  <h3 className={styles.orderId}>Order #{order.invoice_number}</h3>
                  <span className={styles.orderDate}>{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
                <div className={`${styles.statusBadge} ${getStatusBadgeClass(order.status)}`}>
                  {getStatusIcon(order.status)}
                  {order.status.replace(/_/g, ' ')}
                </div>
              </div>

              <div className={styles.orderDetailsGrid}>
                <div>
                  <strong>Total Amount:</strong> {order.total_amount} ETB
                </div>
                <div>
                  <strong>Delivery Type:</strong> <span style={{textTransform: 'capitalize'}}>{order.delivery_type}</span>
                </div>
                {order.delivery_address && (
                  <div className={styles.fullWidth}>
                    <strong>Address:</strong> {order.delivery_address}
                  </div>
                )}
              </div>

              <div className={styles.orderItemsSection}>
                <h4>Items Ordered</h4>
                <div className={styles.orderItemsList}>
                  {order.items?.map(item => (
                    <div key={item.id} className={styles.orderItemRow}>
                      <div className={styles.itemInfo}>
                        {item.product_image && (
                          <img 
                            src={item.product_image.startsWith('http') ? item.product_image : `${axios.defaults.baseURL.replace('/api/v1', '')}/${item.product_image}`} 
                            alt={item.product_name} 
                            className={styles.itemThumbnail}
                            onClick={() => handleImageClick(item.product_image, item.product_name)}
                          />
                        )}
                        <div>
                          <p className={styles.itemName}>{item.product_name}</p>
                          <p className={styles.itemQtyPrice}>{item.quantity} x {item.unit_price} ETB</p>
                        </div>
                      </div>
                      <div className={styles.itemSubtotal}>
                        {item.subtotal} ETB
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Viewer popup */}
      {viewImage && (
        <PrescriptionViewer 
          imageUrl={viewImage.url} 
          onClose={handleCloseViewer} 
        />
      )}
    </div>
  );
};

export default CustomerFarmingOrders;
