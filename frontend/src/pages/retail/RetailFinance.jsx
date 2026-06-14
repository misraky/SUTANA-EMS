import React, { useState, useEffect } from 'react';
import axios from '../../services/apiClient';
import { FileText, DollarSign, TrendingUp, Search, CheckCircle, X } from 'lucide-react';

export default () => {
  const [recon, setRecon] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReconciliation(); }, [date]);

  const fetchReconciliation = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/retail/finance/reconciliation?date=${date}`);
      if (res.status === 'success') setRecon(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Finance Reconciliation</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: 13, color: '#475569' }}>Date:</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13 }} />
        </div>
      </div>

      {loading ? <p>Loading...</p> : recon && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
            <div style={{ background: 'white', borderRadius: 12, padding: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Total System Sales</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#059669' }}>{parseFloat(recon.totalSystemSales).toFixed(2)} ETB</div>
            </div>
            <div style={{ background: 'white', borderRadius: 12, padding: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Transactions</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{recon.transactionCount}</div>
            </div>
            <div style={{ background: 'white', borderRadius: 12, padding: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Cash Collected (System)</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#d97706' }}>{parseFloat(recon.totalCashCollected).toFixed(2)} ETB</div>
            </div>
            <div style={{ background: 'white', borderRadius: 12, padding: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Cash Counted (Physical)</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#8b5cf6' }}>{parseFloat(recon.totalCashCounted).toFixed(2)} ETB</div>
            </div>
          </div>

          {recon.totalDifference !== 0 && (
            <div style={{ padding: '12px 16px', borderRadius: 8, background: recon.totalDifference > 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${recon.totalDifference > 0 ? '#bbf7d0' : '#fecaca'}`, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              {recon.totalDifference > 0 ? <TrendingUp size={18} color="#059669" /> : <X size={18} color="#dc2626" />}
              <span style={{ fontWeight: 600 }}>
                Total Difference: {recon.totalDifference > 0 ? '+' : ''}{parseFloat(recon.totalDifference).toFixed(2)} ETB {recon.totalDifference > 0 ? '(surplus)' : '(shortage)'}
              </span>
            </div>
          )}

          <div style={{ background: 'white', borderRadius: 12, padding: '1.5rem', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: 16 }}>Payment Breakdown</h3>
            {recon.byMethod && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
                {Object.entries(recon.byMethod).map(([method, amount]) => (
                  <div key={method} style={{ padding: '12px', background: '#f8fafc', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, textTransform: 'capitalize' }}>{method.replace(/_/g, ' ')}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>{parseFloat(amount).toFixed(2)} ETB</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {recon.shifts && recon.shifts.length > 0 && (
            <div style={{ background: 'white', borderRadius: 12, padding: '1.5rem', border: '1px solid #e2e8f0', marginTop: 16 }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: 16 }}>Shifts on {date}</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px' }}>Cashier ID</th>
                    <th style={{ padding: '10px 12px' }}>Float</th>
                    <th style={{ padding: '10px 12px' }}>Cash Collected</th>
                    <th style={{ padding: '10px 12px' }}>Counted</th>
                    <th style={{ padding: '10px 12px' }}>Difference</th>
                    <th style={{ padding: '10px 12px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recon.shifts.map(s => (
                    <tr key={s.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px' }}>{s.cashier_id}</td>
                      <td style={{ padding: '10px 12px' }}>{parseFloat(s.opening_float).toFixed(2)}</td>
                      <td style={{ padding: '10px 12px' }}>{parseFloat(s.cash_collected).toFixed(2)}</td>
                      <td style={{ padding: '10px 12px' }}>{s.physical_cash_counted ? parseFloat(s.physical_cash_counted).toFixed(2) : '—'}</td>
                      <td style={{ padding: '10px 12px', color: s.difference_amount > 0 ? '#059669' : s.difference_amount < 0 ? '#dc2626' : 'inherit' }}>
                        {s.difference_amount ? `${s.difference_amount > 0 ? '+' : ''}${parseFloat(s.difference_amount).toFixed(2)}` : '—'}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: s.status === 'VERIFIED' ? '#f0fdf4' : s.status === 'CLOSED' ? '#fffbeb' : '#eff6ff', color: s.status === 'VERIFIED' ? '#059669' : s.status === 'CLOSED' ? '#d97706' : '#3b82f6' }}>{s.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};
