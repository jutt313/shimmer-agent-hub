
import React from 'react';
import { Book, ArrowRight, Zap, Target } from 'lucide-react';

const DocumentationSection = () => {
  return (
    <section className="py-20 px-6 bg-gradient-to-b from-gray-50/50 to-blue-50/40">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-6">
            <Book className="w-4 h-4" />
            <span className="text-sm font-medium">Quick Start</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Get Started in
            <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Minutes, Not Hours
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our intuitive platform is designed for everyone. No technical expertise required - 
            just describe what you need and watch the magic happen.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">1</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Sign Up & Describe Your Need</h3>
                <p className="text-gray-600">Simply tell us what you want to automate in plain English. No technical jargon required.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">2</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Builds Your Automation</h3>
                <p className="text-gray-600">Watch as our AI creates a complete workflow based on your requirements, connecting all necessary platforms.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">3</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Deploy & Start Saving Time</h3>
                <p className="text-gray-600">Activate your automation with one click and immediately start seeing results. Monitor progress in real-time.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white text-center">
            <Zap className="w-16 h-16 mx-auto mb-6 text-yellow-300" />
            <h3 className="text-2xl font-bold mb-4">Ready to Experience the Power?</h3>
            <p className="text-blue-100 mb-8">
              Start your 24-hour free trial today. No credit card required, 
              full access to all features, and expert support included.
            </p>
            <div className="space-y-4">
              <button 
                onClick={() => window.location.href = '/auth'}
                className="w-full bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-bold hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </button>
              <div className="flex items-center justify-center gap-4 text-sm text-blue-200">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  <span>24/7 Support</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span>Instant Setup</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DocumentationSection;
