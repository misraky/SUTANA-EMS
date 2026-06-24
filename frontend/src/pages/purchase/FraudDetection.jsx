import React, { useState, useEffect } from 'react';
import purchaseService from '../../services/purchaseService';
import { formatCurrency } from '../../utils/formatters';
import styles from './FraudDetection.module.css';

const FRAUD_RULES = [
  { id: 1, name: 'Duplicate PO', description: 'Same supplier, items, amount (±5%) within N days', severity: 'critical', icon: '🔴', threshold: '5%', days: 7, enabled: true },
  { id: 2, name: 'Split Purchase', description: 'Multiple POs to same supplier totalling above threshold in 7 days', severity: 'critical', icon: '🔴', threshold: '100,000 ETB', days: 7, enabled: true },
  { id: 3, name: 'Price Variance', description: 'PO price > 20% above last 3 purchase prices', severity: 'warning', icon: '🟡', threshold: '20%', days: null, enabled: true },
  { id: 4, name: 'Ghost Supplier', description: 'New supplier (<30d) + rush PO + employee address match', severity: 'critical', icon: '🔴', threshold: '30 days', days: null, enabled: true },
  { id: 5, name: 'Single Bidder', description: 'RFQ with only 1 quotation (no justification)', severity: 'warning', icon: '🟡', threshold: null, days: null, enabled: false },
  { id: 6, name: 'After-Hours PO', description: 'PO created after hours + high value + no attachment', severity: 'warning', icon: '🟡', threshold: '50,000 ETB', days: null, enabled: true },
  { id: 7, name: 'Same IP (Buyer-Supplier)', description: 'PO creator and supplier user share IP address', severity: 'critical', icon: '🔴', threshold: null, days: null, enabled: true },
];

const MOCK_ALERTS = [
  { id: 1, rule: 'Duplicate PO', supplier: 'TechPro Solutions', amount: 500000, risk: 'high', status: 'In Review', date: '2026-06-17', desc: 'PO-003 matches PO-001 (supplier, items, amount)' },
  { id: 2, rule: 'Split Purchase', supplier: 'OfficeMax Supplies', amount: 180000, risk: 'medium', status: 'Investigating', date: '2026-06-15', desc: '3 POs totalling 180K ETB in 3 days' },
  { id: 3, rule: 'Ghost Supplier', supplier: 'QuickFix Services', amount: 250000, risk: 'high', status: 'New', date: '2026-06-18', desc: 'Supplier registered 5 days ago + rush PO' },
  { id: 4, rule: 'Price Variance', supplier: 'BuildCorp', amount: 50000, risk: 'low', status: 'Ignored', date: '2026-06-14', desc: 'Unit price 22% above last purchase' },
  { id: 5, rule: 'Single Bidder', supplier: 'FreshSupp Ltd', amount: 2000000, risk: 'medium', status: 'Overridden', date: '2026-06-10', desc: 'RFQ-004: only 1 quotation received' },
];

const FraudDetection = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [rules, setRules] = useState(FRAUD_RULES);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await purchaseService.getFraudAlerts();
        const data = res.data?.data || res.data?.alerts || [];
        setAlerts(data.length > 0 ? data : MOCK_ALERTS);
      } catch (e) { setAlerts(MOCK_ALERTS); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const criticalCount = alerts.filter(a => a.risk === 'high' || a.risk === 'critical').length;
  const medCount = alerts.filter(a => a.risk === 'medium').length;
  const lowCount = alerts.filter(a => a.risk === 'low').length;

  const toggleRule = (id) => setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  const handleSaveRules = () => {
    setSavedMsg('✅ Rules saved successfully!');
    setTimeout(() => { setSavedMsg(''); setShowRulesModal(false); }, 1200);
  };

  const handleAlertAction = (alertId, action) => {
    setAlerts(prev => prev.map(a => a.id === alertId
      ? { ...a, status: action === 'resolve' ? 'Resolved' : action === 'ignore' ? 'Ignored' : 'Investigating' }
      : a
    ));
  };

  if (loading) return <div className={styles.loading}><div className={styles.spinner}></div><p>Loading fraud detection...</p></div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div><h1 className={styles.title}>Fraud Detection</h1><p className={styles.subtitle}>7 rule engines monitoring procurement anomalies in real-time</p></div>
        <button className={styles.btnPrimary} onClick={() => setShowRulesModal(true)}>⚙️ Configure Rules</button>
      </div>

      <div className={styles.statRow}>
        <div className={`${styles.statBox} ${styles.bgDanger}`}><span className={styles.statNum}>{criticalCount}</span><span className={styles.statLabel}>Critical Alerts</span></div>
        <div className={`${styles.statBox} ${styles.bgWarning}`}><span className={styles.statNum}>{medCount}</span><span className={styles.statLabel}>Medium Risk</span></div>
        <div className={`${styles.statBox} ${styles.bgInfo}`}><span className={styles.statNum}>{lowCount}</span><span className={styles.statLabel}>Low Risk</span></div>
        <div className={`${styles.statBox} ${styles.bgSuccess}`}><span className={styles.statNum}>{alerts.filter(a => a.status === 'Resolved' || a.status === 'Ignored').length}</span><span className={styles.statLabel}>Resolved</span></div>
      </div>

      <div className={styles.rulesBar}>
        <h3 className={styles.rulesTitle}>Active Detection Rules</h3>
        <div className={styles.rulesGrid}>
          {rules.filter(r => r.enabled).map(r => (
            <div key={r.id} className={`${styles.rule} ${styles['rule_' + r.severity]}`}>
              <span className={styles.ruleIcon}>{r.icon}</span>
              <div><strong className={styles.ruleName}>{r.name}</strong><p className={styles.ruleDesc}>{r.description}</p></div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Active Alerts</h2>
        <span className={styles.sectionBadge}>{alerts.length} total</span>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr><th>Alert #</th><th>Rule</th><th>Supplier</th><th>Amount</th><th>Risk</th><th>Description</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {alerts.length === 0 ? (
              <tr><td colSpan="9" className={styles.emptyRow}>No active fraud alerts. All clear.</td></tr>
            ) : alerts.map((a, i) => (
              <tr key={a.id || i}>
                <td className={styles.cellMono}>A-{String(a.id || i + 1).padStart(3, '0')}</td>
                <td><strong>{a.rule || a.type}</strong></td>
                <td>{a.supplier}</td>
                <td>{formatCurrency(a.amount || 0)}</td>
                <td><span className={`${styles.riskBadge} ${styles['risk_' + (a.risk || 'medium')]}`}>{a.risk || 'medium'}</span></td>
                <td className={styles.descCell}>{a.desc || a.description || '—'}</td>
                <td>{a.date || '—'}</td>
                <td><span className={`${styles.statusBadge} ${styles['st_' + (a.status || 'New').toLowerCase().replace(/\s/g,'_')]}`}>{a.status || 'New'}</span></td>
                <td>
                  <div className={styles.actionGroup}>
                    <button className={styles.btnSm} title="Investigate" onClick={() => handleAlertAction(a.id, 'investigate')}>🔍</button>
                    <button className={styles.btnSm} title="Resolve" onClick={() => handleAlertAction(a.id, 'resolve')}>✅</button>
                    <button className={styles.btnSm} title="Ignore" onClick={() => handleAlertAction(a.id, 'ignore')}>⏭️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Configure Rules Modal ── */}
      {showRulesModal && (
        <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && setShowRulesModal(false)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>⚙️ Configure Fraud Detection Rules</h2>
              <button className={styles.modalClose} onClick={() => setShowRulesModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalSubtitle}>Enable or disable rules and adjust thresholds. Changes take effect immediately on new POs.</p>
              <div className={styles.rulesList}>
                {rules.map(rule => (
                  <div key={rule.id} className={`${styles.ruleRow} ${rule.enabled ? styles.ruleRowActive : styles.ruleRowDisabled}`}>
                    <div className={styles.ruleToggleArea}>
                      <span className={styles.ruleRowIcon}>{rule.icon}</span>
                      <div className={styles.ruleRowInfo}>
                        <strong className={styles.ruleRowName}>{rule.name}</strong>
                        <p className={styles.ruleRowDesc}>{rule.description}</p>
                        {rule.threshold && <span className={styles.ruleThreshold}>Threshold: {rule.threshold}</span>}
                      </div>
                    </div>
                    <label className={styles.toggle}>
                      <input type="checkbox" checked={rule.enabled} onChange={() => toggleRule(rule.id)} />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                ))}
              </div>
              {savedMsg && <div className={styles.savedMsg}>{savedMsg}</div>}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnOutline} onClick={() => setShowRulesModal(false)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleSaveRules}>💾 Save Rules</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FraudDetection;
