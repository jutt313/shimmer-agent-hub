
import React, { useState } from 'react';
import { TrendingDown, Clock, DollarSign, Users, ArrowRight } from 'lucide-react';

const ProblemSection = () => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const problemCards = [
    {
      icon: Clock,
      stat: "40%",
      title: "Time Loss",
      subtitle: "on repetitive tasks",
      color: "from-red-500 to-pink-500",
      borderColor: "border-red-100",
      expandedTitle: "15+ Hours Lost Weekly",
      expandedContent: "Your team spends over 15 hours per week on manual, repetitive tasks that could be automated. That's nearly 2 full workdays of lost productivity every week.",
      solution: "YusrAI saves 15+ hours/week with intelligent automation"
    },
    {
      icon: DollarSign,
      stat: "$50K",
      title: "Loss Here",
      subtitle: "annually per employee",
      color: "from-orange-500 to-yellow-500",
      borderColor: "border-orange-100",
      expandedTitle: "Massive ROI Opportunity",
      expandedContent: "Each employee costs your business $50,000+ annually in lost productivity. With automation, see immediate returns of $200,000+ per year.",
      solution: "Calculate your ROI: $200K+ annual savings possible"
    },
    {
      icon: Users,
      stat: "60%",
      title: "Turnover",
      subtitle: "from frustration",
      color: "from-purple-500 to-indigo-500",
      borderColor: "border-purple-100",
      expandedTitle: "Employee Satisfaction Crisis",
      expandedContent: "60% of employees leave due to frustration with manual processes. Automation increases job satisfaction by 85% and reduces turnover dramatically.",
      solution: "Employee satisfaction increases 85% with automation"
    },
    {
      icon: TrendingDown,
      stat: "3x",
      title: "Low Growth",
      subtitle: "vs automated competitors",
      color: "from-red-500 to-rose-500",
      borderColor: "border-red-100",
      expandedTitle: "Competitive Disadvantage",
      expandedContent: "Businesses without automation grow 3x slower than automated competitors. You're falling behind while others race ahead.",
      solution: "Automated businesses grow 3x faster - join them"
    }
  ];

  return (
    <section className="py-20 px-6 relative overflow-hidden">
      {/* Smooth Gradient Background Transition */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-50/50 via-red-50/30 to-orange-50/50"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="text-gray-900">Your Business Is</span>
            <span className="block bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mt-2">
              Bleeding Money
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Every day without automation costs you more than you realize. 
            The hidden expenses are crushing your potential.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {problemCards.map((card, index) => {
            const IconComponent = card.icon;
            const isHovered = hoveredCard === index;
            
            return (
              <div
                key={index}
                className={`relative group cursor-pointer transition-all duration-500 ${
                  isHovered ? 'transform scale-105 z-10' : ''
                }`}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className={`bg-white rounded-2xl p-8 shadow-xl border ${card.borderColor} text-center h-full transition-all duration-300 ${
                  isHovered ? 'shadow-2xl' : ''
                }`}>
                  <div className={`w-16 h-16 bg-gradient-to-r ${card.color} rounded-2xl flex items-center justify-center mx-auto mb-6 transition-transform duration-300 ${
                    isHovered ? 'scale-110' : ''
                  }`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  
                  {!isHovered ? (
                    <>
                      <div className="text-4xl font-bold text-red-600 mb-2">{card.stat}</div>
                      <div className="text-gray-600 font-medium">{card.title}</div>
                      <div className="text-sm text-gray-500 mt-2">{card.subtitle}</div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-gray-900">{card.expandedTitle}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{card.expandedContent}</p>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm font-medium text-green-800">{card.solution}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-gradient-to-r from-gray-900 to-red-900 rounded-3xl p-12 text-center text-white">
          <h3 className="text-3xl md:text-4xl font-bold mb-6">
            The Real Cost of Inaction
          </h3>
          <p className="text-xl mb-8 opacity-90 max-w-4xl mx-auto">
            Companies without automation lose <span className="font-bold text-yellow-400">$2.3 million annually</span> in productivity, 
            errors, and missed opportunities. Every day you wait, your competitors get further ahead.
          </p>
          <button 
            onClick={() => window.location.href = '/auth'}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-8 py-4 rounded-xl text-lg font-bold hover:shadow-2xl transition-all duration-300 transform hover:scale-105 inline-flex items-center gap-3"
          >
            Stop the Bleeding - Start Free Trial
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
