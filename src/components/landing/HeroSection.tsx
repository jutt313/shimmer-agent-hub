
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Zap, Users, Cpu, Eye } from 'lucide-react';

const HeroSection = () => {
  const navigate = useNavigate();
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);

  const titles = [
    'Automate Everything with AI-Powered Intelligence',
    'Build Smart Workflows in Minutes, Not Months',
    'Connect Any Platform, Scale Any Business'
  ];

  const subtitles = [
    'Transform your business operations with intelligent automation that learns and adapts. Create powerful workflows, deploy AI agents, and connect unlimited platforms - all without coding knowledge.',
    'Streamline complex processes with AI that understands your business needs. Build automations that save hours daily and boost productivity by 300%.',
    'Universal platform integration means no limits. Scale infinitely with AI-powered automation that works 24/7 to grow your business.'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTitleIndex((prev) => (prev + 1) % titles.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="pt-20 pb-20 px-6 relative overflow-hidden">
      {/* Enhanced Dynamic Background with Energy Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50"></div>
        
        {/* Thunder/Energy Effects */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-3xl blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-gradient-to-r from-cyan-400/15 to-blue-400/15 rounded-full blur-xl animate-pulse delay-500"></div>
        
        {/* Energy Lines from Logo */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-px h-32 bg-gradient-to-t from-transparent via-blue-400/50 to-transparent"
              style={{
                transformOrigin: 'bottom center',
                transform: `rotate(${i * 30}deg) translateY(-100px)`,
                animation: `pulse 3s ease-in-out infinite ${i * 0.2}s`
              }}
            />
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center space-y-6">
          {/* Logo with Enhanced Animation */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <img 
                src="/lovable-uploads/e28c1300-9f75-4596-b29a-56308e4a91f5.png" 
                alt="YusrAI Logo" 
                className="w-24 h-24 object-contain drop-shadow-2xl animate-pulse"
              />
            </div>
          </div>

          {/* Shorter, Colorful Title */}
          <div className="h-24 flex items-center justify-center">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight transition-all duration-1000 ease-in-out">
              <span className="bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                {titles[currentTitleIndex]}
              </span>
            </h1>
          </div>

          {/* Longer, More Descriptive Subtitle */}
          <div className="relative max-w-4xl mx-auto">
            <p className="text-lg md:text-xl text-gray-700 leading-relaxed transition-all duration-1000 ease-in-out">
              {subtitles[currentTitleIndex]}
            </p>
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

          {/* Two CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            <button 
              onClick={() => navigate('/auth')}
              className="group bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:shadow-2xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative flex items-center gap-3">
                Start Your 24-Hour Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            
            <button 
              onClick={() => {
                const visualsSection = document.getElementById('visuals-section');
                visualsSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="group border-2 border-purple-500 text-purple-600 px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-purple-500 hover:text-white transition-all duration-300 transform hover:scale-105"
            >
              <span className="flex items-center gap-3">
                <Eye className="w-5 h-5" />
                See Visuals
              </span>
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="pt-12 space-y-4">
            <p className="text-sm text-gray-500 uppercase tracking-wider font-medium">Trusted Worldwide</p>
            <div className="flex justify-center items-center gap-8 opacity-60 flex-wrap">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                <span className="text-lg font-semibold text-gray-600">10,000+ Businesses</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-500" />
                <span className="text-lg font-semibold text-gray-600">Universal Integration</span>
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
