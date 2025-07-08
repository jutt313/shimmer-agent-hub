
import React, { useState, useEffect } from 'react';
import { Play, Plus, Settings, Zap, GitBranch, Clock } from 'lucide-react';

const AutomationCreationSection = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isBuilding, setIsBuilding] = useState(false);

  const buildingSteps = [
    { 
      title: 'Analyzing Requirements', 
      description: 'Understanding your workflow needs...',
      icon: Settings,
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      title: 'Creating Triggers', 
      description: 'Setting up event listeners...',
      icon: Play,
      color: 'from-green-500 to-emerald-500'
    },
    { 
      title: 'Building Logic', 
      description: 'Configuring conditional flows...',
      icon: GitBranch,
      color: 'from-purple-500 to-pink-500'
    },
    { 
      title: 'Adding Actions', 
      description: 'Connecting to your platforms...',
      icon: Zap,
      color: 'from-orange-500 to-red-500'
    },
    { 
      title: 'Testing & Optimization', 
      description: 'Ensuring perfect execution...',
      icon: Clock,
      color: 'from-teal-500 to-green-500'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      if (isBuilding) {
        setCurrentStep(prev => {
          if (prev < buildingSteps.length - 1) {
            return prev + 1;
          } else {
            setIsBuilding(false);
            setTimeout(() => {
              setCurrentStep(0);
              setIsBuilding(true);
            }, 2000);
            return prev;
          }
        });
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isBuilding]);

  useEffect(() => {
    setIsBuilding(true);
  }, []);

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full mb-6">
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Automation Creation</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Watch Magic
            <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Happen in Real-Time
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See how our AI transforms your ideas into fully functional automations in seconds, 
            not hours. Every step is transparent and customizable.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Real-time Builder Visualization */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-200">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Live Automation Builder
              </h3>
              <p className="text-gray-600">Building: Email Lead Nurturing Sequence</p>
            </div>

            {/* Progress Steps */}
            <div className="space-y-4">
              {buildingSteps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                
                return (
                  <div 
                    key={index}
                    className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-500 ${
                      isActive ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-purple-200' : 
                      isCompleted ? 'bg-green-50' : 'bg-gray-50'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      isActive ? `bg-gradient-to-r ${step.color}` :
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                      <StepIcon className={`w-6 h-6 ${isActive || isCompleted ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className={`font-semibold ${isActive ? 'text-purple-900' : isCompleted ? 'text-green-900' : 'text-gray-500'}`}>
                        {step.title}
                      </div>
                      <div className={`text-sm ${isActive ? 'text-purple-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                        {isActive && isBuilding ? step.description : isCompleted ? 'Completed ✓' : 'Pending...'}
                      </div>
                    </div>

                    {isActive && isBuilding && (
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-200"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Completion Status */}
            {currentStep === buildingSteps.length - 1 && (
              <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <div className="font-semibold text-green-900">Automation Ready!</div>
                    <div className="text-green-700 text-sm">Your workflow is now live and processing leads</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Features & Benefits */}
          <div className="space-y-8">
            <div className="grid gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Lightning Speed</h3>
                </div>
                <p className="text-gray-600">
                  Build complex automations in under 60 seconds. What used to take developers weeks now happens instantly.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Full Customization</h3>
                </div>
                <p className="text-gray-600">
                  Every automation is tailored to your exact needs. Modify, extend, and optimize without limits.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <GitBranch className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Smart Logic</h3>
                </div>
                <p className="text-gray-600">
                  AI handles complex decision trees, error handling, and edge cases automatically.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-6 text-white">
              <h4 className="text-xl font-bold mb-2">Ready to Build?</h4>
              <p className="text-purple-100 mb-4">
                Create your first automation in the next 2 minutes. No credit card required.
              </p>
              <button className="bg-white text-purple-600 px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all">
                Start Building Now →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AutomationCreationSection;
