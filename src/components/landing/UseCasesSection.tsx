
import React, { useState } from 'react';
import { Building2, ShoppingBag, Stethoscope, GraduationCap, Briefcase, TrendingUp } from 'lucide-react';

const UseCasesSection = () => {
  const [activeCase, setActiveCase] = useState(0);

  const useCases = [
    {
      industry: 'E-commerce',
      icon: ShoppingBag,
      color: 'from-green-500 to-emerald-500',
      title: 'Boost Sales by 40%',
      description: 'Automate customer journeys from first visit to repeat purchase',
      automations: [
        'Abandoned cart recovery emails',
        'Personalized product recommendations',
        'Inventory alerts and restock notifications',
        'Customer review follow-ups',
        'VIP customer reward triggers'
      ],
      results: {
        revenue: '+40%',
        conversion: '+25%',
        retention: '+60%'
      }
    },
    {
      industry: 'Healthcare',
      icon: Stethoscope,
      color: 'from-blue-500 to-cyan-500',
      title: 'Improve Patient Care',
      description: 'Streamline patient management and reduce administrative burden',
      automations: [
        'Appointment scheduling and reminders',
        'Insurance verification workflows',
        'Patient intake form processing',
        'Prescription refill notifications',
        'Follow-up care sequences'
      ],
      results: {
        efficiency: '+55%',
        satisfaction: '+30%',
        errors: '-70%'
      }
    },
    {
      industry: 'Education',
      icon: GraduationCap,
      color: 'from-purple-500 to-pink-500',
      title: 'Enhance Learning',
      description: 'Personalize education and automate administrative tasks',
      automations: [
        'Student enrollment workflows',
        'Automated grading and feedback',
        'Parent-teacher communication',
        'Assignment deadline reminders',
        'Performance analytics reporting'
      ],
      results: {
        engagement: '+45%',
        admin_time: '-50%',
        outcomes: '+35%'
      }
    },
    {
      industry: 'Professional Services',
      icon: Briefcase,
      color: 'from-orange-500 to-red-500',
      title: 'Scale Operations',
      description: 'Automate client management and project workflows',
      automations: [
        'Client onboarding sequences',
        'Project milestone tracking',
        'Invoice generation and follow-up',
        'Contract renewal notifications',
        'Team capacity planning'
      ],
      results: {
        productivity: '+65%',
        client_satisfaction: '+40%',
        revenue: '+50%'
      }
    },
    {
      industry: 'Real Estate',
      icon: Building2,
      color: 'from-teal-500 to-cyan-500',
      title: 'Close More Deals',
      description: 'Nurture leads and streamline property management',
      automations: [
        'Lead qualification and scoring',
        'Property showing scheduling',
        'Market update newsletters',
        'Contract milestone tracking',
        'Client referral programs'
      ],
      results: {
        deals: '+35%',
        lead_response: '-80%',
        client_retention: '+45%'
      }
    },
    {
      industry: 'SaaS',
      icon: TrendingUp,
      color: 'from-indigo-500 to-purple-500',
      title: 'Accelerate Growth',
      description: 'Optimize user onboarding and reduce churn',
      automations: [
        'User onboarding sequences',
        'Feature adoption campaigns',
        'Churn prediction and prevention',
        'Upgrade and upsell triggers',
        'Customer success workflows'
      ],
      results: {
        activation: '+50%',
        churn: '-40%',
        expansion: '+60%'
      }
    }
  ];

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full mb-6">
            <Building2 className="w-4 h-4" />
            <span className="text-sm font-medium">Industry Solutions</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Perfect for
            <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Every Industry
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From e-commerce to healthcare, our automation solutions are proven to deliver 
            exceptional results across all industries and business sizes.
          </p>
        </div>

        {/* Industry Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {useCases.map((useCase, index) => {
            const IconComponent = useCase.icon;
            return (
              <button
                key={index}
                onClick={() => setActiveCase(index)}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-medium transition-all duration-300 ${
                  activeCase === index
                    ? `bg-gradient-to-r ${useCase.color} text-white shadow-lg scale-105`
                    : 'bg-white text-gray-600 hover:text-gray-900 hover:shadow-md'
                }`}
              >
                <IconComponent className="w-5 h-5" />
                <span>{useCase.industry}</span>
              </button>
            );
          })}
        </div>

        {/* Active Use Case */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className={`bg-gradient-to-r ${useCases[activeCase].color} p-8 text-white`}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                {React.createElement(useCases[activeCase].icon, { className: 'w-8 h-8' })}
              </div>
              <div>
                <h3 className="text-3xl font-bold">{useCases[activeCase].title}</h3>
                <p className="text-lg opacity-90">{useCases[activeCase].industry} Industry</p>
              </div>
            </div>
            <p className="text-xl opacity-90">{useCases[activeCase].description}</p>
          </div>

          <div className="p-8">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Automations List */}
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-6">Key Automations</h4>
                <div className="space-y-4">
                  {useCases[activeCase].automations.map((automation, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className={`w-8 h-8 bg-gradient-to-r ${useCases[activeCase].color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white text-sm font-bold">{index + 1}</span>
                      </div>
                      <span className="text-gray-700">{automation}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Results */}
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-6">Proven Results</h4>
                <div className="space-y-6">
                  {Object.entries(useCases[activeCase].results).map(([key, value], index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div>
                        <div className="text-sm text-gray-600 capitalize">
                          {key.replace(/_/g, ' ')}
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{value}</div>
                      </div>
                      <div className={`w-12 h-12 bg-gradient-to-r ${useCases[activeCase].color} rounded-xl flex items-center justify-center`}>
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-900 mb-2">ROI Calculator</div>
                    <div className="text-green-700 mb-4">
                      Based on {useCases[activeCase].industry.toLowerCase()} industry averages
                    </div>
                    <div className="text-3xl font-bold text-green-600">650% ROI</div>
                    <div className="text-sm text-green-600">Average first-year return</div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-8 text-center">
              <button className={`bg-gradient-to-r ${useCases[activeCase].color} text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:shadow-xl transition-all`}>
                Get Started with {useCases[activeCase].industry} Automation
              </button>
            </div>
          </div>
        </div>

        {/* Success Stats */}
        <div className="mt-16 grid md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              10,000+
            </div>
            <div className="text-gray-600">Businesses Automated</div>
          </div>
          <div>
            <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
              $2.3B
            </div>
            <div className="text-gray-600">in Savings Generated</div>
          </div>
          <div>
            <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              45%
            </div>
            <div className="text-gray-600">Average Efficiency Gain</div>
          </div>
          <div>
            <div className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
              99.9%
            </div>
            <div className="text-gray-600">Customer Satisfaction</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;
