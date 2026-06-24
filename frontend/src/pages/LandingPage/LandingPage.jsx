import React from 'react';
import { PublicNav } from './ServicesPage';
import './PublicLayout.css';
import Carousel from './Carousel';
import EventSection from './EventSection';
import {
  StatsSection, CapabilitiesSection, GettingStartedSection,
  WhySutanaSection, TestimonialsSection, CTASection
} from './ModernSections';

const LandingPage = () => (
  <div className="public-page cnx-page">
    <PublicNav />
    <Carousel />
    <EventSection />
    <StatsSection />
    <CapabilitiesSection />
    <GettingStartedSection />
    <WhySutanaSection />
    <TestimonialsSection />
    <CTASection />
  </div>
);

export default LandingPage;

