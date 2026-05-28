import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import printingService from '../../services/printingService';
import { formatCurrency } from '../../utils/formatters';
import styles from './CreateOrder.module.css';
const CreateOrder = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    customer: {
      name: '',
      phone: '',
      customerTypeId: 1 // Default to general public/student
    },
    productType: 'Book',
    quantity: 1,
    paperType: 'A4',
    pagesPerCopy: 1,
    colorPrinting: false,
    bindingType: 'None',
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], 
    specialInstructions: ''
  });
  const [priceEstimate, setPriceEstimate] = useState(0);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    // Debounce price calculation
    const timer = setTimeout(() => {
      calculatePriceEstimate();
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.productType, formData.quantity, formData.paperType, formData.pagesPerCopy, formData.colorPrinting, formData.bindingType]);
  const calculatePriceEstimate = async () => {
    if (!formData.quantity || !formData.pagesPerCopy) return;
    setCalculating(true);
    try {
      const response = await printingService.calculatePrice({
        paperType: formData.paperType,
        pagesPerCopy: formData.pagesPerCopy,
        quantity: formData.quantity,
        colorPrinting: formData.colorPrinting,
        bindingType: formData.bindingType
      });
      setPriceEstimate(response.data?.estimatedPrice || 0);
    } catch (err) {
      console.error('Failed to calculate price:', err);
      // Fallback rough estimate if API fails
      let base = formData.pagesPerCopy * formData.quantity * 2;
      if (formData.colorPrinting) base *= 3;
      if (formData.bindingType !== 'None') base += (50 * formData.quantity);
      setPriceEstimate(base);
    } finally {
      setCalculating(false);
    }
  };
  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      customer: { ...prev.customer, [name]: value }
    }));
  };
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        quantity: parseInt(formData.quantity, 10),
        pagesPerCopy: parseInt(formData.pagesPerCopy, 10),
        customer: {
          ...formData.customer,
          customerTypeId: parseInt(formData.customer.customerTypeId, 10)
        }
      };
      const res = await printingService.createOrder(payload);
      navigate(`/printing/orders/${res.data?.orderId || ''}`);
    } catch (err) {
      console.error('Failed to create order:', err);
      setError(err.response?.data?.message || 'Failed to create the order. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleContainer}>
          <button className={styles.backBtn} onClick={() => navigate('/printing/orders')}>
            &larr; Back
          </button>
          <div>
            <h1 className={styles.title}>Create New Order</h1>
            <p className={styles.subtitle}>Enter details to generate a new printing production ticket</p>
          </div>
        </div>
      </div>
      {error && (
        <div className={styles.alertError}>
          {error}
        </div>
      )}
      <div className={styles.layout}>
        <form className={styles.formContainer} onSubmit={handleSubmit}>
          {}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>1. Customer Details</h2>
            <div className={styles.grid}>
              <div className={styles.formGroup}>
                <label>Customer Name</label>
                <input 
                  type="text" name="name" required
                  value={formData.customer.name} onChange={handleCustomerChange}
                  placeholder="Full Name or Department"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Phone Number</label>
                <input 
                  type="text" name="phone" required pattern="^09[0-9]{8}$"
                  value={formData.customer.phone} onChange={handleCustomerChange}
                  placeholder="09XXXXXXXX"
                />
              </div>
            </div>
          </div>
          {}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>2. Product Specifications</h2>
            <div className={styles.grid}>
              <div className={styles.formGroup}>
                <label>Product Type</label>
                <select name="productType" value={formData.productType} onChange={handleChange}>
                  <option value="Book">Book</option>
                  <option value="Module">Module</option>
                  <option value="Exam">Exam Paper</option>
                  <option value="Brochure">Brochure / Flyer</option>
                  <option value="TaxReceipt">Tax Receipt Pad</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Paper Size</label>
                <select name="paperType" value={formData.paperType} onChange={handleChange}>
                  <option value="A4">A4 (Standard)</option>
                  <option value="A3">A3 (Large)</option>
                  <option value="A5">A5 (Half-size)</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Pages Per Copy</label>
                <input 
                  type="number" name="pagesPerCopy" min="1" required
                  value={formData.pagesPerCopy} onChange={handleChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Number of Copies (Quantity)</label>
                <input 
                  type="number" name="quantity" min="1" required
                  value={formData.quantity} onChange={handleChange}
                />
              </div>
            </div>
            <div className={styles.optionsGrid}>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" name="colorPrinting"
                  checked={formData.colorPrinting} onChange={handleChange}
                />
                <div className={styles.checkboxText}>
                  <strong>Color Printing</strong>
                  <span>Use CMYK color process (higher cost)</span>
                </div>
              </label>
              <div className={styles.formGroup}>
                <label>Binding Option</label>
                <select name="bindingType" value={formData.bindingType} onChange={handleChange}>
                  <option value="None">None (Loose/Stapled)</option>
                  <option value="Spiral">Spiral Binding</option>
                  <option value="Thermal">Thermal/Perfect Binding</option>
                </select>
              </div>
            </div>
          </div>
          {}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>3. Logistics & Notes</h2>
            <div className={styles.grid}>
              <div className={styles.formGroup}>
                <label>Required Due Date</label>
                <input 
                  type="date" name="dueDate" required
                  value={formData.dueDate} onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
              <label>Special Instructions</label>
              <textarea 
                name="specialInstructions" rows="3"
                value={formData.specialInstructions} onChange={handleChange}
                placeholder="Any specific layout, cutting, or delivery instructions..."
              ></textarea>
            </div>
          </div>
          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={() => navigate('/printing/orders')}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
        {}
        <div className={styles.sidebar}>
          <div className={styles.estimateCard}>
            <h3>Order Summary</h3>
            <div className={styles.summaryList}>
              <div className={styles.summaryItem}>
                <span>Product:</span>
                <strong>{formData.productType} ({formData.paperType})</strong>
              </div>
              <div className={styles.summaryItem}>
                <span>Total Pages:</span>
                <strong>{(formData.pagesPerCopy * formData.quantity).toLocaleString()}</strong>
              </div>
              <div className={styles.summaryItem}>
                <span>Color:</span>
                <strong>{formData.colorPrinting ? 'Yes' : 'No'}</strong>
              </div>
              <div className={styles.summaryItem}>
                <span>Binding:</span>
                <strong>{formData.bindingType}</strong>
              </div>
            </div>
            <div className={styles.divider}></div>
            <div className={styles.estimateTotal}>
              <span>Estimated Cost</span>
              <div className={styles.priceContainer}>
                {calculating ? (
                  <span className={styles.calculatingText}>Calculating...</span>
                ) : (
                  <span className={styles.priceValue}>{formatCurrency(priceEstimate)}</span>
                )}
              </div>
              <p className={styles.estimateNote}>* Final price may vary based on actual paper weight and setup costs.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CreateOrder;
