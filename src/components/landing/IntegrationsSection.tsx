
import React, { useState } from 'react';
import { Zap, ArrowRight, Globe, Shield, ExternalLink } from 'lucide-react';

const IntegrationsSection = () => {
  const [hoveredPlatform, setHoveredPlatform] = useState<number | null>(null);

  const platforms = [
    { 
      name: 'Shopify', 
      logo: '🛒', 
      category: 'E-commerce',
      setupTime: '30 seconds',
      automationIdea: 'Order Processing Automation',
      description: 'Automatically sync orders, update inventory, and send customer notifications',
      credentials: 'API Key, Store URL, Webhook Secret',
      color: 'from-green-500 to-emerald-500'
    },
    { 
      name: 'Slack', 
      logo: '💬', 
      category: 'Communication',
      setupTime: '25 seconds',
      automationIdea: 'Team Notification System',
      description: 'Send smart notifications, create channels, and automate team updates',
      credentials: 'Bot Token, Workspace ID, Signing Secret',
      color: 'from-purple-500 to-pink-500'
    },
    { 
      name: 'Google Sheets', 
      logo: '📊', 
      category: 'Productivity',
      setupTime: '20 seconds',
      automationIdea: 'Data Synchronization Hub',
      description: 'Sync data between platforms, generate reports, and update spreadsheets',
      credentials: 'Service Account Key, Sheet ID, API Access',
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      name: 'HubSpot', 
      logo: '🔧', 
      category: 'CRM',
      setupTime: '35 seconds',
      automationIdea: 'Lead Management Pipeline',
      description: 'Score leads, automate follow-ups, and manage customer relationships',
      credentials: 'API Key, Portal ID, OAuth Token',
      color: 'from-orange-500 to-red-500'
    },
    { 
      name: 'Gmail', 
      logo: '📧', 
      category: 'Email',
      setupTime: '30 seconds',
      automationIdea: 'Email Processing System',
      description: 'Filter emails, send responses, and organize communications automatically',
      credentials: 'OAuth Token, Client ID, Client Secret',
      color: 'from-red-500 to-pink-500'
    },
    { 
      name: 'Stripe', 
      logo: '💳', 
      category: 'Payments',
      setupTime: '40 seconds',
      automationIdea: 'Payment Processing Flow',
      description: 'Handle payments, manage subscriptions, and automate billing workflows',
      credentials: 'Secret Key, Publishable Key, Webhook Endpoint',
      color: 'from-indigo-500 to-purple-500'
    },
    { 
      name: 'Zoom', 
      logo: '📹', 
      category: 'Video',
      setupTime: '25 seconds',
      automationIdea: 'Meeting Management System',
      description: 'Schedule meetings, send reminders, and automate webinar workflows',
      credentials: 'API Key, API Secret, JWT Token',
      color: 'from-blue-500 to-indigo-500'
    },
    { 
      name: 'Salesforce', 
      logo: '☁️', 
      category: 'CRM',
      setupTime: '45 seconds',
      automationIdea: 'Sales Pipeline Automation',
      description: 'Sync leads, automate opportunities, and manage sales processes',
      credentials: 'Username, Password, Security Token, Instance URL',
      color: 'from-cyan-500 to-blue-500'
    },
    { 
      name: 'Trello', 
      logo: '📋', 
      category: 'Project Management',
      setupTime: '20 seconds',
      automationIdea: 'Task Management Flow',
      description: 'Create cards, move tasks, and automate project workflows',
      credentials: 'API Key, Token, Board ID',
      color: 'from-green-500 to-teal-500'
    },
    { 
      name: 'Discord', 
      logo: '🎮', 
      category: 'Communication',
      setupTime: '30 seconds',
      automationIdea: 'Community Management Bot',
      description: 'Moderate channels, send announcements, and manage community interactions',
      credentials: 'Bot Token, Guild ID, Permissions',
      color: 'from-purple-500 to-indigo-500'
    },
    { 
      name: 'Airtable', 
      logo: '🗃️', 
      category: 'Database',
      setupTime: '25 seconds',
      automationIdea: 'Database Sync System',
      description: 'Sync records, update fields, and manage data across platforms',
      credentials: 'API Key, Base ID, Table Name',
      color: 'from-orange-500 to-yellow-500'
    },
    { 
      name: 'Notion', 
      logo: '📝', 
      category: 'Productivity',
      setupTime: '35 seconds',
      automationIdea: 'Content Management System',
      description: 'Create pages, update databases, and organize content automatically',
      credentials: 'Integration Token, Database ID, API Version',
      color: 'from-gray-500 to-gray-700'
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
            Link any platform with our intelligent integration system. We support 50+ platforms 
            with 30-second setup times and enterprise-grade security.
          </p>
        </div>

        {/* Platform Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-12">
          {platforms.map((platform, index) => (
            <div
              key={index}
              className="relative group"
              onMouseEnter={() => setHoveredPlatform(index)}
              onMouseLeave={() => setHoveredPlatform(null)}
            >
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer h-full">
                <div className="text-4xl mb-3 text-center">{platform.logo}</div>
                <div className="text-sm font-semibold text-gray-900 text-center">{platform.name}</div>
                <div className="text-xs text-gray-500 text-center mt-1">{platform.category}</div>
                <div className="text-xs text-green-600 text-center mt-2 font-medium">{platform.setupTime}</div>
              </div>
              
              {/* Hover Expansion */}
              {hoveredPlatform === index && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 w-80 bg-white rounded-2xl shadow-2xl z-50 border border-gray-200 p-6">
                  {/* Arrow */}
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-gray-200 rotate-45"></div>
                  
                  {/* Content */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{platform.logo}</div>
                      <div>
                        <h3 className="font-bold text-gray-900">{platform.name}</h3>
                        <p className="text-sm text-gray-600">{platform.category}</p>
                      </div>
                    </div>
                    
                    <div className={`bg-gradient-to-r ${platform.color} rounded-lg p-3 text-white`}>
                      <h4 className="font-semibold text-sm mb-1">{platform.automationIdea}</h4>
                      <p className="text-xs opacity-90">{platform.description}</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="font-semibold text-sm text-gray-900 mb-2">Required Credentials:</h4>
                      <p className="text-xs text-gray-600 font-mono">{platform.credentials}</p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-600 font-medium">{platform.setupTime} setup</span>
                      </div>
                      <button className="text-xs bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1">
                        View Demo <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
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
            <div className="text-3xl font-bold text-gray-900 mb-2">50+ Platforms</div>
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
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-12 text-center text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-4 w-8 h-8 border border-white rounded-full"></div>
            <div className="absolute top-12 right-8 w-4 h-4 bg-white rounded-full"></div>
            <div className="absolute bottom-8 left-12 w-6 h-6 border border-white rounded-full"></div>
            <div className="absolute bottom-4 right-4 w-10 h-10 border border-white rounded-full"></div>
          </div>
          
          <div className="relative z-10">
            <h3 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Connect Your Platforms?
            </h3>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Start with our most popular integrations or request a custom connection. 
              Our platform adapts to work with any API or service you need.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => window.location.href = '/auth'}
                className="bg-white text-purple-600 px-8 py-4 rounded-xl text-lg font-bold hover:shadow-2xl transition-all duration-300 transform hover:scale-105 inline-flex items-center gap-3"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => window.location.href = '/auth'}
                className="border-2 border-white text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-white hover:text-purple-600 transition-all duration-300 inline-flex items-center gap-3"
              >
                Request Integration
                <ExternalLink className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntegrationsSection;
