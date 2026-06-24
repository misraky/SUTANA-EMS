import React, { useState, useEffect } from 'react';
import salesService from '../../services/salesService';
import { formatCurrency } from '../../utils/formatters';

const CEODashboardSummary = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const res = await salesService.getDailyStatistics({ date: new Date().toISOString().split('T')[0] });
      setSummary(res.data?.data || res.data);
    } catch { setSummary(null); }
    setLoading(false);
  };

  if (loading) return <div style={{padding:'2rem',textAlign:'center'}}>Loading summary...</div>;

  return (
    <div style={{padding:'1.5rem 2rem'}}>
      <h2>Sales Summary by Business Unit</h2>
      <p style={{color:'#6b7280',fontSize:'0.875rem',marginBottom:'1.5rem'}}>Today's overview across all business units</p>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:'1rem',marginBottom:'2rem'}}>
        {[
          { label: 'Total Sales Today', value: formatCurrency(summary?.todaySales || 0), color: '#059669' },
          { label: 'Transactions Today', value: summary?.todayTransactions || 0, color: '#3b82f6' },
          { label: 'Cash Collected', value: formatCurrency(summary?.cashCollected || 0), color: '#d97706' },
          { label: 'Active Shifts', value: summary?.activeShifts || 0, color: '#7c3aed' },
        ].map(card => (
          <div key={card.label} style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:'12px',padding:'1.5rem'}}>
            <p style={{margin:0,fontSize:'0.8rem',color:'#6b7280',fontWeight:500,textTransform:'uppercase'}}>{card.label}</p>
            <p style={{margin:'0.5rem 0 0',fontSize:'1.75rem',fontWeight:700,color:card.color}}>{card.value}</p>
          </div>
        ))}
      </div>

      <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:'12px',padding:'1.5rem'}}>
        <h3 style={{margin:'0 0 1rem',fontSize:'1rem'}}>Sales by Business Unit</h3>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead>
            <tr style={{background:'#f9fafb',textAlign:'left'}}>
              <th style={{padding:'0.75rem',fontSize:'0.8rem',color:'#6b7280',fontWeight:600}}>Unit</th>
              <th style={{padding:'0.75rem',fontSize:'0.8rem',color:'#6b7280',fontWeight:600}}>Sales Today</th>
              <th style={{padding:'0.75rem',fontSize:'0.8rem',color:'#6b7280',fontWeight:600}}>Transactions</th>
            </tr>
          </thead>
          <tbody>
            {(summary?.businessUnits || [
              { name: 'POS (Retail)', todaySales: 0, transactions: 0 },
              { name: 'Pharmacy', todaySales: 0, transactions: 0 },
              { name: 'Printing', todaySales: 0, transactions: 0 },
              { name: 'Farming', todaySales: 0, transactions: 0 },
              { name: 'Car Rental', todaySales: 0, transactions: 0 },
            ]).map(u => (
              <tr key={u.name} style={{borderBottom:'1px solid #f3f4f6'}}>
                <td style={{padding:'0.75rem',fontSize:'0.875rem',fontWeight:500}}>{u.name}</td>
                <td style={{padding:'0.75rem',fontSize:'0.875rem',color:'#059669',fontWeight:600}}>{formatCurrency(u.todaySales)}</td>
                <td style={{padding:'0.75rem',fontSize:'0.875rem'}}>{u.transactions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CEODashboardSummary;
