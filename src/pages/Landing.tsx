
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
import CommunitySection from '@/components/landing/CommunitySection';
import DocumentationSection from '@/components/landing/DocumentationSection';
import CompanyMissionSection from '@/components/landing/CompanyMissionSection';
import FinalCTASection from '@/components/landing/FinalCTASection';
import LandingFooter from '@/components/landing/LandingFooter';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">Y</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              YusrAI
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</a>
            <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors">Pricing</a>
            <a href="#security" className="text-gray-600 hover:text-blue-600 transition-colors">Security</a>
            <a href="#community" className="text-gray-600 hover:text-blue-600 transition-colors">Community</a>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/auth')}
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={() => navigate('/auth')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-xl hover:shadow-lg transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

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
      <CollaborationSection />
      <PricingSection />
      <TestimonialsSection />
      <TechnicalSpecsSection />
      <CommunitySection />
      <DocumentationSection />
      <CompanyMissionSection />
      <FinalCTASection />
      <LandingFooter />
    </div>
  );
};

export default Landing;
