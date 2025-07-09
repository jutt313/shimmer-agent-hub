
import React, { useState } from 'react';
import { Check, Crown, Zap, Star, Gift } from 'lucide-react';

const PricingSection = () => {
  const [showSpecial, setShowSpecial] = useState(false);

  const plans = [
    {
      name: 'Starter',
      description: 'Perfect for individuals and small teams',
      price: 29.97,
      icon: Zap,
      color: 'from-blue-500 to-cyan-500',
      features: [
        '5 Active Automations',
        '2,500 Total Runs/month',
        '1,000 Step Runs/month',
        '5 AI Agents',
        '50+ Platform Integrations',
        'Email Support',
        'Basic Analytics'
      ],
      popular: false
    },
    {
      name: 'Professional',
      description: 'Ideal for growing businesses',
      price: 49.97,
      icon: Star,
      color: 'from-purple-500 to-pink-500',
      features: [
        '15 Active Automations',
        '10,000 Total Runs/month',
        '5,000 Step Runs/month',
        '15 AI Agents',
        '100+ Platform Integrations',
        'Priority Support',
        'Advanced Analytics',
        'Custom Triggers',
        'Team Collaboration'
      ],
      popular: true
    },
    {
      name: 'Business',
      description: 'For scaling companies',
      price: 99.97,
      icon: Crown,
      color: 'from-emerald-500 to-teal-500',
      features: [
        '50 Active Automations',
        '50,000 Total Runs/month',
        '25,000 Step Runs/month',
        '50 AI Agents',
        '200+ Platform Integrations',
        'Dedicated Support',
        'Advanced Security',
        'Team Collaboration',
        'Custom Integrations'
      ],
      popular: false
    },
    {
      name: 'Enterprise',
      description: 'For large organizations',
      price: 149.97,
      icon: Crown,
      color: 'from-gradient-start to-gradient-end',
      features: [
        '100 Active Automations',
        '100,000 Total Runs/month',
        '50,000 Step Runs/month',
        '100 AI Agents',
        '500+ Platform Integrations',
        'White-glove Support',
        'Custom Integrations',
        'API Access',
        'Enterprise Security'
      ],
      popular: false
    }
  ];

  const specialPlan = {
    name: 'Special Beta',
    description: 'Limited Time Offer - 24 Hours Only',
    price: 59.97,
    icon: Gift,
    color: 'from-yellow-400 to-orange-500',
    features: [
      '25 Active Automations',
      '25,000 Total Runs/month',
      '12,500 Step Runs/month',
      '25 AI Agents',
      '200+ Platform Integrations',
      'Priority Support',
      'Advanced Analytics',
      'Custom Triggers',
      'Team Collaboration'
    ],
    badge: 'BETA SPECIAL'
  };

  return (
    <section id="pricing" className="py-20 px-6 bg-gradient-to-b from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full mb-6">
            <Star className="w-4 h-4" />
            <span className="text-sm font-medium">Beta Launch Pricing</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Choose Your
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Success Plan
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Start with a 1-day free trial. No credit card required. 
            Scale as you grow with powerful automation that pays for itself.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {plans.map((plan, index) => {
            const PlanIcon = plan.icon;
            
            return (
              <div 
                key={index}
                className={`relative bg-white rounded-3xl p-8 shadow-lg border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 ${
                  plan.popular ? 'border-purple-300 scale-105' : 'border-gray-200'
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full text-sm font-semibold">
                      MOST POPULAR
                    </div>
                  </div>
                )}

                {/* Plan Icon */}
                <div className={`w-16 h-16 bg-gradient-to-r ${plan.color} rounded-2xl flex items-center justify-center mb-6`}>
                  <PlanIcon className="w-8 h-8 text-white" />
                </div>

                {/* Plan Details */}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>

                {/* Pricing */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button className={`w-full py-4 rounded-2xl font-semibold transition-all ${
                  plan.popular 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}>
                  Start Free Trial
                </button>
              </div>
            );
          })}
        </div>

        {/* Special Offer Reveal */}
        <div className="text-center mb-8">
          {!showSpecial ? (
            <button
              onClick={() => setShowSpecial(true)}
              className="group bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden"
            >
              <span className="relative z-10">🎁 Unlock Beta Special</span>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 transform translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
            </button>
          ) : (
            <div className="animate-fade-in">
              {/* Special Beta Plan */}
              <div className="max-w-2xl mx-auto bg-gradient-to-r from-yellow-50 to-orange-50 rounded-3xl p-8 border-4 border-yellow-300 shadow-2xl relative overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-200/20 to-orange-200/20 animate-pulse"></div>
                
                <div className="relative z-10">
                  {/* Special Badge */}
                  <div className="absolute -top-4 -right-4 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold transform rotate-12">
                    24 HOURS ONLY
                  </div>

                  <div className="flex items-center justify-center gap-4 mb-6">
                    <div className={`w-20 h-20 bg-gradient-to-r ${specialPlan.color} rounded-2xl flex items-center justify-center`}>
                      <Gift className="w-10 h-10 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-3xl font-bold text-gray-900">{specialPlan.name}</h3>
                      <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold inline-block">
                        {specialPlan.badge}
                      </div>
                    </div>
                  </div>

                  <p className="text-xl text-gray-700 mb-6">{specialPlan.description}</p>

                  {/* Special Pricing */}
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-4">
                      <span className="text-5xl font-bold text-gray-900">${specialPlan.price}</span>
                      <div>
                        <div className="text-sm text-gray-600">/month</div>
                        <div className="text-green-600 font-bold">Save 40%!</div>
                      </div>
                    </div>
                  </div>

                  {/* Special Features */}
                  <div className="grid md:grid-cols-2 gap-3 mb-8">
                    {specialPlan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Special CTA */}
                  <div className="text-center">
                    <button className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-12 py-4 rounded-2xl font-bold text-xl hover:shadow-xl transition-all mb-4">
                      Claim Beta Special Now! 🚀
                    </button>
                    <p className="text-sm text-gray-600">
                      ⏰ Limited spots available • Expires in 24 hours
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Guarantees */}
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="space-y-3">
            <div className="text-4xl">💰</div>
            <h4 className="font-semibold text-gray-900">30-Day Money Back</h4>
            <p className="text-gray-600">Not satisfied? Get a full refund.</p>
          </div>
          <div className="space-y-3">
            <div className="text-4xl">🔒</div>
            <h4 className="font-semibold text-gray-900">Secure Payments</h4>
            <p className="text-gray-600">Enterprise-grade security for all transactions.</p>
          </div>
          <div className="space-y-3">
            <div className="text-4xl">📞</div>
            <h4 className="font-semibent text-gray-900">24/7 Support</h4>
            <p className="text-gray-600">Get help whenever you need it.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
