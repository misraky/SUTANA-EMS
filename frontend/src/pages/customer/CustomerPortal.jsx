import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import CustomerOrders from './CustomerOrders';
import CustomerOrderForm from './CustomerOrderForm';
import OrderTracking from './OrderTracking';
import CustomerReceipts from './CustomerReceipts';
import CustomerProfile from './CustomerProfile';
import CustomerInvoices from './CustomerInvoices';
import SupportTickets from './SupportTickets';
import CustomerRentals from './CustomerRentals';
import CustomerPrescriptions from './CustomerPrescriptions';
import CustomerFarmingOrders from './CustomerFarmingOrders';
import CustomerPrintingOrders from './CustomerPrintingOrders';
import CustomerRetailOrders from './CustomerRetailOrders';
import CustomerPortalHome from './CustomerPortalHome';
import CustomerBids from './CustomerBids';
import CustomerAllOrders from './CustomerAllOrders';
import { Printer, Sprout, Pill, Package, Car, X } from 'lucide-react';

const OPTIONS = [
  { label: 'Printing Order', desc: 'Books, Modules, Exams, Brochures, Tax Receipts', icon: <Printer size={28} />, color: '#3b82f6', bg: '#eff6ff', path: '/services/printing' },
  { label: 'Farming Order', desc: 'Seeds, Fertilizers, Tools, Pesticides', icon: <Sprout size={28} />, color: '#059669', bg: '#ecfdf5', path: '/services/farming' },
  { label: 'Car Rental', desc: 'Vehicle rental, fleet management & short/long term', icon: <Car size={28} />, color: '#8b5cf6', bg: '#f5f3ff', path: '/fleet-gallery' },
  { label: 'Pharmacy Order', desc: 'Medicines, Prescriptions, Health Products', icon: <Pill size={28} />, color: '#ec4899', bg: '#fdf2f8', path: '/services/pharmacy' },
  { label: 'Retail Order', desc: 'Stationery, Electronics, Office Supplies & more', icon: <Package size={28} />, color: '#d97706', bg: '#fffbeb', path: '/services/retail' },
];

export const PlaceOrderModal = ({ open, onClose }) => {
  const navigate = useNavigate();
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'white', borderRadius: 16, padding: '2rem', maxWidth: 500, width: '90%',
        boxShadow: '0 25px 60px rgba(0,0,0,0.2)', position: 'relative'
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
          <X size={20} />
        </button>
        <h2 style={{ margin: '0 0 4px', fontSize: 20, color: '#1e293b' }}>New Order</h2>
        <p style={{ margin: '0 0 1.25rem', fontSize: 13, color: '#64748b' }}>What would you like to order?</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {OPTIONS.map(opt => (
            <button key={opt.label} onClick={() => { onClose(); navigate(opt.path); }} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
              background: opt.bg, border: `1px solid ${opt.color}30`, borderRadius: 12,
              cursor: 'pointer', textAlign: 'left', transition: 'transform 0.1s'
            }}>
              <div style={{ color: opt.color, flexShrink: 0 }}>{opt.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: opt.color }}>{opt.label}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{opt.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const NewOrderPage = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const handleClose = () => { setOpen(false); navigate('/customer/portal'); };
  return <PlaceOrderModal open={open} onClose={handleClose} />;
};

const CustomerPortal = () => {
  const [showPlaceOrder, setShowPlaceOrder] = useState(false);

  const menuItems = [
    { label: 'Portal Home', path: '/customer/portal', icon: 'home' },
    { label: 'Browse Cars', path: '/fleet-gallery', icon: 'car', isExternal: true },
    { label: 'My Rentals', path: '/customer/rentals', icon: 'key' },
    { label: 'My Orders', path: '/customer/orders', icon: 'package' },
    { label: 'Place Order', path: '/customer/new-order', icon: 'plus-circle' },
    { label: 'Receipts', path: '/customer/receipts', icon: 'file-text' },
    { label: 'Invoices', path: '/customer/invoices', icon: 'credit-card' },
    { label: 'Support', path: '/customer/support', icon: 'message-circle' },
    { label: 'Profile', path: '/customer/profile', icon: 'user' },
    { label: 'Portal Home',    path: '/customer/portal',          icon: 'home' },
    { label: 'New Order',      path: '/customer/new-order',       icon: 'plus-circle' },
    { label: 'All Orders',     path: '/customer/all-orders',      icon: 'list' },
    { label: 'Receipts',       path: '/customer/receipts',       icon: 'receipt' },
    { label: 'Invoices',       path: '/customer/invoices',       icon: 'file-text' },
    { label: 'My Bids',        path: '/customer/bids',           icon: 'clipboard' },
    { label: 'Support',        path: '/customer/support',        icon: 'message-circle' },
  ];

  return (
    <div style={{ position: 'relative' }}>
      <DashboardLayout menuItems={menuItems}>
        <Routes>
          <Route path="portal" element={<CustomerPortalHome onPlaceOrder={() => setShowPlaceOrder(true)} />} />
          <Route path="orders" element={<CustomerOrders />} />
          <Route path="orders/:id/track" element={<OrderTracking />} />
          <Route path="new-order" element={<NewOrderPage />} />
          <Route path="new-printing-order" element={<CustomerOrderForm />} />
          <Route path="receipts" element={<CustomerReceipts />} />
          <Route path="invoices" element={<CustomerInvoices />} />
          <Route path="prescriptions" element={<CustomerPrescriptions />} />
          <Route path="farming-orders" element={<CustomerFarmingOrders />} />
          <Route path="printing-orders" element={<CustomerPrintingOrders />} />
          <Route path="retail-orders" element={<CustomerRetailOrders />} />
          <Route path="support" element={<SupportTickets />} />
          <Route path="profile" element={<CustomerProfile />} />
          <Route path="all-orders" element={<CustomerAllOrders />} />
          <Route path="rentals" element={<CustomerRentals />} />
          <Route path="bids" element={<CustomerBids />} />
          <Route path="/" element={<Navigate to="portal" replace />} />
        </Routes>
      </DashboardLayout>
      <PlaceOrderModal open={showPlaceOrder} onClose={() => setShowPlaceOrder(false)} />
    </div>
  );
};

export default CustomerPortal;
