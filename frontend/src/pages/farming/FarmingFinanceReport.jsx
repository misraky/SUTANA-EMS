import React, { useState, useEffect } from 'react';
import axios from '../../services/apiClient';
import { FileText, Send, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

const FarmingFinanceReport = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    physical_cash_counted: '',
    difference_reason: '',
    refunds_given: '0',
    expenses_transport: '0',
    expenses_loading: '0',
    notes: ''
  });

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get('/farming/finance/daily-summary');
      // apiClient unwraps response: res is already the JSON body
      if (res.status === 'success') {
        setSummary(res.data);
      } else {
        setError('Unexpected response from server.');
      }
    } catch (err) {
      setError(err.message || 'Failed to load daily summary.');
      console.error('Failed to fetch summary', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSummary(); }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const expectedCash = summary?.byPayment?.cash || 0;
  const differenceAmount = formData.physical_cash_counted !== ''
    ? (parseFloat(formData.physical_cash_counted || 0) - expectedCash).toFixed(2)
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!summary) return;

    if (differenceAmount !== '0.00' && !formData.difference_reason.trim()) {
      alert('Please explain the difference between physical cash and system cash.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        total_system_sales: summary.totalSales,
        cash_collected: summary.byPayment.cash,
        telebirr_collected: summary.byPayment.telebirr,
        transfer_collected: summary.byPayment.bank_transfer,
        physical_cash_counted: parseFloat(formData.physical_cash_counted),
        difference_amount: parseFloat(differenceAmount || 0),
        difference_reason: formData.difference_reason || null,
        refunds_given: parseFloat(formData.refunds_given || 0),
        expenses_transport: parseFloat(formData.expenses_transport || 0),
        expenses_loading: parseFloat(formData.expenses_loading || 0),
        notes: formData.notes || null,
        report_date: new Date().toISOString().split('T')[0]
      };
      await axios.post('/farming/finance/submit-report', payload);
      setSuccess(true);
    } catch (err) {
      alert(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1.5px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box'
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#64748b' }}>
        <RefreshCw size={20} style={{ marginRight: 8, animation: 'spin 1s linear infinite' }} /> Loading today's summary...
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#ef4444' }}>
        <AlertTriangle size={40} style={{ marginBottom: 12 }} />
        <p>{error || 'Failed to load daily summary.'}</p>
        <button onClick={fetchSummary} style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
        <FileText size={28} color="#10b981" />
        <div>
          <h2 style={{ margin: 0, color: '#1e293b' }}>End of Day Finance Handover</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            {new Date().toLocaleDateString('en-ET', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button onClick={fetchSummary} title="Refresh" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
          <RefreshCw size={16} />
        </button>
      </div>

      {success ? (
        <div style={{ background: '#f0fdf4', padding: '3rem 2rem', borderRadius: 12, textAlign: 'center', border: '1px solid #bbf7d0' }}>
          <CheckCircle size={56} color="#16a34a" style={{ marginBottom: '1rem' }} />
          <h3 style={{ color: '#15803d' }}>Report Submitted Successfully!</h3>
          <p style={{ color: '#4ade80', marginBottom: '1.5rem' }}>Your end of day report has been sent to the Finance Department for review and approval.</p>
          <button
            onClick={() => { setSuccess(false); fetchSummary(); }}
            style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
          >
            Submit Another Report
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '1.5rem' }}>

          {/* System Summary */}
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <h3 style={{ margin: '0 0 1.25rem', color: '#1e293b', fontSize: 15 }}>📊 System Summary (Today)</h3>

            <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '14px 16px', marginBottom: '1rem' }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Total Completed Sales</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#10b981' }}>{summary.totalSales.toFixed(2)} ETB</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{summary.transactionCount} transaction{summary.transactionCount !== 1 ? 's' : ''}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: '💵 Cash Collected', value: summary.byPayment.cash, color: '#166534', bg: '#dcfce7' },
                { label: '📱 Telebirr Collected', value: summary.byPayment.telebirr, color: '#1d4ed8', bg: '#dbeafe' },
                { label: '🏦 Bank Transfer', value: summary.byPayment.bank_transfer, color: '#6d28d9', bg: '#ede9fe' },
              ].map(({ label, value, color, bg }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: bg, borderRadius: 6, padding: '10px 14px' }}>
                  <span style={{ fontSize: 13, color }}>{label}</span>
                  <strong style={{ color }}>{value.toFixed(2)} ETB</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Physical Count Form */}
          <form onSubmit={handleSubmit} style={{ background: 'white', padding: '1.5rem', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <h3 style={{ margin: '0 0 1.25rem', color: '#1e293b', fontSize: 15 }}>🧾 Cashier Physical Count</h3>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 600, fontSize: 13 }}>Physical Cash Counted (ETB) *</label>
              <input
                type="number" step="0.01" name="physical_cash_counted"
                value={formData.physical_cash_counted}
                onChange={handleChange}
                required
                style={{ ...inputStyle, borderColor: '#10b981' }}
                placeholder="Enter cash amount on hand"
              />
            </div>

            {differenceAmount !== null && differenceAmount !== '0.00' && (
              <div style={{ background: '#fef2f2', padding: '12px 14px', borderRadius: 8, marginBottom: '1rem', border: '1px solid #fecaca' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ef4444', marginBottom: 8 }}>
                  <AlertTriangle size={16} />
                  <strong>Difference: {parseFloat(differenceAmount) > 0 ? '+' : ''}{differenceAmount} ETB</strong>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>({parseFloat(differenceAmount) > 0 ? 'surplus' : 'shortage'})</span>
                </div>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 5, color: '#7f1d1d' }}>Reason for difference *</label>
                <input
                  type="text" name="difference_reason"
                  value={formData.difference_reason}
                  onChange={handleChange}
                  required
                  style={{ ...inputStyle, borderColor: '#fca5a5' }}
                  placeholder="e.g. Change given error, customer refund..."
                />
              </div>
            )}

            {differenceAmount === '0.00' && formData.physical_cash_counted && (
              <div style={{ background: '#f0fdf4', padding: '8px 14px', borderRadius: 8, marginBottom: '1rem', fontSize: 13, color: '#166534', display: 'flex', gap: 6, alignItems: 'center' }}>
                <CheckCircle size={14} /> Cash matches system perfectly!
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Refunds Given (ETB)</label>
                <input type="number" step="0.01" name="refunds_given" value={formData.refunds_given} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Transport Expenses (ETB)</label>
                <input type="number" step="0.01" name="expenses_transport" value={formData.expenses_transport} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Loading Expenses (ETB)</label>
                <input type="number" step="0.01" name="expenses_loading" value={formData.expenses_loading} onChange={handleChange} style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Additional Notes</label>
              <textarea
                name="notes" value={formData.notes} onChange={handleChange}
                rows={3} style={{ ...inputStyle, resize: 'vertical' }}
                placeholder="Any issues, observations, or notes for the Finance team..."
              />
            </div>

            <div style={{ background: '#fffbeb', borderRadius: 8, padding: '12px 14px', marginBottom: '1.25rem', fontSize: 12, color: '#92400e' }}>
              ⚠️ By submitting, you confirm that the physical cash + receipts are ready to hand over to the Finance Officer. This action cannot be undone.
            </div>

            <button
              type="submit"
              disabled={submitting || !formData.physical_cash_counted}
              style={{
                width: '100%', background: !formData.physical_cash_counted ? '#e2e8f0' : '#10b981',
                color: !formData.physical_cash_counted ? '#94a3b8' : 'white',
                padding: '13px', borderRadius: 8, border: 'none', fontWeight: 700, cursor: !formData.physical_cash_counted ? 'not-allowed' : 'pointer',
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, fontSize: 14
              }}
            >
              {submitting ? 'Submitting...' : <><Send size={18} /> Submit to Finance Department</>}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default FarmingFinanceReport;
