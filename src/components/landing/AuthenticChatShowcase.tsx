
import React, { useState } from 'react';
import { MessageCircle, ArrowRight, Send } from 'lucide-react';

const AuthenticChatShowcase = () => {
  return (
    <section id="visuals-section" className="py-20 px-6 bg-gradient-to-b from-purple-50/40 via-blue-50/50 to-indigo-50/40">
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
            Experience the power of intelligent automation through intuitive chat interface.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Single Clean Chat Interface */}
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Chat Header - Copying your exact design */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                <span className="ml-auto text-sm font-medium">YusrAI Chat</span>
              </div>
            </div>
            
            {/* Chat Interface - Copying your exact layout */}
            <div className="p-6 h-96 overflow-y-auto space-y-4">
              {/* AI Agent Button - Like your interface */}
              <div className="flex justify-start mb-4">
                <div className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  AI Agent
                </div>
              </div>

              {/* Welcome Message */}
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 max-w-md">
                  Hello! I am YusrAI, your intelligent automation assistant. How can I help you today? Just explain your automation needs, and I'll build it for you.
                </div>
              </div>
              
              {/* Example User Query */}
              <div className="flex justify-end">
                <div className="bg-blue-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-xs">
                  I need to automate lead processing from my website forms
                </div>
              </div>
              
              {/* AI Response */}
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 max-w-md">
                  Perfect! I'll create a comprehensive lead processing automation for you. Let me analyze your requirements and build the workflow.
                </div>
              </div>
              
              {/* Processing Cards */}
              <div className="space-y-3 ml-2">
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">Form Capture Setup</div>
                      <div className="text-sm text-gray-600">Monitoring website forms for new submissions</div>
                    </div>
                    <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      completed
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">Data Validation</div>
                      <div className="text-sm text-gray-600">Validating and enriching lead information</div>
                    </div>
                    <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      completed
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-spin"></div>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">CRM Integration</div>
                      <div className="text-sm text-gray-600">Connecting to your CRM system</div>
                    </div>
                    <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      processing
                    </div>
                  </div>
                </div>
              </div>

              {/* Input Bar - Copying your exact design */}
              <div className="bg-gray-50 rounded-xl p-3 mt-4 flex items-center gap-2">
                <input 
                  type="text" 
                  placeholder="Ask about this automation..."
                  className="flex-1 bg-transparent text-gray-700 placeholder-gray-500 outline-none"
                  disabled
                />
                <button className="bg-blue-500 text-white p-2 rounded-lg">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Features Explanation */}
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Natural Language Understanding</h3>
                  <p className="text-gray-600">Simply describe what you want to automate in plain English. Our AI understands context, intent, and complex business requirements instantly.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ArrowRight className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Real-time Automation Building</h3>
                  <p className="text-gray-600">Watch as your ideas transform into working automations with visual feedback, step-by-step progress, and instant deployment capabilities.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <div className="w-6 h-6 text-white font-bold">AI</div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Intelligent Process Optimization</h3>
                  <p className="text-gray-600">Our AI doesn't just build automations - it optimizes them for maximum efficiency, suggests improvements, and adapts to your changing needs.</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => window.location.href = '/auth'}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 group"
            >
              Start Building with AI Chat
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AuthenticChatShowcase;
