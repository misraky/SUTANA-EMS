import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings2, Fuel, Users, Package, 
  CarFront, CheckCircle2, Clock, AlertTriangle, ArrowRight 
} from 'lucide-react';
import { PublicNav, PublicFooter } from './ServicesPage';
import carService from '../../services/carService';
import authService from '../../services/authService';
import styles from './FleetGalleryPage.module.css';

const FleetGalleryPage = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();

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

  const handleReserve = (carId) => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      // Typically opens a reservation modal or goes to booking page
      alert('Reservation form opened for car ID: ' + carId);
    }
  };

  const handleNotify = (carId) => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      // Typically opens a notify me popup
      alert('You will be notified when car ID ' + carId + ' is available.');
    }
  };

  return (
    <div className="public-page cnx-page">
      <PublicNav />
      <div className={styles.galleryContainer}>
        <div className={styles.header}>
        <h1>Our Premium Fleet</h1>
        <p>Choose from our wide selection of high-quality vehicles for any occasion.</p>
      </div>

      {loading ? (
        <div className={styles.loader}>Loading our fleet...</div>
      ) : cars.length === 0 ? (
        <div className={styles.emptyState}>
          <CarFront size={48} className={styles.emptyIcon} />
          <h3>No vehicles available</h3>
          <p>We are currently updating our fleet. Please check back soon.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {cars.map((car) => (
            <div key={car.id} className={styles.card}>
              <div className={styles.imageGallery}>
                <div className={styles.mainImage}>
                  {car.image1 ? (
                    <img src={car.image1} alt={`${car.name} Front`} />
                  ) : (
                    <div className={styles.placeholder}><CarFront size={40} /></div>
                  )}
                </div>
                <div className={styles.thumbnailRow}>
                  {car.image2 ? <img src={car.image2} alt="Side" className={styles.thumbnail} /> : <div className={styles.thumbPlaceholder}><CarFront size={20}/></div>}
                  {car.image3 ? <img src={car.image3} alt="Back" className={styles.thumbnail} /> : <div className={styles.thumbPlaceholder}><CarFront size={20}/></div>}
                  {car.image4 ? <img src={car.image4} alt="Interior" className={styles.thumbnail} /> : <div className={styles.thumbPlaceholder}><CarFront size={20}/></div>}
                </div>
              </div>

              <div className={styles.cardContent}>
                <div className={styles.titleRow}>
                  <h2>{car.name}</h2>
                  <span className={styles.price}>${car.dailyRate}<span>/day</span></span>
                </div>

                <div className={styles.specsGrid}>
                  <div className={styles.spec}>
                    <Settings2 size={16} />
                    <span>{car.transmission}</span>
                  </div>
                  <div className={styles.spec}>
                    <Fuel size={16} />
                    <span>{car.fuelType}</span>
                  </div>
                  <div className={styles.spec}>
                    <Users size={16} />
                    <span>{car.seats} Seats</span>
                  </div>
                  <div className={styles.spec}>
                    <Package size={16} />
                    <span>{car.carType}</span>
                  </div>
                </div>

                {car.description && (
                  <div className={styles.descriptionBox}>
                    <p>{car.description}</p>
                  </div>
                )}

                <div className={styles.actionRow}>
                  <div className={`${styles.statusBadge} ${styles[car.availability.toLowerCase()]}`}>
                    {car.availability === 'Available' && <CheckCircle2 size={16} />}
                    {car.availability === 'Booked' && <Clock size={16} />}
                    {car.availability === 'Maintenance' && <AlertTriangle size={16} />}
                    {car.availability}
                  </div>

                  {car.availability === 'Available' ? (
                    <button 
                      className={styles.primaryBtn}
                      onClick={() => handleReserve(car.id)}
                    >
                      Reserve This Car <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button 
                      className={styles.secondaryBtn}
                      onClick={() => handleNotify(car.id)}
                    >
                      Notify Me
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
      <PublicFooter />
    </div>
  );
};

export default FleetGalleryPage;
