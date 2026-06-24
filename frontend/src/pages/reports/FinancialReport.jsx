import React, { useState, useEffect } from 'react';
import reportService from '../../services/reportService';
import financeService from '../../services/financeService';
import { formatCurrency } from '../../utils/formatters';
import styles from './FinancialReport.module.css';

const TABS = [
  { key: 'pnl', label: 'Profit & Loss' },
  { key: 'balance-sheet', label: 'Balance Sheet' },
  { key: 'bank-reconciliation', label: 'Bank Reconciliation' }
];

const FinancialReport = () => {
  const [activeTab, setActiveTab] = useState('pnl');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  const [filters, setFilters] = useState({
    startDate: firstDay,
    endDate: lastDay,
    asOfDate: today.toISOString().split('T')[0],
    bankCode: ''
  });
  const [showTxForm, setShowTxForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitForm, setSubmitForm] = useState({ period: '', financialYear: '', title: '', notes: '' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [txForm, setTxForm] = useState({
    bankCode: 'CBE',
    amount: '',
    transactionDate: today.toISOString().split('T')[0],
    reference: '',
    description: '',
    customerName: ''
  });

  useEffect(() => {
    fetchReport();
  }, [activeTab]);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      let res;
      switch (activeTab) {
        case 'pnl':
          res = await reportService.getProfitAndLoss({ startDate: filters.startDate, endDate: filters.endDate });
          break;
        case 'balance-sheet':
          res = await reportService.getBalanceSheet({ asOfDate: filters.asOfDate });
          break;
        case 'bank-reconciliation':
          res = await reportService.getBankReconciliation({ asOfDate: filters.asOfDate, bankCode: filters.bankCode || undefined });
          break;
      }
      setData(res.data);
    } catch (err) {
      console.error('Failed to load report', err);
      setError(err.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    fetchReport();
  };

  const handleTxInputChange = (e) => {
    const { name, value } = e.target;
    setTxForm(prev => ({ ...prev, [name]: value }));
  };

  const handleRecordTransaction = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await financeService.createBankTransaction({
        ...txForm,
        amount: parseFloat(txForm.amount)
      });
      setShowTxForm(false);
      setTxForm({ bankCode: 'CBE', amount: '', transactionDate: today.toISOString().split('T')[0], reference: '', description: '', customerName: '' });
      fetchReport();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForApproval = async (e) => {
    e.preventDefault();
    const period = submitForm.period || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    try {
      setSubmitLoading(true);
      const reportTypeMap = { pnl: 'income_statement', 'balance-sheet': 'balance_sheet', 'bank-reconciliation': 'bank_reconciliation' };
      await financeService.createReportSubmission({
        reportType: reportTypeMap[activeTab],
        period,
        financialYear: submitForm.financialYear || undefined,
        title: submitForm.title || undefined,
        notes: submitForm.notes || undefined
      });
      setShowSubmitModal(false);
      setSubmitForm({ period: '', financialYear: '', title: '', notes: '' });
      alert('Report draft created! Go to Report Approvals to submit it for CEO approval.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create submission');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const res = await reportService.exportReport(activeTab, {
        ...filters,
        format: 'pdf'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeTab}_${filters.startDate || filters.asOfDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  const renderFilters = () => {
    switch (activeTab) {
      case 'pnl':
        return (
          <>
            <div className={styles.formGroup}>
              <label>Start Date</label>
              <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className={styles.input} required />
            </div>
            <div className={styles.formGroup}>
              <label>End Date</label>
              <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className={styles.input} required />
            </div>
          </>
        );
      case 'balance-sheet':
        return (
          <div className={styles.formGroup}>
            <label>As of Date</label>
            <input type="date" name="asOfDate" value={filters.asOfDate} onChange={handleFilterChange} className={styles.input} required />
          </div>
        );
      case 'bank-reconciliation':
        return (
          <>
            <div className={styles.formGroup}>
              <label>As of Date</label>
              <input type="date" name="asOfDate" value={filters.asOfDate} onChange={handleFilterChange} className={styles.input} required />
            </div>
            <div className={styles.formGroup}>
              <label>Bank</label>
              <select name="bankCode" value={filters.bankCode} onChange={handleFilterChange} className={styles.input}>
                <option value="">All Banks</option>
                <option value="CBE">Commercial Bank of Ethiopia</option>
                <option value="DASHEN">Dashen Bank</option>
                <option value="AWASH">Awash Bank</option>
                <option value="TELEBIRR">Telebirr</option>
              </select>
            </div>
          </>
        );
    }
  };

  const renderReport = () => {
    if (!data) return null;
    switch (activeTab) {
      case 'pnl':
        return renderPnL();
      case 'balance-sheet':
        return renderBalanceSheet();
      case 'bank-reconciliation':
        return renderBankReconciliation();
    }
  };

  const renderPnL = () => (
    <div className={styles.pnlCard}>
      <div className={styles.pnlHeader}>
        <h2>Statement for Period: {filters.startDate} to {filters.endDate}</h2>
      </div>
      <div className={styles.pnlBody}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Revenue</h3>
          <div className={styles.lineItem}>
            <span>Sales Revenue (POS)</span>
            <span>{formatCurrency(data.revenue?.sales || 0)}</span>
          </div>
          <div className={styles.lineItem}>
            <span>Printing Revenue</span>
            <span>{formatCurrency(data.revenue?.printing || 0)}</span>
          </div>
          <div className={styles.subtotalRow}>
            <span>Total Revenue</span>
            <span>{formatCurrency(data.revenue?.total || 0)}</span>
          </div>
        </div>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Cost of Goods & Expenses</h3>
          <div className={styles.lineItem}>
            <span>Cost of Goods Sold (COGS)</span>
            <span>{formatCurrency(data.costOfGoodsSold || 0)}</span>
          </div>
          <div className={styles.lineItem}>
            <span>Operating Expenses</span>
            <span>{formatCurrency(data.operatingExpenses || 0)}</span>
          </div>
          <div className={styles.subtotalRow}>
            <span>Total Expenses</span>
            <span>{formatCurrency((data.costOfGoodsSold || 0) + Number(data.operatingExpenses || 0))}</span>
          </div>
        </div>
        <div className={styles.netProfitSection}>
          <span>Net Profit / Loss</span>
          <span className={data.netProfit >= 0 ? styles.positive : styles.negative}>
            {formatCurrency(data.netProfit)}
          </span>
        </div>
      </div>
    </div>
  );

  const renderBalanceSheet = () => (
    <div className={styles.pnlCard}>
      <div className={styles.pnlHeader}>
        <h2>Balance Sheet as of {data.asOfDate}</h2>
      </div>
      <div className={styles.pnlBody}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Assets</h3>
          <div className={styles.lineItem}>
            <span>Cash</span>
            <span>{formatCurrency(data.assets?.cash || 0)}</span>
          </div>
          <div className={styles.lineItem}>
            <span>Accounts Receivable</span>
            <span>{formatCurrency(data.assets?.accountsReceivable || 0)}</span>
          </div>
          <div className={styles.lineItem}>
            <span>Inventory</span>
            <span>{formatCurrency(data.assets?.inventory || 0)}</span>
          </div>
          <div className={styles.subtotalRow}>
            <span>Total Assets</span>
            <span>{formatCurrency(data.assets?.total || 0)}</span>
          </div>
        </div>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Liabilities</h3>
          <div className={styles.lineItem}>
            <span>Accounts Payable</span>
            <span>{formatCurrency(data.liabilities?.accountsPayable || 0)}</span>
          </div>
          <div className={styles.subtotalRow}>
            <span>Total Liabilities</span>
            <span>{formatCurrency(data.liabilities?.total || 0)}</span>
          </div>
        </div>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Equity</h3>
          <div className={styles.lineItem}>
            <span>Retained Earnings</span>
            <span>{formatCurrency(data.equity?.retainedEarnings || 0)}</span>
          </div>
          <div className={styles.subtotalRow}>
            <span>Total Equity</span>
            <span>{formatCurrency(data.equity?.total || 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBankReconciliation = () => (
    <div className={styles.pnlCard}>
      <div className={styles.pnlHeader}>
        <h2>Bank Reconciliation as of {data.asOfDate}</h2>
      </div>
      <div className={styles.pnlBody}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Summary</h3>
          <div className={styles.lineItem}>
            <span>Total Payments</span>
            <span>{data.summary?.totalPayments || 0}</span>
          </div>
          <div className={styles.lineItem}>
            <span>Total Amount</span>
            <span>{formatCurrency(data.summary?.totalAmount || 0)}</span>
          </div>
          <div className={styles.lineItem}>
            <span>Settled</span>
            <span className={styles.positive}>{formatCurrency(data.summary?.settledAmount || 0)}</span>
          </div>
          <div className={styles.lineItem}>
            <span>Outstanding</span>
            <span className={styles.negative}>{formatCurrency(data.summary?.outstandingAmount || 0)}</span>
          </div>
          <div className={styles.lineItem}>
            <span>Failed</span>
            <span className={styles.negative}>{formatCurrency(data.summary?.failedAmount || 0)}</span>
          </div>
        </div>

        {data.byBank?.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>By Bank</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Bank</th>
                  <th>Count</th>
                  <th>Total</th>
                  <th>Settled</th>
                  <th>Outstanding</th>
                  <th>Failed</th>
                </tr>
              </thead>
              <tbody>
                {data.byBank.map((bank, i) => (
                  <tr key={i}>
                    <td>{bank.bank_code}</td>
                    <td>{bank.total_count}</td>
                    <td>{formatCurrency(bank.total_amount)}</td>
                    <td>{formatCurrency(bank.settled_amount)}</td>
                    <td>{formatCurrency(bank.outstanding_amount)}</td>
                    <td>{formatCurrency(bank.failed_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data.recentPayments?.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Recent Transactions</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Bank</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentPayments.map((p, i) => (
                  <tr key={i}>
                    <td>{p.reference}</td>
                    <td>{p.bank_code}</td>
                    <td>{formatCurrency(p.amount)}</td>
                    <td>{p.status}</td>
                    <td>{new Date(p.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className={styles.header}>
        <h1 className={styles.title}>
          {TABS.find(t => t.key === activeTab)?.label}
        </h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {activeTab === 'bank-reconciliation' && (
            <button className={styles.btnSecondary} onClick={() => setShowTxForm(!showTxForm)}>
              {showTxForm ? 'Cancel' : '+ Record Transaction'}
            </button>
          )}
          <button 
            className={styles.btnExport} 
            onClick={handleExportPDF}
            disabled={exporting || !data}
          >
            {exporting ? 'Generating PDF...' : 'Export PDF'}
          </button>
          {['pnl', 'balance-sheet', 'bank-reconciliation'].includes(activeTab) && (
            <button className={styles.btnPrimary} onClick={() => setShowSubmitModal(true)} disabled={!data}>
              Submit for Approval
            </button>
          )}
        </div>
      </div>

      {showSubmitModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Submit Report for Approval</h3>
            <form onSubmit={handleSubmitForApproval}>
              <div className={styles.formGroup}>
                <label>Period (YYYY-MM) *</label>
                <input type="month" value={submitForm.period} onChange={(e) => setSubmitForm({ ...submitForm, period: e.target.value })} className={styles.input} required />
              </div>
              <div className={styles.formGroup}>
                <label>Financial Year</label>
                <input type="text" value={submitForm.financialYear} onChange={(e) => setSubmitForm({ ...submitForm, financialYear: e.target.value })} placeholder="e.g. 2025-2026" className={styles.input} />
              </div>
              <div className={styles.formGroup}>
                <label>Title</label>
                <input type="text" value={submitForm.title} onChange={(e) => setSubmitForm({ ...submitForm, title: e.target.value })} placeholder="Optional title" className={styles.input} />
              </div>
              <div className={styles.formGroup}>
                <label>Notes</label>
                <textarea value={submitForm.notes} onChange={(e) => setSubmitForm({ ...submitForm, notes: e.target.value })} rows={3} className={styles.textarea} placeholder="Any additional notes" />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className={styles.btnSecondary} onClick={() => setShowSubmitModal(false)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary} disabled={submitLoading}>
                  {submitLoading ? 'Creating...' : 'Create Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className={styles.filterCard}>
        <form onSubmit={handleGenerate} className={styles.filterForm}>
          {renderFilters()}
          <div className={styles.formAction}>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? 'Loading...' : 'Generate Report'}
            </button>
          </div>
        </form>
      </div>
      {activeTab === 'bank-reconciliation' && showTxForm && (
        <div className={styles.txFormCard}>
          <h3 className={styles.txFormTitle}>Record Bank Transaction</h3>
          <form onSubmit={handleRecordTransaction} className={styles.txForm}>
            <div className={styles.txFormRow}>
              <div className={styles.formGroup}>
                <label>Bank *</label>
                <select name="bankCode" value={txForm.bankCode} onChange={handleTxInputChange} className={styles.input} required>
                  <option value="CBE">Commercial Bank of Ethiopia</option>
                  <option value="DASHEN">Dashen Bank</option>
                  <option value="AWASH">Awash Bank</option>
                  <option value="TELEBIRR">Telebirr</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Amount (ETB) *</label>
                <input type="number" name="amount" value={txForm.amount} onChange={handleTxInputChange} className={styles.input} min="0.01" step="0.01" required />
              </div>
              <div className={styles.formGroup}>
                <label>Date *</label>
                <input type="date" name="transactionDate" value={txForm.transactionDate} onChange={handleTxInputChange} className={styles.input} required />
              </div>
            </div>
            <div className={styles.txFormRow}>
              <div className={styles.formGroup}>
                <label>Reference</label>
                <input type="text" name="reference" value={txForm.reference} onChange={handleTxInputChange} className={styles.input} placeholder="Optional ref. number" />
              </div>
              <div className={styles.formGroup}>
                <label>Customer Name</label>
                <input type="text" name="customerName" value={txForm.customerName} onChange={handleTxInputChange} className={styles.input} placeholder="Optional" />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea name="description" value={txForm.description} onChange={handleTxInputChange} className={styles.textarea} rows="2" placeholder="Optional description" />
            </div>
            <div className={styles.formAction}>
              <button type="submit" className={styles.btnPrimary} disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Transaction'}
              </button>
            </div>
          </form>
        </div>
      )}
      {loading ? (
        <div className={styles.loadingState}>Loading report...</div>
      ) : error ? (
        <div className={styles.emptyState}>{error}</div>
      ) : !data ? (
        <div className={styles.emptyState}>No data available for the selected period.</div>
      ) : (
        renderReport()
      )}
    </div>
  );
};

export default FinancialReport;