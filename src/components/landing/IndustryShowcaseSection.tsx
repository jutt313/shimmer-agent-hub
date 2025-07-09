
import React, { useState } from 'react';
import { ShoppingBag, Stethoscope, GraduationCap, Briefcase, Building2, TrendingUp, Users, MessageCircle, BarChart3, GitBranch, ArrowRight } from 'lucide-react';

const IndustryShowcaseSection = () => {
  const [activeIndustry, setActiveIndustry] = useState(0);
  const [activeView, setActiveView] = useState<'chat' | 'diagram' | 'dashboard'>('chat');

  const industries = [
    {
      name: 'E-commerce',
      icon: ShoppingBag,
      color: 'from-green-500 to-emerald-500',
      description: 'Automate order processing, inventory management, and customer communications',
      chatExample: {
        userMessage: "Automate my Shopify order processing and customer notifications",
        aiResponse: "Perfect! I'll create a comprehensive e-commerce automation that handles orders, inventory, and customer communications automatically.",
        steps: [
          { name: 'Order Detection', status: 'completed', description: 'Monitor new Shopify orders' },
          { name: 'Inventory Update', status: 'completed', description: 'Sync stock levels automatically' },
          { name: 'Customer Notification', status: 'processing', description: 'Send order confirmations' }
        ]
      },
      dashboardData: {
        totalRuns: 4782,
        successRate: 98.3,
        avgTime: '1.2s',
        services: ['Shopify', 'Mailchimp', 'Slack', 'Google Sheets']
      }
    },
    {
      name: 'Healthcare',
      icon: Stethoscope,
      color: 'from-blue-500 to-cyan-500',
      description: 'Streamline patient management, appointments, and medical record processing',
      chatExample: {
        userMessage: "Set up patient appointment scheduling with insurance verification",
        aiResponse: "Excellent! I'll build a comprehensive healthcare workflow that manages patient intake, scheduling, and insurance verification automatically.",
        steps: [
          { name: 'Patient Intake', status: 'completed', description: 'Process patient information forms' },
          { name: 'Insurance Verification', status: 'completed', description: 'Verify coverage and benefits' },
          { name: 'Appointment Scheduling', status: 'processing', description: 'Auto-schedule based on availability' }
        ]
      },
      dashboardData: {
        totalRuns: 2943,
        successRate: 96.7,
        avgTime: '2.1s',
        services: ['Epic', 'Calendly', 'Twilio', 'DocuSign']
      }
    },
    {
      name: 'IT & Tech',
      icon: Building2,
      color: 'from-purple-500 to-indigo-500',
      description: 'Automate system monitoring, incident response, and deployment workflows',
      chatExample: {
        userMessage: "Automate our incident response and system monitoring alerts",
        aiResponse: "Great choice! I'll create an intelligent IT operations automation that monitors systems, detects issues, and manages incident response workflows.",
        steps: [
          { name: 'System Monitoring', status: 'completed', description: 'Monitor server health and performance' },
          { name: 'Alert Processing', status: 'completed', description: 'Filter and prioritize alerts' },
          { name: 'Incident Creation', status: 'processing', description: 'Auto-create tickets for issues' }
        ]
      },
      dashboardData: {
        totalRuns: 8921,
        successRate: 99.1,
        avgTime: '0.8s',
        services: ['PagerDuty', 'Jira', 'Slack', 'DataDog']
      }
    },
    {
      name: 'Marketing',
      icon: TrendingUp,
      color: 'from-pink-500 to-rose-500',
      description: 'Automate lead generation, campaign management, and customer journey workflows',
      chatExample: {
        userMessage: "Create an automated lead nurturing campaign with personalization",
        aiResponse: "Perfect! I'll build a comprehensive marketing automation that captures leads, segments audiences, and delivers personalized content automatically.",
        steps: [
          { name: 'Lead Capture', status: 'completed', description: 'Collect leads from multiple sources' },
          { name: 'Audience Segmentation', status: 'completed', description: 'Categorize leads by behavior' },
          { name: 'Personalized Campaigns', status: 'processing', description: 'Send targeted email sequences' }
        ]
      },
      dashboardData: {
        totalRuns: 6547,
        successRate: 94.8,
        avgTime: '1.5s',
        services: ['HubSpot', 'Mailchimp', 'Facebook Ads', 'Google Analytics']
      }
    },
    {
      name: 'Sales',
      icon: Users,
      color: 'from-orange-500 to-red-500',
      description: 'Streamline CRM updates, follow-ups, and pipeline management',
      chatExample: {
        userMessage: "Automate lead qualification and CRM pipeline management",
        aiResponse: "Excellent! I'll create a smart sales automation that qualifies leads, updates your CRM, and manages your sales pipeline automatically.",
        steps: [
          { name: 'Lead Scoring', status: 'completed', description: 'Score leads based on behavior' },
          { name: 'CRM Updates', status: 'completed', description: 'Sync lead data automatically' },
          { name: 'Follow-up Scheduling', status: 'processing', description: 'Schedule personalized outreach' }
        ]
      },
      dashboardData: {
        totalRuns: 3821,
        successRate: 97.2,
        avgTime: '1.8s',
        services: ['Salesforce', 'Calendly', 'LinkedIn', 'Outreach']
      }
    },
    {
      name: 'SaaS',
      icon: Building2,
      color: 'from-indigo-500 to-purple-500',
      description: 'Optimize user onboarding, feature adoption, and churn prevention',
      chatExample: {
        userMessage: "Automate user onboarding and feature adoption tracking",
        aiResponse: "Great! I'll build a comprehensive SaaS automation that guides users through onboarding, tracks feature usage, and prevents churn automatically.",
        steps: [
          { name: 'User Onboarding', status: 'completed', description: 'Guide new users through setup' },
          { name: 'Feature Tracking', status: 'completed', description: 'Monitor feature adoption rates' },
          { name: 'Churn Prevention', status: 'processing', description: 'Identify at-risk users' }
        ]
      },
      dashboardData: {
        totalRuns: 5632,
        successRate: 95.4,
        avgTime: '1.3s',
        services: ['Mixpanel', 'Intercom', 'Stripe', 'Segment']
      }
    }
  ];

  const currentIndustry = industries[activeIndustry];

  const renderChatView = () => (
    <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
      <div className={`bg-gradient-to-r ${currentIndustry.color} p-4 text-white`}>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-white/30 rounded-full"></div>
          <div className="w-3 h-3 bg-white/30 rounded-full"></div>
          <div className="w-3 h-3 bg-white/30 rounded-full"></div>
          <span className="ml-auto text-sm font-medium">YusrAI - {currentIndustry.name}</span>
        </div>
      </div>
      
      <div className="p-6 h-96 overflow-y-auto space-y-4">
        <div className="flex justify-end">
          <div className="bg-blue-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-md">
            {currentIndustry.chatExample.userMessage}
          </div>
        </div>
        
        <div className="flex justify-start">
          <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 max-w-md">
            {currentIndustry.chatExample.aiResponse}
          </div>
        </div>
        
        <div className="space-y-3 ml-2">
          {currentIndustry.chatExample.steps.map((step, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step.status === 'completed' ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  <div className={`w-3 h-3 rounded-full ${
                    step.status === 'completed' ? 'bg-green-500' : 'bg-blue-500 animate-spin'
                  }`}></div>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{step.name}</div>
                  <div className="text-sm text-gray-600">{step.description}</div>
                </div>
                <div className={`text-xs px-2 py-1 rounded-full ${
                  step.status === 'completed' 
                    ? 'text-green-600 bg-green-100' 
                    : 'text-blue-600 bg-blue-100'
                }`}>
                  {step.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDiagramView = () => (
    <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden p-8">
      <h3 className="text-xl font-bold text-gray-900 mb-6">{currentIndustry.name} Workflow</h3>
      <div className="relative h-80 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl overflow-hidden border border-gray-100">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}></div>
        
        {/* Workflow visualization */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="text-center">
            <GitBranch className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <p className="text-gray-600">Visual workflow for {currentIndustry.name}</p>
            <p className="text-sm text-gray-500 mt-2">Complex logic made simple</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDashboardView = () => (
    <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">{currentIndustry.name} Dashboard</h3>
        <div className="flex items-center gap-2 text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Live</span>
        </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="text-sm text-gray-600">Total Runs</div>
          <div className="text-2xl font-bold text-blue-600">{currentIndustry.dashboardData.totalRuns.toLocaleString()}</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <div className="text-sm text-gray-600">Success Rate</div>
          <div className="text-2xl font-bold text-green-600">{currentIndustry.dashboardData.successRate}%</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4">
          <div className="text-sm text-gray-600">Avg Time</div>
          <div className="text-2xl font-bold text-purple-600">{currentIndustry.dashboardData.avgTime}</div>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-semibold text-gray-900 mb-3">Connected Services</h4>
        <div className="grid grid-cols-2 gap-3">
          {currentIndustry.dashboardData.services.map((service, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-700">{service}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full mb-6">
            <Building2 className="w-4 h-4" />
            <span className="text-sm font-medium">Industry Solutions</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Perfect for
            <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Every Industry
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From e-commerce to healthcare, our AI automation adapts to your industry's unique needs. 
            See exactly how it works for your business.
          </p>
        </div>

        {/* Industry Selector */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {industries.map((industry, index) => {
            const IconComponent = industry.icon;
            return (
              <button
                key={index}
                onClick={() => setActiveIndustry(index)}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-medium transition-all duration-300 ${
                  activeIndustry === index
                    ? `bg-gradient-to-r ${industry.color} text-white shadow-lg scale-105`
                    : 'bg-white text-gray-600 hover:text-gray-900 hover:shadow-md border border-gray-200'
                }`}
              >
                <IconComponent className="w-5 h-5" />
                <span>{industry.name}</span>
              </button>
            );
          })}
        </div>

        {/* View Navigation */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setActiveView('chat')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeView === 'chat'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            Chat Interface
          </button>
          <button
            onClick={() => setActiveView('diagram')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeView === 'diagram'
                ? 'bg-purple-500 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            Visual Workflow
          </button>
          <button
            onClick={() => setActiveView('dashboard')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeView === 'dashboard'
                ? 'bg-green-500 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics Dashboard
          </button>
        </div>

        {/* Content Display */}
        <div className="max-w-4xl mx-auto mb-12">
          {activeView === 'chat' && renderChatView()}
          {activeView === 'diagram' && renderDiagramView()}
          {activeView === 'dashboard' && renderDashboardView()}
        </div>

        {/* Industry Description */}
        <div className="text-center">
          <div className={`inline-block bg-gradient-to-r ${currentIndustry.color} rounded-2xl p-8 text-white max-w-2xl`}>
            <h3 className="text-2xl font-bold mb-4">{currentIndustry.name} Automation</h3>
            <p className="text-lg opacity-90 mb-6">{currentIndustry.description}</p>
            <button 
              onClick={() => window.location.href = '/auth'}
              className="bg-white text-gray-900 px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all inline-flex items-center gap-2"
            >
              Start {currentIndustry.name} Automation
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IndustryShowcaseSection;
