import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../services/apiClient';
import { Calendar, MapPin, Briefcase, Clock, Play, ArrowLeft, X } from 'lucide-react';
import { PublicNav } from './PublicNavFooter';

const ShimmerBlock = ({ width = '100%', height = 16, margin = '0 0 8px', borderRadius = 6 }) => (
  <div style={{
    width, height, margin, borderRadius,
    background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  }} />
);

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');
  // make sure path starts with a slash
  const safePath = path.startsWith('/') ? path : `/uploads/news/${path}`;
  return `${baseUrl}${safePath}`;
};

const VideoSkeleton = () => (
  <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
    <div style={{
      aspectRatio: '16/9', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Play size={24} color="rgba(255,255,255,0.4)" fill="rgba(255,255,255,0.4)" />
      </div>
    </div>
    <div style={{ padding: 14 }}>
      <ShimmerBlock width="80%" height={14} />
      <ShimmerBlock width="60%" height={12} margin="6px 0 0" />
    </div>
  </div>
);

const CardSkeleton = () => (
  <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0' }}>
    <ShimmerBlock width="60px" height={18} borderRadius={99} />
    <ShimmerBlock width="90%" height={18} margin="12px 0 8px" />
    <ShimmerBlock height={13} margin="0 0 4px" />
    <ShimmerBlock width="70%" height={13} margin="0 0 12px" />
    <ShimmerBlock width="120px" height={12} />
  </div>
);

export default () => {
  const { type: filterParam } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(filterParam || 'all');
  const [playingVideo, setPlayingVideo] = useState(null);
  useEffect(() => {
    setActiveFilter(filterParam || 'all');
  }, [filterParam]);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/news/public');
        if (res.status === 'success') setPosts(res.data);
      } catch (_) { /* ignore */ }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  useEffect(() => {
    if (playingVideo) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [playingVideo]);

  const extractYoutubeId = (url) => {
    const m = url?.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  };

  const filtered = activeFilter === 'all' ? posts : posts.filter(p => p.type === activeFilter);

  const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'news', label: '\uD83D\uDCF0 News' },
    { key: 'hiring', label: '\uD83D\uDCBC Hiring' },
    { key: 'video', label: '\uD83C\uDFAC Video' },
    { key: 'photo_gallery', label: '\uD83D\uDDBC\uFE0F Photos' },
  ];

  const renderShimmer = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {[1, 2, 3, 4, 5, 6].map(i => <CardSkeleton key={i} />)}
      </div>
      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
        {[1, 2, 3].map(i => <div key={i} style={{ flex: '0 0 340px' }}><VideoSkeleton /></div>)}
      </div>
    </div>
  );

  return (
    <><PublicNav />
    <div style={{ width: '98%', maxWidth: 1400, margin: '0 auto', padding: '40px 20px 80px', minHeight: '100vh', background: 'linear-gradient(160deg, #f8f9fc 0%, #f1f3f6 100%)' }}>
      <button onClick={() => navigate(-1)} className="tip-wrap" style={{
        background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
        color: '#64748b', fontSize: 14, fontWeight: 600, marginBottom: 16, padding: 0,
      }}>
        <ArrowLeft size={18} /> <span>Back</span>
        <span className="tip tip-right" style={{ bottom: 'auto', top: '50%', transform: 'translateY(-50%)' }}>Go back</span>
      </button>

      <div style={{
        marginBottom: 32,
      }}>
        <marquee behavior="scroll" direction="left" scrollamount="5" style={{ display: 'block', padding: '20px 0 12px' }}>
          <span style={{
            fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 900, letterSpacing: '-0.02em',
            background: 'linear-gradient(90deg, #059669, #10b981, #6366f1, #f59e0b, #059669)',
            backgroundSize: '300% 100%',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            animation: 'newsTitleShimmer 4s linear infinite',
            paddingRight: 60,
            textShadow: '0 4px 20px rgba(5,150,105,0.25), 0 8px 40px rgba(99,102,241,0.15)',
          }}>
            📢 News &amp; Announcements &nbsp;·&nbsp; Stay informed with the latest from Sutana &nbsp;·&nbsp;
          </span>
        </marquee>
        <style>{`
          @keyframes newsTitleShimmer {
            0% { background-position: 0% 50%; }
            100% { background-position: 300% 50%; }
          }
          marquee {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          marquee::-webkit-scrollbar { display: none; }
        `}</style>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setActiveFilter(f.key)}
            style={{
              padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
              background: activeFilter === f.key ? '#059669' : '#f1f5f9',
              color: activeFilter === f.key ? 'white' : '#64748b',
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? renderShimmer() : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8' }}>
          <p>No {activeFilter === 'all' ? '' : activeFilter.replace('_', ' ')} posts found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {(activeFilter === 'all' || activeFilter === 'news') && (
            filtered.filter(p => p.type === 'news').length > 0 && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                  {filtered.filter(p => p.type === 'news').map(p => (
                    <div key={p.id} style={{
                      background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                        background: '#dbeafe', color: '#1e40af', marginBottom: 8
                      }}>News</span>
                      <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{p.title}</h3>
                      {p.content && (
                        <p style={{ margin: '0 0 12px', fontSize: 13, color: '#64748b', lineHeight: 1.5,
                          display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                        }}>
                          {p.content.replace(/<[^>]*>/g, '')}
                        </p>
                      )}
                      <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={12} /> {new Date(p.created_at).toLocaleDateString('en-CA')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

          {(activeFilter === 'all' || activeFilter === 'hiring') && (
            filtered.filter(p => p.type === 'hiring').length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {filtered.filter(p => p.type === 'hiring').map(p => (
                  <div key={p.id} style={{
                    background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{p.hiring_position || p.title}</h3>
                      <span style={{ fontSize: 11, color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                        {p.hiring_location || 'Addis Ababa'}
                      </span>
                    </div>
                    {p.content && <p style={{ margin: '0 0 12px', fontSize: 13, color: '#64748b' }}>{p.content.replace(/<[^>]*>/g, '')}</p>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#94a3b8', marginBottom: 12, flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={12} /> Deadline: {new Date(p.hiring_deadline).toLocaleDateString('en-CA')}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={12} /> {p.hiring_location || 'Addis Ababa'}</span>
                    </div>
                    {p.hiring_email && (
                      <a href={`mailto:${p.hiring_email}`} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4, padding: '8px 18px',
                        background: '#059669', color: 'white', borderRadius: 8, fontWeight: 600, fontSize: 13, textDecoration: 'none'
                      }}>
                        <Briefcase size={14} /> Apply Now
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {(activeFilter === 'all' || activeFilter === 'video') && (
            filtered.filter(p => p.type === 'video').length > 0 && (
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
              }}>
                  {filtered.filter(p => p.type === 'video').map(p => {
                  const vid = extractYoutubeId(p.youtube_url);
                  return vid ? (
                    <div key={p.id} style={{
                      background: 'white', borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ aspectRatio: '16/9', background: '#0f172a', position: 'relative', cursor: 'pointer' }}
                        onClick={() => setPlayingVideo(vid)}>
                        <>
                          <img src={`https://img.youtube.com/vi/${vid}/hqdefault.jpg`} alt={p.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{
                            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Play size={24} color="white" fill="white" />
                            </div>
                          </div>
                        </>
                      </div>
                      <div style={{ padding: 14 }}>
                        <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{p.title}</h4>
                        {p.content && <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{p.content.replace(/<[^>]*>/g, '').slice(0, 120)}</p>}
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            )
          )}

          {(activeFilter === 'all' || activeFilter === 'photo_gallery') && (
            filtered.filter(p => p.type === 'photo_gallery').length > 0 && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {filtered.filter(p => p.type === 'photo_gallery').map(p => {
                    const imgs = p.images ? (typeof p.images === 'string' ? JSON.parse(p.images) : p.images) : [];
                    return imgs.map((img, i) => (
                      <div key={`${p.id}-${i}`} style={{
                        aspectRatio: '1', borderRadius: 10, overflow: 'hidden', background: '#f1f5f9',
                        border: '1px solid #e2e8f0'
                      }}>
                        <img src={getImageUrl(img)} alt={p.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => { e.target.style.display = 'none'; }} />
                      </div>
                    ));
                  })}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {playingVideo && (
        <div onClick={() => setPlayingVideo(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            position: 'relative', width: '100%', maxWidth: 960, aspectRatio: '16/9',
            background: '#000', borderRadius: 12, overflow: 'hidden'
          }}>
            <button onClick={() => setPlayingVideo(null)} style={{
              position: 'absolute', top: 12, right: 12, zIndex: 10,
              width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.6)',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <X size={20} color="white" />
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${playingVideo}?autoplay=1&rel=0&modestbranding=1&showinfo=0`}
              title="Video Player"
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
    </>
  );
};
