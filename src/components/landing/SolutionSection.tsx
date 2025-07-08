
import React from 'react';
import { CheckCircle, Zap, Target, TrendingUp } from 'lucide-react';

const SolutionSection = () => {
  const solutions = [
    {
      icon: Zap,
      title: 'Lightning-Fast Automation',
      description: 'Build complex workflows in minutes, not months. Our AI understands your needs and creates automations instantly.',
      benefit: '90% Faster Setup',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Target,
      title: 'Precision AI Agents',
      description: 'Deploy intelligent agents that learn from your data and make smart decisions 24/7.',
      benefit: '99.9% Accuracy',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: TrendingUp,
      title: 'Exponential Growth',
      description: 'Scale your operations without scaling your team. Handle 10x more work with the same resources.',
      benefit: '10x Productivity',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: CheckCircle,
      title: 'Zero-Error Execution',
      description: 'Eliminate human errors and ensure consistent, reliable performance across all processes.',
      benefit: '100% Reliability',
      color: 'from-emerald-500 to-teal-500'
    }
  ];

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-green-50 via-blue-50 to-purple-50 relative">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-gradient-to-r from-green-300/20 to-blue-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-1/4 w-56 h-56 bg-gradient-to-r from-purple-300/20 to-pink-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full mb-6">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">The Solution</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Meet Your New
            <span className="block bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Workforce
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transform chaos into clarity with intelligent automation that works exactly how you think. 
            No coding required, infinite possibilities unlocked.
          </p>
        </div>

        {/* Solution Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {solutions.map((solution, index) => (
            <div 
              key={index}
              className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 border border-gray-100 relative overflow-hidden"
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${solution.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
              
              {/* Icon */}
              <div className={`w-14 h-14 bg-gradient-to-r ${solution.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                <solution.icon className="w-7 h-7 text-white" />
              </div>

              {/* Benefit Badge */}
              <div className={`inline-block bg-gradient-to-r ${solution.color} text-white px-3 py-1 rounded-full text-sm font-semibold mb-3`}>
                {solution.benefit}
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-gray-700 transition-colors">
                {solution.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600 text-sm leading-relaxed">
                {solution.description}
              </p>

              {/* Animated Border */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${solution.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}></div>
            </div>
          ))}
        </div>

        {/* ROI Calculator */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-200 max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Calculate Your ROI
            </h3>
            <p className="text-gray-600">
              See how much YusrAI could save your business in the first year
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                $500K+
              </div>
              <div className="text-gray-600">Average Annual Savings</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                3 Months
              </div>
              <div className="text-gray-600">Average Payback Period</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                850%
              </div>
              <div className="text-gray-600">Average ROI</div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all">
              Calculate My Savings 📊
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
