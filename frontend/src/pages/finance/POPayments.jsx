import React, { useState, useEffect } from 'react';
import financeService from '../../services/financeService';
import purchaseService from '../../services/purchaseService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './POPayments.module.css';

const POPayments = () => {
  const [unpaidPOs, setUnpaidPOs] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, paymentsRes] = await Promise.all([
        purchaseService.getPurchaseOrders({ limit: 200 }),
        financeService.getPayments({ referenceType: 'PO', limit: 50 })
      ]);
      const allOrders = ordersRes.data?.orders || [];
      const payments = paymentsRes.data?.payments || [];
      const unpaid = allOrders.filter(o =>
        o.status_name === 'Complete' || o.status_name === 'Partial Received'
      );
      setUnpaidPOs(unpaid);
      setRecentPayments(payments);
      const methodsRes = await financeService.getPaymentMethods();
      setPaymentMethods(methodsRes.data?.paymentMethods || methodsRes.data || []);
    } catch (err) {
      console.error('Failed to fetch PO payment data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handlePay = async (e) => {
    e.preventDefault();
    if (!payModal || !payAmount || !payMethod) return;
    setSubmitting(true);
    try {
      await financeService.processPOPayment({
        poId: payModal.id,
        amount: parseFloat(payAmount),
        paymentMethodId: parseInt(payMethod),
        referenceNumber: payRef || undefined,
        notes: payNotes || undefined
      });
      setSuccessMsg(`Payment of ${formatCurrency(payAmount)} recorded for ${payModal.po_number}`);
      setPayModal(null);
      setPayAmount('');
      setPayMethod('');
      setPayRef('');
      setPayNotes('');
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchData();
    } catch (err) {
      alert('Payment failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className={styles.loading}>Loading PO payments...</div>;

  return (
    <div className={styles.paymentTracking}>
      <div className={styles.sectionHeader}>
        <div>
          <h2>Purchase Order Payments</h2>
          <p>Record payments against completed and partially received purchase orders</p>
        </div>
        <div className={styles.totalBadge}>{unpaidPOs.length} unpaid POs</div>
      </div>

      {successMsg && (
        <div style={{ padding: '12px 16px', background: '#dcfce7', color: '#166534', borderRadius: 8, marginBottom: 16, fontWeight: 500 }}>
          {successMsg}
        </div>
      )}

      <div className={styles.paymentTabs}>
        <div className={styles.tabContent}>
          <h3 className={styles.sectionTitle}>Unpaid / Partially Paid Purchase Orders</h3>
          {unpaidPOs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
              No purchase orders pending payment.
            </div>
          ) : (
            <table className={styles.paymentsTable}>
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {unpaidPOs.map(po => {
                  const paid = parseFloat(po.paid_amount || 0);
                  const total = parseFloat(po.total_amount || 0);
                  const balance = total - paid;
                  return (
                    <tr key={po.id}>
                      <td><strong>{po.po_number}</strong></td>
                      <td>{po.supplier_name}</td>
                      <td>{formatCurrency(total)}</td>
                      <td>{formatCurrency(paid)}</td>
                      <td><strong>{formatCurrency(balance)}</strong></td>
                      <td>
                        <span className={`${styles.statusBadge} ${po.status_name === 'Complete' ? styles.statusComplete : styles.statusPartial}`}>
                          {po.status_name}
                        </span>
                      </td>
                      <td>
                        <button className={styles.actionBtn} onClick={() => { setPayModal(po); setPayAmount(balance); }}>
                          Record Payment
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className={styles.tabContent} style={{ marginTop: 24 }}>
          <h3 className={styles.sectionTitle}>Recent PO Payments</h3>
          {recentPayments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
              No payments recorded yet.
            </div>
          ) : (
            <table className={styles.paymentsTable}>
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th>Processed By</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map(p => (
                  <tr key={p.id}>
                    <td><strong>{p.reference_number}</strong></td>
                    <td>{p.party_name}</td>
                    <td>{formatCurrency(p.amount)}</td>
                    <td>{p.payment_method}</td>
                    <td>{p.transaction_ref || '—'}</td>
                    <td>{p.processed_by_name}</td>
                    <td>{formatDate(p.processed_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {payModal && (
        <div className={styles.modalOverlay} onClick={() => setPayModal(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <h3 style={{ marginBottom: 4 }}>Record Payment</h3>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>
              {payModal.po_number} — {payModal.supplier_name}
            </p>
            <form onSubmit={handlePay}>
              <div className={styles.formGroup}>
                <label>Payment Amount (ETB)</label>
                <input type="number" step="0.01" min="0.01" className={styles.formInput}
                  value={payAmount} onChange={e => setPayAmount(e.target.value)} required />
              </div>
              <div className={styles.formGroup}>
                <label>Payment Method</label>
                <select className={styles.formInput} value={payMethod} onChange={e => setPayMethod(e.target.value)} required>
                  <option value="">Select method</option>
                  {paymentMethods.map(pm => (
                    <option key={pm.id} value={pm.id}>{pm.display_name || pm.name}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Reference Number</label>
                <input type="text" className={styles.formInput} value={payRef}
                  onChange={e => setPayRef(e.target.value)} placeholder="e.g. bank transfer ref" />
              </div>
              <div className={styles.formGroup}>
                <label>Notes</label>
                <textarea className={styles.formInput} rows={2} value={payNotes}
                  onChange={e => setPayNotes(e.target.value)} placeholder="Optional notes" />
              </div>
              <div className={styles.modalActions} style={{ marginTop: 16 }}>
                <button type="button" className={styles.btnSecondary} onClick={() => setPayModal(null)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary} disabled={submitting}>
                  {submitting ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default POPayments;