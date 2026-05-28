import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import purchaseService from '../../services/purchaseService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './PurchaseOrderDetail.module.css';
const PurchaseOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchPO = async () => {
      try {
        const response = await purchaseService.getPOById(id);
        setPo(response.data?.purchaseOrder || response.data?.order || null);
      } catch (error) {
        console.error('Failed to fetch PO details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPO();
  }, [id]);
  if (loading) return <div className={styles.loading}>Loading purchase order details...</div>;
  if (!po) return <div className={styles.error}>Purchase order not found.</div>;

  const handleApprove = async (isApproved) => {
    try {
      setLoading(true);
      await purchaseService.approvePO(id, {
        approved: isApproved,
        rejectionReason: isApproved ? undefined : 'Rejected manually'
      });
      // Refresh
      const response = await purchaseService.getPOById(id);
      setPo(response.data?.purchaseOrder || response.data?.order || null);
    } catch (error) {
      console.error('Failed to update PO status:', error);
      alert('Failed to update status: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await purchaseService.submitPOForApproval(id);
      // Refresh
      const response = await purchaseService.getPOById(id);
      setPo(response.data?.purchaseOrder || response.data?.order || null);
    } catch (error) {
      console.error('Failed to submit PO:', error);
      alert('Failed to submit PO: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.btnBack} onClick={() => navigate('/purchase/orders')}>
          &larr; Back to Orders
        </button>
        <div className={styles.headerTitleRow}>
          <div>
            <h2 className={styles.title}>Purchase Order {po.po_number}</h2>
            <p className={styles.subtitle}>Created on {formatDate(po.created_at, 'datetime')}</p>
          </div>
          <span className={`${styles.badge} ${styles[po.status_name ? po.status_name.toLowerCase().replace(' ', '') : ''] || styles.defaultBadge}`}>
            {po.status_name}
          </span>
        </div>
      </div>
      <div className={styles.mainGrid}>
        <div className={styles.leftCol}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Supplier Information</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoGroup}>
                <span className={styles.infoLabel}>Name</span>
                <span className={styles.infoValue}><strong>{po.supplier_name}</strong></span>
              </div>
              <div className={styles.infoGroup}>
                <span className={styles.infoLabel}>Email</span>
                <span className={styles.infoValue}>{po.supplier_email || 'N/A'}</span>
              </div>
              <div className={styles.infoGroup}>
                <span className={styles.infoLabel}>Phone</span>
                <span className={styles.infoValue}>{po.supplier_phone || 'N/A'}</span>
              </div>
              <div className={styles.infoGroup}>
                <span className={styles.infoLabel}>Address</span>
                <span className={styles.infoValue}>{po.supplier_address || 'N/A'}</span>
              </div>
            </div>
          </div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Order Items</h3>
            <div className={styles.tableWrapper}>
              <table className={styles.itemsTable}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className={styles.textRight}>Qty</th>
                    <th className={styles.textRight}>Unit Price</th>
                    <th className={styles.textRight}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {po.items && po.items.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div className={styles.productName}>{item.product_name}</div>
                        {item.sku && <div className={styles.productSku}>{item.sku}</div>}
                      </td>
                      <td className={styles.textRight}>{item.quantity_ordered}</td>
                      <td className={styles.textRight}>{formatCurrency(item.unit_price)}</td>
                      <td className={styles.textRight}><strong>{formatCurrency(item.total)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.totalsContainer}>
              <div className={styles.totalsRow}>
                <span>Subtotal</span>
                <span>{formatCurrency(po.subtotal)}</span>
              </div>
              <div className={styles.totalsRow}>
                <span>Tax (15%)</span>
                <span>{formatCurrency(po.tax_amount)}</span>
              </div>
              <div className={`${styles.totalsRow} ${styles.grandTotal}`}>
                <span>Total</span>
                <span>{formatCurrency(po.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.rightCol}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Order Details</h3>
            <div className={styles.infoList}>
              <div className={styles.listItem}>
                <span className={styles.listLabel}>Expected Delivery</span>
                <span className={styles.listValue}>{formatDate(po.expected_delivery_date)}</span>
              </div>
              <div className={styles.listItem}>
                <span className={styles.listLabel}>Sector/Department</span>
                <span className={styles.listValue}>{po.sector_name || 'N/A'}</span>
              </div>
              <div className={styles.listItem}>
                <span className={styles.listLabel}>Created By</span>
                <span className={styles.listValue}>{po.created_by_name}</span>
              </div>
              <div className={styles.listItem}>
                <span className={styles.listLabel}>Approved By</span>
                <span className={styles.listValue}>{po.approved_by_name || 'Pending'}</span>
              </div>
            </div>
          </div>
          {po.notes && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Notes / Terms</h3>
              <p className={styles.notesText}>{po.notes}</p>
            </div>
          )}
          {po.status_name === 'Draft' && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Submit Order</h3>
              <p className={styles.approvalText}>This purchase order is currently a Draft. Submit it to Finance/CEO for approval.</p>
              <div className={styles.approvalBtns}>
                <button className={styles.btnApprove} onClick={handleSubmit}>Submit for Approval</button>
              </div>
            </div>
          )}
          {(po.status_name === 'Pending' || po.status_name === 'Pending Approval') && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Approval Actions</h3>
              <p className={styles.approvalText}>This purchase order requires approval.</p>
              <div className={styles.approvalBtns}>
                <button className={styles.btnApprove} onClick={() => handleApprove(true)}>Approve</button>
                <button className={styles.btnReject} onClick={() => handleApprove(false)}>Reject</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default PurchaseOrderDetail;
