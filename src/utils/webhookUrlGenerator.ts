
// Fixed webhook URL generator using proper yusrai.com domain
export const generateYusraiWebhookUrl = (automationId: string): string => {
  const webhookId = crypto.randomUUID();
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname.includes('lovable');
  
  // Use yusrai.com in production, supabase for development
  const baseUrl = isDevelopment 
    ? 'https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/webhook-trigger'
    : 'https://yusrai.com/api/webhooks';
    
  return `${baseUrl}/${webhookId}?automation_id=${automationId}`;
};

export const generateWebhookSecret = (): string => {
  return crypto.randomUUID();
};

// Webhook signature validation
export const validateWebhookSignature = async (
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> => {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const expectedSignature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const expectedHex = Array.from(new Uint8Array(expectedSignature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return signature === `sha256=${expectedHex}`;
  } catch (error) {
    console.error('Webhook signature validation failed:', error);
    return false;
  }
};
