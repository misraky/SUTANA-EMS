import React from 'react';
import ServiceDetailPage from './ServiceDetailPage';

const pageData = {
  breadcrumb: 'Purchase & Procurement',
  badge: 'SUPPLY CHAIN MASTERY',
  title: 'Purchase & Procurement',
  accentTitle: 'Management',
  subtitle: 'Streamline vendor management, track purchase order lifecycles, and confirm deliveries automatically. Build a robust, reliable supply chain.',
  primaryCTA: 'Optimize Supply Chain',
  primaryCTALink: '/login',
  secondaryCTA: 'View Features',
  heroColor: '#8B5CF6',
  heroColorDark: '#4C1D95',
  heroBg: '#F5F3FF',
  featuresTitle: 'Smarter Procurement',
  featuresSubtitle: 'Tools to ensure you always get the best materials on time.',
  features: [
    {
      icon: '📄',
      title: 'Digital PO Creation',
      desc: 'Create, approve, and send purchase orders to suppliers in seconds directly from the system.',
      tags: []
    },
    {
      icon: '⭐',
      title: 'Supplier Performance Ratings',
      desc: 'Rate suppliers on delivery accuracy and quality to make data-driven procurement decisions.',
      tags: []
    },
    {
      icon: '📦',
      title: 'Delivery Alert System',
      desc: 'Track expected delivery dates and receive notifications if shipments are delayed.',
      tags: []
    }
  ],
  dashboardTitle: 'Procurement Overview',
  dashboardSubtitle: 'Keep your finger on the pulse of your incoming goods.',
  dashboardItems: [
    'Active Purchase Orders tracking',
    'Supplier quality scorecards',
    'Automated inventory update on receipt'
  ],
  stats: [
    { value: '99%', label: 'PO Accuracy', desc: 'Eliminate manual data entry errors.' },
    { value: 'Real-time', label: 'Inventory Sync', desc: 'Instant updates upon delivery confirmation.' }
  ],
  ctaTitle: 'Ready to build a stronger supply chain?',
  ctaSub: 'Empower your procurement team with the tools they need to succeed.',
  ctaPrimary: 'Get Started',
  ctaSecondary: 'Contact Support'
};

const PurchasePage = () => {
  return <ServiceDetailPage data={pageData} />;
};

export default PurchasePage;
