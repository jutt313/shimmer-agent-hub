
import React, { useState } from 'react';
import { TrendingDown, Clock, DollarSign, Users, ArrowRight, Brain } from 'lucide-react';

const ProblemSection = () => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const problemCards = [
    {
      icon: Clock,
      stat: "40%",
      title: "Time Wasted",
      subtitle: "on manual tasks",
      color: "from-red-500 to-pink-500",
      borderColor: "border-red-100",
      expandedTitle: "15+ Hours Lost Weekly",
      expandedContent: "Your team spends over 15 hours per week on manual, repetitive tasks that could be automated. That's nearly 2 full workdays of productivity lost every week.",
      solution: "YusrAI saves 15+ hours/week with intelligent automation"
    },
    {
      icon: DollarSign,
      stat: "$50K",
      title: "Revenue Loss",
      subtitle: "annually per employee",
      color: "from-orange-500 to-yellow-500",
      borderColor: "border-orange-100",
      expandedTitle: "Massive ROI Opportunity",
      expandedContent: "Each employee costs your business $50,000+ annually in lost productivity. With AI automation, see immediate returns of $200,000+ per year.",
      solution: "Calculate your ROI: $200K+ annual savings possible"
    },
    {
      icon: Users,
      stat: "60%",
      title: "Employee Turnover",
      subtitle: "from manual frustration",
      color: "from-purple-500 to-indigo-500",
      borderColor: "border-purple-100",
      expandedTitle: "Employee Satisfaction Crisis",
      expandedContent: "60% of employees leave due to frustration with repetitive manual processes. AI automation increases job satisfaction by 85% and reduces turnover dramatically.",
      solution: "Employee satisfaction increases 85% with AI automation"
    },
    {
      icon: TrendingDown,
      stat: "3x",
      title: "Slower Growth",
      subtitle: "vs AI-powered competitors",
      color: "from-red-500 to-rose-500",
      borderColor: "border-red-100",
      expandedTitle: "Competitive Disadvantage",
      expandedContent: "Businesses without AI automation grow 3x slower than AI-powered competitors. You're falling behind while others race ahead with intelligent systems.",
      solution: "AI-automated businesses grow 3x faster - join them"
    }
  ];

  return (
    <section className="py-20 px-6 relative overflow-hidden">
      {/* Enhanced Background */}
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
            The hidden expenses are crushing your potential in the age of AI.
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

        {/* AI Era Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-12 text-center text-white mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Brain className="w-8 h-8" />
            <h3 className="text-3xl md:text-4xl font-bold">
              Welcome to the Age of AI
            </h3>
          </div>
          <p className="text-xl mb-8 opacity-90 max-w-4xl mx-auto">
            This is the era where AI optimizes every business process. Companies leveraging intelligent automation 
            are experiencing unprecedented growth while others struggle with manual inefficiencies.
          </p>
          <div className="bg-white/20 rounded-2xl p-6 max-w-2xl mx-auto">
            <p className="text-lg font-semibold mb-4">Transform Your Business with AI Automation:</p>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span>Intelligent process optimization</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span>24/7 AI-powered operations</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span>Predictive business intelligence</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span>Unlimited scalability</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-gray-900 to-red-900 rounded-3xl p-12 text-center text-white">
          <h3 className="text-3xl md:text-4xl font-bold mb-6">
            The Real Cost of Inaction
          </h3>
          <p className="text-xl mb-8 opacity-90 max-w-4xl mx-auto">
            Companies without AI automation lose <span className="font-bold text-yellow-400">$2.3 million annually</span> in productivity, 
            errors, and missed opportunities. Every day you wait, AI-powered competitors get further ahead.
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
