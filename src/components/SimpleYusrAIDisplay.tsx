/**
 * SIMPLE YUSRAI DISPLAY - Plain text format as requested
 * No cards, no collapsibles, no numbered steps, no green backgrounds
 * Simple headers and plain English content
 */

import React from 'react';
import { YusrAIStructuredResponse } from '@/utils/jsonParser';

interface SimpleYusrAIDisplayProps {
  data: YusrAIStructuredResponse;
  className?: string;
}

const SimpleYusrAIDisplay: React.FC<SimpleYusrAIDisplayProps> = ({ 
  data, 
  className = ""
}) => {
  console.log('🎯 Simple YusrAI Display rendering:', data);

  if (!data) {
    return (
      <div className={`text-gray-600 ${className}`}>
        Processing YusrAI automation details...
      </div>
    );
  }

  return (
    <div className={`space-y-6 text-gray-800 ${className}`}>
      {/* Summary Section */}
      {data.summary && (
        <div>
          <h3 className="font-semibold text-blue-600 mb-2">Summary</h3>
          <p className="leading-relaxed">{data.summary}</p>
        </div>
      )}

      {/* Step-by-Step Section */}
      {data.steps && data.steps.length > 0 && (
        <div>
          <h3 className="font-semibold text-green-600 mb-2">Step-by-Step</h3>
          <div className="space-y-2">
            {data.steps.map((step, index) => (
              <p key={index} className="leading-relaxed">
                {typeof step === 'string' ? step : `Step ${index + 1}`}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Platforms Section */}
      {data.platforms && data.platforms.length > 0 && (
        <div>
          <h3 className="font-semibold text-purple-600 mb-2">Platform Credentials</h3>
          <div className="space-y-3">
            {data.platforms.map((platform, index) => (
              <div key={index}>
                <p className="font-medium text-purple-700 mb-1">
                  {platform.name}
                </p>
                <div className="ml-4 space-y-1">
                  {platform.credentials && platform.credentials.map((cred, credIndex) => (
                    <p key={credIndex} className="text-sm text-gray-600">
                      {cred.field || 'API Key'}: {cred.why_needed || 'Authentication required'}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clarification Questions */}
      {data.clarification_questions && data.clarification_questions.length > 0 && (
        <div>
          <h3 className="font-semibold text-orange-600 mb-2">Clarification Questions</h3>
          <div className="space-y-2">
            {data.clarification_questions.map((question, index) => (
              <p key={index} className="leading-relaxed">
                {typeof question === 'string' ? question : `Question ${index + 1}`}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* AI Agents */}
      {data.agents && data.agents.length > 0 && (
        <div>
          <h3 className="font-semibold text-pink-600 mb-2">AI Agents</h3>
          <div className="space-y-3">
            {data.agents.map((agent, index) => (
              <div key={index}>
                <p className="font-medium text-pink-700 mb-1">
                  {agent.name} ({agent.role})
                </p>
                <div className="ml-4 space-y-1">
                  <p className="text-sm text-gray-600">
                    Rule: {agent.rule || 'Custom agent behavior'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Goal: {agent.goal || 'Process automation data'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Why needed: {agent.why_needed || 'Enhances automation intelligence'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleYusrAIDisplay;