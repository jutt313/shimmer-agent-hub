
import React, { useState, useEffect } from 'react';
import { GitBranch, Zap, ArrowRight, Play, Settings } from 'lucide-react';

const AuthenticDiagramShowcase = () => {
  const [animationStep, setAnimationStep] = useState(0);

  // Realistic workflow steps based on your diagram
  const workflowSteps = [
    { id: 'webhook', label: 'Webhook Trigger', type: 'trigger', x: 150, y: 150, color: 'bg-blue-100 border-blue-300 text-blue-800' },
    { id: 'validate', label: 'Validate Input', type: 'condition', x: 300, y: 150, color: 'bg-orange-100 border-orange-300 text-orange-800' },
    { id: 'enrich', label: 'Enrich Data', type: 'action', x: 450, y: 100, color: 'bg-purple-100 border-purple-300 text-purple-800' },
    { id: 'check', label: 'Check Role', type: 'condition', x: 450, y: 200, color: 'bg-yellow-100 border-yellow-300 text-yellow-800' },
    { id: 'hubspot', label: 'Create Record', type: 'action', x: 600, y: 120, color: 'bg-green-100 border-green-300 text-green-800' },
    { id: 'slack', label: 'Notify Team', type: 'action', x: 600, y: 180, color: 'bg-indigo-100 border-indigo-300 text-indigo-800' },
    { id: 'schedule', label: 'Schedule Call', type: 'action', x: 750, y: 150, color: 'bg-pink-100 border-pink-300 text-pink-800' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationStep(prev => (prev + 1) % (workflowSteps.length + 2));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-purple-50 to-indigo-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full mb-6">
            <GitBranch className="w-4 h-4" />
            <span className="text-sm font-medium">Visual Workflow Builder</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            See Your Logic
            <span className="block bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Come to Life
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transform complex business logic into beautiful, interactive diagrams. 
            Build, test, and optimize your automations with visual clarity.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Diagram Interface - Copying your exact design */}
          <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header - Like your interface */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Lead Processing Automation</h3>
                <p className="text-gray-600 text-sm">13 steps • 13 connections</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm border flex items-center gap-1">
                  <Settings className="w-3 h-3" />
                  Debug
                </button>
                <button className="px-3 py-1 bg-purple-500 text-white rounded-lg text-sm flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Regenerate
                </button>
              </div>
            </div>

            {/* Diagram Canvas - Copying your visual style */}
            <div className="relative h-80 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl overflow-hidden border border-gray-100">
              {/* Grid Background */}
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}></div>

              {/* Workflow Steps */}
              {workflowSteps.map((step, index) => {
                const isVisible = index < animationStep;
                const isActive = index === animationStep - 1;
                
                return (
                  <div
                    key={step.id}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${
                      isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                    } ${isActive ? 'animate-pulse shadow-lg' : ''}`}
                    style={{ left: step.x, top: step.y }}
                  >
                    <div className={`px-3 py-2 rounded-xl border-2 text-sm font-medium backdrop-blur-sm ${
                      step.color
                    } ${isActive ? 'shadow-lg scale-110' : ''} transition-all duration-300`}>
                      <div className="flex items-center gap-2">
                        {step.type === 'trigger' && <Play className="w-3 h-3" />}
                        {step.type === 'condition' && <GitBranch className="w-3 h-3" />}
                        {step.type === 'action' && <Settings className="w-3 h-3" />}
                        <span>{step.label}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Connection Lines */}
              {workflowSteps.slice(0, Math.max(0, animationStep - 1)).map((step, index) => {
                const nextStep = workflowSteps[index + 1];
                if (!nextStep) return null;

                return (
                  <svg
                    key={`connection-${index}`}
                    className="absolute inset-0 pointer-events-none"
                    style={{ zIndex: 1 }}
                  >
                    <defs>
                      <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
                      </linearGradient>
                    </defs>
                    <line
                      x1={step.x}
                      y1={step.y}
                      x2={nextStep.x}
                      y2={nextStep.y}
                      stroke={`url(#gradient-${index})`}
                      strokeWidth="3"
                      strokeDasharray="8,4"
                      className="animate-pulse"
                    />
                    <circle
                      cx={nextStep.x}
                      cy={nextStep.y}
                      r="4"
                      fill="#8b5cf6"
                      className="animate-ping"
                    />
                  </svg>
                );
              })}

              {/* Build Progress */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 border border-gray-200">
                  <div className="flex items-center gap-2 text-sm">
                    <Settings className="w-4 h-4 text-purple-600 animate-spin" />
                    <span className="text-gray-700">
                      {animationStep === 0 ? 'Ready to build automation...' :
                       animationStep <= workflowSteps.length ? `Building step ${animationStep}/${workflowSteps.length}` :
                       'Workflow complete! Ready for deployment'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (animationStep / workflowSteps.length) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <GitBranch className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Visual Logic Builder</h3>
                  <p className="text-gray-600">See your business logic transformed into clear, interactive diagrams. Every condition, action, and decision point is visually represented for easy understanding.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Real-time Testing</h3>
                  <p className="text-gray-600">Test your workflows in real-time with our Debug mode. Watch data flow through each step and optimize performance instantly.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Intelligent Optimization</h3>
                  <p className="text-gray-600">Our AI analyzes your workflows and suggests optimizations. Get recommendations for better performance and reduced complexity.</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => window.location.href = '/auth'}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 group"
            >
              Start Building Visually
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AuthenticDiagramShowcase;
