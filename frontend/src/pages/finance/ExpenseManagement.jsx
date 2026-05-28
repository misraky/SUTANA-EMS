import React, { useState, useEffect } from 'react';
import financeService from '../../services/financeService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './ExpenseManagement.module.css';
const ExpenseManagement = () => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    paymentMethodId: '',
    referenceNumber: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  useEffect(() => {
    fetchData();
  }, []);
  const fetchData = async () => {
    setLoading(true);
    try {
      const [expRes, catRes, payRes] = await Promise.all([
        financeService.getExpenses({ limit: 50 }),
        financeService.getExpenseCategories().catch(() => ({ data: { data: [] } })),
        financeService.getPaymentMethods().catch(() => ({ data: { data: [] } }))
      ]);
      setExpenses(expRes?.data?.data?.expenses || []);
      setCategories(catRes?.data?.data || [
        { id: 1, name: 'Office Supplies' }, { id: 2, name: 'Travel' }, { id: 3, name: 'Logistics' }
      ]);
      setPaymentMethods(payRes?.data?.data || [
        { id: 1, name: 'Bank Transfer' }, { id: 2, name: 'Cash' }, { id: 3, name: 'Corporate Card' }
      ]);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
      showMessage('error', 'Failed to load expense data.');
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
        ...formData,
        categoryId: parseInt(formData.categoryId, 10),
        amount: parseFloat(formData.amount),
        paymentMethodId: parseInt(formData.paymentMethodId, 10)
      };
      await financeService.createExpense(payload);
      showMessage('success', 'Expense recorded successfully.');
      setShowForm(false);
      setFormData({
        categoryId: '', amount: '', date: new Date().toISOString().split('T')[0],
        description: '', paymentMethodId: '', referenceNumber: ''
      });
      fetchData(); // Refresh list
    } catch (error) {
      console.error('Failed to create expense:', error);
      showMessage('error', error.response?.data?.message || 'Failed to record expense.');
    } finally {
      setSubmitting(false);
    }
  };
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };
  const getCategoryName = (id) => {
    const cat = categories.find(c => c.id === id);
    return cat ? cat.name : 'Unknown';
  };
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Expense Management</h1>
          <p className={styles.subtitle}>Track and record company expenditures</p>
        </div>
        <button 
          className={styles.primaryBtn} 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Record Expense'}
        </button>
      </div>
      {message && (
        <div className={`${styles.alert} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}
      {showForm && (
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>Record New Expense</h2>
          <form onSubmit={handleSubmit} className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Category</label>
              <select name="categoryId" value={formData.categoryId} onChange={handleInputChange} required>
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
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
              <label>Date</label>
              <input 
                type="date" name="date" value={formData.date} 
                onChange={handleInputChange} required 
              />
            </div>
            <div className={styles.formGroup}>
              <label>Payment Method</label>
              <select name="paymentMethodId" value={formData.paymentMethodId} onChange={handleInputChange} required>
                <option value="">Select Method</option>
                {paymentMethods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Reference Number (Optional)</label>
              <input 
                type="text" name="referenceNumber" value={formData.referenceNumber} 
                onChange={handleInputChange} placeholder="Receipt or Invoice #"
              />
            </div>
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label>Description</label>
              <input 
                type="text" name="description" value={formData.description} 
                onChange={handleInputChange} required minLength="5" maxLength="500"
                placeholder="Brief description of the expense"
              />
            </div>
            <div className={`${styles.formActions} ${styles.fullWidth}`}>
              <button type="submit" className={styles.submitBtn} disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Expense'}
              </button>
            </div>
          </form>
        </div>
      )}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading expenses...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No expenses found.</p>
          </div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Reference</th>
                  <th>Status</th>
                  <th className={styles.amountCol}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{formatDate(expense.date)}</td>
                    <td className={styles.boldText}>{expense.description}</td>
                    <td>{expense.Category?.name || getCategoryName(expense.categoryId)}</td>
                    <td>{expense.referenceNumber || '-'}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[(expense.status || 'pending').toLowerCase()]}`}>
                        {expense.status || 'Pending'}
                      </span>
                    </td>
                    <td className={styles.amountCol}>{formatCurrency(expense.amount)}</td>
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
export default ExpenseManagement;
