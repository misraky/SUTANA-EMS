import React, { useState, useEffect } from 'react';
import financeService from '../../services/financeService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './PaymentTracking.module.css';
const PaymentTracking = () => {
  const [payments, setPayments] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [paymentType, setPaymentType] = useState('invoice'); 
  const [formData, setFormData] = useState({
    referenceId: '', // either saleId or poId
    amount: '',
    paymentMethodId: '',
    referenceNumber: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  useEffect(() => {
    fetchData();
  }, []);
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
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        amount: parseFloat(formData.amount),
        paymentMethodId: parseInt(formData.paymentMethodId, 10),
        referenceNumber: formData.referenceNumber,
        notes: formData.notes
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
                className={`${styles.typeBtn} ${paymentType === 'invoice' ? styles.active : ''}`}
                onClick={() => setPaymentType('invoice')}
              >
                Customer Invoice (Inbound)
              </button>
              <button 
                className={`${styles.typeBtn} ${paymentType === 'po' ? styles.active : ''}`}
                onClick={() => setPaymentType('po')}
              >
                Purchase Order (Outbound)
              </button>
            </div>
          </div>
          <form onSubmit={handleSubmit} className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>{paymentType === 'invoice' ? 'Sale ID' : 'PO ID'}</label>
              <input 
                type="number" name="referenceId" value={formData.referenceId} 
                onChange={handleInputChange} required min="1"
                placeholder={`Enter ${paymentType === 'invoice' ? 'Sale' : 'PO'} ID`}
              />
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
              <button type="submit" className={styles.submitBtn} disabled={submitting}>
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
