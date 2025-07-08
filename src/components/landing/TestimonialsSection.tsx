
import React from 'react';
import { Star, Quote } from 'lucide-react';

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Operations Manager",
      company: "TechFlow Solutions",
      content: "We reduced our manual data entry by 80% in the first month. The time savings allowed us to focus on strategic initiatives rather than repetitive tasks.",
      rating: 5
    },
    {
      name: "Michael Rodriguez",
      role: "Small Business Owner", 
      company: "Rodriguez Marketing",
      content: "As a small team, automation has been a game-changer. We can now handle 3x more clients without increasing our staff size.",
      rating: 5
    },
    {
      name: "Jennifer Walsh",
      role: "Customer Success Director",
      company: "GrowthCorp",
      content: "Our customer response time improved from hours to minutes. The AI agents handle routine inquiries perfectly, escalating only when needed.",
      rating: 5
    },
    {
      name: "David Kim",
      role: "E-commerce Manager",
      company: "Online Retail Plus",
      content: "Order processing automation saved us 15 hours per week. We can now focus on growing the business instead of managing mundane tasks.",
      rating: 5
    },
    {
      name: "Lisa Thompson",
      role: "HR Director",
      company: "People First Co",
      content: "Onboarding new employees used to take days. Now our automated workflows handle most of the process, reducing time to just hours.",
      rating: 5
    },
    {
      name: "James Wilson",
      role: "Finance Manager",
      company: "Secure Finance Ltd",
      content: "Monthly reporting that took 2 days now completes in 30 minutes. The accuracy has also improved significantly with automated data collection.",
      rating: 5
    }
  ];

  // Duplicate testimonials for seamless scrolling
  const scrollingTestimonials = [...testimonials, ...testimonials];

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-indigo-50/40 to-purple-50/50 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full mb-6">
            <Star className="w-4 h-4" />
            <span className="text-sm font-medium">Customer Stories</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Loved by
            <span className="block bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              10,000+ Businesses
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Real stories from real businesses who transformed their operations with our automation platform.
          </p>
        </div>

        {/* Vertical Scrolling Testimonials */}
        <div className="relative h-96 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-white z-10 pointer-events-none"></div>
          
          <div className="animate-scroll-vertical space-y-6">
            {scrollingTestimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 mx-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-lg">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex gap-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                    
                    <div className="relative mb-4">
                      <Quote className="w-8 h-8 text-gray-300 absolute -top-2 -left-2" />
                      <p className="text-gray-700 italic pl-6">
                        "{testimonial.content}"
                      </p>
                    </div>
                    
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.role}</div>
                      <div className="text-sm text-purple-600 font-medium">{testimonial.company}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-8 mt-16">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">10,000+</div>
            <div className="text-gray-600">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">98%</div>
            <div className="text-gray-600">Satisfaction Rate</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">2.5M</div>
            <div className="text-gray-600">Hours Saved Monthly</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">150+</div>
            <div className="text-gray-600">Countries Served</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
