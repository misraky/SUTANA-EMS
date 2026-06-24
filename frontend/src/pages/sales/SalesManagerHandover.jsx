import React, { useState, useEffect } from 'react';
import salesService from '../../services/salesService';
import { formatCurrency } from '../../utils/formatters';

const SalesManagerHandover = () => {
  const [shifts, setShifts] = useState([]);
  const [handovers, setHandovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [shiftsRes, handoversRes] = await Promise.all([
        salesService.getAllOpenShifts(),
        salesService.getPendingHandovers()
      ]);
      setShifts(shiftsRes.data?.data || []);
      setHandovers(handoversRes.data?.data || []);
    } catch { setMsg('Failed to load data'); }
    finally { setLoading(false); }
  };

  const verifyShift = async (shiftId, status) => {
    try {
      await salesService.verifyShift(shiftId, { status });
      await loadData();
      setMsg(`Shift ${status.toLowerCase()}`);
      setTimeout(() => setMsg(null), 3000);
    } catch { setMsg('Verification failed'); }
  };

  if (loading) return <div style={{padding:'2rem',textAlign:'center'}}>Loading...</div>;

  return (
    <div style={{padding:'1.5rem 2rem'}}>
      <h2>Shift & Handover Management</h2>
      {msg && <p style={{padding:'1rem',background:msg.includes('failed')?'#fee2e2':'#d1fae5',borderRadius:'8px',margin:'1rem 0'}}>{msg}</p>}

      <h3>Open Shifts ({shifts.length})</h3>
      <table style={{width:'100%',borderCollapse:'collapse',marginBottom:'2rem'}}>
        <thead>
          <tr style={{background:'#f9fafb',textAlign:'left'}}>
            <th style={th}>Cashier</th><th style={th}>Employee ID</th><th style={th}>Type</th>
            <th style={th}>Opened</th><th style={th}>Float</th><th style={th}>Sales</th>
            <th style={th}>Txns</th><th style={th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {shifts.length === 0 ? <tr><td colSpan={8} style={{padding:'2rem',textAlign:'center',color:'#9ca3af'}}>No open shifts</td></tr> :
          shifts.map(s => (
            <tr key={s.id} style={{borderBottom:'1px solid #e5e7eb'}}>
              <td style={td}>{s.cashier_name}</td><td style={td}>{s.employee_id}</td>
              <td style={td}>{s.shift_type}</td>
              <td style={td}>{new Date(s.opened_at).toLocaleString()}</td>
              <td style={td}>{formatCurrency(s.opening_float)}</td>
              <td style={td}>{formatCurrency(s.total_sales)}</td>
              <td style={td}>{s.transaction_count}</td>
              <td style={td}>
                <button style={btnGreen} onClick={() => verifyShift(s.id, 'VERIFIED')}>Verify</button>
                <button style={{...btnRed,marginLeft:'8px'}} onClick={() => verifyShift(s.id, 'REJECTED')}>Reject</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Pending Cash Handovers ({handovers.length})</h3>
      <table style={{width:'100%',borderCollapse:'collapse'}}>
        <thead>
          <tr style={{background:'#f9fafb',textAlign:'left'}}>
            <th style={th}>From</th><th style={th}>To</th><th style={th}>Type</th>
            <th style={th}>Cash</th><th style={th}>Telebirr</th><th style={th}>Transfer</th>
            <th style={th}>Check</th><th style={th}>Total</th><th style={th}>Date</th>
          </tr>
        </thead>
        <tbody>
          {handovers.length === 0 ? <tr><td colSpan={9} style={{padding:'2rem',textAlign:'center',color:'#9ca3af'}}>No pending handovers</td></tr> :
          handovers.map(h => (
            <tr key={h.id} style={{borderBottom:'1px solid #e5e7eb'}}>
              <td style={td}>{h.from_name}</td><td style={td}>{h.to_name}</td>
              <td style={td}>{h.handover_type.replace(/_/g,' ')}</td>
              <td style={td}>{formatCurrency(h.total_cash)}</td>
              <td style={td}>{formatCurrency(h.total_telebirr)}</td>
              <td style={td}>{formatCurrency(h.total_transfer)}</td>
              <td style={td}>{formatCurrency(h.total_check)}</td>
              <td style={td}><strong>{formatCurrency(h.total_amount)}</strong></td>
              <td style={td}>{new Date(h.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const th = { padding:'0.75rem',fontSize:'0.8rem',color:'#6b7280',fontWeight:600 };
const td = { padding:'0.75rem',fontSize:'0.875rem' };
const btnGreen = { background:'#059669',color:'#fff',border:'none',padding:'4px 12px',borderRadius:'4px',cursor:'pointer',fontSize:'0.8rem' };
const btnRed = { background:'#dc2626',color:'#fff',border:'none',padding:'4px 12px',borderRadius:'4px',cursor:'pointer',fontSize:'0.8rem' };

export default SalesManagerHandover;
