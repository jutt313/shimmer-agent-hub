
import React from 'react';
import { Zap, Shield, Globe, BarChart3 } from 'lucide-react';

const TechnicalSpecsSection = () => {
  return (
    <section className="py-20 px-6 bg-gradient-to-b from-gray-900 to-blue-900 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-4 py-2 rounded-full mb-6">
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm font-medium">Technical Specifications</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Built for
            <span className="block bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Performance
            </span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <Zap className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <div className="text-3xl font-bold mb-2">99.99%</div>
            <div className="text-gray-300">Uptime SLA</div>
          </div>
          <div className="text-center">
            <Shield className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <div className="text-3xl font-bold mb-2">SOC 2</div>
            <div className="text-gray-300">Compliant</div>
          </div>
          <div className="text-center">
            <Globe className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <div className="text-3xl font-bold mb-2">Global</div>
            <div className="text-gray-300">CDN Network</div>
          </div>
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-orange-400 mx-auto mb-4" />
            <div className="text-3xl font-bold mb-2">1M+</div>
            <div className="text-gray-300">API Calls/Day</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechnicalSpecsSection;
