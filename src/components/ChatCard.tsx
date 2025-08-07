import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, Settings, Zap, Loader2, RefreshCcw } from "lucide-react";
import { toast } from 'sonner';
import { YusrAIStructuredResponse, parseYusrAIStructuredResponse } from '@/utils/jsonParser';
import FixedPlatformButtons from './FixedPlatformButtons';
import { PlatformPersistenceManager } from '@/utils/platformPersistenceManager';
import { DataFlowValidator } from '@/utils/dataFlowValidator';

interface ChatCardProps {
  response: string;
  onRetry: () => void;
  isLoading: boolean;
  onExecuteAutomation: (blueprint: any) => void;
  isExecuting: boolean;
  automationId?: string;
}

const ChatCard = ({ 
  response, 
  onRetry, 
  isLoading, 
  onExecuteAutomation, 
  isExecuting, 
  automationId 
}: ChatCardProps) => {
  const [parsedResult, setParsedResult] = useState({
    structuredData: null as any,
    metadata: null as any,
    platformNames: [] as string[],
    isPlainText: false
  });
  const [executionBlueprint, setExecutionBlueprint] = useState<any>(null);

  useEffect(() => {
    if (response) {
      const parsed = parseYusrAIStructuredResponse(response);
      setParsedResult(parsed);
      setExecutionBlueprint(parsed.structuredData?.execution_blueprint);
    }
  }, [response]);

  // CRITICAL FIX: Extract and save platform data with persistence
  const extractAndSavePlatformData = useCallback((structuredData: YusrAIStructuredResponse) => {
    if (!structuredData || !automationId) return [];

    console.log('🔍 COMPREHENSIVE: Extracting platform data with persistence');
    
    // Validate the structured data first
    const validation = DataFlowValidator.validateChatAIResponse(structuredData, 'ChatCard Platform Extraction');
    if (!validation.isValid) {
      console.warn('ChatAI response validation issues:', validation.issues);
    }

    let platforms: any[] = [];

    // CRITICAL FIX: Extract from multiple possible locations with complete ChatAI data
    if (structuredData.platforms_and_credentials && Array.isArray(structuredData.platforms_and_credentials)) {
      console.log('✅ Found platforms_and_credentials array with', structuredData.platforms_and_credentials.length, 'platforms');
      
      platforms = structuredData.platforms_and_credentials.map((item: any, index: number) => {
        const platform = {
          name: item.platform || item.name || `Platform_${index}`,
          credentials: item.credentials || [
            {
              field: 'api_key',
              placeholder: `Enter ${item.platform || 'platform'} API key`,
              link: item.documentation_link || '#',
              why_needed: `Required for ${item.platform || 'platform'} integration`
            }
          ],
          // CRITICAL: Preserve ALL ChatAI data
          testConfig: item.testConfig || item.test_config,
          test_payloads: item.test_payloads || item.testPayloads,
          chatai_data: {
            original_item: item,
            extracted_from: 'platforms_and_credentials',
            has_test_config: !!(item.testConfig || item.test_config),
            has_test_payloads: !!(item.test_payloads || item.testPayloads),
            chatai_provided: true
          }
        };

        console.log(`✅ Extracted platform ${platform.name} with ChatAI data:`, {
          testConfig: !!platform.testConfig,
          test_payloads: platform.test_payloads?.length || 0,
          credentials: platform.credentials.length
        });

        return platform;
      });
    }

    // Also check required_platforms if available
    if (structuredData.required_platforms && Array.isArray(structuredData.required_platforms)) {
      console.log('✅ Found required_platforms array with', structuredData.required_platforms.length, 'platforms');
      
      structuredData.required_platforms.forEach((item: any, index: number) => {
        const existingPlatform = platforms.find(p => p.name === (item.platform || item.name));
        if (!existingPlatform) {
          const platform = {
            name: item.platform || item.name || `RequiredPlatform_${index}`,
            credentials: item.credentials || [
              {
                field: 'api_key',
                placeholder: `Enter ${item.platform || 'platform'} API key`,
                link: item.documentation_link || '#',
                why_needed: `Required for ${item.platform || 'platform'} integration`
              }
            ],
            testConfig: item.testConfig || item.test_config,
            test_payloads: item.test_payloads || item.testPayloads,
            chatai_data: {
              original_item: item,
              extracted_from: 'required_platforms',
              has_test_config: !!(item.testConfig || item.test_config),
              has_test_payloads: !!(item.test_payloads || item.testPayloads),
              chatai_provided: true
            }
          };
          platforms.push(platform);
        }
      });
    }

    // CRITICAL FIX: Save platform data immediately for persistence across refreshes
    if (platforms.length > 0 && automationId) {
      console.log(`💾 Saving ${platforms.length} platforms with ChatAI data to persistence`);
      PlatformPersistenceManager.saveAllPlatformsData(automationId, platforms);
    }

    // Log the data transformation
    DataFlowValidator.logDataTransformation(
      'Platform Data Extraction',
      { 
        platforms_and_credentials: structuredData.platforms_and_credentials?.length || 0,
        required_platforms: structuredData.required_platforms?.length || 0
      },
      { extracted_platforms: platforms.length },
      'ChatAI response to platform objects'
    );

    return platforms;
  }, [automationId]);

  // CRITICAL FIX: Enhanced agent data extraction
  const extractAgentData = useCallback((structuredData: YusrAIStructuredResponse) => {
    console.log('🔍 ENHANCED: Extracting agent data from ChatAI response');
    
    // Check multiple possible locations for agents
    const agentsData = structuredData.ai_agents || 
                      structuredData.agents || 
                      structuredData.automation_agents ||
                      [];

    console.log('✅ Agent extraction result:', {
      ai_agents: !!structuredData.ai_agents,
      agents: !!structuredData.agents,
      automation_agents: !!structuredData.automation_agents,
      final_count: Array.isArray(agentsData) ? agentsData.length : 0
    });

    return Array.isArray(agentsData) ? agentsData : [];
  }, []);

  const handleExecuteAutomation = () => {
    if (executionBlueprint) {
      onExecuteAutomation(executionBlueprint);
    } else {
      toast.error("No execution blueprint available.");
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg animate-pulse">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-semibold">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Please wait while the AI is processing your request.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (parsedResult.isPlainText) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-semibold">
            AI Response
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onRetry} disabled={isLoading}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {response}
          </p>
        </CardContent>
      </Card>
    );
  }

  const { structuredData, metadata } = parsedResult;
  const platforms = extractAndSavePlatformData(structuredData);
  const agents = extractAgentData(structuredData);

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      {structuredData?.summary && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Bot className="w-5 h-5" />
              Summary
              {metadata?.yusraiPowered && (
                <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-700">
                  YusrAI Powered
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-700">{structuredData.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Step-by-Step Explanation Section */}
      {structuredData?.step_by_step_explanation && structuredData.step_by_step_explanation.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Bot className="w-5 h-5" />
              Step-by-Step Explanation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal pl-5 space-y-2">
              {structuredData.step_by_step_explanation.map((step: string, index: number) => (
                <li key={index} className="text-sm text-blue-700">{step}</li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* FIXED: AI Agents Section */}
      {agents && agents.length > 0 && (
        <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Bot className="w-5 h-5" />
              AI Agents ({agents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {agents.map((agent: any, index: number) => (
                <div key={index} className="bg-white/70 rounded-xl p-4 border border-orange-200/50">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Bot className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-orange-900 mb-1">
                        {agent.name || agent.role || `Agent ${index + 1}`}
                      </h4>
                      {agent.description && (
                        <p className="text-sm text-orange-700 mb-2">{agent.description}</p>
                      )}
                      {agent.capabilities && Array.isArray(agent.capabilities) && (
                        <div className="flex flex-wrap gap-1">
                          {agent.capabilities.map((capability: string, capIndex: number) => (
                            <Badge key={capIndex} variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                              {capability}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platform Credentials Section with complete ChatAI data */}
      {platforms && platforms.length > 0 && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Settings className="w-5 h-5" />
              Platform Credentials ({platforms.length})
              <Badge variant="secondary" className="ml-auto bg-green-100 text-green-700">
                <Zap className="w-3 h-3 mr-1" />
                ChatAI Enhanced
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FixedPlatformButtons
              platforms={platforms}
              automationId={automationId || ''}
              onCredentialChange={() => {
                console.log('🔄 Credentials changed, platform data persisted');
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Execute Automation Button */}
      {executionBlueprint && (
        <Button
          variant="default"
          size="lg"
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          onClick={handleExecuteAutomation}
          disabled={isExecuting}
        >
          {isExecuting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Executing Automation...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Execute Automation
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default ChatCard;
