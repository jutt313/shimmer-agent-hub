
import React from 'react';
import { AlertTriangle, Clock, DollarSign, Users } from 'lucide-react';

const ProblemSection = () => {
  const problems = [
    {
      icon: Clock,
      title: 'Time Wasted on Repetitive Tasks',
      description: 'Your team spends 40% of their time on manual, repetitive work that could be automated',
      stat: '40% Time Lost',
      color: 'from-red-500 to-orange-500'
    },
    {
      icon: DollarSign,
      title: 'Revenue Leakage',
      description: 'Manual processes lead to errors, missed opportunities, and lost revenue streams',
      stat: '$50K+ Lost/Year',
      color: 'from-orange-500 to-yellow-500'
    },
    {
      icon: Users,
      title: 'Team Burnout',
      description: 'Talented employees get frustrated with boring tasks instead of strategic work',
      stat: '60% Turnover',
      color: 'from-yellow-500 to-red-500'
    },
    {
      icon: AlertTriangle,
      title: 'Scaling Bottlenecks',
      description: 'Growth is limited by human capacity rather than market opportunity',
      stat: '3x Slower Growth',
      color: 'from-red-500 to-pink-500'
    }
  ];

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-red-50 to-orange-50 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 border-2 border-red-300 rounded-full animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-24 h-24 border-2 border-orange-300 rounded-full animate-pulse delay-500"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full mb-6">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">The Problem</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Your Business is 
            <span className="block bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Bleeding Money
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Every day without automation costs you time, money, and competitive advantage. 
            Here's what's really happening behind the scenes.
          </p>
        </div>

        {/* Problem Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {problems.map((problem, index) => (
            <div 
              key={index}
              className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-red-100"
            >
              {/* Icon */}
              <div className={`w-12 h-12 bg-gradient-to-r ${problem.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <problem.icon className="w-6 h-6 text-white" />
              </div>

              {/* Stat */}
              <div className={`text-2xl font-bold bg-gradient-to-r ${problem.color} bg-clip-text text-transparent mb-2`}>
                {problem.stat}
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {problem.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600 text-sm leading-relaxed">
                {problem.description}
              </p>

              {/* Hover Effect */}
              <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className={`h-1 bg-gradient-to-r ${problem.color} rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Impact Statement */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-red-200 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              The Real Cost of Inaction
            </h3>
            <p className="text-lg text-gray-600 mb-6">
              Companies without automation lose an average of <span className="font-bold text-red-600">$2.3M annually</span> in 
              productivity, errors, and missed opportunities. Don't be one of them.
            </p>
            <div className="flex justify-center">
              <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-8 py-3 rounded-xl font-semibold">
                It's Time for Change ⏰
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
