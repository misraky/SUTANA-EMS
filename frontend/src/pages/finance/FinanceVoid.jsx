import React, { useState } from 'react';
import salesService from '../../services/salesService';
import { formatCurrency } from '../../utils/formatters';

const FinanceVoid = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sale, setSale] = useState(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    setSale(null);
    setMsg(null);
    try {
      const isId = /^\d+$/.test(searchTerm.trim());
      let found;
      if (isId) {
        const res = await salesService.getSaleById(parseInt(searchTerm.trim()));
        found = res.data?.data || res.data;
      } else {
        const res = await salesService.getSales({ search: searchTerm.trim() });
        const sales = res.data?.data?.sales || res.data?.sales || [];
        found = sales.length > 0 ? sales[0] : null;
      }
      if (found && found.id) {
        setSale(found);
      } else {
        setMsg('Sale not found');
      }
    } catch {
      setMsg('Sale not found');
    }
    setLoading(false);
  };

  const handleVoid = async () => {
    if (!reason || reason.length < 5) {
      setMsg('Void reason must be at least 5 characters');
      return;
    }
    try {
      await salesService.voidSale(sale.id, { reason });
      setMsg(`Sale ${sale.invoice_number} voided successfully`);
      setSale(null);
      setReason('');
      setTimeout(() => setMsg(null), 4000);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Void failed');
    }
  };

  return (
    <div style={{padding:'1.5rem 2rem'}}>
      <h2>Finance Void — Void Sales</h2>
      {msg && (
        <p style={{padding:'1rem',background:msg.includes('failed')||msg.includes('least')?'#fee2e2':'#d1fae5',borderRadius:'8px',margin:'1rem 0',fontSize:'0.9rem'}}>
          {msg}
        </p>
      )}

      <div style={{display:'flex',gap:'8px',marginBottom:'1.5rem',maxWidth:'500px'}}>
        <input
          type="text"
          placeholder="Search by invoice number or sale ID..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          style={{flex:1,padding:'0.75rem',border:'1px solid #d1d5db',borderRadius:'6px',fontSize:'0.9rem'}}
        />
        <button onClick={handleSearch} disabled={loading}
          style={{background:'#111827',color:'#fff',border:'none',padding:'0.75rem 1.5rem',borderRadius:'6px',cursor:'pointer',fontWeight:600}}>
          Search
        </button>
      </div>

      {sale && (
        <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:'12px',padding:'1.5rem',maxWidth:'600px'}}>
          <h3 style={{margin:'0 0 1rem'}}>Sale Details</h3>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <tbody>
              {[
                ['Invoice', sale.invoice_number],
                ['Date', new Date(sale.sale_date || sale.created_at).toLocaleString()],
                ['Total', formatCurrency(sale.total_amount)],
                ['Status', sale.status],
                ['Payment Method', sale.payment_method_name || sale.paymentMethod],
              ].map(([label, val]) => (
                <tr key={label} style={{borderBottom:'1px solid #f3f4f6'}}>
                  <td style={{padding:'0.5rem',fontWeight:600,fontSize:'0.875rem',color:'#6b7280',width:'140px'}}>{label}</td>
                  <td style={{padding:'0.5rem',fontSize:'0.875rem'}}>{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{marginTop:'1rem'}}>
            <label style={{display:'block',fontSize:'0.875rem',fontWeight:500,marginBottom:'4px'}}>Void Reason</label>
            <textarea
              placeholder="Explain why this sale is being voided (min 5 characters)"
              value={reason}
              onChange={e => setReason(e.target.value)}
              style={{width:'100%',padding:'0.75rem',border:'1px solid #d1d5db',borderRadius:'6px',fontSize:'0.875rem',minHeight:'80px',boxSizing:'border-box'}}
            />
          </div>
          <button onClick={handleVoid}
            style={{marginTop:'1rem',background:'#dc2626',color:'#fff',border:'none',padding:'0.75rem 2rem',borderRadius:'6px',cursor:'pointer',fontWeight:600,fontSize:'0.9rem'}}>
            Void Sale
          </button>
        </div>
      )}
    </div>
  );
};

export default FinanceVoid;
