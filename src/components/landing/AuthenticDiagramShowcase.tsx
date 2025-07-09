
import React, { useState, useEffect } from 'react';
import { GitBranch, Play, Settings, Zap, ArrowRight } from 'lucide-react';

const AuthenticDiagramShowcase = () => {
  const [animationStep, setAnimationStep] = useState(0);
  const [selectedIndustry, setSelectedIndustry] = useState(0);

  const industries = [
    {
      name: 'E-commerce',
      color: 'from-blue-500 to-cyan-500',
      steps: [
        { id: 'trigger', label: '████ ████████', type: 'trigger', x: 80, y: 150 },
        { id: 'condition1', label: '██████ █████', type: 'condition', x: 220, y: 150 },
        { id: 'action1', label: '█████ ████', type: 'action', x: 360, y: 100 },
        { id: 'action2', label: '████ ██████', type: 'action', x: 360, y: 200 },
        { id: 'condition2', label: '█████ █████', type: 'condition', x: 500, y: 150 },
        { id: 'ai_agent', label: '██ █████', type: 'ai', x: 640, y: 150 }
      ]
    },
    {
      name: 'Healthcare',
      color: 'from-green-500 to-emerald-500',
      steps: [
        { id: 'trigger', label: '███████ █████', type: 'trigger', x: 80, y: 150 },
        { id: 'process1', label: '█████ ████', type: 'action', x: 220, y: 120 },
        { id: 'process2', label: '██████ █████', type: 'action', x: 220, y: 180 },
        { id: 'condition', label: '████████ █████', type: 'condition', x: 360, y: 150 },
        { id: 'notification', label: '████ ████████', type: 'action', x: 500, y: 150 },
        { id: 'ai_agent', label: '██ █████', type: 'ai', x: 640, y: 150 }
      ]
    },
    {
      name: 'Real Estate',
      color: 'from-purple-500 to-pink-500',
      steps: [
        { id: 'trigger', label: '████ ███████', type: 'trigger', x: 80, y: 150 },
        { id: 'qualify', label: '████ ████████', type: 'condition', x: 220, y: 150 },
        { id: 'crm_sync', label: '███ ████', type: 'action', x: 360, y: 100 },
        { id: 'followup', label: '██████ ████', type: 'action', x: 360, y: 200 },
        { id: 'ai_agent', label: '██ █████', type: 'ai', x: 500, y: 150 }
      ]
    }
  ];

  const currentIndustry = industries[selectedIndustry];

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationStep(prev => (prev + 1) % (currentIndustry.steps.length + 2));
    }, 1500);
    return () => clearInterval(interval);
  }, [selectedIndustry]);

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-purple-50 to-indigo-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
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
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Transform complex business logic into beautiful, interactive diagrams. 
            Build, test, and optimize your automations visually.
          </p>

          {/* Industry Selector */}
          <div className="flex justify-center gap-3 mb-8">
            {industries.map((industry, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndustry(index)}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                  selectedIndustry === index
                    ? `bg-gradient-to-r ${industry.color} text-white shadow-lg`
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {industry.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Interactive Diagram */}
          <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{currentIndustry.name} Automation</h3>
                <p className="text-gray-600">Watch the workflow build itself</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Live Building</span>
              </div>
            </div>

            {/* Diagram Canvas */}
            <div className="relative h-80 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl overflow-hidden border border-gray-100">
              {/* Grid Background */}
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}></div>

              {/* Workflow Steps */}
              {currentIndustry.steps.map((step, index) => {
                const isVisible = index < animationStep;
                const isActive = index === animationStep - 1;
                
                return (
                  <div
                    key={step.id}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${
                      isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                    } ${isActive ? 'animate-pulse' : ''}`}
                    style={{ left: step.x, top: step.y }}
                  >
                    <div className={`px-3 py-2 rounded-xl border-2 text-sm font-medium backdrop-blur-sm ${
                      step.type === 'trigger' ? 'bg-green-100/80 border-green-300 text-green-800' :
                      step.type === 'condition' ? 'bg-yellow-100/80 border-yellow-300 text-yellow-800' :
                      step.type === 'action' ? 'bg-blue-100/80 border-blue-300 text-blue-800' :
                      'bg-purple-100/80 border-purple-300 text-purple-800'
                    } ${isActive ? 'shadow-lg' : ''}`}>
                      <div className="flex items-center gap-2">
                        {step.type === 'trigger' && <Play className="w-3 h-3" />}
                        {step.type === 'condition' && <GitBranch className="w-3 h-3" />}
                        {step.type === 'action' && <Settings className="w-3 h-3" />}
                        {step.type === 'ai' && <Zap className="w-3 h-3" />}
                        <span className="blur-sm">{step.label}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Connection Lines */}
              {currentIndustry.steps.slice(0, Math.max(0, animationStep - 1)).map((step, index) => {
                const nextStep = currentIndustry.steps[index + 1];
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
                      style={{
                        filter: 'drop-shadow(0 2px 4px rgba(139, 92, 246, 0.3))'
                      }}
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
                       animationStep <= currentIndustry.steps.length ? `Building step ${animationStep}/${currentIndustry.steps.length}` :
                       'Workflow complete! Ready for deployment 🎉'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className={`bg-gradient-to-r ${currentIndustry.color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(100, (animationStep / currentIndustry.steps.length) * 100)}%` }}
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
                <div className={`w-12 h-12 bg-gradient-to-r ${currentIndustry.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <GitBranch className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Visual Workflow Building
                  </h3>
                  <p className="text-gray-600">
                    See your automation logic in beautiful, interactive diagrams. Understand complex workflows at a glance.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${currentIndustry.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Real-time Building
                  </h3>
                  <p className="text-gray-600">
                    Watch your automation build step-by-step with live progress tracking and visual feedback.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${currentIndustry.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Industry-Optimized
                  </h3>
                  <p className="text-gray-600">
                    Each workflow is optimized for your industry with pre-built templates and best practices.
                  </p>
                </div>
              </div>
            </div>

            {/* Diagram Stats */}
            <div className={`bg-gradient-to-r ${currentIndustry.color} rounded-2xl p-6 text-white`}>
              <h4 className="text-lg font-semibold mb-4">Why Visual Workflows Work</h4>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">85%</div>
                  <div className="text-white/80 text-sm">Faster Understanding</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">92%</div>
                  <div className="text-white/80 text-sm">Fewer Errors</div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => window.location.href = '/auth'}
              className={`w-full bg-gradient-to-r ${currentIndustry.color} text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 group`}
            >
              Build {currentIndustry.name} Workflow
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AuthenticDiagramShowcase;
