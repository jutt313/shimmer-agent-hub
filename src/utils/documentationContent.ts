
// Real documentation content instead of fake mockups
export interface DocumentationArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  tags: string[];
  lastUpdated: string;
}

export const documentationArticles: DocumentationArticle[] = [
  {
    id: '1',
    title: 'Getting Started with YusrAI',
    slug: 'getting-started',
    category: 'Quick Start',
    tags: ['beginner', 'setup'],
    lastUpdated: '2024-01-15',
    content: `# Getting Started with YusrAI

Welcome to YusrAI! This guide will help you create your first automation in minutes.

## Step 1: Create Your First Automation

1. Navigate to the **Automations** page
2. Click **"Create New Automation"**
3. Choose a trigger (webhook, schedule, or manual)
4. Add actions (API calls, AI processing, notifications)
5. Test and activate your automation

## Step 2: Set Up Webhooks

Webhooks allow external services to trigger your automations:

1. Go to **Settings > Webhooks**
2. Click **"Create Webhook"**
3. Copy the generated webhook URL
4. Configure your external service to send POST requests to this URL

## Step 3: Connect Platforms

Connect your favorite tools and services:

1. Visit **Settings > Platform Credentials**
2. Add credentials for services you want to integrate
3. Test the connections to ensure they work
4. Use these platforms in your automations

## Next Steps

- Explore AI Agents for intelligent processing
- Set up notifications to stay informed
- Check out our API documentation for advanced usage`
  },
  {
    id: '2',
    title: 'Webhook Integration Guide',
    slug: 'webhook-integration',
    category: 'Integrations',
    tags: ['webhooks', 'api', 'integration'],
    lastUpdated: '2024-01-14',
    content: `# Webhook Integration Guide

Learn how to integrate YusrAI webhooks with external services.

## Understanding Webhooks

Webhooks are HTTP POST requests sent by external services when specific events occur. YusrAI can receive these webhooks and trigger automations based on the data received.

## Creating a Webhook

1. **Navigate to Webhook Management**
   - Go to Settings > Webhooks
   - Click "Create New Webhook"

2. **Configure Your Webhook**
   - Choose the automation to trigger
   - Set expected event types
   - Copy the generated webhook URL

## Webhook Security

All YusrAI webhooks include security features:

- **Secret Validation**: Each webhook has a unique secret
- **Signature Verification**: Payloads are signed with HMAC-SHA256
- **HTTPS Only**: All webhook URLs use secure HTTPS

## Testing Webhooks

Use our built-in webhook tester:

1. Find your webhook in the management interface
2. Click the "Test" button
3. Review the test results and response times

## Common Integration Examples

### Shopify Integration
\`\`\`
POST https://yusrai.com/api/webhooks/your-webhook-id
Content-Type: application/json
X-Webhook-Signature: sha256=your-signature

{
  "event": "order.created",
  "data": {
    "order_id": "12345",
    "customer_email": "customer@example.com",
    "total": 99.99
  }
}
\`\`\`

### Stripe Integration
\`\`\`
POST https://yusrai.com/api/webhooks/your-webhook-id
Content-Type: application/json
X-Webhook-Signature: sha256=your-signature

{
  "event": "payment.succeeded",
  "data": {
    "payment_id": "pi_12345",
    "amount": 2000,
    "currency": "usd"
  }
}
\`\`\``
  },
  {
    id: '3',
    title: 'AI Agent Configuration',
    slug: 'ai-agent-setup',
    category: 'AI Agents',
    tags: ['ai', 'agents', 'configuration'],
    lastUpdated: '2024-01-13',
    content: `# AI Agent Configuration

Set up and configure AI agents to add intelligence to your automations.

## What are AI Agents?

AI Agents are intelligent components that can:
- Process natural language
- Make decisions based on data
- Generate content and responses
- Analyze and categorize information

## Creating an AI Agent

1. **Navigate to AI Agents**
   - Go to your automation editor
   - Add an "AI Agent" step

2. **Configure the Agent**
   - Set the agent's role and goal
   - Define system prompts and rules
   - Choose the AI model (GPT-4, Claude, etc.)

## Agent Configuration Options

### Basic Settings
- **Agent Name**: Descriptive name for your agent
- **Role**: What role the agent should play
- **Goal**: What the agent should accomplish

### Advanced Settings
- **System Prompt**: Instructions for the AI
- **Model Selection**: Choose the best model for your use case
- **Temperature**: Control creativity vs. consistency
- **Max Tokens**: Limit response length

## Example Agent Configurations

### Customer Support Agent
\`\`\`json
{
  "name": "Support Assistant",
  "role": "Customer Support Specialist",
  "goal": "Provide helpful and accurate customer support",
  "rules": [
    "Always be polite and professional",
    "Ask clarifying questions when needed",
    "Escalate complex issues to human agents"
  ],
  "model": "gpt-4",
  "temperature": 0.3
}
\`\`\`

### Content Analyzer
\`\`\`json
{
  "name": "Content Analyzer",
  "role": "Content Analysis Expert",
  "goal": "Analyze and categorize incoming content",
  "rules": [
    "Categorize content by topic and sentiment",
    "Extract key entities and themes",
    "Provide structured analysis results"
  ],
  "model": "gpt-4",
  "temperature": 0.1
}
\`\`\``
  }
];

export const documentationCategories = [
  { id: '1', name: 'Quick Start', icon: '🚀', articles: 1 },
  { id: '2', name: 'Integrations', icon: '🔗', articles: 1 },
  { id: '3', name: 'AI Agents', icon: '🤖', articles: 1 },
  { id: '4', name: 'API Reference', icon: '📖', articles: 0 },
  { id: '5', name: 'Examples', icon: '💡', articles: 0 }
];

export const getArticleBySlug = (slug: string): DocumentationArticle | undefined => {
  return documentationArticles.find(article => article.slug === slug);
};

export const getArticlesByCategory = (category: string): DocumentationArticle[] => {
  return documentationArticles.filter(article => article.category === category);
};

export const searchArticles = (query: string): DocumentationArticle[] => {
  const lowercaseQuery = query.toLowerCase();
  return documentationArticles.filter(article => 
    article.title.toLowerCase().includes(lowercaseQuery) ||
    article.content.toLowerCase().includes(lowercaseQuery) ||
    article.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
};
