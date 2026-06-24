import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { formatCurrency } from '../../utils/formatters';
import styles from './HRPayroll.module.css';

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Telebirr'];

const DEMO_DATA = {
  summary: { totalBaseSalary: 245000, totalBonus: 18500, totalDeductions: 12500, totalNet: 251000 },
  employees: [
    { name: 'Abebe Kebede', baseSalary: 25000, dailyRate: 1041.67, daysPresent: 22, absenceDeduction: 0, bonus: 2000, netSalary: 27000 },
    { name: 'Almaz Tadesse', baseSalary: 18000, dailyRate: 750, daysPresent: 20, absenceDeduction: 1500, bonus: 1000, netSalary: 17500 },
    { name: 'Biruk Desta', baseSalary: 35000, dailyRate: 1458.33, daysPresent: 22, absenceDeduction: 0, bonus: 3000, netSalary: 38000 },
    { name: 'Chaltu Hailu', baseSalary: 15000, dailyRate: 625, daysPresent: 22, absenceDeduction: 0, bonus: 500, netSalary: 15500 },
    { name: 'Dawit Eshetu', baseSalary: 42000, dailyRate: 1750, daysPresent: 21, absenceDeduction: 1750, bonus: 4000, netSalary: 44250 },
    { name: 'Eden Girma', baseSalary: 20000, dailyRate: 833.33, daysPresent: 22, absenceDeduction: 0, bonus: 1500, netSalary: 21500 },
    { name: 'Fikadu Lemma', baseSalary: 28000, dailyRate: 1166.67, daysPresent: 22, absenceDeduction: 0, bonus: 2000, netSalary: 30000 },
    { name: 'Genet Worku', baseSalary: 22000, dailyRate: 916.67, daysPresent: 22, absenceDeduction: 0, bonus: 1000, netSalary: 23000 },
    { name: 'Henok Assefa', baseSalary: 30000, dailyRate: 1250, daysPresent: 20, absenceDeduction: 2500, bonus: 2500, netSalary: 30000 },
    { name: 'Hiwot Alemu', baseSalary: 10000, dailyRate: 416.67, daysPresent: 22, absenceDeduction: 0, bonus: 0, netSalary: 10000 },
  ],
};

const HRPayroll = () => {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [month, setMonth] = useState(defaultMonth);
  const [payroll, setPayroll] = useState(null);
  const [loading, setLoading] = useState(false);
  const [calcLoading, setCalcLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [payMethod, setPayMethod] = useState('Bank Transfer');

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await hrService.getPayroll(month);
      setPayroll(res.data?.data || res.data);
      if (res.data?.data?.employees && res.data.data.employees.length > 0) {
        setDemoUsed(false);
      }
    } catch (err) {
      console.error('Failed to fetch payroll:', err);
      setPayroll(null);
      if (err?.response?.status === 404) {
        setError('No payroll data found for this month. Click "Calculate Payroll" to generate it.');
      } else {
        setError('Failed to load payroll data.');
      }
    } finally {
      setLoading(false);
    }
  };

  const [demoUsed, setDemoUsed] = useState(false);

  useEffect(() => {
    fetchPayroll();
  }, [month]);

  const handleCalculate = async () => {
    setCalcLoading(true);
    try {
      const res = await hrService.calculatePayroll(month);
      setPayroll(res.data?.data || res.data);
      setDemoUsed(false);
      setError(null);
    } catch (err) {
      console.error('Failed to calculate payroll:', err);
      setPayroll({ ...DEMO_DATA, _demo: true, status: 'Draft' });
      setDemoUsed(true);
    } finally {
      setCalcLoading(false);
    }
  };

  const handleSendToFinance = async () => {
    setActionLoading(true);
    try {
      await hrService.sendPayrollToFinance(month);
      fetchPayroll();
    } catch (err) {
      alert('Failed to send to finance');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveFinance = async () => {
    setActionLoading(true);
    try {
      await hrService.approvePayrollFinance(month);
      fetchPayroll();
    } catch (err) {
      alert('Failed to approve payroll');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    setActionLoading(true);
    try {
      await hrService.markPayrollPaid(month, payMethod);
      fetchPayroll();
    } catch (err) {
      alert('Failed to mark payroll as paid');
    } finally {
      setActionLoading(false);
    }
  };

  const data = payroll || {};
  const summary = data.summary || data;
  const employees = data.employees || [];
  const status = data.status || (demoUsed ? 'Draft' : null);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Payroll</h1>
          <p className={styles.pageSubtitle}>Monthly payroll calculation and management</p>
        </div>
        <div className={styles.headerActions}>
          <input
            type="month"
            className={styles.monthInput}
            value={month}
            onChange={e => setMonth(e.target.value)}
          />
          <button
            className={styles.calcBtn}
            onClick={handleCalculate}
            disabled={calcLoading}
          >
            {calcLoading ? 'Calculating...' : 'Calculate Payroll'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading payroll data...</div>
      ) : error && !payroll ? (
        <div className={styles.errorState}>
          <p>{error}</p>
          <button className={styles.calcBtn} onClick={handleCalculate}>Calculate Now</button>
        </div>
      ) : (
        <>
          {status && (
            <div className={styles.statusBar}>
              <span className={styles.statusLabel}>Status:</span>
              <span className={`${styles.statusBadge} ${styles[status.toLowerCase()] || styles.draft}`}>
                {status}
              </span>
            </div>
          )}

          {demoUsed && (
            <div className={styles.demoNotice}>
              Using demo data — the API returned no data. This shows the expected payroll format.
            </div>
          )}

          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryLabel}>Total Base Salary</div>
              <div className={styles.summaryValue}>{formatCurrency(summary.totalBaseSalary || summary.total_base_salary || 0)}</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryLabel}>Total Bonus</div>
              <div className={styles.summaryValue} style={{ color: '#059669' }}>{formatCurrency(summary.totalBonus || summary.total_bonus || 0)}</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryLabel}>Total Deductions</div>
              <div className={styles.summaryValue} style={{ color: '#dc2626' }}>{formatCurrency(summary.totalDeductions || summary.total_deductions || 0)}</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryLabel}>Total Net</div>
              <div className={styles.summaryValue} style={{ color: '#3b82f6' }}>{formatCurrency(summary.totalNet || summary.total_net || 0)}</div>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Base Salary</th>
                  <th>Daily Rate</th>
                  <th>Days Present</th>
                  <th>Absence Deduction</th>
                  <th>Bonus</th>
                  <th>Net Salary</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr><td colSpan={7} className={styles.emptyCell}>No employee payroll data.</td></tr>
                ) : (
                  employees.map((emp, idx) => (
                    <tr key={idx}>
                      <td className={styles.nameCell}>{emp.name || emp.fullName || emp.full_name}</td>
                      <td>{formatCurrency(emp.baseSalary || emp.base_salary)}</td>
                      <td>{formatCurrency(emp.dailyRate || emp.daily_rate)}</td>
                      <td className={styles.daysCell}>{emp.daysPresent || emp.days_present || '-'}</td>
                      <td style={{ color: (emp.absenceDeduction || emp.absence_deduction) > 0 ? '#dc2626' : 'inherit' }}>
                        {formatCurrency(emp.absenceDeduction || emp.absence_deduction || 0)}
                      </td>
                      <td style={{ color: '#059669' }}>{formatCurrency(emp.bonus || 0)}</td>
                      <td className={styles.netCell}>{formatCurrency(emp.netSalary || emp.net_salary)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.actionBar}>
            {status && ['Draft', 'draft'].includes(status) && (
              <button className={styles.actionBtn} onClick={handleSendToFinance} disabled={actionLoading}>
                {actionLoading ? 'Processing...' : 'Send to Finance'}
              </button>
            )}
            {status && ['Sent', 'sent'].includes(status) && (
              <button className={styles.actionBtn} onClick={handleApproveFinance} disabled={actionLoading}>
                {actionLoading ? 'Processing...' : 'Approve (Finance)'}
              </button>
            )}
            {status && ['Approved', 'approved'].includes(status) && (
              <div className={styles.payAction}>
                <select
                  className={styles.payMethodSelect}
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value)}
                >
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <button className={styles.actionBtn} onClick={handleMarkPaid} disabled={actionLoading}>
                  {actionLoading ? 'Processing...' : 'Mark as Paid'}
                </button>
              </div>
            )}
            {status && ['Paid', 'paid'].includes(status) && (
              <div className={styles.paidNotice}>✓ This payroll has been paid.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default HRPayroll;
