
import React, { useState } from 'react';
import { Zap, ArrowRight, Globe, Shield, Settings, Eye, X } from 'lucide-react';

const IntegrationsSection = () => {
  const [hoveredPlatform, setHoveredPlatform] = useState<number | null>(null);
  const [showCredentialForm, setShowCredentialForm] = useState<string | null>(null);

  const platforms = [
    { 
      name: 'Shopify', 
      logo: '🏪', 
      category: 'E-commerce',
      setupTime: '30 seconds',
      automationIdea: 'Order Processing Automation',
      description: 'Automatically sync orders, update inventory, and send customer notifications',
      credentials: ['API Key', 'Store URL', 'Webhook Secret'],
      color: 'from-green-500 to-emerald-500'
    },
    { 
      name: 'Slack', 
      logo: '💬', 
      category: 'Communication',
      setupTime: '25 seconds',
      automationIdea: 'Team Notification System',
      description: 'Send smart notifications, create channels, and automate team updates',
      credentials: ['OAuth Token', 'Channel ID'],
      color: 'from-purple-500 to-pink-500'
    },
    { 
      name: 'Google Sheets', 
      logo: '📊', 
      category: 'Productivity',
      setupTime: '20 seconds',
      automationIdea: 'Data Synchronization Hub',
      description: 'Sync data between platforms, generate reports, and update spreadsheets',
      credentials: ['Service Account Key', 'Sheet ID'],
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      name: 'HubSpot', 
      logo: '🔧', 
      category: 'CRM',
      setupTime: '35 seconds',
      automationIdea: 'Lead Management Pipeline',
      description: 'Score leads, automate follow-ups, and manage customer relationships',
      credentials: ['API Key', 'Portal ID'],
      color: 'from-orange-500 to-red-500'
    },
    { 
      name: 'Gmail', 
      logo: '📧', 
      category: 'Email',
      setupTime: '30 seconds',
      automationIdea: 'Email Processing System',
      description: 'Filter emails, send responses, and organize communications automatically',
      credentials: ['OAuth Token', 'Client ID'],
      color: 'from-red-500 to-pink-500'
    },
    { 
      name: 'Typeform', 
      logo: '📝', 
      category: 'Forms',
      setupTime: '25 seconds',
      automationIdea: 'Form Response Automation',
      description: 'Process form submissions, validate data, and trigger follow-up actions',
      credentials: ['API Token', 'Form ID'],
      color: 'from-indigo-500 to-purple-500'
    },
    { 
      name: 'Zoom', 
      logo: '📹', 
      category: 'Video',
      setupTime: '25 seconds',
      automationIdea: 'Meeting Management System',
      description: 'Schedule meetings, send reminders, and automate webinar workflows',
      credentials: ['API Key', 'API Secret'],
      color: 'from-blue-500 to-indigo-500'
    },
    { 
      name: 'Airtable', 
      logo: '🗃️', 
      category: 'Database',
      setupTime: '25 seconds',
      automationIdea: 'Database Sync System',
      description: 'Sync records, update fields, and manage data across platforms',
      credentials: ['API Key', 'Base ID'],
      color: 'from-orange-500 to-yellow-500'
    }
  ];

  const CredentialForm = ({ platform, onClose }: { platform: any, onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-purple-600">Configure {platform.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <p className="text-gray-600 mb-6">
          Enter your {platform.name} credentials to connect this platform to your automation.
        </p>
        
        <div className="space-y-4">
          {platform.credentials.map((credential: string, index: number) => (
            <div key={index}>
              <label className="block text-gray-700 font-medium mb-2 flex items-center gap-2">
                {credential}
                <div className="w-4 h-4 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs">
                  i
                </div>
              </label>
              <input
                type={credential.toLowerCase().includes('token') || credential.toLowerCase().includes('key') ? 'password' : 'text'}
                placeholder={`Enter your ${platform.name} ${credential}`}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          ))}
        </div>
        
        <div className="flex gap-3 mt-6">
          <button className="flex-1 bg-purple-100 text-purple-600 py-3 rounded-xl font-medium hover:bg-purple-200 transition-colors">
            Test Connection
          </button>
          <button className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all">
            Save Credentials
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-blue-50/50 to-purple-50/40">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full mb-6">
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium">Universal Integration</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Connect Any Platform
            <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              You Use
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Universal platform integration with intelligent connectivity. Our AI adapts to work with 
            any service, API, or platform you need - no limits, no restrictions.
          </p>
        </div>

        {/* Platform Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
          {platforms.map((platform, index) => (
            <div
              key={index}
              className="relative group"
              onMouseEnter={() => setHoveredPlatform(index)}
              onMouseLeave={() => setHoveredPlatform(null)}
            >
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer h-full">
                <div className="w-12 h-12 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <div className="w-8 h-8 bg-gray-400 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                    {platform.name.substring(0, 2)}
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-900 text-center">{platform.name}</div>
                <div className="text-xs text-gray-500 text-center mt-1">{platform.category}</div>
                <div className="text-xs text-green-600 text-center mt-2 font-medium">{platform.setupTime}</div>
                
                <button
                  onClick={() => setShowCredentialForm(platform.name)}
                  className="w-full mt-3 text-xs bg-purple-50 text-purple-600 py-2 rounded-lg hover:bg-purple-100 transition-colors flex items-center justify-center gap-1"
                >
                  <Settings className="w-3 h-3" />
                  Configure
                </button>
              </div>
              
              {/* Hover Expansion */}
              {hoveredPlatform === index && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 w-80 bg-white rounded-2xl shadow-2xl z-40 border border-gray-200 p-6">
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-gray-200 rotate-45"></div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                        <div className="w-6 h-6 bg-gray-400 rounded text-white font-bold text-xs flex items-center justify-center">
                          {platform.name.substring(0, 2)}
                        </div>
                      </div>
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
                      <div className="space-y-1">
                        {platform.credentials.map((credential, credIndex) => (
                          <div key={credIndex} className="text-xs text-gray-600 flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                            {credential}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-600 font-medium">{platform.setupTime} setup</span>
                      </div>
                      <button 
                        onClick={() => setShowCredentialForm(platform.name)}
                        className="text-xs bg-purple-500 text-white px-3 py-1 rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        Setup Now
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
            <div className="text-3xl font-bold text-gray-900 mb-2">Universal</div>
            <div className="text-gray-600">Connect any platform or service</div>
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
            <div className="text-3xl font-bold text-gray-900 mb-2">100%</div>
            <div className="text-gray-600">Secure credential management</div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-12 text-center text-white relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Connect Everything?
            </h3>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Start with popular integrations or connect any platform you use. 
              Our AI automatically adapts to work with any API or service.
            </p>
            <button 
              onClick={() => window.location.href = '/auth'}
              className="bg-white text-purple-600 px-8 py-4 rounded-xl text-lg font-bold hover:shadow-2xl transition-all duration-300 transform hover:scale-105 inline-flex items-center gap-3"
            >
              Start Connecting Now
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Credential Form Modal */}
      {showCredentialForm && (
        <CredentialForm 
          platform={platforms.find(p => p.name === showCredentialForm)}
          onClose={() => setShowCredentialForm(null)}
        />
      )}
    </section>
  );
};

export default IntegrationsSection;
