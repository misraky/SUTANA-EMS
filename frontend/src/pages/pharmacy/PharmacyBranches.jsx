import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, MapPin } from 'lucide-react';
import pharmacyService from '../../services/pharmacyService';
import styles from './PharmacyCategories.module.css'; // Reusing similar table styles

const PharmacyBranches = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBranch, setCurrentBranch] = useState(null);

  const [formData, setFormData] = useState({
    branch_name: '',
    address: '',
    phone: '',
    alternate_phone: '',
    working_hours_monday_saturday: '',
    working_hours_sunday: '',
    emergency_phone: '',
    delivery_support_phone: '',
    latitude: '',
    longitude: '',
    display_order: 0,
    is_active: true
  });

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const res = await pharmacyService.getBranches();
      if (res.status === 'success') setBranches(res.data);
    } catch (error) {
      console.error('Failed to fetch branches:', error);
      alert('Error fetching branches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const openModal = (branch = null) => {
    if (branch) {
      setCurrentBranch(branch);
      setFormData({
        branch_name: branch.branch_name || '',
        address: branch.address || '',
        phone: branch.phone || '',
        alternate_phone: branch.alternate_phone || '',
        working_hours_monday_saturday: branch.working_hours_monday_saturday || '',
        working_hours_sunday: branch.working_hours_sunday || '',
        emergency_phone: branch.emergency_phone || '',
        delivery_support_phone: branch.delivery_support_phone || '',
        latitude: branch.latitude || '',
        longitude: branch.longitude || '',
        display_order: branch.display_order || 0,
        is_active: branch.is_active === 1 || branch.is_active === true
      });
    } else {
      setCurrentBranch(null);
      setFormData({
        branch_name: '', address: '', phone: '', alternate_phone: '',
        working_hours_monday_saturday: '', working_hours_sunday: '',
        emergency_phone: '', delivery_support_phone: '',
        latitude: '', longitude: '', display_order: 0, is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentBranch(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentBranch) {
        await pharmacyService.updateBranch(currentBranch.id, formData);
        alert('Branch updated successfully');
      } else {
        await pharmacyService.createBranch(formData);
        alert('Branch created successfully');
      }
      closeModal();
      fetchBranches();
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to save branch');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this branch?')) {
      try {
        await pharmacyService.deleteBranch(id);
        fetchBranches();
      } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete branch');
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Branches Management</h2>
        <button className={styles.addBtn} onClick={() => openModal()}>
          <Plus size={20} /> Add New Branch
        </button>
      </div>

      {loading ? (
        <p>Loading branches...</p>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Branch Name</th>
                <th>Contact Details</th>
                <th>Working Hours</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {branches.map(branch => (
                <tr key={branch.id}>
                  <td>
                    <div className={styles.catName} style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                      <MapPin size={16} color="#3b82f6" /> {branch.branch_name}
                    </div>
                    <div className={styles.catDesc}>{branch.address}</div>
                  </td>
                  <td>
                    <div style={{fontSize: '13px'}}><strong>Phone:</strong> {branch.phone}</div>
                    <div style={{fontSize: '13px', color: '#64748b'}}><strong>Emergency:</strong> {branch.emergency_phone}</div>
                  </td>
                  <td>
                    <div style={{fontSize: '13px'}}><strong>Mon-Sat:</strong> {branch.working_hours_monday_saturday}</div>
                    <div style={{fontSize: '13px', color: '#64748b'}}><strong>Sun:</strong> {branch.working_hours_sunday}</div>
                  </td>
                  <td>
                    <span className={branch.is_active ? styles.statusActive : styles.statusInactive}>
                      {branch.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button className={styles.iconBtn} onClick={() => openModal(branch)}><Edit size={18} /></button>
                    <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => handleDelete(branch.id)}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} style={{ maxWidth: '600px' }}>
            <div className={styles.modalHeader}>
              <h3>{currentBranch ? 'Edit Branch' : 'Add Branch'}</h3>
              <button className={styles.closeBtn} onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Branch Name *</label>
                <input type="text" name="branch_name" value={formData.branch_name} onChange={handleInputChange} required />
              </div>
              
              <div className={styles.formGroup}>
                <label>Address *</label>
                <textarea name="address" value={formData.address} onChange={handleInputChange} rows="2" required />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Primary Phone *</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} required />
                </div>
                <div className={styles.formGroup}>
                  <label>Alternate Phone</label>
                  <input type="text" name="alternate_phone" value={formData.alternate_phone} onChange={handleInputChange} />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Emergency Phone</label>
                  <input type="text" name="emergency_phone" value={formData.emergency_phone} onChange={handleInputChange} />
                </div>
                <div className={styles.formGroup}>
                  <label>Delivery Support</label>
                  <input type="text" name="delivery_support_phone" value={formData.delivery_support_phone} onChange={handleInputChange} />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Working Hours (Mon-Sat)</label>
                  <input type="text" name="working_hours_monday_saturday" value={formData.working_hours_monday_saturday} onChange={handleInputChange} />
                </div>
                <div className={styles.formGroup}>
                  <label>Working Hours (Sunday)</label>
                  <input type="text" name="working_hours_sunday" value={formData.working_hours_sunday} onChange={handleInputChange} />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Latitude (optional)</label>
                  <input type="number" step="any" name="latitude" value={formData.latitude} onChange={handleInputChange} />
                </div>
                <div className={styles.formGroup}>
                  <label>Longitude (optional)</label>
                  <input type="number" step="any" name="longitude" value={formData.longitude} onChange={handleInputChange} />
                </div>
              </div>

              <div className={styles.checkboxGroup}>
                <label>
                  <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} />
                  Active
                </label>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={closeModal}>Cancel</button>
                <button type="submit" className={styles.saveBtn}>Save Branch</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyBranches;
