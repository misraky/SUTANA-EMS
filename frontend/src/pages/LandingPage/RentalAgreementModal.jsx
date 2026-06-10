import React, { useState, useEffect } from 'react';
import { X, Calendar, User, FileText, CreditCard } from 'lucide-react';
import styles from './RentalAgreementModal.module.css';
import carService from '../../services/carService';

const RentalAgreementModal = ({ car, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    pickupDate: '',
    pickupTime: '10:00',
    returnDate: '',
    returnTime: '10:00',
    driverName: '',
    driverLicense: '',
    specialRequests: '',
    paymentMethod: 'Cash'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalDays, setTotalDays] = useState(0);

  const securityDeposit = 5000;

  useEffect(() => {
    if (formData.pickupDate && formData.returnDate) {
      const start = new Date(`${formData.pickupDate}T${formData.pickupTime}`);
      const end = new Date(`${formData.returnDate}T${formData.returnTime}`);
      const diffTime = end - start;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setTotalDays(diffDays > 0 ? diffDays : 0);
    } else {
      setTotalDays(0);
    }
  }, [formData.pickupDate, formData.pickupTime, formData.returnDate, formData.returnTime]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (totalDays <= 0) {
      setError('Return date/time must be after pickup date/time.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const pickupDateTime = new Date(`${formData.pickupDate}T${formData.pickupTime}`);
      const returnDateTime = new Date(`${formData.returnDate}T${formData.returnTime}`);

      const payload = {
        carId: car.id,
        pickupDate: pickupDateTime.toISOString(),
        returnDate: returnDateTime.toISOString(),
        driverName: formData.driverName,
        driverLicense: formData.driverLicense,
        specialRequests: formData.specialRequests,
        paymentMethod: formData.paymentMethod
      };

      const res = await carService.createRentalOrder(payload);
      if (res.status === 'success') {
        onSuccess(res.data);
      } else {
        setError('Failed to create reservation. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while creating the reservation.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !car) return null;

  const rentalTotal = totalDays * Number(car.dailyRate);
  const grandTotal = rentalTotal + securityDeposit;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>COMPLETE YOUR RENTAL RESERVATION</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.carSummary}>
          <strong>{car.name}</strong> | ETB {Number(car.dailyRate).toLocaleString()}/day | <span className={styles.available}>Available</span>
        </div>

        {error && <div className={styles.errorMsg}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          
          <div className={styles.formSection}>
            <h3><Calendar size={18} /> Rental Dates</h3>
            <div className={styles.inputGroup}>
              <label>Pickup Date & Time</label>
              <div className={styles.row}>
                <input type="date" name="pickupDate" value={formData.pickupDate} onChange={handleChange} required min={new Date().toISOString().split('T')[0]} />
                <input type="time" name="pickupTime" value={formData.pickupTime} onChange={handleChange} required />
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label>Return Date & Time</label>
              <div className={styles.row}>
                <input type="date" name="returnDate" value={formData.returnDate} onChange={handleChange} required min={formData.pickupDate || new Date().toISOString().split('T')[0]} />
                <input type="time" name="returnTime" value={formData.returnTime} onChange={handleChange} required />
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3><User size={18} /> Driver Information</h3>
            <div className={styles.inputGroup}>
              <label>Driver Full Name</label>
              <input type="text" name="driverName" value={formData.driverName} onChange={handleChange} required placeholder="Name exactly as on license" />
            </div>
            <div className={styles.inputGroup}>
              <label>Driver License #</label>
              <input type="text" name="driverLicense" value={formData.driverLicense} onChange={handleChange} required placeholder="License number" />
            </div>
          </div>

          <div className={styles.formSection}>
            <h3><FileText size={18} /> Additional Info</h3>
            <div className={styles.inputGroup}>
              <label>Special Requests (Optional)</label>
              <textarea name="specialRequests" value={formData.specialRequests} onChange={handleChange} rows="2" placeholder="e.g., Baby seat needed, airport pickup" />
            </div>
          </div>

          <div className={styles.summaryBox}>
            <h3>SUMMARY</h3>
            <div className={styles.summaryLine}>
              <span>{totalDays} days × ETB {Number(car.dailyRate).toLocaleString()}</span>
              <span>ETB {rentalTotal.toLocaleString()}</span>
            </div>
            <div className={styles.summaryLine}>
              <span>Security Deposit (refundable)</span>
              <span>ETB {securityDeposit.toLocaleString()}</span>
            </div>
            <hr />
            <div className={styles.totalLine}>
              <span>TOTAL TO PAY</span>
              <span>ETB {grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3><CreditCard size={18} /> Payment Method</h3>
            <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} required className={styles.paymentSelect}>
              <option value="Cash">Cash</option>
              <option value="Telebirr">Telebirr</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Credit Card">Credit Card</option>
            </select>
          </div>

          <div className={styles.modalActions}>
            <button type="submit" className={styles.submitBtn} disabled={loading || totalDays <= 0}>
              {loading ? 'Processing...' : 'SUBMIT RESERVATION'}
            </button>
            <button type="button" onClick={onClose} className={styles.cancelBtn} disabled={loading}>
              CANCEL
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RentalAgreementModal;
