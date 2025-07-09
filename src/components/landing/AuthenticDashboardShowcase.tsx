
import React, { useState } from 'react';
import { BarChart3, TrendingUp, Activity, Users, Zap, Settings, Bot, Clock, ArrowRight } from 'lucide-react';

const AuthenticDashboardShowcase = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'services', name: 'Services', icon: Settings },
    { id: 'agents', name: 'AI Agents', icon: Bot },
    { id: 'activity', name: 'Activity', icon: Clock },
    { id: 'webhooks', name: 'Webhooks', icon: Zap }
  ];

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-indigo-50/40 to-blue-50/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-6">
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm font-medium">Analytics Dashboard</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Track Every
            <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Success Metric
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Real-time insights into your automation performance. See exactly how much time and money 
            you're saving with detailed analytics and comprehensive reporting.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Dashboard - Copying your exact design */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                h - Dashboard
              </h3>
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Live Data</span>
              </div>
            </div>

            {/* Tab Navigation - Copying your exact design */}
            <div className="flex space-x-1 mb-6 bg-gray-100 rounded-xl p-1 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.name}
                  </button>
                );
              })}
            </div>

            {/* Overview Tab Content */}
            {activeTab === 'overview' && (
              <>
                {/* Key Metrics Cards - Copying your exact layout */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Total Runs</div>
                        <div className="text-2xl font-bold text-blue-600">2,847</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                        <Activity className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Success Rate</div>
                        <div className="text-2xl font-bold text-green-600">96.8%</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Avg Execution Time</div>
                        <div className="text-2xl font-bold text-purple-600">245ms</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Analytics - Copying your chart design */}
                <div className="bg-gray-50 rounded-2xl p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Performance Analytics - Combined View</h4>
                  <div className="h-48 flex items-end justify-between gap-2">
                    {[2.4, 1.8, 3.2, 2.9, 3.8, 2.1, 4.1, 3.3, 2.7, 3.6, 2.8, 4.0].map((value, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div 
                          className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-1000 ease-out"
                          style={{ height: `${(value / 4.5) * 100}%` }}
                        ></div>
                        <div className="text-xs text-gray-600 mt-2">{index + 1}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <Settings className="w-5 h-5" />
                  Detected Platform Services
                </h4>
                
                {/* Service Items - Copying your exact design */}
                {[
                  { name: 'Typeform', status: 'Connected', calls: 1247, icon: '🔷' },
                  { name: 'ZeroBounce', status: 'Connected', calls: 892, icon: '🔷' },
                  { name: 'Clearbit', status: 'Not Connected', calls: 0, icon: '🔷' },
                  { name: 'HubSpot', status: 'Connected', calls: 2847, icon: '🔶' }
                ].map((service, index) => (
                  <div key={index} className="bg-white border-l-4 border-blue-400 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <div className="w-6 h-6 bg-blue-500 rounded"></div>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{service.name}</div>
                          <div className="text-sm text-gray-600">Detected in automation blueprint</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Calls Made</div>
                        <div className="font-bold text-blue-600">{service.calls}</div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          service.status === 'Connected' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {service.status}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* AI Agents Tab */}
            {activeTab === 'agents' && (
              <div className="text-center py-12">
                <Bot className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h4 className="font-semibold text-gray-900 mb-2">AI Agents (Configured & Recommended)</h4>
                <p className="text-gray-500">No AI agents configured or recommended</p>
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h4 className="font-semibold text-gray-900 mb-2">Complete Automation History</h4>
                <p className="text-gray-500">No automation runs found</p>
              </div>
            )}

            {/* Webhooks Tab */}
            {activeTab === 'webhooks' && (
              <div className="text-center py-12">
                <Zap className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h4 className="font-semibold text-gray-900 mb-2">Webhook Management</h4>
                <p className="text-gray-500">Configure webhooks for real-time automation triggers</p>
              </div>
            )}
          </div>

          {/* Insights Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-4">Smart Insights</h4>
              <div className="space-y-4">
                <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                  <div className="text-sm font-medium text-green-900">Optimization Opportunity</div>
                  <div className="text-xs text-green-700 mt-1">Email automation could save 2.5 hours/week</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="text-sm font-medium text-blue-900">Performance Alert</div>
                  <div className="text-xs text-blue-700 mt-1">API response time improved by 15%</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="text-sm font-medium text-purple-900">AI Recommendation</div>
                  <div className="text-xs text-purple-700 mt-1">Consider adding lead scoring automation</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-4">ROI Calculator</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Hours Saved Monthly:</span>
                  <span className="font-semibold">67.2 hrs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hourly Rate:</span>
                  <span className="font-semibold">$75</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Error Reduction:</span>
                  <span className="font-semibold">96.8%</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="text-gray-900 font-semibold">Monthly Savings:</span>
                  <span className="text-green-600 font-bold">$5,040</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
              <h4 className="font-semibold mb-2">Analytics Reports</h4>
              <p className="text-blue-100 text-sm mb-4">
                Get detailed insights tailored to your business needs
              </p>
              <button 
                onClick={() => window.location.href = '/auth'}
                className="bg-white text-blue-600 px-4 py-2 rounded-xl text-sm font-semibold hover:shadow-lg transition-all flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Generate Report
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <button 
            onClick={() => window.location.href = '/auth'}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 mx-auto group"
          >
            Access Your Dashboard
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default AuthenticDashboardShowcase;
