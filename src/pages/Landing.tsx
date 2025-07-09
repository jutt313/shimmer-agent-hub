import React from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSection from '@/components/landing/HeroSection';
import ProblemSection from '@/components/landing/ProblemSection';
import SolutionSection from '@/components/landing/SolutionSection';
import AuthenticChatShowcase from '@/components/landing/AuthenticChatShowcase';
import AuthenticDiagramShowcase from '@/components/landing/AuthenticDiagramShowcase';
import AuthenticDashboardShowcase from '@/components/landing/AuthenticDashboardShowcase';
import AutomationCreationSection from '@/components/landing/AutomationCreationSection';
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
      {/* Enhanced Sections */}
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      
      {/* Authentic Showcases */}
      <AuthenticChatShowcase />
      <AuthenticDiagramShowcase />
      <AuthenticDashboardShowcase />
      
      {/* Existing Sections */}
      <AutomationCreationSection />
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
