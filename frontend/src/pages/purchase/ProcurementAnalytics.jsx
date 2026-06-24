import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import purchaseService from '../../services/purchaseService';
import { formatCurrency } from '../../utils/formatters';
import styles from './ProcurementAnalytics.module.css';

const KPI_DEFS = [
  { key: 'monthlyPOs', label: 'PO Cycle Time', value: '4.2', suffix: 'days', target: '≤5 days', status: 'success', change: '-0.5 vs Q1' },
  { key: 'maverickSpend', label: 'Maverick Spend', value: '8.3', suffix: '%', target: '<10%', status: 'warning', change: '+1.2 vs Q1' },
  { key: 'costSavings', label: 'Cost Savings', value: '2.4', prefix: 'M ETB', target: 'Annual: 5%', status: 'success', change: '+0.3 vs Q1' },
  { key: 'supplierFillRate', label: 'Fill Rate', value: '94.2', suffix: '%', target: '>95%', status: 'warning', change: '-0.8 vs Q1' },
  { key: 'invoiceErrorRate', label: 'Invoice Error Rate', value: '2.1', suffix: '%', target: '<3%', status: 'success', change: '-0.4 vs Q1' },
  { key: 'approvalSLA', label: 'Approval SLA', value: '91.5', suffix: '%', target: '>90%', status: 'success', change: '+2.1 vs Q1' },
  { key: 'poPerBuyer', label: 'POs per Buyer', value: '12', suffix: 'POs', target: 'Monitor', status: 'info', change: '+1 vs Q1' },
  { key: 'activeContracts', label: 'Contract Coverage', value: '76', suffix: '%', target: '>80%', status: 'warning', change: '-3 vs Q1' },
];

const CATEGORY_DATA = [
  { label: 'OPEX', pct: 62, value: 6200000, color: '#2563eb' },
  { label: 'CAPEX', pct: 25, value: 2500000, color: '#7c3aed' },
  { label: 'Services', pct: 13, value: 1300000, color: '#059669' },
];

const ProcurementAnalytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showExportMsg, setShowExportMsg] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ frequency: 'weekly', email: '', format: 'PDF', dayOfWeek: 'Monday' });
  const [scheduleSaved, setScheduleSaved] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await purchaseService.getPurchaseStatistics();
        setStats(res.data?.data || res.data);
      } catch (e) { setStats(null); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const handleExport = () => {
    setShowExportMsg(true);
    setTimeout(() => setShowExportMsg(false), 2500);
  };

  const handleScheduleSubmit = e => {
    e.preventDefault();
    setScheduleSaved('✅ Report scheduled successfully! You will receive it every ' + scheduleForm.frequency + '.');
    setTimeout(() => { setShowScheduleModal(false); setScheduleSaved(''); }, 1500);
  };

  if (loading) return <div className={styles.loading}><div className={styles.spinner}></div><p>Loading analytics...</p></div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div><h1 className={styles.title}>Procurement Analytics & KPIs</h1><p className={styles.subtitle}>12 essential KPIs — Industry ERP Standard benchmarking</p></div>
        <div className={styles.headerActions}>
          <button className={styles.btnOutline} onClick={handleExport}>📥 Export</button>
          <button className={styles.btnPrimary} onClick={() => setShowScheduleModal(true)}>📅 Schedule Report</button>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        {KPI_DEFS.map(kpi => (
          <div key={kpi.key} className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiLabel}>{kpi.label}</span>
              <span className={`${styles.kpiStatus} ${styles[kpi.status]}`}>{kpi.status === 'success' ? '✅' : kpi.status === 'warning' ? '⚠️' : 'ℹ️'} {kpi.target}</span>
            </div>
            <div className={styles.kpiValue}>{kpi.prefix || ''}{kpi.value}{kpi.suffix}</div>
            <div className={styles.kpiFooter}>
              <span className={styles.kpiChange}>{kpi.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.chartRow}>
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Spend by Category (Q2 2026)</h2>
          <div className={styles.spendChart}>
            {CATEGORY_DATA.map(cat => (
              <div key={cat.label} className={styles.spendRow}>
                <span className={styles.spendLabel}>{cat.label}</span>
                <div className={styles.spendBar}><div className={styles.spendFill} style={{ width: `${cat.pct}%`, background: cat.color }} /></div>
                <span className={styles.spendPct}>{cat.pct}%</span>
                <span className={styles.spendValue}>{formatCurrency(cat.value)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Procurement Health Score</h2>
          <div className={styles.healthGrid}>
            <div className={styles.healthItem}>
              <span className={styles.healthLabel}>PO Cycle</span>
              <div className={styles.healthBar}><div className={styles.healthFill} style={{ width: '84%', background: '#16a34a' }} /></div>
              <span className={styles.healthScore}>84% — 4.2d</span>
            </div>
            <div className={styles.healthItem}>
              <span className={styles.healthLabel}>Savings Target</span>
              <div className={styles.healthBar}><div className={styles.healthFill} style={{ width: '72%', background: '#2563eb' }} /></div>
              <span className={styles.healthScore}>72% — 2.4M ETB</span>
            </div>
            <div className={styles.healthItem}>
              <span className={styles.healthLabel}>SLA Compliance</span>
              <div className={styles.healthBar}><div className={styles.healthFill} style={{ width: '92%', background: '#16a34a' }} /></div>
              <span className={styles.healthScore}>92% — 91.5% met</span>
            </div>
            <div className={styles.healthItem}>
              <span className={styles.healthLabel}>Fraud Risk Score</span>
              <div className={styles.healthBar}><div className={styles.healthFill} style={{ width: '35%', background: '#d97706' }} /></div>
              <span className={styles.healthScore}>35% — 5 active alerts</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.insightBox}>
        <div className={styles.insightHeader}>
          <h2 className={styles.insightTitle}>🔍 Key Insights</h2>
          <span className={styles.insightBadge}>Q2 2026</span>
        </div>
        <div className={styles.insightGrid}>
          <div className={styles.insightCard}>
            <span className={styles.insightIcon}>📉</span>
            <div><strong>Fill Rate Declining</strong><p>Currently 94.2% (target {'>'}95%). Investigate BuildCorp delays affecting 2.1% of variance.</p></div>
          </div>
          <div className={styles.insightCard}>
            <span className={styles.insightIcon}>📈</span>
            <div><strong>Cost Savings On Track</strong><p>2.4M ETB YTD (72% of annual target). TechPro renegotiation contributed 800K.</p></div>
          </div>
          <div className={styles.insightCard}>
            <span className={styles.insightIcon}>⚠️</span>
            <div><strong>Maverick Spend Up</strong><p>8.3% (+1.2% vs Q1). 3 new suppliers without contracts driving non-compliant spend.</p></div>
          </div>
          <div className={styles.insightCard}>
            <span className={styles.insightIcon}>🛡️</span>
            <div><strong>Fraud Alerts Require Review</strong><p>5 active alerts (2 critical). Duplicate PO and ghost supplier investigations pending.</p></div>
          </div>
        </div>
      </div>

      {/* ── Export Toast ── */}
      {showExportMsg && (
        <div className={styles.exportToast}>📥 Generating report... Your download will begin shortly.</div>
      )}

      {/* ── Schedule Report Modal ── */}
      {showScheduleModal && (
        <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && setShowScheduleModal(false)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>📅 Schedule Procurement Report</h2>
              <button className={styles.modalClose} onClick={() => setShowScheduleModal(false)}>✕</button>
            </div>
            <form onSubmit={handleScheduleSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Recipient Email *</label>
                <input className={styles.input} type="email" required placeholder="finance@company.com" value={scheduleForm.email} onChange={e => setScheduleForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Frequency</label>
                  <select className={styles.input} value={scheduleForm.frequency} onChange={e => setScheduleForm(f => ({ ...f, frequency: e.target.value }))}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Report Format</label>
                  <select className={styles.input} value={scheduleForm.format} onChange={e => setScheduleForm(f => ({ ...f, format: e.target.value }))}>
                    <option value="PDF">PDF</option>
                    <option value="Excel">Excel (.xlsx)</option>
                    <option value="CSV">CSV</option>
                  </select>
                </div>
              </div>
              {scheduleForm.frequency === 'weekly' && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>Send On</label>
                  <select className={styles.input} value={scheduleForm.dayOfWeek} onChange={e => setScheduleForm(f => ({ ...f, dayOfWeek: e.target.value }))}>
                    {['Monday','Tuesday','Wednesday','Thursday','Friday'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}
              <div className={styles.formGroup}>
                <label className={styles.label}>Include Sections</label>
                <div className={styles.checkGroup}>
                  {['KPI Summary','Spend by Category','Supplier Performance','Fraud Alerts','Reorder Suggestions'].map(sec => (
                    <label key={sec} className={styles.checkLabel}><input type="checkbox" defaultChecked />{sec}</label>
                  ))}
                </div>
              </div>
              {scheduleSaved && <div className={styles.savedMsg}>{scheduleSaved}</div>}
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnOutline} onClick={() => setShowScheduleModal(false)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary}>📅 Confirm Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcurementAnalytics;
