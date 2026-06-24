import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from '../../services/apiClient';
import { Search, Package, Wrench, Newspaper, Image, FileText, X, AlertCircle, ShoppingCart } from 'lucide-react';
import './PublicLayout.css';

const CATEGORIES = [
  { key: 'all', label: 'All', icon: null },
  { key: 'products', label: 'Products', icon: <Package size={16} /> },
  { key: 'services', label: 'Services', icon: <Wrench size={16} /> },
  { key: 'news', label: 'News', icon: <Newspaper size={16} /> },
  { key: 'gallery', label: 'Gallery', icon: <Image size={16} /> },
  { key: 'pages', label: 'Pages', icon: <FileText size={16} /> },
];

const CATEGORY_ICONS = { products: <Package size={14} />, services: <Wrench size={14} />, news: <Newspaper size={14} />, gallery: <Image size={14} />, pages: <FileText size={14} /> };

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = searchParams.get('q') || '';
  const [activeTab, setActiveTab] = useState('all');
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [queryInput, setQueryInput] = useState(q);

  useEffect(() => setQueryInput(q), [q]);

  useEffect(() => {
    if (!q.trim()) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    axios.get(`/public/search?q=${encodeURIComponent(q)}&limit=20`)
      .then(res => { if (!cancelled && res.status === 'success') setResults(res.results || {}); })
      .catch(err => { if (!cancelled) setError(err?.response?.data?.message || 'Search failed. Please try again.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [q]);

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = queryInput.trim();
    if (trimmed && trimmed !== q) navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const activeCategories = activeTab === 'all' ? CATEGORIES.slice(1) : CATEGORIES.filter(c => c.key === activeTab);

  return (
    <div className="pub-search-results-page">
      <div className="pub-search-results-header">
        <div className="pub-container">
          <form onSubmit={handleSearch} className="pub-search-results-form">
            <Search size={18} color="#94a3b8" />
            <input value={queryInput} onChange={e => setQueryInput(e.target.value.slice(0, 100))}
              placeholder="Search products, services, news, gallery..."
              className="pub-search-results-input" autoFocus
            />
            {queryInput && <button type="button" onClick={() => setQueryInput('')} className="pub-search-results-clear"><X size={16} /></button>}
          </form>
          {q && !loading && !error && <p className="pub-search-results-count">{Object.values(results).reduce((a, b) => a + (b?.length || 0), 0)} results for "{q}"</p>}
        </div>
      </div>

      <div className="pub-container" style={{ padding: '24px 0' }}>
        {error && (
          <div className="pub-search-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div className="pub-search-loading">Searching<DotLoader /></div>
        )}

        {!loading && !error && q && (
          <>
            <div className="pub-search-tabs">
              {CATEGORIES.map(cat => {
                const isActive = activeTab === cat.key;
                const count = cat.key === 'all' ? Object.values(results).reduce((a, b) => a + (b?.length || 0), 0) : (results[cat.key]?.length || 0);
                return (
                  <button key={cat.key} onClick={() => setActiveTab(cat.key)}
                    className={`pub-search-tab${isActive ? ' active' : ''}`}>
                    {cat.icon} {cat.label} <span className="pub-search-tab-count">{count}</span>
                  </button>
                );
              })}
            </div>

            {activeCategories.length === 0 || Object.values(results).every(r => !r?.length) ? (
              <div className="pub-search-empty">
                <Search size={48} color="#cbd5e1" />
                <h3>No results found</h3>
                <p>We couldn't find anything matching "<strong>{q}</strong>". Try different keywords or browse our categories.</p>
                <div className="pub-search-empty-cta">
                  <button onClick={() => navigate('/services')} className="pub-btn-outline">Browse Services</button>
                  <button onClick={() => navigate('/marketplace/regular')} className="pub-btn-outline"><ShoppingCart size={16} /> Visit Marketplace</button>
                </div>
              </div>
            ) : (
              activeCategories.map(cat => {
                const items = results[cat.key] || [];
                if (!items.length) return null;
                return (
                  <section key={cat.key} className="pub-search-section">
                    <h2 className="pub-search-section-title">{CATEGORY_ICONS[cat.key]} {cat.label} <span className="pub-search-section-count">{items.length}</span></h2>
                    <div className="pub-search-grid">
                      {cat.key === 'products' && items.map(item => <ProductCard key={item.id} item={item} q={q} />)}
                      {cat.key === 'services' && items.map((item, i) => <ServiceCard key={i} item={item} q={q} />)}
                      {cat.key === 'news' && items.map(item => <NewsCard key={item.id} item={item} q={q} />)}
                      {cat.key === 'gallery' && items.map(item => <GalleryCard key={item.id} item={item} q={q} />)}
                      {cat.key === 'pages' && items.map((item, i) => <PageCard key={i} item={item} q={q} />)}
                    </div>
                  </section>
                );
              })
            )}
          </>
        )}

        {!q && !loading && (
          <div className="pub-search-empty">
            <Search size={48} color="#cbd5e1" />
            <h3>Search SUTANA</h3>
            <p>Find products, services, news articles, gallery images, and pages.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DotLoader() {
  const [dots, setDots] = useState(0);
  useEffect(() => { const id = setInterval(() => setDots(d => (d + 1) % 4), 400); return () => clearInterval(id); }, []);
  return <span>{'.'.repeat(dots)}</span>;
}

function highlight(text, query) {
  if (!text || !query) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return parts.map((part, i) => part.toLowerCase() === query.toLowerCase()
    ? <strong key={i} style={{ color: '#059669' }}>{part}</strong> : part);
}

function ProductCard({ item, q }) {
  const stockLabel = item.stock === 'in_stock' ? 'In Stock' : item.stock === 'low_stock' ? 'Low Stock' : 'Out of Stock';
  const stockColor = item.stock === 'in_stock' ? '#059669' : item.stock === 'low_stock' ? '#d97706' : '#ef4444';
  return (
    <Link to={item.url || '#'} className="pub-search-card pub-search-card--product">
      <div className="pub-search-card-body">
        <span className="pub-search-card-badge">{highlight(item.name || item.title, q)}</span>
        {item.sku && <span className="pub-search-card-sku">SKU: {item.sku}</span>}
        <span className="pub-search-card-price">{Number(item.price || 0).toLocaleString()} ETB</span>
        <span className="pub-search-card-stock" style={{ color: stockColor }}>{stockLabel}</span>
      </div>
    </Link>
  );
}

function ServiceCard({ item, q }) {
  return (
    <Link to={item.url || '#'} className="pub-search-card">
      <div className="pub-search-card-body">
        <span className="pub-search-card-badge">{highlight(item.title || item.name, q)}</span>
        <p className="pub-search-card-desc">{highlight(item.description?.slice(0, 120), q)}</p>
      </div>
    </Link>
  );
}

function NewsCard({ item, q }) {
  return (
    <Link to={item.url || '#'} className="pub-search-card">
      <div className="pub-search-card-body">
        <span className="pub-search-card-badge">{highlight(item.title, q)}</span>
        {item.date && <span className="pub-search-card-date">{new Date(item.date).toLocaleDateString('en-CA')}</span>}
        <p className="pub-search-card-desc">{highlight(item.content?.slice(0, 150), q)}</p>
      </div>
    </Link>
  );
}

function GalleryCard({ item, q }) {
  return (
    <Link to={item.url || '#'} className="pub-search-card pub-search-card--gallery" style={item.image ? { backgroundImage: `url(${item.image})` } : {}}>
      <div className="pub-search-card-overlay">
        <span className="pub-search-card-badge">{highlight(item.title, q)}</span>
        {item.description && <p className="pub-search-card-desc">{highlight(item.description?.slice(0, 80), q)}</p>}
        {item.location && <span className="pub-search-card-location">{item.location}</span>}
      </div>
    </Link>
  );
}

function PageCard({ item, q }) {
  return (
    <Link to={item.url || '#'} className="pub-search-card">
      <div className="pub-search-card-body">
        <span className="pub-search-card-badge">{highlight(item.title || item.name, q)}</span>
        {item.url && <span className="pub-search-card-url">{item.url}</span>}
      </div>
    </Link>
  );
}
