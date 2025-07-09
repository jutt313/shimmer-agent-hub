
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Zap, Users, Cpu } from 'lucide-react';

const HeroSection = () => {
  const navigate = useNavigate();
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);

  const titles = [
    'Transform Your Business with AI-Powered Automation',
    'Build Intelligent Workflows in Minutes, Not Months',
    'Connect Any Platform, Automate Any Process',
    'Deploy Smart AI Agents That Work 24/7'
  ];

  const subtitles = [
    'Create intelligent workflows, build AI agents, and automate complex business processes with our revolutionary no-code platform.',
    'Streamline operations with AI that learns and adapts. Build powerful automations without coding knowledge.',
    'Connect unlimited platforms and scale infinitely with AI that understands your business needs.',
    'Deploy intelligent agents that handle your most complex tasks automatically around the clock.'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTitleIndex((prev) => (prev + 1) % titles.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="pt-20 pb-20 px-6 relative overflow-hidden">
      {/* Enhanced Dynamic Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50"></div>
        
        {/* Floating Geometric Shapes */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-3xl blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-gradient-to-r from-cyan-400/15 to-blue-400/15 rounded-full blur-xl animate-pulse delay-500"></div>
        <div className="absolute top-60 right-1/4 w-48 h-48 bg-gradient-to-r from-indigo-400/15 to-purple-400/15 rounded-2xl blur-2xl animate-pulse delay-1500"></div>
        
        {/* Particle Effect Background */}
        <div className="absolute inset-0 opacity-30">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center space-y-8">
          {/* Your Logo with Animation */}
          <div className="flex justify-center mb-12">
            <div className="relative">
              <img 
                src="/lovable-uploads/e28c1300-9f75-4596-b29a-56308e4a91f5.png" 
                alt="YusrAI Logo" 
                className="w-32 h-32 object-contain drop-shadow-2xl"
              />
              {/* Energy Lines Animation */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 w-40 h-40 -translate-x-1/2 -translate-y-1/2">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-8 bg-gradient-to-t from-transparent to-blue-500 opacity-70"
                      style={{
                        transformOrigin: 'bottom center',
                        transform: `rotate(${i * 45}deg) translateY(-20px)`,
                        animation: `pulse 2s ease-in-out infinite ${i * 0.2}s`
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Title - Smooth Transition */}
          <div className="h-32 flex items-center justify-center">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight text-gray-900 transition-all duration-1000 ease-in-out">
              {titles[currentTitleIndex]}
            </h1>
          </div>

          {/* Dynamic Subtitle */}
          <div className="relative">
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed transition-all duration-1000 ease-in-out">
              {subtitles[currentTitleIndex]}
            </p>
            
            {/* Floating Icons */}
            <div className="absolute -left-8 top-4 animate-float">
              <Zap className="w-6 h-6 text-yellow-500" />
            </div>
            <div className="absolute -right-8 bottom-4 animate-float delay-500">
              <Sparkles className="w-6 h-6 text-purple-500" />
            </div>
          </div>

          {/* 24 Hours Free Trial Notice */}
          <div className="bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 rounded-2xl p-6 max-w-lg mx-auto shadow-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-green-800 font-bold text-lg">
                Start Your 24-Hour Free Trial Today!
              </p>
            </div>
            <p className="text-green-600">
              No credit card required • Full access • Cancel anytime
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
            <button 
              onClick={() => navigate('/auth')}
              className="group bg-gradient-to-r from-blue-500 to-purple-600 text-white px-12 py-4 rounded-2xl text-lg font-semibold hover:shadow-2xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative flex items-center gap-3">
                Start Building Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="pt-16 space-y-6">
            <p className="text-sm text-gray-500 uppercase tracking-wider font-medium">Worldwide Business is Our Family</p>
            <div className="flex justify-center items-center gap-8 opacity-60 flex-wrap">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                <span className="text-lg font-semibold text-gray-600">10,000+ Businesses</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-500" />
                <span className="text-lg font-semibold text-gray-600">50+ Platforms</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span className="text-lg font-semibold text-gray-600">99.9% Uptime</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
