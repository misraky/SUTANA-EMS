import React, { useState, useEffect } from 'react';
import axios from '../../services/apiClient';
import { FileText, Send, CheckCircle, AlertTriangle, RefreshCw, Printer, UserCheck, Shield } from 'lucide-react';

const INIT_FORM = {
  worker_name: '',
  manager_name: '',
  finance_officer_name: '',
  opening_float: '2000',
  physical_cash_counted: '',
  expected_cash: '',
  difference_reason: '',
  refunds_given: '0',
  expenses_transport: '0',
  expenses_loading: '0',
  expenses_other: '0',
  expenses_other_reason: '',
  notes: '',
  checklist_verified_cash: false,
  checklist_collected_cash: false,
  checklist_kept_float: false,
  checklist_attached_report: false
};

const FarmingFinanceReport = () => {
  const [summary, setSummary] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [shift, setShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(INIT_FORM);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [sumRes, statsRes, shiftRes] = await Promise.all([
        axios.get('/farming/finance/daily-summary'),
        axios.get('/farming/overview/stats'),
        axios.get('/farming/shifts/history?limit=1')
      ]);
      if (sumRes.status === 'success') setSummary(sumRes.data);
      else setError('Unexpected response from server.');
      if (statsRes.status === 'success') setLowStock(statsRes.data.lowStockProducts || []);
      if (shiftRes.status === 'success' && shiftRes.data.length > 0) {
        const lastShift = shiftRes.data[0];
        setShift(lastShift);
        setFormData(prev => ({
          ...prev,
          opening_float: String(parseFloat(lastShift.opening_float)),
          worker_name: lastShift.worker_name || ''
        }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load daily data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const float = parseFloat(formData.opening_float || 0);
  const cashSales = summary?.byPayment?.cash || 0;
  const expectedCash = float + cashSales;
  const enteredCash = parseFloat(formData.physical_cash_counted || 0);
  const diffAmount = formData.physical_cash_counted !== '' ? (enteredCash - expectedCash).toFixed(2) : null;
  const cashToHandover = enteredCash - float;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!summary) return;
    if (diffAmount !== '0.00' && !formData.difference_reason.trim()) {
      alert('Please explain the difference between physical cash and system cash.');
      return;
    }
    if (!formData.manager_name.trim()) {
      alert('Please enter the Farming Manager name.');
      return;
    }
    if (!formData.finance_officer_name.trim()) {
      alert('Please enter the Finance Officer name.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        total_system_sales: summary.totalSales,
        cash_collected: cashSales,
        telebirr_collected: summary.byPayment.telebirr,
        transfer_collected: summary.byPayment.bank_transfer,
        physical_cash_counted: enteredCash,
        difference_amount: parseFloat(diffAmount || 0),
        difference_reason: formData.difference_reason || null,
        refunds_given: parseFloat(formData.refunds_given || 0),
        expenses_transport: parseFloat(formData.expenses_transport || 0),
        expenses_loading: parseFloat(formData.expenses_loading || 0),
        notes: JSON.stringify({
          worker_name: formData.worker_name,
          manager_name: formData.manager_name,
          finance_officer_name: formData.finance_officer_name,
          opening_float: float,
          expenses_other: formData.expenses_other,
          expenses_other_reason: formData.expenses_other_reason,
          checklist: {
            verified_cash: formData.checklist_verified_cash,
            collected_cash: formData.checklist_collected_cash,
            kept_float: formData.checklist_kept_float,
            attached_report: formData.checklist_attached_report
          },
          cash_to_handover: cashToHandover,
          expected_cash: expectedCash
        }),
        report_date: new Date().toISOString().split('T')[0]
      };
      await axios.post('/farming/finance/submit-report', payload);
      setSuccess(true);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    const today = new Date().toLocaleDateString('en-GB');
    const cashForm = cashToHandover > 0 ? cashToHandover.toFixed(2) : '_____';
    const chk = (v) => v ? '\u2611' : '\u2610';
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Farming Daily Cash Handover Form</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;font-size:11px;color:#000;background:#fff}
.toolbar{display:flex;gap:10px;justify-content:center;padding:14px;background:#1e293b;position:sticky;top:0;z-index:99}
.toolbar button{padding:10px 28px;border:none;border-radius:6px;font-size:14px;font-weight:bold;cursor:pointer}
.btn-dl{background:#10b981;color:#fff}
.btn-cl{background:#ef4444;color:#fff}
@media print{.toolbar{display:none!important}@page{size:A4 portrait;margin:10mm}}
.page{width:210mm;min-height:297mm;padding:10mm 14mm;margin:0 auto}
h1{font-size:16px;text-align:center;margin-bottom:3px}
h2{font-size:13px;text-align:center;color:#444;margin-bottom:12px;font-weight:400}
.copy-row{display:flex;justify-content:center;gap:16px;margin-bottom:10px;font-size:9px;color:#666}
.copy-row span{padding:2px 8px;border:1px solid #999;border-radius:3px}
table{width:100%;border-collapse:collapse;margin:6px 0}
th,td{border:1px solid #000;padding:5px 7px;text-align:left;font-size:10px}
th{background:#e8e8e8;font-weight:700;font-size:9px;text-transform:uppercase}
.section-title{background:#222;color:#fff;padding:4px 10px;font-size:10px;font-weight:bold;text-transform:uppercase;margin:10px 0 4px}
.field-row{display:flex;gap:10px;margin:5px 0}
.field{flex:1}
.field-label{font-size:9px;color:#555;margin-bottom:2px}
.field-value{border-bottom:1px solid #000;min-height:18px;padding:2px 4px;font-size:11px;font-weight:bold}
.cb-row{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0}
.cb-item{display:flex;align-items:center;gap:4px;font-size:10px}
.sig-row{display:flex;gap:20px;margin-top:14px}
.sig-box{flex:1}
.sig-label{font-size:9px;color:#555;margin-bottom:2px}
.sig-line{border-top:2px solid #000;margin-top:26px;padding-top:3px;font-size:9px;text-align:center;color:#555}
.footer{text-align:center;font-size:8px;color:#999;border-top:1px dashed #aaa;padding-top:6px;margin-top:12px}
.copy-info{display:flex;gap:6px;justify-content:center;margin-top:10px;font-size:8px;color:#666}
.copy-info span{padding:2px 6px;border:1px solid #aaa;border-radius:2px}
</style></head><body>
<div class="toolbar">
<button class="btn-dl" onclick="window.print()">\u2B07 Download / Print PDF</button>
<button class="btn-cl" onclick="window.close()">\u2715 Close</button>
</div>
<div class="page">
<h1>\uD83C\uDF3E SUTANA Enterprise &mdash; Farming Division</h1>
<h2>FARMING MANAGER \u2192 FINANCE &mdash; DAILY CASH HANDOVER FORM</h2>
<div class="copy-row">
<span>ORIGINAL: FINANCE</span>
<span>COPY: FARMING MANAGER</span>
<span>COPY: FARMING WORKER</span>
</div>
<p style="text-align:right;font-size:10px"><strong>Date:</strong> ${today} &nbsp;&nbsp; <strong>Shift:</strong> ${shift?.shift_type === 'afternoon' ? 'Afternoon' : 'Morning'} [X]</p>

<div class="section-title">Section 1: Shift Information</div>
<div class="field-row">
<div class="field"><div class="field-label">Farming Worker Name (who made the sales)</div><div class="field-value">${formData.worker_name || '___________________'}</div></div>
<div class="field"><div class="field-label">Farming Manager Name (handing over cash)</div><div class="field-value">${formData.manager_name || '___________________'}</div></div>
<div class="field"><div class="field-label">Finance Officer Name (receiving cash)</div><div class="field-value">${formData.finance_officer_name || '___________________'}</div></div>
</div>

<div class="section-title">Section 2: Sales Summary (from POS system)</div>
<table>
<tr><th>Metric</th><th>Amount (ETB)</th></tr>
<tr><td>Total Sales (System)</td><td>${summary?.totalSales?.toFixed(2) || '0.00'}</td></tr>
<tr><td>Number of Transactions</td><td>${summary?.transactionCount || 0}</td></tr>
<tr><td>Cash Sales</td><td>${summary?.byPayment?.cash?.toFixed(2) || '0.00'}</td></tr>
<tr><td>Telebirr Sales</td><td>${summary?.byPayment?.telebirr?.toFixed(2) || '0.00'}</td></tr>
<tr><td>Bank Transfer</td><td>${summary?.byPayment?.bank_transfer?.toFixed(2) || '0.00'}</td></tr>
</table>

<div class="section-title">Section 3: Cash Handover</div>
<table>
<tr><th>Item</th><th>Amount (ETB)</th></tr>
<tr><td>Opening Cash Float (given to worker)</td><td>${float.toFixed(2)}</td></tr>
<tr><td>Expected Cash in Drawer (Float + Sales)</td><td>${expectedCash.toFixed(2)}</td></tr>
<tr><td>Actual Cash Counted (by Manager)</td><td>${enteredCash > 0 ? enteredCash.toFixed(2) : '_____'}</td></tr>
<tr><td>Difference</td><td>${diffAmount !== null ? diffAmount + ' ETB' : '_____'} ${diffAmount === '0.00' ? '[OK]' : diffAmount !== null ? (parseFloat(diffAmount) > 0 ? '[EXTRA]' : '[SHORT]') : ''}</td></tr>
<tr><td>Float Returned to Manager (for next shift)</td><td>${float.toFixed(2)}</td></tr>
<tr style="font-weight:bold;background:#f0fdf4"><td>Cash Handover to Finance</td><td>${cashToHandover > 0 ? cashToHandover.toFixed(2) + ' ETB' : '_____'}</td></tr>
</table>
<p style="font-size:10px;color:#555;margin:3px 0"><strong>Difference Reason:</strong> ${formData.difference_reason || 'N/A'}</p>

<div class="section-title">Section 4: Manager Verification Checklist</div>
<div class="cb-row">
<div class="cb-item">${chk(formData.checklist_verified_cash)} I have verified physical cash matches system</div>
<div class="cb-item">${chk(formData.checklist_collected_cash)} I have collected all cash from Farming Worker</div>
<div class="cb-item">${chk(formData.checklist_kept_float)} I have kept the float (${float.toFixed(2)} ETB) for next shift</div>
<div class="cb-item">${chk(formData.checklist_attached_report)} I have attached POS close shift report</div>
</div>

<div class="section-title">Section 5: Finance Receipt</div>
<div class="field-row">
<div class="field"><div class="field-label">Cash Received by Finance (ETB)</div><div class="field-value">${cashToHandover > 0 ? cashToHandover.toFixed(2) : '___________'}</div></div>
<div class="field"><div class="field-label">Payment Method</div><div class="field-value">Physical Cash [X] &nbsp; Bank Deposit [ ] &nbsp; Telebirr [ ]</div></div>
</div>
<div class="field-row">
<div class="field"><div class="field-label">Refunds Given</div><div class="field-value">${formData.refunds_given} ETB</div></div>
<div class="field"><div class="field-label">Transport Expenses</div><div class="field-value">${formData.expenses_transport} ETB</div></div>
<div class="field"><div class="field-label">Loading Expenses</div><div class="field-value">${formData.expenses_loading} ETB</div></div>
</div>
<p style="font-size:10px;color:#555"><strong>Notes:</strong> ${formData.notes || 'None'}</p>

<div class="sig-row">
<div class="sig-box"><div class="sig-label">Finance Officer Signature</div><div class="sig-line">Signature &amp; Date</div></div>
<div class="sig-box"><div class="sig-label">Farming Manager Signature</div><div class="sig-line">Signature &amp; Date</div></div>
</div>

<div class="copy-info">
<span>Original: Finance Department</span>
<span>Copy: Farming Manager</span>
<span>Copy: Farming Worker</span>
</div>
<div class="footer">SUTANA Enterprise &mdash; Farming Division &nbsp;|&nbsp; Form: FRM-HANDOVER-${new Date().toISOString().slice(0,10).replace(/-/g,'')}</div>
</div></body></html>`);
    win.document.close();
  };

  const inpT = { width: '100%', padding: '8px 10px', borderRadius: 6, border: '1.5px solid #e2e8f0', fontSize: 12, boxSizing: 'border-box' };
  const labelT = { display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 3 };
  const sectionT = { margin: 0, color: '#1e293b', fontSize: 13 };
  const sectionBox = { background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 12 };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60, color: '#64748b' }}><RefreshCw size={20} style={{ marginRight: 8 }} /> Loading...</div>;

  if (error || !summary) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: '#ef4444' }}>
      <AlertTriangle size={40} style={{ marginBottom: 12 }} />
      <p>{error || 'Failed to load daily summary.'}</p>
      <button onClick={fetchData} style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer' }}>Try Again</button>
    </div>
  );

  if (success) return (
    <div style={{ maxWidth: 700, margin: '3rem auto', background: '#f0fdf4', padding: '3rem 2rem', borderRadius: 12, textAlign: 'center', border: '1px solid #bbf7d0' }}>
      <CheckCircle size={56} color="#16a34a" style={{ marginBottom: '1rem' }} />
      <h3 style={{ color: '#15803d' }}>Handover Submitted Successfully!</h3>
      <p style={{ color: '#4ade80', marginBottom: '1.5rem' }}>The cash handover form has been sent to the Finance Department.</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button onClick={() => { setSuccess(false); fetchData(); setFormData(INIT_FORM); }}
          style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
          New Handover
        </button>
        <button onClick={handlePrint}
          style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
          <Printer size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Print Form
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
        <FileText size={24} color="#10b981" />
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, color: '#1e293b', fontSize: 18 }}>Farming Manager &rarr; Finance &mdash; Daily Cash Handover Form</h2>
          <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
            {new Date().toLocaleDateString('en-ET', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {shift?.shift_type && <span> &mdash; {shift.shift_type.charAt(0).toUpperCase() + shift.shift_type.slice(1)} Shift</span>}
          </p>
        </div>
        <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}><Printer size={14} /> Print</button>
        <button onClick={fetchData} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><RefreshCw size={16} /></button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Section 1: Shift Information */}
        <div style={sectionBox}>
          <div style={{ background: '#f0fdf4', padding: '8px 14px', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={sectionT}><UserCheck size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Section 1: Shift Information</h3>
          </div>
          <div style={{ padding: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelT}>Farming Worker Name (who made sales) *</label>
              <input type="text" name="worker_name" value={formData.worker_name} onChange={handleChange} style={inpT} placeholder="e.g. Abebe Kebede" required />
            </div>
            <div>
              <label style={labelT}>Farming Manager Name (handing over cash) *</label>
              <input type="text" name="manager_name" value={formData.manager_name} onChange={handleChange} style={inpT} placeholder="e.g. Lemma Tadesse" required />
            </div>
            <div>
              <label style={labelT}>Finance Officer Name (receiving cash) *</label>
              <input type="text" name="finance_officer_name" value={formData.finance_officer_name} onChange={handleChange} style={inpT} placeholder="e.g. Sara Hailu" required />
            </div>
          </div>
        </div>

        {/* Section 2: Sales Summary */}
        <div style={sectionBox}>
          <div style={{ background: '#fffbeb', padding: '8px 14px', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={sectionT}>Section 2: Sales Summary (from POS system)</h3>
          </div>
          <div style={{ padding: '14px' }}>
            <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '12px 16px', marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Total Sales (System)</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>{summary.totalSales.toFixed(2)} ETB</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{summary.transactionCount} transaction{summary.transactionCount !== 1 ? 's' : ''}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { label: 'Cash Sales', value: summary.byPayment.cash, color: '#166534', bg: '#dcfce7' },
                { label: 'Telebirr Sales', value: summary.byPayment.telebirr, color: '#1d4ed8', bg: '#dbeafe' },
                { label: 'Bank Transfer', value: summary.byPayment.bank_transfer, color: '#6d28d9', bg: '#ede9fe' },
              ].map(({ label, value, color, bg }) => (
                <div key={label} style={{ flex: 1, minWidth: 120, background: bg, borderRadius: 6, padding: '8px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color }}>{label}</div>
                  <div style={{ fontWeight: 700, color, fontSize: 14 }}>{value.toFixed(2)} ETB</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3: Cash Handover */}
        <div style={sectionBox}>
          <div style={{ background: '#fef2f2', padding: '8px 14px', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={sectionT}><Shield size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Section 3: Cash Handover</h3>
          </div>
          <div style={{ padding: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelT}>Opening Cash Float (given to worker)</label>
              <input type="number" name="opening_float" value={formData.opening_float} onChange={handleChange} style={{ ...inpT, background: '#f8fafc' }} readOnly />
            </div>
            <div>
              <label style={labelT}>Expected Cash in Drawer (Float + Cash Sales)</label>
              <input type="text" value={expectedCash.toFixed(2) + ' ETB'} style={{ ...inpT, background: '#f8fafc' }} readOnly />
            </div>
            <div>
              <label style={labelT}>Physical Cash Counted (by Manager) *</label>
              <input type="number" step="0.01" name="physical_cash_counted" value={formData.physical_cash_counted} onChange={handleChange} required style={{ ...inpT, borderColor: '#f59e0b' }} placeholder="Re-count cash in drawer" />
            </div>
            <div>
              <label style={labelT}>Difference</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="text" value={diffAmount !== null ? `${parseFloat(diffAmount) > 0 ? '+' : ''}${diffAmount} ETB` : '\u2014'} style={{ ...inpT, background: '#f8fafc', fontWeight: 700, color: diffAmount === '0.00' ? '#10b981' : '#ef4444' }} readOnly />
                {diffAmount !== null && diffAmount !== '0.00' && <span style={{ fontSize: 11, color: '#64748b' }}>({parseFloat(diffAmount) > 0 ? 'Extra' : 'Short'})</span>}
              </div>
            </div>
            {diffAmount !== null && diffAmount !== '0.00' && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ ...labelT, color: '#dc2626' }}>Reason for Difference *</label>
                <input type="text" name="difference_reason" value={formData.difference_reason} onChange={handleChange} required style={{ ...inpT, borderColor: '#fca5a5' }} placeholder="e.g. Change error, unrecorded sale, refund..." />
              </div>
            )}
            <div style={{ gridColumn: '1 / -1', background: '#f0fdf4', borderRadius: 6, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Float kept by Manager (for next shift)</div>
                <div style={{ fontWeight: 600, color: '#065f46' }}>{float.toFixed(2)} ETB</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#059669' }}>Cash Handover to Finance</div>
                <div style={{ fontWeight: 800, fontSize: 18, color: '#059669' }}>
                  {formData.physical_cash_counted !== '' && enteredCash >= float ? (enteredCash - float).toFixed(2) + ' ETB' : '\u2014'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Manager Verification Checklist */}
        <div style={sectionBox}>
          <div style={{ background: '#eff6ff', padding: '8px 14px', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={sectionT}>Section 4: Farming Manager Verification</h3>
          </div>
          <div style={{ padding: '14px' }}>
            <p style={{ fontSize: 12, color: '#475569', margin: '0 0 10px' }}>I, the undersigned Farming Manager, confirm the following:</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { name: 'checklist_verified_cash', label: 'I have verified physical cash matches the system report' },
                { name: 'checklist_collected_cash', label: 'I have collected all cash from the Farming Worker' },
                { name: 'checklist_kept_float', label: `I have kept the float (${float.toFixed(2)} ETB) for next shift` },
                { name: 'checklist_attached_report', label: 'I have attached the POS close shift report' },
              ].map(item => (
                <label key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#f8fafc', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                  <input type="checkbox" name={item.name} checked={formData[item.name]} onChange={handleChange} style={{ width: 16, height: 16, accentColor: '#10b981' }} />
                  {item.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Section 5: Finance Receipt + Expenses */}
        <div style={sectionBox}>
          <div style={{ background: '#f8fafc', padding: '8px 14px', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={sectionT}>Section 5: Finance Receipt &amp; Expenses</h3>
          </div>
          <div style={{ padding: '14px' }}>
            <div style={{ background: '#f0fdf4', borderRadius: 6, padding: '10px 14px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: '#065f46' }}>Cash Received by Finance</span>
              <span style={{ fontWeight: 800, fontSize: 20, color: '#059669' }}>
                {formData.physical_cash_counted !== '' && enteredCash >= float ? (enteredCash - float).toFixed(2) : '0.00'} ETB
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <label style={labelT}>Refunds Given (ETB)</label>
                <input type="number" step="0.01" name="refunds_given" value={formData.refunds_given} onChange={handleChange} style={inpT} />
              </div>
              <div>
                <label style={labelT}>Transport Expenses (ETB)</label>
                <input type="number" step="0.01" name="expenses_transport" value={formData.expenses_transport} onChange={handleChange} style={inpT} />
              </div>
              <div>
                <label style={labelT}>Loading Expenses (ETB)</label>
                <input type="number" step="0.01" name="expenses_loading" value={formData.expenses_loading} onChange={handleChange} style={inpT} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelT}>Notes / Issues for Finance</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2} style={{ ...inpT, resize: 'vertical' }} placeholder="Any issues, observations, or notes for the Finance team..." />
            </div>
            <div style={{ background: '#f8fafc', borderRadius: 6, padding: '10px 14px', display: 'flex', justifyContent: 'space-around', fontSize: 11, color: '#64748b' }}>
              <span style={{ fontWeight: 700, color: '#1e293b' }}>ORIGINAL: Finance</span>
              <span>COPY: Manager</span>
              <span>COPY: Worker</span>
            </div>
          </div>
        </div>

        {/* Signature Preview */}
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', padding: '14px', marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ flex: 1 }}>
              <div style={labelT}>Finance Officer Signature</div>
              <div style={{ borderBottom: '2px solid #000', marginTop: 22, paddingBottom: 2, fontSize: 11, color: '#64748b' }}>{formData.finance_officer_name || 'Signature & Date'}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={labelT}>Farming Manager Signature</div>
              <div style={{ borderBottom: '2px solid #000', marginTop: 22, paddingBottom: 2, fontSize: 11, color: '#64748b' }}>{formData.manager_name || 'Signature & Date'}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={labelT}>Date / Time</div>
              <div style={{ borderBottom: '2px solid #000', marginTop: 22, paddingBottom: 2, fontSize: 11, color: '#64748b' }}>{new Date().toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div style={{ background: '#fffbeb', borderRadius: 8, padding: '10px 14px', marginBottom: '1rem', fontSize: 12, color: '#92400e' }}>
          By submitting, you confirm that all cash has been counted, verified by the Farming Manager, and is ready to hand over to the Finance Officer. This action cannot be undone.
        </div>

        <button type="submit" disabled={submitting || !formData.physical_cash_counted || !formData.manager_name || !formData.finance_officer_name} style={{
          width: '100%', background: !formData.physical_cash_counted || !formData.manager_name || !formData.finance_officer_name ? '#e2e8f0' : '#10b981',
          color: !formData.physical_cash_counted || !formData.manager_name || !formData.finance_officer_name ? '#94a3b8' : 'white',
          padding: '12px', borderRadius: 8, border: 'none', fontWeight: 700,
          cursor: !formData.physical_cash_counted || !formData.manager_name || !formData.finance_officer_name ? 'not-allowed' : 'pointer',
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, fontSize: 14
        }}>
          {submitting ? 'Submitting...' : <><Send size={18} /> Submit Handover to Finance Department</>}
        </button>
      </form>
    </div>
  );
};

export default FarmingFinanceReport;