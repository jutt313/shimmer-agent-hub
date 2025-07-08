
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
      details: 'RBAC, SSO integration, API key management',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Eye,
      title: 'Complete Audit Trail',
      description: 'Every action is logged and monitored in real-time',
      details: 'Immutable logs, Real-time alerts, Compliance reporting',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Server,
      title: 'Infrastructure Security',
      description: 'Secure cloud infrastructure with 99.99% uptime',
      details: 'Auto-scaling, DDoS protection, Backup redundancy',
      color: 'from-orange-500 to-red-500'
    }
  ];

  const certifications = [
    { name: 'SOC 2 Type II', icon: '🛡️' },
    { name: 'ISO 27001', icon: '🔒' },
    { name: 'GDPR Compliant', icon: '🇪🇺' },
    { name: 'HIPAA Ready', icon: '🏥' },
    { name: 'PCI DSS', icon: '💳' },
    { name: '99.99% Uptime', icon: '⚡' }
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
            are protected by the same standards used by Fortune 500 companies.
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
              99.99%
            </div>
            <div className="text-gray-300">Uptime Guarantee</div>
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

        {/* Certifications */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
          <h3 className="text-2xl font-bold text-center mb-8">
            Trusted by Enterprise • Certified by Industry Leaders
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {certifications.map((cert, index) => (
              <div 
                key={index}
                className="text-center p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all"
              >
                <div className="text-3xl mb-2">{cert.icon}</div>
                <div className="text-sm text-gray-300 font-medium">{cert.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Promise */}
        <div className="mt-16 text-center">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-2xl p-8 border border-green-500/30">
            <div className="flex items-center justify-center gap-3 mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <h3 className="text-2xl font-bold">Our Security Promise</h3>
            </div>
            <p className="text-gray-300 text-lg mb-6">
              We're so confident in our security that we offer a <span className="text-green-400 font-semibold">$1M security guarantee</span>. 
              If your data is ever compromised due to our security failure, we'll cover the damages.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all">
                View Security Documentation
              </button>
              <button className="border border-green-400 text-green-400 px-8 py-3 rounded-xl font-semibold hover:bg-green-400 hover:text-gray-900 transition-all">
                Schedule Security Review
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
