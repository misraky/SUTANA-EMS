import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PublicNav } from './PublicNavFooter';
import authService from '../../services/authService';
import axios from '../../services/apiClient';
import { Search, Sprout, Leaf, MapPin, Package, X, ChevronDown, ChevronUp, Calendar, Info, ShoppingCart, Star, Shield, Truck, Droplets, Wrench } from 'lucide-react';
import PrescriptionViewer from '../shared/PrescriptionViewer';
import styles from './FarmingServicePage.module.css';
import farmingHero from '../../assets/hero-section/farming.jpg';

const TYPE_CONFIG = {
  seeds: { icon: <Sprout size={16} />, label: 'Seeds', color: '#d97706', bg: '#fffbeb' },
  fertilizers: { icon: <Droplets size={16} />, label: 'Fertilizers', color: '#059669', bg: '#ecfdf5' },
  tools: { icon: <Wrench size={16} />, label: 'Tools', color: '#2563eb', bg: '#eff6ff' },
  pesticides: { icon: <Shield size={16} />, label: 'Pesticides', color: '#dc2626', bg: '#fef2f2' },
  animal_feed: { icon: <Leaf size={16} />, label: 'Feed', color: '#7c3aed', bg: '#f5f3ff' },
  general: { icon: <Package size={16} />, label: 'General', color: '#64748b', bg: '#f1f5f9' },
};

function resolveImg(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${axios.defaults.baseURL.replace('/api/v1', '')}${url}`;
}

const FarmingServicePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDesc, setExpandedDesc] = useState({});
  const [expandedUsage, setExpandedUsage] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [deliveryOption, setDeliveryOption] = useState('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [viewImage, setViewImage] = useState(null);

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        setLoading(true);
        const [catRes, prodRes] = await Promise.all([
          axios.get('/farming/categories'),
          axios.get('/farming/products')
        ]);
        if (catRes.status === 'success') setCategories(catRes.data.filter(c => c.is_active));
        if (prodRes.status === 'success') {
          const activeProds = prodRes.data.filter(p => p.is_active);
          setAllProducts(activeProds);
          setSearchResults(activeProds);
        }
      } catch (error) {
        console.error('Failed to fetch farming data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicData();
  }, []);

  useEffect(() => {
    if (location.state?.orderProduct && authService.isAuthenticated()) {
      setSelectedProduct(location.state.orderProduct);
      setIsModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleSearch = () => {
    let filtered = allProducts;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(prod =>
        prod.name.toLowerCase().includes(query) ||
        (prod.description && prod.description.toLowerCase().includes(query)) ||
        prod.category_name?.toLowerCase().includes(query)
      );
    }
    if (selectedCategory) filtered = filtered.filter(prod => prod.category_id === selectedCategory);
    setSearchResults(filtered);
  };

  useEffect(() => { handleSearch(); }, [searchQuery, selectedCategory]);

  const handleCategoryClick = (categoryId) => setSelectedCategory(selectedCategory === categoryId ? null : categoryId);

  const handleRequestOrder = (product) => {
    if (!authService.isAuthenticated()) {
      navigate('/login', { state: { from: '/services/farming', orderProduct: product } });
    } else {
      setSelectedProduct(product);
      setIsModalOpen(true);
    }
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await axios.post('/farming/orders', {
        items: [{ product_id: selectedProduct.id, quantity: orderQuantity }],
        customer_name: customerName,
        customer_phone: customerPhone,
        delivery_type: deliveryOption,
        delivery_address: deliveryOption === 'delivery' ? deliveryAddress : '',
        delivery_fee: deliveryOption === 'delivery' ? 50 : 0
      });
      setSubmitSuccess(true);
      setTimeout(() => {
        setIsModalOpen(false); setSubmitSuccess(false); setOrderQuantity(1);
        setCustomerName(''); setCustomerPhone('');
        setDeliveryOption('pickup'); setDeliveryAddress('');
      }, 2500);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to submit order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageClick = (imageUrl, name) => {
    const url = new URL(window.location);
    url.searchParams.set('viewImage', imageUrl); url.searchParams.set('imageName', name);
    window.history.pushState({}, '', url);
    setViewImage({ url: imageUrl, name });
  };

  const handleCloseViewer = () => {
    const url = new URL(window.location);
    url.searchParams.delete('viewImage'); url.searchParams.delete('imageName');
    window.history.pushState({}, '', url);
    setViewImage(null);
  };

  return (
    <div className={styles.pageWrapper}>
      <PublicNav />

      {/* Hero Section */}
      <section className={styles.heroSection} style={{ background: `linear-gradient(rgba(26,43,75,0.75), rgba(13,124,102,0.7)), url(${farmingHero}) center/cover` }}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}><Sprout size={18} /> SUTANA Farming</div>
          <h1>SUTANA Agricultural <span className={styles.goldText}>Supplies</span></h1>
          <p>Seeds, Fertilizers, and Tools for Modern Farming</p>
          <div className={styles.searchContainer}>
            <div className={styles.searchWrapper}>
              <Search className={styles.searchIcon} size={20} />
              <input type="text" placeholder="Search products by name or category..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} className={styles.searchInput} />
              <button className={styles.searchBtn} onClick={handleSearch}>Search</button>
            </div>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}><span className={styles.heroStatNum}>{categories.length}</span><span className={styles.heroStatLabel}>Categories</span></div>
            <div className={styles.heroStat}><span className={styles.heroStatNum}>{allProducts.length}</span><span className={styles.heroStatLabel}>Products</span></div>
            <div className={styles.heroStat}><span className={styles.heroStatNum}>100%</span><span className={styles.heroStatLabel}>Quality</span></div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className={styles.mainContent}>
        {/* Categories */}
        <div className={styles.categoriesSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Browse by Category</h2>
            {selectedCategory && <button className={styles.clearFilterBtn} onClick={() => setSelectedCategory(null)}>Clear Filter</button>}
          </div>
          {loading ? (
            <div className={styles.loadingGrid}>
              {[1,2,3,4,5,6].map(i => <div key={i} className={styles.skeleton} />)}
            </div>
          ) : (
            <div className={styles.categoryGrid}>
              {categories.map((cat) => {
                const tc = TYPE_CONFIG[cat.type] || TYPE_CONFIG.general;
                const isActive = selectedCategory === cat.id;
                return (
                  <div key={cat.id} className={`${styles.categoryCard} ${isActive ? styles.categoryCardActive : ''}`} onClick={() => handleCategoryClick(cat.id)} style={{ '--cat-bg': tc.bg, '--cat-color': tc.color }}>
                    {cat.cover_image && (
                      <div className={styles.catImageWrapper}>
                        <img src={resolveImg(cat.cover_image)} alt={cat.name} className={styles.catImage} />
                        <div className={styles.catImageOverlay} />
                      </div>
                    )}
                    <div className={styles.catContent}>
                      <div className={styles.catTypeBadge} style={{ background: tc.bg, color: tc.color }}>{tc.icon} {tc.label}</div>
                      <h3 className={styles.catName}>{cat.name}</h3>
                      <p className={`${styles.catDesc} ${expandedDesc[cat.id] ? styles.expanded : ''}`}>{cat.description}</p>
                      {cat.description?.length > 60 && (
                        <button className={styles.readMoreBtn} onClick={(e) => { e.stopPropagation(); setExpandedDesc(p => ({ ...p, [cat.id]: !p[cat.id] })); }}>
                          {expandedDesc[cat.id] ? 'Read Less' : 'Read More'}
                        </button>
                      )}
                      <div className={styles.catProductCount} style={{ display: 'none' }}>{allProducts.filter(p => p.category_id === cat.id).length} Products</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Products */}
        <div className={styles.productsSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name || 'Products' : 'All Products'}
            </h2>
            <span className={styles.productCount} style={{ display: 'none' }}>{searchResults.length} product{searchResults.length !== 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <div className={styles.loadingGrid}>
              {[1,2,3,4,5,6].map(i => <div key={i} className={styles.skeleton} />)}
            </div>
          ) : searchResults.length === 0 ? (
            <div className={styles.noResults}>
              <Sprout size={56} />
              <h3>No products found</h3>
              <p>Try adjusting your search or selecting a different category.</p>
            </div>
          ) : (
            <div className={styles.productsGrid}>
              {searchResults.map((product) => {
                const cat = categories.find(c => c.id === product.category_id);
                const tc = cat ? TYPE_CONFIG[cat.type] || TYPE_CONFIG.general : TYPE_CONFIG.general;
                return (
                  <div key={product.id} className={styles.productCard}>
                    {/* Image Section */}
                    <div className={styles.productImageWrapper}>
                      {product.product_image ? (
                        <img src={resolveImg(product.product_image)} alt={product.name} className={styles.productImage} onClick={() => handleImageClick(product.product_image, product.name)} />
                      ) : (
                        <div className={styles.productPlaceholder}><Leaf size={40} /></div>
                      )}
                      <div className={styles.productImageBadges}>
                        <span className={styles.typeBadge} style={{ background: tc.bg, color: tc.color }}>{tc.icon} {tc.label}</span>
                        {product.stock_quantity <= product.reorder_level && product.stock_quantity > 0 && (
                          <span className={styles.lowStockBadge}>Low Stock</span>
                        )}
                        {product.stock_quantity <= 0 && <span className={styles.outOfStockBadge}>Out of Stock</span>}
                      </div>
                      <div className={styles.priceTag}>
                        <span className={styles.priceCurrency}>ETB</span>
                        <span className={styles.priceValue}>{parseFloat(product.price).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Info Section */}
                    <div className={styles.productInfo}>
                      <h3 className={styles.productName}>{product.name}</h3>
                      {cat && <span className={styles.productCategory}>{tc.icon} {cat.name}</span>}

                      {/* Description */}
                      {product.description && (
                        <p className={styles.productDesc}>{product.description.length > 100 ? product.description.substring(0, 100) + '...' : product.description}</p>
                      )}

                      {/* Usage Instructions (expandable) */}
                      {product.usage_instructions && (
                        <div className={styles.usageSection}>
                          <button className={styles.usageToggle} onClick={() => setExpandedUsage(p => ({ ...p, [product.id]: !p[product.id] }))}>
                            <Info size={14} /> How to Use {expandedUsage[product.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          {expandedUsage[product.id] && (
                            <div className={styles.usageContent}>{product.usage_instructions}</div>
                          )}
                        </div>
                      )}

                      <button className={styles.orderBtn} onClick={() => handleRequestOrder(product)} disabled={product.stock_quantity <= 0}>
                        <ShoppingCart size={16} /> {product.stock_quantity > 0 ? 'Order Now' : 'Unavailable'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info Sections */}
        <div className={styles.infoGrid}>
          <div className={styles.infoCardLarge}>
            <div className={styles.infoCardHeader}>
              <Calendar size={24} /> <h3>Seasonal Calendar — Meher</h3>
            </div>
            <div className={styles.calendarTable}>
              <table>
                <thead><tr><th>Crop</th><th>Planting</th><th>Harvest</th><th>Status</th><th>Best Seed</th></tr></thead>
                <tbody>
                  {[
                    { crop: 'Teff', plant: 'Jul–Aug', harvest: 'Nov–Dec', status: 'Planting', seed: 'Dukem, Magna', sClass: styles.statusPlanting },
                    { crop: 'Wheat', plant: 'Jun–Jul', harvest: 'Oct–Nov', status: 'Growing', seed: 'Hidase, Kakaba', sClass: styles.statusGrowing },
                    { crop: 'Maize', plant: 'Mar–Apr', harvest: 'Aug–Sep', status: 'Harvesting', seed: 'BH-540, BH-660', sClass: styles.statusHarvesting },
                    { crop: 'Barley', plant: 'May–Jun', harvest: 'Oct–Nov', status: 'Planting', seed: 'EH-1493, HB-42', sClass: styles.statusPlanting },
                  ].map((r, i) => (
                    <tr key={i}><td className={styles.cropName}>{r.crop}</td><td>{r.plant}</td><td>{r.harvest}</td><td><span className={`${styles.statusBadge} ${r.sClass}`}>{r.status}</span></td><td className={styles.seedText}>{r.seed}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.infoCardLarge}>
            <div className={styles.infoCardHeader}>
              <Truck size={24} /> <h3>Delivery Areas</h3>
            </div>
            <div className={styles.deliveryGrid}>
              <div className={styles.deliveryCard} style={{ '--d-bg': '#f0fdf4', '--d-color': '#166534' }}><div className={styles.delivTitle}>Addis Ababa</div><div className={styles.delivSub}>All sub-cities</div><div className={styles.delivFee}>Free above 5,000 ETB</div></div>
              <div className={styles.deliveryCard} style={{ '--d-bg': '#eff6ff', '--d-color': '#1e40af' }}><div className={styles.delivTitle}>Oromia Zone</div><div className={styles.delivSub}>Surrounding districts</div><div className={styles.delivFee}>500 ETB fee</div></div>
              <div className={styles.deliveryCard} style={{ '--d-bg': '#f5f3ff', '--d-color': '#6d28d9' }}><div className={styles.delivTitle}>100 km Radius</div><div className={styles.delivSub}>Up to 100 km</div><div className={styles.delivFee}>1,000 ETB fee</div></div>
              <div className={styles.deliveryCard} style={{ '--d-bg': '#fef2f2', '--d-color': '#991b1b' }}><div className={styles.delivTitle}>Delivery Time</div><div className={styles.delivSub}>After confirmation</div><div className={styles.delivFee}>2–5 business days</div></div>
            </div>
          </div>

          <div className={styles.infoCardLarge}>
            <div className={styles.infoCardHeader}>
              <Star size={24} /> <h3>Farming Tips</h3>
            </div>
            <div className={styles.tipsList}>
              {[
                { tip: 'Best time to plant Teff', detail: 'Plant when rain is consistent — July to August. Use Dukem or Magna varieties for best yield.' },
                { tip: 'Urea fertilizer application', detail: 'Apply 100–150 kg per hectare during early growth stage for maximum nitrogen absorption.' },
                { tip: 'Seed storage', detail: 'Store in a cool, dry place away from sunlight. Use airtight containers to prevent moisture damage.' },
                { tip: 'Wheat planting depth', detail: 'Plant seeds 2–4 cm deep. Shallower in heavy soils, deeper in sandy soils.' },
                { tip: 'Pest control', detail: 'Inspect crops weekly during growing season. Early detection reduces crop loss by up to 40%.' },
              ].map((item, i) => (
                <div key={i} className={styles.tipCard}><div className={styles.tipIcon}>{i + 1}</div><div><div className={styles.tipTitle}>{item.tip}</div><div className={styles.tipDetail}>{item.detail}</div></div></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Order Modal */}
      {isModalOpen && selectedProduct && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <button className={styles.closeModalBtn} onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            {submitSuccess ? (
              <div className={styles.successState}>
                <div className={styles.successIconCircle}><Sprout size={40} /></div>
                <h2>Order Placed!</h2>
                <p>Your order has been submitted successfully. Track it in your dashboard.</p>
                <button className={styles.successBtn} onClick={() => navigate('/customer/farming-orders')}>View My Orders</button>
              </div>
            ) : (
              <>
                <h2 className={styles.modalTitle}>Place Order</h2>
                <div className={styles.orderProductInfo}>
                  {selectedProduct.product_image && <img src={resolveImg(selectedProduct.product_image)} alt="" className={styles.orderProductImg} />}
                  <div>
                    <h3>{selectedProduct.name}</h3>
                    <span className={styles.orderPrice}>{parseFloat(selectedProduct.price).toFixed(2)} ETB / unit</span>
                  </div>
                </div>
                <form onSubmit={handleOrderSubmit}>
                  {submitError && <div className={styles.errorMsg}>{submitError}</div>}
                  <div className={styles.formGroup}>
                    <label>Your Name</label>
                    <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Full name" required />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Phone Number</label>
                    <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="+251 9XX XXX XXX" required />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Quantity</label>
                    <input type="number" min="1" value={orderQuantity} onChange={e => setOrderQuantity(Number(e.target.value))} required />
                  </div>
                  <div className={styles.totalRow}>Total: <strong>{(selectedProduct.price * orderQuantity).toFixed(2)} ETB</strong></div>
                  <div className={styles.formGroup}>
                    <label>Delivery</label>
                    <div className={styles.radioGroup}>
                      <label className={`${styles.radioCard} ${deliveryOption === 'pickup' ? styles.activeRadio : ''}`}>
                        <input type="radio" value="pickup" checked={deliveryOption === 'pickup'} onChange={e => setDeliveryOption(e.target.value)} />
                        <Package size={18} /> <span>Pickup</span>
                      </label>
                      <label className={`${styles.radioCard} ${deliveryOption === 'delivery' ? styles.activeRadio : ''}`}>
                        <input type="radio" value="delivery" checked={deliveryOption === 'delivery'} onChange={e => setDeliveryOption(e.target.value)} />
                        <Truck size={18} /> <span>Delivery</span>
                      </label>
                    </div>
                  </div>
                  {deliveryOption === 'delivery' && (
                    <div className={styles.formGroup}>
                      <label>Address</label>
                      <textarea value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder="Full address and landmarks..." required rows={3} />
                    </div>
                  )}
                  <div className={styles.modalActions}>
                    <button type="button" className={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>Cancel</button>
                    <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>{isSubmitting ? 'Processing...' : 'Confirm Order'}</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {viewImage && <PrescriptionViewer imageUrl={viewImage.url} onClose={handleCloseViewer} />}
    </div>
  );
};

export default FarmingServicePage;
