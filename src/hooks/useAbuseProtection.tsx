
import { useState, useCallback } from 'react';
import { globalAbusePreventionMiddleware } from '@/utils/abusePreventionMiddleware';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { globalErrorLogger } from '@/utils/errorLogger';

interface UseAbuseProtectionOptions {
  action: string;
  showToastOnBlock?: boolean;
  onBlocked?: (reason: string) => void;
}

export function useAbuseProtection(options: UseAbuseProtectionOptions) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [requiresCaptcha, setRequiresCaptcha] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const checkPermission = useCallback(async (): Promise<boolean> => {
    try {
      const result = await globalAbusePreventionMiddleware.checkRequest(
        user?.id || null,
        options.action
      );

      if (!result.allowed) {
        setIsBlocked(true);
        setRequiresCaptcha(result.requiresCaptcha || false);

        globalErrorLogger.log('WARN', 'Request blocked by abuse prevention', {
          userId: user?.id,
          action: options.action,
          reason: result.reason
        });

        if (options.showToastOnBlock !== false) {
          toast({
            title: "Request Blocked",
            description: result.reason || "Too many requests. Please try again later.",
            variant: "destructive",
            duration: 5000,
          });
        }

        options.onBlocked?.(result.reason || 'Request blocked');
        return false;
      }

      setIsBlocked(false);
      setRequiresCaptcha(false);
      return true;
    } catch (error: any) {
      globalErrorLogger.log('ERROR', 'Abuse protection check failed', {
        error: error.message,
        action: options.action,
        userId: user?.id
      });
      
      // Fail open - allow the action if check fails
      return true;
    }
  }, [user?.id, options, toast]);

  const executeWithProtection = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T | null> => {
    const allowed = await checkPermission();
    
    if (!allowed) {
      return null;
    }

    try {
      return await operation();
    } catch (error: any) {
      globalErrorLogger.log('ERROR', 'Protected operation failed', {
        error: error.message,
        action: options.action,
        userId: user?.id
      });
      throw error;
    }
  }, [checkPermission, options.action, user?.id]);

  const resetBlock = useCallback(() => {
    setIsBlocked(false);
    setRequiresCaptcha(false);
  }, []);

  return {
    isBlocked,
    requiresCaptcha,
    checkPermission,
    executeWithProtection,
    resetBlock,
    isSuspicious: user?.id ? globalAbusePreventionMiddleware.isUserSuspicious(user.id) : false
  };
}
