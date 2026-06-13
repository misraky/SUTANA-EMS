import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PublicNav, PublicFooter } from './PublicNavFooter';
import authService from '../../services/authService';
import axios from '../../services/apiClient';
import { Search, Sprout, Leaf, MapPin, Package, UploadCloud, X, ChevronRight, Calendar, Info } from 'lucide-react';
import PrescriptionViewer from '../shared/PrescriptionViewer';
import styles from './FarmingServicePage.module.css';

const FarmingServicePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dynamic State
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [deliveryOption, setDeliveryOption] = useState('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Image Viewer State
  const [viewImage, setViewImage] = useState(null);

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        setLoading(true);
        const [catRes, prodRes] = await Promise.all([
          axios.get('/farming/categories'),
          axios.get('/farming/products')
        ]);
        
        if (catRes.data.status === 'success') setCategories(catRes.data.data.filter(c => c.is_active));
        if (prodRes.data.status === 'success') {
          const activeProds = prodRes.data.data.filter(p => p.is_active);
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
    if (selectedCategory) {
      filtered = filtered.filter(prod => prod.category_id === selectedCategory);
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
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  const toggleCategoryExpand = (e, id) => {
    e.stopPropagation();
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRequestOrder = (product) => {
    if (!authService.isAuthenticated()) {
      navigate('/login', { 
        state: { 
          from: '/services/farming', 
          orderProduct: product 
        } 
      });
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
      const orderData = {
        items: [{ product_id: selectedProduct.id, quantity: orderQuantity }],
        delivery_type: deliveryOption,
        delivery_address: deliveryOption === 'delivery' ? deliveryAddress : '',
        delivery_fee: deliveryOption === 'delivery' ? 50 : 0
      };

      await axios.post('/farming/orders', orderData);

      setSubmitSuccess(true);
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitSuccess(false);
        setOrderQuantity(1);
        setDeliveryOption('pickup');
        setDeliveryAddress('');
      }, 2500);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to submit order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageClick = (imageUrl, name) => {
    const url = new URL(window.location);
    url.searchParams.set('viewImage', imageUrl);
    url.searchParams.set('imageName', name);
    window.history.pushState({}, '', url);
    setViewImage({ url: imageUrl, name });
  };

  const handleCloseViewer = () => {
    const url = new URL(window.location);
    url.searchParams.delete('viewImage');
    url.searchParams.delete('imageName');
    window.history.pushState({}, '', url);
    setViewImage(null);
  };

  return (
    <div className={styles.pageWrapper}>
      <PublicNav />
      
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <Sprout size={18} /> SUTANA Farming
          </div>
          <h1>Premium Agricultural Supplies</h1>
          <p>Seeds, Fertilizers, and Tools for Modern Farming</p>
          
          <div className={styles.searchContainer}>
            <div className={styles.searchWrapper}>
              <Search className={styles.searchIcon} size={20} />
              <input
                type="text"
                placeholder="Search products by name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className={styles.searchInput}
              />
              <button className={styles.searchBtn} onClick={handleSearch}>
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className={styles.mainContent}>
        
        {/* Categories Sidebar/Top */}
        <div className={styles.categoriesSection}>
          <h2 className={styles.sectionTitle}>Browse Categories</h2>
          {loading ? (
            <div className={styles.loadingPulse}>Loading categories...</div>
          ) : (
            <div className={styles.categoryGrid}>
              {categories.map((cat) => (
                <div 
                  key={cat.id} 
                  className={`${styles.categoryCard} ${selectedCategory === cat.id ? styles.categoryCardActive : ''}`}
                  onClick={() => handleCategoryClick(cat.id)}
                >
                  {cat.cover_image && (
                    <div className={styles.catImageWrapper}>
                      <img src={cat.cover_image.startsWith('http') ? cat.cover_image : `${axios.defaults.baseURL.replace('/api/v1', '')}/${cat.cover_image}`} alt={cat.name} className={styles.catImage} />
                    </div>
                  )}
                  <div className={styles.catContent}>
                    <h3>{cat.name}</h3>
                    <p className={`${styles.catDescription} ${expandedCategories[cat.id] ? styles.expanded : ''}`}>
                      {cat.description}
                    </p>
                    {cat.description && cat.description.length > 50 && (
                      <button className={styles.readMoreBtn} onClick={(e) => toggleCategoryExpand(e, cat.id)}>
                        {expandedCategories[cat.id] ? 'Read Less' : 'Read More'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Products Grid */}
        <div className={styles.productsSection}>
          <div className={styles.productHeader}>
            <h2 className={styles.sectionTitle}>
              {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'All Products'}
            </h2>
            <span className={styles.productCount}>{searchResults.length} Products Found</span>
          </div>

          {loading ? (
            <div className={styles.loadingPulse}>Loading products...</div>
          ) : searchResults.length === 0 ? (
            <div className={styles.noResults}>
              <Sprout size={48} className={styles.noResultsIcon} />
              <h3>No products found</h3>
              <p>Try adjusting your search terms or selecting a different category.</p>
            </div>
          ) : (
            <div className={styles.productsGrid}>
              {searchResults.map((product) => (
                <div key={product.id} className={styles.productCard}>
                  
                  {/* Two Images at top 50 50 percent */}
                  <div className={styles.dualImageContainer}>
                    <div 
                      className={styles.productImageHalf} 
                      onClick={() => handleImageClick(product.product_image, product.name)}
                    >
                      {product.product_image ? (
                        <img src={product.product_image.startsWith('http') ? product.product_image : `${axios.defaults.baseURL.replace('/api/v1', '')}/${product.product_image}`} alt={product.name} />
                      ) : (
                        <div className={styles.placeholderImg}><Leaf size={24}/></div>
                      )}
                    </div>
                    <div 
                      className={styles.productImageHalf}
                      onClick={() => {
                        const cat = categories.find(c => c.id === product.category_id);
                        if(cat?.cover_image) handleImageClick(cat.cover_image, cat.name);
                      }}
                    >
                      {categories.find(c => c.id === product.category_id)?.cover_image ? (
                        <img src={categories.find(c => c.id === product.category_id)?.cover_image} alt="Category" />
                      ) : (
                        <div className={styles.placeholderImg}><Sprout size={24}/></div>
                      )}
                    </div>
                  </div>

                  <div className={styles.productInfo}>
                    <div className={styles.productHeaderRow}>
                      <h3 className={styles.productName}>{product.name}</h3>
                      <span className={styles.priceTag}>{product.price} ETB</span>
                    </div>
                    <span className={styles.productCategory}>{product.category_name}</span>
                    
                    <p className={styles.productDesc}>{product.description}</p>
                    
                    <div className={styles.stockStatus}>
                      {product.stock_quantity > 0 ? (
                        <span className={styles.inStock}><Package size={14}/> In Stock ({product.stock_quantity})</span>
                      ) : (
                        <span className={styles.outOfStock}>Out of Stock</span>
                      )}
                    </div>

                    <button 
                      className={styles.requestBtn}
                      onClick={() => handleRequestOrder(product)}
                      disabled={product.stock_quantity <= 0}
                    >
                      Order Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Additional Sections (Seasonal Calendar, Tips) */}
        <div className={styles.infoSections}>
          <div className={styles.infoCard}>
            <Calendar size={32} className={styles.infoIcon} />
            <h3>Seasonal Calendar</h3>
            <p>Check the best times for planting and harvesting in your region.</p>
            <button className={styles.infoBtn}>View Calendar</button>
          </div>
          <div className={styles.infoCard}>
            <MapPin size={32} className={styles.infoIcon} />
            <h3>Delivery Areas</h3>
            <p>We deliver agricultural supplies to various regions. Check our map.</p>
            <button className={styles.infoBtn}>Check Coverage</button>
          </div>
          <div className={styles.infoCard}>
            <Info size={32} className={styles.infoIcon} />
            <h3>Farming Tips</h3>
            <p>Get the latest guides and tutorials for maximum yield.</p>
            <button className={styles.infoBtn}>Read Tips</button>
          </div>
        </div>

      </section>

      <PublicFooter />

      {/* Order Modal */}
      {isModalOpen && selectedProduct && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <button className={styles.closeModalBtn} onClick={() => setIsModalOpen(false)}>
              <X size={24} />
            </button>
            
            {submitSuccess ? (
              <div className={styles.successState}>
                <div className={styles.successIcon}><Sprout size={48} /></div>
                <h2>Order Placed!</h2>
                <p>Your order has been submitted successfully.</p>
                <p>Track it in your Customer Dashboard.</p>
                <button className={styles.successBtn} onClick={() => navigate('/customer/orders')}>
                  View My Orders
                </button>
              </div>
            ) : (
              <>
                <h2 className={styles.modalTitle}>Place Order</h2>
                <div className={styles.selectedMedInfo}>
                  <h3>{selectedProduct.name}</h3>
                  <p>{selectedProduct.price} ETB per unit</p>
                </div>

                <form onSubmit={handleOrderSubmit} className={styles.refillForm}>
                  {submitError && <div className={styles.errorMessage}>{submitError}</div>}
                  
                  <div className={styles.formGroup}>
                    <label>Quantity</label>
                    <input 
                      type="number" 
                      min="1" 
                      max={selectedProduct.stock_quantity}
                      value={orderQuantity}
                      onChange={(e) => setOrderQuantity(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Total Amount: <strong>{(selectedProduct.price * orderQuantity).toFixed(2)} ETB</strong></label>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Delivery Option</label>
                    <div className={styles.radioGroup}>
                      <label className={`${styles.radioCard} ${deliveryOption === 'pickup' ? styles.activeRadio : ''}`}>
                        <input 
                          type="radio" 
                          value="pickup" 
                          checked={deliveryOption === 'pickup'}
                          onChange={(e) => setDeliveryOption(e.target.value)}
                        />
                        <Package size={20} />
                        <span>Pickup at Store</span>
                      </label>
                      <label className={`${styles.radioCard} ${deliveryOption === 'delivery' ? styles.activeRadio : ''}`}>
                        <input 
                          type="radio" 
                          value="delivery" 
                          checked={deliveryOption === 'delivery'}
                          onChange={(e) => setDeliveryOption(e.target.value)}
                        />
                        <MapPin size={20} />
                        <span>Delivery</span>
                      </label>
                    </div>
                  </div>

                  {deliveryOption === 'delivery' && (
                    <div className={styles.formGroup}>
                      <label>Delivery Address</label>
                      <textarea 
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Enter full address and landmarks..."
                        required
                        rows="3"
                      ></textarea>
                    </div>
                  )}

                  <div className={styles.modalActions}>
                    <button type="button" className={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>
                      Cancel
                    </button>
                    <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                      {isSubmitting ? 'Processing...' : 'Confirm Order'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Image Viewer popup */}
      {viewImage && (
        <PrescriptionViewer 
          imageUrl={viewImage.url} 
          onClose={handleCloseViewer} 
        />
      )}
    </div>
  );
};

export default FarmingServicePage;
