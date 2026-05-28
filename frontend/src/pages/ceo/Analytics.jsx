import React, { useState, useEffect } from 'react';
import ceoService from '../../services/ceoService';
import styles from './Analytics.module.css';
const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    historicalRevenue: [],
    sectors: [],
    customerGrowth: 0
  });
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [overviewRes, revenueRes] = await Promise.all([
          ceoService.getDashboardOverview(),
          ceoService.getRevenueBreakdown('year')
        ]);
        setData({
          historicalRevenue: revenueRes.data?.data?.historical || [],
          sectors: overviewRes.data?.data?.profit?.sectors || [],
          customerGrowth: overviewRes.data?.data?.kpis?.customerSatisfaction?.actual || 0
        });
      } catch (err) {
        console.error('Failed to load deep analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);
  if (loading) return <div className={styles.loadingContainer}>Loading deep analytics...</div>;
  const maxRevenue = data.historicalRevenue.length > 0 
    ? Math.max(...data.historicalRevenue.map(item => item.revenue)) 
    : 100;
  const activeSectors = data.sectors.filter(s => s.revenue > 0 || s.margin > 0);
  return (
    <div className={styles.analyticsContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Deep Analytics</h1>
        <p className={styles.pageSubtitle}>Comprehensive data analysis for business intelligence</p>
      </div>
      <div className={styles.analyticsGrid}>
        <div className={`${styles.card} ${styles.chartLarge}`}>
          <h2 className={styles.cardTitle}>Monthly Revenue Trends</h2>
          {data.historicalRevenue.length > 0 ? (
            <div className={styles.placeholderChart}>
              {data.historicalRevenue.map((item, idx) => {
                const heightPercent = item.revenue > 0 ? Math.max((item.revenue / maxRevenue) * 100, 5) : 5;
                return (
                  <div 
                    key={idx} 
                    className={styles.chartBar} 
                    style={{ height: `${heightPercent}%` }}
                    title={`${item.date}: $${item.revenue.toLocaleString()}`}
                  ></div>
                );
              })}
            </div>
          ) : (
            <div className={styles.placeholderChart}>
               <p style={{margin: 'auto', color: '#6b7280'}}>No historical revenue data available.</p>
            </div>
          )}
          <p className={styles.chartHelpText}>Revenue overview based on completed sales orders.</p>
        </div>
        <div className={styles.subGrid}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Profit Margins by Sector</h2>
            {activeSectors.length > 0 ? activeSectors.map((sector, idx) => (
              <div className={styles.dataRow} key={idx}>
                <span className={styles.rowLabel}>{sector.name}</span>
                <div className={styles.progressBarBg}>
                  <div 
                    className={styles.progressBarFill} 
                    style={{ width: `${Math.min(sector.margin, 100)}%`, background: sector.name === 'Printing' ? '#3b82f6' : '#10b981' }}
                  ></div>
                </div>
                <span className={styles.rowValue}>{sector.margin}%</span>
              </div>
            )) : (
              <p style={{color: '#6b7280', fontSize: '14px', marginTop: '20px'}}>No sector profit data available for the current period.</p>
            )}
          </div>
          <div className={`${styles.card} ${styles.highlightCard}`}>
            <h2 className={styles.cardTitle}>Customer Satisfaction Target</h2>
            <div className={styles.bigNumber}>{data.customerGrowth}%</div>
            <p className={styles.highlightText}>Current overall completion and satisfaction rate.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Analytics;
