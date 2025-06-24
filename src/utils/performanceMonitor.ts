
// Performance monitoring and metrics collection
export interface StepMetrics {
  stepId: string;
  stepName: string;
  executionTimeMs: number;
  inputDataSize: number;
  outputDataSize: number;
  success: boolean;
  errorMessage?: string;
  timestamp: string;
}

export interface AutomationMetrics {
  automationId: string;
  runId: string;
  totalExecutionTimeMs: number;
  stepsExecuted: number;
  stepsSucceeded: number;
  stepsFailed: number;
  totalDataProcessed: number;
  estimatedCost: number;
  stepMetrics: StepMetrics[];
  timestamp: string;
}

export class PerformanceMonitor {
  private metrics = new Map<string, AutomationMetrics>();
  private stepTimers = new Map<string, number>();

  startStepTimer(stepId: string): void {
    this.stepTimers.set(stepId, Date.now());
  }

  endStepTimer(stepId: string): number {
    const startTime = this.stepTimers.get(stepId);
    if (!startTime) {
      console.warn(`No start timer found for step: ${stepId}`);
      return 0;
    }
    
    const duration = Date.now() - startTime;
    this.stepTimers.delete(stepId);
    return duration;
  }

  recordStepMetrics(
    runId: string,
    stepId: string,
    stepName: string,
    success: boolean,
    inputData?: any,
    outputData?: any,
    errorMessage?: string
  ): void {
    const executionTime = this.endStepTimer(stepId);
    const inputSize = this.calculateDataSize(inputData);
    const outputSize = this.calculateDataSize(outputData);

    const stepMetric: StepMetrics = {
      stepId,
      stepName,
      executionTimeMs: executionTime,
      inputDataSize: inputSize,
      outputDataSize: outputSize,
      success,
      errorMessage,
      timestamp: new Date().toISOString()
    };

    // Get or create automation metrics
    let automationMetrics = this.metrics.get(runId);
    if (!automationMetrics) {
      automationMetrics = {
        automationId: '', // Will be set later
        runId,
        totalExecutionTimeMs: 0,
        stepsExecuted: 0,
        stepsSucceeded: 0,
        stepsFailed: 0,
        totalDataProcessed: 0,
        estimatedCost: 0,
        stepMetrics: [],
        timestamp: new Date().toISOString()
      };
      this.metrics.set(runId, automationMetrics);
    }

    // Update metrics
    automationMetrics.stepMetrics.push(stepMetric);
    automationMetrics.stepsExecuted++;
    automationMetrics.totalExecutionTimeMs += executionTime;
    automationMetrics.totalDataProcessed += inputSize + outputSize;
    
    if (success) {
      automationMetrics.stepsSucceeded++;
    } else {
      automationMetrics.stepsFailed++;
    }

    console.log(`📊 Step metrics recorded for ${stepName}: ${executionTime}ms, Success: ${success}`);
  }

  calculateAICost(provider: string, model: string, inputTokens: number, outputTokens: number): number {
    // Rough cost estimation based on common pricing (as of 2024)
    const pricing: Record<string, Record<string, { input: number; output: number }>> = {
      openai: {
        'gpt-4': { input: 0.03 / 1000, output: 0.06 / 1000 },
        'gpt-4-turbo': { input: 0.01 / 1000, output: 0.03 / 1000 },
        'gpt-3.5-turbo': { input: 0.0005 / 1000, output: 0.0015 / 1000 }
      },
      anthropic: {
        'claude-3': { input: 0.008 / 1000, output: 0.024 / 1000 }
      }
    };

    const providerPricing = pricing[provider.toLowerCase()];
    if (!providerPricing) return 0;

    const modelPricing = providerPricing[model.toLowerCase()];
    if (!modelPricing) return 0;

    return (inputTokens * modelPricing.input) + (outputTokens * modelPricing.output);
  }

  private calculateDataSize(data: any): number {
    if (!data) return 0;
    
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return 0;
    }
  }

  getMetrics(runId: string): AutomationMetrics | null {
    return this.metrics.get(runId) || null;
  }

  getAllMetrics(): AutomationMetrics[] {
    return Array.from(this.metrics.values());
  }

  clearMetrics(runId?: string): void {
    if (runId) {
      this.metrics.delete(runId);
    } else {
      this.metrics.clear();
    }
  }

  generatePerformanceReport(runId: string): string {
    const metrics = this.metrics.get(runId);
    if (!metrics) return 'No metrics found for this run';

    const successRate = (metrics.stepsSucceeded / metrics.stepsExecuted) * 100;
    const avgStepTime = metrics.totalExecutionTimeMs / metrics.stepsExecuted;

    return `
Performance Report for Run ${runId}:
- Total Execution Time: ${metrics.totalExecutionTimeMs}ms
- Steps Executed: ${metrics.stepsExecuted}
- Success Rate: ${successRate.toFixed(2)}%
- Average Step Time: ${avgStepTime.toFixed(2)}ms
- Data Processed: ${(metrics.totalDataProcessed / 1024).toFixed(2)} KB
- Estimated Cost: $${metrics.estimatedCost.toFixed(4)}
    `.trim();
  }
}

// Global performance monitor instance
export const globalPerformanceMonitor = new PerformanceMonitor();
