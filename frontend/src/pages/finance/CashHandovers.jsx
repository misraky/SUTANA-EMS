import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import apiClient from '../../services/apiClient';
import { Check, X, Search, FileText } from 'lucide-react';

const CashHandovers = () => {
  const { user } = useAuth();
  const [handovers, setHandovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Quick check if user is CEO (case-insensitive to match authService behavior)
  const isCEO = user?.roles?.some(r => r.toLowerCase() === 'ceo') || false;

  useEffect(() => {
    fetchHandovers();
  }, []);

  const fetchHandovers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/finance/cash-handovers');
      if (res.data.status === 'success') {
        setHandovers(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch cash handovers');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!isCEO) return;
    try {
      await apiClient.post(`/finance/cash-handovers/${id}/approve`);
      fetchHandovers();
    } catch (err) {
      console.error(err);
      alert('Failed to approve handover');
    }
  };

  const handleReject = async (id) => {
    if (!isCEO) return;
    const reason = prompt("Enter rejection reason:");
    if (reason === null) return;
    try {
      await apiClient.post(`/finance/cash-handovers/${id}/reject`, { reason });
      fetchHandovers();
    } catch (err) {
      console.error(err);
      alert('Failed to reject handover');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'VERIFIED': return '#10b981';
      case 'REJECTED': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b' }}>Cash Handovers</h2>
          <p style={{ margin: '0.5rem 0 0', color: '#64748b' }}>
            Review and manage money handovers from all departments (Farming, Pharmacy, Retail, etc.)
          </p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading handovers...</div>
      ) : handovers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <FileText size={48} color="#94a3b8" style={{ marginBottom: '1rem' }} />
          <h3 style={{ margin: 0, color: '#475569' }}>No Cash Handovers</h3>
          <p style={{ margin: '0.5rem 0 0', color: '#94a3b8' }}>There are currently no cash handovers to review.</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '1rem', color: '#475569', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '1rem', color: '#475569', fontWeight: 600 }}>Department</th>
                <th style={{ padding: '1rem', color: '#475569', fontWeight: 600 }}>Submitted By</th>
                <th style={{ padding: '1rem', color: '#475569', fontWeight: 600 }}>Amount</th>
                <th style={{ padding: '1rem', color: '#475569', fontWeight: 600 }}>Status</th>
                {isCEO && <th style={{ padding: '1rem', color: '#475569', fontWeight: 600, textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {handovers.map((h) => (
                <tr key={h.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '1rem', color: '#334155' }}>
                    {new Date(h.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1rem', color: '#334155', textTransform: 'capitalize' }}>
                    {h.handover_type?.toLowerCase() || 'General'}
                  </td>
                  <td style={{ padding: '1rem', color: '#334155' }}>
                    {h.from_user_name || 'Unknown User'}
                  </td>
                  <td style={{ padding: '1rem', color: '#334155', fontWeight: 600 }}>
                    ETB {Number(h.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '9999px',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      background: `${getStatusColor(h.status)}20`,
                      color: getStatusColor(h.status)
                    }}>
                      {h.status || 'PENDING'}
                    </span>
                  </td>
                  {isCEO && (
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      {(!h.status || h.status === 'PENDING') && (
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleApprove(h.id)}
                            style={{
                              background: '#10b981', color: 'white', border: 'none',
                              padding: '0.5rem', borderRadius: '6px', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                            title="Approve"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            onClick={() => handleReject(h.id)}
                            style={{
                              background: '#ef4444', color: 'white', border: 'none',
                              padding: '0.5rem', borderRadius: '6px', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                            title="Reject"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CashHandovers;
