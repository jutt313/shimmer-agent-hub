
import React, { useState } from 'react';
import { Bot, Brain, Zap, Clock, ArrowRight, Settings, Target, Users } from 'lucide-react';

const AIAgentsSection = () => {
  const [selectedAgent, setSelectedAgent] = useState(0);

  const agents = [
    {
      name: "Customer Support Agent",
      role: "Support Specialist",
      goal: "Handle customer inquiries and provide instant support 24/7",
      rules: "Always be helpful, escalate complex issues to humans, maintain friendly tone",
      capabilities: ["Email Response", "Live Chat", "Ticket Routing", "FAQ Management"]
    },
    {
      name: "Sales Assistant Agent", 
      role: "Sales Representative",
      goal: "Qualify leads and nurture prospects through the sales funnel",
      rules: "Focus on customer needs, provide relevant information, schedule demos when appropriate",
      capabilities: ["Lead Qualification", "Follow-up Emails", "Demo Scheduling", "CRM Updates"]
    },
    {
      name: "Data Analysis Agent",
      role: "Data Analyst", 
      goal: "Analyze business data and provide actionable insights",
      rules: "Use accurate data sources, present clear visualizations, highlight key trends",
      capabilities: ["Report Generation", "Trend Analysis", "Data Visualization", "Alert Systems"]
    }
  ];

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-purple-50/40 to-indigo-50/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full mb-6">
            <Bot className="w-4 h-4" />
            <span className="text-sm font-medium">AI Workforce</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Your Personal
            <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              AI Workforce
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Deploy intelligent AI agents that work around the clock, handling complex tasks 
            and making smart decisions just like your best employees.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* AI Agent Creation Form */}
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Create AI Agent</h3>
                <p className="text-gray-600 text-sm">Configure your intelligent assistant</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Agent Name</label>
                <input 
                  type="text" 
                  value={agents[selectedAgent].name}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Role & Responsibility</label>
                <input 
                  type="text" 
                  value={agents[selectedAgent].role}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Primary Goal</label>
                <textarea 
                  value={agents[selectedAgent].goal}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent h-20 resize-none"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Operating Rules</label>
                <textarea 
                  value={agents[selectedAgent].rules}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent h-24 resize-none"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Key Capabilities</label>
                <div className="grid grid-cols-2 gap-2">
                  {agents[selectedAgent].capabilities.map((capability, index) => (
                    <div key={index} className="bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg text-sm font-medium">
                      {capability}
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => window.location.href = '/auth'}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-4 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3"
              >
                Deploy This Agent
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Agent Features & Benefits */}
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Learn Constantly</h3>
                  <p className="text-gray-600">Your AI agents continuously improve by learning from every interaction and adapting to your business needs.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Work 24/7</h3>
                  <p className="text-gray-600">Never miss an opportunity. Your AI workforce operates around the clock, handling tasks while you sleep.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Scale Infinitely</h3>
                  <p className="text-gray-600">Deploy unlimited agents across different departments without hiring, training, or managing human resources.</p>
                </div>
              </div>
            </div>

            {/* Agent Selector */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Try Different Agent Types</h4>
              <div className="grid grid-cols-1 gap-3">
                {agents.map((agent, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedAgent(index)}
                    className={`p-4 rounded-xl text-left transition-all ${
                      selectedAgent === index
                        ? 'bg-indigo-100 border-2 border-indigo-500 text-indigo-900'
                        : 'bg-white border border-gray-200 hover:shadow-md'
                    }`}
                  >
                    <div className="font-semibold">{agent.name}</div>
                    <div className="text-sm text-gray-600 mt-1">{agent.role}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Industries */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
              <h4 className="font-semibold mb-4">Perfect for Every Industry</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  <span>E-commerce</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Healthcare</span>
                </div>
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span>SaaS</span>
                </div>
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  <span>Education</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIAgentsSection;
