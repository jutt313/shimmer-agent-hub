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

interface Automation {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  automation_blueprint: AutomationBlueprint | null;
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

  useEffect(() => {
    if (!user || !id) {
      navigate("/auth");
      return;
    }
    fetchAutomationAndChats();
  }, [user, id, navigate]);

  const fetchAutomationAndChats = async () => {
    try {
      // Fetch automation details
      const { data, error: automationError } = await supabase
        .from('automations')
        .select('*')
        .eq('id', id)
        .single();

      if (automationError) throw automationError;

      const automationData: Automation = {
        ...data,
        automation_blueprint: data.automation_blueprint as AutomationBlueprint | null
      };

      setAutomation(automationData);

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

      // Create display text from structured data
      if (structuredData && structuredData.summary) {
        aiResponseText = structuredData.summary;
        if (structuredData.steps && structuredData.steps.length > 0) {
          aiResponseText += "\n\nSteps:\n" + structuredData.steps.map((step: string, i: number) => `${i + 1}. ${step}`).join('\n');
        }
      } else {
        aiResponseText = "I'm sorry, I couldn't process your request properly.";
        structuredData = null;
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

      // Update automation blueprint if available
      if (structuredData?.automation_blueprint) {
        console.log('🔧 Updating automation blueprint');
        const { error: updateError } = await supabase
          .from('automations')
          .update({ automation_blueprint: structuredData.automation_blueprint })
          .eq('id', automation.id);

        if (!updateError) {
          setAutomation(prev => ({
            ...prev!,
            automation_blueprint: structuredData.automation_blueprint
          }));
          toast({
            title: "Blueprint Updated",
            description: "Automation blueprint has been updated.",
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
      <div className="sticky top-0 z-20 flex justify-between items-center mx-6 py-4 mb-6">
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

        {/* Center - Main Navigation */}
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
          >
            <Code2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Right side - spacer for balance */}
        <div className="w-32"></div>
      </div>
      
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 relative">        
        {/* Main Content Area with proper height management */}
        <div className="relative">
          {/* Chat Card - with proper height */}
          <div className={`transition-transform duration-500 ease-in-out ${showDashboard || showDiagram ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'} ${showDashboard || showDiagram ? 'absolute' : 'relative'} w-full`}>
            <div style={{ height: '65vh' }}>
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
          
          {/* Dashboard Card - with full height */}
          <div className={`transition-transform duration-500 ease-in-out ${showDashboard ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'} ${showDashboard ? 'relative' : 'absolute'} w-full`}>
            {showDashboard && (
              <div style={{ height: '65vh' }}>
                <AutomationDashboard
                  automationId={automation.id}
                  automationTitle={automation.title}
                  automationBlueprint={automation.automation_blueprint}
                  onClose={() => setShowDashboard(false)}
                />
              </div>
            )}
          </div>

          {/* Diagram Card - with proper spacing */}
          <div className={`transition-transform duration-500 ease-in-out ${showDiagram ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'} ${showDiagram ? 'relative' : 'absolute'} w-full`}>
            {showDiagram && (
              <div style={{ height: '65vh' }}>
                <AutomationDiagramDisplay
                  automationBlueprint={automation?.automation_blueprint}
                  messages={messages}
                  onAgentAdd={handleAgentAdd}
                  onAgentDismiss={handleAgentDismiss}
                  dismissedAgents={dismissedAgents}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Platform Buttons - with proper spacing */}
        {!showDashboard && !showDiagram && currentPlatforms && currentPlatforms.length > 0 && (
          <div className="mt-4 mb-4">
            <PlatformButtons platforms={currentPlatforms} />
          </div>
        )}
        
        {/* Input Section - with proper spacing */}
        {!showDashboard && !showDiagram && (
          <div className="mt-4 mb-6">
            <div className="flex gap-4 items-end">
              <Button
                onClick={() => setShowAIAgentForm(true)}
                className="rounded-3xl bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-6 py-4 shadow-lg hover:shadow-xl transition-all duration-300 border-0 flex-shrink-0"
                style={{
                  boxShadow: '0 0 25px rgba(147, 51, 234, 0.3)'
                }}
              >
                <Bot className="w-5 h-5 mr-2" />
                AI Agent
              </Button>
              
              <div className="flex-1 relative min-w-0">
                <Input 
                  value={newMessage} 
                  onChange={e => setNewMessage(e.target.value)} 
                  onKeyPress={handleKeyPress} 
                  placeholder={sendingMessage ? "YusrAI is thinking with full context..." : "Ask about this automation..."} 
                  disabled={sendingMessage}
                  className="rounded-3xl bg-white/80 backdrop-blur-sm border-0 px-6 py-4 text-lg focus:outline-none focus:ring-0 shadow-lg w-full" 
                  style={{
                    boxShadow: '0 0 25px rgba(154, 94, 255, 0.2)'
                  }} 
                />
              </div>
              
              <Button 
                onClick={() => handleSendMessage(newMessage)}
                disabled={sendingMessage || !newMessage.trim()}
                className="rounded-3xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300 border-0 disabled:opacity-50 flex-shrink-0" 
                style={{
                  boxShadow: '0 0 30px rgba(92, 142, 246, 0.3)'
                }}
              >
                <Send className={`w-6 h-6 ${sendingMessage ? 'animate-pulse' : ''}`} />
              </Button>
            </div>
          </div>
        )}
      </div>

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
