
interface AgentData {
  agent_name: string;
  agent_role: string;
  agent_goal: string;
  agent_rules?: string;
  agent_memory?: any;
  llm_provider: string;
  model: string;
}

interface AutomationContext {
  id: string;
  name?: string;
  description?: string;
  steps?: any[];
  currentStep?: number;
  variables?: Record<string, any>;
}

export class DynamicAgentPromptBuilder {
  /**
   * Generate comprehensive system prompt for AI agents
   */
  static generateSystemPrompt(agent: AgentData, automationContext?: AutomationContext): string {
    const basePrompt = `You are ${agent.agent_name}, an AI agent operating within the YusrAI automation platform.

**AGENT IDENTITY:**
- Name: ${agent.agent_name}
- Role: ${agent.agent_role}
- Primary Goal: ${agent.agent_goal}
- Operating Rules: ${agent.agent_rules || 'Follow ethical AI guidelines and be helpful'}

**MEMORY CONTEXT:**
${this.formatMemoryContext(agent.agent_memory)}

**AUTOMATION CONTEXT:**
${this.formatAutomationContext(automationContext)}

**EXECUTION INSTRUCTIONS:**
1. Always respond according to your defined role and goal
2. Follow your operating rules strictly
3. Use memory context to maintain consistency
4. Be professional, accurate, and helpful
5. Focus on your specific purpose within the automation workflow

**CURRENT OPERATION MODE:** ${automationContext ? 'AUTOMATION_EXECUTION' : 'STANDALONE_TESTING'}

**RESPONSE GUIDELINES:**
- Keep responses focused and relevant to your role
- Use your memory to provide context-aware responses
- If uncertain, ask clarifying questions
- Always maintain your agent personality and purpose`;

    return basePrompt;
  }

  /**
   * Generate test prompt for agent validation
   */
  static generateTestPrompt(agent: AgentData): string {
    return `Hello ${agent.agent_name}! This is a system test to verify your configuration and capabilities.

Please respond by:
1. Confirming your identity and role
2. Stating your primary goal
3. Mentioning any key rules you follow
4. Demonstrating your understanding of your purpose

This helps ensure you're properly configured and ready for automation tasks.`;
  }

  /**
   * Generate chat prompt for user interaction
   */
  static generateChatPrompt(agent: AgentData, userMessage: string, chatHistory?: any[]): string {
    let historyContext = '';
    if (chatHistory && chatHistory.length > 0) {
      historyContext = '\n**RECENT CONVERSATION:**\n' + 
        chatHistory.slice(-5).map(msg => 
          `${msg.isBot ? 'You' : 'User'}: ${msg.text}`
        ).join('\n') + '\n';
    }

    return `${historyContext}
**CURRENT USER MESSAGE:** ${userMessage}

Please respond as ${agent.agent_name} according to your role as ${agent.agent_role}. 
Keep your response helpful, focused, and aligned with your goal: ${agent.agent_goal}`;
  }

  private static formatMemoryContext(memory: any): string {
    if (!memory) {
      return 'No previous memory or context available. This is a fresh start.';
    }

    if (typeof memory === 'string') {
      return `Previous context: ${memory}`;
    }

    if (typeof memory === 'object') {
      return `Memory context: ${JSON.stringify(memory, null, 2)}`;
    }

    return 'Memory context available but format unclear.';
  }

  private static formatAutomationContext(context?: AutomationContext): string {
    if (!context) {
      return 'Operating in standalone mode - not currently part of an active automation workflow.';
    }

    return `You are part of automation "${context.name || 'Unnamed Automation'}"
- Automation ID: ${context.id}
- Description: ${context.description || 'No description provided'}
- Total Steps: ${context.steps?.length || 'Unknown'}
- Current Step: ${context.currentStep ? `Step ${context.currentStep}` : 'Not specified'}
- Available Variables: ${context.variables ? Object.keys(context.variables).join(', ') : 'None'}

Your role is to execute tasks according to your defined goal and rules within this automation context.`;
  }

  /**
   * Update agent memory with new context
   */
  static updateMemoryContext(
    currentMemory: any, 
    newContext: { 
      interaction?: string; 
      outcome?: string; 
      timestamp?: Date;
      metadata?: any;
    }
  ): any {
    const memoryEntry = {
      timestamp: newContext.timestamp || new Date(),
      interaction: newContext.interaction,
      outcome: newContext.outcome,
      metadata: newContext.metadata
    };

    if (!currentMemory) {
      return {
        interactions: [memoryEntry],
        updated: new Date(),
        version: '1.0'
      };
    }

    if (typeof currentMemory === 'string') {
      return {
        legacy_memory: currentMemory,
        interactions: [memoryEntry],
        updated: new Date(),
        version: '1.0'
      };
    }

    return {
      ...currentMemory,
      interactions: [...(currentMemory.interactions || []), memoryEntry].slice(-10), // Keep last 10
      updated: new Date(),
      version: (parseFloat(currentMemory.version || '1.0') + 0.1).toFixed(1)
    };
  }
}
