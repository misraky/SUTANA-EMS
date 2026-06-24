import React from 'react';
import { CalendarDays, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const data = [
  { crop: 'Teff', planting: 'Jul–Aug', harvest: 'Nov–Dec', status: 'Planting', bestSeed: 'DZ-Cr-387 (Kora)' },
  { crop: 'Wheat', planting: 'Jun–Jul', harvest: 'Oct–Nov', status: 'Growing', bestSeed: 'Hidase (ETBW 7011)' },
  { crop: 'Maize', planting: 'Apr–May', harvest: 'Sep–Oct', status: 'Growing', bestSeed: 'BH-547' },
  { crop: 'Barley', planting: 'Jun–Jul', harvest: 'Oct–Nov', status: 'Growing', bestSeed: 'HB 1307' },
];

const statusColors = {
  Planting: { bg: '#fef2f2', text: '#dc2626' },
  Growing: { bg: '#fffbeb', text: '#d97706' },
  Harvesting: { bg: '#f0fdf4', text: '#16a34a' },
};

export default function FarmingCropCalendar() {
  const nav = useNavigate();
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem 2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><ArrowLeft size={18} /></button>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
          <CalendarDays size={18} color="#166534" /> Crop Calendar
        </h2>
      </div>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>Seasonal crop planting and harvesting schedule for the Meher season.</p>
      <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['#','Crop','Planting','Harvest','Status','Best Seed'].map(h => (
                <th key={h} style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b', borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((c, i) => {
              const sc = statusColors[c.status] || { bg: '#f1f5f9', text: '#64748b' };
              return (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px', color: '#334155' }}>{i + 1}</td>
                  <td style={{ padding: '10px 12px', color: '#334155', fontWeight: 600 }}>{c.crop}</td>
                  <td style={{ padding: '10px 12px', color: '#334155' }}>{c.planting}</td>
                  <td style={{ padding: '10px 12px', color: '#334155' }}>{c.harvest}</td>
                  <td style={{ padding: '10px 12px', color: '#334155' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: sc.text, fontWeight: 600, fontSize: 12, background: sc.bg, padding: '3px 10px', borderRadius: 20 }}>{c.status}</span>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#334155' }}>{c.bestSeed}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
