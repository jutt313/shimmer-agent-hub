
import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, Bot, User, Sparkles } from 'lucide-react';

const ChatShowcaseSection = () => {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const chatMessages = [
    {
      type: 'user',
      content: 'Create an automation to send follow-up emails to new leads from our website contact form',
      timestamp: '2:14 PM'
    },
    {
      type: 'bot',
      content: 'Perfect! I\'ll create a lead nurturing automation for you. This will trigger when someone fills out your contact form, then send a personalized email sequence. Let me set this up...',
      timestamp: '2:14 PM'
    },
    {
      type: 'bot',
      content: '✅ Automation created successfully!\n\n🎯 Trigger: New contact form submission\n📧 Action: Send welcome email + 3-email nurture sequence\n🤖 AI Enhancement: Personalized content based on lead source\n\nYour automation is now live and ready to convert leads!',
      timestamp: '2:15 PM'
    },
    {
      type: 'user',
      content: 'Can you also add a task to notify our sales team?',
      timestamp: '2:15 PM'
    },
    {
      type: 'bot',
      content: 'Absolutely! I\'ve added a Slack notification to your #sales channel with lead details and a task creation in your CRM. Your team will be notified instantly when high-value leads come in.',
      timestamp: '2:16 PM'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentMessage < chatMessages.length) {
        const message = chatMessages[currentMessage];
        setIsTyping(true);
        setTypingText('');
        
        let charIndex = 0;
        const typeInterval = setInterval(() => {
          if (charIndex < message.content.length) {
            setTypingText(message.content.slice(0, charIndex + 1));
            charIndex++;
          } else {
            setIsTyping(false);
            clearInterval(typeInterval);
            setTimeout(() => {
              setCurrentMessage(prev => prev + 1);
            }, 1000);
          }
        }, 30);
      } else {
        // Reset animation
        setTimeout(() => {
          setCurrentMessage(0);
          setTypingText('');
        }, 3000);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [currentMessage]);

  return (
    <section id="demo" className="py-20 px-6 bg-gradient-to-b from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-6">
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm font-medium">AI Chat Interface</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Just Tell Us
            <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              What You Need
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our AI understands natural language and builds complex automations from simple conversations. 
            Watch how easy it is to create powerful workflows.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Chat Interface Demo */}
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">YusrAI Assistant</h3>
                  <p className="text-sm text-blue-100">Online • Ready to automate</p>
                </div>
                <div className="ml-auto flex gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse delay-100"></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse delay-200"></div>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {chatMessages.slice(0, currentMessage + 1).map((message, index) => (
                <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-sm ${
                    message.type === 'user' 
                      ? 'bg-blue-500 text-white rounded-l-2xl rounded-tr-2xl' 
                      : 'bg-gray-100 text-gray-800 rounded-r-2xl rounded-tl-2xl'
                  } p-4 shadow-lg`}>
                    <div className="flex items-start gap-2 mb-2">
                      {message.type === 'bot' ? (
                        <Bot className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                      ) : (
                        <User className="w-4 h-4 text-blue-100 mt-1 flex-shrink-0" />
                      )}
                      <div className="text-xs opacity-70">{message.timestamp}</div>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                      {index === currentMessage && isTyping ? typingText : message.content}
                      {index === currentMessage && isTyping && <span className="animate-pulse">|</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3 bg-white rounded-2xl p-3 border border-gray-200">
                <input 
                  type="text" 
                  placeholder="Describe your automation needs..."
                  className="flex-1 bg-transparent outline-none text-gray-600"
                  disabled
                />
                <button className="bg-blue-500 text-white p-2 rounded-xl hover:bg-blue-600 transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Natural Language Processing
                  </h3>
                  <p className="text-gray-600">
                    Describe complex workflows in plain English. Our AI understands context, intent, and business logic.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Intelligent Automation
                  </h3>
                  <p className="text-gray-600">
                    AI automatically suggests optimizations, handles edge cases, and learns from your preferences.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Real-time Feedback
                  </h3>
                  <p className="text-gray-600">
                    Get instant previews, suggestions, and modifications as you build. No guesswork required.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
              <h4 className="text-lg font-semibold mb-2">Try It Yourself</h4>
              <p className="text-blue-100 mb-4">
                Start a conversation with our AI and see how quickly you can build automations.
              </p>
              <button className="bg-white text-blue-600 px-6 py-2 rounded-xl font-semibold hover:shadow-lg transition-all">
                Start Chatting Now →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChatShowcaseSection;
