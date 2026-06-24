import React, { useState, useEffect } from 'react';
import financeService from '../../services/financeService';
import purchaseService from '../../services/purchaseService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './PaymentTracking.module.css';
const PaymentTracking = () => {
  const [payments, setPayments] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [paymentType, setPaymentType] = useState('invoice');
  const [formData, setFormData] = useState({
    referenceId: '',
    amount: '',
    paymentMethodId: '',
    referenceNumber: '',
    notes: ''
  });
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [unpaidPOs, setUnpaidPOs] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [grns, setGrns] = useState([]);
  const [loadingGrn, setLoadingGrn] = useState(false);
  const [loadingLists, setLoadingLists] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!showForm) return;
    setLoadingLists(true);
    const promises = paymentType === 'invoice'
      ? [financeService.getUnpaidInvoices()]
      : [financeService.getUnpaidPOs()];
    Promise.all(promises)
      .then(([res]) => {
        const list = res?.data || [];
        if (paymentType === 'invoice') setUnpaidInvoices(list);
        else setUnpaidPOs(list);
      })
      .catch(() => {})
      .finally(() => setLoadingLists(false));
  }, [showForm, paymentType]);

  const currentList = paymentType === 'invoice' ? unpaidInvoices : unpaidPOs;

  const handleSelectChange = (e) => {
    const id = e.target.value;
    if (!id) {
      setFormData(prev => ({ ...prev, referenceId: '' }));
      setSelectedItem(null);
      setGrns([]);
      return;
    }
    setFormData(prev => ({ ...prev, referenceId: id }));
    const item = currentList.find(i => String(i.id) === id);
    setSelectedItem(item || null);
    if (paymentType === 'po' && item) fetchGRNs(item.id);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payRes, methodRes] = await Promise.all([
        financeService.getPayments({ limit: 50 }),
        financeService.getPaymentMethods().catch(() => ({ data: { data: [] } }))
      ]);
      setPayments(payRes?.data?.data?.payments || []);
      setPaymentMethods(methodRes?.data?.data || [
        { id: 1, name: 'Bank Transfer' }, { id: 2, name: 'Cash' }, { id: 3, name: 'Corporate Card' }
      ]);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      showMessage('error', 'Failed to load payment history.');
    } finally {
      setLoading(false);
    }
  };

  const fetchGRNs = async (poId) => {
    try {
      setLoadingGrn(true);
      const res = await purchaseService.getGRNs(poId);
      if (res.status === 'success') setGrns(res.data);
    } catch (err) {
      setGrns([]);
    } finally {
      setLoadingGrn(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.referenceId) {
      showMessage('error', 'Please select an item from the list.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        amount: parseFloat(formData.amount),
        paymentMethodId: parseInt(formData.paymentMethodId, 10),
        ...(formData.referenceNumber?.trim() && { referenceNumber: formData.referenceNumber.trim() }),
        ...(formData.notes?.trim() && { notes: formData.notes.trim() })
      };
      if (paymentType === 'invoice') {
        payload.saleId = parseInt(formData.referenceId, 10);
        await financeService.processInvoicePayment(payload);
      } else {
        payload.poId = parseInt(formData.referenceId, 10);
        await financeService.processPOPayment(payload);
      }
      showMessage('success', `Payment processed successfully for ${paymentType.toUpperCase()}.`);
      setShowForm(false);
      setFormData({ referenceId: '', amount: '', paymentMethodId: '', referenceNumber: '', notes: '' });
      setSelectedItem(null);
      setGrns([]);
      fetchData();
    } catch (error) {
      console.error('Failed to process payment:', error);
      showMessage('error', error.response?.data?.message || 'Failed to process payment.');
    } finally {
      setSubmitting(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const getMethodName = (id) => {
    const method = paymentMethods.find(m => m.id === id);
    return method ? method.name : 'Unknown';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Payment Tracking</h1>
          <p className={styles.subtitle}>Monitor inbound and outbound payments</p>
        </div>
        <button
          className={styles.primaryBtn}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Process Payment'}
        </button>
      </div>
      {message && (
        <div className={`${styles.alert} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}
      {showForm && (
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Process New Payment</h2>
            <div className={styles.typeSelector}>
              <button
                type="button"
                className={`${styles.typeBtn} ${paymentType === 'invoice' ? styles.active : ''}`}
                onClick={() => {
                  setPaymentType('invoice');
                  setFormData(prev => ({ ...prev, referenceId: '' }));
                  setSelectedItem(null);
                  setGrns([]);
                }}
              >
                Customer Invoice (Inbound)
              </button>
              <button
                type="button"
                className={`${styles.typeBtn} ${paymentType === 'po' ? styles.active : ''}`}
                onClick={() => {
                  setPaymentType('po');
                  setFormData(prev => ({ ...prev, referenceId: '' }));
                  setSelectedItem(null);
                  setGrns([]);
                }}
              >
                Purchase Order (Outbound)
              </button>
            </div>
          </div>
          <form onSubmit={handleSubmit} className={styles.formGrid}>
            <div className={styles.formGroup} style={{ position: 'relative' }}>
              <label>{paymentType === 'invoice' ? 'Select Invoice' : 'Select Purchase Order'}</label>
              {loadingLists ? (
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Loading...</span>
              ) : currentList.length === 0 ? (
                <span style={{ color: '#dc2626', fontSize: '0.85rem' }}>No unpaid items found.</span>
              ) : (
                <select
                  value={formData.referenceId}
                  onChange={handleSelectChange}
                  required
                >
                  <option value="">-- Select --</option>
                  {currentList.map(item => (
                    <option key={item.id} value={item.id}>
                      {paymentType === 'invoice'
                        ? `${item.invoice_number} — ${item.customer_name} (${formatCurrency(item.balance_due)})`
                        : `${item.po_number} — ${item.supplier_name} (${formatCurrency(item.balance_due)})`
                      }
                    </option>
                  ))}
                </select>
              )}
              {selectedItem && (
                <span className={styles.grnComplete} style={{ marginTop: '4px', display: 'block', fontSize: '0.82rem' }}>
                  ✓ {paymentType === 'invoice' ? selectedItem.invoice_number : selectedItem.po_number}
                  {' — '}{paymentType === 'invoice' ? selectedItem.customer_name : selectedItem.supplier_name}
                  {' — Balance: '}{formatCurrency(selectedItem.balance_due)}
                </span>
              )}
              {paymentType === 'po' && selectedItem && (
                <div className={styles.grnInfo}>
                  {loadingGrn ? (
                    <span className={styles.grnLoading}>Loading GRNs...</span>
                  ) : grns.length > 0 ? (
                    <div className={styles.grnList}>
                      <strong>Goods Received Notes:</strong>
                      {grns.map(grn => (
                        <div key={grn.id} className={styles.grnItem}>
                          <span>{grn.grn_number}</span>
                          <span className={styles.grnDate}>{new Date(grn.created_at).toLocaleDateString()}</span>
                          <span className={grn.status === 'completed' ? styles.grnComplete : styles.grnPartial}>
                            {grn.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className={styles.grnWarning}>No GRN found. Receive goods first before payment.</span>
                  )}
                </div>
              )}
            </div>
            <div className={styles.formGroup}>
              <label>Amount</label>
              <div className={styles.inputWrapper}>
                <span className={styles.currencyPrefix}>$</span>
                <input
                  type="number" name="amount" value={formData.amount}
                  onChange={handleInputChange} min="0.01" step="0.01" required
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Payment Method</label>
              <select name="paymentMethodId" value={formData.paymentMethodId} onChange={handleInputChange} required>
                <option value="">Select Method</option>
                {paymentMethods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Reference Number (Txn Hash / Check #)</label>
              <input
                type="text" name="referenceNumber" value={formData.referenceNumber}
                onChange={handleInputChange}
              />
            </div>
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label>Notes (Optional)</label>
              <input
                type="text" name="notes" value={formData.notes}
                onChange={handleInputChange} maxLength="500"
              />
            </div>
            <div className={`${styles.formActions} ${styles.fullWidth}`}>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={submitting || !formData.referenceId}
              >
                {submitting ? 'Processing...' : 'Process Payment'}
              </button>
            </div>
          </form>
        </div>
      )}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading payment history...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No payments recorded yet.</p>
          </div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Reference</th>
                  <th>Method</th>
                  <th>Notes</th>
                  <th className={styles.amountCol}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{formatDate(payment.createdAt || payment.paymentDate)}</td>
                    <td>
                      <span className={`${styles.badge} ${payment.referenceType === 'Invoice' || payment.saleId ? styles.inbound : styles.outbound}`}>
                        {payment.referenceType || (payment.saleId ? 'Invoice' : 'PO')}
                      </span>
                    </td>
                    <td className={styles.boldText}>
                       {payment.referenceType === 'Invoice' || payment.saleId ? `Sale #${payment.saleId}` : `PO #${payment.poId}`}
                    </td>
                    <td>{payment.PaymentMethod?.name || getMethodName(payment.paymentMethodId)}</td>
                    <td className={styles.notesText}>{payment.notes || payment.referenceNumber || '-'}</td>
                    <td className={`${styles.amountCol} ${payment.referenceType === 'Invoice' || payment.saleId ? styles.positiveText : styles.negativeText}`}>
                      {payment.referenceType === 'Invoice' || payment.saleId ? '+' : '-'}{formatCurrency(payment.amount)}
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
export default PaymentTracking;