import React from 'react';
import ServiceDetailPage from './ServiceDetailPage';

const pageData = {
  breadcrumb: 'Sales & POS',
  badge: 'RETAIL EXCELLENCE',
  title: 'Sales & POS',
  accentTitle: 'Management',
  subtitle: 'A fast, intuitive POS interface designed for speed at the counter and intelligence in the back office. Empower your cashiers and delight your customers.',
  primaryCTA: 'Launch POS Demo',
  primaryCTALink: '/login',
  secondaryCTA: 'Learn More',
  heroColor: '#F59E0B',
  heroColorDark: '#92400E',
  heroBg: '#FFFBEB',
  featuresTitle: 'Supercharge Your Sales',
  featuresSubtitle: 'Everything you need to close deals and track revenue.',
  features: [
    {
      icon: '⚡',
      title: 'Fast, Intuitive POS UI',
      desc: 'Reduce transaction times with a streamlined interface designed for rapid checkout during peak hours.',
      tags: []
    },
    {
      icon: '👥',
      title: 'Customer Account Management',
      desc: 'Build lasting relationships. Track customer purchase history and offer tailored experiences.',
      tags: []
    },
    {
      icon: '📊',
      title: 'Per-Product Analytics',
      desc: 'Know what sells. Identify your best-performing items and optimize your product catalog accordingly.',
      tags: []
    }
  ],
  dashboardTitle: 'Daily Sales Summaries',
  dashboardSubtitle: 'End your day with perfect clarity on your revenue.',
  dashboardItems: [
    'Automated end-of-day reconciliation',
    'Cashier performance metrics',
    'Payment method breakdowns'
  ],
  stats: [
    { value: '3x', label: 'Faster Checkout', desc: 'Streamlined UI reduces queue times.' },
    { value: '100%', label: 'Data Accuracy', desc: 'Direct integration with Inventory & Finance.' }
  ],
  ctaTitle: 'Ready to upgrade your checkout experience?',
  ctaSub: 'Join businesses that are selling smarter with Sutana.',
  ctaPrimary: 'Get Started',
  ctaSecondary: 'Talk to Sales'
};

const SalesPage = () => {
  return <ServiceDetailPage data={pageData} />;
};

export default SalesPage;
