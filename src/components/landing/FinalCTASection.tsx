
import React from 'react';
import { ArrowRight, Sparkles, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FinalCTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-6 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10 text-center text-white">
        {/* Explosion Effect */}
        <div className="mb-8">
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            {/* Radiating circles */}
            <div className="absolute inset-0 w-24 h-24 border-4 border-white/30 rounded-full animate-ping"></div>
            <div className="absolute inset-0 w-24 h-24 border-4 border-white/20 rounded-full animate-ping delay-300"></div>
          </div>
        </div>

        <h2 className="text-4xl md:text-7xl font-bold mb-6">
          Ready to Transform
          <span className="block text-yellow-300">Your Business?</span>
        </h2>
        
        <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto mb-8">
          Join 10,000+ businesses already saving time, money, and effort with YusrAI. 
          Your automation journey starts with a single click.
        </p>

        {/* Explosive CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
          <button 
            onClick={() => navigate('/auth')}
            className="group relative bg-white text-purple-600 px-12 py-6 rounded-2xl text-xl font-bold hover:shadow-2xl transition-all duration-300 transform hover:scale-110 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-3">
              <Zap className="w-6 h-6" />
              Start Building for FREE
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </span>
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </button>
          
          <button 
            onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
            className="group border-2 border-white text-white px-12 py-6 rounded-2xl text-xl font-bold hover:bg-white hover:text-purple-600 transition-all duration-300"
          >
            <span className="flex items-center gap-3">
              Watch Demo First
              <span className="group-hover:animate-bounce">🎥</span>
            </span>
          </button>
        </div>

        {/* Trust Indicators */}
        <div className="space-y-4">
          <p className="text-blue-100 text-sm">✅ No Credit Card Required • ✅ Setup in 60 Seconds • ✅ Cancel Anytime</p>
          
          <div className="flex justify-center items-center gap-8 opacity-70">
            <div className="text-lg font-semibold">Trusted by:</div>
            <div className="flex gap-6 text-blue-200">
              <span>Microsoft</span>
              <span>Salesforce</span>
              <span>HubSpot</span>
              <span>Stripe</span>
            </div>
          </div>
        </div>

        {/* Countdown or Urgency */}
        <div className="mt-12 bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-2xl mx-auto">
          <div className="text-yellow-300 font-bold text-lg mb-2">🔥 Limited Time Special</div>
          <p className="text-blue-100">
            First 1,000 new users get 6 months FREE on any paid plan. 
            <span className="text-yellow-300 font-semibold"> Join before it's gone!</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;
