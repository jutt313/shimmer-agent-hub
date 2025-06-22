
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Codebase knowledge for context
const CODEBASE_CONTEXT = `
YusrAI Automation Tool - File Structure and Functionality:

FRONTEND FILES:
- src/pages/Index.tsx: Main dashboard with automation overview
- src/pages/Automations.tsx: Automation listing and management
- src/pages/AutomationDetail.tsx: Individual automation configuration
- src/pages/KnowledgeAdmin.tsx: Universal memory system management
- src/components/AutomationDashboard.tsx: Performance metrics and charts
- src/components/PlatformCredentialForm.tsx: Credential management UI
- src/components/AIAgentForm.tsx: AI agent configuration
- src/components/ExecuteAutomationButton.tsx: Automation execution interface
- src/components/KnowledgeChat.tsx: AI-powered knowledge assistant
- src/components/ErrorIndicator.tsx: Floating error indicator button
- src/components/ErrorAnalysisModal.tsx: Error analysis and chat interface
- src/components/ErrorBoundary.tsx: React error boundary component

BACKEND EDGE FUNCTIONS:
- execute-automation: Runs automation workflows with API integrations
- test-credential: Tests platform credentials and AI agents
- chat-ai: General AI chat functionality
- knowledge-ai-chat: Knowledge system AI assistant
- seed-knowledge-store: Populates knowledge database
- error-analyzer: Analyzes errors and provides AI-powered solutions

DATABASE TABLES:
- automations: Stores automation blueprints and configurations
- platform_credentials: User API keys and authentication tokens
- ai_agents: AI agent configurations and settings
- automation_runs: Execution logs and results
- universal_knowledge_store: System knowledge and patterns
- credential_test_results: Test results for credentials
- error_conversations: Stores error analysis conversations

COMMON ERROR PATTERNS:
1. API Key Issues: Invalid or missing credentials for platforms
2. Authentication Errors: Supabase auth problems or expired tokens
3. Network Errors: Failed API calls to external platforms
4. Configuration Errors: Invalid automation blueprints or settings
5. Permission Errors: Insufficient access rights for operations
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { error, stackTrace, userAction, fileName, userId, conversationId, chatMessage, isNewError = true } = await req.json();

    if (!error && !chatMessage) {
      throw new Error('Error information or chat message is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    let conversationRecord = null;
    let currentConversation = [];

    // Handle existing conversation or create new one
    if (conversationId && !isNewError) {
      // Get existing conversation
      const { data: existingConv } = await supabase
        .from('error_conversations')
        .select('*')
        .eq('id', conversationId)
        .single();
      
      if (existingConv) {
        conversationRecord = existingConv;
        currentConversation = existingConv.conversation_history || [];
      }
    } else if (isNewError) {
      // Create new conversation for new error
      const { data: newConv, error: createError } = await supabase
        .from('error_conversations')
        .insert({
          user_id: userId,
          error_message: error,
          stack_trace: stackTrace,
          file_name: fileName,
          user_action: userAction,
          conversation_history: []
        })
        .select('*')
        .single();

      if (createError) throw createError;
      conversationRecord = newConv;
    }

    // Prepare the prompt based on whether it's initial analysis or follow-up chat
    let analysisPrompt;
    let systemMessage = 'You are a helpful technical assistant for the YusrAI Automation Tool. Provide clear, actionable solutions to errors.';

    if (isNewError) {
      // Initial error analysis
      analysisPrompt = `
You are an expert developer for the YusrAI Automation Tool. Analyze this error and provide a helpful solution.

CODEBASE CONTEXT:
${CODEBASE_CONTEXT}

ERROR DETAILS:
- Error Message: ${error}
- Stack Trace: ${stackTrace || 'Not provided'}
- File: ${fileName || 'Unknown'}
- User Action: ${userAction || 'Unknown'}

Please provide:
1. A clear explanation of what caused this error
2. Step-by-step solution to fix it
3. Prevention tips for the future
4. If it's a common issue, mention similar patterns

Keep your response helpful, clear, and actionable. Focus on practical solutions.
`;
    } else {
      // Follow-up chat message
      const conversationHistory = currentConversation.map(msg => 
        `${msg.role}: ${msg.content}`
      ).join('\n');

      analysisPrompt = `
You are helping with an ongoing error analysis. Here's the context:

ORIGINAL ERROR:
- Error Message: ${conversationRecord?.error_message}
- Stack Trace: ${conversationRecord?.stack_trace || 'Not provided'}
- File: ${conversationRecord?.file_name || 'Unknown'}

CONVERSATION HISTORY:
${conversationHistory}

USER'S NEW QUESTION: ${chatMessage}

Please provide a helpful response based on the error context and conversation history.
`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemMessage
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResult = await response.json();
    const analysis = aiResult.choices[0].message.content;

    // Update conversation history
    if (isNewError) {
      currentConversation.push({
        role: 'assistant',
        content: analysis,
        timestamp: new Date().toISOString()
      });
    } else {
      currentConversation.push({
        role: 'user',
        content: chatMessage,
        timestamp: new Date().toISOString()
      });
      currentConversation.push({
        role: 'assistant',
        content: analysis,
        timestamp: new Date().toISOString()
      });
    }

    // Update conversation in database
    if (conversationRecord) {
      await supabase
        .from('error_conversations')
        .update({
          conversation_history: currentConversation,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationRecord.id);
    }

    // Store in knowledge base for future reference
    if (isNewError) {
      await supabase
        .from('universal_knowledge_store')
        .insert({
          category: 'error_solutions',
          title: `Error Solution: ${error.substring(0, 100)}`,
          summary: `Automated solution for error in ${fileName || 'unknown file'}`,
          details: {
            original_error: error,
            stack_trace: stackTrace,
            file_name: fileName,
            user_action: userAction,
            solution: analysis,
            error_type: categorizeError(error)
          },
          tags: ['error_analysis', 'automated_solution', fileName?.toLowerCase() || 'unknown'],
          priority: 8,
          source_type: 'error_analyzer'
        });
    }

    return new Response(JSON.stringify({
      success: true,
      analysis: analysis,
      conversationId: conversationRecord?.id,
      category: categorizeError(error || conversationRecord?.error_message || 'general'),
      conversationHistory: currentConversation
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error analysis failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      fallbackSolution: 'Please check your configuration and try again. If the issue persists, contact support.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function categorizeError(errorMessage: string): string {
  const error = errorMessage.toLowerCase();
  
  if (error.includes('api key') || error.includes('unauthorized') || error.includes('authentication')) {
    return 'authentication';
  } else if (error.includes('network') || error.includes('fetch') || error.includes('connection')) {
    return 'network';
  } else if (error.includes('permission') || error.includes('forbidden')) {
    return 'permissions';
  } else if (error.includes('syntax') || error.includes('parse')) {
    return 'syntax';
  } else if (error.includes('not found') || error.includes('404')) {
    return 'not_found';
  } else {
    return 'general';
  }
}
