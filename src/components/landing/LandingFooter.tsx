
import React from 'react';
import { ArrowRight, Mail, MapPin, Phone } from 'lucide-react';

const LandingFooter = () => {
  const footerLinks = {
    Product: [
      'Features',
      'Pricing',
      'Integrations',
      'API',
      'Security',
      'Roadmap'
    ],
    'Use Cases': [
      'E-commerce',
      'Healthcare',
      'Education',
      'Real Estate',
      'SaaS',
      'Agencies'
    ],
    Resources: [
      'Documentation',
      'Tutorials',
      'Blog',
      'Templates',
      'Community',
      'Support'
    ],
    Company: [
      'About Us',
      'Careers',
      'Contact',
      'Privacy Policy',
      'Terms of Service',
      'Cookie Policy'
    ]
  };

  return (
    <footer className="bg-gray-900 text-white py-16 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">Y</span>
              </div>
              <span className="text-2xl font-bold">YusrAI</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-sm">
              Transforming businesses with intelligent automation. 
              Build powerful workflows without code, deploy AI agents, 
              and scale your operations effortlessly.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>hello@yusrai.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>San Francisco, CA</span>
              </div>
            </div>
          </div>

          {/* Link Sections */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold text-white mb-4">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a 
                      href="#" 
                      className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1 group"
                    >
                      {link}
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-12">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-2">Stay Updated</h3>
            <p className="text-blue-100 mb-6">
              Get the latest automation tips, product updates, and exclusive offers
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-blue-200 outline-none focus:border-white/50"
              />
              <button className="bg-white text-purple-600 px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Social & Legal */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-400 text-sm">
            © 2024 YusrAI. All rights reserved.
          </div>
          
          {/* Social Links */}
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-gray-700 transition-colors">
              <span className="text-xl">𝕏</span>
            </a>
            <a href="#" className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-gray-700 transition-colors">
              <span className="text-xl">💼</span>
            </a>
            <a href="#" className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-gray-700 transition-colors">
              <span className="text-xl">📺</span>
            </a>
            <a href="#" className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-gray-700 transition-colors">
              <span className="text-xl">💬</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
