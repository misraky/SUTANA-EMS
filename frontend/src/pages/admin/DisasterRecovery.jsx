import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { formatDate } from '../../utils/formatters';
import styles from './DisasterRecovery.module.css';

const DisasterRecovery = () => {
  const [drStatus, setDrStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testInProgress, setTestInProgress] = useState(false);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [testResult, setTestResult] = useState({ result: 'passed', notes: '' });

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await adminService.getDRStatus();
      setDrStatus(response.data || response);
    } catch (error) {
      console.error('Failed to fetch DR status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateTest = async () => {
    setTestInProgress(true);
    try {
      await adminService.initiateDRTest();
      setShowCompleteForm(true);
      fetchStatus();
    } catch (error) {
      console.error('Failed to initiate DR test:', error);
    } finally {
      setTestInProgress(false);
    }
  };

  const handleCompleteTest = async (e) => {
    e.preventDefault();
    try {
      const testId = drStatus?.lastTest?.id || drStatus?.last_test?.id;
      await adminService.completeDRTest(testId, testResult.result, testResult.notes);
      setShowCompleteForm(false);
      setTestResult({ result: 'passed', notes: '' });
      fetchStatus();
    } catch (error) {
      console.error('Failed to complete DR test:', error);
    }
  };

  if (loading) return <div className={styles.loading}>Loading disaster recovery status...</div>;
  if (!drStatus) return <div className={styles.loading}>No DR status data available.</div>;

  const config = drStatus.config || drStatus;
  const lastTest = drStatus.lastTest || drStatus.last_test;

  return (
    <div className={styles.disasterRecovery}>
      <div className={styles.sectionHeader}>
        <div>
          <h2>Disaster Recovery</h2>
          <p>Monitor DR configuration and manage failover testing</p>
        </div>
        <div className={styles.actionBtns}>
          <button className={styles.btnPrimary} onClick={handleInitiateTest} disabled={testInProgress}>
            {testInProgress ? 'Initiating...' : 'Initiate DR Test'}
          </button>
        </div>
      </div>

      <div className={styles.cardsGrid}>
        <div className={styles.card}>
          <h4>RPO</h4>
          <p className={styles.cardValue}>{config.rpo || config.RPO || '-'}</p>
        </div>
        <div className={styles.card}>
          <h4>RTO</h4>
          <p className={styles.cardValue}>{config.rto || config.RTO || '-'}</p>
        </div>
        <div className={styles.card}>
          <h4>Replication Status</h4>
          <p className={`${styles.cardValue} ${styles[(config.replicationStatus || config.replication_status || '').toLowerCase()]}`}>
            {config.replicationStatus || config.replication_status || '-'}
          </p>
        </div>
        <div className={styles.card}>
          <h4>Last Sync</h4>
          <p className={styles.cardValue}>{formatDate(config.lastSync || config.last_sync)}</p>
        </div>
        <div className={styles.card}>
          <h4>DR Site</h4>
          <p className={styles.cardValue}>{config.drSite || config.dr_site || '-'}</p>
        </div>
      </div>

      {lastTest && (
        <div className={styles.testResultCard}>
          <h3>Last Test Result</h3>
          <div className={styles.testDetails}>
            <div className={styles.testField}>
              <span className={styles.label}>Test ID:</span> {lastTest.id}
            </div>
            <div className={styles.testField}>
              <span className={styles.label}>Result:</span>
              <span className={`${styles.badge} ${styles[(lastTest.result || '').toLowerCase()]}`}>
                {lastTest.result}
              </span>
            </div>
            <div className={styles.testField}>
              <span className={styles.label}>Date:</span> {formatDate(lastTest.created_at || lastTest.createdAt)}
            </div>
            {lastTest.notes && (
              <div className={styles.testField}>
                <span className={styles.label}>Notes:</span> {lastTest.notes}
              </div>
            )}
          </div>
        </div>
      )}

      {showCompleteForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Complete DR Test</h3>
            <form onSubmit={handleCompleteTest}>
              <div className={styles.formGroup}>
                <label>Result</label>
                <select value={testResult.result} onChange={(e) => setTestResult({ ...testResult, result: e.target.value })}>
                  <option value="passed">Passed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Notes</label>
                <textarea value={testResult.notes} onChange={(e) => setTestResult({ ...testResult, notes: e.target.value })} rows={3} />
              </div>
              <div className={styles.formActions}>
                <button type="submit" className={styles.btnPrimary}>Submit</button>
                <button type="button" className={styles.btnSecondary} onClick={() => setShowCompleteForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisasterRecovery;
