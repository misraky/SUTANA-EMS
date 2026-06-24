import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../../services/apiClient';
import {
  Calendar, Clock, Tag, FileText, ArrowLeft, CheckCircle, XCircle,
  AlertCircle, User, Lock, Flame, Award, Building2, Package,
  ChevronRight, Star, TrendingUp, ExternalLink
} from 'lucide-react';
import { PublicNav } from './PublicNavFooter';

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
@keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
@keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeIn { from{opacity:0} to{opacity:1} }
@keyframes pulse-dot { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.4);opacity:.6} }
@keyframes countdown { 0%{background-position:0 0} 100%{background-position:200% 0} }

.td-root {
  font-family: 'Inter', -apple-system, sans-serif;
  background: #f0f2f5;
  min-height: 100vh;
}

.td-hero {
  width: 100vw;
  position: relative;
  overflow: hidden;
  height: 320px;
  background: linear-gradient(135deg, #0f172a 0%, #134e4a 100%);
}
.td-hero-bg {
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ccircle cx='30' cy='30' r='1.5' fill='rgba(255,255,255,0.04)'/%3E%3C/svg%3E");
}
.td-hero-content {
  position: relative;
  max-width: 1280px;
  margin: 0 auto;
  padding: 40px 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.td-layout {
  max-width: 1280px;
  margin: 0 auto;
  padding: 32px 24px 80px;
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 24px;
  align-items: start;
}

.td-main-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e4e6ea;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  overflow: hidden;
  animation: fadeUp 0.4s both;
}

.td-cover-img {
  width: 100%;
  height: 360px;
  object-fit: cover;
  display: block;
}

.td-content {
  padding: 28px 32px;
}

.td-status-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.td-ref {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  font-family: monospace;
  background: #f8fafc;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.td-status {
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  text-transform: capitalize;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.td-status.open {
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
  color: #065f46;
}
.td-status.closed { background: #fef3c7; color: #92400e; }
.td-status.awarded { background: #dbeafe; color: #1e40af; }
.td-status.cancelled { background: #fee2e2; color: #991b1b; }

.td-live-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #10b981;
  animation: pulse-dot 1.5s infinite;
  flex-shrink: 0;
}

.td-title {
  font-size: 26px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.25;
  margin: 0 0 20px;
}

.td-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}
.td-stat-box {
  background: #f8fafc;
  border: 1px solid #e4e6ea;
  border-radius: 12px;
  padding: 14px 16px;
  text-align: center;
}
.td-stat-label { font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
.td-stat-value { font-size: 18px; font-weight: 800; color: #0f172a; }
.td-stat-value.green { color: #059669; }

.td-section { margin-bottom: 28px; }
.td-section-title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 2px solid #f1f5f9;
}
.td-section-body {
  font-size: 14px;
  color: #475569;
  line-height: 1.75;
  white-space: pre-wrap;
}

.td-images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}
.td-img-thumb {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
  border-radius: 10px;
  border: 2px solid #e2e8f0;
  transition: transform 0.2s, border-color 0.2s;
  cursor: pointer;
}
.td-img-thumb:hover { transform: scale(1.03); border-color: #059669; }

.td-cancel-box {
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

/* ─── Sidebar ─── */
.td-sidebar { display: flex; flex-direction: column; gap: 16px; animation: fadeUp 0.4s 0.1s both; }

.td-bid-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e4e6ea;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  overflow: hidden;
}
.td-bid-header {
  background: linear-gradient(135deg, #0f172a 0%, #134e4a 100%);
  padding: 20px 24px;
  color: white;
}
.td-bid-body { padding: 24px; }

.td-input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  color: #0f172a;
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}
.td-input:focus {
  border-color: #059669;
  box-shadow: 0 0 0 3px rgba(5,150,105,0.12);
}

.td-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 5px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.td-submit-btn {
  width: 100%;
  padding: 13px;
  background: linear-gradient(135deg, #059669, #10b981);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  box-shadow: 0 4px 14px rgba(5,150,105,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.td-submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(5,150,105,0.4);
}
.td-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.td-signin-card {
  background: white;
  border-radius: 16px;
  border: 2px solid #e4e6ea;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  overflow: hidden;
  text-align: center;
}
.td-signin-header {
  background: linear-gradient(135deg, #1e293b, #0f172a);
  padding: 28px 24px;
  position: relative;
  overflow: hidden;
}
.td-signin-header::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 70% 50%, rgba(5,150,105,0.3) 0%, transparent 70%);
}
.td-signin-body { padding: 24px; }

.td-signin-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 13px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  text-decoration: none;
  box-sizing: border-box;
}
.td-signin-btn.primary {
  background: linear-gradient(135deg, #059669, #10b981);
  color: white;
  border: none;
  box-shadow: 0 4px 14px rgba(5,150,105,0.3);
  margin-bottom: 10px;
}
.td-signin-btn.primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(5,150,105,0.4); }
.td-signin-btn.outline {
  background: transparent;
  color: #0f172a;
  border: 2px solid #e2e8f0;
}
.td-signin-btn.outline:hover { background: #f8fafc; border-color: #059669; color: #059669; }

.td-meta-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e4e6ea;
  padding: 20px 22px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.td-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 13px;
}
.td-meta-row:last-child { border-bottom: none; }
.td-meta-key { color: #94a3b8; font-weight: 500; display: flex; align-items: center; gap: 6px; }
.td-meta-val { color: #0f172a; font-weight: 600; text-align: right; }

.td-countdown-box {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border: 1px solid #fcd34d;
  border-radius: 12px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.message-box {
  padding: 12px 16px;
  border-radius: 10px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 500;
}
.message-box.success { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
.message-box.error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }

.td-existing-bid {
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  border: 2px solid #86efac;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

@media (max-width: 900px) {
  .td-layout {
    grid-template-columns: 1fr;
  }
  .td-cover-img { height: 220px; }
}
`;

const Countdown = ({ deadline }) => {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    const tick = () => {
      const diff = new Date(deadline) - new Date();
      if (diff <= 0) return setRemaining('CLOSED');
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`);
    };
    tick(); const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [deadline]);
  return <span>{remaining}</span>;
};

export default () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tender, setTender] = useState(null);
  const [myBid, setMyBid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ bid_price_per_unit: '', quantity_requested: 1, proposed_pickup_date: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const [winner, setWinner] = useState(null);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) try { setUser(JSON.parse(u)); } catch {}
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/tenders/public/${id}`);
        if (res.status === 'success') setTender(res.data);
      } catch (_) {}
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (user && tender?.status === 'open') {
      axios.get(`/tenders/${tender.id}/my-bid`).then(r => {
        if (r.status === 'success' && r.data) setMyBid(r.data);
      }).catch(() => {});
    }
    if (user && tender?.status === 'awarded') {
      axios.get(`/tenders/${tender.id}/my-bid`).then(r => {
        if (r.status === 'success' && r.data) setMyBid(r.data);
      }).catch(() => {});
      axios.get(`/tenders/${tender.id}/winner`).then(r => {
        if (r.status === 'success' && r.data) setWinner(r.data);
      }).catch(() => {});
    }
  }, [user, tender]);

  useEffect(() => {
    if (myBid) {
      setForm({
        bid_price_per_unit: myBid.bid_price_per_unit || '',
        quantity_requested: myBid.quantity_requested || 1,
        proposed_pickup_date: myBid.proposed_pickup_date ? myBid.proposed_pickup_date.slice(0, 10) : '',
        notes: myBid.notes || '',
      });
    } else if (tender) {
      setForm(f => ({ ...f, bid_price_per_unit: tender.starting_bid_price || '' }));
    }
  }, [myBid, tender]);

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await axios.post(`/tenders/${tender.id}/bid`, form);
      if (res.status === 'success') {
        setMessage({ type: 'success', text: res.message || '🎉 Bid submitted successfully!' });
        const r = await axios.get(`/tenders/${tender.id}/my-bid`);
        if (r.status === 'success') setMyBid(r.data);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Submission failed. Please try again.' });
    }
    finally { setSubmitting(false); }
  };

  const isOpen = tender?.status === 'open' && new Date(tender.deadline) > new Date();
  const attachments = tender?.attachments ? (() => { try { return JSON.parse(tender.attachments); } catch { return []; } })() : [];
  const images = attachments.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
  const docs = attachments.filter(f => !/\.(jpg|jpeg|png|gif|webp)$/i.test(f));
  const coverImg = images[0];

  return (
    <div className="td-root">
      <style>{STYLES}</style>
      <PublicNav />

      {loading ? (
        <div style={{ maxWidth: 1280, margin: '40px auto', padding: '0 24px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 180, background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)', backgroundSize: '400px', animation: 'shimmer 1.5s infinite', borderRadius: 16, marginBottom: 16 }} />
          ))}
        </div>
      ) : !tender ? (
        <div style={{ textAlign: 'center', padding: '80px 24px', color: '#94a3b8' }}>
          <p style={{ fontSize: 18 }}>Tender not found.</p>
          <button onClick={() => navigate('/tenders')} style={{ marginTop: 16, padding: '10px 24px', background: '#059669', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Back to Tenders</button>
        </div>
      ) : (
        <>
          {/* ─── Dark Hero Banner ─── */}
          <div className="td-hero">
            <div className="td-hero-bg" />
            <div className="td-hero-content">
              <button onClick={() => navigate('/tenders')} style={{
                background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.2)', color: 'white',
                padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 13, fontWeight: 600, marginBottom: 20, fontFamily: 'inherit',
                transition: 'background 0.2s',
              }}>
                <ArrowLeft size={15} /> All Tenders
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace', background: 'rgba(255,255,255,0.1)', padding: '3px 10px', borderRadius: 6 }}>
                  {tender.reference_number}
                </span>
                <span className={`td-status ${tender.status}`}>
                  {tender.status === 'open' && <span className="td-live-dot" />}
                  {tender.status.replace('_', ' ')}
                </span>
                {tender.category && (
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.1)', padding: '3px 10px', borderRadius: 6 }}>
                    {tender.category}
                  </span>
                )}
              </div>

              <h1 style={{ fontSize: 'clamp(20px,3.5vw,32px)', fontWeight: 800, color: 'white', margin: 0, lineHeight: 1.2, maxWidth: 800 }}>
                {tender.title}
              </h1>
            </div>
          </div>

          {/* ─── Main Layout ─── */}
          <div className="td-layout">
            {/* Left Column */}
            <div className="td-main-card">
              {coverImg && (
                <img
                  className="td-cover-img"
                  src={`http://localhost:5000/uploads/tenders/${coverImg}`}
                  alt={tender.title}
                />
              )}

              <div className="td-content">
                {/* Stats */}
                <div className="td-stats-grid">
                  {tender.item_name && (
                    <div className="td-stat-box">
                      <div className="td-stat-label">Item</div>
                      <div className="td-stat-value" style={{ fontSize: 14 }}>{tender.item_name}</div>
                    </div>
                  )}
                  <div className="td-stat-box">
                    <div className="td-stat-label">Quantity</div>
                    <div className="td-stat-value">{tender.quantity}</div>
                  </div>
                  <div className="td-stat-box">
                    <div className="td-stat-label">Starting Price</div>
                    <div className="td-stat-value green">{parseFloat(tender.starting_bid_price).toLocaleString()}</div>
                  </div>
                  <div className="td-stat-box">
                    <div className="td-stat-label">Deadline</div>
                    <div className="td-stat-value" style={{ fontSize: 13 }}>
                      {tender.deadline ? new Date(tender.deadline).toLocaleDateString('en-CA') : '—'}
                    </div>
                  </div>
                </div>

                {/* Countdown */}
                {isOpen && (
                  <div className="td-countdown-box" style={{ marginBottom: 24 }}>
                    <Flame size={20} color="#92400e" />
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', marginBottom: 2 }}>Time Remaining</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#78350f' }}><Countdown deadline={tender.deadline} /></div>
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="td-section">
                  <h3 className="td-section-title"><FileText size={16} color="#059669" /> Description</h3>
                  <p className="td-section-body">{tender.description}</p>
                </div>

                {/* Terms */}
                <div className="td-section">
                  <h3 className="td-section-title"><CheckCircle size={16} color="#059669" /> Terms &amp; Conditions</h3>
                  <p className="td-section-body">{tender.terms_conditions}</p>
                </div>

                {/* Images Gallery */}
                {images.length > 0 && (
                  <div className="td-section">
                    <h3 className="td-section-title"><Star size={16} color="#059669" /> Attachments ({images.length} image{images.length !== 1 ? 's' : ''})</h3>
                    <div className="td-images-grid">
                      {images.map((f, i) => (
                        <a key={i} href={`http://localhost:5000/uploads/tenders/${f}`} target="_blank" rel="noopener noreferrer">
                          <img className="td-img-thumb" src={`http://localhost:5000/uploads/tenders/${f}`} alt={`Attachment ${i + 1}`} />
                        </a>
                      ))}
                    </div>
                    {docs.length > 0 && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {docs.map((f, i) => (
                          <a key={i} href={`http://localhost:5000/uploads/tenders/${f}`} target="_blank" rel="noopener noreferrer" style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                            background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8,
                            fontSize: 12, color: '#475569', textDecoration: 'none', fontWeight: 600,
                            transition: 'all 0.2s',
                          }}>
                            <FileText size={14} color="#059669" /> {f} <ExternalLink size={11} />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Cancellation */}
                {tender.cancellation_reason && (
                  <div className="td-cancel-box">
                    <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <strong style={{ fontSize: 13, color: '#991b1b' }}>Cancellation Reason</strong>
                      <p style={{ fontSize: 13, color: '#991b1b', margin: '4px 0 0', lineHeight: 1.6 }}>{tender.cancellation_reason}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="td-sidebar">
              {/* Meta Info */}
              <div className="td-meta-card">
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Package size={16} color="#059669" /> Tender Details
                </h3>
                {[
                  { key: <><Calendar size={13} /> Published</>, val: new Date(tender.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) },
                  { key: <><Clock size={13} /> Deadline</>, val: tender.deadline ? new Date(tender.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—' },
                  { key: <><Tag size={13} /> Category</>, val: tender.category || '—' },
                  { key: <><Building2 size={13} /> Status</>, val: <span className={`td-status ${tender.status}`} style={{ fontSize: 11, padding: '2px 10px' }}>{tender.status.replace('_', ' ')}</span> },
                  { key: <><TrendingUp size={13} /> Min. Price</>, val: <span style={{ color: '#059669', fontWeight: 800 }}>{parseFloat(tender.starting_bid_price).toLocaleString()} ETB</span> },
                ].map(({ key, val }, i) => (
                  <div className="td-meta-row" key={i}>
                    <span className="td-meta-key">{key}</span>
                    <span className="td-meta-val">{val}</span>
                  </div>
                ))}
              </div>

              {/* Bid Section — Logged In User */}
              {isOpen && user && (
                <div className="td-bid-card">
                  <div className="td-bid-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Award size={18} color="#10b981" />
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {myBid ? 'Your Bid' : 'Place a Bid'}
                      </span>
                    </div>
                    <p style={{ fontSize: 22, fontWeight: 900, color: 'white', margin: 0 }}>
                      {myBid ? 'Update Your Application' : 'Submit Your Offer'}
                    </p>
                  </div>

                  <div className="td-bid-body">
                    {myBid && (
                      <div className="td-existing-bid">
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#166534', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <CheckCircle size={14} /> Your current bid
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#059669' }}>{parseFloat(myBid.bid_price_per_unit).toLocaleString()} ETB/unit</div>
                        <div style={{ fontSize: 12, color: '#166534', marginTop: 2 }}>Qty: {myBid.quantity_requested} | Total: {parseFloat(myBid.total_bid_value || myBid.bid_price_per_unit * myBid.quantity_requested).toLocaleString()} ETB</div>
                      </div>
                    )}

                    {message && (
                      <div className={`message-box ${message.type}`}>
                        {message.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        {message.text}
                      </div>
                    )}

                    <form onSubmit={handleBidSubmit}>
                      <div style={{ marginBottom: 14 }}>
                        <label className="td-label">Bid Price (ETB/unit) *</label>
                        <input className="td-input" required type="number" step="0.01" min={tender.starting_bid_price}
                          value={form.bid_price_per_unit}
                          onChange={e => setForm(f => ({ ...f, bid_price_per_unit: e.target.value }))}
                          placeholder={`Min: ${parseFloat(tender.starting_bid_price).toLocaleString()} ETB`}
                        />
                      </div>
                      <div style={{ marginBottom: 14 }}>
                        <label className="td-label">Quantity *</label>
                        <input className="td-input" required type="number" min="1" max={tender.quantity}
                          value={form.quantity_requested}
                          onChange={e => setForm(f => ({ ...f, quantity_requested: e.target.value }))}
                        />
                        {form.bid_price_per_unit && form.quantity_requested && (
                          <div style={{ fontSize: 12, color: '#059669', fontWeight: 700, marginTop: 4 }}>
                            Total: {(parseFloat(form.bid_price_per_unit) * parseInt(form.quantity_requested)).toLocaleString()} ETB
                          </div>
                        )}
                      </div>
                      <div style={{ marginBottom: 14 }}>
                        <label className="td-label">Proposed Pickup Date</label>
                        <input className="td-input" type="date" value={form.proposed_pickup_date}
                          onChange={e => setForm(f => ({ ...f, proposed_pickup_date: e.target.value }))}
                        />
                      </div>
                      <div style={{ marginBottom: 18 }}>
                        <label className="td-label">Notes / Cover Letter</label>
                        <textarea className="td-input" value={form.notes} rows={3}
                          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                          placeholder="Describe your offer, qualifications, delivery terms..."
                          style={{ resize: 'vertical' }}
                        />
                      </div>
                      <button type="submit" className="td-submit-btn" disabled={submitting}>
                        {submitting ? '⏳ Submitting...' : myBid ? <><CheckCircle size={16} /> Update My Bid</> : <><Award size={16} /> Submit Bid</>}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Sign-in CTA — Not Logged In */}
              {!user && isOpen && (
                <div className="td-signin-card">
                  <div className="td-signin-header">
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        width: 64, height: 64, borderRadius: '50%',
                        background: 'rgba(5,150,105,0.25)', border: '2px solid rgba(16,185,129,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 14px',
                      }}>
                        <Lock size={28} color="#10b981" />
                      </div>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: 'white', margin: '0 0 6px' }}>
                        Ready to Bid?
                      </h3>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: 1.5 }}>
                        Sign in to your account to submit a bid on this tender and compete for this contract.
                      </p>
                    </div>
                  </div>
                  <div className="td-signin-body">
                    <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', marginBottom: 18, border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>This tender offers</div>
                      {[
                        { icon: <TrendingUp size={13} color="#059669" />, text: `Starting at ${parseFloat(tender.starting_bid_price).toLocaleString()} ETB/unit` },
                        { icon: <Package size={13} color="#059669" />, text: `${tender.quantity} units available` },
                        { icon: <Clock size={13} color="#059669" />, text: <><Countdown deadline={tender.deadline} /> remaining</> },
                      ].map(({ icon, text }, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569', fontWeight: 500, marginBottom: 6 }}>
                          {icon} {text}
                        </div>
                      ))}
                    </div>
                    <Link to="/login" className="td-signin-btn primary" style={{ display: 'flex', textDecoration: 'none' }}>
                      <User size={16} /> Sign In to Bid <ChevronRight size={14} />
                    </Link>
                    <Link to="/register" className="td-signin-btn outline" style={{ display: 'flex', textDecoration: 'none' }}>
                      Create Free Account
                    </Link>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: '12px 0 0', textAlign: 'center' }}>
                      By bidding you agree to Sutana's Terms of Service
                    </p>
                  </div>
                </div>
              )}

              {/* Tender Closed Notice */}
              {!isOpen && tender.status !== 'open' && (
                <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e4e6ea', padding: '24px', textAlign: 'center' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>
                    {tender.status === 'awarded' ? '🏆' : tender.status === 'cancelled' ? '❌' : '🔒'}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
                    {tender.status === 'awarded' ? 'Tender Awarded' : tender.status === 'cancelled' ? 'Tender Cancelled' : 'Bidding Closed'}
                  </h3>
                  <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px', lineHeight: 1.5 }}>
                    {tender.status === 'awarded'
                      ? 'This tender has been awarded to a winning bidder.'
                      : tender.status === 'cancelled'
                      ? 'This tender has been cancelled by the issuing party.'
                      : 'The bidding window for this tender has closed.'}
                  </p>
                  
                  {winner && tender.status === 'awarded' && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 16, marginBottom: 16, textAlign: 'left' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#166534', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Award size={14} /> Winner Announced
                      </div>
                      <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 600 }}>{winner.winner_name}</div>
                      <div style={{ fontSize: 13, color: '#059669', marginTop: 4 }}>Winning Bid: {parseFloat(winner.bid_price_per_unit).toLocaleString()} ETB/unit</div>
                    </div>
                  )}

                  <button onClick={() => navigate('/tenders')} style={{
                    padding: '10px 20px', background: 'linear-gradient(135deg,#059669,#10b981)',
                    color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer',
                    fontWeight: 600, fontSize: 13, fontFamily: 'inherit', width: '100%'
                  }}>
                    Browse Open Tenders
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
