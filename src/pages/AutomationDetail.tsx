import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, ArrowLeft, Bot, BarChart3, Code2 } from "lucide-react";
import ChatCard from "@/components/ChatCard";
import AutomationDashboard from "@/components/AutomationDashboard";
import AIAgentForm from "@/components/AIAgentForm";
import PlatformButtons from "@/components/PlatformButtons";
import BlueprintCard from "@/components/BlueprintCard";
import AutomationDiagramDisplay from "@/components/AutomationDiagramDisplay";
import AutomationExecuteButton from "@/components/AutomationExecuteButton";
import { AutomationBlueprint } from "@/types/automation";
import { parseStructuredResponse, parseYusrAIStructuredResponse, cleanDisplayText, StructuredResponse } from "@/utils/jsonParser";
import AutomationExecutionPanel from "@/components/AutomationExecutionPanel";
import { agentStateManager } from '@/utils/agentStateManager';
import { extractBlueprintFromStructuredData, validateBlueprintForDiagram } from '@/utils/blueprintExtractor';

interface Automation {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  automation_blueprint: AutomationBlueprint | null;
  automation_diagram_data: { nodes: any[]; edges: any[] } | null;
}

interface ChatMessage {
  id: string;
  sender: string;
  message_content: string;
  timestamp: string;
}

const AutomationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [automation, setAutomation] = useState<Automation | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showAIAgentForm, setShowAIAgentForm] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [dismissedAgents, setDismissedAgents] = useState<Set<string>>(new Set());
  const [currentPlatforms, setCurrentPlatforms] = useState<any[]>([]);
  const [showBlueprint, setShowBlueprint] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showDiagram, setShowDiagram] = useState(false);
  const [generatingDiagram, setGeneratingDiagram] = useState(false);

  useEffect(() => {
    if (!user || !id) {
      navigate("/auth");
      return;
    }
    fetchAutomationAndChats();
  }, [user, id, navigate]);

  // CRITICAL FIX: Enhanced diagram generation with proper blueprint handling
  const generateAndSaveDiagram = async (automationId: string, blueprint: AutomationBlueprint, forceRegenerate = false, userFeedback?: string) => {
    console.log('🚀 CRITICAL FIX: Starting diagram generation with properly formatted blueprint');
    
    // CRITICAL: Validate blueprint format before proceeding
    if (!validateBlueprintForDiagram(blueprint)) {
      console.error('❌ CRITICAL: Blueprint validation failed for diagram generation');
      toast({
        title: "Invalid Blueprint",
        description: "Cannot generate diagram from invalid blueprint structure",
        variant: "destructive",
      });
      return;
    }

    setGeneratingDiagram(true);
    
    try {
      console.log('📊 CRITICAL FIX: Enhanced blueprint analysis:', {
        steps: blueprint.steps?.length || 0,
        triggerType: blueprint.trigger?.type,
        hasWorkflow: blueprint.steps?.some(step => step.originalWorkflowData),
        forceRegenerate,
        userFeedback: userFeedback ? 'provided' : 'none',
        // CRITICAL: Log blueprint structure for debugging
        blueprintStructure: {
          hasSteps: !!blueprint.steps,
          stepsFormat: blueprint.steps?.[0] ? Object.keys(blueprint.steps[0]) : [],
          hasPlatforms: !!blueprint.platforms,
          hasTestPayloads: !!blueprint.test_payloads
        }
      });
      
      const requestBody: any = { 
        automation_blueprint: blueprint, // CRITICAL: Use the properly formatted blueprint
        automation_id: automationId,
        force_regenerate: forceRegenerate,
        enhanced_processing: true
      };
      
      if (userFeedback?.trim()) {
        requestBody.user_feedback = userFeedback.trim();
        requestBody.improvement_request = true;
      }
      
      // CRITICAL: Call diagram generator with properly formatted data
      const { data, error } = await supabase.functions.invoke('diagram-generator', {
        body: requestBody,
      });

      if (error) {
        console.error('❌ CRITICAL: Diagram generation error:', error);
        toast({
          title: "Diagram Generation Failed",
          description: `Error: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      // Enhanced validation of response data
      if (!data || !data.nodes || !Array.isArray(data.nodes) || data.nodes.length === 0) {
        console.error('❌ CRITICAL: Invalid diagram data received:', data);
        toast({
          title: "Invalid Diagram Data",
          description: "Received empty or invalid diagram structure",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ CRITICAL: Valid diagram data received:', {
        nodes: data.nodes.length,
        edges: data.edges?.length || 0,
        metadata: data.metadata
      });

      // Save diagram data to database with enhanced metadata
      const diagramDataToSave = {
        ...data,
        metadata: {
          ...data.metadata,
          generatedAt: new Date().toISOString(),
          source: 'enhanced-ai-generator',
          blueprintSteps: blueprint.steps?.length || 0
        }
      };

      const { error: updateError } = await supabase
        .from('automations')
        .update({ automation_diagram_data: diagramDataToSave })
        .eq('id', automationId);

      if (!updateError) {
        // Update local state immediately
        setAutomation(prev => ({
          ...prev!,
          automation_diagram_data: diagramDataToSave
        }));

        const successMessage = userFeedback 
          ? `Enhanced diagram with ${data.nodes.length} nodes based on your feedback!`
          : `Generated comprehensive diagram with ${data.nodes.length} nodes successfully!`;
        
        toast({
          title: "✅ Diagram Generated",
          description: successMessage,
        });

        console.log('🎯 CRITICAL: Diagram generation pipeline completed successfully');
      } else {
        console.error('❌ CRITICAL: Error saving diagram to database:', updateError);
        toast({
          title: "Save Failed", 
          description: "Generated diagram but failed to save to database",
          variant: "destructive",
        });
      }

    } catch (err) {
      console.error('💥 CRITICAL: Unexpected error in diagram generation:', err);
      toast({
        title: "Generation Error",
        description: `Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setGeneratingDiagram(false);
    }
  };

  const fetchAutomationAndChats = async () => {
    try {
      // Fetch automation details including the diagram data
      const { data, error: automationError } = await supabase
        .from('automations')
        .select('*, automation_diagram_data')
        .eq('id', id)
        .single();

      if (automationError) throw automationError;

      const automationData: Automation = {
        ...data,
        automation_blueprint: data.automation_blueprint as AutomationBlueprint | null,
        automation_diagram_data: data.automation_diagram_data as { nodes: any[]; edges: any[] } | null
      };

      setAutomation(automationData);

      // CRITICAL: Immediate diagram generation with the CORRECT blueprint
      if (automationData.automation_blueprint && !automationData.automation_diagram_data) {
        console.log('🔄 CRITICAL: No diagram data found, generating new diagram from blueprint...');
        // Immediate diagram generation without timeout
        await generateAndSaveDiagram(automationData.id, automationData.automation_blueprint);
      } else if (!automationData.automation_blueprint && !automationData.automation_diagram_data) {
        console.log('⚠️ No blueprint or diagram data found - waiting for AI response');
      }

      // Fetch chat messages for this automation
      const { data: chatData, error: chatError } = await supabase
        .from('automation_chats')
        .select('*')
        .eq('automation_id', id)
        .order('timestamp', { ascending: true });

      if (chatError) throw chatError;

      // Convert chat messages to the format expected by ChatCard
      const formattedMessages = chatData.map((chat: ChatMessage, index: number) => {
        console.log('🔄 Processing stored chat message:', chat.message_content.substring(0, 100));
        
        let structuredData = null;
        let yusraiPowered = false;
        let sevenSectionsValidated = false;
        
        // Parse structured data from AI messages using enhanced parser
        if (chat.sender === 'ai') {
          const parseResult = parseYusrAIStructuredResponse(chat.message_content);
          structuredData = parseResult.structuredData;
          yusraiPowered = parseResult.metadata.yusrai_powered || false;
          sevenSectionsValidated = parseResult.metadata.seven_sections_validated || false;
          
          console.log('📦 Enhanced parsing result:', {
            hasStructuredData: !!structuredData,
            yusraiPowered,
            sevenSectionsValidated
          });
        }

        return {
          id: index + 1,
          text: chat.message_content,
          isBot: chat.sender === 'ai',
          timestamp: new Date(chat.timestamp),
          structuredData,
          yusrai_powered: yusraiPowered,
          seven_sections_validated: sevenSectionsValidated
        };
      });

      // Extract platforms from any AI message that has them
      const allPlatforms: any[] = [];
      formattedMessages.forEach(msg => {
        if (msg.isBot && msg.structuredData?.platforms) {
          allPlatforms.push(...msg.structuredData.platforms);
        }
      });
      
      // Remove duplicates and set platforms
      const uniquePlatforms = allPlatforms.filter((platform, index, self) => 
        index === self.findIndex(p => p.name === platform.name)
      );
      
      if (uniquePlatforms.length > 0) {
        console.log('🔗 Setting platforms from chat history:', uniquePlatforms);
        setCurrentPlatforms(uniquePlatforms);
      }

      // Add custom welcome message instead of generic one
      if (formattedMessages.length === 0) {
        const welcomeMessage = {
          id: 1,
          text: `I am YusrAI, how can I help you to build "${automationData.title}"?`,
          isBot: true,
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
      } else {
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error fetching automation:', error);
      toast({
        title: "Error",
        description: "Failed to load automation details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || sendingMessage || !automation) return;

    const userMessage = {
      id: Date.now(),
      text: messageText,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage("");
    setSendingMessage(true);

    try {
      console.log('🚀 CRITICAL FIX: Enhanced message sending with improved pipeline');

      // Save user message to database
      await supabase
        .from('automation_chats')
        .insert({
          automation_id: automation.id,
          sender: 'user',
          message_content: messageText
        });

      // Prepare enhanced automation context
      const automationContext = {
        id: automation.id,
        title: automation.title,
        description: automation.description,
        status: automation.status,
        automation_blueprint: automation.automation_blueprint,
        existing_diagram: automation.automation_diagram_data ? 'present' : 'missing'
      };

      const agentStatusSummary = agentStateManager.getStatusSummary();

      // Call chat-ai with enhanced context
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          message: messageText,
          messages: messages,
          automationId: automation.id,
          automationContext: automationContext,
          agentStatusSummary: agentStatusSummary,
          requestDiagramGeneration: true
        }
      });

      if (error) {
        console.error('❌ CRITICAL: Chat AI error:', error);
        throw error;
      }

      console.log('✅ CRITICAL: Enhanced AI response processing');

      // Enhanced response processing
      let structuredData = null;
      let aiResponseText = "";
      let yusraiPowered = false;
      let sevenSectionsValidated = false;

      if (data && (data.response || typeof data === 'string')) {
        const responseText = data.response || (typeof data === 'string' ? data : JSON.stringify(data));
        const parseResult = parseYusrAIStructuredResponse(responseText);
        
        structuredData = parseResult.structuredData;
        yusraiPowered = parseResult.metadata.yusrai_powered || false;
        sevenSectionsValidated = parseResult.metadata.seven_sections_validated || false;
        
        console.log('📋 CRITICAL: Enhanced parsing result:', {
          hasStructuredData: !!structuredData,
          yusraiPowered,
          sevenSectionsValidated,
          hasWorkflow: !!(structuredData?.workflow),
          workflowLength: structuredData?.workflow?.length || 0,
          hasTestPayloads: !!(structuredData?.test_payloads),
          hasPlatforms: !!(structuredData?.platforms)
        });
      }

      // Enhanced display text creation
      if (structuredData) {
        if (structuredData.clarification_questions?.length > 0) {
          aiResponseText = "I need clarification:\n\n" + 
            structuredData.clarification_questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n');
        } else if (structuredData.summary?.trim()) {
          aiResponseText = structuredData.summary;
          if (structuredData.workflow?.length > 0) {
            aiResponseText += "\n\nWorkflow Steps:\n" + 
              structuredData.workflow.map((item: any, i: number) => 
                `${i + 1}. ${item.action || item.step} (${item.platform || 'System'})`
              ).join('\n');
          }
        } else if (structuredData.workflow?.length > 0) {
          aiResponseText = `Created automation with ${structuredData.workflow.length} workflow steps:\n\n` +
            structuredData.workflow.map((item: any, i: number) => 
              `${i + 1}. ${item.action || item.step} (${item.platform || 'System'})`
            ).join('\n');
        } else {
          aiResponseText = "I'm creating a comprehensive automation solution for you.";
        }
      } else {
        aiResponseText = typeof data === 'string' ? data : "I'm ready to help you build your automation.";
      }

      const aiMessage = {
        id: Date.now() + 1,
        text: aiResponseText,
        isBot: true,
        timestamp: new Date(),
        structuredData: structuredData,
        yusrai_powered: yusraiPowered,
        seven_sections_validated: sevenSectionsValidated
      };

      setMessages(prev => [...prev, aiMessage]);

      // Enhanced platform management
      if (structuredData?.platforms?.length > 0) {
        console.log('🔗 CRITICAL: Processing platform additions:', structuredData.platforms.length);
        setCurrentPlatforms(prev => {
          const newPlatforms = [...prev];
          structuredData.platforms.forEach((platform: any) => {
            if (platform?.name && !newPlatforms.find(p => p.name === platform.name)) {
              // CRITICAL: Add test payloads to platform data
              if (structuredData.test_payloads) {
                platform.test_payloads = structuredData.test_payloads.filter(
                  (payload: any) => payload.platform === platform.name
                );
              }
              newPlatforms.push(platform);
            }
          });
          return newPlatforms;
        });
      }

      // Handle platform removals
      if (structuredData?.platforms_to_remove && Array.isArray(structuredData.platforms_to_remove)) {
        console.log('🗑️ Processing platform removals');
        setCurrentPlatforms(prev => 
          prev.filter(platform => !structuredData.platforms_to_remove.includes(platform.name))
        );
        
        toast({
          title: "Platforms Updated",
          description: `Removed platforms: ${structuredData.platforms_to_remove.join(', ')}`,
        });
      }

      // Handle agent state after receiving AI response
      if (structuredData?.agents && Array.isArray(structuredData.agents)) {
        const newAgents = structuredData.agents.filter(agent => 
          !agentStateManager.hasDecisionFor(agent.name)
        );
        
        if (newAgents.length === 0 && structuredData.agents.length > 0) {
          console.log('⚠️ AI recommended already handled agents, this should not happen');
        }
      }

      // CRITICAL FIX: Enhanced blueprint extraction and IMMEDIATE diagram generation
      if (structuredData) {
        console.log('🔧 CRITICAL: Starting enhanced blueprint extraction and diagram generation');
        
        const extractedBlueprint = extractBlueprintFromStructuredData(structuredData);
        
        if (extractedBlueprint) {
          console.log('✅ CRITICAL: Successfully extracted blueprint, saving and generating diagram');
          
          // Save blueprint to database
          const { error: updateError } = await supabase
            .from('automations')
            .update({ automation_blueprint: extractedBlueprint })
            .eq('id', automation.id);

          if (!updateError) {
            // Update local state
            const updatedAutomation = {
              ...automation,
              automation_blueprint: extractedBlueprint
            };
            setAutomation(updatedAutomation);
            
            // CRITICAL FIX: Immediate diagram generation with the CORRECT blueprint
            console.log('🎯 CRITICAL: Triggering immediate diagram generation with properly formatted blueprint');
            await generateAndSaveDiagram(automation.id, extractedBlueprint);
            
            toast({
              title: "✅ Blueprint & Diagram Updated",
              description: "Automation blueprint saved and diagram generated successfully!",
            });
          } else {
            console.error('❌ CRITICAL: Error saving blueprint:', updateError);
          }
        } else {
          console.log('⚠️ CRITICAL: No valid blueprint extracted from structured data');
        }
      }

      // Save AI response to database
      const responseToSave = data.response || (typeof data === 'string' ? data : JSON.stringify(data));
      await supabase
        .from('automation_chats')
        .insert({
          automation_id: automation.id,
          sender: 'ai',
          message_content: responseToSave
        });

    } catch (error) {
      console.error('💥 CRITICAL: Error in enhanced message handling:', error);
      toast({
        title: "Error",
        description: "Failed to process message. Please try again.",
        variant: "destructive",
      });
      
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm having trouble responding. Please try again.",
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !sendingMessage) {
      handleSendMessage(newMessage);
      setNewMessage("");
    }
  };

  const handleAgentSaved = (agentName: string, agentId: string) => {
    setShowAIAgentForm(false);
    setSelectedAgent(null);
    
    // Update agent state manager
    agentStateManager.addAgent(agentName, { name: agentName, id: agentId });
    
    if (automation) {
      const confirmationMessage = `I've successfully configured your new AI Agent: "${agentName}"!`;
      
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: confirmationMessage,
        isBot: false,
        timestamp: new Date()
      }]);

      // Include agent status in the message to AI
      const agentStatusSummary = agentStateManager.getStatusSummary();
      const enhancedMessage = `Please incorporate the newly configured AI Agent "${agentName}" (ID: ${agentId}) into this automation's blueprint. ${agentStatusSummary} Please update the blueprint and explain its role and impact on the workflow.`;

      handleSendMessage(enhancedMessage).then(() => {
        setNewMessage("");
      });
    }
  };

  const handleAgentAdd = (agent: any) => {
    console.log('🤖 Adding agent from chat:', agent.name);
    agentStateManager.addAgent(agent.name, agent);
    setSelectedAgent(agent);
    setShowAIAgentForm(true);
  };

  const handleAgentDismiss = (agentName: string) => {
    console.log('❌ Dismissing agent from chat:', agentName);
    agentStateManager.dismissAgent(agentName);
    setDismissedAgents(prev => new Set([...prev, agentName]));
  };

  const handleRegenerateDiagram = (userFeedback?: string) => {
    if (automation?.automation_blueprint) {
      generateAndSaveDiagram(automation.id, automation.automation_blueprint, true, userFeedback);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading automation...</div>
      </div>
    );
  }

  if (!automation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Automation not found</h2>
          <Button onClick={() => navigate("/automations")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Automations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-300/20 to-purple-300/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-purple-300/20 to-blue-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      {/* Navigation Header with better spacing */}
      <div className="sticky top-0 z-20 flex justify-between items-center mx-6 py-4 mb-4">
        {/* Left side - Back button and automation info */}
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => navigate("/automations")}
            size="sm"
            className="rounded-full bg-white/90 hover:bg-white text-gray-700 border border-gray-200/50 shadow-lg backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="text-left">
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {automation?.title}
            </h1>
            {automation?.description && (
              <p className="text-xs text-gray-600 max-w-md truncate">{automation.description}</p>
            )}
          </div>
        </div>

        {/* Center - Main Navigation (Only 3 buttons now) */}
        <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200/50 p-1">
          <Button
            onClick={() => {
              setShowDashboard(!showDashboard);
              setShowDiagram(false);
            }}
            size="sm"
            className={`rounded-full px-4 py-2 transition-all duration-300 ${
              showDashboard 
                ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={() => {
              setShowDashboard(false);
              setShowDiagram(false);
            }}
            size="sm"
            className={`rounded-full px-4 py-2 mx-1 transition-all duration-300 ${
              !showDashboard && !showDiagram
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Bot className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={() => {
              setShowDiagram(!showDiagram);
              setShowDashboard(false);
            }}
            size="sm"
            className={`rounded-full px-4 py-2 transition-all duration-300 ${
              showDiagram 
                ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            disabled={generatingDiagram}
          >
            <Code2 className={`w-4 h-4 ${generatingDiagram ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Right side - spacer for balance */}
        <div className="w-32"></div>
      </div>
      
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 relative pb-4">        
        {/* Main Content Area - Fixed height management */}
        <div className="relative h-full">
          {/* Chat Card - Improved height calculation */}
          <div className={`transition-transform duration-500 ease-in-out ${showDashboard || showDiagram ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'} ${showDashboard || showDiagram ? 'absolute' : 'relative'} w-full`}>
            <div className="h-[calc(100vh-220px)]">
              <ChatCard 
                messages={messages} 
                onAgentAdd={handleAgentAdd}
                dismissedAgents={dismissedAgents}
                onAgentDismiss={handleAgentDismiss}
                automationId={automation.id}
                isLoading={sendingMessage}
                platformCredentialStatus={Object.fromEntries(
                  currentPlatforms.map(p => [p.name, 'saved'])
                )}
              />
            </div>
          </div>
          
          {/* Dashboard Card - Fixed height to prevent cutting */}
          <div className={`transition-transform duration-500 ease-in-out ${showDashboard ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'} ${showDashboard ? 'relative' : 'absolute'} w-full`}>
            {showDashboard && (
              <div className="h-[calc(100vh-160px)]">
                <AutomationDashboard
                  automationId={automation.id}
                  automationTitle={automation.title}
                  automationBlueprint={automation.automation_blueprint}
                />
              </div>
            )}
          </div>

          {/* Diagram Card - Fixed height */}
          <div className={`transition-transform duration-500 ease-in-out ${showDiagram ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'} ${showDiagram ? 'relative' : 'absolute'} w-full`}>
            {showDiagram && (
              <div className="h-[calc(100vh-160px)]">
                <AutomationDiagramDisplay
                  automationBlueprint={automation?.automation_blueprint}
                  automationDiagramData={automation?.automation_diagram_data}
                  messages={messages}
                  onAgentAdd={handleAgentAdd}
                  onAgentDismiss={handleAgentDismiss}
                  dismissedAgents={dismissedAgents}
                  isGenerating={generatingDiagram}
                  onRegenerateDiagram={handleRegenerateDiagram}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Platform Buttons - Now with improved credential state management */}
      {!showDashboard && !showDiagram && currentPlatforms && currentPlatforms.length > 0 && (
        <div className="px-6 pb-2">
          <PlatformButtons 
            platforms={currentPlatforms} 
            onCredentialChange={() => {
              console.log('🔄 Credential change detected in AutomationDetail');
            }}
          />
        </div>
      )}

      {/* Replace the old AutomationExecuteButton with the new AutomationExecutionPanel */}
      {!showDashboard && !showDiagram && automation?.automation_blueprint && (
        <AutomationExecutionPanel
          automationId={automation.id}
          blueprint={automation.automation_blueprint}
          title={automation.title}
        />
      )}
      
      {/* Input Section - Keep multi-line support for chat */}
      {!showDashboard && !showDiagram && (
        <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent px-6 pt-2 pb-4">
          <div className="flex gap-3 items-end">
            <Button
              onClick={() => setShowAIAgentForm(true)}
              className="rounded-3xl bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-5 py-3 shadow-lg hover:shadow-xl transition-all duration-300 border-0 flex-shrink-0"
              style={{
                boxShadow: '0 0 25px rgba(147, 51, 234, 0.3)'
              }}
            >
              <Bot className="w-4 h-4 mr-2" />
              AI Agent
            </Button>
            
            <div className="flex-1 relative min-w-0">
              <textarea
                value={newMessage} 
                onChange={e => setNewMessage(e.target.value)} 
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !sendingMessage) {
                    e.preventDefault();
                    handleSendMessage(newMessage);
                    setNewMessage("");
                  }
                }}
                placeholder={sendingMessage ? "YusrAI is thinking with full context..." : "Describe the automation you want to build..."} 
                disabled={sendingMessage}
                rows={Math.min(Math.max(newMessage.split('\n').length, 1), 4)}
                className="w-full resize-none rounded-3xl bg-white/90 backdrop-blur-sm border-0 px-5 py-3 text-base focus:outline-none focus:ring-0 shadow-lg min-h-[48px] max-h-32 overflow-y-auto" 
                style={{
                  boxShadow: '0 0 25px rgba(154, 94, 255, 0.2)'
                }} 
              />
            </div>
            
            <Button 
              onClick={() => handleSendMessage(newMessage)}
              disabled={sendingMessage || !newMessage.trim()}
              className="rounded-3xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 border-0 disabled:opacity-50 flex-shrink-0" 
              style={{
                boxShadow: '0 0 30px rgba(92, 142, 246, 0.3)'
              }}
            >
              <Send className={`w-5 h-5 ${sendingMessage ? 'animate-pulse' : ''}`} />
            </Button>
          </div>
        </div>
      )}

      {/* Blueprint Card - Right side slide-out panel */}
      {showBlueprint && automation?.automation_blueprint && (
        <BlueprintCard
          blueprint={automation.automation_blueprint}
          onClose={() => setShowBlueprint(false)}
        />
      )}

      {/* AI Agent Form Modal */}
      {showAIAgentForm && automation && (
        <AIAgentForm
          automationId={automation.id}
          onClose={() => {
            setShowAIAgentForm(false);
            setSelectedAgent(null);
          }}
          onAgentSaved={handleAgentSaved}
          initialAgentData={selectedAgent}
        />
      )}
    </div>
  );
};

export default AutomationDetail;
