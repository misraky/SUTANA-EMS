import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/apiClient';
import { FileText, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const STATUS_STYLES = {
  pending: { bg: '#fef3c7', color: '#92400e' },
  under_review: { bg: '#dbeafe', color: '#1e40af' },
  awarded: { bg: '#d1fae5', color: '#065f46' },
  not_selected: { bg: '#fee2e2', color: '#991b1b' },
  disqualified: { bg: '#f1f5f9', color: '#64748b' },
};

export default () => {
  const navigate = useNavigate();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const r = await axios.get('/tenders/my-bids');
        if (r.status === 'success') setBids(r.data);
      } catch (_) {} finally { setLoading(false); }
    };
    fetch();
  }, []);

  return (
    <div style={{ padding: '24px 0' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 20px' }}>My Bids</h2>
      {loading ? (
        <p style={{ color: '#94a3b8', fontSize: 14 }}>Loading...</p>
      ) : bids.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <FileText size={40} color="#cbd5e1" style={{ marginBottom: 12 }} />
          <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>You haven't placed any bids yet.</p>
          <button onClick={() => navigate('/tenders')} style={{
            marginTop: 12, padding: '8px 20px', background: '#059669', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer',
          }}>Browse Tenders</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {bids.map(b => {
            const st = STATUS_STYLES[b.status] || {};
            return (
              <div key={b.id} style={{
                background: 'white', borderRadius: 10, padding: '14px 18px', border: '1px solid #e2e8f0',
                cursor: 'pointer',
              }} onClick={() => navigate(`/tenders/${b.tender_id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#64748b' }}>{b.reference_number}</span>
                    <h4 style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{b.tender_title}</h4>
                  </div>
                  <span style={{ padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, textTransform: 'capitalize', ...st }}>{b.status.replace('_', ' ')}</span>
                </div>
                <div style={{ display: 'flex', gap: 20, fontSize: 13, flexWrap: 'wrap' }}>
                  <span style={{ color: '#059669', fontWeight: 700 }}>{parseFloat(b.bid_price_per_unit).toLocaleString()} ETB &times; {b.quantity_requested}</span>
                  <span style={{ color: '#0f172a', fontWeight: 600 }}>Total: {parseFloat(b.total_bid_value).toLocaleString()} ETB</span>
                  {b.deadline && <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                    <Calendar size={12} /> {new Date(b.deadline).toLocaleDateString('en-CA')}
                  </span>}
                </div>
                {b.status === 'awarded' && (
                  <div style={{ marginTop: 8, padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, fontSize: 13, color: '#065f46', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle size={14} /> Congratulations! Your bid was selected.
                  </div>
                )}
                {b.status === 'not_selected' && (
                  <div style={{ marginTop: 8, padding: '8px 12px', background: '#fef2f2', borderRadius: 8, fontSize: 13, color: '#991b1b', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <XCircle size={14} /> Your bid was not selected.
                  </div>
                )}
                {b.status === 'disqualified' && b.disqualification_reason && (
                  <div style={{ marginTop: 8, padding: '8px 12px', background: '#f8fafc', borderRadius: 8, fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <AlertCircle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
                    <span>Disqualified: {b.disqualification_reason}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
