
import React from 'react';
import { Zap, Globe, ArrowRight } from 'lucide-react';

const IntegrationsSection = () => {
  const integrations = [
    { name: 'Gmail', logo: '📧', category: 'Email', color: 'from-red-500 to-pink-500' },
    { name: 'Slack', logo: '💬', category: 'Communication', color: 'from-purple-500 to-indigo-500' },
    { name: 'HubSpot', logo: '🎯', category: 'CRM', color: 'from-orange-500 to-red-500' },
    { name: 'Salesforce', logo: '☁️', category: 'CRM', color: 'from-blue-500 to-cyan-500' },
    { name: 'Zapier', logo: '⚡', category: 'Automation', color: 'from-yellow-500 to-orange-500' },
    { name: 'Notion', logo: '📝', category: 'Productivity', color: 'from-gray-500 to-gray-700' },
    { name: 'Airtable', logo: '📊', category: 'Database', color: 'from-green-500 to-emerald-500' },
    { name: 'Google Sheets', logo: '📈', category: 'Spreadsheet', color: 'from-green-500 to-teal-500' },
    { name: 'Stripe', logo: '💳', category: 'Payment', color: 'from-purple-500 to-pink-500' },
    { name: 'Shopify', logo: '🛍️', category: 'E-commerce', color: 'from-green-500 to-emerald-500' },
    { name: 'Discord', logo: '🎮', category: 'Communication', color: 'from-indigo-500 to-purple-500' },
    { name: 'Trello', logo: '📋', category: 'Project Mgmt', color: 'from-blue-500 to-indigo-500' }
  ];

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full mb-6">
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium">Platform Integrations</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Connect
            <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Everything
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Seamlessly integrate with 500+ platforms and services. If it has an API, 
            we can connect it. No limits, no compromises.
          </p>
        </div>

        {/* Integration Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-16">
          {integrations.map((integration, index) => (
            <div 
              key={index}
              className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 card-hover-effect"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-center">
                <div className="text-4xl mb-3">{integration.logo}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{integration.name}</h3>
                <p className="text-xs text-gray-500">{integration.category}</p>
              </div>
              
              {/* Hover Effect */}
              <div className={`mt-4 h-1 bg-gradient-to-r ${integration.color} rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
            </div>
          ))}
        </div>

        {/* Integration Stats */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              500+
            </div>
            <div className="text-lg text-gray-600">Supported Platforms</div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
              30s
            </div>
            <div className="text-lg text-gray-600">Average Setup Time</div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              99.9%
            </div>
            <div className="text-lg text-gray-600">Connection Reliability</div>
          </div>
        </div>

        {/* Custom Integration CTA */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-8 text-white text-center">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold mb-4">Don't See Your Platform?</h3>
            <p className="text-indigo-100 text-lg mb-6">
              We'll build custom integrations for your specific needs. 
              Our team can connect any system with an API in under 48 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-indigo-600 px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all">
                Request Integration
              </button>
              <button className="border border-indigo-300 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-400 transition-all">
                View All Integrations →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntegrationsSection;
