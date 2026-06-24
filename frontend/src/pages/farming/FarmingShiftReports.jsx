import React, { useState, useEffect } from 'react';
import axios from '../../services/apiClient';
import { Clock, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FarmingShiftReports() {
  const nav = useNavigate();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios.get('/farming/shifts/history')
      .then(r => { setShifts(r.data?.data || r.data || []); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><ArrowLeft size={18} /></button>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={18} color="#166534" /> Shift Reports
        </h2>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading...</div>}
      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, color: '#dc2626', fontSize: 13, marginBottom: 16 }}><AlertCircle size={14} /> {error}</div>}

      {!loading && !error && (
        <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>#</th>
                <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>Worker</th>
                <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>Shift</th>
                <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>Opened</th>
                <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>Closed</th>
                <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>Status</th>
                <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>Sales</th>
              </tr>
            </thead>
            <tbody>
              {shifts.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '10px 12px', color: '#94a3b8', textAlign: 'center', padding: 30 }}>No shift records found.</td></tr>
              ) : (
                shifts.map((s, i) => {
                  const isOpen = s.status === 'OPEN';
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9', background: isOpen ? '#f0fdf4' : '#fff' }}>
                      <td style={{ padding: '10px 12px', color: '#334155' }}>{i + 1}</td>
                      <td style={{ padding: '10px 12px', color: '#334155', fontWeight: 600 }}>{s.worker_name || `Worker #${s.worker_id}`}</td>
                      <td style={{ padding: '10px 12px', color: '#334155' }}>{s.shift_type ? s.shift_type.charAt(0).toUpperCase() + s.shift_type.slice(1) : '—'}</td>
                      <td style={{ padding: '10px 12px', color: '#334155' }}>{s.opened_at ? new Date(s.opened_at).toLocaleString() : '—'}</td>
                      <td style={{ padding: '10px 12px', color: '#334155' }}>{s.closed_at ? new Date(s.closed_at).toLocaleString() : (isOpen ? 'Still Open' : '—')}</td>
                      <td style={{ padding: '10px 12px', color: '#334155' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600, fontSize: 12, padding: '3px 10px', borderRadius: 20, color: isOpen ? '#059669' : '#64748b', background: isOpen ? '#f0fdf4' : '#f1f5f9' }}>
                          {isOpen ? 'OPEN' : 'CLOSED'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#334155', fontWeight: 700, color: '#166534' }}>
                        ${parseFloat(s.total_sales || 0).toFixed(2)}
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
