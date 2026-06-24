import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicNav } from './PublicNavFooter';
import authService from '../../services/authService';
import printingHero from '../../assets/hero-section/printing.jpg';
import {
  BookOpen, Notebook, FileText, Image, Printer, Clock,
  Package, Percent, Calculator, ShoppingCart, ChevronDown,
  ChevronUp, X, CheckCircle
} from 'lucide-react';
import bookImg from '../../assets/printing/book.jpg';
import moduleImg from '../../assets/printing/module.jpg';
import examImg from '../../assets/printing/exam peper.jpg';
import brochureImg from '../../assets/printing/brocure.jpg';

const s = {
  section: { padding: '72px 24px' },
  container: { maxWidth: 1100, margin: '0 auto' },
  heading: { fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 800, color: '#1a2b4b', margin: '0 0 8px', textAlign: 'center' },
  sub: { fontSize: '1rem', lineHeight: 1.7, color: '#6B7280', maxWidth: 640, margin: '0 auto 36px', textAlign: 'center' },
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 },
  card: { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '28px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', minHeight: 250, transition: 'transform 0.3s, box-shadow 0.3s', cursor: 'default' },
  iconBox: { width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, flexShrink: 0 },
  cardTitle: { fontWeight: 700, fontSize: '1.25rem', color: '#1a2b4b', marginBottom: 6 },
  cardDesc: { fontSize: '0.95rem', lineHeight: 1.6, color: '#6B7280', margin: 0 },
  altBg: { background: '#F9FAFB' },
  btnPrimary: { background: '#1a2b4b', color: '#fff', border: 'none', padding: '14px 32px', borderRadius: 10, fontWeight: 700, fontSize: '1rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'background 0.2s' },
  btnOutline: { background: '#fff', color: '#1a2b4b', border: 'none', padding: '14px 32px', borderRadius: 10, fontWeight: 700, fontSize: '1rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'background 0.2s' },
};

const PAPER_TYPES = [
  { code: 'A3', name: 'A3', desc: '297mm × 420mm', price: 1.00 },
  { code: 'A4', name: 'A4', desc: '210mm × 297mm', price: 0.50 },
  { code: 'A5', name: 'A5', desc: '148mm × 210mm', price: 0.75 },
];
const BINDING_TYPES = [
  { code: 'None', name: 'No Binding', price: 0 },
  { code: 'Spiral', name: 'Spiral Binding', price: 500 },
  { code: 'Thermal', name: 'Thermal Binding', price: 300 },
];

const services = [
  { icon: BookOpen,  color: '#4F46E5', bg: '#EEF2FF', title: 'Book Printing',    price: 'From 0.50 ETB/page', img: bookImg },
  { icon: Notebook,  color: '#0EA5E9', bg: '#F0F9FF', title: 'Module Printing',  price: 'From 0.50 ETB/page', img: moduleImg },
  { icon: FileText,  color: '#F59E0B', bg: '#FFFBEB', title: 'Exam Paper',       price: 'From 0.50 ETB/page', img: examImg },
  { icon: Image,     color: '#10B981', bg: '#F0FDF4', title: 'Brochure Printing', price: 'From 0.75 ETB/page', img: brochureImg },
];

const benefits = [
  { icon: Printer, color: '#4F46E5', bg: '#EEF2FF', title: 'High Quality',      desc: 'Professional-grade printers and premium paper for crisp, clean output.' },
  { icon: Clock,   color: '#F59E0B', bg: '#FFFBEB', title: 'Fast Turnaround',    desc: 'Most orders completed within 24-48 hours. Rush service available.' },
  { icon: Package, color: '#10B981', bg: '#F0FDF4', title: 'Reliable Service',   desc: 'Track your order status online. Notified when ready for pickup.' },
  { icon: Percent, color: '#0EA5E9', bg: '#F0F9FF', title: 'Bulk Discounts',     desc: 'Special pricing for large orders. Contact us for custom quotes.' },
];

const pricingRows = [
  { name: 'Per Page Rate', a4: '0.50 ETB', a5: '0.75 ETB', a3: '1.00 ETB', color: '1.00 / 1.50 / 2.00' },
  { name: 'Spiral Binding', a4: '500 ETB', a5: '500 ETB', a3: '500 ETB', color: 'Per copy' },
  { name: 'Thermal Binding', a4: '300 ETB', a5: '300 ETB', a3: '300 ETB', color: 'Per copy' },
];

function PrintingServicePage() {
  const navigate = useNavigate();
  const [calc, setCalc] = useState({ showCalc: false, paperType: 'A4', pagesPerCopy: 100, quantity: 50, colorPrinting: false, bindingType: 'None' });
  const [pricing, setPricing] = useState(null);

  useEffect(() => {
    const basePrice = PAPER_TYPES.find(p => p.code === calc.paperType)?.price || 0.50;
    const multiplier = calc.colorPrinting ? 2.0 : 1.0;
    const pricePerUnit = calc.pagesPerCopy * basePrice * multiplier;
    const bindingCost = (BINDING_TYPES.find(b => b.code === calc.bindingType)?.price || 0) * calc.quantity;
    const subtotal = pricePerUnit * calc.quantity;
    setPricing({ pricePerUnit, bindingCost, subtotal, totalPrice: subtotal + bindingCost });
  }, [calc]);

  const handleOrder = () => {
    if (!authService.isAuthenticated()) {
      navigate('/login', { state: { from: '/services/printing' } });
    } else {
      navigate('/customer/new-printing-order');
    }
  };

  const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: '0.9rem', outline: 'none', color: '#111827', background: '#fff' };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <PublicNav />

      {/* ── Section 1: Hero ── */}
      <section style={{ background: `linear-gradient(rgba(26,43,75,0.75), rgba(13,124,102,0.7)), url(${printingHero}) center/cover`, padding: '100px 24px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'radial-gradient(circle at 25% 25%, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div style={{ maxWidth: 700, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.12)', borderRadius: 999, padding: '8px 20px', marginBottom: 24, color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>
            <Printer size={18} /> SUTANA Printing Services
          </div>
          <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(2rem,5vw,48px)', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
            Professional Printing <span style={{ color: '#6EE7B7' }}>Services</span>
          </h1>
          <p style={{ fontSize: 'clamp(1rem,2vw,28px)', color: 'rgba(255,255,255,0.85)', marginBottom: 32, lineHeight: 1.5, fontWeight: 500 }}>
            Books, Modules, Exam Papers, Brochures & Tax Receipts
          </p>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', marginBottom: 36 }}>High quality, fast turnaround, competitive pricing.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <button style={s.btnOutline} onClick={() => setCalc(c => ({ ...c, showCalc: !c.showCalc }))}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.9)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
            >
              <Calculator size={20} /> {calc.showCalc ? 'Hide Calculator' : 'Calculate Price'}
            </button>
            <button style={{ ...s.btnPrimary, background: '#0D7C66' }} onClick={handleOrder}
              onMouseEnter={e => e.currentTarget.style.background = '#059669'}
              onMouseLeave={e => e.currentTarget.style.background = '#0D7C66'}
            >
              <ShoppingCart size={20} /> Place an Order
            </button>
          </div>
        </div>
      </section>

      {/* Calculator Overlay */}
      {calc.showCalc && (
        <div style={{ maxWidth: 700, margin: '-24px auto 0', position: 'relative', zIndex: 2, background: '#fff', borderRadius: 16, padding: '28px 32px', boxShadow: '0 12px 48px rgba(0,0,0,0.12)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1a2b4b', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calculator size={20} color="#0D7C66" /> Price Calculator
            </h3>
            <button onClick={() => setCalc(c => ({ ...c, showCalc: false }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={20} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>Paper Size</label>
              <select value={calc.paperType} onChange={e => setCalc(c => ({ ...c, paperType: e.target.value }))} style={inputStyle}>
                {PAPER_TYPES.map(p => <option key={p.code} value={p.code}>{p.name} ({p.desc})</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>Binding</label>
              <select value={calc.bindingType} onChange={e => setCalc(c => ({ ...c, bindingType: e.target.value }))} style={inputStyle}>
                {BINDING_TYPES.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>Pages per Copy</label>
              <input type="number" min={1} value={calc.pagesPerCopy} onChange={e => setCalc(c => ({ ...c, pagesPerCopy: Math.max(1, parseInt(e.target.value) || 1) }))} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>Quantity</label>
              <input type="number" min={1} value={calc.quantity} onChange={e => setCalc(c => ({ ...c, quantity: Math.max(1, parseInt(e.target.value) || 1) }))} style={inputStyle} />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: '0.9rem', color: '#4B5563', cursor: 'pointer' }}>
            <input type="checkbox" checked={calc.colorPrinting} onChange={e => setCalc(c => ({ ...c, colorPrinting: e.target.checked }))} style={{ accentColor: '#0D7C66' }} />
            Color Printing (<CheckCircle size={14} style={{ color: '#0D7C66' }} /> ×2 price)
          </label>
          {pricing && (
            <div style={{ marginTop: 18, padding: '16px 20px', background: '#F0FDF4', borderRadius: 10, border: '1px solid #BBF7D0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12, textAlign: 'center' }}>
                <div><span style={{ fontSize: '0.75rem', color: '#166534' }}>Price/Unit</span><div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#15803D' }}>{pricing.pricePerUnit.toFixed(2)} ETB</div></div>
                <div><span style={{ fontSize: '0.75rem', color: '#166534' }}>Binding</span><div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#15803D' }}>{pricing.bindingCost.toFixed(2)} ETB</div></div>
                <div><span style={{ fontSize: '0.75rem', color: '#166534' }}>Total</span><div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#15803D' }}>{pricing.totalPrice.toFixed(2)} ETB</div></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Section 2: Services (4 Cards) ── */}
      <section style={s.section}>
        <div style={s.container}>
          <h2 style={s.heading}>Our Printing Services</h2>
          <p style={s.sub}>High-quality printing for every need</p>
          <div style={s.cardGrid}>
            {services.map((svc, i) => {
              const Icon = svc.icon;
              const bgImage = svc.img;
              return (
                <div key={i}
                  style={{
                    ...s.card,
                    position: 'relative',
                    background: bgImage ? `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.55)), url(${bgImage}) center/cover` : '#fff',
                    border: bgImage ? 'none' : '1px solid #E5E7EB',
                    color: bgImage ? '#fff' : 'inherit',
                    overflow: 'hidden',
                    minHeight: 280,
                    justifyContent: 'flex-end',
                    alignItems: 'flex-start',
                    textAlign: 'left',
                    padding: '24px',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.18)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: 'rgba(255,255,255,0.2)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 10, backdropFilter: 'blur(4px)',
                    }}><Icon size={22} /></div>
                    <div style={{ fontWeight: 700, fontSize: '1.15rem', color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.4)', marginBottom: 2 }}>{svc.title}</div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>{svc.price}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.95rem', color: '#6B7280' }}>
            <FileText size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
            Tax Receipts: Contact us for pricing.
          </p>
        </div>
      </section>

      {/* ── Section 3: Why SUTANA Printing (4 Benefits) ── */}
      <section style={{ ...s.section, ...s.altBg }}>
        <div style={s.container}>
          <h2 style={s.heading}>Why SUTANA Printing?</h2>
          <p style={s.sub}>Four reasons to choose us for your printing needs.</p>
          <div style={s.cardGrid}>
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <div key={i} style={s.card}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ ...s.iconBox, background: b.bg, color: b.color }}><Icon size={24} /></div>
                  <div style={{ ...s.cardTitle, fontSize: '1.15rem' }}>{b.title}</div>
                  <p style={s.cardDesc}>{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Section 4: Pricing Guide (Table) ── */}
      <section style={s.section}>
        <div style={{ ...s.container, maxWidth: 860 }}>
          <h2 style={s.heading}>Pricing Guide</h2>
          <p style={s.sub}>Transparent pricing — no hidden fees.</p>
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                  <th style={{ padding: '14px 18px', textAlign: 'left', color: '#6B7280', fontWeight: 600 }}>Service</th>
                  <th style={{ padding: '14px 18px', textAlign: 'left', color: '#6B7280', fontWeight: 600 }}>A4 (B/W)</th>
                  <th style={{ padding: '14px 18px', textAlign: 'left', color: '#6B7280', fontWeight: 600 }}>A5 (B/W)</th>
                  <th style={{ padding: '14px 18px', textAlign: 'left', color: '#6B7280', fontWeight: 600 }}>A3 (B/W)</th>
                  <th style={{ padding: '14px 18px', textAlign: 'left', color: '#6B7280', fontWeight: 600 }}>Color ×2</th>
                </tr>
              </thead>
              <tbody>
                {pricingRows.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: '#1a2b4b' }}>{r.name}</td>
                    <td style={{ padding: '14px 18px' }}>{r.a4}</td>
                    <td style={{ padding: '14px 18px' }}>{r.a5}</td>
                    <td style={{ padding: '14px 18px' }}>{r.a3}</td>
                    <td style={{ padding: '14px 18px', color: '#0D7C66', fontWeight: 600 }}>{r.color}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Section 5: CTA ── */}
      <section style={{ background: 'linear-gradient(135deg, #1a2b4b 0%, #0D7C66 100%)', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 'clamp(1.5rem,3vw,32px)', fontWeight: 800, color: '#fff' }}>Ready to Get Started?</h2>
          <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.85)', marginBottom: 28, lineHeight: 1.6 }}>
            Place your order online and we'll have it ready for you.
          </p>
          <button onClick={handleOrder} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#0D7C66', color: '#fff', border: 'none', padding: '16px 40px', borderRadius: 10, fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#059669'}
            onMouseLeave={e => e.currentTarget.style.background = '#0D7C66'}
          >
            <ShoppingCart size={20} /> Place an Order Now
          </button>
        </div>
      </section>
    </div>
  );
}

export default PrintingServicePage;
