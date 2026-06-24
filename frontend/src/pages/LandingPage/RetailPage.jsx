import React from 'react';
import ServiceDetailPage from './ServiceDetailPage';

const pageData = {
  breadcrumb: 'Retail Store',
  badge: 'MODULES / RETAIL STORE',
  title: 'Retail Operations',
  accentTitle: 'Center',
  subtitle: 'Unified omnichannel commerce engine driving growth through intelligent inventory, mobile POS, and deep customer insights.',
  primaryCTA: 'Generate Report',
  primaryCTALink: '/contact',
  secondaryCTA: 'Open Store Terminal',
  heroColor: '#EA580C',
  heroColorDark: '#9A3412',
  heroBg: '#FFF7ED',
  featuresTitle: 'Real-Time Sync',
  featuresSubtitle: 'Omnichannel Inventory Control. Synchronize your entire catalog across brick-and-mortar stores, e-commerce platforms, and social marketplaces.',
  features: [
    {
      icon: '📱',
      title: 'Integrated Mobile POS',
      desc: 'Equip your floor staff with handheld devices that handle checkout, inventory lookups, and customer profile management instantly.',
      link: { label: 'Request Demo', to: '/contact' }
    },
    {
      icon: '💳',
      title: 'CRM & Loyalty Rewards',
      desc: 'Deeply understand customer behavior. Track purchase history and automate personalized rewards that keep them coming back.',
      tags: ['Top Tier VIP', 'Frequent Gold']
    }
  ],
  dashboardTitle: 'Operations Performance Matrix',
  dashboardSubtitle: 'Aggregated data across all retail locations.',
  dashboardItems: [
    'Multi-warehouse allocation logic',
    'Buy-online-pickup-in-store (BOPIS)',
    'Predictive stock replenishment AI'
  ],
  stats: [
    { value: '14,290', label: 'Daily Footfall', desc: '+12% from last month across all locations.' },
    { value: 'ETB 2,450', label: 'Avg. Transaction Value', desc: '+5.4% vs previous quarter.' },
    { value: '6.8x', label: 'Stock Turnover Rate', desc: 'Industry-leading inventory efficiency.' },
    { value: '98.2%', label: 'Terminal Efficiency', desc: 'Zero unplanned downtime this month.' }
  ],
  ctaTitle: 'Ready to scale your retail presence?',
  ctaSub: 'Join over 500+ global brands using Sutana ERP to streamline their operations and deliver world-class shopping experiences.',
  ctaPrimary: 'Book a Consultation',
  ctaSecondary: 'Download Whitepaper'
};

const RetailPage = () => {
  return <ServiceDetailPage data={pageData} />;
};

export default RetailPage;
