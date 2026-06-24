import React, { useState, useEffect } from 'react';
import inventoryService from '../../services/inventoryService';
import { formatNumber } from '../../utils/formatters';

const PAGE_SIZE = 20;

const CycleCounting = () => {
  const [products, setProducts] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState({
    totalCounted: 0, withVariance: 0, zeroCounted: 0
  });

  useEffect(() => {
    loadProducts();
  }, [categoryFilter, page]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await inventoryService.getInventory({
        limit: 200,
        ...(categoryFilter ? { categoryId: categoryFilter } : {})
      });
      setProducts(res.data?.products || []);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load products' });
    } finally {
      setLoading(false);
    }
  };

  const handleCountChange = (productId, value) => {
    const qty = value === '' ? '' : parseInt(value) || 0;
    setCounts(prev => {
      const next = { ...prev, [productId]: qty };
      const entries = Object.entries(next).filter(([, v]) => v !== '' && v !== undefined);
      const totalCounted = entries.length;
      const withVariance = entries.filter(([id, v]) => {
        const p = products.find(pr => pr.id === parseInt(id));
        return p && parseInt(v) !== (p.current_stock || 0);
      }).length;
      const zeroCounted = entries.filter(([, v]) => v === 0 || v === '0').length;
      setStats({ totalCounted, withVariance, zeroCounted });
      return next;
    });
  };

  const submitCounts = async () => {
    const entries = Object.entries(counts).filter(([, v]) => v !== '' && v !== undefined);
    if (entries.length === 0) return;
    setSaving(true);
    setMessage(null);
    let success = 0;
    let errors = 0;
    for (const [productId, countedQuantity] of entries) {
      try {
        await inventoryService.recordCount({
          productId: parseInt(productId),
          countedQuantity: parseInt(countedQuantity)
        });
        success++;
      } catch {
        errors++;
      }
    }
    setMessage({
      type: errors === 0 ? 'success' : 'warning',
      text: `${success} product(s) counted successfully.${errors ? ` ${errors} failed.` : ''}`
    });
    setCounts({});
    setStats({ totalCounted: 0, withVariance: 0, zeroCounted: 0 });
    loadProducts();
    setSaving(false);
  };

  const paginatedProducts = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(products.length / PAGE_SIZE);

  const getVarianceColor = (productId) => {
    const p = products.find(pr => pr.id === productId);
    if (!p || counts[productId] === '' || counts[productId] === undefined) return null;
    const diff = parseInt(counts[productId]) - (p.current_stock || 0);
    if (diff === 0) return null;
    return diff > 0 ? '#059669' : '#dc2626';
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading products...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cycle Counting</h1>
          <p className="page-subtitle">Record physical inventory counts and track variances</p>
        </div>
      </div>

      {message && (
        <div style={{
          padding: '12px 16px', borderRadius: '8px', marginBottom: '16px',
          background: message.type === 'success' ? '#d1fae5' : message.type === 'warning' ? '#fef3c7' : '#fee2e2',
          color: message.type === 'success' ? '#065f46' : message.type === 'warning' ? '#92400e' : '#991b1b',
          border: `1px solid ${message.type === 'success' ? '#a7f3d0' : message.type === 'warning' ? '#fde68a' : '#fecaca'}`
        }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Products Counted', value: stats.totalCounted, color: '#2563eb' },
          { label: 'With Variance', value: stats.withVariance, color: stats.withVariance > 0 ? '#dc2626' : '#059669' },
          { label: 'Zero Counted', value: stats.zeroCounted, color: '#f59e0b' },
          { label: 'Total Products', value: products.length, color: '#64748b' }
        ].map(s => (
          <div key={s.label} className="stat-card">
            <span className="stat-label">{s.label}</span>
            <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>Products</span>
            <input type="text" placeholder="Filter by category ID..."
              value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db', width: '160px', fontSize: '0.875rem' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Page {page} of {totalPages || 1}
            </span>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #d1d5db', background: '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>
              Prev
            </button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #d1d5db', background: '#fff', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}>
              Next
            </button>
            <button onClick={submitCounts} disabled={saving || stats.totalCounted === 0}
              style={{
                padding: '8px 20px', borderRadius: '6px', border: 'none',
                background: stats.totalCounted === 0 ? '#d1d5db' : '#059669',
                color: '#fff', fontWeight: 600, cursor: stats.totalCounted === 0 ? 'not-allowed' : 'pointer'
              }}>
              {saving ? 'Saving...' : `Submit Counts (${stats.totalCounted})`}
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left' }}>SKU</th>
                <th style={{ padding: '10px 16px', textAlign: 'left' }}>Product</th>
                <th style={{ padding: '10px 16px', textAlign: 'center' }}>System Qty</th>
                <th style={{ padding: '10px 16px', textAlign: 'center' }}>Counted Qty</th>
                <th style={{ padding: '10px 16px', textAlign: 'center' }}>Variance</th>
                <th style={{ padding: '10px 16px', textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map(p => {
                const counted = counts[p.id];
                const hasCount = counted !== '' && counted !== undefined;
                const systemQty = p.current_stock || 0;
                const variance = hasCount ? parseInt(counted) - systemQty : null;
                const isMatch = variance === 0;
                return (
                  <tr key={p.id} style={{
                    borderBottom: '1px solid #f1f5f9',
                    background: hasCount ? (isMatch ? '#f0fdf4' : '#fef2f2') : 'transparent'
                  }}>
                    <td style={{ padding: '10px 16px', color: '#64748b' }}>{p.sku}</td>
                    <td style={{ padding: '10px 16px', fontWeight: 500 }}>{p.name}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'center' }}>{formatNumber(systemQty)}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                      <input type="number" min="0"
                        value={counts[p.id] !== undefined ? counts[p.id] : ''}
                        onChange={e => handleCountChange(p.id, e.target.value)}
                        placeholder="Enter count"
                        style={{
                          width: '80px', padding: '6px 8px', textAlign: 'center',
                          borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.875rem'
                        }}
                      />
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600, color: getVarianceColor(p.id) || '#64748b' }}>
                      {variance !== null ? (variance > 0 ? `+${variance}` : variance === 0 ? '0' : variance) : '—'}
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                      {hasCount ? (
                        <span style={{
                          display: 'inline-block', padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                          background: isMatch ? '#d1fae5' : '#fee2e2',
                          color: isMatch ? '#065f46' : '#991b1b'
                        }}>
                          {isMatch ? 'Match' : 'Variance'}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Not counted</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CycleCounting;
