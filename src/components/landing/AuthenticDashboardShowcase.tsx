
import React, { useState } from 'react';
import { BarChart3, Activity, Users, Zap, ArrowRight, Settings, Eye, Clock } from 'lucide-react';

const AuthenticDashboardShowcase = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedIndustry, setSelectedIndustry] = useState(0);

  const industries = [
    {
      name: 'E-commerce',
      color: 'from-blue-500 to-cyan-500',
      metrics: {
        totalRuns: '2,847',
        successRate: '96.8%',
        avgTime: '1.2s',
        activePlatforms: 8
      },
      recentActivity: [
        '█████ ████ processed - Shopify',
        '████████ ██████ updated - Inventory',
        '████████ █████ sent - Email',
        '███ ████ ██████ - Analytics'
      ]
    },
    {
      name: 'Healthcare',
      color: 'from-green-500 to-emerald-500',
      metrics: {
        totalRuns: '1,923',
        successRate: '98.2%',
        avgTime: '0.8s',
        activePlatforms: 6
      },
      recentActivity: [
        '███████ ████████ verified - Insurance',
        '██████████ ██████ sent - Reminder',
        '██████ ██████ updated - Calendar',
        '████ ████ ██████ - Records'
      ]
    },
    {
      name: 'Real Estate',
      color: 'from-purple-500 to-pink-500',
      metrics: {
        totalRuns: '3,456',
        successRate: '94.5%',
        avgTime: '2.1s',
        activePlatforms: 12
      },
      recentActivity: [
        '████ ███████ qualified - CRM',
        '████████ █████ sent - Email',
        '██████ ████ ██████ - Follow-up',
        '█████ ████ ██████ - Reports'
      ]
    }
  ];

  const currentIndustry = industries[selectedIndustry];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'services', label: 'Services', icon: Settings },
    { id: 'agents', label: 'AI Agents', icon: Users },
    { id: 'activity', label: 'Activity', icon: Activity }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-2xl font-bold text-gray-900">{currentIndustry.metrics.totalRuns}</div>
                <div className="text-sm text-gray-600">Total Runs</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-2xl font-bold text-green-600">{currentIndustry.metrics.successRate}</div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-2xl font-bold text-blue-600">{currentIndustry.metrics.avgTime}</div>
                <div className="text-sm text-gray-600">Avg Time</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-2xl font-bold text-purple-600">{currentIndustry.metrics.activePlatforms}</div>
                <div className="text-sm text-gray-600">Platforms</div>
              </div>
            </div>

            {/* Performance Chart */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Performance Overview</h3>
              <div className="h-32 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg flex items-end justify-between p-4">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className={`bg-gradient-to-t ${currentIndustry.color} rounded-t opacity-70`}
                    style={{ 
                      height: `${Math.random() * 80 + 20}%`,
                      width: '12%'
                    }}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
              </div>
            </div>
          </div>
        );

      case 'services':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Connected Services</h3>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg blur-sm"></div>
                  <div>
                    <div className="font-medium blur-sm">████████ ████</div>
                    <div className="text-sm text-gray-600 blur-sm">██████ ███████</div>
                  </div>
                </div>
                <div className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                  Not Connected
                </div>
              </div>
            ))}
          </div>
        );

      case 'agents':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">AI Agents</h3>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium blur-sm">████████ █████</div>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <div className="text-sm text-gray-600 blur-sm mb-2">████: ██████ ████████ ██ █████</div>
                <div className="text-xs text-gray-500 blur-sm">████: ██████ █████ ████ ██████</div>
              </div>
            ))}
          </div>
        );

      case 'activity':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
            {currentIndustry.recentActivity.map((activity, i) => (
              <div key={i} className="bg-white rounded-lg p-4 border border-gray-200 flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="text-sm text-gray-600 font-mono">{activity}</div>
                <div className="ml-auto text-xs text-gray-400">2m ago</div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full mb-6">
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm font-medium">Real-time Analytics</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Track Everything That
            <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Matters
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Get complete visibility into your automation performance with real-time metrics, 
            detailed analytics, and comprehensive monitoring.
          </p>

          {/* Industry Selector */}
          <div className="flex justify-center gap-3 mb-8">
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

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Dashboard Interface */}
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Dashboard Header */}
            <div className={`bg-gradient-to-r ${currentIndustry.color} p-4 text-white`}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{currentIndustry.name} Dashboard</h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                  <span className="text-sm">Live</span>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="p-6 h-96 overflow-y-auto">
              {renderTabContent()}
            </div>
          </div>

          {/* Features */}
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${currentIndustry.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Real-time Metrics
                  </h3>
                  <p className="text-gray-600">
                    Monitor your automation performance with live metrics including run counts, success rates, and execution times.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${currentIndustry.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Complete Visibility
                  </h3>
                  <p className="text-gray-600">
                    Track every aspect of your automations from platform connections to AI agent performance with detailed insights.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${currentIndustry.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Activity Timeline
                  </h3>
                  <p className="text-gray-600">
                    Follow the complete history of your automation executions with detailed activity logs and timestamps.
                  </p>
                </div>
              </div>
            </div>

            {/* Dashboard Stats */}
            <div className={`bg-gradient-to-r ${currentIndustry.color} rounded-2xl p-6 text-white`}>
              <h4 className="text-lg font-semibold mb-4">Dashboard Impact</h4>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">73%</div>
                  <div className="text-white/80 text-sm">Faster Problem Detection</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">95%</div>
                  <div className="text-white/80 text-sm">Uptime Improvement</div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => window.location.href = '/auth'}
              className={`w-full bg-gradient-to-r ${currentIndustry.color} text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 group`}
            >
              View {currentIndustry.name} Dashboard
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AuthenticDashboardShowcase;
