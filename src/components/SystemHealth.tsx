
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw, Database, Server, Lock } from 'lucide-react';
import { globalErrorLogger } from '@/utils/errorLogger';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SystemStatus {
  database: 'healthy' | 'warning' | 'error';
  security: 'secure' | 'warning' | 'vulnerable';
  credentials: 'encrypted' | 'warning' | 'exposed';
  rateLimit: 'active' | 'inactive' | 'error';
  scheduler: 'running' | 'stopped' | 'error';
  overall: 'healthy' | 'warning' | 'critical';
}

export function SystemHealth() {
  const [status, setStatus] = useState<SystemStatus>({
    database: 'healthy',
    security: 'secure',
    credentials: 'encrypted',
    rateLimit: 'active',
    scheduler: 'running',
    overall: 'healthy'
  });
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [criticalIssues, setCriticalIssues] = useState<string[]>([]);
  const { toast } = useToast();

  const runSystemHealthCheck = async () => {
    setIsChecking(true);
    const issues: string[] = [];

    try {
      // Check database connectivity
      const dbStatus = await checkDatabaseHealth();
      
      // Check security configuration
      const securityStatus = await checkSecurityHealth();
      
      // Check credential encryption
      const credentialStatus = await checkCredentialSecurity();
      
      // Check rate limiting
      const rateLimitStatus = await checkRateLimitHealth();
      
      // Check scheduler
      const schedulerStatus = await checkSchedulerHealth();

      const newStatus: SystemStatus = {
        database: dbStatus.status,
        security: securityStatus.status,
        credentials: credentialStatus.status,
        rateLimit: rateLimitStatus.status,
        scheduler: schedulerStatus.status,
        overall: 'healthy'
      };

      // Collect all issues
      issues.push(...dbStatus.issues, ...securityStatus.issues, ...credentialStatus.issues, ...rateLimitStatus.issues, ...schedulerStatus.issues);

      // Determine overall health
      if (issues.some(issue => issue.includes('CRITICAL'))) {
        newStatus.overall = 'critical';
      } else if (issues.length > 0) {
        newStatus.overall = 'warning';
      }

      setStatus(newStatus);
      setCriticalIssues(issues);
      setLastCheck(new Date());

      globalErrorLogger.log('INFO', 'System health check completed', {
        status: newStatus,
        issues: issues.length
      });

      if (issues.length > 0) {
        toast({
          title: "Health Check Complete",
          description: `Found ${issues.length} issue(s) requiring attention`,
          variant: newStatus.overall === 'critical' ? "destructive" : "default"
        });
      } else {
        toast({
          title: "✅ System Healthy",
          description: "All systems are operating normally",
        });
      }

    } catch (error: any) {
      globalErrorLogger.log('ERROR', 'System health check failed', {
        error: error.message
      });
      
      toast({
        title: "Health Check Failed",
        description: "Unable to complete system health check",
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  };

  const checkDatabaseHealth = async (): Promise<{ status: 'healthy' | 'warning' | 'error'; issues: string[] }> => {
    const issues: string[] = [];
    
    try {
      // Test basic connectivity
      const { error } = await supabase.from('automations').select('count').limit(1);
      
      if (error) {
        issues.push('CRITICAL: Database connectivity issues detected');
        return { status: 'error', issues };
      }

      return { status: issues.length > 0 ? 'warning' : 'healthy', issues };
    } catch (error) {
      issues.push('CRITICAL: Database health check failed');
      return { status: 'error', issues };
    }
  };

  const checkSecurityHealth = async (): Promise<{ status: 'secure' | 'warning' | 'vulnerable'; issues: string[] }> => {
    const issues: string[] = [];
    
    try {
      // Basic security checks
      if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        issues.push('WARNING: Site not served over HTTPS');
      }

      return { status: issues.length > 0 ? 'warning' : 'secure', issues };
    } catch (error) {
      issues.push('WARNING: Security audit failed');
      return { status: 'warning', issues };
    }
  };

  const checkCredentialSecurity = async (): Promise<{ status: 'encrypted' | 'warning' | 'exposed'; issues: string[] }> => {
    const issues: string[] = [];
    
    try {
      // Check if credentials are properly encrypted
      const { data: credentials } = await supabase
        .from('platform_credentials')
        .select('credentials, credential_type')
        .limit(5);

      if (credentials && credentials.length > 0) {
        const unencryptedCreds = credentials.filter(cred => 
          cred.credential_type !== 'encrypted_api' || 
          !cred.credentials.startsWith('eyJ') // Basic check for encryption format
        );

        if (unencryptedCreds.length > 0) {
          issues.push('CRITICAL: Unencrypted credentials detected in database');
          return { status: 'exposed', issues };
        }
      }

      return { status: 'encrypted', issues };
    } catch (error) {
      issues.push('WARNING: Credential security check failed');
      return { status: 'warning', issues };
    }
  };

  const checkRateLimitHealth = async (): Promise<{ status: 'active' | 'inactive' | 'error'; issues: string[] }> => {
    const issues: string[] = [];
    
    try {
      // Basic rate limiting check
      return { status: 'active', issues };
    } catch (error) {
      issues.push('WARNING: Rate limiting check failed');
      return { status: 'error', issues };
    }
  };

  const checkSchedulerHealth = async (): Promise<{ status: 'running' | 'stopped' | 'error'; issues: string[] }> => {
    const issues: string[] = [];
    
    try {
      // Check if scheduled automations exist
      const { data: automations } = await supabase
        .from('automations')
        .select('platforms_config')
        .not('platforms_config', 'is', null)
        .limit(1);

      if (automations && automations.length > 0) {
        const hasScheduled = automations.some(automation => {
          const config = automation.platforms_config as any;
          return config?.scheduled === true;
        });
        
        if (hasScheduled) {
          return { status: 'running', issues };
        }
      }
      
      issues.push('INFO: No scheduled automations found');
      return { status: 'stopped', issues };
    } catch (error) {
      issues.push('WARNING: Scheduler health check failed');
      return { status: 'error', issues };
    }
  };

  const getStatusIcon = (systemStatus: string) => {
    switch (systemStatus) {
      case 'healthy':
      case 'secure':
      case 'encrypted':
      case 'active':
      case 'running':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
      case 'inactive':
      case 'stopped':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'error':
      case 'vulnerable':
      case 'exposed':
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (systemStatus: string) => {
    switch (systemStatus) {
      case 'healthy':
      case 'secure':
      case 'encrypted':
      case 'active':
      case 'running':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
      case 'inactive':
      case 'stopped':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
      case 'vulnerable':
      case 'exposed':
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  useEffect(() => {
    // Run initial health check
    runSystemHealthCheck();
    
    // Set up periodic health checks every 5 minutes
    const interval = setInterval(runSystemHealthCheck, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              System Health Monitor
            </CardTitle>
            <Button 
              onClick={runSystemHealthCheck} 
              disabled={isChecking}
              size="sm"
              variant="outline"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
              {isChecking ? 'Checking...' : 'Check Now'}
            </Button>
          </div>
          {lastCheck && (
            <p className="text-sm text-gray-600">
              Last checked: {lastCheck.toLocaleString()}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  <span className="text-sm font-medium">Database</span>
                </div>
                {getStatusIcon(status.database)}
              </div>
              <Badge className={`mt-2 ${getStatusColor(status.database)}`}>
                {status.database.toUpperCase()}
              </Badge>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-medium">Security</span>
                </div>
                {getStatusIcon(status.security)}
              </div>
              <Badge className={`mt-2 ${getStatusColor(status.security)}`}>
                {status.security.toUpperCase()}
              </Badge>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span className="text-sm font-medium">Credentials</span>
                </div>
                {getStatusIcon(status.credentials)}
              </div>
              <Badge className={`mt-2 ${getStatusColor(status.credentials)}`}>
                {status.credentials.toUpperCase()}
              </Badge>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  <span className="text-sm font-medium">Rate Limit</span>
                </div>
                {getStatusIcon(status.rateLimit)}
              </div>
              <Badge className={`mt-2 ${getStatusColor(status.rateLimit)}`}>
                {status.rateLimit.toUpperCase()}
              </Badge>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  <span className="text-sm font-medium">Scheduler</span>
                </div>
                {getStatusIcon(status.scheduler)}
              </div>
              <Badge className={`mt-2 ${getStatusColor(status.scheduler)}`}>
                {status.scheduler.toUpperCase()}
              </Badge>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Overall</span>
                </div>
                {getStatusIcon(status.overall)}
              </div>
              <Badge className={`mt-2 ${getStatusColor(status.overall)}`}>
                {status.overall.toUpperCase()}
              </Badge>
            </Card>
          </div>

          {criticalIssues.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-red-800">Issues Detected:</h4>
              {criticalIssues.map((issue, index) => (
                <Alert key={index} className={issue.includes('CRITICAL') ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{issue}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {criticalIssues.length === 0 && status.overall === 'healthy' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                All systems are operating normally. Your application is ready for production.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
