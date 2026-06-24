import React, { useState, useEffect } from 'react';
import financeService from '../../services/financeService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './EnhancedExpenseManagement.module.css';

const EXPENSE_TYPES = ['goods', 'services', 'transport', 'commission', 'rent', 'consultancy', 'construction', 'other'];

const EnhancedExpenseManagement = () => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [coaAccounts, setCoaAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({
    categoryId: '', amount: '', date: new Date().toISOString().split('T')[0],
    description: '', paymentMethodId: '', referenceNumber: '',
    currency: 'ETB', expenseType: 'goods', isVatRegistered: true,
    coaId: '', poId: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [taxPreview, setTaxPreview] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [expRes, catRes, payRes, coaRes] = await Promise.all([
        financeService.getEnhancedExpenses({ limit: 100 }),
        financeService.getExpenseCategories().catch(() => ({ data: { data: [] } })),
        financeService.getPaymentMethods().catch(() => ({ data: { data: [] } })),
        financeService.getCOA().catch(() => ({ data: { data: { accounts: [] } } }))
      ]);
      setExpenses(expRes?.data?.data || []);
      setCategories(catRes?.data?.categories || catRes?.data?.data || []);
      setPaymentMethods(payRes?.data?.paymentMethods || payRes?.data?.data || []);
      setCoaAccounts(coaRes?.data?.accounts || []);
    } catch (error) {
      showMessage('error', 'Failed to load data');
    } finally { setLoading(false); }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData(prev => {
      const updated = { ...prev, [name]: val };
      if (name === 'amount' || name === 'expenseType' || name === 'isVatRegistered') {
        const amount = parseFloat(name === 'amount' ? val : prev.amount);
        const expenseType = name === 'expenseType' ? val : prev.expenseType;
        const vatReg = name === 'isVatRegistered' ? val === true || val === 'true' : prev.isVatRegistered === true || prev.isVatRegistered === 'true';
        if (amount > 0) {
          const vat = vatReg ? amount * 0.15 : 0;
          const wthRates = { goods: 0.02, services: 0.02, transport: 0.02, commission: 0.10, rent: 0.10, consultancy: 0.10, construction: 0.05, other: 0.02 };
          const wth = amount * (wthRates[expenseType] || 0.02);
          setTaxPreview({ gross: amount, vat, withholding: wth, net: amount + vat - wth, vatRate: vatReg ? 15 : 0, wthRate: (wthRates[expenseType] || 0.02) * 100 });
        } else { setTaxPreview(null); }
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        categoryId: parseInt(formData.categoryId),
        amount: parseFloat(formData.amount),
        paymentMethodId: parseInt(formData.paymentMethodId),
        coaId: formData.coaId ? parseInt(formData.coaId) : null,
        poId: formData.poId ? parseInt(formData.poId) : null,
        isVatRegistered: formData.isVatRegistered === true || formData.isVatRegistered === 'true'
      };
      const res = await financeService.createEnhancedExpense(payload);
      showMessage('success', `Expense created. ${res?.data?.data?.budgetEncumbered ? 'Budget encumbered.' : ''} Tier: ${res?.data?.data?.tier}`);
      setShowForm(false);
      setFormData({ categoryId: '', amount: '', date: new Date().toISOString().split('T')[0], description: '', paymentMethodId: '', referenceNumber: '', currency: 'ETB', expenseType: 'goods', isVatRegistered: true, coaId: '', poId: '' });
      setTaxPreview(null);
      fetchData();
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to create expense');
    } finally { setSubmitting(false); }
  };

  const viewDetails = async (id) => {
    setDetailLoading(true);
    try {
      const res = await financeService.getEnhancedExpenseById(id);
      setSelectedExpense(res?.data?.data?.expense);
    } catch (error) {
      showMessage('error', 'Failed to load expense details');
    } finally { setDetailLoading(false); }
  };

  const processPayment = async (id) => {
    try {
      await financeService.processExpensePayment(id, { paymentMethodId: 1, referenceNumber: `PAY-${Date.now()}` });
      showMessage('success', 'Payment processed');
      fetchData();
      setSelectedExpense(null);
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Payment failed');
    }
  };

  const showMessage = (type, text) => { setMessage({ type, text }); setTimeout(() => setMessage(null), 5000); };

  const statusBadge = (exp) => {
    if (exp.approved_at) return <span className={`${styles.badge} ${styles.approved}`}>Approved</span>;
    if (exp.rejection_reason) return <span className={`${styles.badge} ${styles.rejected}`}>Rejected</span>;
    return <span className={`${styles.badge} ${styles.pending}`}>{exp.approval_tier ? `${exp.approval_tier} Pending` : 'Pending'}</span>;
  };

  const payStatusBadge = (status) => {
    const colors = { unpaid: styles.pending, paid: styles.approved, partial: styles.pending, overdue: styles.rejected };
    return <span className={`${styles.badge} ${colors[status] || styles.pending}`}>{status || 'unpaid'}</span>;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>ERP Expense Management</h1>
          <p className={styles.subtitle}>Multi-tier approval, Ethiopian tax compliance, budget encumbrance</p>
        </div>
        <button className={styles.primaryBtn} onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ New ERP Expense'}</button>
      </div>

      {message && <div className={`${styles.alert} ${styles[message.type]}`}>{message.text}</div>}

      {showForm && (
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>Record New ERP Expense</h2>
          <form onSubmit={handleSubmit} className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Category *</label>
              <select name="categoryId" value={formData.categoryId} onChange={handleInputChange} required>
                <option value="">Select</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Amount (ETB) *</label>
              <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} min="0.01" step="0.01" required />
            </div>
            <div className={styles.formGroup}>
              <label>Date *</label>
              <input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
            </div>
            <div className={styles.formGroup}>
              <label>Payment Method *</label>
              <select name="paymentMethodId" value={formData.paymentMethodId} onChange={handleInputChange} required>
                <option value="">Select</option>
                {paymentMethods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Expense Type</label>
              <select name="expenseType" value={formData.expenseType} onChange={handleInputChange}>
                {EXPENSE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Currency</label>
              <select name="currency" value={formData.currency} onChange={handleInputChange}>
                <option value="ETB">ETB</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Chart of Account</label>
              <select name="coaId" value={formData.coaId} onChange={handleInputChange}>
                <option value="">Select</option>
                {coaAccounts.filter(a => a.account_type === 'expense').map(a => <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Reference #</label>
              <input type="text" name="referenceNumber" value={formData.referenceNumber} onChange={handleInputChange} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.checkLabel}>
                <input type="checkbox" name="isVatRegistered" checked={formData.isVatRegistered === true || formData.isVatRegistered === 'true'} onChange={handleInputChange} />
                VAT Registered
              </label>
            </div>
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label>Description *</label>
              <input type="text" name="description" value={formData.description} onChange={handleInputChange} required minLength="5" maxLength="500" placeholder="Expense description" />
            </div>

            {taxPreview && (
              <div className={`${styles.fullWidth} ${styles.taxPreview}`}>
                <h4>Tax Calculation Preview</h4>
                <div className={styles.taxGrid}>
                  <span>Gross: <strong>{formatCurrency(taxPreview.gross)}</strong></span>
                  <span>VAT ({taxPreview.vatRate}%): <strong>{formatCurrency(taxPreview.vat)}</strong></span>
                  <span>Withholding ({taxPreview.wthRate}%): <strong>-{formatCurrency(taxPreview.withholding)}</strong></span>
                  <span className={styles.netAmount}>Net: <strong>{formatCurrency(taxPreview.net)}</strong></span>
                </div>
              </div>
            )}

            <div className={`${styles.formActions} ${styles.fullWidth}`}>
              <button type="submit" className={styles.submitBtn} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit for Approval'}</button>
            </div>
          </form>
        </div>
      )}

      {selectedExpense && (
        <div className={styles.detailPanel}>
          <div className={styles.detailHeader}>
            <h3>Expense #{selectedExpense.id} Details</h3>
            <button className={styles.closeBtn} onClick={() => setSelectedExpense(null)}>X</button>
          </div>
          <div className={styles.detailGrid}>
            <div><strong>Amount:</strong> {formatCurrency(selectedExpense.amount)}</div>
            <div><strong>Category:</strong> {selectedExpense.category_name}</div>
            <div><strong>Tier:</strong> {selectedExpense.approval_tier || 'N/A'}</div>
            <div><strong>Status:</strong> {statusBadge(selectedExpense)}</div>
            <div><strong>Payment:</strong> {payStatusBadge(selectedExpense.payment_status)}</div>
            <div><strong>Description:</strong> {selectedExpense.description}</div>
            {selectedExpense.vat_amount > 0 && <div><strong>VAT:</strong> {formatCurrency(selectedExpense.vat_amount)}</div>}
            {selectedExpense.withholding_tax > 0 && <div><strong>Withholding:</strong> {formatCurrency(selectedExpense.withholding_tax)}</div>}
            <div><strong>Net Amount:</strong> {formatCurrency(selectedExpense.net_amount || selectedExpense.amount)}</div>
            {selectedExpense.budget_name && <div><strong>Budget:</strong> {selectedExpense.budget_name}</div>}
            {selectedExpense.is_encumbered && <div><strong>Encumbered:</strong> Yes</div>}
          </div>
          {selectedExpense.approvalHistory && selectedExpense.approvalHistory.length > 0 && (
            <div className={styles.approvalTimeline}>
              <h4>Approval Timeline</h4>
              {selectedExpense.approvalHistory.map((step, i) => (
                <div key={i} className={styles.timelineItem}>
                  <span className={`${styles.timelineDot} ${styles[step.status]}`}></span>
                  <div>
                    <strong>{step.tier?.toUpperCase()}</strong> - {step.approver_name || 'Pending'}
                    <div className={styles.timelineStatus}>{step.status} {step.actioned_at ? `on ${formatDate(step.actioned_at)}` : ''}</div>
                    {step.comments && <div className={styles.timelineComment}>"{step.comments}"</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {selectedExpense.approved_at && selectedExpense.payment_status === 'unpaid' && (
            <button className={styles.primaryBtn} onClick={() => processPayment(selectedExpense.id)} style={{ marginTop: 16 }}>Process Payment</button>
          )}
        </div>
      )}

      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loadingState}><div className={styles.spinner}></div><p>Loading...</p></div>
        ) : expenses.length === 0 ? (
          <div className={styles.emptyState}><p>No expenses found.</p></div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th><th>Description</th><th>Category</th><th>Tier</th><th>Status</th><th>Payment</th><th>Tax</th><th className={styles.amountCol}>Amount</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(exp => (
                  <tr key={exp.id}>
                    <td>{formatDate(exp.date)}</td>
                    <td className={styles.boldText}>{exp.description?.substring(0, 50)}</td>
                    <td>{exp.category_name}</td>
                    <td><span className={`${styles.tierBadge} ${styles[exp.approval_tier]}`}>{exp.approval_tier || '-'}</span></td>
                    <td>{statusBadge(exp)}</td>
                    <td>{payStatusBadge(exp.payment_status)}</td>
                    <td>{exp.tax_amount > 0 ? formatCurrency(exp.tax_amount) : '-'}</td>
                    <td className={styles.amountCol}>{formatCurrency(exp.amount)}</td>
                    <td><button className={styles.viewBtn} onClick={() => viewDetails(exp.id)}>View</button></td>
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

export default EnhancedExpenseManagement;
