import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, Pill, Car, Wheat, Store, ArrowRight } from 'lucide-react';
import './PublicLayout.css';
export { PublicNav } from './PublicNavFooter';

const NAVY = '#1a2b4b';
const TEAL = '#0D7C66';

const services = [
  { icon: Printer, label: 'Commercial Printing',   path: '/services/printing', color: '#2563eb', bg: '#eff6ff', desc: 'Offset, digital, large-format printing with end-to-end production tracking.' },
  { icon: Pill,    label: 'Pharmacy & Health',      path: '/services/pharmacy', color: '#059669', bg: '#f0fdf4', desc: 'Prescription management, medication inventory, and health consultations.' },
  { icon: Car,     label: 'Car Rental',             path: '/fleet-gallery',     color: '#d97706', bg: '#fffbeb', desc: 'Reliable vehicles for short and long-term rental with flexible terms.' },
  { icon: Wheat,   label: 'Farming & Agriculture',  path: '/services/farming',  color: '#7c3aed', bg: '#f5f3ff', desc: 'Seeds, fertilizers, tools, and expert advice for modern farming.' },
  { icon: Store,   label: 'Retail Store',            path: '/services/retail',   color: '#ec4899', bg: '#fdf2f8', desc: 'Stationery, electronics, office supplies, and everyday essentials.' },
];

const ServiceCard = ({ service, index, isVisible }) => {
  const Icon = service.icon;

  return (
    <div className="service-card-wrap"
      style={{
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        opacity: isVisible ? 1 : 0,
        transition: `all 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${index * 0.1}s`,
      }}>
      <a href={service.path} onClick={e => { e.preventDefault(); window.location.href = service.path; }}
        className="service-card-inner"
        style={{
          display: 'flex', alignItems: 'center', gap: 20,
          padding: '24px 28px', borderRadius: 18,
          background: '#fff',
          textDecoration: 'none', cursor: 'pointer',
          position: 'relative', zIndex: 1,
          transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = service.color; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = '#E5E7EB'; }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: service.bg, color: service.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, transition: 'transform 0.3s',
        }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1) rotate(-4deg)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1) rotate(0)'}>
          <Icon size={26} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: NAVY, marginBottom: 4, letterSpacing: '-0.01em' }}>
            {service.label}
          </div>
          <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>
            {service.desc}
          </div>
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: '#F3F4F6',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, transition: 'all 0.3s',
          color: '#9CA3AF',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = service.bg; e.currentTarget.style.color = service.color; e.currentTarget.style.transform = 'translateX(4px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.transform = 'translateX(0)'; }}>
          <ArrowRight size={18} />
        </div>
      </a>
    </div>
  );
};

const ServicesPage = () => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="public-page">
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', padding: '40px 24px',
        background: 'linear-gradient(160deg, #EEF2FF 0%, #F0FDF4 50%, #FEF2F2 100%)',
      }}>
        <div style={{
          width: '100%', maxWidth: 640,
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          {services.map((s, i) => (
            <ServiceCard key={i} service={s} index={i} isVisible={visible} />
          ))}
        </div>

        <div style={{
          marginTop: 36, display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center',
          opacity: visible ? 1 : 0, transition: 'opacity 0.6s 0.6s',
        }}>
          <button onClick={() => navigate('/about')} style={{
            padding: '12px 28px', border: `2px solid ${NAVY}`, borderRadius: 12,
            background: 'transparent', color: NAVY, fontWeight: 700, fontSize: 14, cursor: 'pointer',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = NAVY; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = NAVY; }}>
            About Us
          </button>
          <button onClick={() => navigate('/')} style={{
            padding: '12px 28px', border: 'none', borderRadius: 12,
            background: NAVY, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;

