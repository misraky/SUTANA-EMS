import React from 'react';
import ServiceDetailPage from './ServiceDetailPage';

const pageData = {
  breadcrumb: 'Commercial Printing',
  badge: 'COMMERCIAL PRINTING MODULE',
  title: 'Precision at Scale.',
  accentTitle: 'Intelligence in Every Pixel.',
  subtitle: 'Manage high-volume print operations with automated workflows, ERCA-compliant invoicing, and real-time resource tracking.',
  primaryCTA: 'Quick Start',
  primaryCTALink: '/login',
  secondaryCTA: 'Module Docs',
  heroColor: '#0070F2',
  heroColorDark: '#0f172a',
  heroBg: '#EFF6FF',
  heroStat: {
    value: '92%',
    label: 'Avg. OEE (Equipment Efficiency)',
  },
  featuresTitle: 'Print Management Dashboard',
  featuresSubtitle: 'Real-time performance metrics across all active facilities.',
  features: [
    {
      icon: '⚙️',
      title: 'Automated Workflow',
      desc: 'End-to-end automation from digital job intake to final logistics. Our AI-driven engine schedules jobs based on machine capability and delivery deadlines, minimizing idle time.',
      tags: ['Smart Pre-flight Checks', 'Dynamic Job Batching'],
      link: { label: 'Explore Orchestration', to: '/contact' }
    },
    {
      icon: '🧾',
      title: 'ERCA Compliance',
      desc: 'Integrated tax engine specifically tailored for high-volume printing. Automatically generate ERCA-compliant invoices and tax reports, ensuring full legal adherence without manual entry.',
      tags: ['Real-time Tax Calculation', 'Automated VAT Reporting'],
      link: { label: 'Compliance Dashboard', to: '/contact' }
    },
    {
      icon: '🎨',
      title: 'Consumables Tracking',
      desc: 'IoT-linked sensors monitor ink, toner, and substrate levels in real-time. Predict when stock will run out based on the current job queue and automate re-ordering processes.',
      tags: ['Low-Stock Predictive Alerts', 'Supplier Auto-Ordering'],
      link: { label: 'Inventory Analytics', to: '/contact' }
    }
  ],
  dashboardTitle: 'Active Print Jobs',
  dashboardSubtitle: 'Monitor every stage of production from prepress to delivery.',
  dashboardItems: [
    'Live job tracking board',
    'Machine status visualization',
    'Expected delivery ETAs'
  ],
  stats: [
    { value: '12', label: 'Active Printing', desc: 'Jobs currently in production across all facilities.' },
    { value: '42', label: 'Queued Jobs', desc: 'Scheduled for next-day production.' },
    { value: '118', label: 'Ready for Pickup', desc: 'Completed and awaiting customer collection.' }
  ],
  ctaTitle: 'Ready to scale your printing operation?',
  ctaSub: 'Join over 100+ commercial printers using Sutana to optimize their output.',
  ctaPrimary: 'Get Started Free',
  ctaSecondary: 'View Pricing',
  ctaSecondaryLink: '/contact'
};

const PrintingPage = () => {
  return <ServiceDetailPage data={pageData} />;
};

export default PrintingPage;
