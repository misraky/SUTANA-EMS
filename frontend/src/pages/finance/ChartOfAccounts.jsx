import React, { useState, useEffect } from 'react';
import financeService from '../../services/financeService';
import styles from './ChartOfAccounts.module.css';

const ACCOUNT_TYPES = ['asset', 'liability', 'equity', 'revenue', 'expense'];

const ChartOfAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({ accountCode: '', accountName: '', accountType: 'expense', accountClass: '', description: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await financeService.getCOA();
      setAccounts(res?.data?.data?.accounts || []);
    } catch (error) { showMessage('error', 'Failed to load COA'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await financeService.createCOAAccount(formData);
      showMessage('success', 'Account created');
      setShowForm(false);
      setFormData({ accountCode: '', accountName: '', accountType: 'expense', accountClass: '', description: '' });
      fetchData();
    } catch (error) { showMessage('error', error.response?.data?.message || 'Failed to create account'); }
  };

  const handleToggleActive = async (id, currentActive) => {
    try {
      await financeService.updateCOAAccount(id, { isActive: !currentActive });
      showMessage('success', `Account ${currentActive ? 'deactivated' : 'activated'}`);
      fetchData();
    } catch (error) { showMessage('error', 'Failed to update account'); }
  };

  const showMessage = (type, text) => { setMessage({ type, text }); setTimeout(() => setMessage(null), 5000); };

  const typeColors = { asset: '#2563eb', liability: '#dc2626', equity: '#059669', revenue: '#7c3aed', expense: '#d97706' };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Chart of Accounts</h1>
          <p className={styles.subtitle}>Structured chart of accounts for expense classification</p>
        </div>
        <button className={styles.primaryBtn} onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ New Account'}</button>
      </div>
      {message && <div className={`${styles.alert} ${styles[message.type]}`}>{message.text}</div>}

      {showForm && (
        <div className={styles.formCard}>
          <h3>Create COA Account</h3>
          <form onSubmit={handleCreate} className={styles.formGrid}>
            <div className={styles.formGroup}><label>Account Code *</label><input value={formData.accountCode} onChange={e => setFormData({...formData, accountCode: e.target.value})} placeholder="e.g., 5001" required /></div>
            <div className={styles.formGroup}><label>Account Name *</label><input value={formData.accountName} onChange={e => setFormData({...formData, accountName: e.target.value})} required /></div>
            <div className={styles.formGroup}><label>Type *</label><select value={formData.accountType} onChange={e => setFormData({...formData, accountType: e.target.value})}>{ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}</select></div>
            <div className={styles.formGroup}><label>Class</label><input value={formData.accountClass} onChange={e => setFormData({...formData, accountClass: e.target.value})} placeholder="e.g., Current Asset" /></div>
            <div className={`${styles.formGroup} ${styles.fullWidth}`}><label>Description</label><input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
            <div className={`${styles.formActions} ${styles.fullWidth}`}><button type="submit" className={styles.submitBtn}>Create Account</button></div>
          </form>
        </div>
      )}

      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loadingState}><div className={styles.spinner}></div></div>
        ) : accounts.length === 0 ? (
          <div className={styles.emptyState}><p>No accounts defined</p></div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead><tr><th>Code</th><th>Name</th><th>Type</th><th>Class</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {accounts.filter(a => !a.parent_id).map(acct => (
                  <React.Fragment key={acct.id}>
                    <tr>
                      <td className={styles.codeText}>{acct.account_code}</td>
                      <td className={styles.boldText}>{acct.account_name}</td>
                      <td><span className={styles.typeBadge} style={{ background: typeColors[acct.account_type] + '20', color: typeColors[acct.account_type] }}>{acct.account_type}</span></td>
                      <td>{acct.account_class || '-'}</td>
                      <td><span className={acct.is_active ? styles.activeBadge : styles.inactiveBadge}>{acct.is_active ? 'Active' : 'Inactive'}</span></td>
                      <td><button className={styles.actionBtn} onClick={() => handleToggleActive(acct.id, acct.is_active)}>{acct.is_active ? 'Deactivate' : 'Activate'}</button></td>
                    </tr>
                    {accounts.filter(c => c.parent_id === acct.id).map(child => (
                      <tr key={child.id} className={styles.childRow}>
                        <td className={styles.codeText}>{child.account_code}</td>
                        <td className={styles.boldText}>-- {child.account_name}</td>
                        <td><span className={styles.typeBadge} style={{ background: typeColors[child.account_type] + '20', color: typeColors[child.account_type] }}>{child.account_type}</span></td>
                        <td>{child.account_class || '-'}</td>
                        <td><span className={child.is_active ? styles.activeBadge : styles.inactiveBadge}>{child.is_active ? 'Active' : 'Inactive'}</span></td>
                        <td><button className={styles.actionBtn} onClick={() => handleToggleActive(child.id, child.is_active)}>{child.is_active ? 'Deactivate' : 'Activate'}</button></td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartOfAccounts;
