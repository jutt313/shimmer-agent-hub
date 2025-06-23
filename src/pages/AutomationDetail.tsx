
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, ArrowLeft, Bot, BarChart3 } from "lucide-react";
import ChatCard from "@/components/ChatCard";
import AutomationDashboard from "@/components/AutomationDashboard";
import AIAgentForm from "@/components/AIAgentForm";
import PlatformButtons from "@/components/PlatformButtons";
import BlueprintCard from "@/components/BlueprintCard";
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

      // Extract platforms from any AI message that has them (but only accumulate unique ones)
      const allPlatforms: any[] = [];
      formattedMessages.forEach(msg => {
        if (msg.isBot && msg.structuredData?.platforms) {
          // Only add platforms if this isn't marked as an update response
          if (!msg.structuredData.is_update) {
            allPlatforms.push(...msg.structuredData.platforms);
          }
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

  const formatStructuredMessage = (structuredData: StructuredResponse): string => {
    let formattedMessage = "";

    // Summary
    if (structuredData.summary) {
      formattedMessage += `**Automation Summary**\n\n${structuredData.summary}\n\n`;
    }

    // Steps
    if (structuredData.steps && structuredData.steps.length > 0) {
      formattedMessage += `**Step-by-Step Workflow**\n\n`;
      structuredData.steps.forEach((step, index) => {
        formattedMessage += `**${index + 1}.** ${step}\n\n`;
      });
    }

    // Platform information
    if (structuredData.platforms && structuredData.platforms.length > 0) {
      formattedMessage += `**Required Platform Credentials**\n\n`;
      structuredData.platforms.forEach(platform => {
        formattedMessage += `**${platform.name}**\n`;
        platform.credentials.forEach(cred => {
          formattedMessage += `• **${cred.field.replace(/_/g, ' ').toUpperCase()}**: ${cred.why_needed}\n`;
        });
        formattedMessage += `\n`;
      });
    }

    // Agent information
    if (structuredData.agents && structuredData.agents.length > 0) {
      formattedMessage += `**Recommended AI Agents**\n\n`;
      structuredData.agents.forEach(agent => {
        formattedMessage += `**${agent.name}** - ${agent.role}\n`;
        formattedMessage += `Goal: ${agent.goal}\n`;
        formattedMessage += `Why needed: ${agent.why_needed}\n\n`;
      });
    }

    // Clarification questions
    if (structuredData.clarification_questions && structuredData.clarification_questions.length > 0) {
      formattedMessage += `**I need some clarification:**\n\n`;
      structuredData.clarification_questions.forEach((question, index) => {
        formattedMessage += `**${index + 1}.** ${question}\n\n`;
      });
    }

    return formattedMessage.trim();
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
      // Save user message to database
      await supabase
        .from('automation_chats')
        .insert({
          automation_id: automation.id,
          sender: 'user',
          message_content: messageText
        });

      // Get AI response with automation context
      const payload = {
        message: messageText,
        messages: messages.slice(-10),
        automation: automation
      };

      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: payload
      });

      if (error) throw error;

      console.log('🤖 RAW AI RESPONSE RECEIVED');
      console.log('📊 Response length:', data.response.length);

      // Parse structured response using new parser
      const structuredData = parseStructuredResponse(data.response);      
      let displayText = cleanDisplayText(data.response);
      
      // If we have structured data, format it nicely and store it
      if (structuredData) {
        console.log('✅ STRUCTURED DATA FOUND');
        console.log('🔄 Is update response:', structuredData.is_update);
        
        // Only update platforms if this is NOT an update response and has new platforms
        if (!structuredData.is_update && structuredData.platforms && Array.isArray(structuredData.platforms)) {
          console.log('🔗 Adding new platforms:', structuredData.platforms.length);
          setCurrentPlatforms(prev => {
            const newPlatforms = [...prev];
            structuredData.platforms!.forEach((platform: any) => {
              if (!newPlatforms.find(p => p.name === platform.name)) {
                newPlatforms.push(platform);
              }
            });
            return newPlatforms;
          });
        }

        // Only update automation_blueprint if provided by AI and it's a meaningful change
        if (structuredData.automation_blueprint && !structuredData.is_update) {
          console.log('🔧 Updating automation blueprint in DB');
          const { error: updateBlueprintError } = await supabase
            .from('automations')
            .update({ automation_blueprint: structuredData.automation_blueprint })
            .eq('id', automation.id);

          if (updateBlueprintError) {
            console.error('Error updating automation blueprint:', updateBlueprintError);
            toast({
              title: "Error",
              description: "Failed to save automation blueprint.",
              variant: "destructive",
            });
          } else {
            setAutomation(prev => ({
              ...prev!,
              automation_blueprint: structuredData.automation_blueprint
            }));
            setShowBlueprint(true);
            toast({
              title: "Blueprint Updated",
              description: "Automation blueprint has been updated.",
            });
          }
        } else if (structuredData.automation_blueprint && structuredData.is_update) {
          console.log('📝 Skipping blueprint update - this is an update/clarification response');
        }
      } else {
        console.log('⚠️ No structured data found, using cleaned response');
      }
      
      const aiMessage = {
        id: Date.now() + 1,
        text: data.response, // Use original response to preserve JSON structure
        isBot: true,
        timestamp: new Date(),
        structuredData: structuredData
      };

      console.log('📤 ADDING AI MESSAGE TO CHAT');
      console.log('🔧 Has structuredData:', !!aiMessage.structuredData);

      setMessages(prev => [...prev, aiMessage]);

      // Save AI response to database (save the original response to preserve structure)
      await supabase
        .from('automation_chats')
        .insert({
          automation_id: automation.id,
          sender: 'ai',
          message_content: data.response // Save original response with JSON intact
        });

    } catch (error) {
      console.error('Error sending message:', error);
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

      handleSendMessage(`Please incorporate the newly configured AI Agent "${agentName}" (ID: ${agentId}) into this automation's blueprint and explain its role and impact on the workflow.`).then(() => {
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
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-300/20 to-purple-300/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-purple-300/20 to-blue-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      {/* Header */}
      <div className="absolute top-6 left-6 right-6 z-20 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => navigate("/automations")}
            className="rounded-3xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 border-0"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <Button
            onClick={() => setShowDashboard(!showDashboard)}
            className="rounded-3xl bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 border-0"
          >
            <BarChart3 className="w-5 h-5 mr-2" />
            {showDashboard ? 'Show Chat' : 'Dashboard'}
          </Button>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {automation?.title}
            </h1>
            <p className="text-sm text-gray-600">
              Status: <span className="capitalize">{automation?.status}</span>
            </p>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto h-full flex flex-col relative z-10 pt-20">        
        {/* Main Content Area with Slide Animation - Reduced top padding */}
        <div className="flex-1 flex items-start justify-center pt-1 pb-2 relative">
          <div className={`transition-transform duration-500 ease-in-out ${showDashboard ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'} ${showDashboard ? 'absolute' : 'relative'} w-[calc(100vw-6rem)] max-w-none mx-12`}>
            <ChatCard 
              messages={messages} 
              onAgentAdd={handleAgentAdd}
              dismissedAgents={dismissedAgents}
              onAgentDismiss={handleAgentDismiss}
              automationId={automation.id}
              isLoading={sendingMessage}
            />
          </div>
          
          <div className={`transition-transform duration-500 ease-in-out ${showDashboard ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'} ${showDashboard ? 'relative' : 'absolute'}`}>
            {showDashboard && (
              <AutomationDashboard
                automationId={automation.id}
                automationTitle={automation.title}
                automationBlueprint={automation.automation_blueprint}
                onClose={() => setShowDashboard(false)}
              />
            )}
          </div>
        </div>
        
        {/* Platform Buttons - Reduced margin */}
        {!showDashboard && currentPlatforms && currentPlatforms.length > 0 && (
          <div className="mb-2 mx-12">
            <PlatformButtons platforms={currentPlatforms} />
          </div>
        )}
        
        {/* Input Section - Reduced padding and improved positioning */}
        {!showDashboard && (
          <div className="space-y-4 pb-4">
            <div className="flex gap-4 items-end px-[60px]">
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
                  placeholder={sendingMessage ? "YusrAI is building..." : "Ask about this automation..."} 
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

      {/* AI Agent Form Modal with auto-fill capability */}
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
