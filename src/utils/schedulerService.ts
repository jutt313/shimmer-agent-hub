import { supabase } from '@/integrations/supabase/client';
import { AutomationBlueprint } from '@/types/automation';

// Automation scheduler service for cron-based triggers
export interface ScheduleConfig {
  automationId: string;
  cronExpression: string;
  timezone: string;
  isActive: boolean;
  nextRun?: Date;
  lastRun?: Date;
}

export class AutomationScheduler {
  private schedules = new Map<string, ScheduleConfig>();
  private timers = new Map<string, NodeJS.Timeout>();

  constructor() {
    console.log('🕒 AutomationScheduler initialized');
  }

  addSchedule(config: ScheduleConfig): void {
    console.log(`📅 Adding schedule for automation ${config.automationId}:`, config.cronExpression);
    
    this.schedules.set(config.automationId, config);
    
    if (config.isActive) {
      this.scheduleNextExecution(config);
    }
  }

  removeSchedule(automationId: string): void {
    console.log(`🗑️ Removing schedule for automation ${automationId}`);
    
    const timer = this.timers.get(automationId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(automationId);
    }
    
    this.schedules.delete(automationId);
  }

  updateSchedule(automationId: string, updates: Partial<ScheduleConfig>): void {
    const existing = this.schedules.get(automationId);
    if (!existing) {
      throw new Error(`Schedule not found for automation: ${automationId}`);
    }

    const updated = { ...existing, ...updates };
    this.schedules.set(automationId, updated);
    
    // Reschedule if cron expression or active status changed
    if (updates.cronExpression || updates.isActive !== undefined) {
      this.removeSchedule(automationId);
      if (updated.isActive) {
        this.scheduleNextExecution(updated);
      }
    }
  }

  private scheduleNextExecution(config: ScheduleConfig): void {
    const nextRun = this.calculateNextRun(config.cronExpression, config.timezone);
    
    if (!nextRun) {
      console.error(`❌ Invalid cron expression for automation ${config.automationId}: ${config.cronExpression}`);
      return;
    }

    const delay = nextRun.getTime() - Date.now();
    
    if (delay <= 0) {
      // If the calculated time is in the past, schedule for the next valid time
      const futureRun = this.calculateNextRun(config.cronExpression, config.timezone, new Date(Date.now() + 60000));
      if (futureRun) {
        this.scheduleExecution(config, futureRun);
      }
    } else {
      this.scheduleExecution(config, nextRun);
    }
  }

  private scheduleExecution(config: ScheduleConfig, runTime: Date): void {
    const delay = runTime.getTime() - Date.now();
    
    console.log(`⏰ Scheduling automation ${config.automationId} to run at ${runTime.toISOString()} (in ${Math.round(delay / 1000)}s)`);
    
    const timer = setTimeout(async () => {
      console.log(`🚀 Executing scheduled automation ${config.automationId}`);
      
      try {
        await this.executeAutomation(config.automationId);
        
        // Update last run time
        const updatedConfig = { ...config, lastRun: new Date() };
        this.schedules.set(config.automationId, updatedConfig);
        
        // Schedule next execution
        this.scheduleNextExecution(updatedConfig);
        
      } catch (error) {
        console.error(`❌ Failed to execute scheduled automation ${config.automationId}:`, error);
        
        // Still schedule next execution even if this one failed
        this.scheduleNextExecution(config);
      }
    }, delay);
    
    this.timers.set(config.automationId, timer);
  }

  private async executeAutomation(automationId: string): Promise<void> {
    // In a real implementation, this would trigger the automation execution
    // For now, we'll use the existing execute-automation edge function
    try {
      const { data, error } = await supabase.functions.invoke('execute-automation', {
        body: {
          automation_id: automationId,
          trigger_data: {
            type: 'scheduled',
            timestamp: new Date().toISOString()
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log(`✅ Scheduled automation ${automationId} executed successfully:`, data);
    } catch (error) {
      console.error(`💥 Scheduled automation ${automationId} execution failed:`, error);
      throw error;
    }
  }

  private calculateNextRun(cronExpression: string, timezone: string, fromDate?: Date): Date | null {
    // Simple cron parser - in production, use a library like 'node-cron' or 'cron-parser'
    try {
      const now = fromDate || new Date();
      const parts = cronExpression.split(' ');
      
      if (parts.length !== 5) {
        throw new Error('Invalid cron format. Expected: minute hour day month weekday');
      }

      const [minute, hour, day, month, weekday] = parts;
      
      // For demo purposes, implement basic parsing for common patterns
      if (cronExpression === '0 9 * * *') {
        // Daily at 9 AM
        const next = new Date(now);
        next.setHours(9, 0, 0, 0);
        if (next <= now) {
          next.setDate(next.getDate() + 1);
        }
        return next;
      } else if (cronExpression === '0 * * * *') {
        // Every hour
        const next = new Date(now);
        next.setMinutes(0, 0, 0);
        next.setHours(next.getHours() + 1);
        return next;
      } else if (cronExpression === '*/5 * * * *') {
        // Every 5 minutes
        const next = new Date(now);
        const currentMinutes = next.getMinutes();
        const nextMinutes = Math.ceil(currentMinutes / 5) * 5;
        next.setMinutes(nextMinutes, 0, 0);
        if (nextMinutes >= 60) {
          next.setHours(next.getHours() + 1);
          next.setMinutes(0, 0, 0);
        }
        return next;
      }
      
      // For complex expressions, you would use a proper cron library
      console.warn(`⚠️ Complex cron expression not supported in demo: ${cronExpression}`);
      return null;
      
    } catch (error) {
      console.error('Failed to parse cron expression:', error);
      return null;
    }
  }

  getScheduleStatus(automationId: string): ScheduleConfig | null {
    return this.schedules.get(automationId) || null;
  }

  getAllSchedules(): ScheduleConfig[] {
    return Array.from(this.schedules.values());
  }

  startScheduler(): void {
    console.log('🎯 AutomationScheduler started');
    
    // In a real implementation, you would load existing schedules from the database
    this.loadSchedulesFromDatabase();
  }

  stopScheduler(): void {
    console.log('🛑 AutomationScheduler stopped');
    
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }

  private async loadSchedulesFromDatabase(): Promise<void> {
    try {
      // Load scheduled automations from the database
      const { data: automations, error } = await supabase
        .from('automations')
        .select('id, automation_blueprint')
        .eq('status', 'active');

      if (error) {
        console.error('Failed to load automations for scheduling:', error);
        return;
      }

      automations?.forEach(automation => {
        try {
          // Properly cast the blueprint to our expected type
          const blueprint = automation.automation_blueprint as AutomationBlueprint;
          
          if (blueprint?.trigger?.type === 'scheduled' && blueprint.trigger.cron_expression) {
            const scheduleConfig: ScheduleConfig = {
              automationId: automation.id,
              cronExpression: blueprint.trigger.cron_expression,
              timezone: 'UTC', // Default timezone
              isActive: true
            };
            
            this.addSchedule(scheduleConfig);
          }
        } catch (parseError) {
          console.error(`Failed to parse blueprint for automation ${automation.id}:`, parseError);
        }
      });

      console.log(`📊 Loaded ${this.schedules.size} scheduled automations`);
    } catch (error) {
      console.error('Error loading schedules from database:', error);
    }
  }
}

// Global scheduler instance
export const globalScheduler = new AutomationScheduler();

// Auto-start the scheduler when the module is imported
if (typeof window !== 'undefined') {
  // Only start in browser environment
  globalScheduler.startScheduler();
}
