import React from 'react';
import ServiceDetailPage from './ServiceDetailPage';

const pageData = {
  breadcrumb: 'Inventory & Store Management',
  badge: 'WAREHOUSE OPTIMIZATION',
  title: 'Inventory & Store',
  accentTitle: 'Control Center',
  subtitle: 'Eliminate stock-outs and costly over-ordering. Monitor stock levels across multiple locations in real time, track every movement, and set automatic reorder thresholds.',
  primaryCTA: 'Start Managing Stock',
  primaryCTALink: '/login',
  secondaryCTA: 'View Features',
  heroColor: '#10B981',
  heroColorDark: '#065F46',
  heroBg: '#F0FDF4',
  featuresTitle: 'Intelligent Inventory Tools',
  featuresSubtitle: 'End-to-end visibility from the loading dock to the customer.',
  features: [
    {
      icon: '🏢',
      title: 'Multi-Warehouse Support',
      desc: 'Seamlessly track stock across different physical locations, warehouses, and storefronts simultaneously.',
      tags: []
    },
    {
      icon: '🔔',
      title: 'Automated Reorder Alerts',
      desc: 'Never run out of essential items. Set minimum thresholds and get instantly notified when it is time to restock.',
      tags: []
    },
    {
      icon: '📋',
      title: 'Full Audit Trail',
      desc: 'Complete accountability. Track exactly who moved what, when, and where with detailed movement history logs.',
      tags: []
    }
  ],
  dashboardTitle: 'Live Stock Dashboard',
  dashboardSubtitle: 'Your entire warehouse, summarized at a glance.',
  dashboardItems: [
    'Real-time low stock warnings',
    'Incoming shipment ETAs',
    'Value of current inventory (ETB)'
  ],
  stats: [
    { value: '100%', label: 'Movement Tracking', desc: 'Complete historical accuracy.' },
    { value: '0', label: 'Surprise Stock-Outs', desc: 'Predictive analytics keep you prepared.' },
    { value: 'Multi', label: 'Location Sync', desc: 'Perfect for growing enterprises.' }
  ],
  ctaTitle: 'Ready to take control of your stock?',
  ctaSub: 'Sutana provides the tools to ensure your inventory is an asset, not a liability.',
  ctaPrimary: 'Get Started Today',
  ctaSecondary: 'Contact Support'
};

const InventoryPage = () => {
  return <ServiceDetailPage data={pageData} />;
};

export default InventoryPage;
