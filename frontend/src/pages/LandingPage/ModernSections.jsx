import React, { useState, useEffect } from 'react';
import {
  Package, Wallet, ShoppingCart, Truck,
  Printer, BarChart3, Key, Settings, Upload, Rocket,
  Shield, Globe, Zap, Smartphone, Star, ArrowRight,
  Quote, ChevronRight, Home, Building2, Briefcase,
  FileText, Phone, LogIn, Scale, Triangle, Car, Pill, Sprout
} from 'lucide-react';
import useInView from './useInView';
import apiClient from '../../services/apiClient';

import happy1 from '../../assets/event/happy1.jpg';
import './LandingRedesign.css';
import './ResponsiveFixes.css';

/* ── Helpers ── */
const InViewWrap = ({ children, className = '', style: extra = {} }) => {
  const [ref, inView] = useInView(0.08);
  return (
    <div ref={ref} className={`${className}${inView ? ' is-visible' : ''}`} style={extra}>
      {children}
    </div>
  );
};

/* ── 1. Stats Bar ── */
const statsData = [
  { icon: Package,  label: 'Enterprise Modules', value: '6+' },
  { icon: Wallet,   label: 'Uptime SLA',         value: '99.9%' },
  { icon: ShoppingCart, label: 'API Response',   value: '<100ms' },
  { icon: Truck,    label: 'Scalability',         value: '∞' },
];

export function StatsSection() {
  return (
    <div style={{ background: '#0D7C66', padding: '40px 40px' }}>
      <div className="modern-container">
        <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 24 }}>
          {statsData.map((s, i) => {
            const Icon = s.icon;
            return (
              <InViewWrap key={i} className="inview-fade-up" style={{ textAlign: 'center', color: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                  <Icon size={32} strokeWidth={1.5} />
                </div>
                <div style={{ fontSize: 'clamp(1.8rem,3vw,2.4rem)', fontWeight: 800, lineHeight: 1.1 }}>{s.value}</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.85, fontWeight: 500 }}>{s.label}</div>
              </InViewWrap>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── 2. Platform Capabilities (Infinite Scroll) ── */
const capabilities = [
  { icon: Package,     title: 'Store',        tag: 'Store',        color: '#4F46E5', para: 'Real-time stock tracking with full movement history, automated reorder alerts, and multi-location warehouse support.' },
  { icon: Wallet,      title: 'Finance',      tag: 'Finance',      color: '#0EA5E9', para: 'From daily expense recording to full ledger management with instant profit and loss reports and audit-ready records.' },
  { icon: Printer,     title: 'Production',   tag: 'Production',   color: '#8B5CF6', para: 'Manage the complete production lifecycle from client order intake through quality control and tax-compliant receipt generation.' },
  { icon: BarChart3,   title: 'Analytics',    tag: 'Analytics',    color: '#F59E0B', para: 'Purpose-built CEO dashboards delivering real-time KPIs, trend analysis, and cross-department performance insights.' },
  { icon: ShoppingCart,title: 'Sales',        tag: 'Sales',        color: '#10B981', para: 'Fast, intuitive POS system with customer accounts, layered discounts, daily sales targets, and auto-synced inventory.' },
  { icon: Truck,       title: 'Purchase',     tag: 'Purchase',     color: '#EF4444', para: 'Streamline procurement from purchase orders and supplier deliveries to goods receipt and vendor performance monitoring.' },
  { icon: Car,         title: 'Car Rental',   tag: 'Car Rental',   color: '#3B82F6', para: 'Vehicle fleet management with real-time booking, driver assignment, maintenance scheduling, and trip tracking for rental businesses.' },
  { icon: Pill,        title: 'Pharmacy',     tag: 'Pharmacy',     color: '#EC4899', para: 'Complete pharmacy management with medicine inventory, expiry date tracking, sales records, and supplier purchase orders.' },
  { icon: Sprout,      title: 'Farming',      tag: 'Farming',      color: '#059669', para: 'End-to-end farming management covering crop planning, harvest tracking, fertilizer application, tool inventory, and yield monitoring.' },
  { icon: Briefcase,   title: 'Consultancy',  tag: 'Consultancy',  color: '#D97706', para: 'Professional business advisory platform with client management, project tracking, strategy development, and growth planning tools.' },
];

function CapabilityCard({ c }) {
  const Icon = c.icon;
  return (
    <div className="cap-card" style={{ cursor: 'default', flexShrink: 0, marginRight: 28, background: '#eff4ff', border: '1px solid #e5e7eb', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '28px 20px', textAlign: 'center', transition: 'transform 0.3s ease, box-shadow 0.3s ease', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
      <div className="icon-hover" style={{ width: 42, height: 42, borderRadius: 12, background: c.color + '15', color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, flexShrink: 0 }}>
        <Icon size={20} />
      </div>
      <span style={{ fontWeight: 800, fontSize: '1rem', color: '#1A202C', marginBottom: 8, flexShrink: 0 }}>{c.title}</span>
      <p className="cap-para" style={{ fontSize: '0.78rem', lineHeight: 1.55, color: '#4A5568', margin: 0, fontWeight: 600, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>{c.para}</p>
      <Triangle size={14} color={c.color} fill={c.color} style={{ marginTop: 'auto', flexShrink: 0, opacity: 0.5 }} />
    </div>
  );
}

export function CapabilitiesSection() {
  const topRow = capabilities.slice(0, 5);
  const bottomRow = capabilities.slice(5);
  return (
    <section className="modern-section modern-section--alt">
      <div className="modern-container">
        <div className="section-header">
          <h2>Platform Capabilities</h2>
          <p>Ten powerful modules purpose-built for Ethiopian enterprises — integrated under one roof.</p>
        </div>
        {/* Top row — moving RIGHT */}
        <div className="scroll-track-wrap" style={{ marginBottom: 28 }}>
          <div className="scroll-track scroll-right">
            {[...topRow, ...topRow].map((c, i) => <CapabilityCard key={i} c={c} />)}
          </div>
        </div>
        {/* Bottom row — moving LEFT */}
        <div className="scroll-track-wrap">
          <div className="scroll-track scroll-left">
            {[...bottomRow, ...bottomRow].map((c, i) => <CapabilityCard key={i} c={c} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── 3. Getting Started ── */
const steps = [
  { icon: Key,     title: 'Request Access',      desc: 'Contact us or sign in. Your admin sets up your account and assigns role‑based permissions.' },
  { icon: Settings,title: 'Configure Modules',    desc: 'Enable only what you need today — Sales, Inventory, Finance — and activate more as you grow.' },
  { icon: Upload,  title: 'Import Your Data',     desc: 'Migrate existing records with guided tools. Our team supports you every step of the way.' },
  { icon: Rocket,  title: 'Go Live & Grow',       desc: 'Start working from day one. Dashboards, alerts, and reports give you full visibility.' },
];

export function GettingStartedSection() {
  return (
    <section className="modern-section modern-section--dark">
      <div className="modern-container">
        <div className="section-header section-header--dark">
          <h2>Getting Started</h2>
          <p>Up and running in 4 simple steps. Most businesses are fully operational within their first week.</p>
        </div>
        <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 28 }}>
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <InViewWrap key={i} className="inview-fade-up">
                <div className="glass-card" style={{ padding: '36px 28px', textAlign: 'center', cursor: 'default' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(13,124,102,0.2)', color: '#0D7C66', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontWeight: 800, fontSize: '1.1rem' }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className="icon-hover" style={{ marginBottom: 14, color: '#d4a017' }}>
                    <Icon size={28} />
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>{s.title}</h3>
                  <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#94a3b8', margin: 0 }}>{s.desc}</p>
                </div>
              </InViewWrap>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── 4. Why SUTANA ── */
const benefits = [
  { icon: Shield,     title: 'Secure & Role‑Based Access',     desc: 'Granular, military‑grade access ensures every user sees only what is relevant. Full audit trails give complete accountability.' },
  { icon: Globe,      title: 'Locally Tailored for Ethiopia',  desc: 'ETB currency, Ethiopian tax compliance, and an interface built around the day‑to‑day realities of your business.' },
  { icon: Zap,        title: 'Fast & Always Reliable',         desc: 'Sub‑100ms API responses backed by MySQL & Node.js, with 99.9% uptime SLA — even at peak hour.' },
  { icon: Smartphone, title: 'Works on Every Device',          desc: 'Fully responsive across desktop, tablet, and mobile — wherever your team is working, the experience is seamless.' },
];

export function WhySutanaSection() {
  return (
    <section className="modern-section" style={{ background: '#fff' }}>
      <div className="modern-container">
        <div className="section-header">
          <h2>Why SUTANA</h2>
          <p>Trusted by Growing Ethiopian Enterprises — Simplifying Operations, Empowering Growth.</p>
        </div>
        <div className="stack-mobile" style={{ display: 'flex', gap: 48, alignItems: 'flex-start' }}>
          {/* Left — Benefits */}
          <div style={{ flex: '0 0 50%' }}>
            <div className="stagger">
              {benefits.map((b, i) => {
                const Icon = b.icon;
                return (
                  <InViewWrap key={i} className="inview-fade-up" style={{ marginBottom: 20 }}>
                    <div className="modern-card" style={{ display: 'flex', gap: 18, padding: '24px 22px', cursor: 'default' }}>
                      <div className="icon-hover" style={{ width: 48, height: 48, borderRadius: 12, background: '#0D7C6615', color: '#0D7C66', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={22} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{b.title}</h4>
                        <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#64748b', margin: 0 }}>{b.desc}</p>
                      </div>
                    </div>
                  </InViewWrap>
                );
              })}
            </div>
          </div>
          {/* Right — Image */}
          <InViewWrap className="inview-fade-up" style={{ flex: '0 0 50%' }}>
            <div className="hover-float" style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }}>
              <img src={happy1} alt="SUTANA Enterprise" style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
          </InViewWrap>
        </div>
      </div>
    </section>
  );
}

/* ── 5. Success Stories ── */
const testimonials = [
  { quote: "Before SUTANA, we were running three different spreadsheets for inventory, finance, and sales. Now everything is connected. Our month‑end close time dropped from 5 days to just a few hours.", name: 'Tigist Alemu', role: 'Finance Director, Addis Trading PLC', initials: 'TA', color: '#4F46E5' },
  { quote: "The CEO dashboard is exactly what I needed. I can see revenue, inventory status, and production output at a glance — anytime, from anywhere. This is what modern business management looks like.", name: 'Habtamu Bekele', role: 'CEO, Bekele Printing & Publishing', initials: 'HB', color: '#0EA5E9' },
  { quote: "Our purchase department used to chase down paper orders. Now every order is tracked, every supplier is rated, and we get automatic alerts when deliveries are delayed.", name: 'Meseret Girma', role: 'Operations Manager, Girma Enterprises', initials: 'MG', color: '#10B981' },
];

export function TestimonialsSection() {
  return (
    <section className="modern-section modern-section--alt">
      <div className="modern-container">
        <div className="section-header">
          <h2>Success Stories</h2>
          <p>Businesses that transformed with SUTANA — real results from real Ethiopian enterprises.</p>
        </div>
        <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: 28 }}>
          {testimonials.map((t, i) => (
            <InViewWrap key={i} className="inview-fade-up">
              <div className="modern-card" style={{ padding: '32px 28px', cursor: 'default', display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Stars */}
                <div style={{ display: 'flex', gap: 2, marginBottom: 14 }}>
                  {[...Array(5)].map((_, si) => (
                    <Star key={si} size={16} fill="#F59E0B" color="#F59E0B" strokeWidth={1.5} />
                  ))}
                </div>
                <Quote size={32} color="#0D7C6620" style={{ marginBottom: 8 }} />
                <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: '#475569', flex: 1, marginBottom: 20, fontStyle: 'italic' }}>"{t.quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, ${t.color}, ${t.color}88)`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
                    {t.initials}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>{t.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            </InViewWrap>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 7. Smart Footer ── */
const footerLinks = {
  solutions: [
    { icon: Package,     label: 'Inventory',  href: '/services' },
    { icon: Wallet,      label: 'Finance',    href: '/services' },
    { icon: ShoppingCart,label: 'POS',        href: '/services' },
    { icon: Truck,       label: 'Purchase',   href: '/services' },
    { icon: BarChart3,   label: 'Analytics',  href: '/services' },
  ],
  company: [
    { icon: Home,        label: 'Home',       href: '/' },
    { icon: Building2,   label: 'About',      href: '/about' },
    { icon: Briefcase,   label: 'Services',   href: '/services' },
    { icon: FileText,    label: 'Tenders',    href: '/tenders' },
  ],
  support: [
    { icon: Phone,       label: 'Contact Us', href: '/chat' },
    { icon: LogIn,       label: 'Sign In',    href: '/login' },
    { icon: Scale,       label: 'Legal',      href: '#' },
    { icon: Shield,      label: 'Privacy Policy', href: '#' },
    { icon: FileText,    label: 'Terms of Service', href: '#' },
  ],
};

function FooterLink({ icon: Icon, label, href }) {
  return (
    <a href={href} className="footer-link">
      <Icon size={16} className="footer-link-icon" />
      <span>{label}</span>
    </a>
  );
}

export function SmartFooter() {
  const [socialLinks, setSocialLinks] = useState([]);

  useEffect(() => {
    const fetchSocials = async () => {
      try {
        const response = await apiClient.get('/public/social-links');
        // apiClient interceptor already returns response.data
        setSocialLinks(response?.data || []);
      } catch (err) {
        console.error('Failed to load social links', err);
      }
    };
    fetchSocials();
  }, []);

  const FacebookIcon = ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
  );
  const TelegramIcon = ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
  );
  const TikTokIcon = ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
  );
  const YoutubeIcon = ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
  );
  const LinkedinIcon = ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
  );

  const getSocialIcon = (platform, color) => {
    // User requested green color for the icons
    const props = { size: 20, color: '#10B981' };
    switch(platform.toLowerCase()) {
      case 'facebook': return <FacebookIcon {...props} />;
      case 'telegram': return <TelegramIcon {...props} />;
      case 'tiktok': return <TikTokIcon {...props} />;
      case 'youtube': return <YoutubeIcon {...props} />;
      case 'linkedin': return <LinkedinIcon {...props} />;
      default: return null;
    }
  };

  return (
    <footer className="smart-footer">
      <div className="smart-footer-inner">
        {/* Column 1 — Brand */}
        <div className="smart-footer-col smart-footer-brand">
          <div className="footer-brand-name">SUTANA</div>
          <p className="footer-brand-desc">
            Modern Enterprise Management for Ethiopia&rsquo;s growing businesses. Built locally. Trusted widely.
          </p>
        </div>

        {/* Column 2 — Solutions */}
        <div className="smart-footer-col">
          <h4 className="footer-col-heading">Solutions</h4>
          <nav className="footer-col-links">
            {footerLinks.solutions.map((l, i) => (
              <FooterLink key={i} {...l} />
            ))}
          </nav>
        </div>

        {/* Column 3 — Company */}
        <div className="smart-footer-col">
          <h4 className="footer-col-heading">Company</h4>
          <nav className="footer-col-links">
            {footerLinks.company.map((l, i) => (
              <FooterLink key={i} {...l} />
            ))}
          </nav>
        </div>

        {/* Column 4 — Support */}
        <div className="smart-footer-col">
          <h4 className="footer-col-heading">Support</h4>
          <nav className="footer-col-links">
            {footerLinks.support.map((l, i) => (
              <FooterLink key={i} {...l} />
            ))}
          </nav>
        </div>
      </div>

      <div className="smart-footer-divider" />

      <div className="smart-footer-bottom">
        <span>&copy; 2026 SUTANA Enterprise Management System. All rights reserved.</span>
        
        {socialLinks.length > 0 && (
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {socialLinks.filter(l => l.is_active).map(link => (
              <a 
                key={link.platform} 
                href={link.url || '#'} 
                target={link.url ? "_blank" : "_self"} 
                rel="noopener noreferrer"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  background: 'rgba(255,255,255,0.05)',
                  padding: '8px',
                  borderRadius: '50%',
                  transition: 'background 0.3s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                  e.currentTarget.firstChild.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.firstChild.style.transform = 'scale(1)';
                }}
              >
                {getSocialIcon(link.platform, link.icon_color)}
              </a>
            ))}
          </div>
        )}

        <span className="footer-location">Injibara, Ethiopia</span>
      </div>
    </footer>
  );
}

export function CTASection() {
  return (
    <section style={{ padding: '80px 40px', background: 'linear-gradient(135deg, #0D7C66 0%, #1A8F7A 40%, #0EA5E9 100%)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.08, backgroundImage: 'radial-gradient(circle at 25% 50%, #fff 0%, transparent 50%), radial-gradient(circle at 75% 50%, #fff 0%, transparent 50%)' }} />
      <div className="modern-container" style={{ position: 'relative', zIndex: 1, textAlign: 'center', color: '#fff' }}>
        <div style={{ display: 'inline-block', padding: '6px 18px', borderRadius: 99, background: 'rgba(255,255,255,0.15)', fontSize: '0.8rem', fontWeight: 600, marginBottom: 20, backdropFilter: 'blur(6px)' }}>
          Ready to transform?
        </div>
        <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 800, marginBottom: 16, lineHeight: 1.15 }}>
          Stop managing chaos.<br />Start managing growth.
        </h2>
        <p style={{ fontSize: '1rem', lineHeight: 1.7, opacity: 0.9, maxWidth: 640, margin: '0 auto 36px' }}>
          Join forward-thinking Ethiopian businesses using SUTANA EMS to eliminate manual work, eliminate data silos, and gain real-time visibility into every corner of your operations.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => window.location.href = '/login'} style={{ padding: '14px 36px', borderRadius: 12, border: 'none', background: '#fff', color: '#0D7C66', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 8px 25px rgba(0,0,0,0.15)' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 12px 35px rgba(0,0,0,0.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)'; }}
          >
            Sign In Now <ArrowRight size={18} />
          </button>
          <button onClick={() => window.location.href = '/chat'} style={{ padding: '14px 36px', borderRadius: 12, border: '2px solid rgba(255,255,255,0.3)', background: 'transparent', color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'transform 0.2s', backdropFilter: 'blur(6px)' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
          >
            Talk to Our Team <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
