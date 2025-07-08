
import React, { useState } from 'react';
import { Zap, ArrowRight, Globe, Shield } from 'lucide-react';

const IntegrationsSection = () => {
  const [hoveredPlatform, setHoveredPlatform] = useState(null);

  const platforms = [
    { 
      name: 'Shopify', 
      logo: '🛍️', 
      prompt: 'Automate order processing, inventory sync, and customer notifications',
      category: 'E-commerce'
    },
    { 
      name: 'Slack', 
      logo: '💬', 
      prompt: 'Create smart notifications, team updates, and automated responses',
      category: 'Communication'
    },
    { 
      name: 'Google Sheets', 
      logo: '📊', 
      prompt: 'Sync data, generate reports, and automate spreadsheet updates',
      category: 'Productivity'
    },
    { 
      name: 'Mailchimp', 
      logo: '📧', 
      prompt: 'Automate email campaigns, subscriber management, and marketing flows',
      category: 'Marketing'
    },
    { 
      name: 'Salesforce', 
      logo: '☁️', 
      prompt: 'Sync leads, automate follow-ups, and manage customer relationships',
      category: 'CRM'
    },
    { 
      name: 'HubSpot', 
      logo: '🔧', 
      prompt: 'Automate lead scoring, deal tracking, and marketing campaigns',
      category: 'Marketing & Sales'
    },
    { 
      name: 'Stripe', 
      logo: '💳', 
      prompt: 'Process payments, handle subscriptions, and manage billing automation',
      category: 'Payments'
    },
    { 
      name: 'Zoom', 
      logo: '📹', 
      prompt: 'Schedule meetings, send reminders, and automate webinar workflows',
      category: 'Video Conferencing'
    }
  ];

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-blue-50/50 to-purple-50/40">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full mb-6">
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium">Universal Integrations</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Connect Everything
            <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              You Use
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Link any type of platform with our intelligent integration system. We're not hard-coded - 
            we adapt to work with any tool or service you need.
          </p>
        </div>

        {/* Platform Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6 mb-12">
          {platforms.map((platform, index) => (
            <div
              key={index}
              className="relative group"
              onMouseEnter={() => setHoveredPlatform(index)}
              onMouseLeave={() => setHoveredPlatform(null)}
            >
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer">
                <div className="text-4xl mb-3 text-center">{platform.logo}</div>
                <div className="text-sm font-semibold text-gray-900 text-center">{platform.name}</div>
                <div className="text-xs text-gray-500 text-center mt-1">{platform.category}</div>
              </div>
              
              {/* Hover Prompt */}
              {hoveredPlatform === index && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 bg-gray-900 text-white p-4 rounded-xl shadow-xl z-10 opacity-95">
                  <div className="text-sm font-medium mb-2">Automation Ideas:</div>
                  <div className="text-xs text-gray-300">{platform.prompt}</div>
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gray-900 rotate-45"></div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-white" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">Any Platform</div>
            <div className="text-gray-600">Connect unlimited platforms and services</div>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">30 Sec</div>
            <div className="text-gray-600">Average setup time per integration</div>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">99.9%</div>
            <div className="text-gray-600">Uptime reliability guarantee</div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-12 text-center text-white">
          <h3 className="text-3xl md:text-4xl font-bold mb-6">
            Don't See Your Platform?
          </h3>
          <p className="text-xl mb-8 opacity-90">
            No problem! We can connect to any platform with an API. 
            Just tell us what you need and we'll make it work.
          </p>
          <button 
            onClick={() => window.location.href = '/auth'}
            className="bg-white text-purple-600 px-8 py-4 rounded-xl text-lg font-bold hover:shadow-2xl transition-all duration-300 transform hover:scale-105 inline-flex items-center gap-3"
          >
            Request Integration
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default IntegrationsSection;
