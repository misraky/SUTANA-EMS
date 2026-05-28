import React, { useState } from 'react';
import Modal from '../../components/ui/Modal';
import financeService from '../../services/financeService';
const RecordExpenseModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    paymentMethodId: '',
    referenceNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Mock categories and methods for now. In a real scenario, these should be fetched from the API.
  const categories = [
    { id: 1, name: 'Utility' },
    { id: 2, name: 'Salary' },
    { id: 3, name: 'Rent' },
    { id: 4, name: 'Supplies' },
    { id: 5, name: 'Maintenance' },
    { id: 6, name: 'Other' }
  ];
  const paymentMethods = [
    { id: 1, name: 'Cash' },
    { id: 2, name: 'Credit' },
    { id: 3, name: 'Bank Transfer' },
    { id: 4, name: 'Telebirr' },
    { id: 5, name: 'Check' }
  ];
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await financeService.createExpense(formData);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record expense');
    } finally {
      setLoading(false);
    }
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record New Expense">
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message mb-4">{error}</div>}
        <div className="grid-2 gap-4 mb-4">
          <div className="form-group">
            <label>Category</label>
            <select 
              name="categoryId" 
              value={formData.categoryId} 
              onChange={handleChange}
              required
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Amount (ETB)</label>
            <input 
              type="number" 
              name="amount" 
              value={formData.amount} 
              onChange={handleChange} 
              required 
              min="0.01" 
              step="0.01" 
            />
          </div>
        </div>
        <div className="grid-2 gap-4 mb-4">
          <div className="form-group">
            <label>Date</label>
            <input 
              type="date" 
              name="date" 
              value={formData.date} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Payment Method</label>
            <select 
              name="paymentMethodId" 
              value={formData.paymentMethodId} 
              onChange={handleChange}
              required
            >
              <option value="">Select Method</option>
              {paymentMethods.map(method => (
                <option key={method.id} value={method.id}>{method.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group mb-4">
          <label>Description</label>
          <textarea 
            name="description" 
            value={formData.description} 
            onChange={handleChange} 
            required
            rows="3"
            className="w-full"
            placeholder="Detailed description of the expense..."
          />
        </div>
        <div className="form-group mb-4">
          <label>Reference Number (Optional)</label>
          <input 
            type="text" 
            name="referenceNumber" 
            value={formData.referenceNumber} 
            onChange={handleChange} 
            placeholder="e.g. Receipt No. or Transaction ID"
            className="w-full"
          />
        </div>
        <div className="modal-form-actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Recording...' : 'Record Expense'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
export default RecordExpenseModal;
