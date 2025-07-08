
import React, { useState } from 'react';
import { MessageCircle, ArrowRight, Sparkles } from 'lucide-react';

const ChatShowcaseSection = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const chatSteps = [
    {
      user: "Create an automation to sync new Shopify orders with Google Sheets and send Slack notifications",
      ai: "Perfect! I'll create a comprehensive e-commerce order management automation for you. Let me break this down into steps and build the workflow.",
      cards: [
        { title: "Shopify Integration", description: "Monitor new orders in real-time", status: "completed" },
        { title: "Google Sheets Sync", description: "Add order data to spreadsheet", status: "completed" },
        { title: "Slack Notification", description: "Alert team about new orders", status: "completed" }
      ]
    },
    {
      user: "Set up a customer support automation that categorizes emails and assigns them to the right team",
      ai: "Excellent choice! I'll create an intelligent customer support workflow that uses AI to analyze and route emails automatically.",
      cards: [
        { title: "Email Analysis", description: "AI categorizes incoming emails", status: "completed" },
        { title: "Team Assignment", description: "Route to appropriate department", status: "completed" },
        { title: "Priority Detection", description: "Flag urgent issues automatically", status: "completed" }
      ]
    }
  ];

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-purple-50/40 via-blue-50/50 to-indigo-50/40">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-6">
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Natural Language Processing</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Just Tell Us What You Need
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our AI understands natural language and builds complex automation from simple conversations. 
            Watch how easy it is to create powerful workflows.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Chat Interface */}
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                <span className="ml-auto text-sm font-medium">YusrAI Chat</span>
              </div>
            </div>
            
            <div className="p-6 h-96 overflow-y-auto space-y-4">
              {/* User Message */}
              <div className="flex justify-end">
                <div className="bg-blue-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-xs">
                  {chatSteps[currentStep].user}
                </div>
              </div>
              
              {/* AI Response with Cards */}
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 max-w-md">
                  {chatSteps[currentStep].ai}
                </div>
              </div>
              
              {/* Response Cards */}
              <div className="space-y-3 ml-2">
                {chatSteps[currentStep].cards.map((card, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{card.title}</div>
                        <div className="text-sm text-gray-600">{card.description}</div>
                      </div>
                      <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        {card.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Natural Language Processing</h3>
                  <p className="text-gray-600">Describe your workflow in plain English. Our AI understands context, intent, and complex requirements.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Intelligent Automation</h3>
                  <p className="text-gray-600">Watch as your ideas transform into working automations with visual feedback and step-by-step progress.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ArrowRight className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Real-time Feedback</h3>
                  <p className="text-gray-600">Get instant updates on your automation progress with detailed cards showing each step completion.</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => {
                setCurrentStep((prev) => (prev + 1) % chatSteps.length);
                setTimeout(() => window.location.href = '/auth', 100);
              }}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3"
            >
              Try Yourself - Start Chatting Now
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChatShowcaseSection;
