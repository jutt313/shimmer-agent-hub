
-- First, let's seed the documentation categories
INSERT INTO documentation_categories (id, name, description, icon, sort_order, is_active) VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Getting Started', 'Quick start guides and basic concepts', 'PlayCircle', 1, true),
  ('550e8400-e29b-41d4-a716-446655440002', 'API Reference', 'Complete API endpoint documentation', 'Code', 2, true),
  ('550e8400-e29b-41d4-a716-446655440003', 'Platform Integrations', 'Connect with popular platforms', 'Settings', 3, true),
  ('550e8400-e29b-41d4-a716-446655440004', 'Automation Guides', 'Build powerful automations', 'Bot', 4, true),
  ('550e8400-e29b-41d4-a716-446655440005', 'Troubleshooting', 'Solve common issues', 'AlertCircle', 5, true),
  ('550e8400-e29b-41d4-a716-446655440006', 'Advanced Features', 'AI Agents, Webhooks, and more', 'Zap', 6, true)
ON CONFLICT (id) DO NOTHING;

-- Now let's add comprehensive documentation articles
INSERT INTO documentation_articles (id, category_id, title, slug, content, excerpt, tags, sort_order, is_published) VALUES

-- Getting Started Articles
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Welcome to YusrAI', 'welcome-to-yusrai', 
'# Welcome to YusrAI - Your AI-Powered Automation Platform

YusrAI is a comprehensive automation platform that combines the power of artificial intelligence with seamless integrations to help you automate your workflows efficiently.

## What is YusrAI?

YusrAI is designed to make automation accessible to everyone, from beginners to advanced users. Our platform offers:

- **Visual Automation Builder**: Create automations using our intuitive drag-and-drop interface
- **AI-Powered Agents**: Deploy intelligent agents that can make decisions and handle complex tasks
- **200+ Platform Integrations**: Connect with your favorite tools and services
- **Powerful API**: Build custom integrations and extend functionality
- **Real-time Monitoring**: Track your automations with detailed analytics and logs

## Key Features

### 🤖 AI Agents
Create intelligent agents that can:
- Process natural language requests
- Make decisions based on data
- Handle customer support inquiries
- Analyze content and generate responses

### 🔧 Visual Automation Builder
- Drag-and-drop interface for creating workflows
- Pre-built templates for common use cases
- Real-time testing and debugging
- Version control for your automations

### 🌐 Platform Integrations
Connect with popular platforms:
- **Communication**: Slack, Discord, Microsoft Teams
- **Project Management**: Trello, Asana, Notion
- **CRM**: Salesforce, HubSpot, Pipedrive
- **Email Marketing**: Mailchimp, SendGrid, ConvertKit
- **E-commerce**: Shopify, WooCommerce, Stripe
- **Social Media**: Twitter, LinkedIn, Facebook

### 📊 Analytics & Monitoring
- Real-time execution monitoring
- Detailed performance analytics
- Error tracking and debugging
- Usage statistics and insights

## Getting Started Journey

1. **Sign Up**: Create your free YusrAI account
2. **Connect Platforms**: Add your first platform integration
3. **Create Automation**: Build your first automation using our templates
4. **Deploy**: Activate your automation and monitor its performance
5. **Scale**: Expand with more complex workflows and AI agents

## Support & Community

- **Help Chat**: Click the chat icon for instant AI-powered support
- **Documentation**: Comprehensive guides and tutorials
- **API Reference**: Complete technical documentation
- **Community**: Join our Discord community for tips and support

Ready to get started? Let''s create your first automation!

[Next: Setting Up Your Account →](setting-up-account)', 
'Get started with YusrAI automation platform - your guide to AI-powered workflows', 
ARRAY['getting-started', 'introduction', 'overview'], 1, true),

('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Setting Up Your Account', 'setting-up-account',
'# Setting Up Your YusrAI Account

This guide will walk you through setting up your YusrAI account and configuring your first settings.

## Account Creation

1. **Visit YusrAI**: Go to your YusrAI dashboard
2. **Complete Profile**: Fill in your profile information
3. **Verify Email**: Check your email for verification (if required)

## Dashboard Overview

### Main Navigation
- **Automations**: Create and manage your workflows
- **AI Agents**: Deploy intelligent automation agents
- **Integrations**: Connect your favorite platforms
- **Settings**: Configure account preferences and API keys

### Settings Configuration

#### Profile Settings
```javascript
// Access your profile settings
Settings → Profile → Update Information
```

#### API Keys Setup
```javascript
// Create your first API key
Settings → Developer API → Create New API Key

// Choose your credential type:
- Personal: Full account access
- Project: Scoped to specific projects  
- Service: Backend service integration
```

#### Notification Preferences
Configure how you want to receive updates:
- Automation completion notifications
- Error alerts
- Performance reports
- Security notifications

## Security Best Practices

### API Key Management
- Store keys securely in environment variables
- Use minimal required permissions
- Rotate keys regularly
- Monitor usage in the Developer Portal

### Account Security
- Enable two-factor authentication (when available)
- Use strong, unique passwords
- Review connected platforms regularly
- Monitor account activity

## Next Steps

Now that your account is set up, you''re ready to:

1. **Connect Your First Platform** - Add integrations for your favorite tools
2. **Create Your First Automation** - Start with a simple template
3. **Explore AI Agents** - Deploy intelligent automation assistants

[Next: Creating Your First API Key →](creating-first-api-key)',
'Complete guide to setting up and configuring your YusrAI account',
ARRAY['setup', 'account', 'configuration'], 2, true),

('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Creating Your First API Key', 'creating-first-api-key',
'# Creating Your First API Key

API keys are essential for connecting YusrAI with external services and building custom integrations.

## Understanding API Key Types

### Personal Keys (YUSR_...)
- **Use Case**: Personal projects and testing
- **Access**: Full account permissions
- **Rate Limit**: 1,000 requests/hour
- **Best For**: Individual developers, personal automations

### Project Keys (YUSR_...)
- **Use Case**: Client applications and specific projects
- **Access**: Configurable scoped permissions
- **Rate Limit**: 500 requests/hour
- **Best For**: Client work, isolated projects

### Service Keys (YUSR_...)
- **Use Case**: Backend services and production systems
- **Access**: Minimal required permissions
- **Rate Limit**: 2,000 requests/hour
- **Best For**: Production applications, server-to-server communication

## Step-by-Step Creation Process

### 1. Navigate to Developer Portal
```javascript
// Access the Developer API section
Settings → Developer API → Create New API Key
```

### 2. Choose Key Type and Permissions
Select the appropriate permissions for your use case:

**Available Permissions:**
- **Read**: View automations and data
- **Write**: Create and modify resources
- **Automations**: Full automation control
- **Webhooks**: Webhook management
- **AI Agents**: Agent interaction
- **Dashboard**: Analytics access
- **Chat AI**: Chat functionality
- **Notifications**: Notification system
- **Credentials**: Platform credential access
- **Diagrams**: Diagram viewing and editing

### 3. Generate and Store Your Key
```javascript
// Example API key format
YUSR_1234567890abcdef1234567890abcdef

// Store securely in your environment
export YUSRAI_API_KEY="YUSR_your_key_here"
```

## Using Your API Key

### Basic Authentication
```javascript
// JavaScript/Node.js example
const headers = {
  ''Authorization'': ''Bearer YUSR_your_api_key_here'',
  ''Content-Type'': ''application/json''
}

fetch(''https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/yusrai-api/automations'', {
  headers: headers
})
```

### cURL Example
```bash
curl -X GET \
  -H "Authorization: Bearer YUSR_your_key" \
  -H "Content-Type: application/json" \
  https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/yusrai-api/automations
```

### Python Example
```python
import requests

headers = {
    ''Authorization'': ''Bearer YUSR_your_key'',
    ''Content-Type'': ''application/json''
}

response = requests.get(
    ''https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/yusrai-api/automations'',
    headers=headers
)
```

## Security Best Practices

### Storage
- Never commit API keys to version control
- Use environment variables or secure vaults
- Rotate keys regularly (every 90 days recommended)

### Monitoring
- Track usage in the Developer Portal
- Monitor for unusual activity
- Set up alerts for rate limit approaches

### Access Control
- Use principle of least privilege
- Create separate keys for different environments
- Revoke unused keys immediately

## Testing Your API Key

Use our built-in API Playground to test your key:

```javascript
// Test endpoint
Settings → API Playground → Select Endpoint → Add Your Key
```

## Common Issues and Solutions

### 401 Unauthorized Error
```javascript
// Check your key format
❌ Wrong: "your_api_key"
✅ Correct: "YUSR_your_api_key"

// Verify the Authorization header
❌ Wrong: "Bearer your_key"
✅ Correct: "Bearer YUSR_your_key"
```

### 403 Forbidden Error
- Check if your key has the required permissions
- Verify the key is active and not expired
- Ensure you''re accessing resources you own

### Rate Limiting
- Monitor your usage in the Developer Portal
- Implement exponential backoff in your applications
- Consider upgrading your plan for higher limits

[Next: Your First Automation →](your-first-automation)',
'Complete guide to creating and managing API keys for YusrAI platform',
ARRAY['api-keys', 'authentication', 'security'], 3, true),

-- API Reference Articles
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'API Authentication', 'api-authentication',
'# API Authentication

YusrAI API uses Bearer Token authentication with YUSR_ prefixed API keys for secure access to all endpoints.

## Authentication Methods

### Bearer Token Authentication
All API requests must include your API key in the Authorization header:

```javascript
Authorization: Bearer YUSR_your_api_key_here
```

### API Key Formats
YusrAI API keys follow a specific format:
```
YUSR_1234567890abcdef1234567890abcdef
```

## Required Headers

### Standard Headers
```javascript
{
  "Authorization": "Bearer YUSR_your_api_key_here",
  "Content-Type": "application/json"
}
```

### Optional Headers
```javascript
{
  "X-Request-ID": "unique-request-identifier", // For request tracking
  "User-Agent": "YourApp/1.0" // For usage analytics
}
```

## Authentication Examples

### JavaScript/Node.js
```javascript
const apiKey = process.env.YUSRAI_API_KEY;
const baseURL = ''https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/yusrai-api'';

const headers = {
  ''Authorization'': `Bearer ${apiKey}`,
  ''Content-Type'': ''application/json''
};

// GET request example
const response = await fetch(`${baseURL}/automations`, {
  method: ''GET'',
  headers: headers
});

// POST request example
const createAutomation = await fetch(`${baseURL}/automations`, {
  method: ''POST'',
  headers: headers,
  body: JSON.stringify({
    title: ''My Automation'',
    description: ''Created via API'',
    trigger_type: ''manual''
  })
});
```

### Python
```python
import requests
import os

api_key = os.getenv(''YUSRAI_API_KEY'')
base_url = ''https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/yusrai-api''

headers = {
    ''Authorization'': f''Bearer {api_key}'',
    ''Content-Type'': ''application/json''
}

# GET request
response = requests.get(f''{base_url}/automations'', headers=headers)

# POST request
data = {
    ''title'': ''My Automation'',
    ''description'': ''Created via API'',
    ''trigger_type'': ''manual''
}
response = requests.post(f''{base_url}/automations'', json=data, headers=headers)
```

### cURL
```bash
# GET request
curl -X GET \
  -H "Authorization: Bearer YUSR_your_api_key" \
  -H "Content-Type: application/json" \
  https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/yusrai-api/automations

# POST request
curl -X POST \
  -H "Authorization: Bearer YUSR_your_api_key" \
  -H "Content-Type: application/json" \
  -d ''{"title": "My Automation", "description": "Created via API", "trigger_type": "manual"}'' \
  https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/yusrai-api/automations
```

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Invalid API token",
  "message": "The provided YUSR_ API token is invalid or expired",
  "code": "INVALID_TOKEN"
}
```

**Common causes:**
- Missing or malformed API key
- Expired API key
- Incorrect Authorization header format

### 403 Forbidden
```json
{
  "error": "Insufficient permissions",
  "message": "Write permission required to create automations",
  "code": "INSUFFICIENT_PERMISSIONS"
}
```

**Common causes:**
- API key lacks required permissions
- Attempting to access resources you don''t own
- API key is deactivated

### 429 Rate Limited
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 3600
}
```

## Rate Limits

### By API Key Type

| Key Type | Requests/Hour | Requests/Day |
|----------|---------------|--------------|
| Personal | 1,000 | 10,000 |
| Project | 500 | 5,000 |
| Service | 2,000 | 20,000 |

### Rate Limit Headers
Response headers include rate limit information:
```javascript
{
  "X-RateLimit-Limit": "1000",
  "X-RateLimit-Remaining": "999",
  "X-RateLimit-Reset": "1640995200"
}
```

### Handling Rate Limits
```javascript
async function makeAPIRequest(url, options) {
  const response = await fetch(url, options);
  
  if (response.status === 429) {
    const retryAfter = response.headers.get(''Retry-After'');
    console.log(`Rate limited. Retry after ${retryAfter} seconds`);
    
    // Implement exponential backoff
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
    return makeAPIRequest(url, options);
  }
  
  return response;
}
```

## Security Best Practices

### API Key Management
- Store keys in environment variables, never in code
- Use different keys for development and production
- Rotate keys regularly (every 90 days)
- Revoke unused keys immediately

### Request Security
- Always use HTTPS endpoints
- Validate SSL certificates
- Implement request signing for sensitive operations
- Use request IDs for tracking and debugging

### Monitoring
- Monitor API usage regularly
- Set up alerts for unusual activity
- Track failed authentication attempts
- Review access logs periodically

[Next: Automations API →](automations-api)',
'Complete guide to authenticating with YusrAI API using Bearer tokens',
ARRAY['authentication', 'api', 'security'], 1, true),

-- Platform Integration Articles
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', 'Slack Integration', 'slack-integration',
'# Slack Integration Guide

Connect YusrAI with Slack to automate your team communications and workflows.

## Overview

The Slack integration allows you to:
- Send automated messages to channels and users
- Create channels dynamically
- Monitor channel activity
- Manage user permissions
- Archive and organize conversations

## Setting Up Slack Integration

### Step 1: Create Slack App
1. Go to [Slack API Portal](https://api.slack.com/apps)
2. Click "Create New App"
3. Choose "From scratch"
4. Name your app and select your workspace

### Step 2: Configure Bot Permissions
Add these OAuth scopes to your bot:

**Required Scopes:**
```
chat:write          # Send messages
channels:read       # Read public channels
groups:read         # Read private channels
users:read          # Read user information
files:write         # Upload files
```

**Optional Scopes:**
```
channels:manage     # Create/archive channels
users:read.email    # Read user emails
chat:write.public   # Write to any channel
```

### Step 3: Install App to Workspace
1. Click "Install to Workspace"
2. Authorize the requested permissions
3. Copy the "Bot User OAuth Token"

### Step 4: Add to YusrAI
```javascript
// Navigate to platform credentials
Settings → Platform Credentials → Add Credential

// Select Slack and enter:
Platform: Slack
Credential Type: OAuth Token
Token: xoxb-your-bot-token
```

## Common Automation Patterns

### 1. Send Welcome Messages
```javascript
// Trigger: New team member joins
// Action: Send welcome message

{
  "trigger": {
    "type": "webhook",
    "platform": "slack",
    "event": "member_joined_channel"
  },
  "actions": [
    {
      "type": "slack_message",
      "channel": "#general",
      "message": "Welcome {{user.name}} to the team! 🎉"
    }
  ]
}
```

### 2. Daily Standup Reminders
```javascript
// Trigger: Schedule (Daily at 9 AM)
// Action: Send standup reminder

{
  "trigger": {
    "type": "schedule",
    "cron": "0 9 * * 1-5"
  },
  "actions": [
    {
      "type": "slack_message",
      "channel": "#dev-team",
      "message": "🌅 Good morning team! Time for our daily standup. Please share: \n• What you completed yesterday\n• What you''re working on today\n• Any blockers"
    }
  ]
}
```

### 3. Error Notifications
```javascript
// Trigger: Error webhook from monitoring system
// Action: Alert team in Slack

{
  "trigger": {
    "type": "webhook",
    "source": "monitoring"
  },
  "conditions": [
    {
      "field": "severity",
      "operator": "equals",
      "value": "critical"
    }
  ],
  "actions": [
    {
      "type": "slack_message",
      "channel": "#alerts",
      "message": "🚨 CRITICAL ERROR: {{error.message}}\nService: {{error.service}}\nTime: {{timestamp}}"
    }
  ]
}
```

## Advanced Features

### Dynamic Channel Creation
```javascript
{
  "action": {
    "type": "slack_create_channel",
    "name": "project-{{project.name}}",
    "description": "Project channel for {{project.name}}",
    "private": false
  }
}
```

### File Uploads
```javascript
{
  "action": {
    "type": "slack_upload_file",
    "channel": "#reports",
    "file_url": "{{report.download_url}}",
    "filename": "{{report.name}}.pdf",
    "title": "Weekly Report - {{date}}"
  }
}
```

### Interactive Messages
```javascript
{
  "action": {
    "type": "slack_interactive_message",
    "channel": "#approvals",
    "text": "New expense report requires approval",
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*Expense Report*\nAmount: ${{amount}}\nSubmitted by: {{user.name}}"
        }
      },
      {
        "type": "actions",
        "elements": [
          {
            "type": "button",
            "text": "Approve",
            "style": "primary",
            "action_id": "approve_expense"
          },
          {
            "type": "button",
            "text": "Reject",
            "style": "danger",
            "action_id": "reject_expense"
          }
        ]
      }
    ]
  }
}
```

## Troubleshooting

### Common Issues

#### "Missing Permissions" Error
```javascript
// Error: missing_scope
// Solution: Add required OAuth scopes in Slack App settings
Required scopes: chat:write, channels:read
```

#### "Channel Not Found" Error
```javascript
// Error: channel_not_found
// Solutions:
1. Verify channel name (use # for public, @ for users)
2. Check if bot is added to private channels
3. Ensure channel exists in workspace
```

#### "Invalid Auth" Error
```javascript
// Error: invalid_auth
// Solutions:
1. Regenerate bot token in Slack app settings
2. Update token in YusrAI platform credentials
3. Verify app is installed in correct workspace
```

### Debug Mode
Enable debug logging to troubleshoot issues:

```javascript
// Add to automation configuration
"debug": {
  "enabled": true,
  "log_requests": true,
  "log_responses": true
}
```

## Rate Limits

Slack has rate limits per workspace:
- **Tier 1**: 1 request per minute
- **Tier 2**: 20 requests per minute  
- **Tier 3**: 50+ requests per minute
- **Tier 4**: 100+ requests per minute

### Handling Rate Limits
```javascript
// YusrAI automatically handles rate limits with exponential backoff
// Monitor usage in automation logs
```

## Best Practices

### Message Formatting
- Use Slack''s mrkdwn formatting for rich text
- Keep messages concise and actionable
- Use threads for follow-up conversations
- Include relevant context and links

### Channel Management
- Use descriptive channel names
- Set clear channel purposes
- Archive inactive channels regularly
- Use private channels for sensitive information

### Bot Behavior
- Give your bot a clear, descriptive name
- Set a professional profile picture
- Configure appropriate presence status
- Respond to mentions and direct messages

[Next: Trello Integration →](trello-integration)',
'Complete guide to integrating Slack with YusrAI for team communication automation',
ARRAY['slack', 'integration', 'communication'], 1, true),

-- Troubleshooting Articles
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440005', 'Common Issues and Solutions', 'common-issues-solutions',
'# Common Issues and Solutions

This guide covers the most frequently encountered issues and their solutions when using YusrAI.

## Authentication Issues

### API Key Not Working

**Symptoms:**
- 401 Unauthorized errors
- "Invalid API token" messages
- Authentication failures

**Solutions:**

#### 1. Verify API Key Format
```javascript
// ❌ Incorrect format
"your_api_key_here"

// ✅ Correct format  
"YUSR_your_api_key_here"
```

#### 2. Check Authorization Header
```javascript
// ❌ Incorrect header
"Authorization": "your_key"

// ✅ Correct header
"Authorization": "Bearer YUSR_your_key"
```

#### 3. Regenerate API Key
```javascript
// If key is expired or corrupted:
Settings → Developer API → [Your Key] → Regenerate
```

### Permission Denied Errors

**Symptoms:**
- 403 Forbidden responses
- "insufficient permissions" messages

**Solutions:**

#### Check Key Permissions
```javascript
// Verify your API key has required permissions:
Settings → Developer API → [Your Key] → Edit Permissions

Required permissions for different operations:
- Read: View automations and data
- Write: Create/modify automations  
- Webhooks: Manage webhook endpoints
- AI Agents: Interact with agents
```

#### Verify Resource Ownership
```javascript
// Ensure you''re accessing your own resources
// Users can only access automations they created
```

## Automation Issues

### Automation Not Triggering

**Symptoms:**
- Automation exists but never executes
- No execution logs
- Trigger conditions not met

**Diagnostic Steps:**

#### 1. Check Automation Status
```javascript
// Verify automation is active
Automations → [Your Automation] → Status: Active ✓
```

#### 2. Test Trigger Manually
```javascript
// Use the test feature
Automations → [Your Automation] → Test Automation
```

#### 3. Review Trigger Configuration
```javascript
// Common trigger issues:

// Webhook triggers
- Verify webhook URL is correct
- Check webhook is receiving requests
- Validate request format matches expectations

// Schedule triggers  
- Confirm cron expression is valid
- Check timezone settings
- Verify schedule is in the future

// Platform triggers
- Ensure platform credentials are valid
- Check platform permissions
- Verify trigger event is supported
```

### Automation Failing During Execution

**Symptoms:**
- Automation starts but fails partway through
- Error messages in execution logs
- Partial completion of actions

**Diagnostic Steps:**

#### 1. Check Execution Logs
```javascript
// View detailed execution information
Automations → [Your Automation] → Runs → [Failed Run] → View Details
```

#### 2. Common Failure Causes
```javascript
// Platform credential issues
- Expired tokens
- Insufficient permissions
- Rate limiting

// Data formatting problems
- Invalid JSON in webhook payloads
- Missing required fields
- Data type mismatches

// Network connectivity
- API endpoints unreachable
- Timeout errors
- DNS resolution issues
```

#### 3. Debug Mode
```javascript
// Enable detailed logging
Automations → [Your Automation] → Settings → Debug Mode: ON
```

## Platform Integration Issues

### Slack Integration Problems

#### Bot Not Responding
```javascript
// Check bot permissions
Required OAuth scopes:
- chat:write (send messages)
- channels:read (read channels)
- users:read (read users)

// Verify bot is added to channels
Add bot to private channels manually
```

#### Message Formatting Issues
```javascript
// Use proper Slack markup
❌ "**bold text**"
✅ "*bold text*"

❌ "[link](url)"  
✅ "<url|link text>"
```

### Trello Integration Problems

#### Card Creation Failing
```javascript
// Check required permissions
- Read/write access to boards
- Valid board and list IDs
- Proper authentication token

// Verify board accessibility
Trello → Board → Settings → Permissions
```

#### Webhook Not Triggering
```javascript
// Trello webhook requirements
- Valid callback URL (must be HTTPS)
- Proper webhook registration
- Active Trello Power-Up (if required)
```

## API Issues

### Rate Limiting

**Symptoms:**
- 429 "Too Many Requests" errors
- Delayed API responses
- Intermittent failures

**Solutions:**

#### 1. Monitor Usage
```javascript
// Check current usage
Settings → Developer API → Usage Analytics
```

#### 2. Implement Backoff Strategy
```javascript
// Exponential backoff example
async function apiRequestWithBackoff(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get(''Retry-After'') || Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}
```

#### 3. Optimize Requests
```javascript
// Batch operations when possible
// Use appropriate API key type for your usage
// Cache responses when appropriate
```

### Webhook Delivery Issues

**Symptoms:**
- Webhooks not being received
- Delayed webhook delivery
- Duplicate webhook calls

**Solutions:**

#### 1. Verify Webhook Configuration
```javascript
// Check webhook settings
Settings → Webhooks → [Your Webhook] → Configuration

Required:
- Valid HTTPS URL
- Proper HTTP methods accepted
- Correct event types selected
```

#### 2. Test Webhook Endpoint
```javascript
// Use webhook testing tools
curl -X POST \
  -H "Content-Type: application/json" \
  -d ''{"test": "data"}'' \
  https://your-webhook-url.com/endpoint
```

#### 3. Check Webhook Logs
```javascript
// Monitor webhook delivery
Settings → Webhooks → [Your Webhook] → Delivery Logs
```

## AI Agent Issues

### Agent Not Responding

**Symptoms:**
- Agent receives messages but doesn''t respond
- Empty or generic responses
- Agent appears offline

**Solutions:**

#### 1. Check Agent Configuration
```javascript
// Verify agent settings
AI Agents → [Your Agent] → Configuration

Required fields:
- Agent name and role
- Clear instructions
- Valid API key (if using external LLM)
```

#### 2. Test Agent Directly
```javascript
// Use the agent chat interface
AI Agents → [Your Agent] → Chat → Send test message
```

#### 3. Review Agent Memory
```javascript
// Check agent context and memory
AI Agents → [Your Agent] → Memory → Recent conversations
```

### Poor Agent Responses

**Symptoms:**
- Irrelevant or unhelpful responses
- Agent not following instructions
- Inconsistent behavior

**Solutions:**

#### 1. Improve Agent Instructions
```javascript
// Make instructions more specific
❌ "Help users with questions"
✅ "You are a customer support agent for an e-commerce store. 
    Help customers with order inquiries, returns, and product questions.
    Always be polite and provide specific solutions."
```

#### 2. Provide Better Context
```javascript
// Include relevant context in agent memory
- Company information
- Product details  
- Common procedures
- FAQ responses
```

## Getting Help

### Using Help Chat
```javascript
// Access AI-powered support
Click the chat icon → Describe your issue → Get instant help
```

### Escalation Process
```javascript
// For complex issues:
1. Try Help Chat first
2. Check this documentation
3. Review automation logs
4. Contact support with:
   - Automation ID
   - Error messages
   - Steps to reproduce
```

### Community Support
```javascript
// Join our community
- Discord server for real-time help
- GitHub issues for bug reports
- Feature requests and feedback
```

[Next: Performance Optimization →](performance-optimization)',
'Comprehensive troubleshooting guide for common YusrAI issues and their solutions',
ARRAY['troubleshooting', 'debugging', 'errors'], 1, true)

ON CONFLICT (id) DO NOTHING;
