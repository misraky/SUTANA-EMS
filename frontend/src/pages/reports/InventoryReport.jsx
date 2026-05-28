import React, { useState, useEffect } from 'react';
import reportService from '../../services/reportService';
import { formatDate } from '../../utils/formatters';
import styles from './InventoryReport.module.css';
const InventoryReport = () => {
  const [activeTab, setActiveTab] = useState('movements'); 
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  const [filters, setFilters] = useState({
    startDate: firstDay,
    endDate: lastDay,
    transactionType: ''
  });
  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);
  const fetchReport = async () => {
    setLoading(true);
    setData([]);
    try {
      if (activeTab === 'movements') {
        const params = { startDate: filters.startDate, endDate: filters.endDate };
        if (filters.transactionType) params.transactionType = filters.transactionType;
        const res = await reportService.getInventoryMovements(params);
        setData(res.data?.movements || []);
      } else {
        const res = await reportService.getLowStock({ thresholdPercent: 20 });
        setData(res.data?.products || []);
      }
    } catch (err) {
      console.error('Failed to load inventory report', err);
    } finally {
      setLoading(false);
    }
  };
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  const handleGenerate = (e) => {
    e.preventDefault();
    fetchReport();
  };
  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const type = activeTab === 'movements' ? 'inventory' : 'inventory-low-stock';
      const res = await reportService.exportReport('inventory', { 
        format: 'pdf',
        startDate: filters.startDate,
        endDate: filters.endDate
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Inventory_Report_${activeTab}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Inventory Reports</h1>
          <p className={styles.subtitle}>Track stock movements and identify low stock items.</p>
        </div>
        <button 
          className={styles.btnExport} 
          onClick={handleExportPDF}
          disabled={exporting || data.length === 0}
        >
          {exporting ? 'Generating PDF...' : '⬇ Export PDF'}
        </button>
      </div>
      {}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'movements' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('movements')}
        >
          Stock Movements
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'lowStock' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('lowStock')}
        >
          Low Stock Alerts
        </button>
      </div>
      {}
      {activeTab === 'movements' && (
        <div className={styles.filterCard}>
          <form onSubmit={handleGenerate} className={styles.filterForm}>
            <div className={styles.formGroup}>
              <label>Start Date</label>
              <input 
                type="date" 
                name="startDate" 
                value={filters.startDate} 
                onChange={handleFilterChange}
                className={styles.input}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>End Date</label>
              <input 
                type="date" 
                name="endDate" 
                value={filters.endDate} 
                onChange={handleFilterChange}
                className={styles.input}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Transaction Type</label>
              <select 
                name="transactionType" 
                value={filters.transactionType} 
                onChange={handleFilterChange}
                className={styles.select}
              >
                <option value="">All Types</option>
                <option value="Sale">Sale</option>
                <option value="Purchase">Purchase</option>
                <option value="Adjustment">Adjustment</option>
                <option value="Damaged">Damaged/Lost</option>
              </select>
            </div>
            <div className={styles.formAction}>
              <button type="submit" className={styles.btnPrimary} disabled={loading}>
                {loading ? 'Loading...' : 'Generate Report'}
              </button>
            </div>
          </form>
        </div>
      )}
      {}
      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.loadingState}>Fetching inventory data...</div>
        ) : data.length === 0 ? (
          <div className={styles.emptyState}>No records found for the selected criteria.</div>
        ) : activeTab === 'movements' ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} className={styles.row}>
                  <td>{formatDate(row.createdAt)}</td>
                  <td>{row.Product?.name || 'Unknown'}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[row.transactionType] || styles.defaultBadge}`}>
                      {row.transactionType}
                    </span>
                  </td>
                  <td className={row.quantityChange > 0 ? styles.textGreen : styles.textRed}>
                    {row.quantityChange > 0 ? '+' : ''}{row.quantityChange}
                  </td>
                  <td className={styles.remarksCell}>{row.remarks || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Current Stock</th>
                <th>Minimum Required</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} className={styles.row}>
                  <td className={styles.skuCell}>{row.sku}</td>
                  <td>{row.name}</td>
                  <td className={styles.textRed}>{row.stockQuantity}</td>
                  <td>{row.minimumStockLevel}</td>
                  <td>
                    <span className={styles.badgeDanger}>Needs Restock</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
export default InventoryReport;
