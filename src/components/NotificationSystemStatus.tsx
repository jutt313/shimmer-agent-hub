
import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const NotificationSystemStatus = () => {
  const [systemStatus, setSystemStatus] = useState({
    toastBridge: true,
    chatIntegration: true,
    errorDetection: true,
    networkMonitoring: true
  });

  useEffect(() => {
    // Monitor system health
    const checkSystemHealth = () => {
      // Check if notification system components are active
      const hasToastSystem = typeof window !== 'undefined' && 
                            document.querySelector('[data-sonner-toaster]') !== null;
      
      const hasErrorIndicator = typeof window !== 'undefined' && 
                                document.querySelector('[data-error-indicator]') !== null;
      
      setSystemStatus(prev => ({
        ...prev,
        toastBridge: hasToastSystem,
        errorDetection: hasErrorIndicator
      }));
    };

    // Initial check
    checkSystemHealth();
    
    // Periodic health checks
    const interval = setInterval(checkSystemHealth, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const allSystemsOperational = Object.values(systemStatus).every(status => status);

  return (
    <div className="fixed bottom-4 left-4 z-[9998]">
      <Badge 
        variant={allSystemsOperational ? "default" : "destructive"} 
        className="flex items-center gap-2 px-3 py-2 shadow-lg"
      >
        {allSystemsOperational ? (
          <>
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs">Notification System Active</span>
          </>
        ) : (
          <>
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs">System Check Required</span>
          </>
        )}
        
        {/* Network status indicator */}
        {navigator.onLine ? (
          <Wifi className="w-3 h-3 text-green-500" />
        ) : (
          <WifiOff className="w-3 h-3 text-red-500" />
        )}
      </Badge>
    </div>
  );
};

export default NotificationSystemStatus;
