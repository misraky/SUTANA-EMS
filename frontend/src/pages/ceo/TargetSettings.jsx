import React, { useState, useEffect } from 'react';
import ceoService from '../../services/ceoService';
import styles from './TargetSettings.module.css';
const TargetSettings = () => {
  const [targets, setTargets] = useState({
    dailySalesTarget: '',
    monthlySalesTarget: '',
    fulfillmentHoursTarget: '',
    inventoryTurnoverTarget: '',
    customerSatisfactionTarget: '',
    profitMarginTarget: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  useEffect(() => {
    fetchTargets();
  }, []);
  const fetchTargets = async () => {
    try {
      setLoading(true);
      const response = await ceoService.getTargets();
      const data = response.data?.data?.targets || response.data?.targets;
      if (data) {
        setTargets({
          dailySalesTarget: data.dailySalesTarget || '',
          monthlySalesTarget: data.monthlySalesTarget || '',
          fulfillmentHoursTarget: data.fulfillmentHoursTarget || '',
          inventoryTurnoverTarget: data.inventoryTurnoverTarget || '',
          customerSatisfactionTarget: data.customerSatisfactionTarget || '',
          profitMarginTarget: data.profitMarginTarget || ''
        });
      }
    } catch (error) {
      console.error('Failed to load targets:', error);
      showMessage('error', 'Failed to load current targets.');
    } finally {
      setLoading(false);
    }
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setTargets(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      dailySalesTarget: parseFloat(targets.dailySalesTarget) || 0,
      monthlySalesTarget: parseFloat(targets.monthlySalesTarget) || 0,
      fulfillmentHoursTarget: parseInt(targets.fulfillmentHoursTarget, 10) || 0,
      inventoryTurnoverTarget: parseFloat(targets.inventoryTurnoverTarget) || 0,
      customerSatisfactionTarget: parseFloat(targets.customerSatisfactionTarget) || 0,
      profitMarginTarget: parseFloat(targets.profitMarginTarget) || 0
    };
    try {
      await ceoService.updateTargets(payload);
      showMessage('success', 'Targets updated successfully.');
    } catch (error) {
      console.error('Failed to update targets:', error);
      showMessage('error', 'Failed to update targets. Please check your inputs.');
    } finally {
      setSaving(false);
    }
  };
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };
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
      <div className={styles.header}>
        <h1 className={styles.title}>Strategic Target Settings</h1>
        <p className={styles.subtitle}>Configure key performance indicator (KPI) targets</p>
      </div>
      {message && (
        <div className={`${styles.alert} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}
      <form className={styles.formContainer} onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          {}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Sales & Revenue</h2>
            <div className={styles.formGroup}>
              <label htmlFor="dailySalesTarget">Daily Sales Target ($)</label>
              <div className={styles.inputWrapper}>
                <span className={styles.currencySymbol}>$</span>
                <input
                  type="number"
                  id="dailySalesTarget"
                  name="dailySalesTarget"
                  value={targets.dailySalesTarget}
                  onChange={handleChange}
                  min="0"
                  step="100"
                  placeholder="e.g. 5000"
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="monthlySalesTarget">Monthly Sales Target ($)</label>
              <div className={styles.inputWrapper}>
                <span className={styles.currencySymbol}>$</span>
                <input
                  type="number"
                  id="monthlySalesTarget"
                  name="monthlySalesTarget"
                  value={targets.monthlySalesTarget}
                  onChange={handleChange}
                  min="0"
                  step="1000"
                  placeholder="e.g. 150000"
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="profitMarginTarget">Target Profit Margin (%)</label>
              <div className={styles.inputWrapper}>
                <input
                  type="number"
                  id="profitMarginTarget"
                  name="profitMarginTarget"
                  value={targets.profitMarginTarget}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="e.g. 25.5"
                />
                <span className={styles.percentSymbol}>%</span>
              </div>
            </div>
          </div>
          {}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Operations & Satisfaction</h2>
            <div className={styles.formGroup}>
              <label htmlFor="fulfillmentHoursTarget">Order Fulfillment Target (Hours)</label>
              <input
                type="number"
                id="fulfillmentHoursTarget"
                name="fulfillmentHoursTarget"
                value={targets.fulfillmentHoursTarget}
                onChange={handleChange}
                min="1"
                step="1"
                placeholder="e.g. 24"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="inventoryTurnoverTarget">Inventory Turnover Ratio</label>
              <input
                type="number"
                id="inventoryTurnoverTarget"
                name="inventoryTurnoverTarget"
                value={targets.inventoryTurnoverTarget}
                onChange={handleChange}
                min="0"
                step="0.1"
                placeholder="e.g. 5.5"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="customerSatisfactionTarget">Customer Satisfaction Target (%)</label>
              <div className={styles.inputWrapper}>
                <input
                  type="number"
                  id="customerSatisfactionTarget"
                  name="customerSatisfactionTarget"
                  value={targets.customerSatisfactionTarget}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="e.g. 95.0"
                />
                <span className={styles.percentSymbol}>%</span>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.formActions}>
          <button type="button" className={styles.cancelBtn} onClick={fetchTargets}>
            Discard Changes
          </button>
          <button type="submit" className={styles.saveBtn} disabled={saving}>
            {saving ? 'Saving...' : 'Save Target Configurations'}
          </button>
        </div>
      </form>
    </div>
  );
};
export default TargetSettings;
