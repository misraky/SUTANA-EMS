import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/apiClient';
import { Calendar, Clock, Tag, Search, Filter, ArrowRight, Flame, Award, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { PublicNav } from './PublicNavFooter';
import tenderHero from '../../assets/hero-section/tender.jpg';

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
@keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
@keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }

.tender-hero-wrap {
  width: 100%;
  position: relative;
  overflow: hidden;
  height: 420px;
}
.tender-hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}
.tender-hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(15,23,42,0.78) 0%, rgba(5,150,105,0.62) 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 24px;
}

.tender-page-root {
  background: #f0f2f5;
  min-height: 100vh;
  font-family: 'Inter', -apple-system, sans-serif;
}

.tender-filters-bar {
  background: white;
  border-bottom: 1px solid #e4e6ea;
  padding: 14px 0;
  position: sticky;
  top: 68px;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.tender-filters-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.status-pill {
  padding: 7px 18px;
  border-radius: 20px;
  border: 1.5px solid transparent;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
  background: #f1f5f9;
  color: #64748b;
  font-family: inherit;
}
.status-pill:hover { background: #e2e8f0; color: #334155; }
.status-pill.active { background: linear-gradient(135deg, #059669, #10b981); color: white; border-color: transparent; box-shadow: 0 4px 12px rgba(5,150,105,0.3); }

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 20px;
  flex: 1;
  min-width: 220px;
  max-width: 380px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.search-bar:focus-within {
  border-color: #059669;
  box-shadow: 0 0 0 3px rgba(5,150,105,0.12);
  background: white;
}
.search-bar input { border: none; outline: none; flex: 1; font-size: 13px; color: #0f172a; background: transparent; font-family: inherit; }

.tender-main-layout {
  max-width: 1440px;
  margin: 0 auto;
  padding: 32px 24px 80px;
}

.tender-card-h {
  background: white;
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: row;
  border: 1px solid #e4e6ea;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
  animation: fadeUp 0.4s both;
  text-decoration: none;
  color: inherit;
  margin-bottom: 14px;
}
.tender-card-h:hover {
  box-shadow: 0 8px 28px rgba(0,0,0,0.1);
  transform: translateY(-2px);
  border-color: #c7e7dc;
}

.tender-card-thumb {
  width: 240px;
  min-width: 240px;
  height: 160px;
  object-fit: cover;
  flex-shrink: 0;
}
.tender-card-thumb-placeholder {
  width: 240px;
  min-width: 240px;
  height: 160px;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tender-card-body {
  padding: 18px 22px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.tender-card-toprow {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.tender-ref {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  font-family: 'Courier New', monospace;
  background: #f8fafc;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}
.status-badge {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  text-transform: capitalize;
}
.status-badge.open { background: #d1fae5; color: #065f46; }
.status-badge.closed { background: #fef3c7; color: #92400e; }
.status-badge.awarded { background: #dbeafe; color: #1e40af; }
.status-badge.cancelled { background: #fee2e2; color: #991b1b; }

.tender-card-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.35;
  margin: 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.tender-card-desc {
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin: 0;
}

.tender-card-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
}
.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #64748b;
}
.meta-price {
  font-size: 15px;
  font-weight: 800;
  color: #059669;
  margin-left: auto;
}

.countdown-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #92400e;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  animation: pulse 2s infinite;
}

.empty-state {
  text-align: center;
  padding: 80px 24px;
  color: #94a3b8;
}
.empty-icon { font-size: 64px; margin-bottom: 16px; }

.card-shimmer {
  height: 160px;
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 400px;
  animation: shimmer 1.5s infinite;
  border-radius: 14px;
  margin-bottom: 14px;
}

.tender-results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e2e8f0;
}

@media (max-width: 640px) {
  .tender-hero-wrap { height: 280px; }
  .tender-card-h { flex-direction: column; }
  .tender-card-thumb, .tender-card-thumb-placeholder { width: 100%; min-width: unset; height: 200px; }
  .meta-price { margin-left: 0; }
}
`;

const Countdown = ({ deadline }) => {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    const tick = () => {
      const diff = new Date(deadline) - new Date();
      if (diff <= 0) return setRemaining('Expired');
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining(d > 0 ? `${d}d ${h}h left` : `${h}h ${m}m left`);
    };
    tick(); const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [deadline]);
  return <span>{remaining}</span>;
};

const TenderCard = ({ t, onClick, index }) => {
  const imgs = (() => { try { return JSON.parse(t.attachments || '[]'); } catch { return []; } })();
  const coverImg = imgs.find(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
  const isOpen = t.status === 'open';

  return (
    <div
      className="tender-card-h"
      onClick={onClick}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {coverImg
        ? <img className="tender-card-thumb" src={`http://localhost:5000/uploads/tenders/${coverImg}`} alt={t.title} loading="lazy" />
        : <div className="tender-card-thumb-placeholder">
            <TrendingUp size={40} color="#cbd5e1" />
          </div>
      }
      <div className="tender-card-body">
        <div className="tender-card-toprow">
          <span className="tender-ref">{t.reference_number}</span>
          <span className={`status-badge ${t.status}`}>{t.status.replace('_', ' ')}</span>
          {t.category && <span style={{ fontSize: 11, color: '#64748b', padding: '2px 8px', background: '#f8fafc', borderRadius: 4, border: '1px solid #e2e8f0' }}>{t.category}</span>}
          {isOpen && <span className="countdown-badge"><Flame size={10} /><Countdown deadline={t.deadline} /></span>}
        </div>

        <h3 className="tender-card-title">{t.title}</h3>
        {t.description && <p className="tender-card-desc">{t.description}</p>}

        <div className="tender-card-meta">
          {t.item_name && (
            <span className="meta-item"><Tag size={12} />{t.item_name} × {t.quantity}</span>
          )}
          <span className="meta-item"><Calendar size={12} />{new Date(t.created_at).toLocaleDateString('en-CA')}</span>
          {t.deadline && (
            <span className="meta-item"><Clock size={12} />{new Date(t.deadline).toLocaleDateString('en-CA')}</span>
          )}
          <span className="meta-price">
            {parseFloat(t.starting_bid_price).toLocaleString()} ETB
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#059669' }}>
            View Details <ArrowRight size={13} />
          </span>
        </div>
      </div>
    </div>
  );
};

export default () => {
  const navigate = useNavigate();
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('open');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/tenders/public');
        if (res.status === 'success') setTenders(res.data);
      } catch (_) {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = tenders.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.title?.toLowerCase().includes(q)
        || t.reference_number?.toLowerCase().includes(q)
        || t.item_name?.toLowerCase().includes(q)
        || t.category?.toLowerCase().includes(q);
    }
    return true;
  });

  const counts = {
    all: tenders.length,
    open: tenders.filter(t => t.status === 'open').length,
    closed: tenders.filter(t => t.status === 'closed').length,
    awarded: tenders.filter(t => t.status === 'awarded').length,
    cancelled: tenders.filter(t => t.status === 'cancelled').length,
  };

  return (
    <div className="tender-page-root" style={{ overflowX: 'hidden' }}>
      <style>{STYLES}</style>
      <PublicNav />

      {/* ─── Hero ─── */}
      <div className="tender-hero-wrap">
        <img className="tender-hero-img" src={tenderHero} alt="Tenders hero" />
        <div className="tender-hero-overlay">
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(5,150,105,0.85)', backdropFilter: 'blur(8px)',
            padding: '6px 16px', borderRadius: 20, marginBottom: 20,
            fontSize: 12, fontWeight: 700, color: 'white', letterSpacing: 1,
            textTransform: 'uppercase',
          }}>
            <Flame size={14} /> Live Tenders & Procurement
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 900, color: 'white', margin: '0 0 12px', lineHeight: 1.1, textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
            Tenders &amp; Bids
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 'clamp(14px, 2vw, 18px)', margin: '0 0 28px', maxWidth: 520 }}>
            Browse active procurement opportunities and submit competitive bids
          </p>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { icon: <CheckCircle size={16} />, label: `${counts.open} Open` },
              { icon: <Award size={16} />, label: `${counts.awarded} Awarded` },
              { icon: <AlertTriangle size={16} />, label: `${counts.closed} Closed` },
            ].map(({ icon, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 600 }}>
                {icon} {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Sticky Filters ─── */}
      <div className="tender-filters-bar">
        <div className="tender-filters-inner">
          {[
            { key: 'all', label: 'All' },
            { key: 'open', label: '🔥 Open' },
            { key: 'closed', label: 'Closed' },
            { key: 'awarded', label: 'Awarded' },
            { key: 'cancelled', label: 'Cancelled' },
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`status-pill${statusFilter === key ? ' active' : ''}`}
              onClick={() => setStatusFilter(key)}
            >
              {label} {counts[key] > 0 && <span style={{ background: statusFilter === key ? 'rgba(255,255,255,0.25)' : '#e2e8f0', padding: '1px 6px', borderRadius: 10, marginLeft: 4, fontSize: 11 }}>{counts[key]}</span>}
            </button>
          ))}
          <div className="search-bar" style={{ marginLeft: 'auto' }}>
            <Search size={15} color="#94a3b8" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tenders..."
            />
          </div>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div className="tender-main-layout">
        <div className="tender-results-header">
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>
              {statusFilter === 'all' ? 'All Tenders' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Tenders`}
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''} found</p>
          </div>
          {statusFilter === 'open' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669', fontSize: 13, fontWeight: 600 }}>
              <Flame size={14} /> Live bidding open
            </div>
          )}
        </div>

        {loading ? (
          [1, 2, 3, 4].map(i => <div key={i} className="card-shimmer" />)
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#64748b', margin: '0 0 8px' }}>No tenders found</h3>
            <p style={{ fontSize: 14 }}>Try a different filter or check back later.</p>
          </div>
        ) : (
          filtered.map((t, i) => (
            <TenderCard
              key={t.id}
              t={t}
              index={i}
              onClick={() => navigate(`/tenders/${t.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
};
