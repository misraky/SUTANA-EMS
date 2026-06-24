import React, { useState, useEffect } from 'react';
import financeService from '../../services/financeService';
import { formatDate } from '../../utils/formatters';
import styles from './CloseProcess.module.css';

const CloseProcess = () => {
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [periodHistory, setPeriodHistory] = useState([]);
  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [closeNotes, setCloseNotes] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [currRes, histRes] = await Promise.all([
        financeService.getCurrentClosePeriod().catch(() => ({ data: { period: null } })),
        financeService.getClosePeriodHistory().catch(() => ({ data: { periods: [] } }))
      ]);
      setCurrentPeriod(currRes?.data?.period);
      setPeriodHistory(histRes?.data?.periods || []);
    } catch (error) { showMessage('error', 'Failed to load close data'); }
    finally { setLoading(false); }
  };

  const checkReadiness = async () => {
    if (!currentPeriod) return;
    try {
      const res = await financeService.getCloseReadiness(currentPeriod.close_period);
      setReadiness(res?.data);
    } catch (error) { showMessage('error', 'Failed to check readiness'); }
  };

  const executeClose = async () => {
    if (!currentPeriod) return;
    try {
      await financeService.executeClose(currentPeriod.close_period, { notes: closeNotes });
      showMessage('success', `Period ${currentPeriod.close_period} closed successfully`);
      setReadiness(null);
      setCloseNotes('');
      fetchData();
    } catch (error) { showMessage('error', error.response?.data?.message || 'Close failed'); }
  };

  const reopenPeriod = async (period) => {
    const reason = prompt('Reason for reopening:');
    if (!reason || reason.length < 10) { showMessage('error', 'Reason must be at least 10 characters'); return; }
    try {
      await financeService.reopenPeriod(period, { reason });
      showMessage('success', `Period ${period} reopened`);
      fetchData();
    } catch (error) { showMessage('error', error.response?.data?.message || 'Reopen failed'); }
  };

  const showMessage = (type, text) => { setMessage({ type, text }); setTimeout(() => setMessage(null), 5000); };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Month-End Close</h1>
          <p className={styles.subtitle}>Period close process with readiness checklist</p>
        </div>
      </div>
      {message && <div className={`${styles.alert} ${styles[message.type]}`}>{message.text}</div>}

      {currentPeriod && (
        <div className={styles.currentPeriod}>
          <h3>Current Period: <strong>{currentPeriod.close_period}</strong></h3>
          <span className={`${styles.statusBadge} ${styles[currentPeriod.status]}`}>{currentPeriod.status}</span>
          {currentPeriod.status === 'open' && (
            <button className={styles.primaryBtn} onClick={checkReadiness} style={{ marginLeft: 16 }}>Check Readiness</button>
          )}
        </div>
      )}

      {readiness && (
        <div className={styles.readinessPanel}>
          <h3>Close Readiness - {readiness.period}</h3>
          <div className={styles.checklist}>
            {readiness.checks.map((check, i) => (
              <div key={i} className={`${styles.checkItem} ${check.passed ? styles.passed : styles.failed}`}>
                <span className={styles.checkIcon}>{check.passed ? '✓' : '✗'}</span>
                <div>
                  <div className={styles.checkLabel}>{check.label}</div>
                  <div className={styles.checkDetails}>{check.details}</div>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.closeActions}>
            <textarea className={styles.notesInput} placeholder="Close notes..." value={closeNotes} onChange={e => setCloseNotes(e.target.value)} rows={3} />
            {readiness.allPassed ? (
              <button className={styles.executeBtn} onClick={executeClose}>Execute Month-End Close</button>
            ) : (
              <p className={styles.blockedMsg}>Complete all checklist items before closing</p>
            )}
          </div>
        </div>
      )}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Close Period History</h2>
        {loading ? (
          <div className={styles.loadingState}><div className={styles.spinner}></div></div>
        ) : periodHistory.length === 0 ? (
          <div className={styles.emptyState}><p>No close history</p></div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead><tr><th>Period</th><th>Close Date</th><th>Status</th><th>Closed By</th><th>Closed At</th><th>Action</th></tr></thead>
              <tbody>
                {periodHistory.map(p => (
                  <tr key={p.id}>
                    <td className={styles.boldText}>{p.close_period}</td>
                    <td>{formatDate(p.close_date)}</td>
                    <td><span className={`${styles.statusBadge} ${styles[p.status]}`}>{p.status}</span></td>
                    <td>{p.closed_by_name || '-'}</td>
                    <td>{p.closed_at ? formatDate(p.closed_at) : '-'}</td>
                    <td>
                      {p.status === 'closed' && <button className={styles.actionBtn} onClick={() => reopenPeriod(p.close_period)}>Reopen</button>}
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

export default CloseProcess;
