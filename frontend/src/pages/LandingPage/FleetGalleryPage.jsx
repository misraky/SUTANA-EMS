import React from 'react';
import ServiceDetailPage from './ServiceDetailPage';

const pageData = {
  breadcrumb: 'Car Rental',
  badge: 'SERVICES > CAR RENTAL',
  title: 'Car Rental',
  accentTitle: 'Management',
  subtitle: 'Sutana transforms fleet operations with a high-performance ecosystem designed for the modern Ethiopian enterprise. Streamline bookings, monitor assets in real-time, and maximize your ROI with intelligent automation.',
  primaryCTA: 'Request a Demo',
  primaryCTALink: '/contact',
  secondaryCTA: 'Download Brochure',
  heroColor: '#0070F2',
  heroColorDark: '#0f172a',
  heroBg: '#F8FAFC',
  heroStat: {
    value: '+25%',
    label: 'Fleet Utilization Increase',
  },
  featuresTitle: 'Precision Engineering for Your Fleet',
  featuresSubtitle: 'Advanced tools designed to solve the complexities of vehicle logistics, driver management, and asset security.',
  features: [
    {
      icon: '📅',
      title: 'Dynamic Fleet Scheduler',
      desc: 'Optimize vehicle turnover with an AI-driven calendar that prevents double bookings and identifies peak demand cycles automatically.',
      tags: []
    },
    {
      icon: '📍',
      title: 'GPS Asset Tracking',
      desc: 'Live telemetry data ensuring your valuable assets are always where they need to be, with geofencing alerts.',
      tags: []
    },
    {
      icon: '🔧',
      title: 'Automated Maintenance Alerts',
      desc: 'Never miss an oil change or tire rotation. Sutana predicts service needs based on mileage and historical usage data.',
      tags: []
    },
    {
      icon: '👤',
      title: 'Driver Performance',
      desc: 'Comprehensive log tracking behavior, safety ratings, and delivery efficiency per vehicle.',
      tags: []
    }
  ],
  dashboardTitle: 'Total Visibility, Single Command.',
  dashboardSubtitle: 'Experience the "Command Center" interface. View real-time status of every car, active rentals, and financial performance through a beautifully crafted dashboard.',
  dashboardItems: [
    'Real-time occupancy metrics',
    'Interactive map view of entire fleet',
    'Instant revenue generation reports'
  ],
  stats: [
    { value: '30%', label: 'Lower OpEx', desc: 'Through automated scheduling and preventative maintenance triggers.' },
    { value: '15k+', label: 'Trips Managed', desc: 'Proven scalability for some of Ethiopia\'s largest logistics hubs.' },
    { value: '24/7', label: 'Asset Security', desc: 'Always-on GPS integration with instant geofence notification system.' }
  ],
  ctaTitle: 'Ready to Optimize Your Fleet?',
  ctaSub: 'Join dozens of enterprise partners who have upgraded their car rental operations with ERP Ethiopia\'s Sutana system.',
  ctaPrimary: 'Schedule Private Demo',
  ctaSecondary: 'Talk to a Specialist'
};

const FleetGalleryPage = () => {
  return <ServiceDetailPage data={pageData} />;
};

export default FleetGalleryPage;