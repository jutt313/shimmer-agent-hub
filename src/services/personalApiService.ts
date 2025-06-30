
import { supabase } from '@/integrations/supabase/client';
import { ApiToken, DashboardStats, ApiUsageData, ApiLog, ApiError, TestApiResult } from '@/types/personalApi';

export const hashToken = async (token: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const parsePermissions = (permissions: any) => {
  if (typeof permissions === 'object' && permissions !== null && !Array.isArray(permissions)) {
    return {
      read: Boolean(permissions.read || false),
      write: Boolean(permissions.write || false),
      webhook: Boolean(permissions.webhook || false),
      notifications: Boolean(permissions.notifications || false),
      full_control: Boolean(permissions.full_control || false),
      platform_connections: Boolean(permissions.platform_connections || false),
    };
  }
  return {
    read: true,
    write: false,
    webhook: false,
    notifications: false,
    full_control: false,
    platform_connections: false,
  };
};

export const convertToJson = (naturalLanguage: string) => {
  const input = naturalLanguage.toLowerCase();
  
  if (input.includes('create') && input.includes('automation')) {
    const nameMatch = input.match(/automation.*?['"](.*?)['"]|named\s+([^,\s]+)|called\s+([^,\s]+)/);
    const automationName = nameMatch ? (nameMatch[1] || nameMatch[2] || nameMatch[3]) : 'API Created Automation';
    
    return JSON.stringify({
      title: automationName,
      description: `Automation created via Personal API: ${naturalLanguage}`,
      trigger_type: "api_trigger",
      actions: [
        {
          type: "notification",
          config: {
            message: `Automation "${automationName}" was created successfully`,
            channels: ["dashboard", "webhook"]
          }
        }
      ]
    }, null, 2);
  }
  
  if (input.includes('list') || input.includes('get') || input.includes('show')) {
    return JSON.stringify({
      action: "list_automations",
      filters: {
        status: "active",
        limit: 10
      }
    }, null, 2);
  }
  
  return JSON.stringify({
    request: naturalLanguage,
    action: "custom_request",
    data: {}
  }, null, 2);
};

export const testApiCall = async (
  endpoint: string, 
  method: string, 
  payload?: any, 
  apiToken?: string
): Promise<TestApiResult> => {
  try {
    const baseUrl = 'https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/yusrai-api';
    const url = `${baseUrl}${endpoint}`;
    
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      }
    };

    if (method !== 'GET' && payload) {
      options.body = JSON.stringify(payload);
    }

    const startTime = Date.now();
    const response = await fetch(url, options);
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    const result = await response.json();
    
    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: result,
      responseTime
    };

  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
