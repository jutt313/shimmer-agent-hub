
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, 
  Code, 
  Zap, 
  Shield, 
  Globe, 
  Settings,
  ExternalLink,
  FileText,
  Terminal,
  Database
} from 'lucide-react';

const DocumentationPage = () => {
  const sections = [
    {
      title: 'Getting Started',
      icon: <Zap className="h-5 w-5" />,
      color: 'bg-blue-500',
      items: [
        { title: 'Quick Start Guide', description: 'Get up and running with YusrAI in minutes' },
        { title: 'Authentication Setup', description: 'Configure API keys and authentication' },
        { title: 'First Automation', description: 'Create your first automation workflow' },
        { title: 'API Overview', description: 'Understanding the YusrAI API structure' }
      ]
    },
    {
      title: 'API Reference',
      icon: <Code className="h-5 w-5" />,
      color: 'bg-green-500',
      items: [
        { title: 'Automations API', description: 'Create, manage, and execute automations' },
        { title: 'Webhooks API', description: 'Set up and manage webhook endpoints' },
        { title: 'AI Agents API', description: 'Configure and interact with AI agents' },
        { title: 'Authentication', description: 'API key management and security' }
      ]
    },
    {
      title: 'Developer Tools',
      icon: <Terminal className="h-5 w-5" />,
      color: 'bg-purple-500',
      items: [
        { title: 'API Playground', description: 'Test API endpoints interactively' },
        { title: 'SDK Documentation', description: 'Official SDKs and libraries' },
        { title: 'Code Examples', description: 'Sample code and implementations' },
        { title: 'Webhooks Testing', description: 'Tools for webhook development' }
      ]
    },
    {
      title: 'Platform Integration',
      icon: <Globe className="h-5 w-5" />,
      color: 'bg-orange-500',
      items: [
        { title: 'Supported Platforms', description: 'List of integrated platforms' },
        { title: 'Custom Integrations', description: 'Build your own platform connections' },
        { title: 'OAuth Setup', description: 'Configure OAuth for third-party platforms' },
        { title: 'Rate Limits', description: 'Understanding API rate limiting' }
      ]
    },
    {
      title: 'Security & Best Practices',
      icon: <Shield className="h-5 w-5" />,
      color: 'bg-red-500',
      items: [
        { title: 'API Security', description: 'Secure your API implementations' },
        { title: 'Key Management', description: 'Best practices for API key handling' },
        { title: 'Error Handling', description: 'Robust error handling strategies' },
        { title: 'Production Guidelines', description: 'Deploy safely to production' }
      ]
    },
    {
      title: 'Advanced Features',
      icon: <Settings className="h-5 w-5" />,
      color: 'bg-indigo-500',
      items: [
        { title: 'Custom AI Agents', description: 'Build and deploy custom AI agents' },
        { title: 'Workflow Orchestration', description: 'Complex automation workflows' },
        { title: 'Real-time Events', description: 'WebSocket and real-time features' },
        { title: 'Analytics & Monitoring', description: 'Track and monitor your automations' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                YusrAI Documentation
              </h1>
              <p className="text-gray-600 text-lg">
                Comprehensive guides, API references, and developer resources
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Database className="h-3 w-3 mr-1" />
              API v1.0
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <FileText className="h-3 w-3 mr-1" />
              Updated Daily
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              <Globe className="h-3 w-3 mr-1" />
              Multi-Platform
            </Badge>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 cursor-pointer hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6 text-center">
              <Terminal className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">API Playground</h3>
              <p className="text-blue-100">Test API endpoints interactively</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 cursor-pointer hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6 text-center">
              <Code className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Code Examples</h3>
              <p className="text-green-100">Ready-to-use code snippets</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 cursor-pointer hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6 text-center">
              <Zap className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Quick Start</h3>
              <p className="text-purple-100">Get started in 5 minutes</p>
            </CardContent>
          </Card>
        </div>

        {/* Documentation Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {sections.map((section, index) => (
            <Card key={index} className="bg-white/80 backdrop-blur-sm border-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className={`p-2 ${section.color} rounded-lg text-white`}>
                    {section.icon}
                  </div>
                  <span className="text-xl font-semibold text-gray-900">{section.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {section.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 group-hover:bg-blue-500 transition-colors"></div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center space-y-4 pt-8">
          <Separator />
          <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
            <span>Need help? Contact our support team</span>
            <Badge variant="outline" className="cursor-pointer hover:bg-blue-50">
              support@yusrai.com
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentationPage;
