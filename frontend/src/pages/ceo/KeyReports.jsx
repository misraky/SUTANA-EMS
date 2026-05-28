import React from 'react';
import styles from './KeyReports.module.css';
const KeyReports = () => {
  return (
    <div className={styles.reportsContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Key Reports</h1>
        <p className={styles.pageSubtitle}>View and export essential business reports</p>
      </div>
      <div className={styles.emptyState}>
        <div className={styles.iconWrapper}>📊</div>
        <h2>Reports Dashboard</h2>
        <p>Advanced reporting features are currently being configured.</p>
        <p className={styles.textMuted}>Please check back later or contact the system administrator for custom data exports.</p>
      </div>
    </div>
  );
};
export default KeyReports;
