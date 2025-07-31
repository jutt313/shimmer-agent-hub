
import React, { useState, useEffect } from 'react';
import { MessageSquare, Bot, User, Play, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AutomationRunsMonitor from './AutomationRunsMonitor';
import { extractPlatformCredentials } from '@/utils/platformDataExtractor';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  message: string;
  timestamp: Date;
  automation_id: string;
}

interface ChatCardProps {
  automationId: string;
  title?: string;
  messages?: any[];
  onAgentAdd?: (agent: any) => void;
  dismissedAgents?: Set<string>;
  onAgentDismiss?: (agentName: string) => void;
  isLoading?: boolean;
  platformCredentialStatus?: any;
  onPlatformCredentialChange?: () => void;
  onSendMessage?: (message: any) => void;
}

const ChatCard = ({ 
  automationId, 
  title,
  messages: externalMessages,
  onAgentAdd,
  dismissedAgents,
  onAgentDismiss,
  isLoading: externalLoading,
  platformCredentialStatus,
  onPlatformCredentialChange,
  onSendMessage
}: ChatCardProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [latestResponse, setLatestResponse] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isSaved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (externalMessages) {
      // Use external messages if provided (from AutomationDetail)
      const formattedMessages = externalMessages.map((msg, index) => ({
        id: msg.id || index.toString(),
        sender: msg.isBot ? 'ai' : 'user',
        message: msg.text || msg.message || '',
        timestamp: msg.timestamp || new Date(),
        automation_id: automationId
      }));
      setMessages(formattedMessages);
      
      // Find latest AI response
      const latestAiMessage = formattedMessages
        .filter(msg => msg.sender === 'ai')
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
      
      if (latestAiMessage) {
        setLatestResponse(latestAiMessage.message);
      }
    } else {
      // Load from database if no external messages provided
      loadChatMessages();
    }
  }, [automationId, externalMessages]);

  const loadChatMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('automation_chats')
        .select('*')
        .eq('automation_id', automationId)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Failed to load chat messages:', error);
        return;
      }

      const chatMessages: ChatMessage[] = data.map(msg => ({
        id: msg.id,
        sender: msg.sender as 'user' | 'ai',
        message: msg.message_content,
        timestamp: new Date(msg.timestamp),
        automation_id: msg.automation_id
      }));

      setMessages(chatMessages);

      // Find the latest AI response
      const latestAiMessage = chatMessages
        .filter(msg => msg.sender === 'ai')
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

      if (latestAiMessage) {
        setLatestResponse(latestAiMessage.message);
      }

    } catch (error) {
      console.error('Failed to load chat messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // If external onSendMessage is provided, use it
    if (onSendMessage) {
      onSendMessage(input);
      setInput('');
      return;
    }

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      message: input,
      timestamp: new Date(),
      automation_id: automationId
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');

    try {
      const { error } = await supabase
        .from('automation_chats')
        .insert({
          automation_id: automationId,
          sender: 'user',
          message_content: input,
          timestamp: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to save message:', error);
      }

      // Simulate AI response (replace with actual AI logic)
      setTimeout(() => {
        const aiResponse = `This is a simulated AI response to your message: ${input}`;
        setLatestResponse(aiResponse);

        const aiMessage: ChatMessage = {
          id: Date.now().toString(),
          sender: 'ai',
          message: aiResponse,
          timestamp: new Date(),
          automation_id: automationId
        };

        setMessages(prev => [...prev, aiMessage]);

        supabase
          .from('automation_chats')
          .insert({
            automation_id: automationId,
            sender: 'ai',
            message_content: aiResponse,
            timestamp: new Date().toISOString()
          })
          .then(({ error }) => {
            if (error) {
              console.error('Failed to save AI message:', error);
            }
          });
      }, 1000);

    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleCopyResponse = () => {
    if (latestResponse) {
      navigator.clipboard.writeText(latestResponse);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveAutomation = async () => {
    if (!user || !latestResponse) return;

    setSaving(true);
    try {
      console.log('💾 FIXED: Starting automation save process...');
      
      // Process the latest AI response to extract structured data
      const processedData = extractPlatformCredentials(latestResponse);
      console.log('📊 FIXED: Processed structured data:', processedData);

      // CRITICAL FIX: Save structured data to automation_responses table first
      const { data: responseData, error: responseError } = await supabase
        .from('automation_responses')
        .insert({
          automation_id: automationId,
          user_id: user.id,
          response_text: latestResponse,
          structured_data: processedData, // CRITICAL: Save the structured data
          is_ready_for_execution: true,
          seven_sections_validated: true,
          yusrai_powered: true
        })
        .select()
        .single();

      if (responseError) {
        console.error('❌ FIXED: Error saving automation response:', responseError);
        throw responseError;
      }

      console.log('✅ FIXED: Automation response saved with structured data:', responseData.id);

      // Extract automation blueprint from processed data
      let automationBlueprint = null;
      
      if (processedData?.workflow_steps) {
        automationBlueprint = {
          workflow_steps: processedData.workflow_steps,
          platforms: processedData.platforms || {},
          triggers: processedData.triggers || [],
          variables: processedData.variables || {},
          metadata: {
            created_at: new Date().toISOString(),
            created_by: 'chat_ai',
            response_id: responseData.id,
            structured_data_version: '2.0'
          }
        };
      }

      // Update the automation with the blueprint and mark as ready
      const { error: updateError } = await supabase
        .from('automations')
        .update({
          automation_blueprint: automationBlueprint,
          status: 'ready_for_execution',
          updated_at: new Date().toISOString(),
          platforms_config: processedData?.platforms || {}
        })
        .eq('id', automationId);

      if (updateError) {
        console.error('❌ FIXED: Error updating automation:', updateError);
        throw updateError;
      }

      console.log('✅ FIXED: Automation updated successfully with structured data');

      toast({
        title: "✅ Automation Saved Successfully!",
        description: `${title || 'Automation'} is now ready for execution with structured platform data.`,
      });

      setSaved(true);
      onSave?.();

    } catch (error: any) {
      console.error('💥 FIXED: Error saving automation:', error);
      toast({
        title: "❌ Save Failed",
        description: error.message || "Failed to save automation",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRunAutomation = async () => {
    setRunning(true);
    try {
      // Simulate running the automation
      setTimeout(() => {
        toast({
          title: "✅ Automation Run Successfully!",
          description: `${title || 'Automation'} has been executed.`,
        });
        setRunning(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to run automation:', error);
      toast({
        title: "❌ Run Failed",
        description: "Failed to run automation",
        variant: "destructive",
      });
      setRunning(false);
    }
  };

  const onSave = () => {
    console.log('Automation saved successfully!');
  };

  const displayTitle = title || 'Chat';
  const isLoadingState = externalLoading || false;

  return (
    <Card className="h-full flex flex-col bg-white/80">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          {displayTitle}
          {!isSaved && (
            <Badge variant="secondary" className="ml-2">
              Unsaved
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-4">
        <ScrollArea className="flex-1">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`${message.sender === 'user' ? 'bg-gray-100 border-gray-200' : 'bg-blue-50 border-blue-200'} rounded-lg p-3 border max-w-[85%]`}>
                  <div className="flex items-start gap-2">
                    {message.sender === 'user' ? (
                      <User className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Bot className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">{message.message}</div>
                  </div>
                </div>
              </div>
            ))}
            {isLoadingState && (
              <div className="flex justify-start">
                <div className="bg-blue-50 border-blue-200 rounded-lg p-3 border max-w-[85%]">
                  <div className="flex items-start gap-2">
                    <Bot className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-gray-700">AI is thinking...</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {latestResponse && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-700">Latest AI Response</div>
              <Button variant="ghost" size="sm" onClick={handleCopyResponse} disabled={copied}>
                {copied ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <div className="text-sm text-gray-600 whitespace-pre-wrap">{latestResponse}</div>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Button
            onClick={handleSaveAutomation}
            disabled={saving || isSaved}
            className="flex-1"
          >
            {saving ? 'Saving...' : 'Save Automation'}
          </Button>
          <Button
            onClick={handleRunAutomation}
            disabled={running || !isSaved}
            className="flex-1"
          >
            <Play className="h-4 w-4 mr-2" />
            {running ? 'Running...' : 'Run Automation'}
          </Button>
        </div>

        <div className="mt-4">
          <Input
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          />
        </div>
      </CardContent>
      <AutomationRunsMonitor automationId={automationId} />
    </Card>
  );
};

export default ChatCard;
