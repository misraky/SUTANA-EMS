import React, { useState, useEffect } from 'react';
import salesService from '../../services/salesService';
import { formatCurrency } from '../../utils/formatters';

const responsiveStyles = `
  @media (max-width: 900px) {
    .returns-grid { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 768px) {
    .returns-search-row { flex-direction: column !important; }
    .returns-search-row input, .returns-search-row button { width: 100% !important; }
    .returns-table-wrap { overflow-x: auto; }
    .returns-table-wrap table { min-width: 600px; }
    .returns-card { padding: 16px !important; }
    .returns-summary { margin-top: 0 !important; }
  }
  @media (max-width: 480px) {
    .returns-table-wrap table { min-width: 500px; }
    .returns-page-padding { padding: 12px !important; }
  }
`;

const REASON_CODES = [
  'customer_return', 'defective', 'wrong_item', 'damaged_in_transit',
  'expired', 'quality_issue', 'change_of_mind', 'exchange'
];

const ReturnsPage = () => {
  const [step, setStep] = useState('search');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [sale, setSale] = useState(null);
  const [saleItems, setSaleItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [reasonCodes, setReasonCodes] = useState({});
  const [refundMethod, setRefundMethod] = useState('original');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [returns, setReturns] = useState([]);

  useEffect(() => {
    loadReturnHistory();
  }, []);

  const loadReturnHistory = async () => {
    try {
      const res = await salesService.getReturnHistory({ limit: 10 });
      setReturns(res.data?.data?.returns || []);
    } catch {}
  };

  const handleLookup = async () => {
    if (!invoiceSearch.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const salesRes = await salesService.getSales({ limit: 50 });
      const sales = salesRes.data?.data?.sales || [];
      const found = sales.find(s =>
        s.invoice_number?.toLowerCase() === invoiceSearch.trim().toLowerCase()
      );
      if (!found) {
        setMessage({ type: 'error', text: `Invoice ${invoiceSearch} not found` });
        setLoading(false);
        return;
      }
      const itemsRes = await salesService.getSaleItems(found.id);
      const data = itemsRes.data?.data;
      if (!data) throw new Error('No data returned');
      setSale(data.sale);
      setSaleItems(data.items || []);
      setSelectedItems({});
      setReasonCodes({});
      setStep('select');
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to look up sale' });
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (itemId, productId, maxQty) => {
    setSelectedItems(prev => {
      if (prev[itemId]) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return { ...prev, [itemId]: { productId, quantity: maxQty, maxQty } };
    });
  };

  const updateReturnQty = (itemId, val) => {
    setSelectedItems(prev => {
      if (!prev[itemId]) return prev;
      const qty = Math.max(1, Math.min(val, prev[itemId].maxQty));
      return { ...prev, [itemId]: { ...prev[itemId], quantity: qty } };
    });
  };

  const handleProcessReturn = async () => {
    const items = Object.entries(selectedItems).map(([itemId, info]) => ({
      itemId: parseInt(itemId),
      productId: info.productId,
      quantity: info.quantity,
      reasonCode: reasonCodes[itemId] || 'customer_return'
    }));
    if (items.length === 0) {
      setMessage({ type: 'error', text: 'Select at least one item to return' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await salesService.processReturn({
        saleId: sale.id,
        items,
        refundMethod,
        notes
      });
      setMessage({ type: 'success', text: `Return processed: ${res.data?.data?.returnNumber}` });
      setStep('done');
      loadReturnHistory();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Return failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleNewReturn = () => {
    setStep('search');
    setSale(null);
    setSaleItems([]);
    setSelectedItems({});
    setReasonCodes({});
    setInvoiceSearch('');
    setNotes('');
    setMessage(null);
  };

  const totalRefundAmount = Object.entries(selectedItems).reduce((sum, [, info]) => {
    const item = saleItems.find(i => i.id === parseInt(Object.keys(selectedItems).find(k => selectedItems[k] === info)));
    return sum + (info.quantity || 0) * (item?.unit_price || 0);
  }, 0);

  const selectedCount = Object.keys(selectedItems).length;

  return (
    <div className="returns-page-padding" style={{ padding: '24px' }}>
      <style>{responsiveStyles}</style>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Returns & Refunds</h1>
          <p className="page-subtitle">Process customer returns and issue refunds</p>
        </div>
      </div>

      {message && (
        <div style={{
          padding: '12px 16px', borderRadius: '8px', marginBottom: '16px',
          background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
          color: message.type === 'success' ? '#065f46' : '#991b1b',
          border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fecaca'}`
        }}>
          {message.text}
          {message.type === 'success' && step === 'done' && (
            <button onClick={handleNewReturn}
              style={{ marginLeft: '16px', padding: '4px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: '#065f46', color: '#fff' }}>
              New Return
            </button>
          )}
        </div>
      )}

      {step === 'search' && (
        <div className="card" style={{ padding: '32px', maxWidth: '600px' }}>
          <h3 style={{ marginBottom: '16px', fontWeight: 600 }}>Find Sale by Invoice</h3>
          <div className="returns-search-row" style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Enter invoice number (e.g. INV-20260601-0001)"
              value={invoiceSearch}
              onChange={e => setInvoiceSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLookup()}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: '6px', border: '1px solid #d1d5db',
                fontSize: '1rem'
              }}
            />
            <button onClick={handleLookup} disabled={loading || !invoiceSearch.trim()}
              style={{
                padding: '10px 24px', borderRadius: '6px', border: 'none',
                background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer',
                opacity: loading || !invoiceSearch.trim() ? 0.6 : 1
              }}>
              {loading ? 'Searching...' : 'Look Up'}
            </button>
          </div>

          {returns.length > 0 && (
            <div style={{ marginTop: '32px' }}>
              <h4 style={{ marginBottom: '12px', color: '#64748b', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Recent Returns
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Return #</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Invoice</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Refund</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {returns.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px', fontWeight: 500 }}>{r.return_number}</td>
                      <td style={{ padding: '8px' }}>{r.invoice_number}</td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#dc2626' }}>-{formatCurrency(r.total_refund)}</td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#64748b' }}>
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {step === 'select' && sale && (
        <div className="returns-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontWeight: 600 }}>Sale #{sale.invoice_number}</h3>
              <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                {new Date(sale.sale_date).toLocaleString()} | Customer: {sale.customer_name || 'Walk-in'}
              </span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '8px 4px', width: '40px' }}></th>
                  <th style={{ padding: '8px 4px', textAlign: 'left' }}>Product</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center' }}>Sold</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center' }}>Price</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center' }}>Qty to Return</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center' }}>Reason</th>
                </tr>
              </thead>
              <tbody>
                {saleItems.filter(i => i.returnable).map(item => {
                  const isSelected = !!selectedItems[item.id];
                  return (
                    <tr key={item.id} style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: isSelected ? '#eff6ff' : 'transparent'
                    }}>
                      <td style={{ padding: '8px 4px' }}>
                        <input type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleItem(item.id, item.product_id, item.quantity)}
                        />
                      </td>
                      <td style={{ padding: '8px 4px', fontWeight: 500 }}>
                        {item.product_name || `Product #${item.product_id}`}
                      </td>
                      <td style={{ padding: '8px 4px', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ padding: '8px 4px', textAlign: 'center' }}>
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td style={{ padding: '8px 4px', textAlign: 'center' }}>
                        {isSelected && (
                          <input type="number" min="1" max={item.quantity}
                            value={selectedItems[item.id]?.quantity || item.quantity}
                            onChange={e => updateReturnQty(item.id, parseInt(e.target.value) || 1)}
                            style={{ width: '60px', padding: '4px', textAlign: 'center', borderRadius: '4px', border: '1px solid #d1d5db' }}
                          />
                        )}
                      </td>
                      <td style={{ padding: '8px 4px', textAlign: 'center' }}>
                        {isSelected && (
                          <select
                            value={reasonCodes[item.id] || 'customer_return'}
                            onChange={e => setReasonCodes(prev => ({ ...prev, [item.id]: e.target.value }))}
                            style={{ padding: '4px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.75rem' }}
                          >
                            {REASON_CODES.map(rc => (
                              <option key={rc} value={rc}>{rc.replace(/_/g, ' ')}</option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {saleItems.filter(i => i.returnable).length === 0 && (
                  <tr><td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No returnable items found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="card returns-summary" style={{ padding: '24px' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
              Return Summary
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: 500, marginBottom: '4px', fontSize: '0.875rem' }}>Refund Method</label>
              <select value={refundMethod} onChange={e => setRefundMethod(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                <option value="original">Original Payment Method</option>
                <option value="cash">Cash</option>
                <option value="store_credit">Store Credit</option>
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: 500, marginBottom: '4px', fontSize: '0.875rem' }}>Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                placeholder="Reason for return..."
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', resize: 'vertical' }}
              />
            </div>
            <div style={{ padding: '12px 0', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Items selected</span>
                <span style={{ fontWeight: 600 }}>{selectedCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700 }}>
                <span>Refund Total</span>
                <span style={{ color: '#dc2626' }}>-{formatCurrency(totalRefundAmount)}</span>
              </div>
            </div>
            <button onClick={handleProcessReturn} disabled={loading || selectedCount === 0}
              style={{
                width: '100%', padding: '12px', marginTop: '16px', borderRadius: '6px', border: 'none',
                background: selectedCount === 0 ? '#d1d5db' : '#dc2626',
                color: '#fff', fontWeight: 600, fontSize: '1rem', cursor: selectedCount === 0 ? 'not-allowed' : 'pointer'
              }}>
              {loading ? 'Processing...' : `Process Return (${selectedCount} items)`}
            </button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>&#10003;</div>
          <h2 style={{ fontWeight: 700, marginBottom: '8px' }}>Return Completed</h2>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>
            The return has been processed and inventory has been updated.
          </p>
          <button onClick={handleNewReturn}
            style={{ padding: '12px 32px', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            Process Another Return
          </button>
        </div>
      )}
    </div>
  );
};

export default ReturnsPage;
