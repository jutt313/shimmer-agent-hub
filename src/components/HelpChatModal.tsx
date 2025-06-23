
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  Workflow, 
  Settings, 
  Key, 
  Bell, 
  MessageCircle, 
  Play, 
  Pause, 
  BarChart3,
  Users,
  Database,
  Shield,
  Lightbulb,
  ChevronRight
} from 'lucide-react';

interface HelpChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpChatModal = ({ isOpen, onClose }: HelpChatModalProps) => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const helpTopics = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Lightbulb,
      description: 'Learn the basics of creating your first automation',
      content: {
        overview: 'Welcome to your AI Automation Platform! This tool helps you create intelligent workflows that can handle tasks automatically.',
        steps: [
          'Click "Create New Automation" to start building',
          'Give your automation a name and description',
          'Chat with the AI to define what you want to automate',
          'Test your automation before going live',
          'Monitor performance and make adjustments'
        ]
      }
    },
    {
      id: 'automations',
      title: 'Managing Automations',
      icon: Workflow,
      description: 'Create, edit, and manage your automation workflows',
      content: {
        overview: 'Automations are the core of your platform. Each automation represents a specific workflow or task.',
        steps: [
          'View all automations from the main dashboard',
          'Click any automation to open its chat interface',
          'Use the chat to modify or enhance functionality',
          'Monitor status: Draft, Active, Paused, or Error',
          'Delete automations you no longer need'
        ]
      }
    },
    {
      id: 'ai-agents',
      title: 'AI Agents & LLMs',
      icon: Bot,
      description: 'Configure and manage your AI agents and language models',
      content: {
        overview: 'AI Agents are the brains of your automations. They use Large Language Models (LLMs) to understand and execute tasks.',
        steps: [
          'Access AI Agent settings from the Settings menu',
          'Configure different LLM providers (OpenAI, Claude, etc.)',
          'Set default models for new automations',
          'Manage API keys securely',
          'Customize agent behavior and memory settings'
        ]
      }
    },
    {
      id: 'platforms',
      title: 'Platform Connections',
      icon: Key,
      description: 'Connect to external platforms and services',
      content: {
        overview: 'Connect your automations to external platforms like social media, email services, CRMs, and more.',
        steps: [
          'Go to Settings > Platform Credentials',
          'Add credentials for platforms you want to connect',
          'Test connections to ensure they work properly',
          'Use these connections in your automations',
          'Update or remove credentials as needed'
        ]
      }
    },
    {
      id: 'notifications',
      title: 'Notifications & Monitoring',
      icon: Bell,
      description: 'Stay informed about your automation performance',
      content: {
        overview: 'Keep track of your automations with real-time notifications and monitoring.',
        steps: [
          'Check the notification bell for updates',
          'Configure notification preferences in Settings',
          'Monitor automation success and failure rates',
          'Get alerts for critical errors',
          'Review automation run history'
        ]
      }
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: Settings,
      description: 'Common issues and how to resolve them',
      content: {
        overview: 'When things don\'t work as expected, here are common solutions.',
        steps: [
          'Check automation status - is it Active?',
          'Verify platform credentials are valid',
          'Review error messages in notifications',
          'Test with simple automations first',
          'Contact support if issues persist'
        ]
      }
    }
  ];

  const quickActions = [
    { icon: Play, label: 'Create Automation', action: 'Start building your first workflow' },
    { icon: Settings, label: 'Configure Settings', action: 'Set up your preferences and connections' },
    { icon: Bell, label: 'Check Notifications', action: 'Stay updated on automation status' },
    { icon: MessageCircle, label: 'Chat with AI', action: 'Get help building specific automations' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] bg-white/95 backdrop-blur-md border-0 shadow-2xl rounded-3xl p-0">
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-3xl">
          <DialogTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-blue-600" />
            Help & Documentation
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 p-6">
          {!selectedTopic ? (
            <Tabs defaultValue="overview" className="h-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="topics">Help Topics</TabsTrigger>
                <TabsTrigger value="quick">Quick Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-0">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-6">
                    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle className="text-blue-800">Welcome to Your AI Automation Platform</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 leading-relaxed">
                          This platform empowers you to create intelligent automations using AI. Build workflows that can handle complex tasks, 
                          connect to multiple platforms, and adapt to your specific needs through natural language conversations.
                        </p>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Workflow className="w-5 h-5 text-blue-600" />
                            Automations
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600">Create and manage AI-powered workflows that can handle complex business processes automatically.</p>
                        </CardContent>
                      </Card>

                      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Bot className="w-5 h-5 text-purple-600" />
                            AI Agents
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600">Configure intelligent agents that understand context and can make decisions based on your requirements.</p>
                        </CardContent>
                      </Card>

                      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Database className="w-5 h-5 text-green-600" />
                            Platform Integration
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600">Connect to external services and platforms to extend your automation capabilities.</p>
                        </CardContent>
                      </Card>

                      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <BarChart3 className="w-5 h-5 text-orange-600" />
                            Monitoring
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600">Track performance, get notifications, and optimize your automations for better results.</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="topics" className="mt-0">
                <ScrollArea className="h-[500px]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {helpTopics.map((topic) => {
                      const IconComponent = topic.icon;
                      return (
                        <Card 
                          key={topic.id}
                          className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                          onClick={() => setSelectedTopic(topic.id)}
                        >
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <IconComponent className="w-5 h-5 text-blue-600" />
                              {topic.title}
                              <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />
                            </CardTitle>
                            <CardDescription>{topic.description}</CardDescription>
                          </CardHeader>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="quick" className="mt-0">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {quickActions.map((action, index) => {
                      const IconComponent = action.icon;
                      return (
                        <Card key={index} className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                          <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                              <IconComponent className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-800">{action.label}</h3>
                              <p className="text-sm text-gray-600">{action.action}</p>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          ) : (
            <div>
              <Button 
                variant="ghost" 
                onClick={() => setSelectedTopic(null)}
                className="mb-4 text-blue-600"
              >
                ← Back to Topics
              </Button>
              
              <ScrollArea className="h-[500px]">
                {(() => {
                  const topic = helpTopics.find(t => t.id === selectedTopic);
                  if (!topic) return null;
                  
                  const IconComponent = topic.icon;
                  return (
                    <div className="space-y-6">
                      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0 shadow-lg">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-xl text-blue-800">
                            <IconComponent className="w-6 h-6" />
                            {topic.title}
                          </CardTitle>
                          <CardDescription className="text-blue-600">
                            {topic.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700 leading-relaxed">
                            {topic.content.overview}
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                        <CardHeader>
                          <CardTitle className="text-lg text-gray-800">Step-by-Step Guide</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ol className="space-y-3">
                            {topic.content.steps.map((step, index) => (
                              <li key={index} className="flex items-start gap-3">
                                <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
                                  {index + 1}
                                </span>
                                <span className="text-gray-700">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })()}
              </ScrollArea>
            </div>
          )}
        </div>

        <div className="p-6 pt-0">
          <Button 
            onClick={onClose}
            className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            Close Help
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HelpChatModal;
