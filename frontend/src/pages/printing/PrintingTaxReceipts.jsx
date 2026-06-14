import React, { useState, useEffect } from 'react';
import axios from '../../services/apiClient';
import { Search, RefreshCw, Printer, ChevronLeft, ChevronRight } from 'lucide-react';

const PrintingTaxReceipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = async (p = 1) => {
    try {
      setLoading(true);
      const res = await axios.get('/printing/tax-receipts', { params: { page: p, limit: 25 } });
      if (res.status === 'success') {
        setReceipts(res.data?.receipts || []);
        setPagination(res.data?.pagination || { page: 1, total: 0, totalPages: 0 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(page); }, [page]);

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, color: '#1e293b' }}>Tax Receipts</h2>
        <button onClick={() => load(page)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', color: '#475569', fontSize: 13 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <p style={{ color: '#64748b' }}>Loading tax receipts...</p>
      ) : receipts.length === 0 ? (
        <p style={{ color: '#94a3b8' }}>No tax receipts found.</p>
      ) : (
        <>
          <div style={{ background: 'white', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Serial #</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Order #</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Customer</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Approved Amt</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Used</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Remaining</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Printed By</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#2563eb' }}>{r.serial_number}</td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>{r.order_number}</td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>{r.customer_name}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>{r.approval_amount_total?.toLocaleString()} ETB</td>
                    <td style={{ padding: '12px 14px' }}>{r.used_count}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: r.remaining > 0 ? '#059669' : '#ef4444' }}>{r.remaining}</td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>{r.printed_by_name}</td>
                    <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 12 }}>{new Date(r.printed_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: '1rem' }}>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', border: '1px solid #e2e8f0', borderRadius: 6, background: 'white', cursor: 'pointer', fontSize: 13, opacity: page <= 1 ? 0.5 : 1 }}>
                <ChevronLeft size={14} /> Prev
              </button>
              <span style={{ fontSize: 13, color: '#64748b' }}>Page {pagination.page} of {pagination.totalPages}</span>
              <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px', border: '1px solid #e2e8f0', borderRadius: 6, background: 'white', cursor: 'pointer', fontSize: 13, opacity: page >= pagination.totalPages ? 0.5 : 1 }}>
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PrintingTaxReceipts;
