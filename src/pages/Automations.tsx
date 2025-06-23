
import { useState, useEffect } from 'react';
import { Plus, MessageCircle, Bot, Zap, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import AutomationDashboard from '@/components/AutomationDashboard';
import ChatCard from '@/components/ChatCard';
import HelpChatModal from '@/components/HelpChatModal';
import NotificationDropdown from '@/components/NotificationDropdown';
import SettingsDropdown from '@/components/SettingsDropdown';

interface Agent {
  name: string;
  role: string;
}

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

const Automations = () => {
  const { toast } = useToast();
  const [showChatCard, setShowChatCard] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hey there! I'm Yusr AI, your personal automation assistant. How can I help you today?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [dismissedAgents, setDismissedAgents] = useState<Set<string>>(new Set());
  const [currentAutomationId, setCurrentAutomationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [helpInitialMessage, setHelpInitialMessage] = useState<string>('');
  const [helpInitialContext, setHelpInitialContext] = useState<string>('');

  const handleAgentAdd = (agent: Agent) => {
    toast({
      title: "Agent Added",
      description: `${agent.name} has been added to your automation.`,
    });
  };

  const handleAgentDismiss = (agentName: string) => {
    setDismissedAgents(prev => {
      const newSet = new Set(prev);
      newSet.add(agentName);
      return newSet;
    });
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50"
      style={{
        backgroundImage: `
          radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)
        `
      }}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Your Automations
            </h1>
            <p className="text-gray-600">Create, manage, and monitor your AI-powered workflows</p>
          </div>
          
          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <NotificationDropdown />
            <SettingsDropdown />
            <Button
              onClick={() => setIsHelpOpen(true)}
              variant="outline"
              className="rounded-xl border-0 bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Help
            </Button>
            <Button
              onClick={() => setShowChatCard(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              style={{
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)'
              }}
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Automation
            </Button>
          </div>
        </div>

        {/* Dashboard */}
        <AutomationDashboard />

        {/* Chat Interface */}
        {showChatCard && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative w-full max-w-6xl">
              <Button
                onClick={() => setShowChatCard(false)}
                variant="outline"
                className="absolute -top-12 right-0 rounded-xl bg-white/90 hover:bg-white border-0 shadow-lg z-10"
              >
                Close Chat
              </Button>
              <ChatCard
                messages={messages}
                onAgentAdd={handleAgentAdd}
                dismissedAgents={dismissedAgents}
                automationId={currentAutomationId}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}

        {/* Help Chat Modal */}
        <HelpChatModal
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
          initialMessage={helpInitialMessage}
          initialContext={helpInitialContext}
        />
      </div>
    </div>
  );
};

export default Automations;
