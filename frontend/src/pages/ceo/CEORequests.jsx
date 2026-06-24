import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sprout, Pill, Printer, Car, Store, ArrowLeft } from 'lucide-react';

const departments = [
  {
    key: 'farming',
    label: 'Farming',
    icon: <Sprout size={24} />,
    color: '#16a34a',
    bg: '#f0fdf4',
    path: '/ceo/farming-requests',
    description: 'Product requests from farming to store'
  },
  {
    key: 'pharmacy',
    label: 'Pharmacy',
    icon: <Pill size={24} />,
    color: '#2563eb',
    bg: '#eff6ff',
    path: '/ceo/pharmacy-requests',
    description: 'Prescription and pharmacy requests'
  },
  {
    key: 'printing',
    label: 'Printing',
    icon: <Printer size={24} />,
    color: '#d97706',
    bg: '#fffbeb',
    path: null,
    description: 'Printing order requests'
  },
  {
    key: 'car-rental',
    label: 'Car Rental',
    icon: <Car size={24} />,
    color: '#7c3aed',
    bg: '#f5f3ff',
    path: null,
    description: 'Vehicle rental requests'
  },
  {
    key: 'retail',
    label: 'Retail Store',
    icon: <Store size={24} />,
    color: '#dc2626',
    bg: '#fef2f2',
    path: null,
    description: 'Retail store requests'
  }
];

export default function CEORequests() {
  const nav = useNavigate();

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem 2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><ArrowLeft size={18} /></button>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>All Requests</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
        {departments.map(d => (
          <div
            key={d.key}
            onClick={() => d.path && nav(d.path)}
            style={{
              background: '#fff',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              padding: 24,
              cursor: d.path ? 'pointer' : 'default',
              transition: 'box-shadow 0.2s',
              opacity: d.path ? 1 : 0.6
            }}
            onMouseOver={e => { if (d.path) e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
            onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}
          >
            <div style={{ width: 48, height: 48, borderRadius: 12, background: d.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, color: d.color }}>
              {d.icon}
            </div>
            <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{d.label}</h3>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{d.description}</p>
            {d.path ? (
              <span style={{ display: 'inline-block', marginTop: 10, fontSize: 12, fontWeight: 600, color: d.color }}>View Requests →</span>
            ) : (
              <span style={{ display: 'inline-block', marginTop: 10, fontSize: 12, color: '#94a3b8' }}>Coming soon</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
