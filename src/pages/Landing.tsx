
import React from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSection from '@/components/landing/HeroSection';
import ProblemSection from '@/components/landing/ProblemSection';
import SolutionSection from '@/components/landing/SolutionSection';
import AuthenticChatShowcase from '@/components/landing/AuthenticChatShowcase';
import AuthenticDiagramShowcase from '@/components/landing/AuthenticDiagramShowcase';
import AuthenticDashboardShowcase from '@/components/landing/AuthenticDashboardShowcase';
import IntegrationsSection from '@/components/landing/IntegrationsSection';
import IndustryShowcaseSection from '@/components/landing/IndustryShowcaseSection';
import AIAgentsSection from '@/components/landing/AIAgentsSection';
import SecuritySection from '@/components/landing/SecuritySection';
import PricingSection from '@/components/landing/PricingSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import TechnicalSpecsSection from '@/components/landing/TechnicalSpecsSection';
import FinalCTASection from '@/components/landing/FinalCTASection';
import LandingFooter from '@/components/landing/LandingFooter';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <HeroSection />
      
      {/* Problem Section */}
      <ProblemSection />
      
      {/* Solution Section */}
      <SolutionSection />
      
      {/* Authentic Showcases - Single Clean Examples */}
      <AuthenticChatShowcase />
      <AuthenticDiagramShowcase />
      <AuthenticDashboardShowcase />
      
      {/* Platform Integrations */}
      <IntegrationsSection />
      
      {/* Industry-Specific Showcases */}
      <IndustryShowcaseSection />
      
      {/* AI Agents Section */}
      <AIAgentsSection />
      
      {/* Security Section */}
      <SecuritySection />
      
      {/* Pricing Section */}
      <PricingSection />
      
      {/* Testimonials Section */}
      <TestimonialsSection />
      
      {/* Technical Specs Section */}
      <TechnicalSpecsSection />
      
      {/* Final CTA Section */}
      <FinalCTASection />
      
      {/* Footer */}
      <LandingFooter />
    </div>
  );
};

export default Landing;
