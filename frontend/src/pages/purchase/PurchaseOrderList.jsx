import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import purchaseService from '../../services/purchaseService';
import { formatDate, formatCurrency } from '../../utils/formatters';
import styles from './PurchaseOrderList.module.css';

const CANCELABLE = ['Draft', 'Pending', 'Pending Approval', 'Approved'];

const PurchaseOrderList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await purchaseService.getPurchaseOrders();
        setOrders(response.data?.orders || []);
      } catch (error) {
        console.error('Failed to fetch POs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleCancel = async (po, e) => {
    e.stopPropagation();
    if (!window.confirm(`Cancel ${po.po_number}? This cannot be undone.`)) return;
    try {
      await purchaseService.cancelPO(po.id, { reason: 'Cancelled by user' });
      setOrders(prev => prev.map(o => o.id === po.id ? { ...o, status_name: 'Cancelled' } : o));
    } catch (error) {
      alert('Failed to cancel: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) return <div className={styles.loading}>Loading purchase orders...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Purchase Orders</h2>
          <p className={styles.subtitle}>Track procurement requests and approvals</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => navigate('/purchase/orders/create')}>
          New Purchase Order
        </button>
      </div>

      {orders.length === 0 ? (
        <div style={{textAlign:'center',padding:'3rem',color:'#94a3b8'}}>
          <div style={{fontSize:40,marginBottom:12}}>&#128230;</div>
          <p>No purchase orders yet. Click <strong>New Purchase Order</strong> to create one.</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier</th>
                <th>Order Date</th>
                <th>Expected</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((po) => (
                <tr key={po.id}>
                  <td className={styles.poNumber}>{po.po_number}</td>
                  <td><strong className={styles.supplierName}>{po.supplier_name}</strong></td>
                  <td>{formatDate(po.order_date)}</td>
                  <td>{formatDate(po.expected_delivery_date)}</td>
                  <td>{formatCurrency(po.total_amount)}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[po.status_name ? po.status_name.toLowerCase().replace(' ', '') : ''] || styles.defaultBadge}`}>
                      {po.status_name}
                    </span>
                  </td>
                  <td className={styles.textSm}>{po.created_by_name}</td>
                  <td>
                    <div className={styles.actionBtns}>
                      <button className={styles.btnIcon} title="View Details" onClick={() => navigate(`/purchase/orders/${po.id}`)}>
                        &#128065;
                      </button>
                      {po.status_name === 'Draft' && (
                        <button className={styles.btnIcon} title="Edit" onClick={() => navigate(`/purchase/orders/create`, { state: { editPO: po.id } })}>
                          &#9998;
                        </button>
                      )}
                      {CANCELABLE.includes(po.status_name) && (
                        <button className={styles.btnIcon} title="Cancel" onClick={(e) => handleCancel(po, e)} style={{color:'#dc2626'}}>
                          &#10005;
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderList;