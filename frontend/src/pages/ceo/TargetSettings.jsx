import React, { useState, useEffect, useCallback } from 'react';
import { formatDate } from '../../utils/formatters';
import ceoService from '../../services/ceoService';
import styles from './TargetSettings.module.css';

const TARGET_FIELDS = [
  { key: 'dailySalesTarget', label: 'Daily Sales Target', type: 'currency', min: 0, max: 1000000, step: 100, section: 'Sales & Revenue' },
  { key: 'monthlySalesTarget', label: 'Monthly Sales Target', type: 'currency', min: 0, max: 50000000, step: 1000, section: 'Sales & Revenue' },
  { key: 'quarterlyRevenueTarget', label: 'Quarterly Revenue Target', type: 'currency', min: 0, max: 200000000, step: 5000, section: 'Sales & Revenue' },
  { key: 'yearlyRevenueTarget', label: 'Yearly Revenue Target', type: 'currency', min: 0, max: 1000000000, step: 10000, section: 'Sales & Revenue' },
  { key: 'profitMarginTarget', label: 'Target Profit Margin', type: 'percent', min: 0, max: 100, step: 0.1, section: 'Sales & Revenue' },
  { key: 'fulfillmentHoursTarget', label: 'Order Fulfillment Target', type: 'hours', min: 1, max: 720, step: 1, section: 'Operations & Satisfaction' },
  { key: 'inventoryTurnoverTarget', label: 'Inventory Turnover Ratio', type: 'ratio', min: 0, max: 100, step: 0.1, section: 'Operations & Satisfaction' },
  { key: 'customerSatisfactionTarget', label: 'Customer Satisfaction Target', type: 'percent', min: 0, max: 100, step: 0.1, section: 'Operations & Satisfaction' },
];

const MOCK_ACTUALS = {
  dailySalesTarget: 4200,
  monthlySalesTarget: 120000,
  quarterlyRevenueTarget: 380000,
  yearlyRevenueTarget: 1500000,
  profitMarginTarget: 22,
  fulfillmentHoursTarget: 28,
  inventoryTurnoverTarget: 4.2,
  customerSatisfactionTarget: 88,
};

const MOCK_VERSION_HISTORY = [
  { id: 1, dateChanged: '2025-06-15T10:30:00Z', fieldChanged: 'Daily Sales Target', oldValue: '$4,000', newValue: '$5,000', changedBy: 'John Smith' },
  { id: 2, dateChanged: '2025-05-20T14:00:00Z', fieldChanged: 'Profit Margin Target', oldValue: '20%', newValue: '25%', changedBy: 'John Smith' },
  { id: 3, dateChanged: '2025-04-10T09:15:00Z', fieldChanged: 'Customer Satisfaction Target', oldValue: '90%', newValue: '95%', changedBy: 'Sarah Lee' },
  { id: 4, dateChanged: '2025-03-05T11:45:00Z', fieldChanged: 'Monthly Sales Target', oldValue: '$120,000', newValue: '$150,000', changedBy: 'John Smith' },
];

const MOCK_DEPARTMENTS = [
  { id: 1, name: 'Sales Department', cascadePct: 60 },
  { id: 2, name: 'Marketing Department', cascadePct: 15 },
  { id: 3, name: 'Operations Department', cascadePct: 10 },
  { id: 4, name: 'Finance Department', cascadePct: 8 },
  { id: 5, name: 'HR Department', cascadePct: 5 },
  { id: 6, name: 'IT Department', cascadePct: 2 },
];

const TargetSettings = () => {
  const [targets, setTargets] = useState({});
  const [originalTargets, setOriginalTargets] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [errors, setErrors] = useState({});
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [showCascadeModal, setShowCascadeModal] = useState(false);
  const [versionHistory, setVersionHistory] = useState([]);
  const [showDiff, setShowDiff] = useState(null);
  const [cascading, setCascading] = useState(false);

  const fetchTargets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ceoService.getTargets();
      const data = response.data?.data?.targets || response.data?.targets;
      if (data) {
        const mapped = {};
        TARGET_FIELDS.forEach(f => { mapped[f.key] = data[f.key] || ''; });
        setTargets(mapped);
        setOriginalTargets({ ...mapped });
      }
    } catch (error) {
      console.error('Failed to load targets:', error);
      const fallback = {};
      TARGET_FIELDS.forEach(f => { fallback[f.key] = ''; });
      setTargets(fallback);
      setOriginalTargets({ ...fallback });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTargets();
    try {
      setVersionHistory(MOCK_VERSION_HISTORY);
    } catch (e) {
      setVersionHistory(MOCK_VERSION_HISTORY);
    }
  }, [fetchTargets]);

  const validate = () => {
    const newErrors = {};
    TARGET_FIELDS.forEach(f => {
      const val = parseFloat(targets[f.key]);
      if (isNaN(val)) { newErrors[f.key] = 'Value is required'; }
      else if (val < f.min) { newErrors[f.key] = `Minimum value is ${f.min}`; }
      else if (val > f.max) { newErrors[f.key] = `Maximum value is ${f.max}`; }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTargets(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const payload = {};
    TARGET_FIELDS.forEach(f => { payload[f.key] = parseFloat(targets[f.key]) || 0; });
    try {
      await ceoService.updateTargets(payload);
      setOriginalTargets({ ...targets });
      setMessage({ type: 'success', text: 'Targets updated successfully.' });
      setShowConfirmSave(false);
    } catch (error) {
      console.error('Failed to update targets:', error);
      setMessage({ type: 'error', text: 'Failed to update targets. Please check your inputs.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setTargets({ ...originalTargets });
    setErrors({});
    setMessage({ type: 'info', text: 'Changes discarded.' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCascade = async () => {
    setCascading(true);
    try {
      await ceoService.updateTargets(targets);
      setTimeout(() => {
        setCascading(false);
        setShowCascadeModal(false);
        setMessage({ type: 'success', text: 'Targets cascaded to all departments successfully.' });
      }, 1500);
    } catch (error) {
      setCascading(false);
      setMessage({ type: 'error', text: 'Failed to cascade targets.' });
    }
  };

  const getProgress = (key) => {
    const target = parseFloat(targets[key]);
    const actual = MOCK_ACTUALS[key];
    if (!target || !actual) return 0;
    return Math.min(100, Math.round((actual / target) * 100));
  };

  const getProgressColor = (pct) => {
    if (pct >= 90) return styles.green;
    if (pct >= 75) return styles.yellow;
    return styles.red;
  };

  const getFieldDisplay = (key) => {
    const val = targets[key];
    const f = TARGET_FIELDS.find(t => t.key === key);
    if (!f) return val || '—';
    if (!val) return '—';
    if (f.type === 'currency') return `$${parseFloat(val).toLocaleString()}`;
    if (f.type === 'percent') return `${val}%`;
    return val;
  };

  const salesFields = TARGET_FIELDS.filter(f => f.section === 'Sales & Revenue');
  const opsFields = TARGET_FIELDS.filter(f => f.section === 'Operations & Satisfaction');

  const hasChanges = JSON.stringify(targets) !== JSON.stringify(originalTargets);

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner}></div>
        <p>Loading configuration...</p>
      </div>
    );
  }

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.headerActions}>
        <div>
          <h1 className={styles.pageTitle}>Strategic Target Settings</h1>
          <p className={styles.pageSubtitle}>Configure key performance indicator (KPI) targets</p>
        </div>
        <button className={styles.cascadeBtn} onClick={() => setShowCascadeModal(true)}>
          Cascade Targets
        </button>
      </div>

      {message && (
        <div className={`${styles.alert} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <div className={styles.formContainer}>
        <div className={styles.formGrid}>
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Sales & Revenue</h2>
            {salesFields.map(f => (
              <div key={f.key} className={styles.formGroup}>
                <label htmlFor={f.key}>{f.label}</label>
                <div className={styles.inputWrapper}>
                  {f.type === 'currency' && <span className={styles.currencySymbol}>$</span>}
                  <input
                    type="number"
                    id={f.key}
                    name={f.key}
                    value={targets[f.key] || ''}
                    onChange={handleChange}
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    className={errors[f.key] ? styles.inputError : ''}
                    placeholder={`${f.min} - ${f.max}`}
                  />
                  {f.type === 'percent' && <span className={styles.percentSymbol}>%</span>}
                </div>
                {errors[f.key] && <span className={styles.fieldError}>{errors[f.key]}</span>}
                <div className={styles.progressBarContainer}>
                  <div className={styles.progressBar}>
                    <div
                      className={`${styles.progressFill} ${getProgressColor(getProgress(f.key))}`}
                      style={{ width: `${getProgress(f.key)}%` }}
                    ></div>
                  </div>
                  <span className={`${styles.progressLabel} ${getProgressColor(getProgress(f.key))}`}>
                    {getProgress(f.key)}% of actual
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Operations & Satisfaction</h2>
            {opsFields.map(f => (
              <div key={f.key} className={styles.formGroup}>
                <label htmlFor={f.key}>{f.label}</label>
                <div className={styles.inputWrapper}>
                  {f.type === 'currency' && <span className={styles.currencySymbol}>$</span>}
                  <input
                    type="number"
                    id={f.key}
                    name={f.key}
                    value={targets[f.key] || ''}
                    onChange={handleChange}
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    className={errors[f.key] ? styles.inputError : ''}
                    placeholder={`${f.min} - ${f.max}`}
                  />
                  {f.type === 'percent' && <span className={styles.percentSymbol}>%</span>}
                </div>
                {errors[f.key] && <span className={styles.fieldError}>{errors[f.key]}</span>}
                <div className={styles.progressBarContainer}>
                  <div className={styles.progressBar}>
                    <div
                      className={`${styles.progressFill} ${getProgressColor(getProgress(f.key))}`}
                      style={{ width: `${getProgress(f.key)}%` }}
                    ></div>
                  </div>
                  <span className={`${styles.progressLabel} ${getProgressColor(getProgress(f.key))}`}>
                    {getProgress(f.key)}% of actual
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.formActions}>
          <button type="button" className={styles.cancelBtn} onClick={handleDiscard} disabled={saving || !hasChanges}>
            Discard Changes
          </button>
          <button type="button" className={styles.saveBtn} onClick={() => setShowConfirmSave(true)} disabled={saving || !hasChanges}>
            {saving ? 'Saving...' : 'Save Target Configurations'}
          </button>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Target Version History</h2>
        </div>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date Changed</th>
                <th>Field Changed</th>
                <th>Old Value</th>
                <th>New Value</th>
                <th>Changed By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {versionHistory.length === 0 ? (
                <tr><td colSpan="6" className={styles.emptyCell}>No version history available.</td></tr>
              ) : versionHistory.map(v => (
                <tr key={v.id}>
                  <td>{formatDate(v.dateChanged)}</td>
                  <td>{v.fieldChanged}</td>
                  <td className={styles.oldValue}>{v.oldValue}</td>
                  <td className={styles.newValue}>{v.newValue}</td>
                  <td>{v.changedBy}</td>
                  <td>
                    <button className={styles.diffBtn} onClick={() => setShowDiff(showDiff === v.id ? null : v.id)}>
                      {showDiff === v.id ? 'Hide Diff' : 'View Diff'}
                    </button>
                    {showDiff === v.id && (
                      <div className={styles.diffPopover}>
                        <span className={styles.diffOld}>{v.oldValue}</span>
                        <span className={styles.diffArrow}>→</span>
                        <span className={styles.diffNew}>{v.newValue}</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showConfirmSave && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Confirm Save</h3>
            <p>Are you sure you want to save these target changes? This will update the active KPI targets across the organization.</p>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowConfirmSave(false)}>Cancel</button>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Confirm Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCascadeModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Cascade Targets to Departments</h3>
            <p>Targets will be cascaded to all departments based on their allocation percentages:</p>
            <div className={styles.deptList}>
              {MOCK_DEPARTMENTS.map(d => (
                <div key={d.id} className={styles.deptRow}>
                  <span className={styles.deptName}>{d.name}</span>
                  <span className={styles.deptPct}>{d.cascadePct}%</span>
                </div>
              ))}
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowCascadeModal(false)} disabled={cascading}>Cancel</button>
              <button className={styles.cascadeBtn} onClick={handleCascade} disabled={cascading}>
                {cascading ? 'Cascading...' : 'Confirm Cascade'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TargetSettings;
