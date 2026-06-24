import React from 'react';
import ServiceDetailPage from './ServiceDetailPage';

const pageData = {
  breadcrumb: 'Farming & Agriculture',
  badge: 'NEXT-GEN AGTECH',
  title: 'Farming & Agriculture',
  accentTitle: 'Management',
  subtitle: 'Automate crop cycles, manage livestock logistics, and optimize yields with Ethiopia\'s most powerful integrated agribusiness platform.',
  primaryCTA: 'Contact an Ag-Tech Expert',
  primaryCTALink: '/contact',
  secondaryCTA: 'Schedule a Demo',
  heroColor: '#059669',
  heroColorDark: '#064E3B',
  heroBg: '#ECFDF5',
  heroStat: {
    value: '98%',
    label: 'Yield Prediction Accuracy for 2024',
  },
  featuresTitle: 'Precision Agriculture Modules',
  featuresSubtitle: 'Modular solutions designed to scale with your farming operations, from single small-holds to multi-location enterprises.',
  features: [
    {
      icon: '📊',
      title: 'Harvest Yield Analysis',
      desc: 'Leverage machine learning for data-driven crop predictions based on soil history, weather patterns, and real-time sensor data.',
      link: { label: 'Explore Analytics', to: '/contact' }
    },
    {
      icon: '🚜',
      title: 'Multi-Farm Inventory',
      desc: 'Centralized management of seeds, fertilizers, and equipment across disparate geographical locations with automated re-ordering.',
      link: { label: 'Manage Assets', to: '/contact' }
    },
    {
      icon: '🌍',
      title: 'Export Compliance',
      desc: 'Fully localized for Ethiopian trade laws. Handle regulatory documentation for coffee, pulses, and grain exports with ease.',
      link: { label: 'View Compliance', to: '/contact' }
    }
  ],
  dashboardTitle: 'The Intelligence Hub',
  dashboardSubtitle: 'Monitor your entire operation from a single pane of glass. Our interface brings together soil health metrics, drone imagery, and seasonal labor trends.',
  dashboardItems: [
    'Live Soil PH & Moisture Tracking',
    'Automated Irrigation Schedules',
    'Satellite Crop Health Monitoring'
  ],
  stats: [
    { value: '15%', label: 'Increase in Yield', desc: 'Average improvement observed across our partner farms in the first harvest cycle.' },
    { value: '500+', label: 'Farms Managed', desc: 'Empowering agribusinesses across East Africa with world-class cloud infrastructure.' },
    { value: '24/7', label: 'Soil Monitoring', desc: 'Constant data streaming ensures you\'re never surprised by environmental shifts.' }
  ],
  ctaTitle: 'Transform Your Agribusiness into a High-Performance Data Machine.',
  ctaSub: 'Join the hundreds of Ethiopian farmers scaling their operations with Sutana ERP. Our team is ready to help you implement a solution tailored to your land.',
  ctaPrimary: 'Get Started',
  ctaSecondary: 'Contact Sales'
};

const FarmingPage = () => {
  return <ServiceDetailPage data={pageData} />;
};

export default FarmingPage;
