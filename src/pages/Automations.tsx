import { useState, useEffect } from 'react';
import { Plus, MessageCircle, Bot, Zap, Settings, Code, Book } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
interface Automation {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  is_pinned?: boolean;
}
const Automations = () => {
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [showChatCard, setShowChatCard] = useState(false);
  const [newAutomationName, setNewAutomationName] = useState('');
  const [newAutomationDescription, setNewAutomationDescription] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creatingAutomation, setCreatingAutomation] = useState(false);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([{
    id: 1,
    text: "Hey there! I'm Yusr AI, your personal automation assistant. How can I help you today?",
    isBot: true,
    timestamp: new Date()
  }]);
  const [dismissedAgents, setDismissedAgents] = useState<Set<string>>(new Set());
  const [currentAutomationId, setCurrentAutomationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [helpInitialMessage, setHelpInitialMessage] = useState<string>('');
  const [helpInitialContext, setHelpInitialContext] = useState<string>('');
  useEffect(() => {
    if (user) {
      fetchAutomations();
    }
  }, [user]);
  const fetchAutomations = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('automations').select('*').eq('user_id', user?.id).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setAutomations(data || []);
    } catch (error) {
      console.error('Error fetching automations:', error);
      toast({
        title: "Error",
        description: "Failed to load automations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const createNewAutomation = async () => {
    if (!newAutomationName.trim()) {
      toast({
        title: "Error",
        description: "Please enter an automation name",
        variant: "destructive"
      });
      return;
    }
    setCreatingAutomation(true);
    try {
      const {
        data,
        error
      } = await supabase.from('automations').insert({
        title: newAutomationName.trim(),
        description: newAutomationDescription.trim() || null,
        status: 'draft',
        user_id: user?.id
      }).select().single();
      if (error) throw error;
      toast({
        title: "Success",
        description: "Automation created successfully"
      });
      setShowCreateDialog(false);
      setNewAutomationName('');
      setNewAutomationDescription('');

      // Use setTimeout to ensure the dialog closes before navigation
      setTimeout(() => {
        navigate(`/automations/${data.id}`, {
          replace: true
        });
      }, 100);
    } catch (error) {
      console.error('Error creating automation:', error);
      toast({
        title: "Error",
        description: "Failed to create automation",
        variant: "destructive"
      });
    } finally {
      setCreatingAutomation(false);
    }
  };
  const handleAgentAdd = (agent: Agent) => {
    toast({
      title: "Agent Added",
      description: `${agent.name} has been added to your automation.`
    });
  };
  const handleAgentDismiss = (agentName: string) => {
    setDismissedAgents(prev => {
      const newSet = new Set(prev);
      newSet.add(agentName);
      return newSet;
    });
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'draft':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading automations...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50" style={{
    backgroundImage: `
          radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)
        `
  }}>
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
            
            <Button onClick={() => setIsHelpOpen(true)} variant="outline" className="rounded-xl border-0 bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200">
              <MessageCircle className="w-5 h-5 mr-2" />
              Help
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200" style={{
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)'
              }}>
                  <Plus className="w-5 h-5 mr-2" />
                  Create Automation
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-gradient-to-br from-blue-50 via-white to-purple-50 border-0 shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Create New Automation
                  </DialogTitle>
                  <DialogDescription className="text-gray-600">
                    Enter details for your new automation to get started with AI-powered workflows.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Automation Name *
                    </label>
                    <Input placeholder="e.g., Email Marketing Campaign, Lead Generation..." value={newAutomationName} onChange={e => setNewAutomationName(e.target.value)} onKeyPress={e => e.key === 'Enter' && createNewAutomation()} className="rounded-xl border-blue-200 focus:border-purple-400 focus:ring-purple-400" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Description (Optional)
                    </label>
                    <Textarea placeholder="Describe what this automation should do..." value={newAutomationDescription} onChange={e => setNewAutomationDescription(e.target.value)} className="rounded-xl border-blue-200 focus:border-purple-400 focus:ring-purple-400 min-h-[80px]" />
                  </div>
                  <div className="flex gap-3 justify-end pt-4">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="rounded-xl">
                      Cancel
                    </Button>
                    <Button onClick={createNewAutomation} disabled={creatingAutomation || !newAutomationName.trim()} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl">
                      {creatingAutomation ? 'Creating...' : 'Create Automation'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Automations List */}
        {automations.length === 0 ? <div className="text-center py-16">
            <Bot className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No automations yet</h3>
            <p className="text-gray-500 mb-6">Create your first automation to get started</p>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Automation
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-gradient-to-br from-blue-50 via-white to-purple-50 border-0 shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Create New Automation
                  </DialogTitle>
                  <DialogDescription className="text-gray-600">
                    Enter details for your new automation to get started with AI-powered workflows.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Automation Name *
                    </label>
                    <Input placeholder="e.g., Email Marketing Campaign, Lead Generation..." value={newAutomationName} onChange={e => setNewAutomationName(e.target.value)} onKeyPress={e => e.key === 'Enter' && createNewAutomation()} className="rounded-xl border-blue-200 focus:border-purple-400 focus:ring-purple-400" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Description (Optional)
                    </label>
                    <Textarea placeholder="Describe what this automation should do..." value={newAutomationDescription} onChange={e => setNewAutomationDescription(e.target.value)} className="rounded-xl border-blue-200 focus:border-purple-400 focus:ring-purple-400 min-h-[80px]" />
                  </div>
                  <div className="flex gap-3 justify-end pt-4">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="rounded-xl">
                      Cancel
                    </Button>
                    <Button onClick={createNewAutomation} disabled={creatingAutomation || !newAutomationName.trim()} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl">
                      {creatingAutomation ? 'Creating...' : 'Create Automation'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {automations.map(automation => <Card key={automation.id} className="bg-white/80 backdrop-blur-sm border border-blue-100 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer rounded-xl overflow-hidden group" onClick={() => navigate(`/automations/${automation.id}`)}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <Badge className={`text-xs ${getStatusColor(automation.status)}`}>
                      {automation.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {automation.title}
                  </CardTitle>
                  {automation.description && <CardDescription className="text-sm text-gray-600">
                      {automation.description}
                    </CardDescription>}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Created: {new Date(automation.created_at).toLocaleDateString()}</span>
                    {automation.is_pinned && <Zap className="w-4 h-4 text-blue-600" />}
                  </div>
                </CardContent>
              </Card>)}
          </div>}

        {/* Chat Interface */}
        {showChatCard && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative w-full max-w-6xl">
              <Button onClick={() => setShowChatCard(false)} variant="outline" className="absolute -top-12 right-0 rounded-xl bg-white/90 hover:bg-white border-0 shadow-lg z-10">
                Close Chat
              </Button>
              <ChatCard messages={messages} onAgentAdd={handleAgentAdd} dismissedAgents={dismissedAgents} automationId={currentAutomationId} isLoading={isLoading} />
            </div>
          </div>}

        {/* Help Chat Modal */}
        <HelpChatModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} initialMessage={helpInitialMessage} initialContext={helpInitialContext} />
      </div>
    </div>;
};
export default Automations;