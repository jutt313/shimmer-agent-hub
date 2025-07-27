import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Lightbulb, HelpCircle, Rocket, BookOpen, Settings } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button";
import FixedPlatformButtons from './FixedPlatformButtons';
import { YusrAIStructuredResponse, parseYusrAIStructuredResponse } from '@/utils/jsonParser';
import { useAuth } from "@/contexts/AuthContext";
import { SimpleCredentialManager } from '@/utils/simpleCredentialManager';

interface ChatCardProps {
  message: string;
  isUser: boolean;
  isLoading?: boolean;
  automationId?: string;
  onCredentialChange?: () => void;
  onPlatformSeeded?: (platforms: any[]) => void;
}

interface Platform {
  name: string;
  credentials: Array<{
    field: string;
    placeholder: string;
    link: string;
    why_needed: string;
  }>;
}

interface Agent {
  name: string;
  role: string;
  rule: string;
  goal: string;
  memory: string;
  why_needed: string;
  custom_config?: any;
  test_scenarios: string[];
}

const ChatCard = ({ 
  message, 
  isUser, 
  isLoading, 
  automationId, 
  onCredentialChange,
  onPlatformSeeded 
}: ChatCardProps) => {
  const [isStructured, setIsStructured] = useState(false);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [steps, setSteps] = useState<string[]>([]);
  const [clarificationQuestions, setClarificationQuestions] = useState<string[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (message && !isUser && !isLoading) {
      console.log('🔍 ChatCard processing AI message:', message.substring(0, 200));
      
      // Parse the YusrAI structured response
      const parseResult = parseYusrAIStructuredResponse(message);
      console.log('📋 Parse result:', parseResult);
      
      if (parseResult.structuredData) {
        const data = parseResult.structuredData;
        console.log('✅ Structured data found:', data);
        
        // ENHANCED: Extract platforms from multiple possible sources
        let extractedPlatforms: Platform[] = [];
        
        // Handle direct platforms array
        if (data.platforms && Array.isArray(data.platforms)) {
          extractedPlatforms = data.platforms;
          console.log('🔗 Found platforms array:', extractedPlatforms.length);
        }
        
        // FIXED: Handle platforms_credentials structure from ChatAI
        if (data.platforms_credentials && typeof data.platforms_credentials === 'object') {
          console.log('🔧 Processing platforms_credentials structure');
          
          // Convert platforms_credentials object to platforms array
          const platformsCredentialsArray = Object.entries(data.platforms_credentials).map(([platformName, credentialData]: [string, any]) => {
            console.log(`🔍 Processing platform: ${platformName}`, credentialData);
            
            // Extract credentials array from various possible structures
            let credentials = [];
            
            if (Array.isArray(credentialData)) {
              credentials = credentialData;
            } else if (credentialData.credentials && Array.isArray(credentialData.credentials)) {
              credentials = credentialData.credentials;
            } else if (credentialData.required_credentials && Array.isArray(credentialData.required_credentials)) {
              credentials = credentialData.required_credentials;
            } else if (typeof credentialData === 'object') {
              // Convert object properties to credentials array
              credentials = Object.entries(credentialData).map(([field, details]: [string, any]) => ({
                field,
                placeholder: details.placeholder || `Enter your ${field}`,
                link: details.link || details.where_to_get || '',
                why_needed: details.why_needed || details.description || `Required for ${platformName} integration`
              }));
            }
            
            // Ensure each credential has required fields
            credentials = credentials.map((cred: any) => ({
              field: cred.field || cred.name || 'api_key',
              placeholder: cred.placeholder || `Enter your ${cred.field || 'credential'}`,
              link: cred.link || cred.where_to_get || '',
              why_needed: cred.why_needed || cred.description || `Required for ${platformName} integration`
            }));
            
            return {
              name: platformName,
              credentials: credentials
            };
          });
          
          extractedPlatforms = platformsCredentialsArray;
          console.log('✅ Converted platforms_credentials to platforms array:', extractedPlatforms.length);
        }
        
        // ENHANCED: Extract platform names from other sections if still empty
        if (extractedPlatforms.length === 0) {
          // Try to extract from execution blueprint
          if (data.execution_blueprint && data.execution_blueprint.workflow) {
            const workflowPlatforms = data.execution_blueprint.workflow
              .filter((step: any) => step.platform)
              .map((step: any) => ({
                name: step.platform,
                credentials: [{
                  field: 'api_key',
                  placeholder: `Enter your ${step.platform} API key`,
                  link: '',
                  why_needed: `Required for ${step.platform} integration`
                }]
              }));
            
            extractedPlatforms = workflowPlatforms;
            console.log('🔧 Extracted platforms from execution blueprint:', extractedPlatforms.length);
          }
          
          // Try to extract from test_payloads
          if (extractedPlatforms.length === 0 && data.test_payloads) {
            const payloadPlatforms = Object.keys(data.test_payloads).map(platformName => ({
              name: platformName,
              credentials: [{
                field: 'api_key',
                placeholder: `Enter your ${platformName} API key`,
                link: '',
                why_needed: `Required for ${platformName} integration`
              }]
            }));
            
            extractedPlatforms = payloadPlatforms;
            console.log('🧪 Extracted platforms from test_payloads:', extractedPlatforms.length);
          }
        }
        
        // Set the extracted platforms
        if (extractedPlatforms.length > 0) {
          console.log('🎯 Setting platforms:', extractedPlatforms);
          setPlatforms(extractedPlatforms);
        }
        
        // Set other structured data
        if (data.summary) setSummary(data.summary);
        if (data.steps) setSteps(data.steps);
        if (data.clarification_questions) setClarificationQuestions(data.clarification_questions);
        if (data.agents) setAgents(data.agents);
        
        setIsStructured(true);
      } else {
        console.log('📄 No structured data found, treating as plain text');
        setIsStructured(false);
      }
    }
  }, [message, isUser, isLoading]);

  const getLatestPlatforms = async () => {
    if (!automationId || !user?.id) return;

    try {
      const credentials = await SimpleCredentialManager.getAllCredentials(automationId, user.id);
      const platformNames = new Set(credentials.map(cred => cred.platform_name));
      const latestPlatforms = platforms.map(platform => ({
        ...platform,
        hasCredentials: platformNames.has(platform.name)
      }));
      return latestPlatforms;
    } catch (error) {
      console.error("Error fetching latest platforms:", error);
      return platforms;
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="text-gray-500">Loading...</div>;
    }

    if (!message) {
      return <div className="text-gray-500">No message to display.</div>;
    }

    if (isStructured) {
      return (
        <div className="space-y-4">
          {summary && (
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center space-x-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  <h4 className="text-sm font-semibold">Summary</h4>
                </div>
                <p className="text-sm text-gray-800 mt-1">{summary}</p>
              </CardContent>
            </Card>
          )}

          {steps.length > 0 && (
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center space-x-2">
                  <Rocket className="h-4 w-4 text-blue-500" />
                  <h4 className="text-sm font-semibold">Steps</h4>
                </div>
                <ul className="list-disc list-inside text-sm text-gray-800 mt-1">
                  {steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {clarificationQuestions.length > 0 && (
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center space-x-2">
                  <HelpCircle className="h-4 w-4 text-gray-500" />
                  <h4 className="text-sm font-semibold">Clarification Questions</h4>
                </div>
                <ul className="list-disc list-inside text-sm text-gray-800 mt-1">
                  {clarificationQuestions.map((question, index) => (
                    <li key={index}>{question}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {agents.length > 0 && (
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center space-x-2">
                  <Settings className="h-4 w-4 text-gray-500" />
                  <h4 className="text-sm font-semibold">AI Agents</h4>
                </div>
                <Accordion type="single" collapsible className="w-full">
                  {agents.map((agent, index) => (
                    <AccordionItem value={`agent-${index}`} key={index}>
                      <AccordionTrigger className="text-sm font-medium">{agent.name} ({agent.role})</AccordionTrigger>
                      <AccordionContent>
                        <ul className="list-disc list-inside text-sm text-gray-800 mt-1">
                          <li><strong>Rule:</strong> {agent.rule}</li>
                          <li><strong>Goal:</strong> {agent.goal}</li>
                          <li><strong>Memory:</strong> {agent.memory}</li>
                          <li><strong>Why Needed:</strong> {agent.why_needed}</li>
                          {agent.test_scenarios && agent.test_scenarios.length > 0 && (
                            <li>
                              <strong>Test Scenarios:</strong>
                              <ul className="list-inside list-decimal">
                                {agent.test_scenarios.map((scenario, i) => (
                                  <li key={i}>{scenario}</li>
                                ))}
                              </ul>
                            </li>
                          )}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}

          {platforms.length > 0 && automationId && (
            <Card>
              <CardContent className="py-4">
                <FixedPlatformButtons 
                  platforms={platforms} 
                  automationId={automationId} 
                  onCredentialChange={onCredentialChange}
                />
              </CardContent>
            </Card>
          )}
        </div>
      );
    } else {
      return <div className="text-gray-800 whitespace-pre-line">{message}</div>;
    }
  };

  return (
    <Card className={`w-full rounded-lg ${isUser ? 'bg-gray-50 border border-gray-200' : 'bg-white shadow-sm'}`}>
      <CardContent className="py-4">
        <div className="flex items-start space-x-4">
          <Avatar>
            <AvatarImage src={isUser ? "https://avatars.githubusercontent.com/u/9796244?v=4" : "/yusra-ai-logo.png"} alt={isUser ? "You" : "Yusr AI"} />
            <AvatarFallback>{isUser ? "You" : "AI"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-gray-900">{isUser ? "You" : "Yusr AI"}</p>
            {renderContent()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatCard;
