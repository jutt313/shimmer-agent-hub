
import { initializeNotificationSystem } from './allNotificationTriggers';

export const initializeComprehensiveNotificationSystem = () => {
  console.log('🔔 Initializing Comprehensive Notification System');
  
  // Initialize core notification system
  initializeNotificationSystem();
  
  // Set up global error monitoring for enhanced error detection
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args);
      
      // Monitor API errors for notification triggers
      if (!response.ok && response.status >= 400) {
        console.log('🚨 API Error detected:', response.status, response.statusText);
        
        // Dispatch custom event for error handling
        window.dispatchEvent(new CustomEvent('api-error', {
          detail: {
            status: response.status,
            statusText: response.statusText,
            url: args[0]
          }
        }));
      }
      
      return response;
    } catch (error) {
      console.log('🚨 Network Error detected:', error);
      
      // Dispatch custom event for network errors
      window.dispatchEvent(new CustomEvent('network-error', {
        detail: error
      }));
      
      throw error;
    }
  };
  
  // Enhanced console monitoring for better error detection
  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    originalConsoleWarn.apply(console, args);
    
    const warningMessage = args.join(' ');
    if (warningMessage.toLowerCase().includes('deprecated') || 
        warningMessage.toLowerCase().includes('warning')) {
      
      // Dispatch warning event for notification system
      window.dispatchEvent(new CustomEvent('system-warning', {
        detail: {
          message: warningMessage,
          timestamp: Date.now()
        }
      }));
    }
  };
  
  console.log('✅ Comprehensive Notification System Active');
  console.log('✅ Global Error Monitoring Active');
  console.log('✅ Enhanced Console Monitoring Active');
  console.log('✅ Toast-to-Notification Bridge Active');
  console.log('✅ Notification-to-Chat Integration Active');
};
