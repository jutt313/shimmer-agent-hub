
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Save, Database } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
  platformData?: any;
}

interface KnowledgeChatProps {
  onKnowledgeUpdate: () => void;
}

const KnowledgeChat = ({ onKnowledgeUpdate }: KnowledgeChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `Hello! I'm your Knowledge Assistant. 

I can help you:
🔧 **Save Platform Data**: Just tell me about a platform and its credentials
📊 **Parse JSON Data**: Give me platform data in any format and I'll structure it
🏷️ **Organize Information**: I'll categorize and tag your data automatically
💡 **Suggest Improvements**: I'll help optimize your knowledge base

**Examples:**
- "Save Slack platform: needs bot_token, channel_id, and workspace_id"
- "Add Gmail integration with OAuth credentials"
- "Parse this platform data: [paste your data]"

What would you like to do?`,
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const parseUserMessage = (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    // Check if user wants to save platform data
    if (lowerMessage.includes('save') || lowerMessage.includes('add') || lowerMessage.includes('platform')) {
      return 'save_platform';
    }
    
    // Check if user is providing JSON data
    if (message.includes('{') && message.includes('}')) {
      return 'parse_json';
    }
    
    // Check if user is asking for help or examples
    if (lowerMessage.includes('help') || lowerMessage.includes('example') || lowerMessage.includes('how')) {
      return 'help';
    }
    
    return 'general';
  };

  const extractPlatformInfo = (message: string) => {
    const lines = message.split('\n');
    const platformData: any = {
      platform_name: '',
      credential_fields: [],
      summary: '',
      use_cases: []
    };

    // Try to extract platform name
    const platformMatch = message.match(/(?:platform|service|app)[\s:]*([a-zA-Z\s]+?)(?:\s|:|,|needs|requires)/i);
    if (platformMatch) {
      platformData.platform_name = platformMatch[1].trim();
    }

    // Extract credentials mentioned
    const credentialKeywords = ['token', 'key', 'id', 'secret', 'password', 'username', 'email', 'url', 'endpoint'];
    const foundCredentials = [];
    
    credentialKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b\\w*${keyword}\\w*\\b`, 'gi');
      const matches = message.match(regex);
      if (matches) {
        matches.forEach(match => {
          if (!foundCredentials.some(cred => cred.field === match.toLowerCase())) {
            foundCredentials.push({
              field: match.toLowerCase(),
              description: `${match} for ${platformData.platform_name} integration`,
              required: true,
              type: match.toLowerCase().includes('email') ? 'email' : 'string'
            });
          }
        });
      }
    });

    platformData.credential_fields = foundCredentials;
    platformData.summary = `${platformData.platform_name} integration for automation`;

    return platformData;
  };

  const generateBotResponse = (userMessage: string, messageType: string) => {
    switch (messageType) {
      case 'save_platform':
        const platformData = extractPlatformInfo(userMessage);
        
        if (!platformData.platform_name) {
          return {
            content: `I can see you want to save platform data, but I need more information. Please specify:

📝 **Platform Name**: What platform are you adding?
🔑 **Credentials**: What credentials does it need?

**Example**: "Add Slack platform: needs bot_token, channel_id, and workspace_id for team notifications"`,
            platformData: null
          };
        }

        return {
          content: `Great! I've extracted this platform information:

🔧 **Platform**: ${platformData.platform_name}
📋 **Credentials Found**: ${platformData.credential_fields.length > 0 
  ? platformData.credential_fields.map(c => c.field).join(', ') 
  : 'None detected'}

${platformData.credential_fields.length > 0 ? 
  `**Credential Details**:
${platformData.credential_fields.map(c => `• **${c.field}**: ${c.description}`).join('\n')}

Would you like me to save this to the knowledge base? Click "Save Platform" below.` 
  : 'Please specify what credentials this platform needs.'}`,
          platformData
        };

      case 'parse_json':
        try {
          const jsonMatch = userMessage.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
              content: `📊 **JSON Parsed Successfully!**

I found this data structure:
${Object.keys(parsed).map(key => `• **${key}**: ${typeof parsed[key]} ${Array.isArray(parsed[key]) ? `(${parsed[key].length} items)` : ''}`).join('\n')}

If this is platform data, I can help you format it properly for the knowledge base. Just let me know!`,
              platformData: parsed.platform_name ? parsed : null
            };
          }
        } catch (e) {
          return {
            content: `❌ **JSON Parse Error**

The JSON format seems incorrect. Please check:
• Proper quotation marks around strings
• Correct bracket matching
• No trailing commas

**Example**:
\`\`\`json
{
  "platform_name": "Slack",
  "credentials": ["bot_token", "channel_id"]
}
\`\`\``,
            platformData: null
          };
        }
        break;

      case 'help':
        return {
          content: `🚀 **Knowledge Assistant Help**

**I can help you with:**

📝 **Adding Platforms**:
- "Add Slack: needs bot_token and channel_id"
- "Save Gmail integration with OAuth setup"

📊 **Parsing Data**:
- Paste JSON data and I'll structure it
- Extract credentials from descriptions

🏷️ **Auto-Organization**:
- I categorize data automatically
- Add relevant tags and use cases

**Quick Commands**:
• "help" - Show this help
• "examples" - Show more examples
• "save [platform]" - Add platform data

What would you like to do?`,
          platformData: null
        };

      default:
        return {
          content: `I'm here to help with your knowledge base! Try:

• **"Add [Platform Name] with [credentials]"** to save platform data
• **Paste JSON data** for me to parse and structure
• **"help"** for more assistance options

What would you like to work on?`,
          platformData: null
        };
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Process the message
    const messageType = parseUserMessage(input);
    const response = generateBotResponse(input, messageType);

    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        isBot: true,
        timestamp: new Date(),
        platformData: response.platformData
      };

      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleSavePlatform = async (platformData: any) => {
    try {
      const { error } = await supabase
        .from('universal_knowledge_store')
        .insert({
          category: 'platform_knowledge',
          title: `${platformData.platform_name} Integration`,
          summary: platformData.summary || `${platformData.platform_name} integration for automation`,
          platform_name: platformData.platform_name,
          credential_fields: platformData.credential_fields || [],
          platform_description: platformData.platform_description || `${platformData.platform_name} platform integration`,
          use_cases: platformData.use_cases || ['automation', 'integration'],
          details: {
            credential_count: platformData.credential_fields?.length || 0,
            integration_type: 'API',
            saved_via: 'chat_assistant',
            saved_at: new Date().toISOString()
          },
          tags: [platformData.platform_name.toLowerCase().replace(/\s+/g, '-'), 'platform', 'integration'],
          priority: 4,
          source_type: 'chat'
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: `${platformData.platform_name} platform saved successfully`,
      });

      // Add confirmation message
      const confirmMessage: Message = {
        id: Date.now().toString(),
        content: `✅ **Platform Saved Successfully!**

${platformData.platform_name} has been added to your knowledge base with ${platformData.credential_fields?.length || 0} credential fields.

Ready for the next platform! What else would you like to add?`,
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, confirmMessage]);
      onKnowledgeUpdate();

    } catch (error) {
      console.error('Error saving platform:', error);
      toast({
        title: "Error",
        description: "Failed to save platform data",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="h-full flex flex-col bg-white/80">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="h-5 w-5 text-blue-600" />
          Knowledge Assistant
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] ${message.isBot ? 'bg-blue-50 border-blue-200' : 'bg-gray-100 border-gray-200'} rounded-lg p-3 border`}>
                  <div className="flex items-start gap-2">
                    {message.isBot ? (
                      <Bot className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <User className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                      
                      {/* Show platform data save button if available */}
                      {message.platformData && message.platformData.platform_name && (
                        <div className="mt-3 p-2 bg-white rounded border">
                          <div className="text-xs text-gray-600 mb-2">
                            <Database className="h-3 w-3 inline mr-1" />
                            Platform Data Ready
                          </div>
                          <Button
                            onClick={() => handleSavePlatform(message.platformData)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Save className="h-3 w-3 mr-1" />
                            Save Platform
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-blue-50 border-blue-200 rounded-lg p-3 border">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-blue-600" />
                    <div className="text-sm text-gray-600">Thinking...</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe a platform, paste JSON data, or ask for help..."
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              disabled={isLoading}
              className="text-sm"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={isLoading || !input.trim()}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KnowledgeChat;
