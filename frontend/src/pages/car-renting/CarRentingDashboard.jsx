import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import FleetManager from './FleetManager';
import RentalOrdersManager from './RentalOrdersManager';
import carService from '../../services/carService';
import { Bell, Mail, CheckCircle, Clock, LayoutDashboard, Car, FileText } from 'lucide-react';

const CarRentingOverview = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await carService.getNotifyRequests();
      if (res.status === 'success') {
        setNotifications(res.data);
      }
    } catch (error) {
      console.error('Failed to load notifications', error);
    }
  };

  const handleSendEmail = async (req) => {
    const subject = encodeURIComponent(`${req.carName} - Now Available for Rental`);
    const bodyText = `Dear ${req.customerName},

Good news! The ${req.carName} you requested is now available for rental.

Vehicle Details:
• Daily Rate: ${Number(req.carRate).toLocaleString()} ETB
• Status: Available

To reserve this vehicle, visit our Fleet Gallery:
https://sutana.com/fleet-gallery

Thank you for choosing Sutana!

Best regards,
Car Rental Manager
Sutana ERP`;

    const body = encodeURIComponent(bodyText);

    // Open Gmail compose tab directly (not mailto:)
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(req.email)}&su=${subject}&body=${body}`;
    window.open(gmailUrl, '_blank');

    // Also save an in-app notification for the customer's dashboard bell
    const customerNotifs = JSON.parse(localStorage.getItem('customer_car_notifications') || '[]');
    customerNotifs.unshift({
      id: 'CNOTIF-' + Date.now(),
      carName: req.carName,
      customerEmail: req.email,
      message: `Great news! The ${req.carName} you requested is now available for rental.`,
      timestamp: new Date().toISOString(),
      read: false
    });
    localStorage.setItem('customer_car_notifications', JSON.stringify(customerNotifs));

    // Mark the request as processed
    try {
      await carService.markNotifyRequestProcessed(req.id);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark as processed', error);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Bell size={28} color="#2563eb" />
        <h2 style={{ margin: 0, fontSize: '24px', color: '#111827' }}>Notifications ({notifications.length} New)</h2>
      </div>

      {notifications.length === 0 ? (
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', textAlign: 'center', color: '#6b7280', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <CheckCircle size={48} style={{ marginBottom: '16px', color: '#10b981' }} />
          <h3>All caught up!</h3>
          <p>No pending customer requests at the moment.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {notifications.map(req => (
            <div key={req.id} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🚗 {req.carName} <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#6b7280' }}>- {req.carStatus}</span>
                  </h3>
                  <div style={{ color: '#4b5563', fontSize: '14px', marginBottom: '8px' }}>
                    <strong>Customer:</strong> {req.customerName} &nbsp;|&nbsp; {req.phone} &nbsp;|&nbsp; {req.email}
                  </div>
                  <div style={{ backgroundColor: '#f3f4f6', padding: '10px 14px', borderRadius: '6px', fontSize: '14px', color: '#374151', fontStyle: req.message ? 'normal' : 'italic' }}>
                    <strong>Message:</strong> "{req.message || 'No message'}"
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#6b7280', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginBottom: '16px' }}>
                    <Clock size={14} /> Requested: {new Date(req.timestamp).toLocaleString()}
                  </div>
                  <button 
                    onClick={() => handleSendEmail(req)}
                    style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}
                  >
                    <Mail size={16} /> SEND EMAIL TO CUSTOMER
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CarRentingDashboard = () => {
  const menuItems = [
    { label: 'Overview', path: '/car-renting/overview', icon: 'dashboard' },
    { label: 'Fleet Management', path: '/car-renting/fleet', icon: 'inventory' },
    { label: 'Rental Orders', path: '/car-renting/orders', icon: 'list' },
  ];

  return (
    <div>
      <DashboardLayout menuItems={menuItems}>
        <div>
          <Routes>
            <Route path="overview" element={<CarRentingOverview />} />
            <Route path="fleet" element={<FleetManager />} />
            <Route path="orders" element={<RentalOrdersManager />} />
            <Route path="/" element={<Navigate to="fleet" replace />} />
          </Routes>
        </div>
      </DashboardLayout>
    </div>
  );
};

export default CarRentingDashboard;
