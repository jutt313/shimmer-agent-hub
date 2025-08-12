import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Play, LayoutDashboard, Code2, KanbanSquare, MessageSquare, Network, Bot, ListChecks } from "lucide-react";
import { toast } from "@/components/ui/use-toast"
import { useCompletion } from 'ai/react';
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAutomation } from '@/providers/AutomationProvider';
import { SimplePlatformDisplay } from '@/components/SimplePlatformDisplay';
import { cleanPlatformName } from '@/utils/stringHelper';
import { extractPlatformCredentials } from '@/utils/platformDataExtractor';
import { WorkflowDiagram } from '@/components/WorkflowDiagram';
import { useToast } from "@/components/ui/use-toast"
import { AutomationCredentialManager } from '@/utils/automationCredentialManager';

interface ChatCardProps {
  chat: any;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onExecute: (id: string) => void;
  isExecuting: boolean;
  showDiagram: boolean;
}

const ChatCard = ({ chat, onEdit, onDelete, onExecute, isExecuting, showDiagram }: ChatCardProps) => {
  const [showPlatformModal, setShowPlatformModal] = useState(false);
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<any | null>(null);
  const [isExecutingSingle, setIsExecutingSingle] = useState(false);
  const { toast } = useToast();
  const { setAutomationContext } = useAutomation();

  const handleShowPlatforms = () => {
    console.log('🔍 ChatCard: Extracting platforms from chat message');
    
    let platformsSource = [];
    try {
      const parsedMessage = JSON.parse(chat.message);
      
      if (parsedMessage && parsedMessage.steps) {
        console.log('✅ ChatCard: Found steps in parsed message');
        platformsSource = extractPlatformCredentials(parsedMessage);
      } else if (parsedMessage && parsedMessage.automations) {
        console.log('✅ ChatCard: Found automations in parsed message');
        platformsSource = extractPlatformCredentials(parsedMessage.automations);
      } else if (parsedMessage && Array.isArray(parsedMessage)) {
        console.log('✅ ChatCard: Found array in parsed message');
        platformsSource = extractPlatformCredentials(parsedMessage);
      } else {
        console.warn('⚠️ ChatCard: No steps or automations found in parsed message');
        platformsSource = extractPlatformCredentials(parsedMessage);
      }
    } catch (error) {
      console.error('❌ ChatCard: Error parsing chat message:', error);
      
      try {
        platformsSource = extractPlatformCredentials(chat.message);
      } catch (secondaryError) {
        console.error('❌ ChatCard: Secondary error extracting platforms:', secondaryError);
        toast({
          title: "Error Extracting Platforms",
          description: "There was an error extracting platforms from the chat message.",
          variant: "destructive",
        })
        return;
      }
    }

    // CRITICAL FIX: Preserve exact ChatAI credential structure - NO FALLBACKS
    const finalPlatforms = platformsSource.map((platform: any, index: number) => {
      console.log(`🔧 Processing platform ${index}:`, platform);
      
      const rawPlatformName = platform.platform_name || platform.name || platform.platform || `Platform_${index}`;
      const cleanedPlatformName = cleanPlatformName(rawPlatformName);
      
      // CRITICAL: Use ChatAI's original_platform.required_credentials directly
      let credentials = [];
      
      if (platform.chatai_data?.original_platform?.required_credentials) {
        // ✅ PRESERVE ChatAI credentials exactly as generated
        credentials = platform.chatai_data.original_platform.required_credentials.map((cred: any) => ({
          field: cred.field_name,  // Use exact ChatAI field name
          placeholder: cred.example || `Enter ${cred.field_name}`,
          link: cred.obtain_link || '',
          why_needed: cred.purpose || `Required for ${cleanedPlatformName} authentication`
        }));
      } else if (platform.credentials && Array.isArray(platform.credentials)) {
        // ✅ PRESERVE existing credentials exactly
        credentials = platform.credentials;
      } else {
        // Only use fallback if absolutely no credential data exists
        credentials = [{
          field: "api_key",
          placeholder: `Enter ${cleanedPlatformName} API key`,
          link: "",
          why_needed: `Required for ${cleanedPlatformName} API authentication`
        }];
      }

      return {
        name: cleanedPlatformName,
        credentials: credentials,
        // ✅ CRITICAL: Preserve ALL ChatAI data for test script generation
        testConfig: platform.testConfig,
        test_payloads: platform.test_payloads,
        chatai_data: platform.chatai_data || platform  // Preserve complete ChatAI structure
      };
    });

    setPlatforms(finalPlatforms);
    setShowPlatformModal(true);
  };

  const handleClosePlatformModal = () => {
    setShowPlatformModal(false);
    setSelectedPlatform(null);
  };

  const handlePlatformClick = (platform: any) => {
    console.log('✅ ChatCard: Platform clicked:', platform);
    setSelectedPlatform(platform);
  };

  const handleExecuteSingle = async () => {
    setIsExecutingSingle(true);
    try {
      // Set the automation context
      setAutomationContext({
        automationId: chat.id,
        automationName: chat.title,
        automationDescription: chat.description,
        automationMessage: chat.message,
        automationType: chat.type,
        automationCreatedAt: chat.createdAt,
        automationUpdatedAt: chat.updatedAt,
      });

      // Execute the automation
      onExecute(chat.id);
    } catch (error: any) {
      toast({
        title: "Error Executing Automation",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsExecutingSingle(false);
    }
  };

  return (
    <>
      <Card className="w-full shadow-md hover:shadow-lg transition-shadow duration-300 border-0 bg-gradient-to-br from-gray-50 to-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold">{chat.title}</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(chat.id)}
              className="h-7 w-7 p-0 rounded-full border-gray-200 hover:bg-gray-100 transition-all duration-300"
            >
              <Edit className="w-4 h-4 text-gray-500" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 rounded-full border-red-200 hover:bg-red-100 transition-all duration-300"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this automation and all of its data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(chat.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-xs text-gray-500">
            {chat.description}
          </CardDescription>
          <div className="mt-4 flex items-center space-x-2">
            <Badge variant="secondary">
              <LayoutDashboard className="mr-1.5 h-3 w-3" />
              {chat.type}
            </Badge>
            {chat.tags && chat.tags.length > 0 && (
              <Badge variant="outline">
                <Code2 className="mr-1.5 h-3 w-3" />
                {chat.tags.join(', ')}
              </Badge>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleShowPlatforms}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-md hover:shadow-lg transition-shadow duration-300 font-semibold"
          >
            <Network className="mr-2 h-4 w-4" />
            Platforms
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExecuteSingle}
            disabled={isExecutingSingle}
            className="bg-gradient-to-r from-green-500 to-purple-500 hover:from-green-600 hover:to-purple-600 text-white shadow-md hover:shadow-lg transition-shadow duration-300 font-semibold"
          >
            <Play className="mr-2 h-4 w-4" />
            {isExecutingSingle ? 'Executing...' : 'Execute'}
          </Button>
        </CardFooter>
      </Card>

      {showPlatformModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-xl shadow-2xl bg-white">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Select a Platform</h2>
              <Button variant="ghost" size="sm" onClick={handleClosePlatformModal}>
                Close
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 overflow-y-auto max-h-[calc(90vh - 80px)]">
              {platforms && platforms.length > 0 ? (
                platforms.map((platform, index) => (
                  <Card
                    key={index}
                    className={`shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer border-0 ${selectedPlatform?.name === platform.name ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'
                      }`}
                    onClick={() => handlePlatformClick(platform)}
                  >
                    <CardHeader className="space-y-0 pb-2">
                      <CardTitle className="text-sm font-semibold">{platform.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-xs text-gray-500">
                        {platform.credentials?.length} Credentials Required
                      </CardDescription>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-3 text-center text-gray-500">No platforms found in this automation.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedPlatform && (
        <SimplePlatformDisplay platform={selectedPlatform} onClose={() => setSelectedPlatform(null)} />
      )}
    </>
  );
};

export default ChatCard;
