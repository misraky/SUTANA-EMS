import React, { useState, useEffect, useCallback } from 'react';
import ceoService from '../../services/ceoService';
import styles from './ExecutiveReports.module.css';

const formatNumber = (num) => new Intl.NumberFormat('en-US').format(num || 0);
const formatCurrency = (num) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB', minimumFractionDigits: 2 }).format(num || 0);

const CEOInventoryReport = () => {
  const [stockData, setStockData] = useState(null);
  const [movementData, setMovementData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' | 'movements'

  // Movement filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [transactionType, setTransactionType] = useState('');

  const fetchStock = useCallback(async () => {
    const res = await ceoService.getCurrentStock();
    setStockData(res.data);
  }, []);

  const fetchMovements = useCallback(async () => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (transactionType) params.transactionType = transactionType;
    const res = await ceoService.getInventoryMovements(params);
    setMovementData(res.data);
  }, [startDate, endDate, transactionType]);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([fetchStock(), fetchMovements()]);
    } catch (err) {
      console.error('Failed to fetch inventory report:', err);
      setError('Failed to load inventory report data.');
    } finally {
      setLoading(false);
    }
  }, [fetchStock, fetchMovements]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDownloadStock = () => {
    if (!stockData?.products?.length) return;
    const headers = ['Product', 'SKU', 'Category', 'Current Stock', 'Reorder Level', 'Unit Cost', 'Selling Price', 'Stock Value', 'Status'];
    const rows = stockData.products.map(p => [
      `"${p.name}"`, p.sku, `"${p.category || ''}"`,
      p.current_stock, p.reorder_level,
      parseFloat(p.unit_cost).toFixed(2), parseFloat(p.selling_price).toFixed(2),
      (parseFloat(p.current_stock) * parseFloat(p.unit_cost)).toFixed(2),
      p.current_stock === 0 ? 'Out of Stock' : (p.reorder_level > 0 && p.current_stock <= p.reorder_level) ? 'Low Stock' : 'OK'
    ]);
    const csv = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `current_stock_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleDownloadMovements = () => {
    if (!movementData?.movements?.length) return;
    const headers = ['Date', 'Product', 'SKU', 'Type', 'Qty Change', 'Before', 'After', 'Reason', 'Performed By'];
    const rows = movementData.movements.map(m => [
      new Date(m.created_at).toLocaleString(),
      `"${m.product_name || ''}"`, m.sku || '',
      m.transaction_type, m.quantity_change, m.quantity_before, m.quantity_after,
      `"${m.reason || ''}"`, `"${m.performed_by_name || ''}"`
    ]);
    const csv = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `inventory_movements_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const stockSummary = stockData?.summary || {};
  const movSummary = movementData?.summary || {};
  const products = stockData?.products || [];
  const movements = movementData?.movements || [];

  return (
    <div className={styles.reportsContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Inventory Report</h1>
          <p className={styles.subtitle}>Real-time stock levels and full movement history</p>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.exportBtn}
            onClick={activeTab === 'stock' ? handleDownloadStock : handleDownloadMovements}
          >
            ⬇ Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Compiling inventory report...</p>
        </div>
      ) : error ? (
        <div className={styles.errorState}>
          <p>{error}</p>
          <button onClick={fetchAll} className={styles.retryBtn}>Retry</button>
        </div>
      ) : (
        <>
          {/* KPI Summary Row */}
          <div className={styles.section}>
            <div className={styles.summaryGrid} style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
              <div className={styles.summaryCard}>
                <h3>Total Products</h3>
                <div className={styles.value}>{formatNumber(stockSummary.totalProducts)}</div>
              </div>
              <div className={styles.summaryCard}>
                <h3>Stock (Cost) Value</h3>
                <div className={styles.value} style={{ fontSize: '15px' }}>{formatCurrency(stockSummary.totalStockValue)}</div>
              </div>
              <div className={styles.summaryCard}>
                <h3>Stock (Sell) Value</h3>
                <div className={styles.value} style={{ fontSize: '15px' }}>{formatCurrency(stockSummary.totalSellingValue)}</div>
              </div>
              <div className={styles.summaryCard}>
                <h3>Low Stock Items</h3>
                <div className={styles.value} style={{ color: stockSummary.lowStockCount > 0 ? '#F59E0B' : '#10B981' }}>
                  {formatNumber(stockSummary.lowStockCount)}
                </div>
              </div>
              <div className={styles.summaryCard}>
                <h3>Total Inflow</h3>
                <div className={styles.value} style={{ color: '#10B981' }}>+{formatNumber(movSummary.totalIn)}</div>
              </div>
              <div className={styles.summaryCard}>
                <h3>Total Outflow</h3>
                <div className={styles.value} style={{ color: '#EF4444' }}>-{formatNumber(movSummary.totalOut)}</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: '#f1f5f9', borderRadius: '8px', padding: '4px', width: 'fit-content' }}>
            <button
              className={`${styles.periodBtn} ${activeTab === 'stock' ? styles.active : ''}`}
              onClick={() => setActiveTab('stock')}
            >
              📦 Current Stock Levels
            </button>
            <button
              className={`${styles.periodBtn} ${activeTab === 'movements' ? styles.active : ''}`}
              onClick={() => setActiveTab('movements')}
            >
              🔄 Movement History
            </button>
          </div>

          {/* Stock Levels Tab */}
          {activeTab === 'stock' && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Current Stock Levels</h2>
              <div className={styles.tableContainer}>
                <table className={styles.reportTable}>
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>SKU</th>
                      <th>Category</th>
                      <th>Current Stock</th>
                      <th>Reorder Level</th>
                      <th>Unit Cost</th>
                      <th>Selling Price</th>
                      <th>Stock Value</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length > 0 ? products.map((p, idx) => {
                      const isOut = p.current_stock === 0;
                      const isLow = !isOut && p.reorder_level > 0 && p.current_stock <= p.reorder_level;
                      const stockValue = parseFloat(p.current_stock) * parseFloat(p.unit_cost || 0);
                      return (
                        <tr key={p.id || idx}>
                          <td className={styles.deptName}>{p.name}</td>
                          <td>{p.sku}</td>
                          <td>{p.category || '-'}</td>
                          <td className={isOut ? styles.negativeText : isLow ? '' : styles.positiveText} style={{ fontWeight: 600 }}>
                            {formatNumber(p.current_stock)}
                          </td>
                          <td>{p.reorder_level > 0 ? formatNumber(p.reorder_level) : '-'}</td>
                          <td>{formatCurrency(p.unit_cost)}</td>
                          <td>{formatCurrency(p.selling_price)}</td>
                          <td className={styles.valueCell}>{formatCurrency(stockValue)}</td>
                          <td>
                            {isOut ? (
                              <span className={`${styles.badge} ${styles.significant}`}>Out of Stock</span>
                            ) : isLow ? (
                              <span className={`${styles.badge} ${styles.moderate}`}>Low Stock</span>
                            ) : (
                              <span className={`${styles.badge} ${styles.ontarget}`}>In Stock</span>
                            )}
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan="9" className={styles.emptyCell}>No products found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Movements Tab */}
          {activeTab === 'movements' && (
            <div className={styles.section}>
              {/* Filters */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className={styles.periodBtn} style={{ border: '1px solid #e2e8f0', background: 'white' }} />
                <span style={{ color: '#64748b' }}>to</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  className={styles.periodBtn} style={{ border: '1px solid #e2e8f0', background: 'white' }} />
                <select value={transactionType} onChange={e => setTransactionType(e.target.value)}
                  className={styles.periodBtn} style={{ border: '1px solid #e2e8f0', background: 'white' }}>
                  <option value="">All Types</option>
                  <option value="Purchase">Purchase</option>
                  <option value="Sale">Sale</option>
                  <option value="Adjustment">Adjustment</option>
                  <option value="Damaged">Damaged</option>
                </select>
                <button className={styles.exportBtn} onClick={fetchMovements} style={{ padding: '6px 14px' }}>
                  🔍 Filter
                </button>
              </div>

              <h2 className={styles.sectionTitle}>Movement History</h2>
              <div className={styles.tableContainer}>
                <table className={styles.reportTable}>
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Type</th>
                      <th>Qty Change</th>
                      <th>Before → After</th>
                      <th>Reason</th>
                      <th>Performed By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.length > 0 ? movements.map((m, idx) => (
                      <tr key={m.id || idx}>
                        <td>{new Date(m.created_at).toLocaleString()}</td>
                        <td className={styles.deptName}>{m.product_name}</td>
                        <td>{m.sku}</td>
                        <td>
                          <span className={`${styles.badge} ${
                            m.transaction_type === 'Purchase' ? styles.ontarget
                            : m.transaction_type === 'Damaged' ? styles.significant
                            : m.transaction_type === 'Sale' ? styles.exceeding
                            : styles.upcoming
                          }`}>
                            {m.transaction_type}
                          </span>
                        </td>
                        <td className={m.quantity_change > 0 ? styles.positiveText : styles.negativeText}>
                          {m.quantity_change > 0 ? '+' : ''}{m.quantity_change}
                        </td>
                        <td style={{ color: '#64748b' }}>{formatNumber(m.quantity_before)} → {formatNumber(m.quantity_after)}</td>
                        <td>{m.reason || '-'}</td>
                        <td>{m.performed_by_name || '-'}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="8" className={styles.emptyCell}>No movements found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CEOInventoryReport;
