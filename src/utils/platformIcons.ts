
import { LucideIcon } from 'lucide-react';
import { 
  SiGmail, SiSlack, SiDiscord, SiZoom, SiTelegram, SiWhatsapp,
  SiX, SiFacebook, SiLinkedin, SiInstagram, SiYoutube, SiTiktok,
  SiNotion, SiAirtable, SiTrello, SiAsana, SiClickup, SiGithub, SiGitlab,
  SiBitbucket, SiJira, SiGoogledrive, SiGooglesheets, SiGoogledocs,
  SiGooglecalendar, SiGoogle, SiOpenai, SiHuggingface, SiHubspot,
  SiSalesforce, SiShopify, SiStripe, SiPaypal, SiDropbox
} from 'react-icons/si';
import { 
  Bot, Cloud, Store, Box, Folder, FileText, Image, 
  Video, Music, Calendar, Database, Link, Settings, Mail,
  List, GitPullRequest, CircleDollarSign, FormInput, MessageSquare,
  Webhook, Zap, Globe, Server, Code, Activity
} from 'lucide-react';

export interface PlatformIconConfig {
  icon: LucideIcon | React.ComponentType<any>;
  color: string;
  bgColor: string;
}

export const getPlatformIconConfig = (platformName: string, actionType?: string): PlatformIconConfig => {
  const name = platformName ? platformName.toLowerCase() : '';
  
  if (!name) return { icon: Settings, color: '#6b7280', bgColor: '#f3f4f6' };
  
  // Specific Brand/Platform Icons
  if (name.includes('gmail') || name.includes('google mail')) 
    return { icon: SiGmail, color: '#EA4335', bgColor: '#FEE2E2' };
  if (name.includes('slack')) 
    return { icon: SiSlack, color: '#4A154B', bgColor: '#FDF4FF' };
  if (name.includes('discord')) 
    return { icon: SiDiscord, color: '#5865F2', bgColor: '#EEF2FF' };
  if (name.includes('zoom')) 
    return { icon: SiZoom, color: '#2D8CFF', bgColor: '#E0F2FE' };
  if (name.includes('telegram')) 
    return { icon: SiTelegram, color: '#0088CC', bgColor: '#E0F8FF' };
  if (name.includes('whatsapp')) 
    return { icon: SiWhatsapp, color: '#25D366', bgColor: '#DCFCE7' };
  if (name.includes('twitter') || name.includes('x.com')) 
    return { icon: SiX, color: '#000000', bgColor: '#F9FAFB' };
  if (name.includes('facebook')) 
    return { icon: SiFacebook, color: '#1877F2', bgColor: '#EFF6FF' };
  if (name.includes('linkedin')) 
    return { icon: SiLinkedin, color: '#0A66C2', bgColor: '#EFF6FF' };
  if (name.includes('instagram')) 
    return { icon: SiInstagram, color: '#E4405F', bgColor: '#FFE4E6' };
  if (name.includes('youtube')) 
    return { icon: SiYoutube, color: '#FF0000', bgColor: '#FEE2E2' };
  if (name.includes('tiktok')) 
    return { icon: SiTiktok, color: '#000000', bgColor: '#F9FAFB' };
  if (name.includes('notion')) 
    return { icon: SiNotion, color: '#000000', bgColor: '#F9FAFB' };
  if (name.includes('airtable')) 
    return { icon: SiAirtable, color: '#18BFFF', bgColor: '#E0F7FA' };
  if (name.includes('trello')) 
    return { icon: SiTrello, color: '#0079BF', bgColor: '#E0F2FF' };
  if (name.includes('asana')) 
    return { icon: SiAsana, color: '#F06A6A', bgColor: '#FFF3F3' };
  if (name.includes('clickup')) 
    return { icon: SiClickup, color: '#7B68EE', bgColor: '#EEF2FF' };
  if (name.includes('github')) 
    return { icon: SiGithub, color: '#181717', bgColor: '#F9FAFB' };
  if (name.includes('gitlab')) 
    return { icon: SiGitlab, color: '#FC6D26', bgColor: '#FFF7ED' };
  if (name.includes('bitbucket')) 
    return { icon: SiBitbucket, color: '#0052CC', bgColor: '#EBF8FF' };
  if (name.includes('jira')) 
    return { icon: SiJira, color: '#0052CC', bgColor: '#EBF8FF' };
  if (name.includes('googledrive') || name.includes('google drive')) 
    return { icon: SiGoogledrive, color: '#4285F4', bgColor: '#EBF8FF' };
  if (name.includes('googlesheets') || name.includes('google sheets')) 
    return { icon: SiGooglesheets, color: '#34A853', bgColor: '#DCFCE7' };
  if (name.includes('googledocs') || name.includes('google docs')) 
    return { icon: SiGoogledocs, color: '#4285F4', bgColor: '#EBF8FF' };
  if (name.includes('googlecalendar') || name.includes('google calendar')) 
    return { icon: SiGooglecalendar, color: '#4285F4', bgColor: '#EBF8FF' };
  if (name.includes('google')) 
    return { icon: SiGoogle, color: '#4285F4', bgColor: '#EBF8FF' };
  if (name.includes('openai') || name.includes('gpt') || name.includes('chatgpt')) 
    return { icon: SiOpenai, color: '#10A37F', bgColor: '#E6FFFA' };
  if (name.includes('hugging') || name.includes('transformers')) 
    return { icon: SiHuggingface, color: '#FF9D00', bgColor: '#FFF8E1' };
  if (name.includes('hubspot')) 
    return { icon: SiHubspot, color: '#FF7A59', bgColor: '#FFF3EB' };
  if (name.includes('salesforce')) 
    return { icon: SiSalesforce, color: '#00A1E0', bgColor: '#E0F7FA' };
  if (name.includes('shopify')) 
    return { icon: SiShopify, color: '#7AB55C', bgColor: '#F0FFF4' };
  if (name.includes('stripe')) 
    return { icon: SiStripe, color: '#635BFF', bgColor: '#EEF2FF' };
  if (name.includes('paypal')) 
    return { icon: SiPaypal, color: '#00457C', bgColor: '#E0F2F7' };
  if (name.includes('dropbox')) 
    return { icon: SiDropbox, color: '#0061FF', bgColor: '#EBF8FF' };
  
  // Action-Type Icons (Lucide)
  if (actionType) {
    const action = actionType.toLowerCase();
    if (action.includes('ai') || action.includes('agent') || name.includes('agent')) 
      return { icon: Bot, color: '#10b981', bgColor: '#f0fdf4' };
    if (action.includes('calendar') || name.includes('calendar')) 
      return { icon: Calendar, color: '#6366f1', bgColor: '#eef2ff' };
    if (action.includes('file') || name.includes('file')) 
      return { icon: FileText, color: '#6b7280', bgColor: '#f9fafb' };
    if (action.includes('image') || name.includes('image')) 
      return { icon: Image, color: '#ec4899', bgColor: '#fdf2f8' };
    if (action.includes('video') || name.includes('video')) 
      return { icon: Video, color: '#dc2626', bgColor: '#fef2f2' };
    if (action.includes('audio') || name.includes('audio')) 
      return { icon: Music, color: '#7c3aed', bgColor: '#f3e8ff' };
    if (action.includes('database') || name.includes('db')) 
      return { icon: Database, color: '#059669', bgColor: '#f0fdf4' };
    if (action.includes('webhook') || action.includes('api') || name.includes('webhook')) 
      return { icon: Webhook, color: '#9333ea', bgColor: '#f3e8ff' };
    if (action.includes('email') || action.includes('mail') || name.includes('outlook')) 
      return { icon: Mail, color: '#6366f1', bgColor: '#eef2ff' };
    if (action.includes('list') || action.includes('task'))
      return { icon: List, color: '#3b82f6', bgColor: '#e0f2fe' };
    if (action.includes('form') || name.includes('form'))
      return { icon: FormInput, color: '#a855f7', bgColor: '#f3e8ff' };
    if (action.includes('message') || name.includes('chat'))
      return { icon: MessageSquare, color: '#0ea5e9', bgColor: '#e0f8ff' };
    if (action.includes('issue') || name.includes('bug'))
      return { icon: GitPullRequest, color: '#ef4444', bgColor: '#fee2e2' };
    if (action.includes('payment') || name.includes('finance'))
      return { icon: CircleDollarSign, color: '#f59e0b', bgColor: '#fff7ed' };
    if (action.includes('automation') || action.includes('trigger'))
      return { icon: Zap, color: '#f59e0b', bgColor: '#fff7ed' };
    if (action.includes('server') || action.includes('hosting'))
      return { icon: Server, color: '#6b7280', bgColor: '#f9fafb' };
    if (action.includes('code') || action.includes('dev'))
      return { icon: Code, color: '#8b5cf6', bgColor: '#f3e8ff' };
  }
  
  // General Category Icons
  if (name.includes('cloud')) return { icon: Cloud, color: '#0ea5e9', bgColor: '#eff6ff' };
  if (name.includes('store') || name.includes('commerce')) return { icon: Store, color: '#ea580c', bgColor: '#fff7ed' };
  if (name.includes('box')) return { icon: Box, color: '#6b7280', bgColor: '#f9fafb' };
  if (name.includes('folder')) return { icon: Folder, color: '#eab308', bgColor: '#fefce8' };
  if (name.includes('web') || name.includes('http')) return { icon: Globe, color: '#3b82f6', bgColor: '#eff6ff' };
  if (name.includes('monitor') || name.includes('track')) return { icon: Activity, color: '#06b6d4', bgColor: '#ecfeff' };
  
  // Default fallback
  return { icon: Settings, color: '#6b7280', bgColor: '#f9fafb' };
};
