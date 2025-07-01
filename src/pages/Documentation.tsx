
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Book, 
  Search, 
  Code, 
  Zap, 
  Settings, 
  Webhook,
  PlayCircle,
  Key,
  Shield,
  Users,
  FileText,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

interface DocSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  articles: DocArticle[];
}

interface DocArticle {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
}

const Documentation = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('getting-started');
  const [selectedArticle, setSelectedArticle] = useState<DocArticle | null>(null);

  const docSections: DocSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: <PlayCircle className="h-5 w-5" />,
      description: 'Quick start guides and basic concepts',
      articles: [
        {
          id: 'intro',
          title: 'Introduction to YusrAI API',
          category: 'getting-started',
          tags: ['basics', 'overview'],
          content: `# Introduction to YusrAI API

Welcome to the YusrAI API documentation! Our API allows you to automate workflows, manage AI agents, and integrate with various platforms programmatically.

## What can you do with YusrAI API?

- **Automation Management**: Create, update, and execute automations
- **AI Agent Integration**: Build and deploy intelligent agents
- **Webhook Processing**: Handle real-time events and notifications
- **Platform Connections**: Integrate with popular services like Slack, Trello, and more

## Base URL
\`\`\`
https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/yusrai-api
\`\`\`

## Authentication
All API requests require authentication using a YUSR_ prefixed API key:

\`\`\`bash
curl -H "Authorization: Bearer YUSR_your_api_key_here" \\
     https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/yusrai-api/automations
\`\`\`

## Next Steps
1. Create your first API key in Developer Portal
2. Test your setup with the API Playground
3. Build your first automation via API`
        },
        {
          id: 'quickstart',
          title: 'Quick Start Guide',
          category: 'getting-started',
          tags: ['tutorial', 'setup'],
          content: `# Quick Start Guide

Get up and running with YusrAI API in 5 minutes!

## Step 1: Create an API Key

1. Navigate to Settings → Developer API
2. Click "Create New API Key"
3. Choose your credential type:
   - **Personal**: Full account access
   - **Project**: Scoped to specific projects
   - **Service**: Backend service integration

## Step 2: Test Your Setup

Use our API Playground (Settings → API Playground) or make a direct call:

\`\`\`bash
curl -X GET \\
  -H "Authorization: Bearer YUSR_your_key" \\
  https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/yusrai-api/automations
\`\`\`

## Step 3: Create Your First Automation

\`\`\`bash
curl -X POST \\
  -H "Authorization: Bearer YUSR_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "My First API Automation",
    "description": "Created via API",
    "trigger_type": "manual",
    "actions": []
  }' \\
  https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/yusrai-api/automations
\`\`\`

## Step 4: Execute the Automation

\`\`\`bash
curl -X POST \\
  -H "Authorization: Bearer YUSR_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"triggerData": {"source": "api"}}' \\
  https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/yusrai-api/execute/{automation_id}
\`\`\`

You're all set! Check your dashboard to see the automation in action.`
        }
      ]
    },
    {
      id: 'api-reference',
      title: 'API Reference',
      icon: <Code className="h-5 w-5" />,
      description: 'Complete API endpoint documentation',
      articles: [
        {
          id: 'authentication',
          title: 'Authentication',
          category: 'api-reference',
          tags: ['auth', 'security'],
          content: `# Authentication

YusrAI API uses Bearer Token authentication with YUSR_ prefixed API keys.

## API Key Types

### Personal Keys (YUSR_...)
- Full account access
- All permissions enabled
- Rate limit: 1000 requests/hour

### Project Keys (YUSR_...)
- Scoped to specific projects
- Configurable permissions
- Rate limit: 500 requests/hour

### Service Keys (YUSR_...)
- Backend service integration
- Limited scopes for security
- Rate limit: 2000 requests/hour

## Headers Required

\`\`\`
Authorization: Bearer YUSR_your_api_key_here
Content-Type: application/json
\`\`\`

## Error Responses

### 401 Unauthorized
\`\`\`json
{
  "error": "Invalid API token",
  "message": "The provided YUSR_ API token is invalid or expired"
}
\`\`\`

### 403 Forbidden
\`\`\`json
{
  "error": "Insufficient permissions",
  "message": "Write permission required to create automations"
}
\`\`\``
        },
        {
          id: 'automations-api',
          title: 'Automations API',
          category: 'api-reference',
          tags: ['automations', 'endpoints'],
          content: `# Automations API

Manage your automations programmatically.

## List Automations

\`GET /automations\`

Returns all automations for the authenticated user.

\`\`\`bash
curl -X GET \\
  -H "Authorization: Bearer YUSR_your_key" \\
  https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/yusrai-api/automations
\`\`\`

### Response
\`\`\`json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "My Automation",
      "description": "Automation description",
      "status": "active",
      "created_at": "2024-01-01T12:00:00Z",
      "updated_at": "2024-01-01T12:00:00Z"
    }
  ],
  "count": 1
}
\`\`\`

## Create Automation

\`POST /automations\`

Creates a new automation.

\`\`\`bash
curl -X POST \\
  -H "Authorization: Bearer YUSR_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "New Automation",
    "description": "Created via API",
    "trigger_type": "manual",
    "actions": [
      {
        "type": "notification",
        "config": {
          "message": "Automation triggered!"
        }
      }
    ]
  }' \\
  https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/yusrai-api/automations
\`\`\`

## Execute Automation

\`POST /execute/{id}\`

Executes an automation by ID.

\`\`\`bash
curl -X POST \\
  -H "Authorization: Bearer YUSR_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"triggerData": {"source": "api"}}' \\
  https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/yusrai-api/execute/{automation_id}
\`\`\``
        }
      ]
    },
    {
      id: 'webhooks',
      title: 'Webhooks',
      icon: <Webhook className="h-5 w-5" />,
      description: 'Real-time event handling and webhook integration',
      articles: [
        {
          id: 'webhook-setup',
          title: 'Webhook Setup',
          category: 'webhooks',
          tags: ['webhooks', 'real-time'],
          content: `# Webhook Setup

YusrAI provides real-time webhooks for automation events and system notifications.

## Real-time Webhook URL

Each user gets a unique real-time webhook URL:
\`\`\`
https://usr.com/api/realtime-webhook/{user_id}
\`\`\`

## Supported Events

- \`automation_created\` - New automation was created
- \`automation_executed\` - Automation was executed
- \`automation_updated\` - Automation was modified
- \`automation_error\` - Automation encountered an error
- \`api_call_made\` - API endpoint was called
- \`webhook_received\` - Incoming webhook processed

## Event Payload Structure

\`\`\`json
{
  "event_type": "automation_executed",
  "automation_id": "123e4567-e89b-12d3-a456-426614174000",
  "automation_title": "My Automation",
  "status": "completed",
  "execution_time_ms": 245,
  "user_id": "user_123",
  "timestamp": "2024-01-01T12:00:00Z"
}
\`\`\`

## Webhook Security

All webhooks include a secret for verification:
- Check the \`X-Webhook-Signature\` header
- Verify against your webhook secret
- Ensure payload integrity

## List Webhook Events

\`GET /webhooks\`

\`\`\`bash
curl -X GET \\
  -H "Authorization: Bearer YUSR_your_key" \\
  https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/yusrai-api/webhooks
\`\`\``
        }
      ]
    },
    {
      id: 'developers',
      title: 'Developer Tools',
      icon: <Settings className="h-5 w-5" />,
      description: 'API keys, projects, and development resources',
      articles: [
        {
          id: 'api-keys',
          title: 'Managing API Keys',
          category: 'developers',
          tags: ['api-keys', 'security'],
          content: `# Managing API Keys

Learn how to create, manage, and secure your API keys.

## API Key Types

### Personal Keys
- Full account access
- All automation and agent permissions
- Dashboard and notification access
- Perfect for personal projects and testing

### Project Keys
- Scoped to specific projects
- Configurable permission sets
- Ideal for client applications
- Separate usage tracking

### Service Keys
- Backend service integration
- Minimal required permissions
- High rate limits
- Production service use

## Creating API Keys

1. Go to Settings → Developer API
2. Click "Create New API Key"
3. Choose your credential type
4. Select permissions:
   - Read: View automations and data
   - Write: Create and modify resources
   - Automations: Full automation control
   - Webhooks: Webhook management
   - AI Agents: Agent interaction
   - Dashboard: Analytics access
   - Chat AI: Chat functionality
   - Notifications: Notification system
   - Credentials: Platform credential access
   - Diagrams: Diagram viewing and editing

## Security Best Practices

- **One-time viewing**: API keys are shown only once after creation
- **Secure storage**: Store keys in environment variables
- **Regular rotation**: Rotate keys periodically
- **Minimal permissions**: Use least-privilege principle
- **Monitor usage**: Check usage analytics regularly

## Rate Limits

| Key Type | Requests/Hour | Requests/Day |
|----------|---------------|--------------|
| Personal | 1,000 | 10,000 |
| Project | 500 | 5,000 |
| Service | 2,000 | 20,000 |

## Usage Tracking

Monitor your API usage in the Developer Portal:
- Request counts and patterns
- Response times and error rates
- Token usage and costs
- Rate limit utilization`
        }
      ]
    }
  ];

  const allArticles = docSections.flatMap(section => section.articles);
  
  const filteredArticles = searchTerm 
    ? allArticles.filter(article => 
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : docSections.find(section => section.id === selectedSection)?.articles || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <Book className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                API Documentation
              </h1>
              <p className="text-gray-600 text-lg">
                Complete guide to YusrAI API integration
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search documentation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl border-gray-300"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 backdrop-blur-sm border-gray-200 rounded-3xl shadow-lg sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Documentation Sections
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {docSections.map((section) => (
                  <Button
                    key={section.id}
                    variant={selectedSection === section.id ? "default" : "ghost"}
                    className={`w-full justify-start rounded-xl ${
                      selectedSection === section.id 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => {
                      setSelectedSection(section.id);
                      setSelectedArticle(null);
                      setSearchTerm('');
                    }}
                  >
                    {section.icon}
                    <span className="ml-2">{section.title}</span>
                  </Button>
                ))}

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Links</h4>
                  <div className="space-y-1">
                    <Button variant="ghost" size="sm" className="w-full justify-start text-sm">
                      <ExternalLink className="h-3 w-3 mr-2" />
                      API Playground
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-sm">
                      <Key className="h-3 w-3 mr-2" />
                      Create API Key
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedArticle ? (
              // Article View
              <Card className="bg-white/80 backdrop-blur-sm border-gray-200 rounded-3xl shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900">
                        {selectedArticle.title}
                      </CardTitle>
                      <div className="flex gap-2 mt-2">
                        {selectedArticle.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedArticle(null)}
                      className="rounded-xl"
                    >
                      Back to Articles
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-gray max-w-none">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                      {selectedArticle.content}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            ) : (
              // Articles List
              <>
                {searchTerm ? (
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Search Results for "{searchTerm}"
                    </h2>
                    <p className="text-gray-600">
                      Found {filteredArticles.length} result{filteredArticles.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                ) : (
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {docSections.find(s => s.id === selectedSection)?.title}
                    </h2>
                    <p className="text-gray-600">
                      {docSections.find(s => s.id === selectedSection)?.description}
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  {filteredArticles.map((article) => (
                    <Card 
                      key={article.id}
                      className="bg-white/80 backdrop-blur-sm border-gray-200 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                      onClick={() => setSelectedArticle(article)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              {article.title}
                            </h3>
                            <div className="flex gap-2 mb-3">
                              {article.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <p className="text-gray-600 line-clamp-2">
                              {article.content.substring(0, 150)}...
                            </p>
                          </div>
                          <ArrowRight className="h-5 w-5 text-gray-400 ml-4" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredArticles.length === 0 && (
                  <Card className="bg-white/80 backdrop-blur-sm border-gray-200 rounded-3xl shadow-lg">
                    <CardContent className="p-12 text-center">
                      <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {searchTerm ? 'No Results Found' : 'No Articles Available'}
                      </h3>
                      <p className="text-gray-600">
                        {searchTerm 
                          ? `No articles found matching "${searchTerm}". Try different keywords.`
                          : 'Articles for this section are coming soon.'
                        }
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
