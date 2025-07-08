
import React from 'react';
import { Star, Quote } from 'lucide-react';

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: 'Sarah Chen',
      title: 'CEO, TechFlow Solutions',
      company: 'B2B SaaS',
      avatar: '👩‍💼',
      rating: 5,
      text: 'YusrAI transformed our entire sales process. We went from manual lead qualification to fully automated sequences that convert 40% better. The AI agents handle everything while we focus on closing deals.',
      metrics: { metric: 'Sales Conversion', improvement: '+40%' }
    },
    {
      name: 'Marcus Rodriguez',
      title: 'Operations Director',
      company: 'HealthCare Plus',
      avatar: '👨‍⚕️',
      rating: 5,
      text: 'Managing patient communications used to take hours daily. Now our AI agents handle appointment scheduling, follow-ups, and insurance verifications automatically. Patient satisfaction is at an all-time high.',
      metrics: { metric: 'Patient Satisfaction', improvement: '+65%' }
    },
    {
      name: 'Emily Thompson',
      title: 'Marketing Manager',
      company: 'E-commerce Empire',
      avatar: '👩‍💻',
      rating: 5,
      text: 'The abandoned cart recovery automation alone increased our revenue by $200K this quarter. The visual workflow builder makes complex automations feel simple. Absolutely game-changing.',
      metrics: { metric: 'Quarterly Revenue', improvement: '+$200K' }
    },
    {
      name: 'David Park',
      title: 'Founder',
      company: 'GrowthHack Agency',
      avatar: '👨‍🚀',
      rating: 5,
      text: 'We manage 50+ client campaigns effortlessly now. YusrAI\'s integrations work flawlessly with every tool we use. Our team productivity doubled while client results improved dramatically.',
      metrics: { metric: 'Team Productivity', improvement: '+100%' }
    },
    {
      name: 'Lisa Wang',
      title: 'COO',
      company: 'Real Estate Pro',
      avatar: '👩‍🏢',
      rating: 5,
      text: 'Lead response time dropped from hours to seconds. Our AI qualification system identifies hot prospects instantly, and our agents can focus on closing deals instead of chasing cold leads.',
      metrics: { metric: 'Response Time', improvement: '-95%' }
    },
    {
      name: 'James Mitchell',
      title: 'Head of Customer Success',
      company: 'CloudTech Solutions',
      avatar: '👨‍💼',
      rating: 5,
      text: 'Customer onboarding used to be our biggest bottleneck. Now new users get personalized guidance from day one, leading to 3x better activation rates and significantly lower churn.',
      metrics: { metric: 'User Activation', improvement: '+300%' }
    }
  ];

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full mb-6">
            <Star className="w-4 h-4" />
            <span className="text-sm font-medium">Customer Success</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Loved by
            <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              10,000+ Businesses
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See why industry leaders choose YusrAI to transform their operations 
            and accelerate growth across every department.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200"
            >
              {/* Header */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl">
                  {testimonial.avatar}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{testimonial.name}</h3>
                  <p className="text-sm text-gray-600">{testimonial.title}</p>
                  <p className="text-xs text-purple-600">{testimonial.company}</p>
                </div>
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>

              {/* Quote */}
              <div className="relative mb-4">
                <Quote className="w-6 h-6 text-purple-200 absolute -top-2 -left-2" />
                <p className="text-gray-700 text-sm leading-relaxed pl-4">
                  {testimonial.text}
                </p>
              </div>

              {/* Metrics */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3 border border-purple-100">
                <div className="text-center">
                  <div className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {testimonial.metrics.improvement}
                  </div>
                  <div className="text-xs text-gray-600">{testimonial.metrics.metric}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Social Proof Stats */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-200">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                4.9/5
              </div>
              <div className="text-gray-600">Average Rating</div>
              <div className="flex justify-center gap-1 mt-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
            </div>
            
            <div>
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                10,000+
              </div>
              <div className="text-gray-600">Happy Customers</div>
            </div>
            
            <div>
              <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                98%
              </div>
              <div className="text-gray-600">Retention Rate</div>
            </div>
            
            <div>
              <div className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
                24/7
              </div>
              <div className="text-gray-600">Support Available</div>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-8">Trusted by leading companies worldwide</p>
          <div className="flex justify-center items-center gap-12 opacity-60">
            <div className="text-2xl font-bold text-gray-400">Microsoft</div>
            <div className="text-2xl font-bold text-gray-400">Salesforce</div>
            <div className="text-2xl font-bold text-gray-400">HubSpot</div>
            <div className="text-2xl font-bold text-gray-400">Stripe</div>
            <div className="text-2xl font-bold text-gray-400">Shopify</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
