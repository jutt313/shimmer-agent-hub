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
import { AutomationBlueprint } from "@/types/automation";
import { parseStructuredResponse, cleanDisplayText, StructuredResponse } from "@/utils/jsonParser";
import AutomationExecutionPanel from "@/components/AutomationExecutionPanel";

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

  const generateAndSaveDiagram = async (automationId: string, blueprint: AutomationBlueprint, forceRegenerate = false, userFeedback?: string) => {
    if (!blueprint || !blueprint.steps || blueprint.steps.length === 0) {
      console.warn('❌ No blueprint or steps to generate diagram for');
      toast({
        title: "No Blueprint",
        description: "Cannot generate diagram without automation steps",
        variant: "destructive",
      });
      return;
    }

    setGeneratingDiagram(true);
    
    try {
      console.log('🚀 Generating OpenAI-powered intelligent diagram for automation:', automationId);
      console.log('📊 Blueprint analysis:', {
        mainSteps: blueprint.steps.length,
        triggerType: blueprint.trigger?.type,
        conditionSteps: blueprint.steps.filter(step => step.type === 'condition').length,
        aiAgentSteps: blueprint.steps.filter(step => 
          step.type === 'ai_agent_call' || 
          (step as any).ai_recommended === true ||
          (step.ai_agent_call && (step.ai_agent_call as any).is_recommended)
        ).length,
        forceRegenerate: forceRegenerate,
        userFeedback: userFeedback ? 'provided' : 'none'
      });
      
      // Prepare the request body with user feedback if provided
      const requestBody: any = { automation_blueprint: blueprint };
      if (userFeedback && userFeedback.trim()) {
        requestBody.user_feedback = userFeedback.trim();
        console.log('🎯 Including user feedback for diagram improvement:', userFeedback.substring(0, 100));
      }
      
      // Call the OpenAI-powered diagram-generator Edge Function
      const { data, error } = await supabase.functions.invoke('diagram-generator', {
        body: requestBody,
      });

      if (error) {
        console.error('❌ Error invoking OpenAI diagram-generator:', error);
        toast({
          title: "Diagram Generation Failed",
          description: `Error from OpenAI diagram-generator: ${error.message || 'Unknown error'}`,
          variant: "destructive",
        });
        return;
      }

      if (!data) {
        console.error('❌ No data received from OpenAI diagram-generator');
        toast({
          title: "No Diagram Data",
          description: "The OpenAI diagram generator returned no data",
          variant: "destructive",
        });
        return;
      }

      // Check if there's an error in the response
      if (data.error) {
        console.error('❌ OpenAI diagram generation error:', data);
        toast({
          title: "OpenAI Diagram Generation Error",
          description: `${data.error} (Source: ${data.source || 'unknown'})`,
          variant: "destructive",
        });
        return;
      }

      if (!data.nodes || !data.edges) {
        console.error('❌ Invalid OpenAI diagram data structure received:', data);
        toast({
          title: "Invalid OpenAI Diagram Data",
          description: "Received invalid diagram structure from OpenAI",
          variant: "destructive",
        });
        return;
      }

      const nodeCount = data.nodes.length;
      const edgeCount = data.edges.length;
      const conditionNodeCount = data.nodes.filter((n: any) => n.type?.includes('condition')).length;
      const aiAgentNodeCount = data.nodes.filter((n: any) => n.data?.isRecommended).length;
      const platformNodeCount = data.nodes.filter((n: any) => n.data?.platform).length;

      console.log('✅ Generated OpenAI-powered comprehensive diagram:', {
        nodes: nodeCount,
        edges: edgeCount,
        conditionNodes: conditionNodeCount,
        aiAgentNodes: aiAgentNodeCount,
        platformNodes: platformNodeCount,
        source: data.metadata?.source || 'unknown',
        generatedAt: data.metadata?.generatedAt
      });

      // Enhanced validation for OpenAI-generated content
      const validationResults = {
        sufficientNodes: nodeCount >= Math.max(blueprint.steps.length * 0.5, 1),
        hasConnections: edgeCount > 0,
        hasIntelligentRouting: data.metadata?.routePathsTerminated > 0,
        hasAIAnalysis: data.metadata?.source === 'openai-intelligent-generator'
      };

      if (!validationResults.sufficientNodes) {
        console.warn(`⚠️ OpenAI generated fewer nodes (${nodeCount}) than expected (${blueprint.steps.length})`);
      }

      if (!validationResults.hasIntelligentRouting) {
        console.warn(`⚠️ OpenAI diagram may be missing intelligent route mapping`);
      }

      // Save the generated diagram data back to the database
      const { error: updateError } = await supabase
        .from('automations')
        .update({ automation_diagram_data: data })
        .eq('id', automationId);

      if (updateError) {
        console.error('❌ Error saving OpenAI diagram data to DB:', updateError);
        toast({
          title: "Save Failed", 
          description: "Could not save generated OpenAI diagram to database",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setAutomation(prev => ({
        ...prev!,
        automation_diagram_data: data
      }));

      console.log('✅ OpenAI-powered comprehensive diagram generated and saved successfully!');
      
      const successMessage = userFeedback 
        ? `AI improved the diagram based on your feedback with ${nodeCount} nodes and ${aiAgentNodeCount} AI recommendations!`
        : `AI created a comprehensive diagram with ${nodeCount} nodes, ${conditionNodeCount} conditions, and ${aiAgentNodeCount} AI recommendations!`;
      
      toast({
        title: "OpenAI Diagram Generated Successfully",
        description: successMessage,
      });

    } catch (err) {
      console.error('💥 Unexpected error in OpenAI diagram generation:', err);
      toast({
        title: "OpenAI Generation Error",
        description: `Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setGeneratingDiagram(false);
    }
  };

  const fetchAutomationAndChats = async () => {
    try {
      // Fetch automation details including the new diagram data
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

      // Generate diagram if blueprint exists but no diagram data
      if (automationData.automation_blueprint && !automationData.automation_diagram_data) {
        console.log('🔄 No diagram data found, generating new diagram...');
        generateAndSaveDiagram(automationData.id, automationData.automation_blueprint);
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
        
        // Parse structured data from AI messages using new parser
        if (chat.sender === 'ai') {
          structuredData = parseStructuredResponse(chat.message_content);
          console.log('📦 Extracted structured data from stored message:', !!structuredData);
        }

        return {
          id: index + 1,
          text: chat.message_content,
          isBot: chat.sender === 'ai',
          timestamp: new Date(chat.timestamp),
          structuredData
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
      console.log('🚀 Sending message with full conversation context:', messageText.substring(0, 50));

      // Save user message to database
      await supabase
        .from('automation_chats')
        .insert({
          automation_id: automation.id,
          sender: 'user',
          message_content: messageText
        });

      // Prepare automation context for AI
      const automationContext = {
        id: automation.id,
        title: automation.title,
        description: automation.description,
        status: automation.status,
        automation_blueprint: automation.automation_blueprint
      };

      // Call the chat-ai function with FULL conversation context
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          message: messageText,
          messages: messages,
          automationId: automation.id,
          automationContext: automationContext
        }
      });

      if (error) {
        console.error('❌ Supabase function error:', error);
        throw error;
      }

      console.log('✅ Received response from chat-ai function');

      // The response is now already a parsed object (no double wrapping)
      let structuredData = data;
      let aiResponseText = "";

      // Enhanced display text creation from structured data
      if (structuredData) {
        console.log('📋 Processing structured data:', Object.keys(structuredData));
        
        // Handle clarification questions
        if (structuredData.clarification_questions && Array.isArray(structuredData.clarification_questions) && structuredData.clarification_questions.length > 0) {
          aiResponseText = "I need some clarification to provide the best solution:\n\n" + 
            structuredData.clarification_questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n');
        }
        // Handle responses with summary
        else if (structuredData.summary && structuredData.summary.trim() !== '') {
          aiResponseText = structuredData.summary;
          if (structuredData.steps && structuredData.steps.length > 0) {
            aiResponseText += "\n\nSteps:\n" + structuredData.steps.map((step: string, i: number) => `${i + 1}. ${step}`).join('\n');
          }
        }
        // Handle responses with steps but no summary
        else if (structuredData.steps && Array.isArray(structuredData.steps) && structuredData.steps.length > 0) {
          aiResponseText = "I've created a comprehensive automation plan with " + structuredData.steps.length + " detailed steps:\n\n" +
            structuredData.steps.map((step: string, i: number) => `${i + 1}. ${step}`).join('\n');
        }
        // Handle responses with platforms but no summary
        else if (structuredData.platforms && Array.isArray(structuredData.platforms) && structuredData.platforms.length > 0) {
          const platformNames = structuredData.platforms.map((p: any) => p.name).join(', ');
          aiResponseText = `I've identified the platforms you'll need: ${platformNames}. Let me set up the complete automation workflow.`;
        }
        // Handle any other structured response
        else if (typeof structuredData === 'string' && structuredData.trim() !== '') {
          aiResponseText = structuredData;
        }
        // Final fallback with helpful message
        else {
          aiResponseText = "I'm analyzing your automation requirements and will provide a complete solution with all necessary platforms and credentials.";
        }
      }
      // Handle case where no structured data is received
      else if (typeof data === 'string' && data.trim() !== '') {
        aiResponseText = data;
      }
      // Ultimate fallback
      else {
        aiResponseText = "I'm ready to help you create a comprehensive automation. Please let me know which specific platforms you'd like to integrate, and I'll provide complete setup instructions.";
      }

      const aiMessage = {
        id: Date.now() + 1,
        text: aiResponseText,
        isBot: true,
        timestamp: new Date(),
        structuredData: structuredData
      };

      console.log('📤 Adding AI message to chat');
      setMessages(prev => [...prev, aiMessage]);

      // Handle platform management
      if (structuredData) {
        // Handle platform additions
        if (structuredData.platforms && Array.isArray(structuredData.platforms)) {
          console.log('🔗 Processing platform additions:', structuredData.platforms.length);
          setCurrentPlatforms(prev => {
            const newPlatforms = [...prev];
            structuredData.platforms.forEach((platform: any) => {
              if (platform && platform.name && !newPlatforms.find(p => p.name === platform.name)) {
                newPlatforms.push(platform);
              }
            });
            return newPlatforms;
          });
        }

        // Handle platform removals
        if (structuredData.platforms_to_remove && Array.isArray(structuredData.platforms_to_remove)) {
          console.log('🗑️ Processing platform removals');
          setCurrentPlatforms(prev => 
            prev.filter(platform => !structuredData.platforms_to_remove.includes(platform.name))
          );
          
          toast({
            title: "Platforms Updated",
            description: `Removed platforms: ${structuredData.platforms_to_remove.join(', ')}`,
          });
        }
      }

      // Update automation blueprint and generate new diagram if available
      if (structuredData?.automation_blueprint) {
        console.log('🔧 Updating automation blueprint and generating new diagram');
        const { error: updateError } = await supabase
          .from('automations')
          .update({ automation_blueprint: structuredData.automation_blueprint })
          .eq('id', automation.id);

        if (!updateError) {
          const updatedAutomation = {
            ...automation,
            automation_blueprint: structuredData.automation_blueprint
          };
          setAutomation(updatedAutomation);
          
          // Generate new diagram for updated blueprint
          generateAndSaveDiagram(automation.id, structuredData.automation_blueprint);
          
          toast({
            title: "Blueprint Updated",
            description: "Automation blueprint has been updated with new AI-generated diagram.",
          });
        }
      }

      // Save AI response to database (save the structured data as JSON string)
      await supabase
        .from('automation_chats')
        .insert({
          automation_id: automation.id,
          sender: 'ai',
          message_content: JSON.stringify(structuredData)
        });

    } catch (error) {
      console.error('💥 Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble responding right now. Please try again.",
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
    if (automation) {
      const confirmationMessage = `I've successfully configured your new AI Agent: "${agentName}"!`;
      
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: confirmationMessage,
        isBot: false,
        timestamp: new Date()
      }]);

      handleSendMessage(`Please incorporate the newly configured AI Agent "${agentName}" (ID: ${agentId}) into this automation's blueprint and explain its role and impact on the workflow with full awareness of our conversation.`).then(() => {
        setNewMessage("");
      });
    }
  };

  const handleAgentAdd = (agent: any) => {
    setSelectedAgent(agent);
    setShowAIAgentForm(true);
  };

  const handleAgentDismiss = (agentName: string) => {
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

      {/* Execution Panel - Show when credentials are configured and automation has blueprint */}
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
