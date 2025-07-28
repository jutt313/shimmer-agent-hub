import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ListTree } from "@hvdesain/react-list-tree";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { useErrorHandler } from '@/hooks/useErrorHandler';
import ChatCard from '@/components/ChatCard';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
  structuredData?: any;
  yusrai_powered?: boolean;
  seven_sections_validated?: boolean;
  error_help_available?: boolean;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [helpMessage, setHelpMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { handleError } = useErrorHandler();
  const { user } = useAuth();

  useEffect(() => {
    // Load initial messages or seed messages here if needed
    const initialMessages: Message[] = [
      {
        id: 1,
        text: "Hello! How can I help you today?",
        isBot: true,
        timestamp: new Date(),
        structuredData: null,
        yusrai_powered: false,
        seven_sections_validated: false,
        error_help_available: false,
      },
    ];
    setMessages(initialMessages);
  }, []);

  const handleSendMessage = async (helpMessage: string) => {
    if (!helpMessage.trim()) return;

    const newMessage: Message = {
      id: Date.now(),
      text: helpMessage,
      isBot: false,
      timestamp: new Date(),
      structuredData: null,
      yusrai_powered: false,
      seven_sections_validated: false,
      error_help_available: false,
    };

    setMessages(prevMessages => [...prevMessages, newMessage]);
    setHelpMessage('');
    setIsLoading(true);

    try {
      // Simulate a bot response after a delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const botResponse: Message = {
        id: Date.now() + 1,
        text: `I am processing your request: ${helpMessage}`,
        isBot: true,
        timestamp: new Date(),
        structuredData: null,
        yusrai_powered: false,
        seven_sections_validated: false,
        error_help_available: false,
      };

      setMessages(prevMessages => [...prevMessages, botResponse]);
    } catch (error: any) {
      handleError(error, {
        fileName: 'Index.tsx',
        userAction: 'Simulating bot response',
        additionalContext: 'Error occurred while simulating bot response.',
        severity: 'medium',
        showToast: true,
      });
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgentAdd = (agent: any) => {
    console.log('Adding agent:', agent);
    // You can add logic here to handle adding agents if needed
  };

  const handleAgentDismiss = (agentName: string) => {
    console.log('Dismissing agent:', agentName);
    // You can add logic here to track dismissed agents if needed
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Yusr AI Chat</h1>

        <ChatCard
          messages={messages}
          onAgentAdd={handleAgentAdd}
          onAgentDismiss={handleAgentDismiss}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
        />

        <div className="mt-4">
          <Input
            type="text"
            placeholder="Type your message here..."
            value={helpMessage}
            onChange={(e) => setHelpMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage(helpMessage);
              }
            }}
          />
          <Button onClick={() => handleSendMessage(helpMessage)} className="mt-2">
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
