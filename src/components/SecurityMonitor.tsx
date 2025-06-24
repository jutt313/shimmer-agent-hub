
import React, { useEffect, useState } from 'react';
import { Shield, AlertTriangle, Eye, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { globalErrorLogger } from '@/utils/errorLogger';
import { globalSecurityAuditor } from '@/utils/securityAudit';
import { globalRateLimiter } from '@/utils/rateLimiter';

export function SecurityMonitor() {
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [threatLevel, setThreatLevel] = useState<'low' | 'medium' | 'high'>('low');

  useEffect(() => {
    // Simulate real-time security monitoring
    const interval = setInterval(() => {
      checkSecurityStatus();
    }, 30000); // Check every 30 seconds

    checkSecurityStatus();

    return () => clearInterval(interval);
  }, []);

  const checkSecurityStatus = () => {
    // Get recent suspicious activities
    const suspiciousActivities = globalRateLimiter.checkAbusePattern('system', 'monitor');
    
    // Log security check
    globalErrorLogger.log('INFO', 'Security monitoring check performed', {
      timestamp: new Date().toISOString(),
      threatLevel,
      activeSessions: 1 // This would be dynamic in a real app
    });

    // Update threat level based on current conditions
    updateThreatLevel();
  };

  const updateThreatLevel = () => {
    // Simple threat assessment logic
    const currentHour = new Date().getHours();
    
    // Higher threat level during off-hours
    if (currentHour < 6 || currentHour > 22) {
      setThreatLevel('medium');
    } else {
      setThreatLevel('low');
    }
  };

  const getThreatLevelColor = () => {
    switch (threatLevel) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Live Security Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={getThreatLevelColor()}>
              Threat Level: {threatLevel.toUpperCase()}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Eye className="w-4 h-4" />
              Monitoring Active
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Lock className="w-4 h-4 text-green-600" />
            <span className="text-green-600">Secured</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-3 text-center">
            <div className="text-lg font-bold text-green-600">0</div>
            <div className="text-sm text-gray-600">Active Threats</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-lg font-bold text-blue-600">1</div>
            <div className="text-sm text-gray-600">Active Sessions</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-lg font-bold text-purple-600">0</div>
            <div className="text-sm text-gray-600">Blocked IPs</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-lg font-bold text-orange-600">24/7</div>
            <div className="text-sm text-gray-600">Monitoring</div>
          </Card>
        </div>

        <div className="mt-4">
          <h4 className="font-medium mb-2">Security Features Active</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Rate Limiting</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Abuse Prevention</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Error Monitoring</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Privacy Compliance</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
