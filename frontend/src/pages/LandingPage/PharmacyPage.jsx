import React from 'react';
import ServiceDetailPage from './ServiceDetailPage';

const pageData = {
  breadcrumb: 'Pharmacy & Health',
  badge: 'PRECISION TOOLS',
  title: 'Pharmacy & Health',
  accentTitle: 'Management',
  subtitle: 'Comprehensive ERP solution designed for the Ethiopian healthcare sector. Seamlessly manage EFDA compliance, precision inventory tracking, and medical workflows with enterprise-grade reliability.',
  primaryCTA: 'Contact a Health-Tech Expert',
  primaryCTALink: '/contact',
  secondaryCTA: 'Schedule a Demo',
  heroColor: '#7C3AED',
  heroColorDark: '#1E1B4B',
  heroBg: '#F5F3FF',
  featuresTitle: 'Specialized Health-Tech Modules',
  featuresSubtitle: 'End-to-end health-tech solutions for Ethiopian pharmacies and clinics.',
  features: [
    {
      icon: '📦',
      title: 'FEFO Batch Management',
      desc: 'Automated First-Expiry, First-Out logistics ensuring minimal waste and absolute medication safety. Track individual batches across multiple retail points or hospital wings.',
      tags: ['Real-time alerts', 'Expiry prediction']
    },
    {
      icon: '📋',
      title: 'Prescription Fulfillment',
      desc: 'Digital verification flow connecting doctors to pharmacists. Reduce dispensing errors with barcode-driven validation.',
      tags: []
    },
    {
      icon: '🔬',
      title: 'Integrated Lab Reports',
      desc: 'Seamlessly pull laboratory results into patient profiles for data-driven pharmaceutical counseling.',
      tags: []
    },
    {
      icon: '📈',
      title: 'Medical Sales Analytics',
      desc: 'Advanced reporting on revenue cycles, top-dispensed medications, and seasonal trends tailored for the Ethiopian pharmaceutical market.',
      tags: []
    }
  ],
  dashboardTitle: 'Ethiopian Regulatory Alignment',
  dashboardSubtitle: 'Our system is engineered to navigate the unique requirements of the Ethiopian Food and Drug Authority (EFDA). From narcotics tracking to price control regulations, Sutana ERP automates compliance.',
  dashboardItems: [
    'Digital Narcotics Registry: Strict ledger control for controlled substances',
    'Import & Batch Traceability: Complete history of import documents'
  ],
  dashboardVisual: (
    <div style={{background: 'rgba(255,255,255,0.1)', padding: 40, borderRadius: 20, textAlign: 'center', border: '1px solid rgba(255,255,255,0.2)'}}>
      <span style={{fontSize: 48}}>🛡️</span>
      <h3 style={{color:'#fff', marginTop: 16}}>EFDA Regulatory Ready</h3>
    </div>
  ),
  stats: [
    { value: '12', label: 'Stock Alerts (Low)', desc: 'Items below minimum threshold requiring reorder.' },
    { value: 'ETB 45.2k', label: 'Daily Sales Average', desc: 'Rolling 30-day average across all locations.' }
  ],
  ctaTitle: 'Transform Your Healthcare Facility',
  ctaSub: 'Join 100+ pharmacies and clinics in Ethiopia scaling their impact with Sutana Health-Tech.',
  ctaPrimary: 'Get Started Free',
  ctaSecondary: 'View Pricing'
};

const PharmacyPage = () => {
  return <ServiceDetailPage data={pageData} />;
};

export default PharmacyPage;
