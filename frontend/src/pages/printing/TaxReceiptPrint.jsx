import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import printingService from '../../services/printingService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './TaxReceiptPrint.module.css';
const TaxReceiptPrint = () => {
  const [searchParams] = useSearchParams();
  const initialOrderId = searchParams.get('orderId') || '';
  const [receipts, setReceipts]   = useState([]);
  const [orders, setOrders]       = useState([]);   // for the dropdown
  const [loading, setLoading]     = useState(true);
  const [generatedReceipt, setGeneratedReceipt] = useState(null);
  // Form State
  const [showForm, setShowForm]   = useState(false);
  const [formData, setFormData]   = useState({
    orderId: initialOrderId,
    approvalAmountTotal: '',
    approvedDate: new Date().toISOString().split('T')[0],
    approvalDocument: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage]       = useState(null);
  useEffect(() => {
    fetchAll();
    if (initialOrderId) setShowForm(true);
  }, [initialOrderId]);
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [receiptsRes, ordersRes] = await Promise.all([
        printingService.getTaxReceipts({ limit: 50 }),
        printingService.getOrders({ limit: 100 }),
      ]);
      setReceipts(receiptsRes.data?.receipts || receiptsRes.data?.rows || []);
      setOrders(ordersRes.data?.orders || []);
    } catch (error) {
      console.error('Failed to fetch tax receipt data:', error);
      showMessage('error', 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.orderId) {
      showMessage('error', 'Please select a printing order.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        approvalAmountTotal: parseInt(formData.approvalAmountTotal, 10),
        approvedDate: formData.approvedDate,
        approvalDocument: formData.approvalDocument || ''
      };
      const res = await printingService.generateTaxReceipt(formData.orderId, payload);
      const receipt = res.data?.receipt;
      setGeneratedReceipt(receipt);
      showMessage('success', `Tax receipt ${receipt?.serialNumber} generated successfully!`);
      setShowForm(false);
      setFormData({ orderId: '', approvalAmountTotal: '', approvedDate: new Date().toISOString().split('T')[0], approvalDocument: '' });
      fetchAll();
    } catch (error) {
      console.error('Failed to generate receipt:', error);
      showMessage('error', error.message || 'Failed to generate tax receipt.');
    } finally {
      setSubmitting(false);
    }
  };
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 6000);
  };
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Tax Receipts</h1>
          <p className={styles.subtitle}>Generate and manage official government tax receipts</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.secondaryBtn} onClick={() => window.print()}>
            🖨️ Print List
          </button>
          <button
            className={styles.primaryBtn}
            onClick={() => { setShowForm(!showForm); setGeneratedReceipt(null); }}
          >
            {showForm ? '✕ Cancel' : '+ Generate Receipt'}
          </button>
        </div>
      </div>
      {message && (
        <div className={`${styles.alert} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}
      {}
      {generatedReceipt && (
        <div className={styles.receiptPreview}>
          <div className={styles.receiptHeader}>
            <span className={styles.receiptIcon}>📋</span>
            <div>
              <h2>Receipt Generated</h2>
              <p className={styles.receiptSerial}>{generatedReceipt.serialNumber}</p>
            </div>
            <button className={styles.printReceiptBtn} onClick={() => window.print()}>🖨️ Print</button>
          </div>
          <div className={styles.receiptGrid}>
            <div><span>Order</span><strong>{generatedReceipt.orderNumber}</strong></div>
            <div><span>Customer</span><strong>{generatedReceipt.customerName}</strong></div>
            <div><span>Approved Qty</span><strong>{generatedReceipt.approvalAmountTotal}</strong></div>
            <div><span>Used</span><strong>{generatedReceipt.usedCount}</strong></div>
            <div><span>Remaining</span><strong style={{color: generatedReceipt.remaining > 0 ? '#059669' : '#dc2626'}}>{generatedReceipt.remaining}</strong></div>
            <div><span>Approved Date</span><strong>{formatDate(generatedReceipt.approvedDate, 'short')}</strong></div>
          </div>
        </div>
      )}
      {}
      {showForm && (
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>Generate New Tax Receipt</h2>
          <form onSubmit={handleSubmit} className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Printing Order <span className={styles.required}>*</span></label>
              <select
                name="orderId"
                value={formData.orderId}
                onChange={handleInputChange}
                required
                disabled={!!initialOrderId}
              >
                <option value="">— Select an order —</option>
                {orders.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.order_number || `PO-${o.id}`} — {o.customer_name || 'Walk-in'} ({o.product_type || o.status_name})
                  </option>
                ))}
              </select>
              {orders.length === 0 && !loading && (
                <p className={styles.fieldHint}>No orders found. Create a printing order first.</p>
              )}
            </div>
            <div className={styles.formGroup}>
              <label>Approved Quantity (copies) <span className={styles.required}>*</span></label>
              <input
                type="number" name="approvalAmountTotal" value={formData.approvalAmountTotal}
                onChange={handleInputChange} min="1" required
                placeholder="e.g. 500"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Approval Date <span className={styles.required}>*</span></label>
              <input
                type="date" name="approvedDate" value={formData.approvedDate}
                onChange={handleInputChange} required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Approval Document Ref <span className={styles.optional}>(optional)</span></label>
              <input
                type="text" name="approvalDocument" value={formData.approvalDocument}
                onChange={handleInputChange} placeholder="e.g. MOF-2026-001"
              />
            </div>
            <div className={`${styles.formActions} ${styles.fullWidth}`}>
              <button type="submit" className={styles.submitBtn} disabled={submitting || !formData.orderId}>
                {submitting ? 'Generating...' : '✓ Generate Receipt'}
              </button>
            </div>
          </form>
        </div>
      )}
      {}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading tax receipts...</p>
          </div>
        ) : receipts.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📄</div>
            <p>No tax receipts have been generated yet.</p>
            <button className={styles.primaryBtn} onClick={() => setShowForm(true)}>Generate First Receipt</button>
          </div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date Generated</th>
                  <th>Serial Number</th>
                  <th>Order Ref</th>
                  <th>Customer</th>
                  <th>Approved Qty</th>
                  <th>Used</th>
                  <th>Remaining</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((receipt) => (
                  <tr key={receipt.id}>
                    <td>{formatDate(receipt.printed_at, 'short')}</td>
                    <td className={styles.boldText}>{receipt.serial_number || `TR-${receipt.id}`}</td>
                    <td>
                      <a href={`/printing/orders/${receipt.order_id}`} className={styles.orderLink}>
                        {receipt.order_number || `PO-${receipt.order_id}`}
                      </a>
                    </td>
                    <td>{receipt.customer_name || receipt.customer_name_join || 'Walk-in'}</td>
                    <td>{(receipt.approval_amount_total || 0).toLocaleString()}</td>
                    <td>{(receipt.used_count || 0).toLocaleString()}</td>
                    <td>
                      <span style={{
                        color: receipt.remaining > 0 ? '#059669' : '#dc2626',
                        fontWeight: 700
                      }}>
                        {(receipt.remaining || 0).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <button className={styles.actionBtn} onClick={() => window.print()}>
                        🖨️ Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
export default TaxReceiptPrint;
