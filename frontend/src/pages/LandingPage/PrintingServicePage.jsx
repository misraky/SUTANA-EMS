import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicNav, PublicFooter } from './PublicNavFooter';
import authService from '../../services/authService';
import axios from '../../services/apiClient';
import { Printer, FileText, BookOpen, Layers, Search, Calculator, ShoppingCart, X, ChevronDown, ChevronUp, CheckCircle, Clock, Star, Shield, Truck } from 'lucide-react';

const PRODUCT_TYPES = [
  { code: 'Book', name: 'Book Printing', icon: <BookOpen size={20} />, desc: 'For scholars and researchers', color: '#3b82f6', bg: '#eff6ff', price: 'From 0.50 ETB/page' },
  { code: 'Module', name: 'Module Printing', icon: <Layers size={20} />, desc: 'For lecturers and educators', color: '#8b5cf6', bg: '#f5f3ff', price: 'From 0.50 ETB/page' },
  { code: 'Exam', name: 'Exam Paper', icon: <FileText size={20} />, desc: 'For examinations and tests', color: '#f59e0b', bg: '#fffbeb', price: 'From 0.50 ETB/page' },
  { code: 'Brochure', name: 'Brochure Printing', icon: <Printer size={20} />, desc: 'For churches, weddings, events', color: '#10b981', bg: '#ecfdf5', price: 'From 0.75 ETB/page' },
  { code: 'TaxReceipt', name: 'Tax Receipts', icon: <FileText size={20} />, desc: 'Official government tax receipts', color: '#ef4444', bg: '#fef2f2', price: 'Contact us' },
];

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

const resolveImg = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${axios.defaults.baseURL.replace('/api/v1', '')}${url}`;
};

const PrintingServicePage = () => {
  const navigate = useNavigate();
  const [calc, setCalc] = useState({ productType: 'Book', paperType: 'A4', pagesPerCopy: 100, quantity: 50, colorPrinting: false, bindingType: 'None', showCalc: false });
  const [pricing, setPricing] = useState(null);

  useEffect(() => {
    const basePrice = PAPER_TYPES.find(p => p.code === calc.paperType)?.price || 0.50;
    const multiplier = calc.colorPrinting ? 2.0 : 1.0;
    const pricePerUnit = calc.pagesPerCopy * basePrice * multiplier;
    const bindingCost = BINDING_TYPES.find(b => b.code === calc.bindingType)?.price || 0;
    const bindingTotal = bindingCost * calc.quantity;
    const subtotal = pricePerUnit * calc.quantity;
    setPricing({ pricePerUnit, bindingCost: bindingTotal, subtotal, totalPrice: subtotal + bindingTotal });
  }, [calc.paperType, calc.pagesPerCopy, calc.quantity, calc.colorPrinting, calc.bindingType]);

  const handleOrderClick = () => {
    if (!authService.isAuthenticated()) {
      navigate('/login', { state: { from: '/services/printing' } });
    } else {
      navigate('/printing/create-order');
    }
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <PublicNav />

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #3b82f6 100%)',
        padding: '80px 2rem 60px', textAlign: 'center', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.05, backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div style={{ maxWidth: 700, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', borderRadius: 999, padding: '6px 16px', marginBottom: 20, color: 'white', fontSize: 13, fontWeight: 600 }}>
            <Printer size={16} /> SUTANA Printing Services
          </div>
          <h1 style={{ margin: '0 0 12px', fontSize: 42, fontWeight: 800, color: 'white', lineHeight: 1.1 }}>
            Professional Printing <span style={{ color: '#93c5fd' }}>Services</span>
          </h1>
          <p style={{ fontSize: 16, color: '#bfdbfe', marginBottom: 30, lineHeight: 1.6 }}>
            Books, Modules, Exam Papers, Brochures & Tax Receipts — high quality, fast turnaround, competitive pricing.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => setCalc(s => ({ ...s, showCalc: !s.showCalc }))} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', color: '#2563eb', border: 'none', padding: '12px 28px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              <Calculator size={18} /> {calc.showCalc ? 'Hide Calculator' : 'Calculate Price'}
            </button>
            <button onClick={handleOrderClick} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f59e0b', color: 'white', border: 'none', padding: '12px 28px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              <ShoppingCart size={18} /> Place an Order
            </button>
          </div>
        </div>
      </section>

      {/* Calculator */}
      {calc.showCalc && (
        <div style={{ maxWidth: 700, margin: '-30px auto 0', position: 'relative', zIndex: 2, background: 'white', borderRadius: 16, padding: '1.75rem', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: 16, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calculator size={18} color="#2563eb" /> Price Calculator
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>Paper Size</label>
              <select value={calc.paperType} onChange={e => setCalc(s => ({ ...s, paperType: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: 'white', color: '#1e293b' }}>
                {PAPER_TYPES.map(p => <option key={p.code} value={p.code}>{p.name} ({p.desc})</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>Binding</label>
              <select value={calc.bindingType} onChange={e => setCalc(s => ({ ...s, bindingType: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: 'white', color: '#1e293b' }}>
                {BINDING_TYPES.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>Pages per Copy</label>
              <input type="number" min={1} value={calc.pagesPerCopy} onChange={e => setCalc(s => ({ ...s, pagesPerCopy: Math.max(1, parseInt(e.target.value) || 1) }))}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>Quantity</label>
              <input type="number" min={1} value={calc.quantity} onChange={e => setCalc(s => ({ ...s, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: '0.75rem' }}>
            <input type="checkbox" id="colorPrint" checked={calc.colorPrinting} onChange={e => setCalc(s => ({ ...s, colorPrinting: e.target.checked }))} />
            <label htmlFor="colorPrint" style={{ fontSize: 13, color: '#475569' }}>Color Printing (×2 price)</label>
          </div>
          {pricing && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.5rem', textAlign: 'center' }}>
                <div><span style={{ fontSize: 11, color: '#166534' }}>Price/Unit</span><div style={{ fontSize: 15, fontWeight: 700, color: '#15803d' }}>{pricing.pricePerUnit.toFixed(2)} ETB</div></div>
                <div><span style={{ fontSize: 11, color: '#166534' }}>Binding</span><div style={{ fontSize: 15, fontWeight: 700, color: '#15803d' }}>{pricing.bindingCost.toFixed(2)} ETB</div></div>
                <div><span style={{ fontSize: 11, color: '#166534' }}>Subtotal</span><div style={{ fontSize: 15, fontWeight: 700, color: '#15803d' }}>{pricing.subtotal.toFixed(2)} ETB</div></div>
                <div><span style={{ fontSize: 11, color: '#166534' }}>Total</span><div style={{ fontSize: 22, fontWeight: 800, color: '#15803d' }}>{pricing.totalPrice.toFixed(2)} ETB</div></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Services */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 2rem' }}>
        <h2 style={{ textAlign: 'center', margin: '0 0 8px', fontSize: 28, fontWeight: 700, color: '#1e293b' }}>Our Printing Services</h2>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: 32, fontSize: 14 }}>High-quality printing for every need</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {PRODUCT_TYPES.map(pt => (
            <div key={pt.code} style={{ background: pt.bg, borderRadius: 12, padding: '1.5rem', textAlign: 'center', border: `1px solid ${pt.color}30`, transition: 'transform 0.2s' }}>
              <div style={{ background: pt.color, color: 'white', borderRadius: 12, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>{pt.icon}</div>
              <h3 style={{ margin: '0 0 4px', fontSize: 16, color: pt.color }}>{pt.name}</h3>
              <p style={{ margin: '0 0 8px', fontSize: 12, color: '#64748b' }}>{pt.desc}</p>
              <span style={{ fontSize: 12, fontWeight: 600, color: pt.color }}>{pt.price}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section style={{ background: '#f8fafc', padding: '60px 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', margin: '0 0 32px', fontSize: 24, fontWeight: 700, color: '#1e293b' }}>Why SUTANA Printing?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            {[
              { icon: <Printer size={28} />, title: 'High Quality', desc: 'Professional-grade printers and premium paper for crisp, clean output.' },
              { icon: <Clock size={28} />, title: 'Fast Turnaround', desc: 'Most orders completed within 24-48 hours. Rush service available.' },
              { icon: <Shield size={28} />, title: 'Reliable Service', desc: 'Track your order status online. Notified when ready for pickup.' },
              { icon: <Truck size={28} />, title: 'Bulk Discounts', desc: 'Special pricing for large orders. Contact us for custom quotes.' },
            ].map((item, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 12, padding: '1.5rem', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ color: '#2563eb', marginBottom: 12 }}>{item.icon}</div>
                <h3 style={{ margin: '0 0 6px', fontSize: 16, color: '#1e293b' }}>{item.title}</h3>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Table */}
      <section style={{ maxWidth: 800, margin: '0 auto', padding: '60px 2rem' }}>
        <h2 style={{ textAlign: 'center', margin: '0 0 24px', fontSize: 24, fontWeight: 700, color: '#1e293b' }}>Pricing Guide</h2>
        <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b' }}>Service</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b' }}>A4 (B/W)</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b' }}>A5 (B/W)</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b' }}>A3 (B/W)</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b' }}>Color ×2</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Per Page Rate', a4: '0.50', a5: '0.75', a3: '1.00', color: '1.00 / 1.50 / 2.00' },
                { name: 'Spiral Binding', a4: '500', a5: '500', a3: '500', color: 'Per copy' },
                { name: 'Thermal Binding', a4: '300', a5: '300', a3: '300', color: 'Per copy' },
              ].map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 600 }}>{r.name}</td>
                  <td style={{ padding: '12px 14px' }}>{r.a4} ETB</td>
                  <td style={{ padding: '12px 14px' }}>{r.a5} ETB</td>
                  <td style={{ padding: '12px 14px' }}>{r.a3} ETB</td>
                  <td style={{ padding: '12px 14px', color: '#059669', fontWeight: 600 }}>{r.color}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', padding: '60px 2rem', textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 28, fontWeight: 700, color: 'white' }}>Ready to Get Started?</h2>
        <p style={{ color: '#bfdbfe', marginBottom: 24, fontSize: 15 }}>Place your order online and we'll have it ready for you.</p>
        <button onClick={handleOrderClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f59e0b', color: 'white', border: 'none', padding: '14px 36px', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
          <ShoppingCart size={18} /> Place an Order Now
        </button>
      </section>

      <PublicFooter />
    </div>
  );
};

export default PrintingServicePage;
