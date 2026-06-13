import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PublicNav, PublicFooter } from './PublicNavFooter';
import authService from '../../services/authService';
import pharmacyService from '../../services/pharmacyService';
import axios from '../../services/apiClient';
import { Search, Pill, XCircle, AlertTriangle, CheckCircle2, MapPin, Package, UploadCloud, X, ChevronRight } from 'lucide-react';
import styles from './PharmacyHealthPage.module.css';

const PharmacyHealthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dynamic State
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [refillQuantity, setRefillQuantity] = useState(1);
  const [deliveryOption, setDeliveryOption] = useState('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        setLoading(true);
        const [catRes, prodRes, branchRes] = await Promise.all([
          pharmacyService.getCategories(),
          pharmacyService.getProducts(),
          pharmacyService.getBranches()
        ]);
        
        if (catRes.status === 'success') setCategories(catRes.data.filter(c => c.is_active));
        if (prodRes.status === 'success') {
          const activeProds = prodRes.data.filter(p => p.is_active);
          setAllProducts(activeProds);
          setSearchResults(activeProds);
        }
        if (branchRes.status === 'success') setBranches(branchRes.data.filter(b => b.is_active));
      } catch (error) {
        console.error('Failed to fetch public pharmacy data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicData();
  }, []);

  // If user was redirected back from login, they might have selected a medicine
  useEffect(() => {
    if (location.state?.refillMedicine && authService.isAuthenticated()) {
      setSelectedMedicine(location.state.refillMedicine);
      setIsModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleSearch = () => {
    let filtered = allProducts;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(med => 
        med.name.toLowerCase().includes(query) || 
        (med.generic_name && med.generic_name.toLowerCase().includes(query)) ||
        med.category_name.toLowerCase().includes(query)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(med => med.category_id === selectedCategory);
    }

    setSearchResults(filtered);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  useEffect(() => {
    handleSearch();
  }, [searchQuery, selectedCategory]);

  const handleCategoryClick = (categoryId) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory(null); // Toggle off
    } else {
      setSelectedCategory(categoryId);
    }
  };

  const toggleCategoryExpand = (e, id) => {
    e.stopPropagation();
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRequestRefill = (medicine) => {
    if (!authService.isAuthenticated()) {
      navigate('/login', { 
        state: { 
          from: '/services/pharmacy', 
          refillMedicine: medicine 
        } 
      });
    } else {
      setSelectedMedicine(medicine);
      setIsModalOpen(true);
    }
  };

  const handleRefillSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const formData = new FormData();
      formData.append('medication_id', selectedMedicine.id);
      formData.append('quantity', refillQuantity);
      formData.append('delivery_option', deliveryOption);
      if (deliveryOption === 'delivery') formData.append('delivery_address', deliveryAddress);
      if (prescriptionFile) formData.append('prescription_image', prescriptionFile);

      await axios.post('/pharmacy/requests', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitSuccess(false);
        setRefillQuantity(1);
        setDeliveryOption('pickup');
        setDeliveryAddress('');
        setPrescriptionFile(null);
      }, 2500);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStockStatus = (stockQuantity, reorderLevel) => {
    if (stockQuantity === 0) return <span className={styles.stockOut}><XCircle size={16} /> Out of Stock</span>;
    if (stockQuantity <= reorderLevel) return <span className={styles.stockLow}><AlertTriangle size={16} /> Low Stock (Only {stockQuantity} left)</span>;
    return <span className={styles.stockIn}><CheckCircle2 size={16} /> In Stock</span>;
  };

  return (
    <>
      <PublicNav />
      <div className={styles.pageWrapper}>
        {/* Background Blobs for Glassmorphism */}
        <div className={styles.blob1}></div>
        <div className={styles.blob2}></div>
      
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Sutana Pharmacy & Health</h1>
          <p className={styles.heroSubtitle}>
            Order prescription refills, browse our extensive medication catalog, and find health supplies.
            Delivery available directly to your doorstep.
          </p>
        </div>
      </section>

      {/* Search Section */}
      <section className={styles.searchSection}>
        <div className={styles.searchCard}>
          <div className={styles.searchHeader}>
            <Search size={20} color="#10b981" />
            <span>Search Medications</span>
          </div>
          <div className={styles.searchInputWrapper}>
            <input 
              type="text" 
              className={styles.searchInput} 
              placeholder="Type medicine name or brand..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
            <button className={styles.searchBtn} onClick={handleSearch}>
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className={styles.container}>
        <h2 className={styles.sectionTitle}>
          <Pill size={24} /> Browse by Category
        </h2>
        {loading ? (
          <div className={styles.categoryGrid}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`${styles.skeleton} ${styles.skeletonCard}`}></div>
            ))}
          </div>
        ) : (
          <div className={styles.categoryGrid}>
            {categories.map((cat) => (
              <div
                className={`${styles.categoryCard} ${selectedCategory === cat.id ? styles.selectedCategory : ''}`}
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
              >
                {/* Image Banner */}
                <div className={styles.categoryImageWrapper}>
                  {cat.cover_image ? (
                    <img
                      src={`http://localhost:5000${cat.cover_image}`}
                      alt={cat.name}
                      className={styles.categoryImage}
                    />
                  ) : (
                    <div className={styles.categoryPlaceholder}>
                      <Pill size={48} strokeWidth={1.5} />
                    </div>
                  )}
                  <div className={styles.categoryImageOverlay} />
                  {selectedCategory === cat.id && (
                    <span className={styles.categoryActiveBadge}>✓ Selected</span>
                  )}
                </div>

                {/* Card Body */}
                <div className={styles.categoryBody}>
                  <div className={styles.categoryName}>
                    <span>{cat.name}</span>
                    <ChevronRight size={16} className={styles.categoryNameChevron} />
                  </div>
                  {cat.description && (
                    <div className={styles.categoryDescWrapper}>
                      <p className={`${styles.categoryDescription} ${expandedCategories[cat.id] ? styles.expandedDesc : ''}`}>
                        {cat.description}
                      </p>
                      {cat.description.length > 120 && (
                        <button 
                          className={styles.readMoreBtn} 
                          onClick={(e) => toggleCategoryExpand(e, cat.id)}
                        >
                          {expandedCategories[cat.id] ? 'Read Less' : 'Read More'}
                        </button>
                      )}
                    </div>
                  )}
                  <div className={styles.categoryFooter}>
                    <Pill size={12} />
                    Browse medicines
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Search Results */}
      <section className={styles.container} style={{ marginBottom: '60px' }}>
        <h2 className={styles.sectionTitle}>
          <Search size={24} /> Medications {selectedCategory && `in Selected Category`} {searchQuery && `for "${searchQuery}"`}
        </h2>
        
        {loading ? (
          <div className={styles.resultsGrid}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`${styles.skeleton} ${styles.skeletonProduct}`}></div>
            ))}
          </div>
        ) : searchResults.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            No medications found matching your criteria.
          </div>
        ) : (
          <div className={styles.resultsGrid}>
            {searchResults.map(med => (
              <div className={styles.medicineCard} key={med.id}>
                <div className={styles.medicineImagesContainer}>
                  <div 
                    className={styles.medicineImageHalf} 
                    onClick={() => med.drug_image && window.open(`/prescription-viewer?url=http://localhost:5000${med.drug_image}`, '_blank')}
                    title="Click to view full image"
                  >
                    {med.drug_image ? (
                      <img src={`http://localhost:5000${med.drug_image}`} alt={med.name} />
                    ) : (
                      <Package size={40} color="#94a3b8" />
                    )}
                  </div>
                  <div 
                    className={`${styles.medicineImageHalf} ${styles.rightHalf}`} 
                    onClick={() => med.cover_image && window.open(`/prescription-viewer?url=http://localhost:5000${med.cover_image}`, '_blank')}
                    title="Click to view full image"
                  >
                    {med.cover_image ? (
                      <img src={`http://localhost:5000${med.cover_image}`} alt={`${med.name} cover`} />
                    ) : (
                      <Package size={40} color="#94a3b8" />
                    )}
                  </div>
                </div>
                <div style={{padding: '0 16px 16px', flex: 1, display: 'flex', flexDirection: 'column'}}>
                  <h3 className={styles.medicineName}>{med.name}</h3>
                  <div style={{fontSize: '13px', color: '#64748b', marginBottom: '8px'}}>{med.generic_name}</div>
                  <hr className={styles.medicineDivider} />
                  <div className={styles.medicineDetails}>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Manufacturer:</span>
                      <span>{med.manufacturer || 'N/A'}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Price:</span>
                      <span>{med.price} ETB {med.price_unit ? `per ${med.price_unit}` : ''}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Stock:</span>
                      <span className={`${styles.stockBadge} ${med.stock_quantity === 0 ? styles.stockOut : med.stock_quantity <= med.reorder_level ? styles.stockLow : styles.stockIn}`}>
                        {renderStockStatus(med.stock_quantity, med.reorder_level)}
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Category:</span>
                      <span>{med.category_name}</span>
                    </div>
                  </div>
                  <button 
                    className={`${styles.refillBtn} ${med.stock_quantity > 0 ? styles.primary : ''}`}
                    onClick={() => handleRequestRefill(med)}
                    disabled={med.stock_quantity === 0}
                  >
                    <Pill size={18} /> {med.is_prescription_required ? 'Request Refill' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pharmacy Locations */}
      <section className={styles.container}>
        <h2 className={styles.sectionTitle}>
          <MapPin size={24} /> Our Pharmacy Locations
        </h2>
        {loading ? (
          <div className={styles.locationsGrid}>
            {[...Array(2)].map((_, i) => (
              <div key={i} className={`${styles.skeleton} ${styles.skeletonProduct}`}></div>
            ))}
          </div>
        ) : (
          <div className={styles.locationsGrid}>
            {branches.map(branch => (
              <div className={styles.locationCard} key={branch.id}>
                {branch.cover_image && (
                  <div className={styles.medicineImageWrapper}>
                    <img src={`http://localhost:5000${branch.cover_image}`} alt={branch.branch_name} />
                  </div>
                )}
                <div style={{padding: branch.cover_image ? '0 16px 16px' : '16px'}}>
                  <h3 className={styles.locationName}><MapPin size={20} color="#10b981" /> {branch.branch_name}</h3>
                  <div className={styles.locationDetails}>
                    <strong>Address:</strong> {branch.address}<br/>
                    <strong>Phone:</strong> {branch.phone} {branch.alternate_phone && `| ${branch.alternate_phone}`}<br/><br/>
                    <strong>Working Hours:</strong><br/>
                    Mon-Sat: {branch.working_hours_monday_saturday}<br/>
                    Sunday: {branch.working_hours_sunday}<br/>
                    {branch.emergency_phone && <span>24/7 Emergency: {branch.emergency_phone}<br/></span>}
                    {branch.delivery_support_phone && <span>Delivery Support: {branch.delivery_support_phone}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <PublicFooter />

      {/* Refill Modal */}
      {isModalOpen && selectedMedicine && (
        <div className={styles.modalOverlay} onClick={() => { setIsModalOpen(false); setSubmitSuccess(false); setSubmitError(''); }}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>💊 Request Prescription Refill</h3>
              <button className={styles.closeBtn} onClick={() => { setIsModalOpen(false); setSubmitSuccess(false); setSubmitError(''); }}>
                <X size={24} />
              </button>
            </div>

            {submitSuccess ? (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
                <h3 style={{ color: '#059669', fontSize: '1.3rem', fontWeight: 800, margin: '0 0 8px' }}>Request Submitted!</h3>
                <p style={{ color: '#64748b', margin: 0 }}>Your request is now with the pharmacist. Track it in <strong>My Account → Prescriptions</strong>.</p>
              </div>
            ) : (
              <form onSubmit={handleRefillSubmit}>
                <div className={styles.modalBody}>
                  {/* Medication */}
                  <div className={styles.formGroup}>
                    <label>Medication</label>
                    <input type="text" className={styles.formInput} value={selectedMedicine.name} disabled />
                  </div>

                  {/* Quantity */}
                  <div className={styles.formGroup}>
                    <label>Quantity</label>
                    <input
                      type="number"
                      className={styles.formInput}
                      min="1"
                      max={selectedMedicine.stock_quantity}
                      value={refillQuantity}
                      onChange={(e) => setRefillQuantity(e.target.value)}
                      required
                    />
                  </div>

                  {/* Delivery Option */}
                  <div className={styles.formGroup}>
                    <label>Delivery Option</label>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px 16px', borderRadius: '10px', border: `2px solid ${deliveryOption === 'pickup' ? '#10b981' : '#e2e8f0'}`, background: deliveryOption === 'pickup' ? '#f0fdf4' : 'white', transition: 'all 0.2s', flex: 1 }}>
                        <input type="radio" name="delivery" value="pickup" checked={deliveryOption === 'pickup'} onChange={() => setDeliveryOption('pickup')} style={{ accentColor: '#10b981' }} />
                        🏥 Pickup (Free)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px 16px', borderRadius: '10px', border: `2px solid ${deliveryOption === 'delivery' ? '#10b981' : '#e2e8f0'}`, background: deliveryOption === 'delivery' ? '#f0fdf4' : 'white', transition: 'all 0.2s', flex: 1 }}>
                        <input type="radio" name="delivery" value="delivery" checked={deliveryOption === 'delivery'} onChange={() => setDeliveryOption('delivery')} style={{ accentColor: '#10b981' }} />
                        🚚 Delivery (+50 ETB)
                      </label>
                    </div>
                  </div>

                  {/* Delivery Address - shown only if delivery selected */}
                  {deliveryOption === 'delivery' && (
                    <div className={styles.formGroup}>
                      <label>Delivery Address</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        placeholder="e.g. Bole Road, Block 3, Addis Ababa"
                        value={deliveryAddress}
                        onChange={e => setDeliveryAddress(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  {/* Prescription Upload */}
                  <div className={styles.formGroup}>
                    <label>Upload Prescription {selectedMedicine.is_prescription_required ? <span style={{color:'#ef4444'}}>*</span> : '(Optional)'}</label>
                    <label style={{ cursor: 'pointer' }}>
                      <div className={styles.fileUpload}>
                        <UploadCloud size={32} className={styles.fileUploadIcon} />
                        <p style={{ margin: 0, fontWeight: '600', color: '#334155' }}>
                          {prescriptionFile ? prescriptionFile.name : 'Click to choose a file'}
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>JPEG, PNG, or PDF</p>
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,application/pdf"
                        style={{ display: 'none' }}
                        onChange={e => setPrescriptionFile(e.target.files[0] || null)}
                        required={selectedMedicine.is_prescription_required}
                      />
                    </label>
                  </div>

                  {/* Price summary */}
                  <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', color: '#475569' }}>
                    💰 Estimated Total: <strong style={{ color: '#0f172a' }}>
                      {((parseFloat(selectedMedicine.price || 0) * refillQuantity) + (deliveryOption === 'delivery' ? 50 : 0)).toFixed(2)} ETB
                    </strong>
                  </div>

                  {/* Error */}
                  {submitError && (
                    <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', color: '#dc2626', fontSize: '0.9rem' }}>
                      ❌ {submitError}
                    </div>
                  )}
                </div>

                <div className={styles.modalFooter}>
                  <button type="button" className={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : '🚀 Submit Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  </>
  );
};

export default PharmacyHealthPage;
