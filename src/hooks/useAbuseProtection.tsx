
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface AbuseMetrics {
  suspiciousIPs: Set<string>;
  failedAttempts: Map<string, number>;
  blockedUsers: Set<string>;
  lastCleanup: number;
}

export const useAbuseProtection = () => {
  const [metrics, setMetrics] = useState<AbuseMetrics>({
    suspiciousIPs: new Set(),
    failedAttempts: new Map(),
    blockedUsers: new Set(),
    lastCleanup: Date.now(),
  });
  const { toast } = useToast();

  const isBlocked = useCallback((identifier: string): boolean => {
    return metrics.blockedUsers.has(identifier) || 
           metrics.suspiciousIPs.has(identifier) ||
           (metrics.failedAttempts.get(identifier) || 0) >= 5;
  }, [metrics]);

  const recordFailedAttempt = useCallback((identifier: string) => {
    setMetrics(prev => {
      const newFailedAttempts = new Map(prev.failedAttempts);
      const currentCount = newFailedAttempts.get(identifier) || 0;
      newFailedAttempts.set(identifier, currentCount + 1);

      const newSuspiciousIPs = new Set(prev.suspiciousIPs);
      if (currentCount >= 3) {
        newSuspiciousIPs.add(identifier);
      }

      return {
        ...prev,
        failedAttempts: newFailedAttempts,
        suspiciousIPs: newSuspiciousIPs,
      };
    });
  }, []);

  const blockUser = useCallback((identifier: string) => {
    setMetrics(prev => ({
      ...prev,
      blockedUsers: new Set([...prev.blockedUsers, identifier]),
    }));
    
    toast({
      title: "Security Alert",
      description: "User has been blocked due to suspicious activity",
      variant: "destructive",
    });
  }, [toast]);

  const cleanup = useCallback(() => {
    const now = Date.now();
    if (now - metrics.lastCleanup > 3600000) { // 1 hour
      setMetrics(prev => ({
        suspiciousIPs: new Set(),
        failedAttempts: new Map(),
        blockedUsers: prev.blockedUsers,
        lastCleanup: now,
      }));
    }
  }, [metrics.lastCleanup]);

  return {
    isBlocked,
    recordFailedAttempt,
    blockUser,
    cleanup,
    metrics: {
      suspiciousCount: metrics.suspiciousIPs.size,
      failedCount: metrics.failedAttempts.size,
      blockedCount: metrics.blockedUsers.size,
    }
  };
};
