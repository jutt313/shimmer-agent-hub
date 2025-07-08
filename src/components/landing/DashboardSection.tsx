
import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Activity, Users, Zap } from 'lucide-react';

const DashboardSection = () => {
  const [metrics, setMetrics] = useState({
    automations: 0,
    executions: 0,
    timeSaved: 0,
    errorRate: 0
  });

  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      
      // Animate metrics
      const targetMetrics = {
        automations: Math.floor(Math.random() * 50) + 125,
        executions: Math.floor(Math.random() * 5000) + 15000,
        timeSaved: Math.floor(Math.random() * 200) + 450,
        errorRate: (Math.random() * 0.5 + 0.1).toFixed(2)
      };

      let start = Date.now();
      const duration = 1000;

      const animate = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);

        setMetrics(prev => ({
          automations: Math.floor(prev.automations + (targetMetrics.automations - prev.automations) * easeOut),
          executions: Math.floor(prev.executions + (targetMetrics.executions - prev.executions) * easeOut),
          timeSaved: Math.floor(prev.timeSaved + (targetMetrics.timeSaved - prev.timeSaved) * easeOut),
          errorRate: (parseFloat(prev.errorRate) + (parseFloat(targetMetrics.errorRate) - parseFloat(prev.errorRate)) * easeOut).toFixed(2)
        }));

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
        }
      };
      
      requestAnimationFrame(animate);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const chartData = [
    { name: 'Jan', value: 2400 },
    { name: 'Feb', value: 1398 },
    { name: 'Mar', value: 9800 },
    { name: 'Apr', value: 3908 },
    { name: 'May', value: 4800 },
    { name: 'Jun', value: 3800 }
  ];

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-indigo-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
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
            you're saving with detailed analytics and reporting.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Dashboard */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-gray-900">Live Dashboard</h3>
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Live Data</span>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Active Automations</div>
                    <div className={`text-2xl font-bold text-gray-900 ${isAnimating ? 'animate-pulse' : ''}`}>
                      {metrics.automations}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-green-600 font-medium">+12% from last month</div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total Executions</div>
                    <div className={`text-2xl font-bold text-gray-900 ${isAnimating ? 'animate-pulse' : ''}`}>
                      {metrics.executions.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-green-600 font-medium">+847 today</div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Hours Saved</div>
                    <div className={`text-2xl font-bold text-gray-900 ${isAnimating ? 'animate-pulse' : ''}`}>
                      {metrics.timeSaved}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-green-600 font-medium">This month</div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Error Rate</div>
                    <div className={`text-2xl font-bold text-gray-900 ${isAnimating ? 'animate-pulse' : ''}`}>
                      {metrics.errorRate}%
                    </div>
                  </div>
                </div>
                <div className="text-sm text-green-600 font-medium">-0.3% improvement</div>
              </div>
            </div>

            {/* Chart Visualization */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Execution Trends</h4>
              <div className="h-32 flex items-end justify-between gap-2">
                {chartData.map((item, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-1000 ease-out"
                      style={{ 
                        height: `${(item.value / Math.max(...chartData.map(d => d.value))) * 100}%`,
                        animationDelay: `${index * 100}ms`
                      }}
                    ></div>
                    <div className="text-xs text-gray-600 mt-2">{item.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Insights Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-4">💡 Smart Insights</h4>
              <div className="space-y-4">
                <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                  <div className="text-sm font-medium text-green-900">Optimization Opportunity</div>
                  <div className="text-xs text-green-700 mt-1">Email automation could save 2.5 hours/week</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="text-sm font-medium text-blue-900">Performance Alert</div>
                  <div className="text-xs text-blue-700 mt-1">API response time increased by 15%</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-4">🎯 ROI Calculator</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Time Saved:</span>
                  <span className="font-semibold">{metrics.timeSaved} hrs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hourly Rate:</span>
                  <span className="font-semibold">$75</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="text-gray-900 font-semibold">Monthly Savings:</span>
                  <span className="text-green-600 font-bold">${(metrics.timeSaved * 75).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
              <h4 className="font-semibold mb-2">📊 Custom Reports</h4>
              <p className="text-blue-100 text-sm mb-4">
                Get detailed insights tailored to your business needs
              </p>
              <button className="bg-white text-blue-600 px-4 py-2 rounded-xl text-sm font-semibold hover:shadow-lg transition-all">
                Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardSection;
