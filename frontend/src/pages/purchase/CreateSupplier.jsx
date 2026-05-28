import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import purchaseService from '../../services/purchaseService';
import styles from './SupplierList.module.css'; 
const CreateSupplier = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    taxId: '',
    bankAccount: ''
  });
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      await purchaseService.createSupplier(formData);
      setMessage({ type: 'success', text: 'Supplier added successfully!' });
      setTimeout(() => {
        navigate('/purchase/suppliers');
      }, 1500);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to add supplier' });
      setSubmitting(false);
    }
  };
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Add New Supplier</h2>
          <p className={styles.subtitle}>Register a new product or service provider</p>
        </div>
        <button className={styles.btnPrimary} style={{ background: '#64748b' }} onClick={() => navigate('/purchase/suppliers')}>
          Back to List
        </button>
      </div>
      {message && (
        <div style={{ padding: '1rem', marginBottom: '1rem', borderRadius: '0.5rem', background: message.type === 'success' ? '#f0fdf4' : '#fef2f2', color: message.type === 'success' ? '#16a34a' : '#ef4444' }}>
          {message.text}
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ background: 'white', padding: '2rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Supplier Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Contact Person *</label>
            <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleInputChange} required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Phone Number *</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="09XXXXXXXX" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email Address *</label>
            <input type="email" name="email" value={formData.email} onChange={handleInputChange} required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Tax ID / TIN</label>
            <input type="text" name="taxId" value={formData.taxId} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Bank Account Details</label>
            <input type="text" name="bankAccount" value={formData.bankAccount} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }} />
          </div>
        </div>
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Physical Address *</label>
          <textarea name="address" value={formData.address} onChange={handleInputChange} required rows="3" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button type="button" onClick={() => navigate('/purchase/suppliers')} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>
            Cancel
          </button>
          <button type="submit" disabled={submitting} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.375rem', background: '#3b82f6', color: 'white', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer' }}>
            {submitting ? 'Saving...' : 'Save Supplier'}
          </button>
        </div>
      </form>
    </div>
  );
};
export default CreateSupplier;
