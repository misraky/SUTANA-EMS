import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import customerService from '../../services/customerService';
import styles from './CustomerOrderForm.module.css';
const PRODUCT_TYPES = ['Book', 'Module', 'Exam', 'Brochure'];
const PAPER_TYPES   = ['A4', 'A3', 'A5'];
const BINDING_TYPES = ['None', 'Spiral', 'Thermal'];
const defaultForm = {
  productType: 'Module',
  quantity: 1,
  paperType: 'A4',
  pagesPerCopy: 1,
  colorPrinting: false,
  bindingType: 'None',
  dueDate: '',
  specialInstructions: '',
};
const CustomerOrderForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [quoteMode, setQuoteMode] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState(null);
  // File upload states
  const [fileDeliveryMethod, setFileDeliveryMethod] = useState('upload');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    setEstimatedPrice(null);
  };
  const handleFileChange = (e) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };
  const handleGetQuote = async () => {
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        ...form,
        quantity: parseInt(form.quantity, 10),
        pagesPerCopy: parseInt(form.pagesPerCopy, 10),
      };
      const res = await customerService.requestQuote(payload);
      const data = res.data;
      setEstimatedPrice(data.estimatedTotal || data.totalPrice || null);
      setQuoteMode(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get quote. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (fileDeliveryMethod === 'upload' && selectedFiles.length === 0) {
      setError('Please select at least one file to upload, or choose to bring it physically.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        ...form,
        quantity: parseInt(form.quantity, 10),
        pagesPerCopy: parseInt(form.pagesPerCopy, 10),
      };
      const res = await customerService.createOrder(payload);
      const orderId = res?.data?.orderId || res?.data?.data?.orderId;
      if (orderId) {
        if (fileDeliveryMethod === 'upload' && selectedFiles.length > 0) {
          const formData = new FormData();
          selectedFiles.forEach((file) => {
            formData.append('attachments', file);
          });
          try {
            await customerService.uploadOrderAttachments(orderId, formData);
          } catch (uploadErr) {
            console.error('File upload failed', uploadErr);
            setError('Order was created, but file upload failed. Please contact support or bring your file physically.');
            setSubmitting(false);
            return;
          }
        }
        navigate(`/customer/orders/${orderId}/track`);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  if (success) {
    return (
      <div className={styles.successCard}>
        <div className={styles.successIcon}>✓</div>
        <h2>Order Placed Successfully!</h2>
        <p>Your order has been received and is now being processed.</p>
        <div className={styles.successActions}>
          <button className={styles.btnPrimary} onClick={() => navigate('/customer/orders')}>
            View My Orders
          </button>
          <button className={styles.btnOutline} onClick={() => { 
            setSuccess(false); 
            setForm(defaultForm); 
            setQuoteMode(false); 
            setSelectedFiles([]); 
          }}>
            Place Another Order
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.btnBack} onClick={() => navigate('/customer/orders')}>
          ← Back to Orders
        </button>
        <h1 className={styles.title}>Place New Order</h1>
        <p className={styles.subtitle}>Fill in the details below to submit your printing order.</p>
      </div>
      {error && <div className={styles.errorAlert}>{error}</div>}
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Order Details</h2>
          <div className={styles.grid2}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Product Type *</label>
              <select name="productType" value={form.productType} onChange={handleChange} className={styles.select}>
                {PRODUCT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Quantity *</label>
              <input
                name="quantity" type="number" min="1" value={form.quantity}
                onChange={handleChange} className={styles.input} required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Paper Size *</label>
              <select name="paperType" value={form.paperType} onChange={handleChange} className={styles.select}>
                {PAPER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Pages Per Copy *</label>
              <input
                name="pagesPerCopy" type="number" min="1" value={form.pagesPerCopy}
                onChange={handleChange} className={styles.input} required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Binding Type</label>
              <select name="bindingType" value={form.bindingType} onChange={handleChange} className={styles.select}>
                {BINDING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Due Date *</label>
              <input
                name="dueDate" type="date" value={form.dueDate}
                onChange={handleChange} className={styles.input} required
              />
            </div>
          </div>
          <div className={styles.checkboxRow}>
            <input
              id="colorPrinting" name="colorPrinting" type="checkbox"
              checked={form.colorPrinting} onChange={handleChange} className={styles.checkbox}
            />
            <label htmlFor="colorPrinting" className={styles.checkboxLabel}>Color Printing</label>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Special Instructions</label>
            <textarea
              name="specialInstructions" value={form.specialInstructions} onChange={handleChange}
              className={styles.textarea} rows={3} maxLength={500}
              placeholder="Any additional instructions for the print team..."
            />
          </div>
        </div>
        {}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>File Provision</h2>
          <div className={styles.fileDeliveryOptions}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="fileDeliveryMethod"
                value="upload"
                checked={fileDeliveryMethod === 'upload'}
                onChange={() => setFileDeliveryMethod('upload')}
              />
              Upload File Online Now
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="fileDeliveryMethod"
                value="physical"
                checked={fileDeliveryMethod === 'physical'}
                onChange={() => setFileDeliveryMethod('physical')}
              />
              I will bring my file physically (USB, CD, etc.)
            </label>
          </div>
          {fileDeliveryMethod === 'upload' && (
            <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
              <label className={styles.label}>Select Files to Upload *</label>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className={styles.fileInput}
              />
              {selectedFiles.length > 0 && (
                <div className={styles.selectedFilesList}>
                  <p>Selected {selectedFiles.length} file(s):</p>
                  <ul>
                    {selectedFiles.map((f, i) => (
                      <li key={i}>{f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {fileDeliveryMethod === 'physical' && (
            <div className={styles.infoAlert} style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: '4px' }}>
              ℹ️ Please make sure to reference your Order Number when dropping off your files at the printing office.
            </div>
          )}
        </div>
        {estimatedPrice !== null && (
          <div className={styles.quoteResult}>
            <span>Estimated Price:</span>
            <strong>ETB {Number(estimatedPrice).toLocaleString('en-ET', { minimumFractionDigits: 2 })}</strong>
          </div>
        )}
        <div className={styles.formActions}>
          <button
            type="button"
            className={styles.btnOutline}
            onClick={handleGetQuote}
            disabled={submitting}
          >
            {submitting && quoteMode ? 'Getting Quote...' : 'Get Price Estimate'}
          </button>
          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={submitting}
          >
            {submitting && !quoteMode ? 'Placing Order...' : 'Place Order'}
          </button>
        </div>
      </form>
    </div>
  );
};
export default CustomerOrderForm;
