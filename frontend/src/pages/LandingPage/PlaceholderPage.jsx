import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { PublicNav, PublicFooter } from './ServicesPage';
import './PublicLayout.css';

const pageInfo = {
  '/track-order': { title: 'Track Order', icon: '🔍', desc: 'Enter your order ID to track the status of your print jobs and deliveries.' },
  '/search': { title: 'Search Results', icon: '🔎', desc: 'Search results for products, services, and documents across Sutana.' },
  '/gallery/workers': { title: 'Our Team & Workplace', icon: '👥', desc: 'Meet the people behind Sutana and explore our work environment.' },
  '/gallery/cars': { title: 'Fleet Gallery', icon: '🚗', desc: 'Browse our rental fleet — from sedans to SUVs.' },
  '/gallery/other': { title: 'Gallery', icon: '🖼️', desc: 'Explore moments and milestones from across Sutana.' },
  '/news/notice': { title: 'Notices', icon: '📢', desc: 'Official announcements and important updates from Sutana.' },
  '/news/video': { title: 'Videos', icon: '🎥', desc: 'Product demos, tutorials, and company videos.' },
  '/news/gallery': { title: 'News Gallery', icon: '📸', desc: 'Photo gallery covering events, launches, and team activities.' },
};

const PlaceholderPage = () => {
  const location = useLocation();
  const info = pageInfo[location.pathname] || { title: 'Page', icon: '📄', desc: 'This page is under construction.' };

  return (
    <div className="public-page">
      <PublicNav />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 480 }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>{info.icon}</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', marginBottom: 12, letterSpacing: '-0.02em' }}>{info.title}</h1>
          <p style={{ fontSize: 16, color: '#4B5563', lineHeight: 1.7, marginBottom: 32 }}>{info.desc}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link to="/" className="pub-btn-primary">Back to Home</Link>
            <Link to="/contact" className="pub-btn-secondary">Contact Us</Link>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
};

export default PlaceholderPage;