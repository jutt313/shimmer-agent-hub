
import React, { useState, useEffect } from 'react';
import { GitBranch, Plus, ArrowRight, Settings, Zap } from 'lucide-react';

const DiagramBuilderSection = () => {
  const [animationStep, setAnimationStep] = useState(0);

  const diagramSteps = [
    { id: 'trigger', label: 'Email Received', type: 'trigger', x: 50, y: 200 },
    { id: 'condition', label: 'Priority Check', type: 'condition', x: 250, y: 200 },
    { id: 'action1', label: 'Notify Team', type: 'action', x: 450, y: 150 },
    { id: 'action2', label: 'Create Task', type: 'action', x: 450, y: 250 },
    { id: 'ai', label: 'AI Response', type: 'ai', x: 650, y: 200 }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationStep(prev => (prev + 1) % (diagramSteps.length + 1));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

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
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transform complex business logic into beautiful, interactive diagrams. 
            Build, test, and optimize your automations visually.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Interactive Diagram */}
          <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-200 overflow-hidden">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Email Processing Workflow</h3>
              <p className="text-gray-600">Watch the automation build itself</p>
            </div>

            {/* Diagram Canvas */}
            <div className="relative h-80 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl overflow-hidden">
              {/* Grid Background */}
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}></div>

              {/* Nodes */}
              {diagramSteps.map((step, index) => {
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
                    <div className={`px-4 py-2 rounded-xl border-2 text-sm font-medium ${
                      step.type === 'trigger' ? 'bg-green-100 border-green-300 text-green-800' :
                      step.type === 'condition' ? 'bg-yellow-100 border-yellow-300 text-yellow-800' :
                      step.type === 'action' ? 'bg-blue-100 border-blue-300 text-blue-800' :
                      'bg-purple-100 border-purple-300 text-purple-800'
                    }`}>
                      {step.label}
                    </div>
                  </div>
                );
              })}

              {/* Connections */}
              {diagramSteps.slice(0, animationStep - 1).map((step, index) => {
                const nextStep = diagramSteps[index + 1];
                if (!nextStep) return null;

                return (
                  <svg
                    key={`connection-${index}`}
                    className="absolute inset-0 pointer-events-none"
                    style={{ zIndex: 1 }}
                  >
                    <line
                      x1={step.x}
                      y1={step.y}
                      x2={nextStep.x}
                      y2={nextStep.y}
                      stroke="#8b5cf6"
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
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Settings className="w-4 h-4 text-purple-600 animate-spin" />
                    <span className="text-gray-700">
                      {animationStep === 0 ? 'Ready to build...' :
                       animationStep <= diagramSteps.length ? `Building step ${animationStep}/${diagramSteps.length}` :
                       'Workflow complete! 🎉'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <GitBranch className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Drag & Drop Builder
                  </h3>
                  <p className="text-gray-600">
                    Intuitive visual interface makes complex workflow creation as easy as drawing a flowchart.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Real-time Testing
                  </h3>
                  <p className="text-gray-600">
                    Test each step as you build. See data flow through your automation in real-time.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Smart Suggestions
                  </h3>
                  <p className="text-gray-600">
                    AI recommends next steps, optimizations, and error handling based on your workflow.
                  </p>
                </div>
              </div>
            </div>

            {/* Diagram Stats */}
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-6 text-white">
              <h4 className="text-lg font-semibold mb-4">Why Visual Workflows Work</h4>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">85%</div>
                  <div className="text-purple-100 text-sm">Faster Understanding</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">92%</div>
                  <div className="text-purple-100 text-sm">Fewer Errors</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DiagramBuilderSection;
