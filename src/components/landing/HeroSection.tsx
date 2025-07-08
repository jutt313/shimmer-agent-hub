
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Zap, Bot } from 'lucide-react';

const HeroSection = () => {
  const navigate = useNavigate();
  const [animatedText, setAnimatedText] = useState('');
  const fullText = 'Transform Your Business with AI-Powered Automation';

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      setAnimatedText(fullText.slice(0, index));
      index++;
      if (index > fullText.length) {
        clearInterval(timer);
      }
    }, 50);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="pt-32 pb-20 px-6 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-300/20 to-purple-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-purple-300/20 to-blue-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center space-y-8">
          {/* Animated Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl animate-bounce">
                <Bot className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-spin">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          {/* Animated Title */}
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent leading-tight">
            {animatedText}
            <span className="animate-pulse">|</span>
          </h1>

          {/* Subtitle with Floating Elements */}
          <div className="relative">
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Create intelligent workflows, build AI agents, and automate complex business processes 
              with our revolutionary no-code platform. Join thousands of businesses already transforming their operations.
            </p>
            
            {/* Floating Icons */}
            <div className="absolute -left-8 top-4 animate-float">
              <Zap className="w-6 h-6 text-yellow-500" />
            </div>
            <div className="absolute -right-8 bottom-4 animate-float delay-500">
              <Sparkles className="w-6 h-6 text-purple-500" />
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
            <button 
              onClick={() => navigate('/auth')}
              className="group bg-gradient-to-r from-blue-500 to-purple-600 text-white px-12 py-4 rounded-2xl text-lg font-semibold hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              style={{ boxShadow: '0 0 40px rgba(139, 92, 246, 0.3)' }}
            >
              <span className="flex items-center gap-3">
                Start Building Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            
            <button 
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
              className="group bg-white text-gray-700 px-12 py-4 rounded-2xl text-lg font-semibold border-2 border-gray-200 hover:border-purple-300 hover:shadow-xl transition-all duration-300"
            >
              Watch Demo
              <span className="inline-block ml-2 group-hover:animate-bounce">🎥</span>
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="pt-16 space-y-4">
            <p className="text-sm text-gray-500 uppercase tracking-wider">Trusted by 10,000+ Businesses Worldwide</p>
            <div className="flex justify-center items-center gap-8 opacity-60">
              <div className="text-2xl font-bold text-gray-400">Microsoft</div>
              <div className="text-2xl font-bold text-gray-400">Salesforce</div>
              <div className="text-2xl font-bold text-gray-400">HubSpot</div>
              <div className="text-2xl font-bold text-gray-400">Slack</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
