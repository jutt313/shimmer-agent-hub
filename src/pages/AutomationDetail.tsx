import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, ArrowLeft, Bot } from "lucide-react";
import ChatCard from "@/components/ChatCard";
import AIAgentForm from "@/components/AIAgentForm";
import PlatformButtons from "@/components/PlatformButtons";
import { AutomationBlueprint } from "@/types/automation"; // ADD THIS IMPORT

interface Automation {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  automation_blueprint: AutomationBlueprint | null; // ADD THIS FIELD
}

interface ChatMessage {
  id: string;
  sender: string;
  message_content: string;
  timestamp: string;
}

interface StructuredResponse {
  summary?: string;
  steps?: string[];
  platforms?: Array<{
    name: string;
    credentials: Array<{
      field: string;
      placeholder: string;
      link: string;
      why_needed: string;
    }>;
  }>;
  agents?: Array<{
    name: string;
    role: string;
    goal: string;
    rules: string;
    memory: string;
    why_needed: string;
  }>;
  clarification_questions?: string[];
  automation_blueprint?: AutomationBlueprint; // ADD THIS FIELD
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
  const [dismissedAgents, setDismissedAgents] = useState<Set<string>>(new Set());
  const [currentPlatforms, setCurrentPlatforms] = useState<any[]>([]);

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
      const { data: automationData, error: automationError } = await supabase
        .from('automations')
        .select('*') // 'automation_blueprint' is included with '*'
        .eq('id', id)
        .single();

      if (automationError) throw automationError;
      setAutomation(automationData);

      // Fetch chat messages for this automation
      const { data: chatData, error: chatError } = await supabase
        .from('automation_chats')
        .select('*')
        .eq('automation_id', id)
        .order('timestamp', { ascending: true });

      if (chatError) throw chatError;

      // Convert chat messages to the format expected by ChatCard
      const formattedMessages = chatData.map((chat: ChatMessage, index: number) => ({
        id: index + 1,
        text: chat.message_content,
        isBot: chat.sender === 'ai',
        timestamp: new Date(chat.timestamp)
      }));

      // Add welcome message if no chats exist
      if (formattedMessages.length === 0) {
        const welcomeMessage = {
          id: 1,
          text: `Welcome to your automation "${automationData.title}"! I'm here to help you build and customize this automation. What would you like to work on?`,
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

  const parseStructuredResponse = (responseText: string): any => {
    console.log('=== PARSING AI RESPONSE ===');
    console.log('Raw response:', responseText);
    
    try {
      // First try to find JSON wrapped in ```json code blocks
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        console.log('✅ Successfully parsed JSON from code block:', parsed);
        return parsed;
      }
      
      // Try to find JSON object in the text (look for { and })
      const jsonStart = responseText.indexOf('{');
      const jsonEnd = responseText.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        const jsonString = responseText.substring(jsonStart, jsonEnd + 1);
        console.log('Extracted JSON string:', jsonString);
        const parsed = JSON.parse(jsonString);
        console.log('✅ Successfully parsed extracted JSON:', parsed);
        return parsed;
      }
      
      // Try to parse the entire response as JSON
      const parsed = JSON.parse(responseText);
      console.log('✅ Successfully parsed entire response as JSON:', parsed);
      return parsed;
      
    } catch (error) {
      console.log('❌ JSON parsing failed:', error);
      console.log('Response text length:', responseText.length);
      console.log('Response preview:', responseText.substring(0, 200) + '...');
      return null;
    }
  };

  const formatStructuredMessage = (structuredData: StructuredResponse): string => {
    let formattedMessage = "";

    // Summary
    if (structuredData.summary) {
      formattedMessage += `Automation Summary\n\n${structuredData.summary}\n\n`;
    }

    // Steps
    if (structuredData.steps && structuredData.steps.length > 0) {
      formattedMessage += `Step-by-Step Workflow\n\n`;
      structuredData.steps.forEach((step, index) => {
        formattedMessage += `**${index + 1}.** ${step}\n\n`;
      });
    }

    // Platform information
    if (structuredData.platforms && structuredData.platforms.length > 0) {
      formattedMessage += `Required Platform Credentials\n\n`;
      structuredData.platforms.forEach(platform => {
        formattedMessage += `**${platform.name}**\n`;
        platform.credentials.forEach(cred => {
          formattedMessage += `• **${cred.field.replace(/_/g, ' ').toUpperCase()}**: ${cred.why_needed}\n`;
        });
        formattedMessage += `\n`;
      });
    }

    // Clarification questions
    if (structuredData.clarification_questions && structuredData.clarification_questions.length > 0) {
      formattedMessage += `I need some clarification:\n\n`;
      structuredData.clarification_questions.forEach((question, index) => {
        formattedMessage += `**${index + 1}.** ${question}\n\n`;
      });
    }

    return formattedMessage.trim();
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sendingMessage || !automation) return;

    const userMessage = {
      id: Date.now(),
      text: newMessage,
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
          message_content: newMessage
        });

      // Get AI response
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: { 
          message: `In the context of automation "${automation.title}": ${newMessage}`,
          messages: messages.slice(-10)
        }
      });

      if (error) throw error;

      console.log('=== RAW AI RESPONSE ===');
      console.log(data.response);

      // Try to parse structured response
      const structuredData = parseStructuredResponse(data.response);      
      let displayText = data.response;
      
      // If we have structured data, format it nicely
      if (structuredData) {
        displayText = formatStructuredMessage(structuredData);
        console.log('=== FORMATTED DISPLAY TEXT ===');
        console.log(displayText);
        
        // Update platforms immediately after parsing
        if (structuredData.platforms && Array.isArray(structuredData.platforms)) {
          console.log('✅ Setting platforms in state:', structuredData.platforms);
          setCurrentPlatforms(structuredData.platforms);
        } else {
          console.log('❌ No platforms found in structured data');
          setCurrentPlatforms([]); // Clear if no platforms are recommended
        }

        // --- NEW: Update automation_blueprint in the database if provided by AI ---
        if (structuredData.automation_blueprint) {
          console.log('✅ Updating automation blueprint in DB:', structuredData.automation_blueprint);
          const { error: updateBlueprintError } = await supabase
            .from('automations')
            .update({ automation_blueprint: structuredData.automation_blueprint })
            .eq('id', automation.id); // Use the current automation ID

          if (updateBlueprintError) {
            console.error('Error updating automation blueprint:', updateBlueprintError);
            toast({
              title: "Error",
              description: "Failed to save automation blueprint.",
              variant: "destructive",
            });
          } else {
            // Update local state to reflect the change
            setAutomation(prev => ({
              ...prev!, // prev! because automation is guaranteed not null here
              automation_blueprint: structuredData.automation_blueprint
            }));
            toast({
              title: "Blueprint Updated",
              description: "Automation blueprint has been updated.",
            });
          }
        }
        // --- END NEW ---
      }
      
      const aiMessage = {
        id: Date.now() + 1,
        text: displayText,
        isBot: true,
        timestamp: new Date(),
        structuredData: structuredData
      };

      console.log('=== FINAL AI MESSAGE OBJECT ===');
      console.log('Has structuredData:', !!aiMessage.structuredData);
      console.log('StructuredData content:', aiMessage.structuredData);

      setMessages(prev => [...prev, aiMessage]);

      // Save AI response to database
      await supabase
        .from('automation_chats')
        .insert({
          automation_id: automation.id,
          sender: 'ai',
          message_content: displayText
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
      handleSendMessage();
    }
  };

  const handleAgentAdd = (agent: any) => {
    setShowAIAgentForm(true);
    // Pre-fill form with agent data if needed
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

  console.log('Rendering platform buttons check:', {
    currentPlatforms,
    hasData: currentPlatforms && currentPlatforms.length > 0
  });

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-300/20 to-purple-300/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-purple-300/20 to-blue-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      {/* Header - Removed AI Agent button from top right */}
      <div className="absolute top-6 left-6 right-6 z-20 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => navigate("/automations")}
            className="rounded-3xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 border-0"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
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
      
      <div className="max-w-7xl mx-auto h-full flex flex-col relative z-10 pt-16">        
        {/* Chat Card - Lifted upward by reducing top padding */}
        <div className="flex-1 flex items-start justify-center pt-2 pb-4">
          <ChatCard 
            messages={messages} 
            onAgentAdd={handleAgentAdd}
            dismissedAgents={dismissedAgents}
            onAgentDismiss={handleAgentDismiss}
          />
        </div>
        
        {/* NEW: Display Automation Blueprint for debugging/verification */}
        {automation?.automation_blueprint && (
          <div className="max-w-7xl mx-auto w-full mb-4 p-6 bg-white/70 backdrop-blur-md rounded-3xl shadow-lg border-0">
            <h2 className="text-xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-4">
              Automation Blueprint (for execution)
            </h2>
            <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-xl border border-gray-200 overflow-auto max-h-80">
              <code>{JSON.stringify(automation.automation_blueprint, null, 2)}</code>
            </pre>
          </div>
        )}

        {/* Platform Buttons - Positioned between chat and input */}
        {currentPlatforms && currentPlatforms.length > 0 && (
          <div className="mb-4">
            <PlatformButtons platforms={currentPlatforms} />
          </div>
        )}
        
        {/* Input Section */}
        <div className="space-y-4 pb-6">
          <div className="flex gap-4 items-end px-[60px]">
            <Button
              onClick={() => setShowAIAgentForm(true)}
              className="rounded-3xl bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-6 py-4 shadow-lg hover:shadow-xl transition-all duration-300 border-0"
              style={{
                boxShadow: '0 0 25px rgba(147, 51, 234, 0.3)'
              }}
            >
              <Bot className="w-5 h-5 mr-2" />
              AI Agent
            </Button>
            
            <div className="flex-1 relative">
              <Input 
                value={newMessage} 
                onChange={e => setNewMessage(e.target.value)} 
                onKeyPress={handleKeyPress} 
                placeholder={sendingMessage ? "AI is thinking..." : "Ask about this automation..."} 
                disabled={sendingMessage}
                className="rounded-3xl bg-white/80 backdrop-blur-sm border-0 px-6 py-4 text-lg focus:outline-none focus:ring-0 shadow-lg" 
                style={{
                  boxShadow: '0 0 25px rgba(154, 94, 255, 0.2)'
                }} 
              />
            </div>
            
            <Button 
              onClick={handleSendMessage}
              disabled={sendingMessage || !newMessage.trim()}
              className="rounded-3xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300 border-0 disabled:opacity-50" 
              style={{
                boxShadow: '0 0 30px rgba(92, 142, 246, 0.3)'
              }}
            >
              <Send className={`w-6 h-6 ${sendingMessage ? 'animate-pulse' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* AI Agent Form Modal */}
      {showAIAgentForm && (
        <AIAgentForm onClose={() => setShowAIAgentForm(false)} />
      )}
    </div>
  );
};

export default AutomationDetail;