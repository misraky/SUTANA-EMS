import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import inventoryService from '../../services/inventoryService';
import { formatNumber, formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import AddProductModal from './AddProductModal';
import { Package, AlertTriangle, XCircle, DollarSign, Calendar, TrendingUp, Plus, Search, ArrowLeft, Clock } from 'lucide-react';
import styles from './InventoryList.module.css';

const KPI_ITEMS = [
  { key: 'totalProducts', icon: Package, label: 'Total Products', color: '#3b82f6', bg: '#eff6ff', desc: 'Active SKUs in catalogue', sectionTitle: 'All Products' },
  { key: 'lowStockCount', icon: AlertTriangle, label: 'Low Stock Alerts', color: '#f59e0b', bg: '#fffbeb', desc: 'Items at or below reorder level', sectionTitle: 'Low Stock Items' },
  { key: 'outOfStockCount', icon: XCircle, label: 'Out of Stock', color: '#ef4444', bg: '#fef2f2', desc: 'Items with zero quantity', sectionTitle: 'Out of Stock Items' },
  { key: 'totalInventoryValue', icon: DollarSign, label: 'Total Inventory Value', color: '#10b981', bg: '#ecfdf5', desc: 'Current stock valuation', isCurrency: true, sectionTitle: 'Inventory Value Breakdown' },
  { key: 'expiringCount', icon: Calendar, label: 'Expiring Soon', color: '#8b5cf6', bg: '#f5f3ff', desc: 'Items expiring within 30 days', sectionTitle: 'Expiring Products' },
  { key: 'recentMovements', icon: TrendingUp, label: 'Movements (7 days)', color: '#06b6d4', bg: '#ecfeff', desc: 'Stock transactions this week', sectionTitle: 'Recent Movements' },
];

const InventoryList = () => {
  const [items, setItems] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [expiringItems, setExpiringItems] = useState([]);
  const [movements, setMovements] = useState([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [expiringLoading, setExpiringLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const [lastUpdated, setLastUpdated] = useState('');
  const [selectedKpi, setSelectedKpi] = useState(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchInventory(), fetchStatistics(), fetchLowStock()]);
    setLoading(false);
    setLastUpdated(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  };

  const fetchInventory = async () => {
    try {
      const response = await inventoryService.getInventory();
      setItems(response?.data?.products || response?.products || []);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await inventoryService.getStatistics();
      setStats(response?.data || null);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const fetchLowStock = async () => {
    try {
      const response = await inventoryService.getLowStock();
      setLowStockItems(response?.data?.products || response?.products || []);
    } catch (error) {
      console.error('Failed to fetch low stock:', error);
    }
  };

  const fetchExpiring = async () => {
    if (expiringItems.length > 0) return;
    setExpiringLoading(true);
    try {
      const response = await inventoryService.getExpiringProducts();
      setExpiringItems(response?.data?.products || response?.products || []);
    } catch (error) {
      console.error('Failed to fetch expiring products:', error);
    } finally {
      setExpiringLoading(false);
    }
  };

  const fetchRecentMovements = async () => {
    if (movements.length > 0) return;
    setMovementsLoading(true);
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const response = await inventoryService.getMovements({ startDate, endDate, limit: 50 });
      setMovements(response?.data?.movements || response?.movements || []);
    } catch (error) {
      console.error('Failed to fetch movements:', error);
    } finally {
      setMovementsLoading(false);
    }
  };

  const handleKpiClick = (key) => {
    if (selectedKpi === key) {
      setSelectedKpi(null);
      return;
    }
    setSelectedKpi(key);
    if (key === 'expiringCount') fetchExpiring();
    if (key === 'recentMovements') fetchRecentMovements();
  };

  const outOfStockItems = items.filter(i => i.current_stock <= 0);

  if (loading) return <div className={styles.loading}>Checking stock levels...</div>;

  const renderDetailSection = () => {
    if (!selectedKpi) return null;

    const kpi = KPI_ITEMS.find(k => k.key === selectedKpi);
    if (!kpi) return null;

    return (
      <div className={styles.detailSection}>
        <div className={styles.detailHeader}>
          <div className={styles.detailHeaderLeft}>
            <button className={styles.backBtn} onClick={() => setSelectedKpi(null)}><ArrowLeft size={16} /></button>
            <h3 className={styles.detailTitle}>{kpi.sectionTitle}</h3>
          </div>
          {(selectedKpi === 'totalProducts' || selectedKpi === 'outOfStockCount') && (
            <div className={styles.detailSearchWrap}>
              <Search size={14} className={styles.detailSearchIcon} />
              <input type="text" placeholder="Search..." className={styles.detailSearchInput} value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          )}
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                {selectedKpi === 'totalProducts' && (
                  <>
                    <th>SKU</th><th>Product</th><th>Category</th><th>Current Stock</th><th>Unit</th><th>Status</th>
                  </>
                )}
                {selectedKpi === 'lowStockCount' && (
                  <>
                    <th>SKU</th><th>Product</th><th>Category</th><th>Current Stock</th><th>Reorder Level</th><th>Status</th>
                  </>
                )}
                {selectedKpi === 'outOfStockCount' && (
                  <>
                    <th>SKU</th><th>Product</th><th>Category</th><th>Current Stock</th><th>Unit</th>
                  </>
                )}
                {selectedKpi === 'totalInventoryValue' && (
                  <>
                    <th>SKU</th><th>Product</th><th>Current Stock</th><th>Unit Cost</th><th>Stock Value</th>
                  </>
                )}
                {selectedKpi === 'expiringCount' && (
                  <>
                    <th>SKU</th><th>Product</th><th>Expiry Date</th><th>Current Stock</th><th>Days Left</th>
                  </>
                )}
                {selectedKpi === 'recentMovements' && (
                  <>
                    <th>Date</th><th>Product</th><th>SKU</th><th>Type</th><th>Change</th><th>After</th><th>By</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {selectedKpi === 'totalProducts' && renderTotalProducts()}
              {selectedKpi === 'lowStockCount' && renderLowStockDetail()}
              {selectedKpi === 'outOfStockCount' && renderOutOfStock()}
              {selectedKpi === 'totalInventoryValue' && renderInventoryValue()}
              {selectedKpi === 'expiringCount' && renderExpiringDetail()}
              {selectedKpi === 'recentMovements' && renderMovementsDetail()}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderTotalProducts = () => {
    const filtered = search
      ? items.filter(i => i.name?.toLowerCase().includes(search.toLowerCase()) || i.sku?.toLowerCase().includes(search.toLowerCase()))
      : items;
    if (filtered.length === 0) return <tr><td colSpan={6} className={styles.emptyState}>No products found</td></tr>;
    return filtered.map(item => (
      <tr key={item.id}>
        <td><span className={styles.sku}>{item.sku}</span></td>
        <td><strong className={styles.productName}>{item.name}</strong></td>
        <td className={styles.categoryCell}>{item.category_name || '—'}</td>
        <td>
          <span className={`${styles.stockCount} ${item.current_stock <= 0 ? styles.low : item.current_stock <= item.reorder_level ? styles.warning : ''}`}>
            {formatNumber(item.current_stock)} <span className={styles.unit}>{item.unit_abbr || item.unit || 'box'}</span>
          </span>
        </td>
        <td className={styles.categoryCell}>{item.unit_abbr || item.unit || '—'}</td>
        <td>
          <span className={`${styles.badge} ${item.current_stock <= 0 ? styles.outOfStock : item.current_stock <= item.reorder_level ? styles.lowStock : styles.inStock}`}>
            {item.current_stock <= 0 ? 'Out of Stock' : item.current_stock <= item.reorder_level ? 'Low Stock' : 'In Stock'}
          </span>
        </td>
      </tr>
    ));
  };

  const renderLowStockDetail = () => {
    if (lowStockItems.length === 0) return <tr><td colSpan={6} className={styles.emptyState}>No low stock items</td></tr>;
    return lowStockItems.map(item => (
      <tr key={item.id}>
        <td><span className={styles.sku}>{item.sku}</span></td>
        <td><strong className={styles.productName}>{item.name}</strong></td>
        <td className={styles.categoryCell}>{item.category_name || '—'}</td>
        <td>
          <span className={`${styles.stockCount} ${item.current_stock <= 0 ? styles.low : styles.warning}`}>
            {formatNumber(item.current_stock)} <span className={styles.unit}>{item.unit || 'box'}</span>
          </span>
        </td>
        <td><span className={styles.reorderLevel}>{formatNumber(item.reorder_level)} <span className={styles.unit}>{item.unit || 'box'}</span></span></td>
        <td>
          <span className={`${styles.badge} ${item.current_stock <= 0 ? styles.outOfStock : styles.lowStock}`}>
            {item.current_stock <= 0 ? 'Out of Stock' : 'Low Stock'}
          </span>
        </td>
      </tr>
    ));
  };

  const renderOutOfStock = () => {
    const filtered = search
      ? outOfStockItems.filter(i => i.name?.toLowerCase().includes(search.toLowerCase()) || i.sku?.toLowerCase().includes(search.toLowerCase()))
      : outOfStockItems;
    if (filtered.length === 0) return <tr><td colSpan={5} className={styles.emptyState}>No out of stock items</td></tr>;
    return filtered.map(item => (
      <tr key={item.id}>
        <td><span className={styles.sku}>{item.sku}</span></td>
        <td><strong className={styles.productName}>{item.name}</strong></td>
        <td className={styles.categoryCell}>{item.category_name || '—'}</td>
        <td><span className={`${styles.stockCount} ${styles.low}`}>{formatNumber(item.current_stock)}</span></td>
        <td className={styles.categoryCell}>{item.unit_abbr || item.unit || '—'}</td>
      </tr>
    ));
  };

  const renderInventoryValue = () => {
    if (items.length === 0) return <tr><td colSpan={5} className={styles.emptyState}>No products</td></tr>;
    return items.map(item => {
      const unitCost = item.average_cost || 0;
      const stockValue = (item.current_stock || 0) * unitCost;
      return (
        <tr key={item.id}>
          <td><span className={styles.sku}>{item.sku}</span></td>
          <td><strong className={styles.productName}>{item.name}</strong></td>
          <td><span className={styles.stockCount}>{formatNumber(item.current_stock)}</span></td>
          <td>{formatCurrency(unitCost)}</td>
          <td><strong>{formatCurrency(stockValue)}</strong></td>
        </tr>
      );
    });
  };

  const renderExpiringDetail = () => {
    if (expiringLoading) return <tr><td colSpan={5} className={styles.emptyState}>Loading...</td></tr>;
    if (expiringItems.length === 0) return <tr><td colSpan={5} className={styles.emptyState}>No expiring products</td></tr>;
    return expiringItems.map(item => (
      <tr key={item.id}>
        <td><span className={styles.sku}>{item.sku}</span></td>
        <td><strong className={styles.productName}>{item.name}</strong></td>
        <td>{formatDate(item.expiry_date, 'short')}</td>
        <td><span className={styles.stockCount}>{formatNumber(item.current_stock)} <span className={styles.unit}>{item.unit || 'box'}</span></span></td>
        <td>
          <span className={`${styles.daysBadge} ${item.days_until_expiry <= 7 ? styles.critical : styles.warningDays}`}>
            {item.days_until_expiry} days
          </span>
        </td>
      </tr>
    ));
  };

  const renderMovementsDetail = () => {
    if (movementsLoading) return <tr><td colSpan={7} className={styles.emptyState}>Loading...</td></tr>;
    if (movements.length === 0) return <tr><td colSpan={7} className={styles.emptyState}>No movements in the last 7 days</td></tr>;
    return movements.map(m => (
      <tr key={m.id}>
        <td className={styles.categoryCell}>{formatDateTime(m.created_at)}</td>
        <td><strong className={styles.productName}>{m.product_name}</strong></td>
        <td><span className={styles.sku}>{m.sku}</span></td>
        <td><span className={`${styles.movementType} ${m.quantity_change > 0 ? styles.typeIn : styles.typeOut}`}>{m.transaction_type}</span></td>
        <td>
          <span className={m.quantity_change > 0 ? styles.changeIn : styles.changeOut}>
            {m.quantity_change > 0 ? '+' : ''}{formatNumber(m.quantity_change)}
          </span>
        </td>
        <td>{formatNumber(m.quantity_after)}</td>
        <td className={styles.categoryCell}>{m.performed_by_name || '—'}</td>
      </tr>
    ));
  };

  const getKpiCount = (key) => {
    if (key === 'outOfStockCount') return outOfStockItems.length;
    if (key === 'totalProducts') return items.length;
    return stats ? stats[key] : 0;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Inventory Overview</h2>
          <p className={styles.subtitle}>Real-time status of inventory levels, stock adjustments and approvals</p>
          <p className={styles.updated}>Last Updated: {lastUpdated}</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.btnOutline} onClick={loadAll}><Clock size={14} /> Refresh</button>
          <button className={styles.btnPrimary} onClick={() => setIsModalOpen(true)}><Plus size={15} /> Add Product</button>
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
                    <button 
                      className={styles.btnIcon} 
                      title="Reorder"
                      onClick={() => navigate(`/store/reorder?sku=${item.sku}`)}
                      style={{ color: '#0ea5e9' }}
                    >
                      <i className="icon-shopping-cart"></i>
                    </button>
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

      <div className={styles.kpiGrid}>
        {KPI_ITEMS.map(kpi => {
          const val = getKpiCount(kpi.key);
          const Icon = kpi.icon;
          const isSelected = selectedKpi === kpi.key;
          return (
            <div key={kpi.key} className={`${styles.kpiCard} ${isSelected ? styles.kpiCardSelected : ''}`} style={{ '--accent': kpi.color, '--accent-bg': kpi.bg }} onClick={() => handleKpiClick(kpi.key)} tabIndex={0} role="button" onKeyDown={e => e.key === 'Enter' && handleKpiClick(kpi.key)}>
              <div className={styles.kpiIcon} style={{ background: kpi.bg, color: kpi.color }}><Icon size={20} /></div>
              <div className={styles.kpiBody}>
                <span className={styles.kpiValue}>{kpi.isCurrency ? formatCurrency(val) : formatNumber(val)}</span>
                <span className={styles.kpiLabel}>{kpi.label}</span>
                <span className={styles.kpiDesc}>{kpi.desc}</span>
              </div>
            </div>
          );
        })}
      </div>

      {renderDetailSection()}

      <AddProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => { setIsModalOpen(false); loadAll(); }} />
    </div>
  );
};

export default InventoryList;
