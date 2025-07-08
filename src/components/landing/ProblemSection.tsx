
import React from 'react';
import { TrendingDown, Clock, DollarSign, Users } from 'lucide-react';

const ProblemSection = () => {
  return (
    <section className="py-20 px-6 relative overflow-hidden">
      {/* Smooth Gradient Background Transition */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-50/50 via-red-50/30 to-orange-50/50"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="text-gray-900">Your Business Is</span>
            <span className="block bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mt-2">
              Bleeding Money
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Every day without automation costs you more than you realize. 
            The hidden expenses are crushing your potential.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-red-100 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <div className="text-4xl font-bold text-red-600 mb-2">40%</div>
            <div className="text-gray-600 font-medium">Time Loss</div>
            <div className="text-sm text-gray-500 mt-2">on repetitive tasks</div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl border border-orange-100 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <div className="text-4xl font-bold text-orange-600 mb-2">$50K</div>
            <div className="text-gray-600 font-medium">Loss Here</div>
            <div className="text-sm text-gray-500 mt-2">annually per employee</div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl border border-purple-100 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div className="text-4xl font-bold text-purple-600 mb-2">60%</div>
            <div className="text-gray-600 font-medium">Turnover</div>
            <div className="text-sm text-gray-500 mt-2">from frustration</div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl border border-red-100 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <TrendingDown className="w-8 h-8 text-white" />
            </div>
            <div className="text-4xl font-bold text-red-600 mb-2">3x</div>
            <div className="text-gray-600 font-medium">Low Growth</div>
            <div className="text-sm text-gray-500 mt-2">vs automated competitors</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-gray-900 to-red-900 rounded-3xl p-12 text-center text-white">
          <h3 className="text-3xl md:text-4xl font-bold mb-6">
            The Real Cost of Inaction
          </h3>
          <p className="text-xl mb-8 opacity-90">
            Companies without automation lose every <span className="font-bold text-yellow-400">$2.3 million annually</span> in productivity, 
            errors, and missed opportunities. Don't be one of them.
          </p>
          <button 
            onClick={() => window.location.href = '/auth'}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-8 py-4 rounded-xl text-lg font-bold hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            It's Time to Change
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
