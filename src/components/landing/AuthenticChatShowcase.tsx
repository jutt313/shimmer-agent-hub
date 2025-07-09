
import React, { useState } from 'react';
import { MessageCircle, ArrowRight, Sparkles, ChevronDown } from 'lucide-react';

const AuthenticChatShowcase = () => {
  const [selectedIndustry, setSelectedIndustry] = useState(0);

  const industries = [
    {
      name: 'E-commerce',
      color: 'from-blue-500 to-cyan-500',
      userQuery: 'Automate my Shopify orders to update inventory and notify customers',
      aiResponse: 'Perfect! I\'ll create a comprehensive e-commerce order management automation for you.',
      cards: [
        { title: 'Shopify Integration', description: '█████ ███ ██████ monitoring', status: 'completed' },
        { title: 'Inventory Sync', description: '██████ █████ ████ updates', status: 'completed' },
        { title: 'Customer Notification', description: '████ ████████ ██ notifications', status: 'completed' }
      ]
    },
    {
      name: 'Healthcare',
      color: 'from-green-500 to-emerald-500',
      userQuery: 'Set up patient appointment scheduling with insurance verification',
      aiResponse: 'Excellent! I\'ll build an intelligent healthcare workflow that handles patient intake automatically.',
      cards: [
        { title: 'Patient Intake', description: '██ ██████████ incoming data', status: 'completed' },
        { title: 'Schedule Management', description: '█████ ██ ████████ calendar', status: 'completed' },
        { title: 'Insurance Verification', description: '███████ ██████ ████ checks', status: 'completed' }
      ]
    },
    {
      name: 'Real Estate',
      color: 'from-purple-500 to-pink-500',
      userQuery: 'Capture leads from website and sync to CRM with follow-up sequence',
      aiResponse: 'Great choice! I\'ll create a lead qualification system that nurtures prospects automatically.',
      cards: [
        { title: 'Lead Capture', description: '██████ ████ ███ processing', status: 'completed' },
        { title: 'CRM Integration', description: '█████ ██ ████████ sync', status: 'completed' },
        { title: 'Follow-up Sequence', description: '████████ ██████ ████ flow', status: 'completed' }
      ]
    },
    {
      name: 'SaaS',
      color: 'from-indigo-500 to-purple-500',
      userQuery: 'Automate user onboarding from trial signup to product usage tracking',
      aiResponse: 'Perfect! I\'ll build a comprehensive onboarding automation that maximizes user success.',
      cards: [
        { title: 'Trial Signup', description: '████ ████████ ██ processing', status: 'completed' },
        { title: 'Onboarding Flow', description: '██████ ████████ ██ guidance', status: 'completed' },
        { title: 'Usage Tracking', description: '████████ ██████ ███ analytics', status: 'completed' }
      ]
    },
    {
      name: 'Education',
      color: 'from-orange-500 to-red-500',
      userQuery: 'Handle student applications, enrollment, and course assignments automatically',
      aiResponse: 'Excellent! I\'ll create an intelligent education workflow that streamlines student management.',
      cards: [
        { title: 'Application Processing', description: '███████ ████ ██████ review', status: 'completed' },
        { title: 'Enrollment Management', description: '████████ ███████ ██ process', status: 'completed' },
        { title: 'Course Assignment', description: '██████ ████████ ███ matching', status: 'completed' }
      ]
    }
  ];

  const currentIndustry = industries[selectedIndustry];

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-purple-50/40 via-blue-50/50 to-indigo-50/40">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-6">
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Natural Language Processing</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Just Tell Us What You Need
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Our AI understands natural language and builds complex automation from simple conversations. 
            Watch how easy it is to create powerful workflows.
          </p>

          {/* Industry Selector */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {industries.map((industry, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndustry(index)}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                  selectedIndustry === index
                    ? `bg-gradient-to-r ${industry.color} text-white shadow-lg`
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {industry.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Authentic Chat Interface */}
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className={`bg-gradient-to-r ${currentIndustry.color} p-4 text-white`}>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                <span className="ml-auto text-sm font-medium">YusrAI Chat - {currentIndustry.name}</span>
              </div>
            </div>
            
            <div className="p-6 h-96 overflow-y-auto space-y-4">
              {/* User Message */}
              <div className="flex justify-end">
                <div className="bg-blue-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-md">
                  {currentIndustry.userQuery}
                </div>
              </div>
              
              {/* AI Response */}
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 max-w-md">
                  {currentIndustry.aiResponse}
                </div>
              </div>
              
              {/* Credentials Section (Blurred) */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Required Credentials:</h4>
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <span className="text-sm text-gray-600 blur-sm">██████ ███ ████████</span>
                      <button className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded blur-sm">
                        ████
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Response Cards */}
              <div className="space-y-3 ml-2">
                {currentIndustry.cards.map((card, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{card.title}</div>
                        <div className="text-sm text-gray-600 font-mono">{card.description}</div>
                      </div>
                      <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        {card.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Bar (Blurred) */}
              <div className="bg-gray-50 rounded-xl p-3 mt-4">
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder="████ ████ ██████ █████..."
                    className="flex-1 bg-transparent text-gray-400 placeholder-gray-400 blur-sm"
                    disabled
                  />
                  <button className="bg-blue-500 text-white p-2 rounded-lg blur-sm">
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${currentIndustry.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Industry-Specific Intelligence</h3>
                  <p className="text-gray-600">Our AI understands {currentIndustry.name.toLowerCase()} workflows and automatically suggests the best automation approaches for your industry.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${currentIndustry.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Secure Credential Management</h3>
                  <p className="text-gray-600">All sensitive information is encrypted and secured. We never expose your credentials or business data.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${currentIndustry.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <ArrowRight className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Real-time Progress Tracking</h3>
                  <p className="text-gray-600">Watch your automation build in real-time with detailed progress cards and status updates.</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => window.location.href = '/auth'}
              className={`w-full bg-gradient-to-r ${currentIndustry.color} text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 group`}
            >
              Try {currentIndustry.name} Automation Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AuthenticChatShowcase;
