import React, { useState, useEffect } from 'react';
import inventoryService from '../../services/inventoryService';
import styles from './DamagedLostItems.module.css';
const DamagedLostItems = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    type: 'damaged', 
    quantity: '',
    reason: '',
    photoUrl: ''
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
        productId: parseInt(formData.productId),
        quantity: parseInt(formData.quantity),
        reason: formData.reason,
      };
      if (formData.type === 'damaged') {
        if (formData.photoUrl && formData.photoUrl.trim() !== '') {
          payload.photoUrl = formData.photoUrl.trim();
        }
        await inventoryService.markDamaged(payload);
      } else {
        await inventoryService.markLost(payload);
      }
      setMessage({ type: 'success', text: `Items successfully marked as ${formData.type}!` });
      setFormData({
        productId: '',
        type: 'damaged',
        quantity: '',
        reason: '',
        photoUrl: ''
      });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || `Failed to mark items as ${formData.type}` });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Report Damaged or Lost Items</h2>
        <p className={styles.subtitle}>Record items that are no longer usable or missing from inventory</p>
      </div>
      {message && (
        <div className={`${styles.alert} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Report Type</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input 
                  type="radio" 
                  name="type" 
                  value="damaged" 
                  checked={formData.type === 'damaged'} 
                  onChange={handleChange} 
                />
                <span className={styles.radioText}>Damaged Items</span>
              </label>
              <label className={styles.radioLabel}>
                <input 
                  type="radio" 
                  name="type" 
                  value="lost" 
                  checked={formData.type === 'lost'} 
                  onChange={handleChange} 
                />
                <span className={styles.radioText}>Lost Items</span>
              </label>
            </div>
          </div>
        </div>
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
              <option key={p.id} value={p.id}>
                {p.name} (SKU: {p.sku}) - In Stock: {p.current_stock || 0}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Quantity</label>
          <input 
            type="number" 
            name="quantity" 
            value={formData.quantity} 
            onChange={handleChange} 
            className={styles.input}
            placeholder="Number of items"
            min="1"
            required
          />
        </div>
        {formData.type === 'damaged' && (
          <div className={styles.formGroup}>
            <label className={styles.label}>Photo URL (Optional)</label>
            <input 
              type="url" 
              name="photoUrl" 
              value={formData.photoUrl} 
              onChange={handleChange} 
              className={styles.input}
              placeholder="https://example.com/photo.jpg"
            />
          </div>
        )}
        <div className={styles.formGroup}>
          <label className={styles.label}>Reason / Details</label>
          <textarea 
            name="reason" 
            value={formData.reason} 
            onChange={handleChange} 
            className={styles.textarea}
            placeholder="Explain what happened..."
            required
            minLength="5"
          />
        </div>
        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? 'Processing...' : `Submit ${formData.type === 'damaged' ? 'Damage' : 'Loss'} Report`}
        </button>
      </form>
    </div>
  );
};
export default DamagedLostItems;
