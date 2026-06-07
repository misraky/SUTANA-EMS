import React, { useState, useEffect } from 'react';
import inventoryService from '../../services/inventoryService';
import styles from './AddProductModal.module.css';
const AddProductModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    categoryId: '',
    unitId: '',
    sellingPrice: '',
    reorderLevel: '0',
    expiryDate: '',
    requiresSerial: false
  });
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (isOpen) {
      fetchLookupData();
    }
  }, [isOpen]);
  const fetchLookupData = async () => {
    try {
      const [catRes, unitRes] = await Promise.all([
        inventoryService.getCategories(),
        inventoryService.getUnits()
      ]);
      setCategories(catRes.data?.categories || []);
      setUnits(unitRes.data?.units || []);
    } catch (err) {
      console.error('Failed to load categories or units', err);
    }
  };
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        categoryId: parseInt(formData.categoryId),
        unitId: parseInt(formData.unitId),
        sellingPrice: parseFloat(formData.sellingPrice),
        reorderLevel: parseInt(formData.reorderLevel) || 0,
        requires_serial: formData.requiresSerial
      };
      if (formData.expiryDate) {
        payload.expiryDate = formData.expiryDate;
      } else {
        delete payload.expiryDate;
      }
      
      await inventoryService.createProduct(payload);
      onSuccess();
      setFormData({
        name: '', sku: '', categoryId: '', unitId: '',
        sellingPrice: '', reorderLevel: '0', expiryDate: '', requiresSerial: false
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };
  if (!isOpen) return null;
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Add New Product</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.form}>
            {error && <div className={styles.errorAlert}>{error}</div>}
            <div className={styles.formGrid}>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Product Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  className={styles.input} 
                  required 
                  placeholder="e.g. A4 Printer Paper"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>SKU</label>
                <input 
                  type="text" 
                  name="sku" 
                  value={formData.sku} 
                  onChange={handleChange} 
                  className={styles.input} 
                  required 
                  placeholder="e.g. PAP-A4-01"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Category</label>
                <select 
                  name="categoryId" 
                  value={formData.categoryId} 
                  onChange={handleChange} 
                  className={styles.select} 
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Unit of Measurement</label>
                <select 
                  name="unitId" 
                  value={formData.unitId} 
                  onChange={handleChange} 
                  className={styles.select} 
                  required
                >
                  <option value="">Select Unit</option>
                  {units.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Selling Price</label>
                <input 
                  type="number" 
                  step="0.01" 
                  name="sellingPrice" 
                  value={formData.sellingPrice} 
                  onChange={handleChange} 
                  className={styles.input} 
                  required 
                  placeholder="0.00"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Reorder Level</label>
                <input 
                  type="number" 
                  name="reorderLevel" 
                  value={formData.reorderLevel} 
                  onChange={handleChange} 
                  className={styles.input} 
                  required 
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Expiry Date (Optional)</label>
                <input 
                  type="date" 
                  name="expiryDate" 
                  value={formData.expiryDate} 
                  onChange={handleChange} 
                  className={styles.input} 
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    name="requiresSerial" 
                    checked={formData.requiresSerial} 
                    onChange={handleChange} 
                    style={{ width: '1.2rem', height: '1.2rem' }}
                  />
                  Requires Serial Number Tracking
                </label>
              </div>
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Adding...' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default AddProductModal;
