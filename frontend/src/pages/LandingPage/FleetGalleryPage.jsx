import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings2, Fuel, Users, Package, 
  CarFront, CheckCircle2, Clock, AlertTriangle, ArrowRight, X,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { PublicNav, PublicFooter } from './ServicesPage';
import RentalAgreementModal from './RentalAgreementModal';
import carService from '../../services/carService';
import authService from '../../services/authService';
import styles from './FleetGalleryPage.module.css';

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');
  return `${baseUrl}${path}`;
};

const FleetGalleryPage = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [selectedCarForNotify, setSelectedCarForNotify] = useState(null);
  const [notifyFormData, setNotifyFormData] = useState({
    customerName: '',
    phone: '',
    email: '',
    message: ''
  });
  
  // Reservation Modal State
  const [reserveModalOpen, setReserveModalOpen] = useState(false);
  const [selectedCarForReserve, setSelectedCarForReserve] = useState(null);
  const [toast, setToast] = useState({ show: false, type: '', title: '', message: '' });
  
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();

  const showToast = (type, title, message, redirectDelay = 0) => {
    setToast({ show: true, type, title, message });
    if (redirectDelay) {
      setTimeout(() => navigate('/customer'), redirectDelay);
    } else {
      setTimeout(() => setToast({ show: false, type: '', title: '', message: '' }), 5000);
    }
  };

  useEffect(() => {
    fetchPublicCars();
  }, []);

  const fetchPublicCars = async () => {
    try {
      setLoading(true);
      const res = await carService.getPublicCars();
      if (res.status === 'success') {
        setCars(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch fleet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? cars.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === cars.length - 1 ? 0 : prev + 1));
  };

  const handleReserve = (car) => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      setSelectedCarForReserve(car);
      setReserveModalOpen(true);
    }
  };

  const handleReservationSuccess = (orderData) => {
    setReserveModalOpen(false);
    showToast(
      'success',
      '🎉 Reservation Confirmed!',
      `Your order #${orderData.orderNumber} has been submitted. A manager will review it shortly. Redirecting to your dashboard...`,
      3000
    );
  };

  const handleNotify = (car) => {
    setSelectedCarForNotify(car);
    setNotifyModalOpen(true);
    setNotifyFormData({ customerName: '', phone: '', email: '', message: '' });
  };

  const handleNotifySubmit = async (e) => {
    e.preventDefault();
    try {
      await carService.submitNotifyRequest({
        carId: selectedCarForNotify.id,
        carName: selectedCarForNotify.name,
        carRate: selectedCarForNotify.dailyRate,
        carStatus: selectedCarForNotify.availability,
        ...notifyFormData
      });
      setNotifyModalOpen(false);
      showToast('success', '✅ Request Sent!', `We will notify you when ${selectedCarForNotify.name} becomes available.`);
    } catch (error) {
      console.error('Failed to submit notify request', error);
      showToast('error', '❌ Failed to Send', 'Something went wrong. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="public-page cnx-page">
        <PublicNav />
        <div className={styles.loadingContainer}>
          <div className={styles.loader}>Loading our fleet...</div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  if (cars.length === 0) {
    return (
      <div className="public-page cnx-page">
        <PublicNav />
        <div className={styles.emptyContainer}>
          <CarFront size={64} />
          <h3>No vehicles available</h3>
          <p>We are currently updating our fleet. Please check back soon.</p>
        </div>
        <PublicFooter />
      </div>
    );
  }

  const currentCar = cars[currentIndex];

  return (
    <div className="public-page cnx-page">
      <PublicNav />

      {/* ── Toast Notification Banner ── */}
      {toast.show && (
        <div style={{
          position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, minWidth: '340px', maxWidth: '560px',
          background: toast.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1.5px solid ${toast.type === 'success' ? '#86efac' : '#fca5a5'}`,
          borderRadius: '12px', padding: '1rem 1.5rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column', gap: '4px'
        }}>
          <p style={{ margin: 0, fontWeight: '700', fontSize: '15px', color: toast.type === 'success' ? '#15803d' : '#dc2626' }}>
            {toast.title}
          </p>
          <p style={{ margin: 0, fontSize: '13px', color: toast.type === 'success' ? '#166534' : '#991b1b' }}>
            {toast.message}
          </p>
        </div>
      )}
      
      <div className={styles.galleryContainer}>
        <div className={styles.header}>
          <h1>Our Premium Fleet</h1>
          <p>Choose from our wide selection of high-quality vehicles</p>
        </div>

        <div className={styles.carouselContainer}>
          <button className={styles.navBtn} onClick={handlePrev}>
            <ChevronLeft size={32} />
          </button>

          <div className={styles.carCard}>
            {/* Left side - Images */}
            <div className={styles.imageSection}>
              <div className={styles.mainImage}>
                {currentCar.image1 ? (
                  <img src={getImageUrl(currentCar.image1)} alt={currentCar.name} />
                ) : (
                  <div className={styles.imagePlaceholder}>
                    <CarFront size={48} />
                  </div>
                )}
              </div>
              <div className={styles.thumbnailStrip}>
                {currentCar.image1 && (
                  <div className={styles.thumbnail}>
                    <img src={getImageUrl(currentCar.image1)} alt="Front view" />
                  </div>
                )}
                {currentCar.image2 && (
                  <div className={styles.thumbnail}>
                    <img src={getImageUrl(currentCar.image2)} alt="Side view" />
                  </div>
                )}
                {currentCar.image3 && (
                  <div className={styles.thumbnail}>
                    <img src={getImageUrl(currentCar.image3)} alt="Rear view" />
                  </div>
                )}
              </div>
            </div>

            {/* Right side - Details */}
            <div className={styles.detailsSection}>
              <div className={styles.carTitle}>
                <h2>{currentCar.name}</h2>
                <div className={`${styles.statusBadge} ${styles[currentCar.availability.toLowerCase()]}`}>
                  {currentCar.availability === 'Available' && <CheckCircle2 size={16} />}
                  {currentCar.availability === 'Booked' && <Clock size={16} />}
                  {currentCar.availability === 'Maintenance' && <AlertTriangle size={16} />}
                  {currentCar.availability}
                </div>
              </div>

              <div className={styles.priceSection}>
                <span className={styles.price}>ETB {Number(currentCar.dailyRate).toLocaleString()}</span>
                <span className={styles.perDay}>/per day</span>
              </div>

              <div className={styles.specsGrid}>
                <div className={styles.spec}>
                  <Settings2 size={18} />
                  <span>{currentCar.transmission}</span>
                </div>
                <div className={styles.spec}>
                  <Fuel size={18} />
                  <span>{currentCar.fuelType}</span>
                </div>
                <div className={styles.spec}>
                  <Users size={18} />
                  <span>{currentCar.seats} Seats</span>
                </div>
                <div className={styles.spec}>
                  <Package size={18} />
                  <span>{currentCar.carType}</span>
                </div>
              </div>

              {currentCar.description && (
                <div className={styles.description}>
                  <p>{currentCar.description}</p>
                </div>
              )}

              <div className={styles.actionButtons}>
                {currentCar.availability === 'Available' ? (
                  <button 
                    className={styles.reserveBtn}
                    onClick={() => handleReserve(currentCar)}
                  >
                    Reserve This Car <ArrowRight size={18} />
                  </button>
                ) : (
                  <button 
                    className={styles.notifyBtn}
                    onClick={() => handleNotify(currentCar)}
                  >
                    Notify Me When Available
                  </button>
                )}
              </div>
            </div>
          </div>

          <button className={styles.navBtn} onClick={handleNext}>
            <ChevronRight size={32} />
          </button>
        </div>

        {/* Dots indicator */}
        <div className={styles.dotsContainer}>
          {cars.map((_, idx) => (
            <button
              key={idx}
              className={`${styles.dot} ${idx === currentIndex ? styles.activeDot : ''}`}
              onClick={() => setCurrentIndex(idx)}
            />
          ))}
        </div>
      </div>

      {notifyModalOpen && selectedCarForNotify && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Notify Me When Available</h2>
              <button onClick={() => setNotifyModalOpen(false)} className={styles.closeBtn}>
                <X size={24} />
              </button>
            </div>
            
            <div className={styles.modalCarInfo}>
              <strong>{selectedCarForNotify.name}</strong>
              <div>Status: {selectedCarForNotify.availability}</div>
              <div>Rate: ETB {Number(selectedCarForNotify.dailyRate).toLocaleString()}/day</div>
            </div>

            <form onSubmit={handleNotifySubmit} className={styles.modalForm}>
              <input
                type="text"
                placeholder="Your Full Name *"
                value={notifyFormData.customerName}
                onChange={e => setNotifyFormData({...notifyFormData, customerName: e.target.value})}
                required
              />
              <input
                type="tel"
                placeholder="Phone Number *"
                value={notifyFormData.phone}
                onChange={e => setNotifyFormData({...notifyFormData, phone: e.target.value})}
                required
              />
              <input
                type="email"
                placeholder="Email Address *"
                value={notifyFormData.email}
                onChange={e => setNotifyFormData({...notifyFormData, email: e.target.value})}
                required
              />
              <textarea
                placeholder="Optional Message"
                value={notifyFormData.message}
                onChange={e => setNotifyFormData({...notifyFormData, message: e.target.value})}
                rows="3"
              />
              <div className={styles.modalActions}>
                <button type="submit" className={styles.submitBtn}>Send Notification</button>
                <button type="button" onClick={() => setNotifyModalOpen(false)} className={styles.cancelBtn}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reserveModalOpen && selectedCarForReserve && (
        <RentalAgreementModal 
          car={selectedCarForReserve} 
          isOpen={reserveModalOpen} 
          onClose={() => setReserveModalOpen(false)}
          onSuccess={handleReservationSuccess}
        />
      )}

      <PublicFooter />
    </div>
  );
};

export default FleetGalleryPage;