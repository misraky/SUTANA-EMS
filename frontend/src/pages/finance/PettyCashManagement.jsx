import React, { useState, useEffect } from 'react';
import financeService from '../../services/financeService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './PettyCashManagement.module.css';

const PettyCashManagement = () => {
  const [funds, setFunds] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedFund, setSelectedFund] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({ fundName: '', imprestAmount: '', custodianId: '' });
  const [disburseForm, setDisburseForm] = useState({ amount: '', description: '' });
  const [users, setUsers] = useState([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fundRes, sumRes] = await Promise.all([
        financeService.getPettyCashFunds({ status: 'active' }),
        financeService.getPettyCashSummary().catch(() => ({ data: { data: {} } }))
      ]);
      setFunds(fundRes?.data?.data?.funds || []);
      setSummary(sumRes?.data?.data);
    } catch (error) { showMessage('error', 'Failed to load petty cash data'); }
    finally { setLoading(false); }
  };

  const createFund = async (e) => {
    e.preventDefault();
    try {
      await financeService.createPettyCashFund({ ...formData, imprestAmount: parseFloat(formData.imprestAmount), custodianId: parseInt(formData.custodianId) });
      showMessage('success', 'Petty cash fund created');
      setShowForm(false);
      setFormData({ fundName: '', imprestAmount: '', custodianId: '' });
      fetchData();
    } catch (error) { showMessage('error', error.response?.data?.message || 'Failed to create fund'); }
  };

  const viewFund = async (id) => {
    try {
      const [fundRes, txRes] = await Promise.all([
        financeService.getPettyCashFundById(id),
        financeService.getPettyCashTransactions(id, { limit: 100 })
      ]);
      setSelectedFund(fundRes?.data?.data?.fund);
      setTransactions(txRes?.data?.data?.data || []);
      setDisburseForm({ amount: '', description: '' });
    } catch (error) { showMessage('error', 'Failed to load fund'); }
  };

  const disburse = async (e) => {
    e.preventDefault();
    if (!selectedFund) return;
    try {
      await financeService.disbursePettyCash(selectedFund.id, { amount: parseFloat(disburseForm.amount), description: disburseForm.description });
      showMessage('success', 'Disbursement recorded');
      viewFund(selectedFund.id);
      setDisburseForm({ amount: '', description: '' });
      fetchData();
    } catch (error) { showMessage('error', error.response?.data?.message || 'Disbursement failed'); }
  };

  const replenish = async () => {
    if (!selectedFund) return;
    const topUp = selectedFund.imprest_amount - selectedFund.current_balance;
    if (topUp <= 0) { showMessage('error', 'Fund is at full imprest level'); return; }
    try {
      await financeService.replenishPettyCash(selectedFund.id, { amount: topUp });
      showMessage('success', `Fund replenished with ${formatCurrency(topUp)}`);
      viewFund(selectedFund.id);
      fetchData();
    } catch (error) { showMessage('error', error.response?.data?.message || 'Replenishment failed'); }
  };

  const reconcile = async () => {
    if (!selectedFund) return;
    const val = prompt('Enter actual cash count:');
    if (!val) return;
    try {
      await financeService.reconcilePettyCash(selectedFund.id, { actualBalance: parseFloat(val), notes: 'Manual reconciliation' });
      showMessage('success', 'Fund reconciled');
      viewFund(selectedFund.id);
      fetchData();
    } catch (error) { showMessage('error', error.response?.data?.message || 'Reconciliation failed'); }
  };

  const showMessage = (type, text) => { setMessage({ type, text }); setTimeout(() => setMessage(null), 5000); };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Petty Cash Management</h1>
          <p className={styles.subtitle}>Imprest-based petty cash funds with disbursement tracking</p>
        </div>
        <button className={styles.primaryBtn} onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ New Fund'}</button>
      </div>
      {message && <div className={`${styles.alert} ${styles[message.type]}`}>{message.text}</div>}

      {summary && (
        <div className={styles.summaryBar}>
          <div className={styles.summaryItem}><span className={styles.summaryLabel}>Funds</span><span className={styles.summaryValue}>{summary.totalFunds}</span></div>
          <div className={styles.summaryItem}><span className={styles.summaryLabel}>Total Imprest</span><span className={styles.summaryValue}>{formatCurrency(summary.totalImprest)}</span></div>
          <div className={styles.summaryItem}><span className={styles.summaryLabel}>Current Balance</span><span className={styles.summaryValue}>{formatCurrency(summary.totalBalance)}</span></div>
          <div className={styles.summaryItem}><span className={styles.summaryLabel}>Outstanding</span><span className={styles.summaryValue}>{formatCurrency(summary.outstandingAmount)}</span></div>
          <div className={styles.summaryItem}><span className={styles.summaryLabel}>Pending Txns</span><span className={styles.summaryValue}>{summary.pendingTransactions}</span></div>
        </div>
      )}

      {showForm && (
        <div className={styles.formCard}>
          <h3>Create Petty Cash Fund</h3>
          <form onSubmit={createFund} className={styles.formGrid}>
            <div className={styles.formGroup}><label>Fund Name *</label><input value={formData.fundName} onChange={e => setFormData({...formData, fundName: e.target.value})} required /></div>
            <div className={styles.formGroup}><label>Imprest Amount (ETB) *</label><input type="number" value={formData.imprestAmount} onChange={e => setFormData({...formData, imprestAmount: e.target.value})} min="0.01" step="0.01" required /></div>
            <div className={`${styles.formActions} ${styles.fullWidth}`}><button type="submit" className={styles.submitBtn}>Create Fund</button></div>
          </form>
        </div>
      )}

      {selectedFund && (
        <div className={styles.detailPanel}>
          <div className={styles.detailHeader}>
            <h3>{selectedFund.fund_name}</h3>
            <div className={styles.detailActions}>
              <button className={styles.actionBtn} onClick={replenish}>Replenish</button>
              <button className={styles.actionBtn} onClick={reconcile}>Reconcile</button>
              <button className={styles.closeBtn} onClick={() => setSelectedFund(null)}>X</button>
            </div>
          </div>
          <div className={styles.detailGrid}>
            <div><strong>Imprest:</strong> {formatCurrency(selectedFund.imprest_amount)}</div>
            <div><strong>Balance:</strong> {formatCurrency(selectedFund.current_balance)}</div>
            <div><strong>Max/Txn:</strong> {formatCurrency(selectedFund.max_per_transaction)}</div>
            <div><strong>Custodian:</strong> {selectedFund.custodian_name || 'N/A'}</div>
            <div><strong>Status:</strong> {selectedFund.status}</div>
          </div>

          <form onSubmit={disburse} className={styles.disburseForm}>
            <h4>Disburse</h4>
            <div className={styles.formRow}>
              <input type="number" placeholder="Amount" value={disburseForm.amount} onChange={e => setDisburseForm({...disburseForm, amount: e.target.value})} min="0.01" step="0.01" required />
              <input type="text" placeholder="Description" value={disburseForm.description} onChange={e => setDisburseForm({...disburseForm, description: e.target.value})} required minLength="5" />
              <button type="submit" className={styles.primaryBtn}>Disburse</button>
            </div>
          </form>

          <div className={styles.txSection}>
            <h4>Transactions ({transactions.length})</h4>
            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Description</th><th>Status</th></tr></thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id}>
                      <td>{formatDate(tx.created_at)}</td>
                      <td><span className={`${styles.txType} ${styles[tx.type]}`}>{tx.type}</span></td>
                      <td>{formatCurrency(tx.amount)}</td>
                      <td>{tx.description}</td>
                      <td>{tx.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loadingState}><div className={styles.spinner}></div></div>
        ) : funds.length === 0 ? (
          <div className={styles.emptyState}><p>No petty cash funds</p></div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead><tr><th>Fund Name</th><th>Custodian</th><th>Imprest</th><th>Balance</th><th>Max/Txn</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {funds.map(f => (
                  <tr key={f.id}>
                    <td className={styles.boldText}>{f.fund_name}</td>
                    <td>{f.custodian_name || '-'}</td>
                    <td>{formatCurrency(f.imprest_amount)}</td>
                    <td>{formatCurrency(f.current_balance)}</td>
                    <td>{formatCurrency(f.max_per_transaction)}</td>
                    <td>{f.status}</td>
                    <td><button className={styles.viewBtn} onClick={() => viewFund(f.id)}>Manage</button></td>
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

export default PettyCashManagement;
