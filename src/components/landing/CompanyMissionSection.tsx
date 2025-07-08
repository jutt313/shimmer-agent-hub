
import React from 'react';
import { Heart, Target, Users, Zap } from 'lucide-react';

const CompanyMissionSection = () => {
  return (
    <section className="py-20 px-6 bg-gradient-to-b from-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Our Mission:
            <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Democratize Automation
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We believe every business deserves access to powerful automation, 
            regardless of technical expertise or budget. That's why we're building 
            the most intuitive, affordable, and powerful automation platform on Earth.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Our Vision</h3>
            <p className="text-gray-600 text-sm">Make automation accessible to every business worldwide</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Our Values</h3>
            <p className="text-gray-600 text-sm">Simplicity, reliability, and customer success first</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Our Team</h3>
            <p className="text-gray-600 text-sm">World-class engineers and automation experts</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Our Impact</h3>
            <p className="text-gray-600 text-sm">Helping businesses save millions of hours annually</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-200 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Join the Automation Revolution
          </h3>
          <p className="text-gray-600 mb-6">
            Be part of the movement that's reshaping how businesses operate. 
            Together, we're building a more efficient, productive world.
          </p>
          <button className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all">
            Start Your Journey Today
          </button>
        </div>
      </div>
    </section>
  );
};

export default CompanyMissionSection;
