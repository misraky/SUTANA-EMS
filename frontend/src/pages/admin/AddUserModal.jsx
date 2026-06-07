import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import apiClient from '../../services/apiClient';
const AddUserModal = ({ isOpen, onClose, onSuccess, initialData = null }) => {
  const [formData, setFormData] = useState(initialData || {
    fullName: '',
    email: '',
    phone: '',
    departmentId: '',
    roleIds: []
  });
  const [departments, setDepartments] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => {
    if (isOpen) {
      fetchDropdownData();
    }
  }, [isOpen]);
  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        departmentId: initialData.departmentId || '',
        roleIds: initialData.roles ? initialData.roles.map(r => r.id || r) : []
      });
    } else {
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        departmentId: departments.length > 0 ? departments[0].id : '',
        roleIds: []
      });
    }
  }, [initialData, departments, isOpen]);
  const fetchDropdownData = async () => {
    try {
      const [deptRes, roleRes] = await Promise.all([
        apiClient.get('/users/departments'),
        apiClient.get('/users/roles')
      ]);
      setDepartments(deptRes.data.departments || []);
      setRolesList(deptRes.data.roles || roleRes.data.roles || []); 
    } catch (err) {
      console.error('Failed to fetch departments/roles', err);
    }
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  const handleRoleChange = (e) => {
    const selectedRoleId = Number(e.target.value);
    setFormData(prev => {
      const newData = { ...prev, roleIds: [selectedRoleId] };
      // Try to auto-select department based on role name
      const selectedRole = rolesList.find(r => r.id === selectedRoleId);
      if (selectedRole) {
        // Find a matching department
        // e.g. "Farming Manager" -> "Farming"
        const matchingDept = departments.find(d => 
          selectedRole.name.toLowerCase().includes(d.name.toLowerCase()) || 
          d.name.toLowerCase().includes(selectedRole.name.toLowerCase().split(' ')[0])
        );
        if (matchingDept) {
          newData.departmentId = matchingDept.id;
        }
      }
      return newData;
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (initialData) {
        await apiClient.put(`/users/${initialData.id}`, formData);
      } else {
        await apiClient.post('/users', formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={initialData ? 'Edit User' : 'Add New User'}
    >
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message mb-4" style={{color: 'red'}}>{error}</div>}
        <div className="form-group mb-4">
          <label>Full Name</label>
          <input 
            type="text" 
            name="fullName" 
            value={formData.fullName} 
            onChange={handleChange} 
            required 
            className="w-full"
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>
        <div className="grid-2 gap-4 mb-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              required 
              disabled={!!initialData}
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input 
              type="text" 
              name="phone" 
              value={formData.phone} 
              onChange={handleChange} 
              required 
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
        </div>
        <div className="grid-2 gap-4 mb-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group">
            <label>Department</label>
            <select 
              name="departmentId" 
              value={formData.departmentId} 
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="">Select Department</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
          {!initialData && (
            <div className="form-group">
              <label>Initial Password</label>
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  value={formData.password || ''} 
                  onChange={handleChange} 
                  required 
                  minLength={8}
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', borderRadius: '4px', border: '1px solid #ddd' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '10px', top: '15px', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="form-group mb-4">
          <label>Role</label>
          <select 
            name="roleIds" 
            value={formData.roleIds.length > 0 ? formData.roleIds[0] : ''} 
            onChange={handleRoleChange}
            required
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="">Select Role</option>
            {rolesList.map(role => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>
        </div>
        <div className="modal-form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
          <button type="button" onClick={onClose} disabled={loading} style={{ padding: '0.5rem 1rem', background: '#f3f4f6', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Cancel
          </button>
          <button type="submit" disabled={loading} style={{ padding: '0.5rem 1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            {loading ? 'Saving...' : 'Save User'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
export default AddUserModal;
