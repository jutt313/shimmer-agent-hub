import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, ArrowLeft, Code, LayoutDashboard, KanbanSquare, MessageSquare, Share2, Download, Image, Type, BarChart2, Settings } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ChatCard } from '@/components/ChatCard';
import { initialMessages } from '@/constants/messages';
import { useAuth } from "@/contexts/AuthContext";
import { useChatOptimization } from '@/hooks/useChatOptimization';
import { AutomationAgentManager } from '@/utils/automationAgentManager';
import { agentStateManager } from '@/utils/agentStateManager';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateDiagram } from '@/utils/diagramGenerator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { supabase } from '@/integrations/supabase/client';
import { ModernCredentialForm } from '@/components/ModernCredentialForm';
import { FixedPlatformButtons } from '@/components/FixedPlatformButtons';

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
  structuredData?: any;
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

const AutomationDetail = () => {
  const { automationId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<any>(null);
  const [automation, setAutomation] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isDiagramGenerating, setIsDiagramGenerating] = useState(false);
  const [diagramUrl, setDiagramUrl] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareableLink, setShareableLink] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [isDescriptionLoading, setIsDescriptionLoading] = useState(false);

  const { optimizeMessages, cacheMessage, getCachedMessage, clearCache, cacheSize } = useChatOptimization();

  useEffect(() => {
    if (automationId) {
      loadMessages();
      loadAutomationDetails();
    }
  }, [automationId]);

  // ENHANCED: Extract platforms from structured data with full credential details
  const extractPlatformsFromStructuredData = (structuredData: any): Platform[] => {
    console.log('🔍 Extracting platforms from structured data:', structuredData);
    
    if (!structuredData) return [];

    const platforms: Platform[] = [];

    // Extract from platforms array
    if (structuredData.platforms && Array.isArray(structuredData.platforms)) {
      structuredData.platforms.forEach((platform: any) => {
        if (typeof platform === 'string') {
          platforms.push({
            name: platform,
            credentials: [
              {
                field: 'api_key',
                placeholder: `Enter your ${platform} API key`,
                link: '#',
                why_needed: `Required to authenticate with ${platform} API`
              }
            ]
          });
        } else if (platform && platform.name) {
          platforms.push({
            name: platform.name,
            credentials: platform.credentials || [
              {
                field: 'api_key',
                placeholder: `Enter your ${platform.name} API key`,
                link: '#',
                why_needed: `Required to authenticate with ${platform.name} API`
              }
            ]
          });
        }
      });
    }

    // Extract from platforms_and_credentials
    if (structuredData.platforms_and_credentials && Array.isArray(structuredData.platforms_and_credentials)) {
      structuredData.platforms_and_credentials.forEach((platform: any) => {
        if (platform && platform.name) {
          platforms.push({
            name: platform.name,
            credentials: platform.credentials || [
              {
                field: 'api_key',
                placeholder: `Enter your ${platform.name} API key`,
                link: platform.link || '#',
                why_needed: platform.why_needed || `Required to authenticate with ${platform.name} API`
              }
            ]
          });
        }
      });
    }

    // Extract from workflow steps
    if (structuredData.workflow && Array.isArray(structuredData.workflow)) {
      structuredData.workflow.forEach((step: any) => {
        if (step.platform && !platforms.find(p => p.name === step.platform)) {
          platforms.push({
            name: step.platform,
            credentials: [
              {
                field: 'api_key',
                placeholder: `Enter your ${step.platform} API key`,
                link: '#',
                why_needed: `Required for ${step.description || 'automation step'}`
              }
            ]
          });
        }
      });
    }

    console.log('✅ Extracted platforms:', platforms);
    return platforms;
  };

  // ENHANCED: Get platforms from current response structured data
  const getCurrentPlatforms = (): Platform[] => {
    if (currentResponse?.structured_data) {
      return extractPlatformsFromStructuredData(currentResponse.structured_data);
    }
    return [];
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('automation_id', automationId)
        .order('timestamp', { ascending: true });

      if (error) {
        throw error;
      }

      const loadedMessages = data.map(msg => ({
        id: msg.id,
        text: msg.content,
        isBot: msg.sender === 'bot',
        timestamp: new Date(msg.timestamp),
        structuredData: msg.structured_data
      }));

      setMessages(loadedMessages);
    } catch (error: any) {
      console.error('Failed to load messages:', error);
      toast({
        title: "Error loading messages",
        description: error.message,
        variant: "destructive",
      });
      setMessages(initialMessages);
    }
  };

  const loadAutomationDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .eq('id', automationId)
        .single();

      if (error) {
        throw error;
      }

      setAutomation(data);
      setEditedDescription(data.description || '');
    } catch (error: any) {
      console.error('Failed to load automation details:', error);
      toast({
        title: "Error loading automation details",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    setIsLoading(true);
    const newMessage = {
      id: Date.now(),
      text: inputMessage,
      isBot: false,
      timestamp: new Date(),
      structuredData: null
    };

    setMessages(prevMessages => optimizeMessages([...prevMessages, newMessage]));
    setInputMessage('');

    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          message: inputMessage,
          automation_id: automationId,
          user_id: user?.id,
          history: messages.map(m => ({
            content: m.text,
            sender: m.isBot ? 'bot' : 'user'
          }))
        }
      });

      if (error) {
        throw error;
      }

      const botMessage = {
        id: data.message_id,
        text: data.response,
        isBot: true,
        timestamp: new Date(),
        structuredData: data.structured_data
      };

      setMessages(prevMessages => optimizeMessages([...prevMessages, botMessage]));
      setCurrentResponse(data);

      // Track agent recommendations
      if (data.structured_data?.agent_recommendations) {
        const recommendations = data.structured_data.agent_recommendations;
        for (const agentName in recommendations) {
          const agentData = recommendations[agentName];
          await AutomationAgentManager.trackAgentRecommendation(
            automationId!,
            agentName,
            agentData,
            user!.id
          );
        }
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleExecuteAutomation = async (structuredData: any) => {
    setIsExecuting(true);
    try {
      // Placeholder for automation execution logic
      console.log('Executing automation with structured data:', structuredData);
      toast({
        title: "Automation Executed",
        description: "Automation executed successfully!",
      });
    } catch (error: any) {
      console.error('Failed to execute automation:', error);
      toast({
        title: "Error executing automation",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleGenerateDiagram = async (structuredData: any) => {
    setIsDiagramGenerating(true);
    try {
      const diagram = await generateDiagram(structuredData);
      setDiagramUrl(diagram);
      toast({
        title: "Diagram Generated",
        description: "Diagram generated successfully!",
      });
    } catch (error: any) {
      console.error('Failed to generate diagram:', error);
      toast({
        title: "Error generating diagram",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDiagramGenerating(false);
    }
  };

  const handleShareAutomation = async () => {
    setIsShareModalOpen(true);
    try {
      // Check if a shareable link already exists
      const { data: existingLink, error: linkError } = await supabase
        .from('shared_automations')
        .select('shareable_link')
        .eq('automation_id', automationId)
        .single();

      if (linkError && linkError.code !== 'PGRST116') {
        throw linkError;
      }

      if (existingLink) {
        setShareableLink(existingLink.shareable_link);
        return;
      }

      // Generate a unique shareable link
      const newShareableLink = `${window.location.origin}/shared/${automationId}`;

      // Save the shareable link to the database
      const { error } = await supabase
        .from('shared_automations')
        .upsert([{ automation_id: automationId, shareable_link: newShareableLink }], { onConflict: ['automation_id'] });

      if (error) {
        throw error;
      }

      setShareableLink(newShareableLink);
    } catch (error: any) {
      console.error('Failed to generate shareable link:', error);
      toast({
        title: "Error generating shareable link",
        description: error.message,
        variant: "destructive",
      });
      setShareableLink(null);
    }
  };

  const handleCloseShareModal = () => {
    setIsShareModalOpen(false);
  };

  const handleDeleteAutomation = async () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteAutomation = async () => {
    try {
      const { error } = await supabase
        .from('automations')
        .delete()
        .eq('id', automationId);

      if (error) {
        throw error;
      }

      toast({
        title: "Automation Deleted",
        description: "Automation deleted successfully!",
      });
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Failed to delete automation:', error);
      toast({
        title: "Error deleting automation",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const cancelDeleteAutomation = () => {
    setIsDeleteDialogOpen(false);
  };

  const handleEditDescription = () => {
    setIsEditMode(true);
  };

  const handleSaveDescription = async () => {
    setIsDescriptionLoading(true);
    try {
      const { error } = await supabase
        .from('automations')
        .update({ description: editedDescription })
        .eq('id', automationId);

      if (error) {
        throw error;
      }

      toast({
        title: "Description Updated",
        description: "Automation description updated successfully!",
      });
      setAutomation({ ...automation, description: editedDescription });
    } catch (error: any) {
      console.error('Failed to update description:', error);
      toast({
        title: "Error updating description",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsEditMode(false);
      setIsDescriptionLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedDescription(automation?.description || '');
  };

  // ENHANCED: Get platforms from current response structured data


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="rounded-full">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          {/* Automation Actions */}
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                  <span className="sr-only">Open menu</span>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleShareAutomation}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDeleteAutomation}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.print()}>
                  <Download className="mr-2 h-4 w-4" />
                  Print
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Automation Info */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">{automation?.name}</h1>
          {isEditMode ? (
            <div className="flex items-center gap-3">
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="Enter automation description..."
                className="bg-white/10 border-white/30 text-white placeholder-white/70 rounded-xl"
              />
              <div>
                <Button
                  onClick={handleSaveDescription}
                  disabled={isDescriptionLoading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isDescriptionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Save'
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleCancelEdit}
                  disabled={isDescriptionLoading}
                  className="text-white"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-lg text-gray-300">{automation?.description || 'No description provided.'}</p>
              <Button variant="ghost" onClick={handleEditDescription} className="text-white">
                Edit Description
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Chat Messages */}
            <div className="space-y-4">
              {messages.map((message, index) => (
                <ChatCard
                  key={index}
                  message={message.text}
                  isBot={message.isBot}
                  timestamp={message.timestamp}
                  structuredData={message.structuredData}
                  onExecute={handleExecuteAutomation}
                  onDiagramGenerate={handleGenerateDiagram}
                  automationId={automationId!}
                  messageId={message.id}
                />
              ))}
            </div>

            {/* IMPLEMENTATION: Small Credential Buttons Between Chat and Input */}
            {getCurrentPlatforms().length > 0 && (
              <div className="my-4">
                <FixedPlatformButtons
                  platforms={getCurrentPlatforms()}
                  automationId={automationId!}
                  onCredentialChange={() => {
                    console.log('🔄 Credential change detected');
                    // Refresh any needed data
                  }}
                />
              </div>
            )}

            {/* Chat Input */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl">
              <div className="flex gap-3">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Describe what you want to automate..."
                  onKeyPress={handleKeyPress}
                  className="flex-1 bg-white/20 border-white/30 text-white placeholder-white/70 rounded-xl"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Diagram Display */}
            {diagramUrl && (
              <Card className="bg-white/5 backdrop-blur-md border border-white/10 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-white">Automation Diagram</CardTitle>
                  <CardDescription className="text-gray-400">Visual representation of the automation workflow.</CardDescription>
                </CardHeader>
                <CardContent>
                  <img src={diagramUrl} alt="Automation Diagram" className="rounded-md" />
                </CardContent>
              </Card>
            )}

            {/* Agent Recommendations */}
            <Card className="bg-white/5 backdrop-blur-md border border-white/10 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">Agent Recommendations</CardTitle>
                <CardDescription className="text-gray-400">AI-powered agent suggestions to enhance your automation.</CardDescription>
              </CardHeader>
              <CardContent>
                {currentResponse?.structured_data?.agent_recommendations ? (
                  <ScrollArea className="h-[300px] w-full rounded-md">
                    <div className="space-y-4">
                      {Object.entries(currentResponse.structured_data.agent_recommendations).map(([agentName, agentData]: [string, any]) => (
                        <Accordion type="single" collapsible key={agentName}>
                          <AccordionItem value={agentName}>
                            <AccordionTrigger className="text-white hover:no-underline">
                              {agentName}
                            </AccordionTrigger>
                            <AccordionContent className="text-gray-400">
                              <pre className="text-xs">
                                {JSON.stringify(agentData, null, 2)}
                              </pre>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-gray-400">No agent recommendations available.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Share Automation Modal */}
      <AlertDialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Share Automation</AlertDialogTitle>
            <AlertDialogDescription>
              Share this automation with others using the link below.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="link">Shareable Link</Label>
            <Input id="link" value={shareableLink || 'Generating link...'} readOnly />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseShareModal}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (shareableLink) {
                navigator.clipboard.writeText(shareableLink);
                toast({
                  title: "Link Copied",
                  description: "Shareable link copied to clipboard!",
                });
              }
            }}>Copy Link</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Automation Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Automation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this automation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDeleteAutomation}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAutomation}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AutomationDetail;
