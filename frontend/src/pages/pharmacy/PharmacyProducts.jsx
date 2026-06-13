import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Image as ImageIcon, Search, Package } from 'lucide-react';
import pharmacyService from '../../services/pharmacyService';
import styles from './PharmacyProducts.module.css';

const PharmacyProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    generic_name: '',
    category_id: '',
    manufacturer: '',
    price: '',
    price_unit: '',
    stock_quantity: 0,
    reorder_level: 10,
    description: '',
    dosage_info: '',
    expiry_date: '',
    is_prescription_required: true,
    is_active: true
  });
  
  const [drugImageFile, setDrugImageFile] = useState(null);
  const [drugImagePreview, setDrugImagePreview] = useState('');
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        pharmacyService.getProducts(),
        pharmacyService.getCategories()
      ]);
      if (prodRes.status === 'success') setProducts(prodRes.data);
      if (catRes.status === 'success') setCategories(catRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      alert('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = async () => {
    try {
      setLoading(true);
      if (searchQuery.trim() === '') {
        const res = await pharmacyService.getProducts();
        setProducts(res.data);
      } else {
        const res = await pharmacyService.searchProducts(searchQuery);
        setProducts(res.data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (product = null) => {
    if (product) {
      setCurrentProduct(product);
      setFormData({
        name: product.name || '',
        generic_name: product.generic_name || '',
        category_id: product.category_id || '',
        manufacturer: product.manufacturer || '',
        price: product.price || '',
        price_unit: product.price_unit || '',
        stock_quantity: product.stock_quantity || 0,
        reorder_level: product.reorder_level || 10,
        description: product.description || '',
        dosage_info: product.dosage_info || '',
        expiry_date: product.expiry_date ? product.expiry_date.substring(0, 10) : '',
        is_prescription_required: product.is_prescription_required === 1 || product.is_prescription_required === true,
        is_active: product.is_active === 1 || product.is_active === true
      });
      setDrugImagePreview(product.drug_image ? `http://localhost:5000${product.drug_image}` : '');
      setCoverImagePreview(product.cover_image ? `http://localhost:5000${product.cover_image}` : '');
    } else {
      setCurrentProduct(null);
      setFormData({
        name: '', generic_name: '', category_id: categories.length > 0 ? categories[0].id : '',
        manufacturer: '', price: '', price_unit: '', stock_quantity: 0, reorder_level: 10,
        description: '', dosage_info: '', expiry_date: '',
        is_prescription_required: true, is_active: true
      });
      setDrugImagePreview('');
      setCoverImagePreview('');
    }
    setDrugImageFile(null);
    setCoverImageFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentProduct(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (type === 'drug') {
        setDrugImageFile(file);
        setDrugImagePreview(URL.createObjectURL(file));
      } else {
        setCoverImageFile(file);
        setCoverImagePreview(URL.createObjectURL(file));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      
      if (drugImageFile) data.append('drug_image', drugImageFile);
      if (coverImageFile) data.append('cover_image', coverImageFile);

      if (currentProduct) {
        await pharmacyService.updateProduct(currentProduct.id, data);
        alert('Product updated successfully');
      } else {
        await pharmacyService.createProduct(data);
        alert('Product created successfully');
      }
      closeModal();
      fetchData();
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to save product');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await pharmacyService.deleteProduct(id);
        fetchData();
      } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete product');
      }
    }
  };

  const filteredProducts = products.filter(p => filterCategory ? p.category_id.toString() === filterCategory : true);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Products Management</h2>
        <button className={styles.addBtn} onClick={() => openModal()}>
          <Plus size={20} /> Add New Product
        </button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={20} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search products..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} className={styles.searchBtn}>Search</button>
        </div>
        
        <div className={styles.filterBox}>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p>Loading products...</p>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Image</th>
                <th>Product Details</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(prod => (
                <tr key={prod.id}>
                  <td>
                    {prod.drug_image ? (
                      <img src={`http://localhost:5000${prod.drug_image}`} alt={prod.name} className={styles.thumbnail} />
                    ) : (
                      <div className={styles.noImage}><Package size={24} /></div>
                    )}
                  </td>
                  <td>
                    <div className={styles.prodName}>{prod.name}</div>
                    <div className={styles.prodGeneric}>{prod.generic_name}</div>
                    <div className={styles.prodManufacturer}>{prod.manufacturer}</div>
                  </td>
                  <td>{prod.category_name}</td>
                  <td>
                    <div className={styles.price}>{prod.price} ETB</div>
                    <div className={styles.priceUnit}>{prod.price_unit}</div>
                  </td>
                  <td>
                    <div className={`${styles.stockBadge} ${
                      prod.stock_quantity === 0 ? styles.outOfStock : 
                      prod.stock_quantity <= prod.reorder_level ? styles.lowStock : styles.inStock
                    }`}>
                      {prod.stock_quantity} in stock
                    </div>
                  </td>
                  <td>
                    <button className={styles.iconBtn} onClick={() => openModal(prod)}><Edit size={18} /></button>
                    <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => handleDelete(prod.id)}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{currentProduct ? 'Edit Product' : 'Add Product'}</h3>
              <button className={styles.closeBtn} onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Product Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className={styles.formGroup}>
                  <label>Generic Name</label>
                  <input type="text" name="generic_name" value={formData.generic_name} onChange={handleInputChange} />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Category *</label>
                  <select name="category_id" value={formData.category_id} onChange={handleInputChange} required className={styles.select}>
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Manufacturer</label>
                  <input type="text" name="manufacturer" value={formData.manufacturer} onChange={handleInputChange} />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Price (ETB) *</label>
                  <input type="number" step="0.01" name="price" value={formData.price} onChange={handleInputChange} required />
                </div>
                <div className={styles.formGroup}>
                  <label>Price Unit (e.g. per strip)</label>
                  <input type="text" name="price_unit" value={formData.price_unit} onChange={handleInputChange} />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Stock Quantity</label>
                  <input type="number" name="stock_quantity" value={formData.stock_quantity} onChange={handleInputChange} />
                </div>
                <div className={styles.formGroup}>
                  <label>Reorder Level</label>
                  <input type="number" name="reorder_level" value={formData.reorder_level} onChange={handleInputChange} />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Drug Image (Product photo)</label>
                  <div className={styles.imageUploadWrapper}>
                    {drugImagePreview && <img src={drugImagePreview} alt="Preview" className={styles.imagePreview} />}
                    <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'drug')} />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Cover Image (Banner style)</label>
                  <div className={styles.imageUploadWrapper}>
                    {coverImagePreview && <img src={coverImagePreview} alt="Preview" className={styles.imagePreview} />}
                    <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'cover')} />
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="2" />
              </div>
              
              <div className={styles.formGroup}>
                <label>Dosage Info</label>
                <textarea name="dosage_info" value={formData.dosage_info} onChange={handleInputChange} rows="2" />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Expiry Date</label>
                  <input type="date" name="expiry_date" value={formData.expiry_date} onChange={handleInputChange} />
                </div>
              </div>

              <div className={styles.checkboxGroup}>
                <label>
                  <input type="checkbox" name="is_prescription_required" checked={formData.is_prescription_required} onChange={handleInputChange} />
                  Prescription Required
                </label>
                <label style={{ marginLeft: '16px' }}>
                  <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} />
                  Active
                </label>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={closeModal}>Cancel</button>
                <button type="submit" className={styles.saveBtn}>Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyProducts;
