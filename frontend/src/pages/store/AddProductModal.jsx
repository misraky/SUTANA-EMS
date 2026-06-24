import React, { useState, useEffect } from 'react';
import inventoryService from '../../services/inventoryService';
import { Plus, X } from 'lucide-react';
import styles from './AddProductModal.module.css';

const AddProductModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    categoryId: '',
    unitId: '',
    unitCost: '',
    sellingPrice: '',
    reorderLevel: '0',
    expiryDate: '',
    requiresSerial: false
    name: '', sku: '', categoryId: '', unitId: '', sellingPrice: '',
    reorderLevel: '0', currentStock: '', expiryDate: '', requiresSerial: false
  });
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    if (isOpen) { fetchLookupData(); setError(null); }
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
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const res = await inventoryService.addCategory({ name: newCategoryName.trim() });
      setCategories(prev => [...prev, { id: res.data?.categoryId, name: newCategoryName.trim(), is_active: true }]);
      setFormData(prev => ({ ...prev, categoryId: res.data?.categoryId }));
      setNewCategoryName('');
      setAddingCategory(false);
    } catch (err) {
      setError(err.message || 'Failed to add category');
    }
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
        unitCost: formData.unitCost ? parseFloat(formData.unitCost) : 0,
        sellingPrice: parseFloat(formData.sellingPrice),
        sellingPrice: parseFloat(formData.sellingPrice) || 0,
        reorderLevel: parseInt(formData.reorderLevel) || 0,
        currentStock: parseInt(formData.currentStock) || 0,
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
        unitCost: '', sellingPrice: '', reorderLevel: '0', expiryDate: '', requiresSerial: false
      });
      setSuccess('Product added successfully');
      setTimeout(() => { setSuccess(null); onSuccess(); setFormData({ name: '', sku: '', categoryId: '', unitId: '', sellingPrice: '', reorderLevel: '0', currentStock: '', expiryDate: '', requiresSerial: false }); }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to add product');
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
                <input type="text" name="name" value={formData.name} onChange={handleChange} className={styles.input} required placeholder="e.g. A4 Printer Paper" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>SKU</label>
                <input type="text" name="sku" value={formData.sku} onChange={handleChange} className={styles.input} required placeholder="e.g. PAP-A4-01" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Category</label>
                {addingCategory ? (
                  <div className={styles.inlineAddWrap}>
                    <input type="text" placeholder="New category name..." value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className={styles.input} autoFocus />
                    <button type="button" onClick={handleAddCategory} className={styles.inlineAddBtn}><Plus size={14} /> Add</button>
                    <button type="button" onClick={() => { setAddingCategory(false); setNewCategoryName(''); }} className={styles.inlineCancelBtn}><X size={14} /></button>
                  </div>
                ) : (
                  <div className={styles.categoryWrap}>
                    <select name="categoryId" value={formData.categoryId} onChange={handleChange} className={styles.select} required>
                      <option value="">Select Category</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => setAddingCategory(true)} className={styles.addCatBtn} title="Add new category"><Plus size={14} /></button>
                  </div>
                )}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Unit of Measurement</label>
                <select name="unitId" value={formData.unitId} onChange={handleChange} className={styles.select} required>
                  <option value="">Select Unit</option>
                  {units.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>
                  ))}
                </select>
              </div>
                <div className={styles.formGroup}>
                <label className={styles.label}>Unit Cost</label>
                <input 
                  type="number" 
                  step="0.01" 
                  name="unitCost" 
                  value={formData.unitCost} 
                  onChange={handleChange} 
                  className={styles.input} 
                  placeholder="0.00"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Selling Price</label>
                <input type="number" step="0.01" name="sellingPrice" value={formData.sellingPrice} onChange={handleChange} className={styles.input} required placeholder="0.00" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Reorder Level</label>
                <input type="number" name="reorderLevel" value={formData.reorderLevel} onChange={handleChange} className={styles.input} required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Current Stock</label>
                <input type="number" min="0" name="currentStock" value={formData.currentStock} onChange={handleChange} className={styles.input} placeholder="0" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Expiry Date (Optional)</label>
                <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} className={styles.input} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.checkLabel}>
                  <input type="checkbox" name="requiresSerial" checked={formData.requiresSerial} onChange={handleChange} />
                  Requires Serial Number Tracking
                </label>
              </div>
            </div>
          </div>
          <div className={styles.modalFooter}>
            {success && <div className={styles.successToast}>{success}</div>}
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.submitBtn} disabled={loading || success}>
              {loading ? 'Adding...' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
