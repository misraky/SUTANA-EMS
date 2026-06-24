import React from 'react';
import ServiceDetailPage from './ServiceDetailPage';

const pageData = {
  breadcrumb: 'Finance & Accounting',
  badge: 'IFRS & EFDA COMPLIANT',
  title: 'Finance & Accounting',
  accentTitle: 'Management',
  subtitle: 'Navigate the complexities of Ethiopian financial regulations with confidence. From automated VAT reporting (ETB) to IFRS-standardized audits, Sutana ERP brings absolute precision to your enterprise accounts.',
  primaryCTA: 'Contact a Finance Expert',
  primaryCTALink: '/contact',
  secondaryCTA: 'Download Brochure',
  heroColor: '#0EA5E9',
  heroColorDark: '#0C4A6E',
  heroBg: '#F0F9FF',
  featuresTitle: 'Core Financial Capabilities',
  featuresSubtitle: 'Full-spectrum financial tools tailored for Ethiopian enterprises.',
  features: [
    {
      icon: '🧾',
      title: 'Automated VAT Reporting',
      desc: 'Seamless generation of monthly VAT declarations localized for ETB currencies and Ethiopian tax laws.',
      tags: []
    },
    {
      icon: '💱',
      title: 'Multi-Currency Management',
      desc: 'Handle USD, EUR, and ETB transactions with real-time exchange rate updates and gain/loss tracking.',
      tags: []
    },
    {
      icon: '🛡️',
      title: 'IFRS Compliance Tracking',
      desc: 'Built-in frameworks for International Financial Reporting Standards to satisfy global audit requirements.',
      tags: []
    },
    {
      icon: '💼',
      title: 'Payroll Integration',
      desc: 'Direct sync between HR payroll and the general ledger for automatic expense recording and disbursement.',
      tags: []
    }
  ],
  dashboardTitle: 'Financial Command Center',
  dashboardSubtitle: 'Real-time visibility into your organization\'s liquidity and performance.',
  dashboardItems: [
    'Revenue vs Expenses (ETB)',
    'Net Cash Flow: Br. 12,450,200',
    'Accounts Receivable: Br. 4,120,500'
  ],
  stats: [
    { value: '99.9%', label: 'Data Accuracy', desc: 'Zero-error ledger reconciliation powered by AI auditing.' },
    { value: '40%', label: 'Faster Audits', desc: 'Automated report generation reducing manual verification time.' },
    { value: '100%', label: 'Tax Compliance', desc: 'Strict adherence to Ethiopian Federal Tax Authority protocols.' }
  ],
  ctaTitle: 'Ready to secure your financial future?',
  ctaSub: 'Sutana ERP empowers businesses through data-driven decisions and operational excellence.',
  ctaPrimary: 'Start Free Trial',
  ctaSecondary: 'Talk to Sales'
};

const FinancePage = () => {
  return <ServiceDetailPage data={pageData} />;
};

export default FinancePage;
