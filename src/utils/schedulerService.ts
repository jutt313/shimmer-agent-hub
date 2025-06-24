
import { supabase } from '@/integrations/supabase/client';
import { globalErrorLogger } from '@/utils/errorLogger';

interface ScheduledAutomation {
  id: string;
  automation_id: string;
  user_id: string;
  cron_expression: string;
  next_run: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class AutomationScheduler {
  private static instance: AutomationScheduler;
  private isRunning = false;
  private checkInterval: number | null = null;

  private constructor() {}

  static getInstance(): AutomationScheduler {
    if (!AutomationScheduler.instance) {
      AutomationScheduler.instance = new AutomationScheduler();
    }
    return AutomationScheduler.instance;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      globalErrorLogger.log('WARN', 'Scheduler already running');
      return;
    }

    this.isRunning = true;
    globalErrorLogger.log('INFO', 'Automation scheduler started');

    // Check for due automations every minute
    this.checkInterval = window.setInterval(() => {
      this.checkAndExecuteDueAutomations();
    }, 60000);

    // Initial check
    await this.checkAndExecuteDueAutomations();
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
    globalErrorLogger.log('INFO', 'Automation scheduler stopped');
  }

  async scheduleAutomation(
    automationId: string,
    userId: string,
    cronExpression: string
  ): Promise<boolean> {
    try {
      const nextRun = this.calculateNextRun(cronExpression);
      
      if (!nextRun) {
        throw new Error('Invalid cron expression');
      }

      // Use Supabase RPC to handle scheduling in the database
      const { error } = await supabase.rpc('schedule_automation', {
        p_automation_id: automationId,
        p_user_id: userId,
        p_cron_expression: cronExpression,
        p_next_run: nextRun.toISOString()
      });

      if (error) throw error;

      globalErrorLogger.log('INFO', 'Automation scheduled successfully', {
        automationId,
        userId,
        cronExpression,
        nextRun: nextRun.toISOString()
      });

      return true;
    } catch (error: any) {
      globalErrorLogger.log('ERROR', 'Failed to schedule automation', {
        automationId,
        userId,
        cronExpression,
        error: error.message
      });
      return false;
    }
  }

  async unscheduleAutomation(automationId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('unschedule_automation', {
        p_automation_id: automationId,
        p_user_id: userId
      });

      if (error) throw error;

      globalErrorLogger.log('INFO', 'Automation unscheduled successfully', {
        automationId,
        userId
      });

      return true;
    } catch (error: any) {
      globalErrorLogger.log('ERROR', 'Failed to unschedule automation', {
        automationId,
        userId,
        error: error.message
      });
      return false;
    }
  }

  private async checkAndExecuteDueAutomations(): Promise<void> {
    try {
      const { data: dueAutomations, error } = await supabase.rpc('get_due_automations');

      if (error) throw error;

      if (!dueAutomations || dueAutomations.length === 0) {
        return;
      }

      globalErrorLogger.log('INFO', `Found ${dueAutomations.length} due automations`);

      for (const automation of dueAutomations) {
        await this.executeDueAutomation(automation);
      }
    } catch (error: any) {
      globalErrorLogger.log('ERROR', 'Failed to check due automations', {
        error: error.message
      });
    }
  }

  private async executeDueAutomation(automation: ScheduledAutomation): Promise<void> {
    try {
      globalErrorLogger.log('INFO', 'Executing scheduled automation', {
        automationId: automation.automation_id,
        userId: automation.user_id
      });

      // Execute the automation
      const { error } = await supabase.functions.invoke('execute-automation', {
        body: {
          automation_id: automation.automation_id,
          trigger_data: {
            trigger_type: 'scheduled',
            scheduled_time: new Date().toISOString()
          }
        }
      });

      if (error) {
        throw error;
      }

      // Update the next run time
      const nextRun = this.calculateNextRun(automation.cron_expression);
      if (nextRun) {
        await supabase.rpc('update_next_run', {
          p_automation_id: automation.automation_id,
          p_next_run: nextRun.toISOString()
        });
      }

      globalErrorLogger.log('INFO', 'Scheduled automation executed successfully', {
        automationId: automation.automation_id
      });

    } catch (error: any) {
      globalErrorLogger.log('ERROR', 'Failed to execute scheduled automation', {
        automationId: automation.automation_id,
        error: error.message
      });
    }
  }

  private calculateNextRun(cronExpression: string): Date | null {
    try {
      const now = new Date();
      
      // Enhanced cron parser that handles standard expressions
      const parts = cronExpression.trim().split(/\s+/);
      
      if (parts.length !== 5) {
        throw new Error('Invalid cron expression format');
      }

      const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
      
      const next = new Date(now);
      next.setSeconds(0);
      next.setMilliseconds(0);

      // Parse minute
      if (minute !== '*') {
        const minuteValue = parseInt(minute);
        if (isNaN(minuteValue) || minuteValue < 0 || minuteValue > 59) {
          throw new Error('Invalid minute value');
        }
        next.setMinutes(minuteValue);
      }

      // Parse hour
      if (hour !== '*') {
        const hourValue = parseInt(hour);
        if (isNaN(hourValue) || hourValue < 0 || hourValue > 23) {
          throw new Error('Invalid hour value');
        }
        next.setHours(hourValue);
      }

      // If the calculated time is in the past, move to next occurrence
      if (next <= now) {
        if (minute !== '*' && hour !== '*') {
          // Specific time - move to next day
          next.setDate(next.getDate() + 1);
        } else if (minute !== '*') {
          // Specific minute - move to next hour
          next.setHours(next.getHours() + 1);
        } else {
          // Every minute - move to next minute
          next.setMinutes(next.getMinutes() + 1);
        }
      }

      return next;
    } catch (error: any) {
      globalErrorLogger.log('ERROR', 'Failed to calculate next run', {
        cronExpression,
        error: error.message
      });
      return null;
    }
  }

  async getScheduledAutomations(userId: string): Promise<ScheduledAutomation[]> {
    try {
      const { data, error } = await supabase
        .from('scheduled_automations')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('next_run', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      globalErrorLogger.log('ERROR', 'Failed to get scheduled automations', {
        userId,
        error: error.message
      });
      return [];
    }
  }
}

export const globalScheduler = AutomationScheduler.getInstance();
