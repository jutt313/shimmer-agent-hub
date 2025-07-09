
import React from 'react';
import { Shield, Lock, Eye, Server, Zap, CheckCircle } from 'lucide-react';

const SecuritySection = () => {
  const securityFeatures = [
    {
      icon: Shield,
      title: 'Enterprise-Grade Security',
      description: 'Bank-level encryption protects your data at rest and in transit',
      details: 'AES-256 encryption, TLS 1.3, Zero-trust architecture',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Lock,
      title: 'Advanced Access Control',
      description: 'Granular permissions and multi-factor authentication',
      details: 'Role-based access, API key management, Secure sessions',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Eye,
      title: 'Complete Audit Trail',
      description: 'Every action is logged and monitored in real-time',
      details: 'Immutable logs, Real-time alerts, Activity tracking',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Server,
      title: 'Secure Infrastructure',
      description: 'Reliable cloud infrastructure with high availability',
      details: 'Auto-scaling, DDoS protection, Backup redundancy',
      color: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <section id="security" className="py-20 px-6 bg-gradient-to-b from-gray-900 to-blue-900 text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-300 px-4 py-2 rounded-full mb-6">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">Enterprise Security</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Your Data is
            <span className="block bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Fort Knox Secure
            </span>
          </h2>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            We've built security into every layer of our platform. Your automations and data 
            are protected by enterprise-grade security measures and best practices.
          </p>
        </div>

        {/* Security Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {securityFeatures.map((feature, index) => {
            const FeatureIcon = feature.icon;
            
            return (
              <div 
                key={index}
                className="group bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:-translate-y-2"
              >
                {/* Icon */}
                <div className={`w-14 h-14 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <FeatureIcon className="w-7 h-7 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-white mb-3">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-gray-300 text-sm mb-3 leading-relaxed">
                  {feature.description}
                </p>

                {/* Technical Details */}
                <p className="text-gray-400 text-xs">
                  {feature.details}
                </p>

                {/* Hover Effect */}
                <div className={`mt-4 h-1 bg-gradient-to-r ${feature.color} rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
              </div>
            );
          })}
        </div>

        {/* Security Stats */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">
              99.9%
            </div>
            <div className="text-gray-300">Uptime Target</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              256-bit
            </div>
            <div className="text-gray-300">AES Encryption</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              24/7
            </div>
            <div className="text-gray-300">Security Monitoring</div>
          </div>
        </div>

        {/* Our Security Promise */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <h3 className="text-2xl font-bold">Our Security Promise</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-green-400">What We Guarantee</h4>
                <ul className="space-y-2 text-gray-300 text-left">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>End-to-end encryption for all data</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Secure credential storage and management</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Regular security audits and updates</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Compliance with industry standards</span>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-blue-400">How We Protect You</h4>
                <ul className="space-y-2 text-gray-300 text-left">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>Isolated execution environments</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>Advanced threat detection systems</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>Automated backup and recovery</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>Real-time monitoring and alerts</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <p className="text-gray-300 text-lg mb-6">
              Your security is our top priority. We implement the same security measures used by 
              Fortune 500 companies to ensure your data and automations remain protected.
            </p>
            
            <button 
              onClick={() => window.location.href = '/auth'}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all inline-flex items-center gap-2"
            >
              <Shield className="w-5 h-5" />
              Start Secure Trial
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
