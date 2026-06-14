import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/apiClient';

const PRODUCT_TYPES = [
  { code: 'Book', name: 'Book Printing', desc: 'For scholars and researchers' },
  { code: 'Module', name: 'Module Printing', desc: 'For lecturers and educators' },
  { code: 'Exam', name: 'Exam Paper', desc: 'For examinations and tests' },
  { code: 'Brochure', name: 'Brochure', desc: 'For churches, weddings, events' },
  { code: 'TaxReceipt', name: 'Tax Receipt', desc: 'Official government tax receipts' },
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

const PrintingCreateOrder = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    customerName: '', customerPhone: '', productType: 'Book',
    paperType: 'A4', pagesPerCopy: 1, quantity: 1,
    colorPrinting: false, bindingType: 'None', dueDate: '', specialInstructions: ''
  });
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const basePrice = PAPER_TYPES.find(p => p.code === form.paperType)?.price || 0.50;
    const multiplier = form.colorPrinting ? 2.0 : 1.0;
    const pricePerUnit = form.pagesPerCopy * basePrice * multiplier;
    const bindingCost = BINDING_TYPES.find(b => b.code === form.bindingType)?.price || 0;
    const bindingTotal = bindingCost * form.quantity;
    const subtotal = pricePerUnit * form.quantity;
    setPricing({ pricePerUnit, bindingCost: bindingTotal, subtotal, totalPrice: subtotal + bindingTotal });
  }, [form.paperType, form.pagesPerCopy, form.quantity, form.colorPrinting, form.bindingType]);

  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.customerName || !form.customerPhone) { setError('Customer name and phone are required'); return; }
    if (form.customerPhone.length < 10) { setError('Enter a valid phone number'); return; }
    if (!form.dueDate) { setError('Due date is required'); return; }
    setLoading(true);
    try {
      const res = await axios.post('/printing/orders', {
        productType: form.productType,
        quantity: parseInt(form.quantity),
        paperType: form.paperType,
        pagesPerCopy: parseInt(form.pagesPerCopy),
        colorPrinting: form.colorPrinting,
        bindingType: form.bindingType,
        dueDate: form.dueDate,
        specialInstructions: form.specialInstructions || undefined,
        customer: { name: form.customerName, phone: form.customerPhone, customerTypeId: 1 }
      });
      if (res.status === 'success') {
        navigate(`/printing/orders/${res.data?.orderId}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 1.5rem', color: '#1e293b' }}>New Printing Order</h2>

      {error && (
        <div style={{ padding: '10px 16px', borderRadius: 8, marginBottom: '1rem', fontSize: 13, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ background: 'white', borderRadius: 10, padding: '1.5rem', marginBottom: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: 14, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Customer Info</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>Customer Name *</label>
              <input value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>Phone *</label>
              <input value={form.customerPhone} onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))}
                placeholder="09xxxxxxxx"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }} />
            </div>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 10, padding: '1.5rem', marginBottom: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: 14, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Order Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>Product Type</label>
              <select value={form.productType} onChange={e => setForm(f => ({ ...f, productType: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: 'white' }}>
                {PRODUCT_TYPES.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>Paper Size</label>
              <select value={form.paperType} onChange={e => setForm(f => ({ ...f, paperType: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: 'white' }}>
                {PAPER_TYPES.map(p => <option key={p.code} value={p.code}>{p.name} ({p.desc})</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>Binding</label>
              <select value={form.bindingType} onChange={e => setForm(f => ({ ...f, bindingType: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: 'white' }}>
                {BINDING_TYPES.map(b => <option key={b.code} value={b.code}>{b.name} {b.price > 0 ? `(+${b.price} ETB/copy)` : ''}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>Pages per Copy</label>
              <input type="number" min={1} value={form.pagesPerCopy} onChange={e => setForm(f => ({ ...f, pagesPerCopy: Math.max(1, parseInt(e.target.value) || 1) }))}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>Quantity</label>
              <input type="number" min={1} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>Due Date *</label>
              <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} min={tomorrow.toISOString().split('T')[0]}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748b', fontWeight: 600, marginTop: 22 }}>
                <input type="checkbox" checked={form.colorPrinting} onChange={e => setForm(f => ({ ...f, colorPrinting: e.target.checked }))} />
                Color Printing (×2)
              </label>
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>Special Instructions</label>
            <textarea value={form.specialInstructions} onChange={e => setForm(f => ({ ...f, specialInstructions: e.target.value }))} rows={2} maxLength={500}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', resize: 'vertical' }} />
          </div>
        </div>

        {pricing && (
          <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '1.25rem', marginBottom: '1.5rem', border: '1px solid #bbf7d0' }}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: 14, color: '#166534' }}>Price Estimate</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
              <div><span style={{ fontSize: 12, color: '#166534' }}>Price/Unit</span><div style={{ fontSize: 16, fontWeight: 700, color: '#15803d' }}>{pricing.pricePerUnit.toFixed(2)} ETB</div></div>
              <div><span style={{ fontSize: 12, color: '#166534' }}>Binding Cost</span><div style={{ fontSize: 16, fontWeight: 700, color: '#15803d' }}>{pricing.bindingCost.toFixed(2)} ETB</div></div>
              <div><span style={{ fontSize: 12, color: '#166534' }}>Subtotal</span><div style={{ fontSize: 16, fontWeight: 700, color: '#15803d' }}>{pricing.subtotal.toFixed(2)} ETB</div></div>
              <div><span style={{ fontSize: 12, color: '#166534' }}>Total</span><div style={{ fontSize: 20, fontWeight: 700, color: '#15803d' }}>{pricing.totalPrice.toFixed(2)} ETB</div></div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => navigate('/printing/orders')}
            style={{ padding: '10px 24px', border: '1px solid #e2e8f0', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13, color: '#475569' }}>
            Cancel
          </button>
          <button type="submit" disabled={loading}
            style={{ padding: '10px 24px', border: 'none', borderRadius: 8, background: loading ? '#94a3b8' : '#3b82f6', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}>
            {loading ? 'Creating...' : 'Create Order'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PrintingCreateOrder;
