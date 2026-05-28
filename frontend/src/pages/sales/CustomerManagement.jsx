import React, { useState, useEffect } from 'react';
import salesService from '../../services/salesService';
import { formatNumber, formatCurrency } from '../../utils/formatters';
import styles from './CustomerManagement.module.css';
const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await salesService.getCustomers();
        setCustomers(response.data?.customers || response.data?.data?.customers || []);
      } catch (error) {
        console.error('Sales: Failed to fetch customers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);
  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      const payload = {
        name: formData.name,
        phone: formData.phone || undefined,
        email: formData.email || undefined
      };
      const res = await salesService.createCustomer(payload);
      const newCustomer = res.data?.data?.customer || res.data?.customer;
      if (newCustomer) {
        setCustomers([...customers, newCustomer]);
      }
      setShowModal(false);
      setFormData({ name: '', phone: '', email: '' });
    } catch (error) {
      console.error('Failed to create customer:', error);
      setErrorMsg(error.response?.data?.message || 'Failed to create customer. Phone or email might already exist.');
    } finally {
      setSubmitting(false);
    }
  };
  if (loading) return <div className={styles.loading}>Gathering customer directory...</div>;
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Customers</h2>
          <p className={styles.subtitle}>Database of all registered business contacts</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => setShowModal(true)}>
          + New Customer
        </button>
      </div>
      <div className={styles.tableContainer}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Type</th>
              <th>Phone</th>
              <th>Email</th>
              <th className={styles.textCenter}>Total Orders</th>
              <th className={styles.textRight}>Total Spent</th>
              <th className={styles.textCenter}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td>
                  <div className={styles.customerName}>{c.name}</div>
                  <div className={styles.textSm}>ID: {c.id}</div>
                </td>
                <td>
                  <span className={styles.badge}>
                    {c.customer_type_name || 'Regular'}
                  </span>
                </td>
                <td>{c.phone || 'N/A'}</td>
                <td className={styles.textSm}>{c.email || 'N/A'}</td>
                <td className={styles.textCenter}>{formatNumber(c.total_orders || 0)}</td>
                <td className={`${styles.textRight} ${styles.fontBold}`}>
                  {formatCurrency(c.total_spent || 0)}
                </td>
                <td>
                  <div className={styles.actionBtns}>
                    <button className={styles.btnIcon} title="View Profile">View</button>
                    <button className={styles.btnIcon} title="New Order">Order</button>
                  </div>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan="7" className={styles.emptyState}>No customers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', width: '400px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>New Customer</h3>
            {errorMsg && (
              <div style={{ padding: '10px', marginBottom: '16px', background: '#fee2e2', color: '#b91c1c', borderRadius: '4px', fontSize: '14px' }}>
                {errorMsg}
              </div>
            )}
            <form onSubmit={handleCreateCustomer}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Name *</label>
                <input 
                  type="text" 
                  required 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Phone (09xxxxxxxx)</label>
                <input 
                  type="text" 
                  pattern="09[0-9]{8}"
                  title="Phone must start with 09 and be 10 digits long"
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Email</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  {submitting ? 'Creating...' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default CustomerManagement;
