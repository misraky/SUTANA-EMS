import React from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
const Unauthorized = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const getDashboardPath = () => {
    if (!user?.roles) return '/';
    if (user.roles.includes('Admin')) return '/admin';
    if (user.roles.includes('CEO')) return '/ceo';
    if (user.roles.includes('Finance')) return '/finance';
    if (user.roles.includes('Purchase')) return '/purchase';
    if (user.roles.includes('Store Manager')) return '/store';
    if (user.roles.includes('Farming Manager')) return '/farming-manager';
    if (user.roles.includes('Farming Worker')) return '/farming-worker';
    if (user.roles.includes('Printing Supervisor')) return '/printing-manager';
    if (user.roles.includes('Pharmacist')) return '/pharmacy';
    if (user.roles.includes('Car Renting Manager')) return '/car-renting';
    if (user.roles.includes('HR Manager')) return '/hr';
    return '/customer';
  };
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', fontFamily: 'Inter, sans-serif',
      background: 'linear-gradient(135deg, #1E3A5F 0%, #10B981 100%)',
      color: 'white', padding: 24, textAlign: 'center'
    }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>Access Denied</h1>
      <p style={{ fontSize: 15, opacity: 0.85, margin: '0 0 32px', maxWidth: 400, lineHeight: 1.6 }}>
        You don't have permission to access this page. Contact your administrator if you believe this is a mistake.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={() => navigate(getDashboardPath())}
          style={{
            padding: '10px 24px', borderRadius: 8, border: 'none',
            background: 'white', color: '#1E3A5F', fontWeight: 600,
            fontSize: 14, cursor: 'pointer'
          }}>
          Go to My Dashboard
        </button>
        <button onClick={() => { authService.logout(); }}
          style={{
            padding: '10px 24px', borderRadius: 8, border: '2px solid rgba(255,255,255,0.3)',
            background: 'transparent', color: 'white', fontWeight: 600,
            fontSize: 14, cursor: 'pointer'
          }}>
          Sign Out
        </button>
      </div>
    </div>
  );
};
export default Unauthorized;
