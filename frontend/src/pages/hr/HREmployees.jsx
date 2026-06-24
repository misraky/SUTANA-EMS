import React, { useState, useEffect } from 'react';
import hrService from '../../services/hrService';
import { formatCurrency } from '../../utils/formatters';
import styles from './HREmployees.module.css';

const DEPARTMENTS = ['Printing', 'Pharmacy', 'Car Rental', 'Farming', 'Retail', 'Admin', 'IT'];
const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Telebirr'];
const WORK_TYPES = ['Office', 'Field'];
const INIT_FORM = {
  fullName: '', email: '', phone: '', position: '', department: 'Admin',
  baseSalary: '', allowance: '', standingDeduction: '', paymentMethod: 'Bank Transfer',
  bankAccount: '', workType: 'Office', checkInTime: '08:00', checkOutTime: '17:00',
};

const HREmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(INIT_FORM);
  const [saving, setSaving] = useState(false);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await hrService.getEmployees({ search });
      setEmployees(res.data?.data?.employees || res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search]);

  const openCreate = () => {
    setEditing(null);
    setForm(INIT_FORM);
    setShowModal(true);
  };

  const openEdit = (emp) => {
    setEditing(emp.id || emp.employeeId);
    setForm({
      fullName: emp.fullName || emp.full_name || '',
      email: emp.email || '',
      phone: emp.phone || '',
      position: emp.position || '',
      department: emp.department || 'Admin',
      baseSalary: emp.baseSalary || emp.base_salary || '',
      allowance: emp.allowance || '',
      standingDeduction: emp.standingDeduction || emp.standing_deduction || '',
      paymentMethod: emp.paymentMethod || emp.payment_method || 'Bank Transfer',
      bankAccount: emp.bankAccount || emp.bank_account || '',
      workType: emp.workType || emp.work_type || 'Office',
      checkInTime: emp.checkInTime || emp.check_in_time || '08:00',
      checkOutTime: emp.checkOutTime || emp.check_out_time || '17:00',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await hrService.updateEmployee(editing, form);
      } else {
        await hrService.createEmployee(form);
      }
      setShowModal(false);
      fetchEmployees();
    } catch (err) {
      alert('Failed to save employee');
    } finally {
      setSaving(false);
    }
  };

  const filtered = employees.filter(e =>
    (e.fullName || e.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.employeeId || e.employee_id || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Employees</h1>
          <p className={styles.pageSubtitle}>{employees.length} employees registered</p>
        </div>
        <button className={styles.addBtn} onClick={openCreate}>+ Add Employee</button>
      </div>

      <div className={styles.searchBar}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search by name or ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className={styles.loading}>Loading employees...</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Position</th>
                <th>Base Salary</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className={styles.emptyCell}>No employees found.</td></tr>
              ) : (
                filtered.map((emp, idx) => (
                  <tr key={idx}>
                    <td className={styles.idCell}>{emp.employeeId || emp.employee_id || '-'}</td>
                    <td className={styles.nameCell}>{emp.fullName || emp.full_name}</td>
                    <td>{emp.department}</td>
                    <td>{emp.position}</td>
                    <td className={styles.salaryCell}>{formatCurrency(emp.baseSalary || emp.base_salary)}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${(emp.status || 'Active').toLowerCase() === 'active' ? styles.active : styles.inactive}`}>
                        {emp.status || 'Active'}
                      </span>
                    </td>
                    <td>
                      <button className={styles.editBtn} onClick={() => openEdit(emp)}>Edit</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editing ? 'Edit Employee' : 'Add Employee'}</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Full Name</label>
                    <input className={styles.formInput} value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} required />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Email</label>
                    <input type="email" className={styles.formInput} value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Phone</label>
                    <input className={styles.formInput} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Position</label>
                    <input className={styles.formInput} value={form.position} onChange={e => setForm({...form, position: e.target.value})} required />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Department</label>
                    <select className={styles.formInput} value={form.department} onChange={e => setForm({...form, department: e.target.value})}>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Base Salary</label>
                    <input type="number" className={styles.formInput} value={form.baseSalary} onChange={e => setForm({...form, baseSalary: e.target.value})} required />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Allowance</label>
                    <input type="number" className={styles.formInput} value={form.allowance} onChange={e => setForm({...form, allowance: e.target.value})} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Standing Deduction</label>
                    <input type="number" className={styles.formInput} value={form.standingDeduction} onChange={e => setForm({...form, standingDeduction: e.target.value})} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Payment Method</label>
                    <select className={styles.formInput} value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})}>
                      {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Bank Account</label>
                    <input className={styles.formInput} value={form.bankAccount} onChange={e => setForm({...form, bankAccount: e.target.value})} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Work Type</label>
                    <select className={styles.formInput} value={form.workType} onChange={e => setForm({...form, workType: e.target.value})}>
                      {WORK_TYPES.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Check In Time</label>
                    <input type="time" className={styles.formInput} value={form.checkInTime} onChange={e => setForm({...form, checkInTime: e.target.value})} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Check Out Time</label>
                    <input type="time" className={styles.formInput} value={form.checkOutTime} onChange={e => setForm({...form, checkOutTime: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={styles.submitBtn} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HREmployees;
