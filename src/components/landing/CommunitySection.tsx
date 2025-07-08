
import React from 'react';
import { Users, MessageCircle, Book, ArrowRight } from 'lucide-react';

const CommunitySection = () => {
  return (
    <section id="community" className="py-20 px-6 bg-gradient-to-b from-blue-50/40 to-indigo-50/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-6">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Get Started Today</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Ready to
            <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Transform Your Business?
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of businesses already saving time and money with intelligent automation. 
            Start your journey today with our 24-hour free trial.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-lg text-center border border-gray-200">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Start Building</h3>
            <p className="text-gray-600 mb-6">Create your first automation in minutes with our AI-powered platform</p>
            <button 
              onClick={() => window.location.href = '/auth'}
              className="bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2 mx-auto"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="bg-white rounded-2xl p-8 shadow-lg text-center border border-gray-200">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Book className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Learn More</h3>
            <p className="text-gray-600 mb-6">Explore our platform capabilities and see what's possible with automation</p>
            <button 
              onClick={() => window.location.href = '/auth'}
              className="bg-green-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2 mx-auto"
            >
              Explore Platform
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="bg-white rounded-2xl p-8 shadow-lg text-center border border-gray-200">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Need Help?</h3>
            <p className="text-gray-600 mb-6">Get personalized assistance from our automation experts</p>
            <button 
              onClick={() => window.location.href = '/auth'}
              className="bg-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2 mx-auto"
            >
              Contact Support
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CommunitySection;
