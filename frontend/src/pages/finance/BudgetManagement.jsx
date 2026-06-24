import React, { useState, useEffect } from 'react';
import financeService from '../../services/financeService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './BudgetManagement.module.css';

const BudgetManagement = () => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({ name: '', periodType: 'monthly', startDate: '', endDate: '', notes: '' });
  const [itemForm, setItemForm] = useState({ categoryId: '', allocatedAmount: '' });
  const [categories, setCategories] = useState([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [budgetRes, catRes] = await Promise.all([
        financeService.getBudgets({ limit: 50 }),
        financeService.getExpenseCategories().catch(() => ({ data: { data: [] } }))
      ]);
      setBudgets(budgetRes?.data?.data?.budgets || []);
      setCategories(catRes?.data?.data?.categories || catRes?.data?.data || []);
    } catch (error) { showMessage('error', 'Failed to load budgets'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await financeService.createBudget(formData);
      showMessage('success', 'Budget created');
      setShowForm(false);
      setFormData({ name: '', periodType: 'monthly', startDate: '', endDate: '', notes: '' });
      fetchData();
    } catch (error) { showMessage('error', error.response?.data?.message || 'Failed to create budget'); }
  };

  const handleApprove = async (id) => {
    try {
      await financeService.approveBudget(id);
      showMessage('success', 'Budget approved');
      fetchData();
      setSelectedBudget(null);
    } catch (error) { showMessage('error', error.response?.data?.message || 'Failed to approve'); }
  };

  const viewBudget = async (id) => {
    try {
      const res = await financeService.getBudgetById(id);
      setSelectedBudget(res?.data?.data?.budget);
      setItemForm({ categoryId: '', allocatedAmount: '' });
    } catch (error) { showMessage('error', 'Failed to load budget'); }
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!selectedBudget) return;
    try {
      await financeService.addBudgetItem(selectedBudget.id, {
        categoryId: parseInt(itemForm.categoryId),
        allocatedAmount: parseFloat(itemForm.allocatedAmount)
      });
      showMessage('success', 'Budget item added');
      viewBudget(selectedBudget.id);
      setItemForm({ categoryId: '', allocatedAmount: '' });
    } catch (error) { showMessage('error', error.response?.data?.message || 'Failed to add item'); }
  };

  const showMessage = (type, text) => { setMessage({ type, text }); setTimeout(() => setMessage(null), 5000); };

  const statusBadge = (status) => {
    const colors = { draft: '#f59e0b', active: '#10b981', frozen: '#3b82f6', closed: '#64748b' };
    return <span className={styles.statusBadge} style={{ background: colors[status] + '20', color: colors[status] }}>{status}</span>;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Budget Management</h1>
          <p className={styles.subtitle}>Plan, approve, and track budget utilization with encumbrance accounting</p>
        </div>
        <button className={styles.primaryBtn} onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ New Budget'}</button>
      </div>
      {message && <div className={`${styles.alert} ${styles[message.type]}`}>{message.text}</div>}

      {showForm && (
        <div className={styles.formCard}>
          <h3>Create Budget Period</h3>
          <form onSubmit={handleCreate} className={styles.formGrid}>
            <div className={styles.formGroup}><label>Name *</label><input name="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
            <div className={styles.formGroup}><label>Type *</label><select value={formData.periodType} onChange={e => setFormData({...formData, periodType: e.target.value})}><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="yearly">Yearly</option><option value="custom">Custom</option></select></div>
            <div className={styles.formGroup}><label>Start Date *</label><input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} required /></div>
            <div className={styles.formGroup}><label>End Date *</label><input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} required /></div>
            <div className={`${styles.formGroup} ${styles.fullWidth}`}><label>Notes</label><input value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
            <div className={`${styles.formActions} ${styles.fullWidth}`}><button type="submit" className={styles.submitBtn}>Create Budget</button></div>
          </form>
        </div>
      )}

      {selectedBudget && (
        <div className={styles.detailPanel}>
          <div className={styles.detailHeader}>
            <h3>{selectedBudget.name} <span className={styles.periodBadge}>{selectedBudget.period_type}</span></h3>
            <button className={styles.closeBtn} onClick={() => setSelectedBudget(null)}>X</button>
          </div>
          <div className={styles.detailGrid}>
            <div>Total: {formatCurrency(selectedBudget.total_budget)}</div>
            <div>Encumbered: {formatCurrency(selectedBudget.total_encumbered)}</div>
            <div>Spent: {formatCurrency(selectedBudget.total_spent)}</div>
            <div>Remaining: {formatCurrency(selectedBudget.total_budget - selectedBudget.total_encumbered - selectedBudget.total_spent)}</div>
            <div>Period: {formatDate(selectedBudget.start_date)} - {formatDate(selectedBudget.end_date)}</div>
            <div>Status: {statusBadge(selectedBudget.status)}</div>
          </div>
          {selectedBudget.status === 'draft' && <button className={styles.primaryBtn} onClick={() => handleApprove(selectedBudget.id)} style={{ marginTop: 12 }}>Approve & Activate</button>}

          {selectedBudget.items && selectedBudget.items.length > 0 && (
            <div className={styles.itemSection}>
              <h4>Budget Items</h4>
              <table className={styles.table}>
                <thead><tr><th>Category</th><th>COA</th><th>Allocated</th><th>Encumbered</th><th>Spent</th><th>Remaining</th></tr></thead>
                <tbody>
                  {selectedBudget.items.map((item, i) => (
                    <tr key={i}>
                      <td>{item.category_name || '-'}</td>
                      <td>{item.account_code || '-'}</td>
                      <td>{formatCurrency(item.allocated_amount)}</td>
                      <td>{formatCurrency(item.encumbered_amount)}</td>
                      <td>{formatCurrency(item.spent_amount)}</td>
                      <td>{formatCurrency(item.remaining_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedBudget.status === 'draft' && (
            <form onSubmit={addItem} className={styles.addItemForm}>
              <h4>Add Budget Item</h4>
              <div className={styles.formRow}>
                <select value={itemForm.categoryId} onChange={e => setItemForm({...itemForm, categoryId: e.target.value})} required>
                  <option value="">Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input type="number" placeholder="Allocated Amount" value={itemForm.allocatedAmount} onChange={e => setItemForm({...itemForm, allocatedAmount: e.target.value})} min="0.01" step="0.01" required />
                <button type="submit" className={styles.primaryBtn}>Add</button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loadingState}><div className={styles.spinner}></div></div>
        ) : budgets.length === 0 ? (
          <div className={styles.emptyState}><p>No budgets found</p></div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead><tr><th>Name</th><th>Type</th><th>Period</th><th>Total</th><th>Encumbered</th><th>Spent</th><th>Remaining</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {budgets.map(b => (
                  <tr key={b.id}>
                    <td className={styles.boldText}>{b.name}</td>
                    <td>{b.period_type}</td>
                    <td>{formatDate(b.start_date)} - {formatDate(b.end_date)}</td>
                    <td>{formatCurrency(b.total_budget)}</td>
                    <td>{formatCurrency(b.total_encumbered)}</td>
                    <td>{formatCurrency(b.total_spent)}</td>
                    <td>{formatCurrency(b.total_budget - b.total_encumbered - b.total_spent)}</td>
                    <td>{statusBadge(b.status)}</td>
                    <td><button className={styles.viewBtn} onClick={() => viewBudget(b.id)}>View</button></td>
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

export default BudgetManagement;
