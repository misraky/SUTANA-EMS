import React, { useState, useEffect } from 'react';
import inventoryService from '../../services/inventoryService';
import { formatNumber, formatCurrency } from '../../utils/formatters';
import AddProductModal from './AddProductModal';
import styles from './InventoryList.module.css';
const InventoryList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  useEffect(() => {
    fetchInventory();
  }, []);
  const fetchInventory = async () => {
    try {
      const response = await inventoryService.getInventory();
      setItems(response.data?.products || []);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoading(false);
    }
  };
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.sku.toLowerCase().includes(search.toLowerCase())
  );
  if (loading) return <div className={styles.loading}>Checking stock levels...</div>;
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Product Inventory</h2>
          <p className={styles.subtitle}>Track and manage stock levels across all categories</p>
        </div>
        <div className={styles.actions}>
          <input 
            type="text" 
            placeholder="Search by name or SKU..." 
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className={styles.btnPrimary} onClick={() => setIsModalOpen(true)}>
            <i className="icon-plus"></i> Add Product
          </button>
        </div>
      </div>
      <div className={styles.tableContainer}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Unit Cost</th>
              <th>Total Value</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id}>
                <td className={styles.sku}>{item.sku}</td>
                <td>
                  <strong className={styles.productName}>{item.name}</strong>
                  {item.reorder_level >= item.current_stock && (
                    <div className={styles.alertText}>Low Stock Alert</div>
                  )}
                </td>
                <td>{item.category_name}</td>
                <td>
                  <span className={`${styles.stockCount} ${item.current_stock <= item.reorder_level ? styles.low : styles.ok}`}>
                    {formatNumber(item.current_stock)} {item.unit_abbr}
                  </span>
                </td>
                <td>{formatCurrency(item.average_cost)}</td>
                <td>{formatCurrency(item.current_stock * item.average_cost)}</td>
                <td>
                  <span className={`${styles.badge} ${item.current_stock > 0 ? styles.inStock : styles.outOfStock}`}>
                    {item.current_stock > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </td>
                <td>
                  <div className={styles.actionBtns}>
                    <button className={styles.btnIcon} title="Adjust Stock">
                      <i className="icon-sliders"></i>
                    </button>
                    <button className={styles.btnIcon} title="View History">
                      <i className="icon-history"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AddProductModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          setIsModalOpen(false);
          fetchInventory();
        }} 
      />
    </div>
  );
};
export default InventoryList;
