import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/apiClient';
import { Search, RefreshCw, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

const STATUSES = ['', 'received', 'in_progress', 'quality_check', 'ready', 'delivered', 'cancelled'];

const statusBadge = (code) => {
  const colors = { received: '#9CA3AF', in_progress: '#3B82F6', quality_check: '#F59E0B', ready: '#10B981', delivered: '#059669', cancelled: '#EF4444' };
  return { background: (colors[code] || '#6B7280') + '20', color: colors[code] || '#6B7280' };
};

const PrintingOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', search: '', page: 1 });

  const load = async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: 25 };
      if (filter.status) params.status = filter.status;
      if (filter.search) params.search = filter.search;
      const res = await axios.get('/printing/orders', { params });
      if (res.status === 'success') {
        setOrders(res.data?.orders || []);
        setPagination(res.data?.pagination || { page: 1, total: 0, totalPages: 0 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(filter.page); }, [filter.page]);

  const handleSearch = () => { setFilter(f => ({ ...f, page: 1 })); load(1); };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, color: '#1e293b' }}>All Orders</h2>
        <button onClick={() => load(filter.page)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', color: '#475569', fontSize: 13 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0 12px', flex: 1, minWidth: 200 }}>
          <Search size={16} color="#94a3b8" />
          <input
            value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search by order # or customer..."
            style={{ border: 'none', outline: 'none', padding: '10px 10px', flex: 1, fontSize: 13, background: 'transparent' }}
          />
        </div>
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value, page: 1 }))}
          style={{ padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: 'white', color: '#475569' }}>
          <option value="">All Statuses</option>
          {STATUSES.filter(Boolean).map(s => (
            <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p style={{ color: '#64748b' }}>Loading orders...</p>
      ) : orders.length === 0 ? (
        <p style={{ color: '#94a3b8' }}>No orders found.</p>
      ) : (
        <>
          <div style={{ background: 'white', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Order #</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Customer</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Product</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Pages</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Qty</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Total</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} onClick={() => navigate(`/printing/orders/${o.id}`)}
                    style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.1s' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#2563eb' }}>{o.order_number}</td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>{o.customer_name || 'Walk-in'}</td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>{o.product_type}</td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>{o.pages_per_copy}</td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>{o.quantity}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>{parseFloat(o.total_price).toLocaleString()} ETB</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ ...statusBadge(o.status_code), padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
                        {o.status_name}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 12 }}>{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: '1rem' }}>
              <button disabled={filter.page <= 1} onClick={() => setFilter(f => ({ ...f, page: f.page - 1 }))}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', border: '1px solid #e2e8f0', borderRadius: 6, background: 'white', cursor: 'pointer', fontSize: 13, opacity: filter.page <= 1 ? 0.5 : 1 }}>
                <ChevronLeft size={14} /> Prev
              </button>
              <span style={{ fontSize: 13, color: '#64748b' }}>Page {pagination.page} of {pagination.totalPages}</span>
              <button disabled={filter.page >= pagination.totalPages} onClick={() => setFilter(f => ({ ...f, page: f.page + 1 }))}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', border: '1px solid #e2e8f0', borderRadius: 6, background: 'white', cursor: 'pointer', fontSize: 13, opacity: filter.page >= pagination.totalPages ? 0.5 : 1 }}>
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PrintingOrders;
