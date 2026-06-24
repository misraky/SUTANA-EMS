import React, { useState, useEffect } from 'react';
import axios from '../../services/apiClient';
import { ShoppingCart, CheckCircle, Clock } from 'lucide-react';
import POSPage from '../sales/POSPage';
import salesService from '../../services/salesService';

const PAYMENT_METHODS = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Telebirr', label: 'Telebirr' },
  { value: 'Bank Transfer', label: 'Bank Transfer' }
];

const PharmacyPOS = () => {
  const [activeTab, setActiveTab] = useState('walk_in');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [shift, setShift] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchPendingRequests();
    fetchShift();
  }, []);

  const fetchShift = async () => {
    try {
      const res = await salesService.getCurrentShift();
      const s = res.data?.data || res.data;
      if (s && s.id) setShift(s);
    } catch { setShift(null); }
  };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchPendingRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await axios.get('/pharmacy/requests/pending');
      if (res?.status === 'success') setPendingRequests(res.data || []);
    } catch (err) {
      console.error('Failed to fetch pending requests', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const markRequestComplete = async (requestId, pMethod) => {
    if (!shift) {
      showMsg('error', 'You must open a shift (in Walk-In POS) before processing requests.');
      return;
    }
    if (!window.confirm(`Mark request #${requestId} as completed with ${pMethod} payment?`)) return;
    try {
      setIsCheckingOut(true);
      await axios.put(`/pharmacy/requests/${requestId}/complete`, { payment_method: pMethod });
      showMsg('success', 'Request marked as complete and payment recorded!');
      fetchPendingRequests();
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Failed to complete request.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const cardStyle = (active) => ({ flex: 1, padding: '10px', border: 'none', borderRadius: 6, background: active ? '#10b981' : '#e2e8f0', color: active ? '#fff' : '#475569', fontWeight: 600, cursor: 'pointer' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', overflow: 'hidden', gap: '1rem' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 10, background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <button onClick={() => setActiveTab('walk_in')} style={cardStyle(activeTab === 'walk_in')}>
          Walk-In POS
        </button>
        <button onClick={() => { setActiveTab('pending'); fetchPendingRequests(); }} style={cardStyle(activeTab === 'pending')}>
          Pending Requests {pendingRequests.length > 0 ? `(${pendingRequests.length})` : ''}
        </button>
      </div>

      {message && (
        <div style={{ padding: '10px 16px', borderRadius: 8, background: message.type === 'error' ? '#fee2e2' : '#dcfce7', color: message.type === 'error' ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
          {message.text}
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'walk_in' && (
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
             <POSPage />
          </div>
        )}

        {activeTab === 'pending' && (
          <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', height: '100%', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 20px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={24} color="#f59e0b" /> Pending Prescription Requests
            </h2>
            {loadingRequests ? (
              <p>Loading pending requests...</p>
            ) : pendingRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', background: '#f8fafc', borderRadius: 8 }}>
                No pending prescription requests at the moment.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {pendingRequests.map(req => (
                  <div key={req.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 20, background: '#fafafa' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b', marginBottom: 4 }}>Request #{req.id}</div>
                        <div style={{ color: '#64748b', fontSize: 14, marginBottom: 4 }}>
                          Patient: {req.patient_name || req.customer_name || 'Unknown'} &nbsp;|&nbsp; Status: <span style={{ fontWeight: 600, color: '#f59e0b' }}>{req.status}</span>
                        </div>
                        {req.notes && <div style={{ color: '#475569', fontSize: 13 }}>Notes: {req.notes}</div>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#10b981', marginBottom: 8 }}>
                          {req.estimated_price ? `${parseFloat(req.estimated_price).toFixed(2)} ETB` : 'Price TBD'}
                        </div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <select id={`req-pay-${req.id}`} style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #cbd5e1' }} defaultValue="Cash">
                            {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                          </select>
                          <button
                            onClick={() => {
                              const pMethod = document.getElementById(`req-pay-${req.id}`).value;
                              markRequestComplete(req.id, pMethod);
                            }}
                            disabled={isCheckingOut}
                            style={{ padding: '6px 14px', background: '#10b981', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 700 }}
                          >
                            Mark Complete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PharmacyPOS;
