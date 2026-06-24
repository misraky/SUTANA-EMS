import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../services/apiClient';
import { RefreshCw, Package, AlertTriangle, CheckCircle } from 'lucide-react';

export default function FarmingStockReport() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/farming/admin/products?include_inactive=false');
      setProducts((res.data || res)?.filter(p => p.is_active !== false) || []);
    } catch (err) {
      setError(err.message || 'Failed to load stock data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const th = { padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc', whiteSpace: 'nowrap' };
  const td = { padding: '10px 12px', color: '#334155', borderBottom: '1px solid #f1f5f9', fontSize: 13 };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '1.5rem 2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={20} color="#166534" /> Stock Overview
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            {products.filter(p => (p.stock_quantity || 0) < (p.reorder_level || 0)).length} low-stock items need attention
          </p>
        </div>
        <button onClick={load} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#166534', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: loading ? 0.6 : 1 }}>
          <RefreshCw size={14} /> {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading stock data...</div>}
      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, color: '#dc2626', fontSize: 13, marginBottom: 16 }}>{error}</div>}

      {!loading && !error && (
        <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={th}>#</th>
                <th style={th}>Product</th>
                <th style={th}>Current Stock</th>
                <th style={th}>Reorder Level</th>
                <th style={th}>Status</th>
                <th style={th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: '#94a3b8', padding: 30 }}>No products found.</td></tr>
              ) : (
                products.map((p, i) => {
                  const qty = p.stock_quantity || 0;
                  const reorder = p.reorder_level || 0;
                  const isLow = qty < reorder;
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', background: isLow ? '#fffbeb' : '#fff' }}>
                      <td style={td}>{i + 1}</td>
                      <td style={{ ...td, fontWeight: 600 }}>{p.name}</td>
                      <td style={{ ...td, fontWeight: 600, color: isLow ? '#dc2626' : '#059669' }}>{qty}</td>
                      <td style={td}>{reorder}</td>
                      <td style={td}>
                        {isLow ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#dc2626', fontWeight: 600, fontSize: 12, background: '#fef2f2', padding: '3px 10px', borderRadius: 20 }}>
                            <AlertTriangle size={12} /> LOW
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#059669', fontWeight: 600, fontSize: 12, background: '#f0fdf4', padding: '3px 10px', borderRadius: 20 }}>
                            <CheckCircle size={12} /> OK
                          </span>
                        )}
                      </td>
                      <td style={td}>
                        {isLow ? (
                          <span style={{ color: '#d97706', fontWeight: 600, fontSize: 12, cursor: 'default' }}>
                            Request Reorder
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
