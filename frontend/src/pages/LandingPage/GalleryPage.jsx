import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import axios from '../../services/apiClient';
import { X, Car, Users, PartyPopper, Package, MapPin, Calendar } from 'lucide-react';

const CATEGORIES = [
  { key: 'cars', label: 'Cars & Fleet', icon: <Car size={20} /> },
  { key: 'workplace', label: 'Workers & Workplace', icon: <Users size={20} /> },
  { key: 'events', label: 'Events & Activities', icon: <PartyPopper size={20} /> },
  { key: 'products', label: 'Products Showcase', icon: <Package size={20} /> },
];

const resolveImg = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${axios.defaults.baseURL.replace('/api/v1', '')}${url}`;
};

const GALLERY = {
  cars: { icon: '\uD83D\uDE97', label: 'Cars & Fleet' },
  workplace: { icon: '\uD83D\uDC65', label: 'Workers & Workplace' },
  events: { icon: '\uD83C\uDF89', label: 'Events & Activities' },
  products: { icon: '\uD83D\uDCE6', label: 'Products Showcase' },
};

export default () => {
  const location = useLocation();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [popup, setPopup] = useState(null);
  const [cols, setCols] = useState(3);

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      if (w < 600) setCols(1);
      else if (w < 900) setCols(2);
      else setCols(3);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Handle hash-based navigation from header links
  useEffect(() => {
    if (location.hash) {
      const cat = location.hash.replace('#section-', '');
      if (['cars', 'workplace', 'events', 'products'].includes(cat)) {
        setFilter(cat);
        setTimeout(() => {
          document.getElementById(location.hash.replace('#', ''))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      }
    }
  }, [location.hash, images]);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/gallery/public');
        if (res.status === 'success') setImages(res.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  useEffect(() => {
    if (popup) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [popup]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') setPopup(null);
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const grouped = {};
  images.forEach(img => {
    if (filter !== 'all' && img.category !== filter) return;
    if (!grouped[img.category]) grouped[img.category] = [];
    grouped[img.category].push(img);
  });

  return (
    <div style={{ maxWidth: '95vw', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', margin: '0 0 8px', textAlign: 'center' }}>
        GALLERY <span style={{ color: '#059669' }}>- SUTANA</span>
      </h1>
      <p style={{ textAlign: 'center', color: '#64748b', marginBottom: 32, fontSize: 14 }}>
        Explore our fleet, workplace, events, and products
      </p>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
        {[{ key: 'all', label: 'All' }, ...CATEGORIES].map(c => (
          <button key={c.key} onClick={() => setFilter(c.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px',
              borderRadius: 10, border: `2px solid ${filter === c.key ? '#059669' : '#e2e8f0'}`,
              background: filter === c.key ? '#f0fdf4' : 'white',
              color: filter === c.key ? '#059669' : '#475569',
              cursor: 'pointer', fontWeight: 600, fontSize: 13,
              transition: 'all 0.15s'
            }}>
            {c.icon}{c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#94a3b8' }}>Loading gallery...</p>
      ) : Object.keys(grouped).length === 0 ? (
        <p style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem 0' }}>No images found.</p>
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <section key={cat} id={`section-${cat}`} style={{ marginBottom: 48 }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '0 0 16px', paddingBottom: 8, borderBottom: '2px solid #e2e8f0' }}>
              <span style={{ fontSize: 24 }}>{GALLERY[cat]?.icon}</span>
              {GALLERY[cat]?.label || cat}
            </h2>
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 16
            }}>
              {items.map(img => (
                <div key={img.id}
                  onClick={() => setPopup(img)}
                  style={{
                    flex: `0 0 calc(${100 / cols}% - ${16 * (cols - 1) / cols}px)`, background: 'white', borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
                    border: '1px solid #e2e8f0', transition: 'transform 0.15s, box-shadow 0.15s'
                  }}>
                  <div style={{
                    width: '100%', height: 300, background: '#1e293b',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    {img.image_path ? (
                      <img src={resolveImg(img.image_path)} alt={img.title}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        onError={e => { e.target.style.display = 'none'; }} />
                    ) : null}
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: '#1e293b' }}>{img.title}</h3>
                    {img.description && (
                      <p style={{ margin: 0, fontSize: 13, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {img.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      {/* Popup Modal */}
      {popup && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
          backdropFilter: 'blur(4px)'
        }} onClick={() => setPopup(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'white', borderRadius: 16, maxWidth: 720, width: '100%',
            maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ position: 'relative' }}>
              {popup.image_path && (
                <img src={resolveImg(popup.image_path)} alt={popup.title}
                  style={{ width: '100%', maxHeight: 460, objectFit: 'contain', background: '#0f172a', display: 'block' }}
                  onError={e => { e.target.style.display = 'none'; }} />
              )}
              <button onClick={() => setPopup(null)}
                style={{
                  position: 'absolute', top: 10, right: 10,
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18
                }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '20px 24px 24px' }}>
              <h2 style={{ margin: '0 0 8px', fontSize: 20, color: '#0f172a' }}>{popup.title}</h2>
              {popup.description && (
                <p style={{ margin: '0 0 12px', fontSize: 14, color: '#475569', lineHeight: 1.6 }}>{popup.description}</p>
              )}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: '#64748b' }}>
                {popup.date_taken && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={14} /> {new Date(popup.date_taken).toLocaleDateString('en-CA')}
                  </span>
                )}
                {popup.location && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={14} /> {popup.location}
                  </span>
                )}
              </div>
              <button onClick={() => setPopup(null)}
                style={{
                  marginTop: 16, width: '100%', padding: '10px',
                  background: '#f1f5f9', border: 'none', borderRadius: 8,
                  fontWeight: 600, fontSize: 13, color: '#475569', cursor: 'pointer'
                }}>
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
