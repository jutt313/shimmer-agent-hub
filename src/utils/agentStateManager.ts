
interface AgentDecision {
  name: string;
  status: 'pending' | 'added' | 'dismissed';
  agentData: any;
}

class AgentStateManager {
  private static instance: AgentStateManager;
  private agentDecisions: Map<string, AgentDecision> = new Map();
  private automationId: string | null = null;

  static getInstance(): AgentStateManager {
    if (!AgentStateManager.instance) {
      AgentStateManager.instance = new AgentStateManager();
    }
    return AgentStateManager.instance;
  }

  setAutomationId(id: string) {
    this.automationId = id;
  }

  addAgent(agentName: string, agentData: any) {
    console.log(`🤖 Adding agent decision: ${agentName}`);
    this.agentDecisions.set(agentName, {
      name: agentName,
      status: 'added',
      agentData
    });
  }

  dismissAgent(agentName: string) {
    console.log(`❌ Dismissing agent: ${agentName}`);
    this.agentDecisions.set(agentName, {
      name: agentName,
      status: 'dismissed',
      agentData: null
    });
  }

  getAgentStatus(agentName: string): 'pending' | 'added' | 'dismissed' {
    return this.agentDecisions.get(agentName)?.status || 'pending';
  }

  getAllDecisions(): AgentDecision[] {
    return Array.from(this.agentDecisions.values());
  }

  getAddedAgents(): AgentDecision[] {
    return this.getAllDecisions().filter(d => d.status === 'added');
  }

  getDismissedAgents(): string[] {
    return this.getAllDecisions()
      .filter(d => d.status === 'dismissed')
      .map(d => d.name);
  }

  hasDecisionFor(agentName: string): boolean {
    return this.agentDecisions.has(agentName);
  }

  clearDecisions() {
    this.agentDecisions.clear();
  }

  // Generate status summary for AI
  getStatusSummary(): string {
    const added = this.getAddedAgents();
    const dismissed = this.getDismissedAgents();
    
    let summary = '';
    if (added.length > 0) {
      summary += `Added Agents: ${added.map(a => a.name).join(', ')}. `;
    }
    if (dismissed.length > 0) {
      summary += `Dismissed Agents: ${dismissed.join(', ')}. `;
    }
    
    if (summary) {
      summary += 'DO NOT recommend these agents again. ';
    }
    
    return summary;
  }
}

export const agentStateManager = AgentStateManager.getInstance();
