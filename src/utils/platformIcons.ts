
import { 
  Globe, 
  Mail, 
  MessageSquare, 
  FileText, 
  Calendar, 
  Database,
  Webhook,
  Zap,
  Bot,
  Settings,
  GitBranch,
  Clock,
  RotateCcw,
  Shield,
  PlayCircle
} from 'lucide-react';

export const getPlatformIconConfig = (platform: string, method?: string) => {
  const platformLower = platform?.toLowerCase() || '';
  const methodLower = method?.toLowerCase() || '';

  // Platform-specific icons and colors
  switch (platformLower) {
    case 'google':
    case 'google sheets':
    case 'google sheet':
      return { icon: FileText, color: '#34A853' };
    
    case 'slack':
      return { icon: MessageSquare, color: '#4A154B' };
    
    case 'notion':
      return { icon: FileText, color: '#000000' };
    
    case 'email':
    case 'gmail':
    case 'sendgrid':
      return { icon: Mail, color: '#EA4335' };
    
    case 'webhook':
    case 'webhooks':
      return { icon: Webhook, color: '#FF6B35' };
    
    case 'openai':
    case 'chatgpt':
    case 'gpt':
      return { icon: Bot, color: '#00A67E' };
    
    case 'api':
    case 'rest api':
      return { icon: Globe, color: '#0066CC' };
    
    case 'database':
    case 'sql':
    case 'mysql':
    case 'postgres':
      return { icon: Database, color: '#336791' };
    
    case 'calendar':
    case 'google calendar':
      return { icon: Calendar, color: '#4285F4' };
    
    case 'zapier':
      return { icon: Zap, color: '#FF4A00' };
    
    default:
      // Method-based fallbacks
      if (methodLower.includes('email') || methodLower.includes('mail')) {
        return { icon: Mail, color: '#EA4335' };
      }
      if (methodLower.includes('webhook') || methodLower.includes('post')) {
        return { icon: Webhook, color: '#FF6B35' };
      }
      if (methodLower.includes('ai') || methodLower.includes('gpt')) {
        return { icon: Bot, color: '#00A67E' };
      }
      if (methodLower.includes('condition') || methodLower.includes('branch')) {
        return { icon: GitBranch, color: '#F97316' };
      }
      if (methodLower.includes('delay') || methodLower.includes('wait')) {
        return { icon: Clock, color: '#64748B' };
      }
      if (methodLower.includes('retry')) {
        return { icon: RotateCcw, color: '#F59E0B' };
      }
      if (methodLower.includes('trigger')) {
        return { icon: PlayCircle, color: '#DC2626' };
      }
      
      return { icon: Settings, color: '#6B7280' };
  }
};

export const getStepTypeIcon = (stepType: string) => {
  switch (stepType?.toLowerCase()) {
    case 'trigger':
    case 'webhook':
      return { icon: PlayCircle, color: '#DC2626' };
    
    case 'action':
    case 'api_call':
      return { icon: Settings, color: '#6B7280' };
    
    case 'condition':
      return { icon: GitBranch, color: '#F97316' };
    
    case 'ai_agent_call':
    case 'ai_agent':
      return { icon: Bot, color: '#10B981' };
    
    case 'delay':
      return { icon: Clock, color: '#64748B' };
    
    case 'retry':
      return { icon: RotateCcw, color: '#F59E0B' };
    
    case 'fallback':
      return { icon: Shield, color: '#6366F1' };
    
    default:
      return { icon: Settings, color: '#6B7280' };
  }
};
