
import React from 'react';
import { Zap, Brain, Infinity, ArrowRight, CheckCircle } from 'lucide-react';

const SolutionSection = () => {
  return (
    <section className="py-20 px-6 relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-orange-50/30 via-blue-50/50 to-purple-50/40"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-6">
            <Brain className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered Solution</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Meet Your New
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Workforce
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transform chaos into clarity with intelligent automation that works exactly how you think. 
            No coding required, infinite possibilities unlocked.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-blue-100">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Lightning-Fast Automation</h3>
            <p className="text-gray-600 mb-6">Build no-code workflows in minutes, not months. Our AI understands your needs instantly.</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">5-minute setup</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">Natural language prompts</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">Instant deployment</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl border border-purple-100">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Intelligent AI Agents</h3>
            <p className="text-gray-600 mb-6">Deploy smart agents that learn, adapt, and handle complex tasks 24/7 without supervision.</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">Self-learning capabilities</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">24/7 operation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">Complex decision making</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl border border-indigo-100">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6">
              <Infinity className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Universal Integration</h3>
            <p className="text-gray-600 mb-6">Connect any platform, automate any process. Our AI adapts to your existing tools seamlessly.</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">Connect any platform</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">Real-time synchronization</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">Secure connections</span>
              </div>
            </div>
          </div>
        </div>

        {/* Success Stories Section */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl p-12 text-white text-center">
          <h3 className="text-3xl md:text-4xl font-bold mb-6">Real Results from Real Businesses</h3>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of businesses already saving time and money with AI automation
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className="bg-white/20 rounded-2xl p-6">
              <div className="text-4xl font-bold mb-2">85%</div>
              <div className="text-green-100">Average Time Savings</div>
              <div className="text-sm text-green-200 mt-1">15+ hours per week recovered</div>
            </div>
            <div className="bg-white/20 rounded-2xl p-6">
              <div className="text-4xl font-bold mb-2">3x</div>
              <div className="text-green-100">Faster Growth</div>
              <div className="text-sm text-green-200 mt-1">vs manual operations</div>
            </div>
            <div className="bg-white/20 rounded-2xl p-6">
              <div className="text-4xl font-bold mb-2">450%</div>
              <div className="text-green-100">ROI in First Year</div>
              <div className="text-sm text-green-200 mt-1">Typical customer returns</div>
            </div>
          </div>
          
          <button 
            onClick={() => window.location.href = '/auth'}
            className="bg-white text-green-600 px-8 py-4 rounded-xl text-lg font-bold hover:shadow-2xl transition-all duration-300 transform hover:scale-105 inline-flex items-center gap-3"
          >
            Start Your Success Story
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
