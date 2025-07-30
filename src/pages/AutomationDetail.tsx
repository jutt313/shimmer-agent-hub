import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ChatCard from '@/components/ChatCard';
import { Button } from "@/components/ui/button";
import { RefreshCw, Copy, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
  structuredData?: any;
}

const AutomationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [automation, setAutomation] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [platformCredentialStatus, setPlatformCredentialStatus] = useState<{ [key: string]: 'saved' | 'tested' | 'missing' }>({});
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (id && user) {
      loadAutomationData();
    }
  }, [id, user]);

  const loadAutomationData = async () => {
    if (!id || !user) return;

    try {
      setIsLoading(true);
      
      // Load automation data
      const { data: automationData, error: automationError } = await supabase
        .from('automations')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (automationError) throw automationError;
      setAutomation(automationData);

      // Load chat messages - Include automation_chats data properly
      const { data: chatData, error: chatError } = await supabase
        .from('automation_chats')
        .select('*')
        .eq('automation_id', id)
        .order('timestamp', { ascending: true });

      if (chatError) throw chatError;

      // Transform chat data to message format with structured data
      const transformedMessages: Message[] = chatData.map((chat, index) => {
        const messageObj: Message = {
          id: index + 1,
          text: chat.message_content,
          isBot: chat.sender === 'ai' || chat.sender === 'yusrai',
          timestamp: new Date(chat.timestamp)
        };

        return messageObj;
      });

      setMessages(transformedMessages);

      // Load platform credentials status
      const { data: credentialsData, error: credentialsError } = await supabase
        .from('automation_platform_credentials')
        .select('platform_name, is_tested')
        .eq('user_id', user.id)
        .eq('automation_id', id);

      if (credentialsError) throw credentialsError;

      const status: { [key: string]: 'saved' | 'tested' | 'missing' } = {};
      credentialsData.forEach(cred => {
        status[cred.platform_name] = cred.is_tested ? 'tested' : 'saved';
      });
      setPlatformCredentialStatus(status);

    } catch (error) {
      console.error('Error loading automation data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!id || !user) return;

    try {
      // Optimistically update the UI
      const newMessageObj = {
        id: messages.length + 1,
        text: message,
        isBot: false,
        timestamp: new Date()
      };
      setMessages([...messages, newMessageObj]);
      setNewMessage('');

      // Send the message to the backend
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          message: message,
          automation_id: id
        }
      });

      if (error) {
        console.error('Function invoke error:', error);
        toast({
          title: "❌ Send Failed",
          description: `Failed to send message`,
          variant: "destructive",
        });
        return;
      }

      // Refresh the chat messages
      loadAutomationData();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "❌ Send Error",
        description: `Failed to send message`,
        variant: "destructive",
      });
    }
  };

  const handlePlatformCredentialChange = () => {
    loadAutomationData();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <header className="bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">
            Automation Detail
          </h1>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadAutomationData}
              className="bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-300"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">Loading automation data...</p>
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {automation && (
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-lg font-medium">{automation.name}</CardTitle>
                <CardDescription className="text-gray-600">
                  {automation.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input type="text" id="name" defaultValue={automation.name} readOnly />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input type="text" id="description" defaultValue={automation.description} readOnly />
                  </div>
                </div>
                <div>
                  <Label htmlFor="instructions">Instructions</Label>
                  <Textarea id="instructions" defaultValue={automation.instructions} className="min-h-[80px]" readOnly />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="outline" onClick={() => navigator.clipboard.writeText(JSON.stringify(automation, null, 2)).then(() => toast({ description: "Automation data copied to clipboard." }))}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Data
                </Button>
              </CardFooter>
            </Card>
          )}

          <ChatCard
            messages={messages}
            automationId={id}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            platformCredentialStatus={platformCredentialStatus}
            onPlatformCredentialChange={handlePlatformCredentialChange}
            automationDiagramData={automation?.automation_diagram_data}
          />
        </div>
      </div>
    </div>
  );
};

export default AutomationDetail;
