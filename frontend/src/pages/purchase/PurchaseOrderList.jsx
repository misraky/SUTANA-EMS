import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import purchaseService from '../../services/purchaseService';
import { formatDate } from '../../utils/formatters';
import { formatCurrency } from '../../utils/formatters';
import styles from './PurchaseOrderList.module.css';
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
  if (loading) return <div className={styles.loading}>Loading purchase orders...</div>;
  if (orders.length === 0) return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div><h2 className={styles.title}>Purchase Orders</h2><p className={styles.subtitle}>Track procurement requests and approvals</p></div>
        <button className={styles.btnPrimary} onClick={() => navigate('/purchase/orders/create')}>New Purchase Order</button>
      </div>
      <div style={{textAlign:'center',padding:'3rem',color:'#94a3b8'}}>
        <div style={{fontSize:40,marginBottom:12}}>📦</div>
        <p>No purchase orders yet. Click <strong>New Purchase Order</strong> to create one.</p>
      </div>
    </div>
  );
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
                      <i className="icon-eye"></i>
                    </button>
                    {po.status_name === 'Draft' && <button className={styles.btnIcon} title="Edit"><i className="icon-edit"></i></button>}
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
export default PurchaseOrderList;
