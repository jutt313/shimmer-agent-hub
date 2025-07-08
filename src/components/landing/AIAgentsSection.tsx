
import React, { useState } from 'react';
import { Bot, Brain, Zap, Users, MessageSquare, Settings } from 'lucide-react';

const AIAgentsSection = () => {
  const [activeAgent, setActiveAgent] = useState(0);

  const agents = [
    {
      name: 'Customer Support Agent',
      role: 'Support Specialist',
      description: 'Handles customer inquiries, resolves common issues, and escalates complex problems',
      avatar: '🎧',
      skills: ['Multi-language support', 'Sentiment analysis', 'Issue categorization', 'Auto-responses'],
      stats: { resolved: '94%', avgTime: '2.3 min', satisfaction: '4.8/5' },
      color: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'Sales Assistant',
      role: 'Lead Qualifier',
      description: 'Qualifies leads, schedules meetings, and nurtures prospects through the sales funnel',
      avatar: '💼',
      skills: ['Lead scoring', 'Meeting scheduling', 'Follow-up sequences', 'CRM integration'],
      stats: { qualified: '89%', meetings: '156', conversion: '34%' },
      color: 'from-green-500 to-emerald-500'
    },
    {
      name: 'Content Creator',
      role: 'Marketing Assistant',
      description: 'Creates personalized content, manages campaigns, and optimizes engagement',
      avatar: '✍️',
      skills: ['Content generation', 'SEO optimization', 'A/B testing', 'Analytics'],
      stats: { posts: '247', engagement: '+67%', reach: '2.3M' },
      color: 'from-purple-500 to-pink-500'
    }
  ];

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full mb-6">
            <Bot className="w-4 h-4" />
            <span className="text-sm font-medium">AI Agents</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Your Personal
            <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI Workforce
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Deploy intelligent AI agents that work 24/7, learn from your data, 
            and get smarter with every interaction. It's like hiring experts that never sleep.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Agent Selection */}
          <div className="space-y-6">
            {agents.map((agent, index) => (
              <div 
                key={index}
                className={`bg-white rounded-2xl p-6 shadow-lg border-2 cursor-pointer transition-all duration-300 ${
                  activeAgent === index 
                    ? 'border-purple-300 shadow-2xl scale-105' 
                    : 'border-gray-200 hover:shadow-xl hover:-translate-y-1'
                }`}
                onClick={() => setActiveAgent(index)}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-16 h-16 bg-gradient-to-r ${agent.color} rounded-2xl flex items-center justify-center text-2xl flex-shrink-0`}>
                    {agent.avatar}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{agent.name}</h3>
                      {activeAgent === index && (
                        <div className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          Active
                        </div>
                      )}
                    </div>
                    <p className="text-purple-600 text-sm font-medium mb-2">{agent.role}</p>
                    <p className="text-gray-600 text-sm">{agent.description}</p>
                  </div>
                </div>

                {activeAgent === index && (
                  <div className="mt-4 pt-4 border-t border-gray-100 animate-fade-in">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {Object.entries(agent.stats).map(([key, value], statIndex) => (
                        <div key={statIndex} className="text-center">
                          <div className="text-lg font-bold text-gray-900">{value}</div>
                          <div className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {agent.skills.map((skill, skillIndex) => (
                        <span 
                          key={skillIndex}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Agent Chat Interface */}
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Chat Header */}
            <div className={`bg-gradient-to-r ${agents[activeAgent].color} p-4 text-white`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-lg">
                  {agents[activeAgent].avatar}
                </div>
                <div>
                  <h3 className="font-semibold">{agents[activeAgent].name}</h3>
                  <p className="text-sm opacity-90">Online • Ready to help</p>
                </div>
                <div className="ml-auto flex gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse delay-100"></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse delay-200"></div>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-4">
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-tl-md p-4 max-w-xs">
                  <p className="text-sm text-gray-800">
                    Hi! I'm your {agents[activeAgent].role.toLowerCase()}. I can help you with automated {
                      activeAgent === 0 ? 'customer support, ticket resolution, and inquiry management' :
                      activeAgent === 1 ? 'lead qualification, meeting scheduling, and sales follow-ups' :
                      'content creation, campaign management, and performance optimization'
                    }. What would you like to set up?
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <div className={`bg-gradient-to-r ${agents[activeAgent].color} text-white rounded-2xl rounded-tr-md p-4 max-w-xs`}>
                  <p className="text-sm">
                    {activeAgent === 0 ? 'Set up automatic responses for common customer questions' :
                     activeAgent === 1 ? 'Create a lead scoring system and auto-schedule demos' :
                     'Generate weekly blog posts and social media content'}
                  </p>
                </div>
              </div>

              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-tl-md p-4 max-w-xs">
                  <p className="text-sm text-gray-800">
                    Perfect! I'll create that automation for you. Here's what I'll set up:
                    <br/><br/>
                    ✅ {activeAgent === 0 ? 'Auto-categorize incoming tickets' :
                          activeAgent === 1 ? 'Score leads based on engagement' :
                          'Content calendar with SEO optimization'}
                    <br/>
                    ✅ {activeAgent === 0 ? 'Send instant responses for FAQs' :
                          activeAgent === 1 ? 'Schedule qualified demos automatically' :
                          'Generate personalized content'}
                    <br/>
                    ✅ {activeAgent === 0 ? 'Escalate complex issues to humans' :
                          activeAgent === 1 ? 'Follow up with nurture sequences' :
                          'Post at optimal engagement times'}
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-xs font-medium">
                  Agent is analyzing your requirements...
                </div>
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3 bg-white rounded-2xl p-3 border border-gray-200">
                <input 
                  type="text" 
                  placeholder="Describe what you'd like to automate..."
                  className="flex-1 bg-transparent outline-none text-gray-600"
                  disabled
                />
                <button className={`bg-gradient-to-r ${agents[activeAgent].color} text-white p-2 rounded-xl`}>
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Agent Benefits */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Learns Continuously</h3>
            <p className="text-gray-600">Each agent gets smarter with every interaction, adapting to your business needs</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Works 24/7</h3>
            <p className="text-gray-600">Never miss an opportunity. Your AI workforce operates around the clock</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Scales Infinitely</h3>
            <p className="text-gray-600">Handle unlimited conversations without hiring additional staff</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIAgentsSection;
