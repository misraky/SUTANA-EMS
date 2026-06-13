import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import pharmacyService from '../../services/pharmacyService';
import styles from './PharmacyCategories.module.css';

const PharmacyCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [notification, setNotification] = useState(null); // { message: string, type: 'success' | 'error' }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon_class: '',
    display_order: 0,
    is_active: true
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await pharmacyService.getCategories();
      if (res.status === 'success') {
        setCategories(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      showNotification('Error fetching categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openModal = (category = null) => {
    if (category) {
      setCurrentCategory(category);
      setFormData({
        name: category.name || '',
        description: category.description || '',
        icon_class: category.icon_class || '',
        display_order: category.display_order || 0,
        is_active: category.is_active === 1 || category.is_active === true
      });
      setImagePreview(category.cover_image ? `http://localhost:5000${category.cover_image}` : '');
    } else {
      setCurrentCategory(null);
      setFormData({
        name: '',
        description: '',
        icon_class: '',
        display_order: 0,
        is_active: true
      });
      setImagePreview('');
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentCategory(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      
      if (imageFile) {
        data.append('cover_image', imageFile);
      }

      if (currentCategory) {
        await pharmacyService.updateCategory(currentCategory.id, data);
        showNotification('Category updated successfully');
      } else {
        await pharmacyService.createCategory(data);
        showNotification('Category created successfully');
      }
      closeModal();
      fetchCategories();
    } catch (error) {
      console.error('Submit error:', error);
      showNotification(error.response?.data?.message || 'Failed to save category', 'error');
    }
  };

  const handleDelete = async (id, count) => {
    if (count > 0) {
      showNotification('Cannot delete category containing products', 'error');
      return;
    }
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await pharmacyService.deleteCategory(id);
        fetchCategories();
      } catch (error) {
        console.error('Delete error:', error);
        showNotification('Failed to delete category', 'error');
      }
    }
  };

  return (
    <div className={styles.container}>
      {notification && (
        <div className={`${styles.notification} ${styles[notification.type]}`}>
          {notification.message}
        </div>
      )}
      <div className={styles.header}>
        <h2>Categories Management</h2>
        <button className={styles.addBtn} onClick={() => openModal()}>
          <Plus size={20} /> Add New Category
        </button>
      </div>

      {loading ? (
        <p>Loading categories...</p>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Cover Image</th>
                <th>Category Name</th>
                <th>Products</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id}>
                  <td>
                    {cat.cover_image ? (
                      <img src={`http://localhost:5000${cat.cover_image}`} alt={cat.name} className={styles.thumbnail} />
                    ) : (
                      <div className={styles.noImage}><ImageIcon size={24} /></div>
                    )}
                  </td>
                  <td>
                    <div className={styles.catName}>{cat.name}</div>
                    <div className={styles.catDesc}>{cat.description}</div>
                  </td>
                  <td>{cat.product_count}</td>
                  <td>
                    <span className={cat.is_active ? styles.statusActive : styles.statusInactive}>
                      {cat.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button className={styles.iconBtn} onClick={() => openModal(cat)}><Edit size={18} /></button>
                    <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => handleDelete(cat.id, cat.product_count)}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{currentCategory ? 'Edit Category' : 'Add Category'}</h3>
              <button className={styles.closeBtn} onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Category Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
              </div>
              
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Icon Class (e.g. fa-pills)</label>
                  <input type="text" name="icon_class" value={formData.icon_class} onChange={handleInputChange} />
                </div>
                <div className={styles.formGroup}>
                  <label>Display Order</label>
                  <input type="number" name="display_order" value={formData.display_order} onChange={handleInputChange} />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Cover Image</label>
                <div className={styles.imageUploadWrapper}>
                  {imagePreview && <img src={imagePreview} alt="Preview" className={styles.imagePreview} />}
                  <input type="file" accept="image/*" onChange={handleImageChange} />
                  <small>Recommended: 800x400px, shows category theme</small>
                </div>
              </div>

              <div className={styles.checkboxGroup}>
                <label>
                  <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} />
                  Active
                </label>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={closeModal}>Cancel</button>
                <button type="submit" className={styles.saveBtn}>Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyCategories;
