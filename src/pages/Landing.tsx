
import React from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSection from '@/components/landing/HeroSection';
import ProblemSection from '@/components/landing/ProblemSection';
import SolutionSection from '@/components/landing/SolutionSection';
import ChatShowcaseSection from '@/components/landing/ChatShowcaseSection';
import AutomationCreationSection from '@/components/landing/AutomationCreationSection';
import DiagramBuilderSection from '@/components/landing/DiagramBuilderSection';
import DashboardSection from '@/components/landing/DashboardSection';
import IntegrationsSection from '@/components/landing/IntegrationsSection';
import AIAgentsSection from '@/components/landing/AIAgentsSection';
import UseCasesSection from '@/components/landing/UseCasesSection';
import SecuritySection from '@/components/landing/SecuritySection';
import CollaborationSection from '@/components/landing/CollaborationSection';
import PricingSection from '@/components/landing/PricingSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import TechnicalSpecsSection from '@/components/landing/TechnicalSpecsSection';
import FinalCTASection from '@/components/landing/FinalCTASection';
import LandingFooter from '@/components/landing/LandingFooter';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Removed Navigation Header completely */}
      
      {/* Page Sections */}
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <ChatShowcaseSection />
      <AutomationCreationSection />
      <DiagramBuilderSection />
      <DashboardSection />
      <IntegrationsSection />
      <AIAgentsSection />
      <UseCasesSection />
      <SecuritySection />
      <PricingSection />
      <TestimonialsSection />
      <TechnicalSpecsSection />
      <FinalCTASection />
      <LandingFooter />
    </div>
  );
};

export default Landing;
