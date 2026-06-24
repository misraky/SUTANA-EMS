import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../services/apiClient';
import { Search, Package, Wrench, Newspaper, Image, FileText, X } from 'lucide-react';
import './SearchDropdown.css';

const GROUP_ICONS = { products: <Package size={14} />, services: <Wrench size={14} />, news: <Newspaper size={14} />, gallery: <Image size={14} />, pages: <FileText size={14} /> };
const GROUP_LABELS = { products: 'Products', services: 'Services', news: 'News', gallery: 'Gallery', pages: 'Pages' };

export default function SearchDropdown() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const ref = useRef(null);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchLive = useCallback(async (q) => {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await axios.get(`/public/search?q=${encodeURIComponent(q)}&live=true&limit=3`);
      if (res.status === 'success') { setResults(res.groups || []); setOpen(true); }
    } catch (_) { setResults([]); }
    finally { setLoading(false); }
  }, []);

  const handleChange = (e) => {
    const v = e.target.value.slice(0, 100);
    setQuery(v);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchLive(v), 300);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim().length < 2) return;
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
    if (e.key === 'Enter') handleSubmit(e);
  };

  const handleSelect = (item) => {
    setOpen(false);
    setQuery('');
    navigate(item.url || '#');
  };

  return (
    <div ref={ref} className={`sd-wrap${focused ? ' sd-wrap--focused' : ''}`}>
      <form onSubmit={handleSubmit} className="sd-form" onFocus={() => { setFocused(true); if (query.length >= 2) setOpen(true); }} onBlur={() => setFocused(false)}>
        <Search size={15} className="sd-form-icon" />
        <input ref={inputRef} value={query} onChange={handleChange} onKeyDown={handleKeyDown}
          placeholder="Search..." className="sd-form-input"
        />
        {query && <button type="button" onClick={() => { setQuery(''); setResults([]); setOpen(false); inputRef.current?.focus(); }} className="sd-form-clear"><X size={14} /></button>}
      </form>

      {open && (
        <div className="sd-dropdown">
          {loading ? (
            <div className="sd-dropdown-status">Searching<span className="sd-dots" /></div>
          ) : results.length === 0 ? (
            <div className="sd-dropdown-status">
              No results for <strong>{query}</strong>
            </div>
          ) : (
            <>
              {results.map(group => (
                <div key={group.category} className="sd-group">
                  <div className="sd-group-header">
                    {GROUP_ICONS[group.category]} {GROUP_LABELS[group.category] || group.category}
                  </div>
                  {group.items.slice(0, 3).map((item, i) => (
                    <div key={item.id || i} className="sd-item" onClick={() => handleSelect(item)}>
                      <div className="sd-item-title">{highlight(item.name || item.title, query)}</div>
                      <div className="sd-item-meta">
                        {group.category === 'products' && item.price && `${Number(item.price).toLocaleString()} ETB`}
                        {group.category === 'services' && item.description?.slice(0, 60)}
                        {group.category === 'news' && item.date && new Date(item.date).toLocaleDateString('en-CA')}
                        {group.category === 'gallery' && item.title}
                        {group.category === 'pages' && item.url}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              <div className="sd-see-all" onClick={() => { setOpen(false); navigate(`/search?q=${encodeURIComponent(query)}`); }}>
                See all results →
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function highlight(text, query) {
  if (!text || !query) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return parts.map((part, i) => part.toLowerCase() === query.toLowerCase()
    ? <strong key={i} className="sd-highlight">{part}</strong> : part);
}
