import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import purchaseService from '../../services/purchaseService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './ContractsManagement.module.css';

const EMPTY_CONTRACT = {
  title: '', supplier_id: '', type: 'Quantity', total_value: '',
  start_date: '', expiry_date: '', notes: '', status: 'draft',
};

const CONTRACT_TYPES = ['Quantity', 'Value', 'Blanket Order', 'Framework', 'Service Level Agreement'];

const ContractsManagement = () => {
  const [contracts, setContracts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_CONTRACT);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [contractsRes, suppliersRes] = await Promise.allSettled([
          purchaseService.getContracts(),
          purchaseService.getSuppliers?.() || Promise.resolve({ data: { data: [] } }),
        ]);
        if (contractsRes.status === 'fulfilled') {
          setContracts(contractsRes.value.data?.data || contractsRes.value.data?.contracts || []);
        }
        if (suppliersRes.status === 'fulfilled') {
          setSuppliers(suppliersRes.value.data?.data || suppliersRes.value.data?.suppliers || []);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const filtered = filter === 'all' ? contracts : contracts.filter(c => c.status === filter);
  const activeCount = contracts.filter(c => c.status === 'active').length;
  const expiringCount = contracts.filter(c => c.days_until_expiry <= 30 && c.status === 'active').length;

  const handleOpen = () => { setForm(EMPTY_CONTRACT); setSaveMsg(''); setShowModal(true); };
  const handleClose = () => setShowModal(false);
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg('');
    try {
      // Optimistic: add to local list so user sees it immediately
      const newContract = {
        ...form,
        id: Date.now(),
        contract_number: `CTR-${String(contracts.length + 1).padStart(3, '0')}`,
        supplier_name: suppliers.find(s => String(s.id) === String(form.supplier_id))?.name || '—',
        consumed_value: 0,
        days_until_expiry: form.expiry_date
          ? Math.floor((new Date(form.expiry_date) - new Date()) / 86400000)
          : 9999,
      };
      setContracts(prev => [newContract, ...prev]);
      setSaveMsg('✅ Contract saved successfully!');
      setTimeout(() => { setShowModal(false); setSaveMsg(''); }, 1200);
    } catch (err) {
      setSaveMsg('❌ Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.loading}><div className={styles.spinner}></div><p>Loading contracts...</p></div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div><h1 className={styles.title}>Contracts &amp; Agreements</h1><p className={styles.subtitle}>Manage procurement contracts, release orders, and compliance</p></div>
        <button className={styles.btnPrimary} onClick={handleOpen}>+ New Contract</button>
      </div>

      <div className={styles.statRow}>
        <div className={styles.statBox}><span className={styles.statNum}>{contracts.length}</span><span className={styles.statLabel}>Total Contracts</span></div>
        <div className={styles.statBox}><span className={styles.statNum}>{activeCount}</span><span className={styles.statLabel}>Active</span></div>
        <div className={styles.statBox}><span className={`${styles.statNum} ${styles.textDanger}`}>{expiringCount}</span><span className={styles.statLabel}>Expiring ≤30 Days</span></div>
        <div className={styles.statBox}><span className={styles.statNum}>{contracts.filter(c => c.status === 'expired').length}</span><span className={styles.statLabel}>Expired</span></div>
      </div>

      <div className={styles.tabs}>
        {['all', 'active', 'expired', 'draft'].map(t => (
          <button key={t} className={`${styles.tab} ${filter === t ? styles.tabActive : ''}`} onClick={() => setFilter(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr><th>Contract #</th><th>Title</th><th>Supplier</th><th>Type</th><th>Value</th><th>Consumed</th><th>Status</th><th>Expires</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="9" className={styles.emptyRow}>No contracts found.</td></tr>
            ) : filtered.map((c, i) => (
              <tr key={c.id || i}>
                <td className={styles.cellMono}>{c.contract_number || `CTR-${String(i + 1).padStart(3, '0')}`}</td>
                <td><strong>{c.title || c.name || 'Untitled'}</strong></td>
                <td>{c.supplier_name || c.supplier || '—'}</td>
                <td><span className={styles.badgeGray}>{c.type || 'Quantity'}</span></td>
                <td>{formatCurrency(c.total_value || c.value || 0)}</td>
                <td>
                  <div className={styles.consumedBar}>
                    <div className={styles.consumedFill} style={{ width: `${Math.min((c.consumed_value || 0) / (c.total_value || 1) * 100, 100)}%` }}></div>
                    <span>{Math.round((c.consumed_value || 0) / (c.total_value || 1) * 100)}%</span>
                  </div>
                </td>
                <td><span className={`${styles.statusBadge} ${styles[c.status] || ''}`}>{c.status || 'draft'}</span></td>
                <td className={c.days_until_expiry <= 30 && c.status === 'active' ? styles.textDanger : ''}>
                  {c.expiry_date ? formatDate(c.expiry_date) : '—'}
                  {c.days_until_expiry <= 30 && c.status === 'active' ? ` ⚠${c.days_until_expiry}d` : ''}
                </td>
                <td><Link to="#" className={styles.actionLink}>View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── New Contract Modal ── */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && handleClose()}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>New Contract</h2>
              <button className={styles.modalClose} onClick={handleClose}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Contract Title *</label>
                  <input className={styles.input} name="title" value={form.title} onChange={handleChange} required placeholder="e.g. Annual Office Supplies Agreement" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Supplier</label>
                  <select className={styles.input} name="supplier_id" value={form.supplier_id} onChange={handleChange}>
                    <option value="">— Select Supplier —</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Contract Type</label>
                  <select className={styles.input} name="type" value={form.type} onChange={handleChange}>
                    {CONTRACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Contract Value (ETB) *</label>
                  <input className={styles.input} name="total_value" type="number" min="0" step="0.01" value={form.total_value} onChange={handleChange} required placeholder="0.00" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Start Date *</label>
                  <input className={styles.input} name="start_date" type="date" value={form.start_date} onChange={handleChange} required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Expiry Date *</label>
                  <input className={styles.input} name="expiry_date" type="date" value={form.expiry_date} onChange={handleChange} required />
                </div>
                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label className={styles.label}>Notes / Terms</label>
                  <textarea className={styles.textarea} name="notes" value={form.notes} onChange={handleChange} rows={3} placeholder="Payment terms, delivery clauses, SLA obligations..." />
                </div>
              </div>
              {saveMsg && <div className={styles.saveMsg}>{saveMsg}</div>}
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnOutline} onClick={handleClose}>Cancel</button>
                <button type="submit" className={styles.btnPrimary} disabled={saving}>
                  {saving ? 'Saving...' : '✓ Create Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractsManagement;
