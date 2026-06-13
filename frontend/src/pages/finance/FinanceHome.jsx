import React, { useState } from 'react';
import {
  TrendingUp, TrendingDown, AlertTriangle, RefreshCw,
  CheckCircle2, XCircle, Clock, DollarSign, FileText,
  Paperclip, RotateCcw, ShieldCheck
} from 'lucide-react';
import styles from './FinanceHome.module.css';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_VERIFICATIONS = [
  {
    id: 'VRF-001',
    orderId: 'RNT-20260611-0001',
    module: 'Rental',
    customer: 'Alemitu Tadesse',
    amount: 17500,
    method: 'Bank Transfer',
    reference: 'RNT-20260611-0001',
    submittedAt: '2026-06-11 13:45',
    proofFile: 'bank_transfer_screenshot.jpg',
    status: 'PENDING',
  },
  {
    id: 'VRF-002',
    orderId: 'PRT-20260611-0003',
    module: 'Printing',
    customer: 'Biruk D.',
    amount: 30000,
    method: 'Telebirr',
    reference: 'PRT-20260611-0003',
    submittedAt: '2026-06-11 09:10',
    proofFile: 'telebirr_confirmation.png',
    status: 'PENDING',
  },
];

const MOCK_REFUNDS = [
  {
    id: 'RF-001',
    orderId: 'RNT-20260610-0002',
    module: 'Rental',
    customer: 'Biruk Desta',
    originalAmount: 17500,
    cancellationFee: 2000,
    refundAmount: 15500,
    reason: 'Customer cancelled within 24 hours',
    originalMethod: 'Bank Transfer',
    status: 'PENDING',
  },
  {
    id: 'RF-002',
    orderId: 'RNT-20260610-0004',
    module: 'Rental',
    customer: 'Sara M.',
    originalAmount: 22000,
    cancellationFee: 0,
    refundAmount: 22000,
    reason: 'Car unavailable — cancelled by manager',
    originalMethod: 'Telebirr',
    status: 'PENDING',
  },
];

const MOCK_TRANSACTIONS = [
  {
    id: 'TX-001', time: '14:30:00', module: 'Pharmacy', type: 'PAYMENT',
    amount: 287.5, method: 'Cash', invoice: 'INV-20260613-0001', status: 'VERIFIED',
  },
  {
    id: 'TX-002', time: '11:15:00', module: 'Rental', type: 'PAYMENT',
    amount: 17500, method: 'Bank Transfer', invoice: 'RNT-20260611-0001', status: 'VERIFIED',
  },
  {
    id: 'TX-003', time: '09:45:00', module: 'Printing', type: 'PAYMENT',
    amount: 30000, method: 'Telebirr', invoice: 'PRT-20260611-0003', status: 'PENDING',
  },
  {
    id: 'TX-004', time: '08:30:00', module: 'Rental', type: 'REFUND',
    amount: -15500, method: 'Bank Transfer', invoice: 'RF-001', status: 'VERIFIED',
  },
  {
    id: 'TX-005', time: '08:30:00', module: 'Rental', type: 'FEE',
    amount: 2000, method: 'Retained', invoice: 'RF-001', status: 'VERIFIED',
  },
];

// ─── Helper Components ────────────────────────────────────────────────────────

const ModuleBadge = ({ module }) => {
  const cls = {
    Pharmacy: styles.modulePharmacy,
    Rental: styles.moduleRental,
    Printing: styles.modulePrinting,
  }[module] || '';
  return <span className={`${styles.moduleBadge} ${cls}`}>{module}</span>;
};

const MethodTag = ({ method }) => {
  const cls = method === 'Bank Transfer' ? styles.methodBank
    : method === 'Telebirr' ? styles.methodTelebirr
    : styles.methodCash;
  return <span className={`${styles.methodTag} ${cls}`}>{method}</span>;
};

// ─── Verification Section ─────────────────────────────────────────────────────

const VerificationSection = ({ items, onUpdate }) => {
  const [expanded, setExpanded] = useState(null);
  const [rejectOpen, setRejectOpen] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = (id) => {
    onUpdate(id, 'APPROVED');
    setExpanded(null);
  };

  const handleReject = (id) => {
    onUpdate(id, 'REJECTED');
    setRejectOpen(null);
    setRejectReason('');
  };

  const pending = items.filter(i => i.status === 'PENDING');

  if (pending.length === 0) {
    return (
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <ShieldCheck size={20} color="#10b981" />
          PAYMENT VERIFICATIONS
          <span className={`${styles.badge} ${styles.badgeWarning}`} style={{ background: '#d1fae5', color: '#065f46' }}>All Clear</span>
        </div>
        <div className={styles.emptyState}>✅ No pending verifications</div>
      </div>
    );
  }

  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <AlertTriangle size={20} color="#f59e0b" />
        PENDING PAYMENT VERIFICATIONS
        <span className={`${styles.badge} ${styles.badgeWarning}`}>{pending.length} pending</span>
      </div>
      <div className={styles.sectionBody}>
        <div style={{
          background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8,
          padding: '10px 16px', fontSize: '0.8rem', color: '#1e40af',
          marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8
        }}>
          <span>ℹ️</span>
          <span>
            <strong>Rental &amp; Printing</strong> require manual verification because customers pay remotely.
            &nbsp;<strong>Pharmacy &amp; Retail walk-in</strong> sales are auto-verified — the cashier sees the payment in person. No upload needed.
          </span>
        </div>
        {pending.map(item => (
          <div className={styles.verifyCard} key={item.id}>
            <div className={styles.verifyCardHeader}>
              <div>
                <p className={styles.verifyCardTitle}>{item.customer}</p>
                <p className={styles.verifyCardSub}>Order: {item.orderId} · Submitted: {item.submittedAt}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className={styles.amountBig}>{item.amount.toLocaleString()} ETB</div>
                <MethodTag method={item.method} />
              </div>
            </div>

            <div className={styles.verifyMeta}>
              <div className={styles.metaItem}>
                <strong>Module</strong>
                <ModuleBadge module={item.module} />
              </div>
              <div className={styles.metaItem}>
                <strong>Reference</strong>
                <span>{item.reference}</span>
              </div>
              <div className={styles.metaItem}>
                <strong>Payment Method</strong>
                <span>{item.method}</span>
              </div>
            </div>

            <div className={styles.proofRow}>
              <Paperclip size={16} color="#64748b" />
              <span style={{ flex: 1, color: '#475569' }}>📎 {item.proofFile}</span>
              <button className={styles.viewProofBtn}>VIEW PROOF</button>
            </div>

            <div className={styles.verifyActions}>
              <button className={styles.btnApprove} onClick={() => handleApprove(item.id)}>
                <CheckCircle2 size={16} /> VERIFY &amp; APPROVE
              </button>
              <button
                className={styles.btnReject}
                onClick={() => setRejectOpen(rejectOpen === item.id ? null : item.id)}
              >
                <XCircle size={16} /> REJECT &amp; ASK AGAIN
              </button>
              <button className={styles.btnSecondary} onClick={() => setExpanded(expanded === item.id ? null : item.id)}>
                Checklist
              </button>
            </div>

            {expanded === item.id && (
              <div style={{ marginTop: 14, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '14px 16px', fontSize: '0.875rem' }}>
                <p style={{ fontWeight: 700, marginBottom: 10, color: '#1e293b' }}>Finance Officer Checklist:</p>
                {[
                  `Amount matches: ${item.amount.toLocaleString()} ETB`,
                  `Reference # matches: ${item.reference}`,
                  'Sender name matches customer name',
                  'Payment date is after order creation',
                  'Money received in correct Sutana account',
                ].map((check, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, color: '#475569' }}>
                    <input type="checkbox" id={`check-${item.id}-${i}`} />
                    <label htmlFor={`check-${item.id}-${i}`}>{check}</label>
                  </div>
                ))}
              </div>
            )}

            {rejectOpen === item.id && (
              <div className={styles.rejectForm}>
                <p style={{ margin: '0 0 10px 0', fontWeight: 700, color: '#991b1b', fontSize: '0.9rem' }}>
                  Rejection Reason (sent to customer):
                </p>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="e.g. Wrong amount transferred. Please pay the correct amount."
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button className={styles.btnReject} onClick={() => handleReject(item.id)}>
                    Send Rejection
                  </button>
                  <button className={styles.btnSecondary} onClick={() => setRejectOpen(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Refund Section ───────────────────────────────────────────────────────────

const RefundSection = ({ items, onUpdate }) => {
  const [expandedForm, setExpandedForm] = useState(null);
  const [method, setMethod] = useState('Cash');
  const [bankFields, setBankFields] = useState({ bank: '', name: '', account: '' });

  const handleProcess = (id) => {
    onUpdate(id, 'APPROVED');
    setExpandedForm(null);
  };

  const pending = items.filter(i => i.status === 'PENDING');

  if (pending.length === 0) {
    return (
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <RotateCcw size={20} color="#10b981" />
          REFUND REQUESTS
          <span className={`${styles.badge} ${styles.badgeWarning}`} style={{ background: '#d1fae5', color: '#065f46' }}>All Clear</span>
        </div>
        <div className={styles.emptyState}>✅ No pending refunds</div>
      </div>
    );
  }

  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <RotateCcw size={20} color="#ef4444" />
        PENDING REFUND REQUESTS
        <span className={`${styles.badge} ${styles.badgeDanger}`}>{pending.length} pending</span>
      </div>
      <div className={styles.sectionBody}>
        {pending.map(item => (
          <div className={styles.refundCard} key={item.id}>
            <div className={styles.refundCardHeader}>
              <div>
                <p className={styles.verifyCardTitle}>Refund #{item.id}</p>
                <p className={styles.verifyCardSub}>Order: {item.orderId} · {item.customer}</p>
              </div>
              <span className={`${styles.statusBadge} ${styles.statusPending}`}>PENDING APPROVAL</span>
            </div>

            <div className={styles.refundDetails}>
              <span><span>Module:</span> <ModuleBadge module={item.module} /></span>
              <span><span>Original Payment:</span> <strong>{item.originalAmount.toLocaleString()} ETB ({item.originalMethod})</strong></span>
              <span><span>Reason:</span> <strong>{item.reason}</strong></span>
              {item.cancellationFee > 0 && (
                <span><span>Cancellation Fee (kept):</span> <strong style={{ color: '#f59e0b' }}>{item.cancellationFee.toLocaleString()} ETB</strong></span>
              )}
              <div className={styles.refundAmountRow}>
                <span>Refund Amount:</span>
                <span>- {item.refundAmount.toLocaleString()} ETB</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className={styles.btnApprove} onClick={() => setExpandedForm(expandedForm === item.id ? null : item.id)}>
                <CheckCircle2 size={16} /> APPROVE REFUND
              </button>
              <button className={styles.btnReject} onClick={() => onUpdate(item.id, 'REJECTED')}>
                <XCircle size={16} /> REJECT
              </button>
              <button className={styles.btnSecondary}>Contact Customer</button>
            </div>

            {expandedForm === item.id && (
              <div className={styles.refundForm}>
                <h4>Process Refund — {item.refundAmount.toLocaleString()} ETB</h4>

                <div className={styles.methodSelector}>
                  {['Cash', 'Bank Transfer', 'Telebirr'].map(m => (
                    <button
                      key={m}
                      className={`${styles.methodOption} ${method === m ? styles.selected : ''}`}
                      onClick={() => setMethod(m)}
                    >
                      {m === 'Cash' ? '💵' : m === 'Bank Transfer' ? '🏦' : '📱'} {m}
                    </button>
                  ))}
                </div>

                {method === 'Cash' && (
                  <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: 12 }}>
                    Customer will come to the finance counter to collect cash. Ensure they sign a receipt.
                  </p>
                )}

                {(method === 'Bank Transfer' || method === 'Telebirr') && (
                  <div className={styles.bankFields}>
                    <input
                      placeholder={method === 'Telebirr' ? 'Telebirr Phone Number' : 'Bank Name'}
                      value={bankFields.bank}
                      onChange={e => setBankFields({ ...bankFields, bank: e.target.value })}
                    />
                    <input
                      placeholder="Account Holder Name"
                      value={bankFields.name}
                      onChange={e => setBankFields({ ...bankFields, name: e.target.value })}
                    />
                    {method === 'Bank Transfer' && (
                      <input
                        placeholder="Account Number"
                        value={bankFields.account}
                        onChange={e => setBankFields({ ...bankFields, account: e.target.value })}
                        style={{ gridColumn: '1 / -1' }}
                      />
                    )}
                  </div>
                )}

                <div className={styles.refundFormActions}>
                  <button className={styles.btnApprove} onClick={() => handleProcess(item.id)}>
                    <CheckCircle2 size={16} /> PROCESS REFUND
                  </button>
                  <button className={styles.btnSecondary} onClick={() => setExpandedForm(null)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Transaction Ledger ───────────────────────────────────────────────────────

const TransactionLedger = ({ transactions }) => {
  const [filter, setFilter] = useState('All');
  const filters = ['All', 'Pharmacy', 'Rental', 'Printing'];

  const filtered = filter === 'All' ? transactions : transactions.filter(t => t.module === filter);
  const totalIncome = filtered.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);

  return (
    <div className={styles.sectionCard}>
      <div className={styles.ledgerHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>
          <FileText size={20} />
          RECENT TRANSACTIONS — TODAY
          <span style={{ fontWeight: 400, fontSize: '0.85rem', color: '#64748b', marginLeft: 8 }}>
            Total Income: <strong style={{ color: '#10b981' }}>{totalIncome.toLocaleString('en-ET', { minimumFractionDigits: 2 })} ETB</strong>
          </span>
        </div>
        <div className={styles.ledgerFilters}>
          {filters.map(f => (
            <button
              key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className={styles.ledgerTable}>
          <thead>
            <tr>
              <th>Time</th>
              <th>Module</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Payment Method</th>
              <th>Invoice #</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8', padding: '32px' }}>
                  No transactions
                </td>
              </tr>
            ) : filtered.map(tx => (
              <tr key={tx.id}>
                <td style={{ color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>{tx.time}</td>
                <td><ModuleBadge module={tx.module} /></td>
                <td>
                  <span className={`${styles.txTypeBadge} ${tx.type === 'PAYMENT' ? styles.txPayment : tx.type === 'REFUND' ? styles.txRefund : styles.txFee}`}>
                    {tx.type}
                  </span>
                </td>
                <td className={tx.amount >= 0 ? styles.amountPos : styles.amountNeg}>
                  {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString('en-ET', { minimumFractionDigits: 2 })} ETB
                </td>
                <td><MethodTag method={tx.method} /></td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#475569' }}>{tx.invoice}</td>
                <td>
                  <span className={`${styles.verifiedBadge} ${tx.status === 'VERIFIED' ? styles.ok : styles.pending}`}>
                    {tx.status === 'VERIFIED' ? <><CheckCircle2 size={12} /> Verified</> : <><Clock size={12} /> Pending</>}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Main FinanceHome ─────────────────────────────────────────────────────────

const FinanceHome = () => {
  const [verifications, setVerifications] = useState(MOCK_VERIFICATIONS);
  const [refunds, setRefunds] = useState(MOCK_REFUNDS);
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleVerificationUpdate = (id, status) => {
    setVerifications(v => v.map(i => i.id === id ? { ...i, status } : i));
    if (status === 'APPROVED') {
      const item = verifications.find(i => i.id === id);
      setTransactions(prev => [{
        id: `TX-${Date.now()}`,
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        module: item.module,
        type: 'PAYMENT',
        amount: item.amount,
        method: item.method,
        invoice: item.orderId,
        status: 'VERIFIED',
      }, ...prev]);
      showToast(`✅ Payment for ${item.orderId} verified and recorded.`);
    } else {
      showToast(`❌ Payment rejected. Customer has been notified.`);
    }
  };

  const handleRefundUpdate = (id, status) => {
    setRefunds(r => r.map(i => i.id === id ? { ...i, status } : i));
    if (status === 'APPROVED') {
      const item = refunds.find(i => i.id === id);
      const newTxs = [{
        id: `TX-RF-${Date.now()}`,
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        module: item.module,
        type: 'REFUND',
        amount: -item.refundAmount,
        method: 'Processed',
        invoice: item.id,
        status: 'VERIFIED',
      }];
      if (item.cancellationFee > 0) {
        newTxs.push({
          id: `TX-FEE-${Date.now()}`,
          time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          module: item.module,
          type: 'FEE',
          amount: item.cancellationFee,
          method: 'Retained',
          invoice: item.id,
          status: 'VERIFIED',
        });
      }
      setTransactions(prev => [...newTxs, ...prev]);
      showToast(`🔄 Refund of ${item.refundAmount.toLocaleString()} ETB approved and recorded.`);
    }
  };

  const totalIncome = transactions.filter(t => t.amount > 0 && t.status === 'VERIFIED').reduce((s, t) => s + t.amount, 0);
  const totalRefunds = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const pendingVerif = verifications.filter(v => v.status === 'PENDING').length;
  const pendingRefunds = refunds.filter(r => r.status === 'PENDING').length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Finance Dashboard</h1>
          <p>Monitor income, verify payments, and process refunds across all modules.</p>
        </div>
      </div>

      {toast && (
        <div className={styles.successAlert}>
          {toast}
        </div>
      )}

      {/* Quick Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#d1fae5', color: '#10b981' }}>
            <TrendingUp size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Total Income Today</span>
            <span className={styles.statValue}>{totalIncome.toLocaleString('en-ET', { minimumFractionDigits: 2 })} ETB</span>
            <span className={styles.statSub}>Verified transactions only</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fee2e2', color: '#ef4444' }}>
            <TrendingDown size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Total Refunds</span>
            <span className={styles.statValue}>{totalRefunds.toLocaleString('en-ET', { minimumFractionDigits: 2 })} ETB</span>
            <span className={styles.statSub}>Processed today</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fef9c3', color: '#f59e0b' }}>
            <AlertTriangle size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Pending Verifications</span>
            <span className={styles.statValue}>{pendingVerif}</span>
            <span className={styles.statSub}>Need manual review</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fce7f3', color: '#db2777' }}>
            <RefreshCw size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Pending Refunds</span>
            <span className={styles.statValue}>{pendingRefunds}</span>
            <span className={styles.statSub}>Awaiting approval</span>
          </div>
        </div>
      </div>

      {/* Verifications */}
      <VerificationSection items={verifications} onUpdate={handleVerificationUpdate} />

      {/* Refunds */}
      <RefundSection items={refunds} onUpdate={handleRefundUpdate} />

      {/* Unified Transaction Ledger */}
      <TransactionLedger transactions={transactions} />
    </div>
  );
};

export default FinanceHome;
