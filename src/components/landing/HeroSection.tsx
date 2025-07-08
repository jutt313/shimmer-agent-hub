
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Zap } from 'lucide-react';

const HeroSection = () => {
  const navigate = useNavigate();
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);
  const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(0);
  const [animatedText, setAnimatedText] = useState('');

  const titles = [
    'Transform Your Business with AI-Powered Automation',
    'Revolutionize Operations with Intelligent Workflows',
    'Automate Complex Processes with Advanced AI',
    'Build Smart Solutions with No-Code AI Platform'
  ];

  const subtitles = [
    'Create intelligent workflows, build AI agents, and automate complex business processes with our revolutionary no-code platform. Join thousands of businesses already transforming their operations.',
    'Streamline your workflow with AI-powered automation that learns and adapts. Build powerful automations in minutes, not months, with our intuitive platform.',
    'Deploy intelligent agents that work 24/7 to handle your most complex tasks. Experience the future of business automation today.',
    'Connect any platform, automate any process, and scale infinitely with AI that understands your business needs.'
  ];

  useEffect(() => {
    const titleInterval = setInterval(() => {
      setCurrentTitleIndex((prev) => (prev + 1) % titles.length);
      setCurrentSubtitleIndex((prev) => (prev + 1) % subtitles.length);
    }, 4000);

    return () => clearInterval(titleInterval);
  }, []);

  useEffect(() => {
    const currentTitle = titles[currentTitleIndex];
    setAnimatedText('');
    
    let index = 0;
    const timer = setInterval(() => {
      setAnimatedText(currentTitle.slice(0, index));
      index++;
      if (index > currentTitle.length) {
        clearInterval(timer);
      }
    }, 50);
    
    return () => clearInterval(timer);
  }, [currentTitleIndex]);

  const formatTitle = (title: string) => {
    const keywords = ['AI-Powered', 'Intelligent', 'Advanced AI', 'No-Code AI'];
    let formattedTitle = title;
    
    keywords.forEach(keyword => {
      if (title.includes(keyword)) {
        formattedTitle = title.replace(
          keyword,
          `<span class="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">${keyword}</span>`
        );
      }
    });
    
    return formattedTitle;
  };

  return (
    <section className="pt-20 pb-20 px-6 relative overflow-hidden">
      {/* Enhanced Background with Color Boxes */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50"></div>
        
        {/* Enhanced Background Elements */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-r from-blue-300/20 to-purple-300/20 rounded-3xl blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-48 h-48 bg-gradient-to-r from-purple-300/20 to-blue-300/20 rounded-2xl blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-32 h-32 bg-gradient-to-r from-blue-400/15 to-purple-400/15 rounded-full blur-xl animate-pulse delay-500"></div>
        <div className="absolute top-60 right-1/3 w-40 h-40 bg-gradient-to-r from-purple-400/15 to-blue-400/15 rounded-2xl blur-2xl animate-pulse delay-1500"></div>
        
        {/* Additional Color Boxes */}
        <div className="absolute bottom-40 right-10 w-56 h-56 bg-gradient-to-r from-indigo-300/15 to-cyan-300/15 rounded-3xl blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute top-1/3 left-1/2 w-36 h-36 bg-gradient-to-r from-violet-300/20 to-pink-300/20 rounded-full blur-xl animate-pulse delay-750"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center space-y-8">
          {/* Your Logo */}
          <div className="flex justify-center mb-12">
            <div className="relative">
              <img 
                src="/lovable-uploads/e28c1300-9f75-4596-b29a-56308e4a91f5.png" 
                alt="Logo" 
                className="w-32 h-32 object-contain drop-shadow-2xl animate-float"
              />
              <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-spin slow">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          {/* Dynamic Animated Title */}
          <h1 
            className="text-5xl md:text-7xl font-bold leading-tight text-gray-900"
            dangerouslySetInnerHTML={{ 
              __html: formatTitle(animatedText) + '<span class="animate-pulse text-blue-600">|</span>' 
            }}
          />

          {/* Dynamic Subtitle */}
          <div className="relative">
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed transition-all duration-500 ease-in-out">
              {subtitles[currentSubtitleIndex]}
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
          <div className="bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 rounded-2xl p-4 max-w-md mx-auto">
            <p className="text-green-800 font-semibold">
              Start Your 24-Hour Free Trial Today!
            </p>
            <p className="text-green-600 text-sm">
              No credit card required • Full access • Cancel anytime
            </p>
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
              onClick={() => navigate('/auth')}
              className="group bg-white text-gray-700 px-12 py-4 rounded-2xl text-lg font-semibold border-2 border-gray-200 hover:border-purple-300 hover:shadow-xl transition-all duration-300"
            >
              Watch Visuals
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
