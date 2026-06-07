import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import purchaseService from '../../services/purchaseService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './SupplierList.module.css';

const PriceHistoryPanel = ({ supplierId }) => {
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await purchaseService.getSupplierById(supplierId);
        setPriceHistory(res.data?.priceHistory || []);
      } catch (err) {
        console.error('Failed to load price history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [supplierId]);

  if (loading) return <div className={styles.panelLoading}>Loading price history...</div>;
  if (priceHistory.length === 0) return <div className={styles.panelEmpty}>No price history available for this supplier.</div>;

  return (
    <div className={styles.priceHistoryPanel}>
      <h4 className={styles.panelTitle}>📊 Price History (from completed POs)</h4>
      <table className={styles.innerTable}>
        <thead>
          <tr>
            <th>PO Number</th>
            <th>Date</th>
            <th>Product</th>
            <th>SKU</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Line Total</th>
          </tr>
        </thead>
        <tbody>
          {priceHistory.slice(0, 15).map((item, idx) => (
            <tr key={idx}>
              <td className={styles.poNum}>{item.po_number}</td>
              <td>{formatDate(item.order_date, 'short')}</td>
              <td>{item.product_name}</td>
              <td className={styles.skuText}>{item.sku || '—'}</td>
              <td>{item.quantity_ordered}</td>
              <td>{formatCurrency(item.unit_price)}</td>
              <td><strong>{formatCurrency(item.line_total)}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const SupplierList = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await purchaseService.getSuppliers();
        setSuppliers(response.data?.suppliers || []);
      } catch (error) {
        console.error('Failed to fetch suppliers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSuppliers();
  }, []);

  if (loading) return <div className={styles.loading}>Loading suppliers...</div>;

  if (suppliers.length === 0) return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div><h2 className={styles.title}>Suppliers</h2><p className={styles.subtitle}>Maintain your network of product and service providers</p></div>
        <button className={styles.btnPrimary} onClick={() => navigate('/purchase/suppliers/create')}>Add Supplier</button>
      </div>
      <div style={{textAlign:'center',padding:'3rem',color:'#94a3b8'}}>
        <div style={{fontSize:40,marginBottom:12}}>🏭</div>
        <p>No suppliers added yet. Click <strong>Add Supplier</strong> to get started.</p>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Suppliers</h2>
          <p className={styles.subtitle}>Maintain your network of product and service providers</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => navigate('/purchase/suppliers/create')}>Add Supplier</button>
      </div>
      <div className={styles.tableContainer}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Supplier Name</th>
              <th>Contact Person</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Payment Terms</th>
              <th>Active POs</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <React.Fragment key={s.id}>
                <tr className={expandedId === s.id ? styles.rowExpanded : ''}>
                  <td><strong className={styles.supplierName}>{s.name}</strong></td>
                  <td>{s.contact_person}</td>
                  <td>{s.phone}</td>
                  <td>{s.email}</td>
                  <td>{s.payment_terms_name || 'N/A'}</td>
                  <td className={styles.textCenter}>{s.purchase_order_count || 0}</td>
                  <td>
                    <span className={`${styles.badge} ${s.is_active ? styles.active : styles.inactive}`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionBtns}>
                      <button
                        className={styles.btnHistory}
                        onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                        title="Price History"
                      >
                        {expandedId === s.id ? '▲ Hide' : '📊 Prices'}
                      </button>
                      <button className={styles.btnIcon} title="Edit"><i className="icon-edit"></i></button>
                    </div>
                  </td>
                </tr>
                {expandedId === s.id && (
                  <tr>
                    <td colSpan="8" className={styles.expandedCell}>
                      <PriceHistoryPanel supplierId={s.id} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupplierList;
