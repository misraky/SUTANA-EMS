import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import purchaseService from '../../services/purchaseService';
import styles from './SupplierList.module.css';

const SupplierList = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  const filtered = suppliers.filter(s =>
    search === '' ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.contact_person || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Suppliers</h2>
          <p className={styles.subtitle}>Maintain your network of product and service providers</p>
        </div>
        <div className={styles.headerActions}>
          <input
            className={styles.searchInput}
            placeholder="🔍 Search suppliers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className={styles.btnPrimary} onClick={() => navigate('/purchase/suppliers/create')}>+ Add Supplier</button>
        </div>
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
              <th>Total POs</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" className={styles.emptyRow}>No suppliers match your search.</td>
              </tr>
            ) : filtered.map((s) => (
              <tr key={s.id} className={styles.dataRow}>
                <td>
                  <strong
                    className={styles.supplierNameLink}
                    onClick={() => navigate(`/purchase/suppliers/${s.id}`)}
                    title="View supplier profile"
                  >
                    {s.name}
                  </strong>
                </td>
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
                      className={styles.btnProfile}
                      onClick={() => navigate(`/purchase/suppliers/${s.id}`)}
                      title="View full profile & price history"
                    >
                      📊 View Profile
                    </button>
                    <button
                      className={styles.btnNewPO}
                      onClick={() => navigate('/purchase/orders/create', { state: { supplierId: s.id, supplierName: s.name } })}
                      title="Create a new PO for this supplier"
                    >
                      + PO
                    </button>
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

export default SupplierList;
