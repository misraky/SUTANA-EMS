import React, { useState, useEffect } from 'react';
import inventoryService from '../../services/inventoryService';
import styles from './InventoryAdjustment.module.css';
const InventoryAdjustment = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    quantityChange: '',
    reason: '',
    referenceType: 'Adjustment',
    referenceId: ''
  });
  const [message, setMessage] = useState(null);
  useEffect(() => {
    fetchProducts();
  }, []);
  const fetchProducts = async () => {
    try {
      const response = await inventoryService.getInventory({ limit: 1000 });
      setProducts(response.data?.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const payload = {
        ...formData,
        productId: parseInt(formData.productId),
        quantityChange: parseInt(formData.quantityChange)
      };
      if (formData.referenceId) {
        payload.referenceId = parseInt(formData.referenceId);
      } else {
        delete payload.referenceId;
      }
      await inventoryService.adjustStock(payload);
      setMessage({ type: 'success', text: 'Stock adjusted successfully!' });
      setFormData({
        productId: '',
        quantityChange: '',
        reason: '',
        referenceType: 'Adjustment',
        referenceId: ''
      });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to adjust stock' });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Inventory Adjustment</h2>
        <p className={styles.subtitle}>Manually update stock levels for specific products</p>
      </div>
      {message && (
        <div className={`${styles.alert} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Product</label>
          <select 
            name="productId" 
            value={formData.productId} 
            onChange={handleChange} 
            className={styles.input}
            required
          >
            <option value="">Select a product...</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>
            ))}
          </select>
        </div>
        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Quantity Change (+ or -)</label>
            <input 
              type="number" 
              name="quantityChange" 
              value={formData.quantityChange} 
              onChange={handleChange} 
              className={styles.input}
              placeholder="e.g. 5 or -2"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Reference Type</label>
            <select 
              name="referenceType" 
              value={formData.referenceType} 
              onChange={handleChange} 
              className={styles.input}
            >
              <option value="Adjustment">Manual Adjustment</option>
              <option value="Damaged">Damaged</option>
              <option value="Lost">Lost</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Reason</label>
          <textarea 
            name="reason" 
            value={formData.reason} 
            onChange={handleChange} 
            className={styles.textarea}
            placeholder="Please provide a reason for this adjustment..."
            required
            minLength="5"
          />
        </div>
        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? 'Processing...' : 'Submit Adjustment'}
        </button>
      </form>
    </div>
  );
};
export default InventoryAdjustment;
