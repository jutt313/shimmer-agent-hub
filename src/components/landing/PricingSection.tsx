
import React, { useState } from 'react';
import { Check, Crown, Zap, Star, Gift } from 'lucide-react';

const PricingSection = () => {
  const [showSpecial, setShowSpecial] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');

  const plans = [
    {
      name: 'Starter',
      description: 'Perfect for individuals and small teams',
      price: { monthly: 29.47, yearly: 23.58 },
      originalPrice: { monthly: 49, yearly: 39 },
      icon: Zap,
      color: 'from-blue-500 to-cyan-500',
      features: [
        '5 Active Automations',
        '1,000 Executions/month',
        'Basic AI Chat Support',
        '10+ Platform Integrations',
        'Email Support',
        'Basic Analytics'
      ],
      popular: false
    },
    {
      name: 'Professional',
      description: 'Ideal for growing businesses',
      price: { monthly: 49.95, yearly: 39.96 },
      originalPrice: { monthly: 79, yearly: 63 },
      icon: Star,
      color: 'from-purple-500 to-pink-500',
      features: [
        '25 Active Automations',
        '10,000 Executions/month',
        'Advanced AI Agents',
        '50+ Platform Integrations',
        'Priority Support',
        'Advanced Analytics',
        'Custom Triggers',
        'Team Collaboration'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      description: 'For large organizations',
      price: { monthly: 129.97, yearly: 103.98 },
      originalPrice: { monthly: 199, yearly: 159 },
      icon: Crown,
      color: 'from-emerald-500 to-teal-500',
      features: [
        'Unlimited Automations',
        'Unlimited Executions',
        'Custom AI Agents',
        'All Platform Integrations',
        'Dedicated Support',
        'Advanced Security',
        'API Access',
        'White-label Options',
        'Custom Integrations'
      ],
      popular: false
    }
  ];

  const specialPlan = {
    name: 'Lifetime Pro',
    description: '🎉 Limited Time Special Offer',
    price: 599.95,
    originalPrice: 2399,
    icon: Gift,
    color: 'from-yellow-400 to-orange-500',
    features: [
      'Everything in Enterprise',
      'Lifetime Access - No Recurring Fees',
      'Priority Feature Requests',
      'Exclusive Beta Access',
      '1-on-1 Setup Call',
      'Lifetime Updates',
      'VIP Support Channel',
      'Custom Integration Credits'
    ],
    badge: 'BEST VALUE'
  };

  return (
    <section id="pricing" className="py-20 px-6 bg-gradient-to-b from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full mb-6">
            <Star className="w-4 h-4" />
            <span className="text-sm font-medium">Simple Pricing</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Choose Your
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Success Plan
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Start free, scale as you grow. No hidden fees, no surprises. 
            Just powerful automation that pays for itself.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white rounded-2xl p-2 shadow-lg border border-gray-200">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-xl font-medium transition-all ${
                billingCycle === 'monthly' 
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-xl font-medium transition-all relative ${
                billingCycle === 'yearly' 
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                20% OFF
              </span>
            </button>
          </div>
        </div>

        {/* Regular Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, index) => {
            const PlanIcon = plan.icon;
            const currentPrice = plan.price[billingCycle];
            const originalPrice = plan.originalPrice[billingCycle];
            
            return (
              <div 
                key={index}
                className={`relative bg-white rounded-3xl p-8 shadow-xl border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
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
                    <span className="text-4xl font-bold text-gray-900">${currentPrice}</span>
                    <span className="text-gray-500">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                  </div>
                  <div className="text-sm text-gray-500 line-through">
                    was ${originalPrice}
                  </div>
                  {billingCycle === 'yearly' && (
                    <div className="text-sm text-green-600 font-medium">
                      Save ${(originalPrice * 12 - currentPrice * 12).toFixed(0)}/year
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button className={`w-full py-4 rounded-2xl font-semibold transition-all ${
                  plan.popular 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}>
                  Get Started
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
              <span className="relative z-10">🎁 Unlock Special Offer</span>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 transform translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
            </button>
          ) : (
            <div className="animate-fade-in">
              {/* Special Lifetime Plan */}
              <div className="max-w-2xl mx-auto bg-gradient-to-r from-yellow-50 to-orange-50 rounded-3xl p-8 border-4 border-yellow-300 shadow-2xl relative overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-200/20 to-orange-200/20 animate-pulse"></div>
                
                <div className="relative z-10">
                  {/* Special Badge */}
                  <div className="absolute -top-4 -right-4 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold transform rotate-12">
                    LIMITED TIME
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
                        <div className="text-2xl text-gray-500 line-through">${specialPlan.originalPrice}</div>
                        <div className="text-green-600 font-bold">Save 75%!</div>
                      </div>
                    </div>
                    <p className="text-gray-600 mt-2">One-time payment • Lifetime access</p>
                  </div>

                  {/* Special Features */}
                  <div className="grid md:grid-cols-2 gap-3 mb-8">
                    {specialPlan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Special CTA */}
                  <div className="text-center">
                    <button className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-12 py-4 rounded-2xl font-bold text-xl hover:shadow-xl transition-all mb-4">
                      Claim Lifetime Access Now! 🚀
                    </button>
                    <p className="text-sm text-gray-600">
                      ⏰ Only 47 spots remaining • Offer expires in 24 hours
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
            <h4 className="font-semibold text-gray-900">24/7 Support</h4>
            <p className="text-gray-600">Get help whenever you need it.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
