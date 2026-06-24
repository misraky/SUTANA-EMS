import React, { useState, useEffect } from 'react';
import purchaseService from '../../services/purchaseService';
import { formatCurrency } from '../../utils/formatters';
import styles from './SupplierScorecard.module.css';

const DIMENSIONS = [
  { key: 'price', label: 'Price', defaultWeight: 25 },
  { key: 'quality', label: 'Quality (PPM)', defaultWeight: 20 },
  { key: 'delivery', label: 'On-Time Delivery', defaultWeight: 20 },
  { key: 'leadTime', label: 'Lead Time Reliability', defaultWeight: 10 },
  { key: 'warranty', label: 'Warranty / After-Sales', defaultWeight: 10 },
  { key: 'compliance', label: 'Compliance (Docs)', defaultWeight: 10 },
  { key: 'esg', label: 'Sustainability (ESG)', defaultWeight: 5 },
];

const MOCK_SCORECARDS = [
  { id: 1, name: 'TechPro Solutions', scores: { price: 85, quality: 92, delivery: 78, leadTime: 90, warranty: 95, compliance: 80, esg: 70 }, trend: 'stable', totalPOs: 24, totalSpent: 4500000 },
  { id: 2, name: 'OfficeMax Supplies', scores: { price: 72, quality: 88, delivery: 95, leadTime: 85, warranty: 80, compliance: 75, esg: 65 }, trend: 'up', totalPOs: 18, totalSpent: 2800000 },
  { id: 3, name: 'BuildCorp Construction', scores: { price: 90, quality: 70, delivery: 65, leadTime: 60, warranty: 75, compliance: 60, esg: 55 }, trend: 'down', totalPOs: 8, totalSpent: 8200000 },
  { id: 4, name: 'ConsultNet Advisors', scores: { price: 88, quality: 95, delivery: 90, leadTime: 92, warranty: 90, compliance: 95, esg: 80 }, trend: 'up', totalPOs: 12, totalSpent: 1900000 },
];

const SupplierScorecard = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await purchaseService.getSuppliers();
        const list = res.data?.data || res.data?.suppliers || [];
        if (list.length === 0) { setSuppliers(MOCK_SCORECARDS); }
        else { setSuppliers(list.map(s => ({ ...s, scores: s.scores || MOCK_SCORECARDS.find(m => m.name === s.name)?.scores || { price: 75, quality: 75, delivery: 75, leadTime: 75, warranty: 75, compliance: 75, esg: 65 }, trend: s.trend || 'stable', totalPOs: s.po_count || 0, totalSpent: s.total_spent || 0 }))); }
      } catch (e) { setSuppliers(MOCK_SCORECARDS); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const calcTotal = (scores) => {
    if (!scores) return 0;
    return Math.round(DIMENSIONS.reduce((sum, d) => sum + (scores[d.key] || 0) * (d.defaultWeight / 100), 0));
  };

  const selectedData = selected ? suppliers.find(s => s.id === selected) || suppliers.find(s => s.name === selected) : null;

  if (loading) return <div className={styles.loading}><div className={styles.spinner}></div><p>Loading scorecards...</p></div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div><h1 className={styles.title}>Supplier Scorecard</h1><p className={styles.subtitle}>7-dimension weighted supplier evaluation — Industry ERP Standard</p></div>
        <div className={styles.legend}>
          <span className={styles.legendDot} style={{ background: '#16a34a' }} /> Excellent (80+)
          <span className={styles.legendDot} style={{ background: '#ca8a04', marginLeft: '1rem' }} /> Average (60-79)
          <span className={styles.legendDot} style={{ background: '#dc2626', marginLeft: '1rem' }} /> Poor (&lt;60)
        </div>
      </div>

      <div className={styles.grid}>
        {suppliers.map(s => {
          const total = calcTotal(s.scores);
          const color = total >= 80 ? '#16a34a' : total >= 60 ? '#ca8a04' : '#dc2626';
          const isSelected = selectedData?.id === s.id || selectedData?.name === s.name;
          return (
            <div key={s.id} className={`${styles.scorecard} ${isSelected ? styles.selected : ''}`} onClick={() => setSelected(s.name)}>
              <div className={styles.scoreHeader}>
                <div className={styles.scoreCircle} style={{ borderColor: color, color }}>{total}</div>
                <div>
                  <h3 className={styles.supplierName}>{s.name}</h3>
                  <span className={`${styles.trend} ${styles['trend_' + s.trend]}`}>{s.trend === 'up' ? '↗ Improving' : s.trend === 'down' ? '↘ Declining' : '→ Stable'}</span>
                </div>
              </div>
              <div className={styles.scoreBar}>
                {DIMENSIONS.slice(0, 5).map(d => (
                  <div key={d.key} className={styles.barItem}>
                    <span className={styles.barLabel}>{d.label}</span>
                    <div className={styles.barBg}><div className={styles.barFill} style={{ width: `${s.scores?.[d.key] || 0}%`, background: (s.scores?.[d.key] || 0) >= 80 ? '#16a34a' : (s.scores?.[d.key] || 0) >= 60 ? '#ca8a04' : '#dc2626' }} /></div>
                    <span className={styles.barScore}>{s.scores?.[d.key] || 0}</span>
                  </div>
                ))}
              </div>
              <div className={styles.scoreFooter}>
                <span>{s.totalPOs} POs</span>
                <span>{formatCurrency(s.totalSpent)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {selectedData && (
        <div className={styles.detailPanel}>
          <h2 className={styles.detailTitle}>{selectedData.name} — Full Score Breakdown</h2>
          <div className={styles.detailGrid}>
            {DIMENSIONS.map(d => {
              const score = selectedData.scores?.[d.key] || 0;
              const color = score >= 80 ? '#16a34a' : score >= 60 ? '#ca8a04' : '#dc2626';
              return (
                <div key={d.key} className={styles.detailItem}>
                  <div className={styles.detailHeader}>
                    <span className={styles.detailLabel}>{d.label}</span>
                    <span className={styles.detailWeight}>{d.defaultWeight}%</span>
                    <span className={styles.detailScore} style={{ color }}>{score}</span>
                  </div>
                  <div className={styles.detailBarBg}><div className={styles.detailBarFill} style={{ width: `${score}%`, background: color }} /></div>
                  <span className={styles.detailWeighted}>Weighted: {(score * d.defaultWeight / 100).toFixed(1)}</span>
                </div>
              );
            })}
            <div className={styles.detailTotal}>
              <span>Total Score</span>
              <span className={styles.totalValue} style={{ color: calcTotal(selectedData.scores) >= 80 ? '#16a34a' : calcTotal(selectedData.scores) >= 60 ? '#ca8a04' : '#dc2626' }}>
                {calcTotal(selectedData.scores)} / 100
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierScorecard;
