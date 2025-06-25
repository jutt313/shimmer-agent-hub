
import { IconType } from 'react-icons';
import { 
  SiGmail, SiMicrosoft, SiSlack, SiDiscord, SiZoom, SiTelegram, SiWhatsapp,
  SiTwitter, SiFacebook, SiLinkedin, SiInstagram, SiYoutube, SiTiktok,
  SiNotion, SiAirtable, SiTrello, SiAsana, SiClickup, SiGithub, SiGitlab,
  SiBitbucket, SiJira, SiGoogledrive, SiGooglesheets, SiGoogledocs,
  SiGooglecalendar, SiGoogle, SiOpenai, SiHuggingface, SiHubspot,
  SiSalesforce, SiShopify, SiStripe, SiPaypal, SiDropbox, SiMicrosoftonedrive
} from 'react-icons/si';
import { 
  FaRobot, FaCloud, FaStore, FaBox, FaFolder, FaFile, FaImage, 
  FaVideo, FaMusic, FaCalendar, FaDatabase, FaLink, FaCog
} from 'react-icons/fa';

export interface PlatformIconConfig {
  icon: IconType;
  color: string;
  bgColor: string;
}

// Comprehensive platform icon mapping with proper branding colors
export const getPlatformIconConfig = (platformName: string, actionType?: string): PlatformIconConfig => {
  if (!platformName) return { icon: FaCog, color: '#6b7280', bgColor: '#f3f4f6' };
  
  const name = platformName.toLowerCase();
  
  // Email platforms
  if (name.includes('gmail') || name.includes('google mail')) 
    return { icon: SiGmail, color: '#ea4335', bgColor: '#fef2f2' };
  if (name.includes('outlook') || name.includes('microsoft mail')) 
    return { icon: SiMicrosoft, color: '#0078d4', bgColor: '#eff6ff' };
  
  // Communication platforms
  if (name.includes('slack')) 
    return { icon: SiSlack, color: '#4a154b', bgColor: '#fdf4ff' };
  if (name.includes('discord')) 
    return { icon: SiDiscord, color: '#5865f2', bgColor: '#eef2ff' };
  if (name.includes('zoom')) 
    return { icon: SiZoom, color: '#2d8cff', bgColor: '#eff6ff' };
  if (name.includes('telegram')) 
    return { icon: SiTelegram, color: '#0088cc', bgColor: '#eff6ff' };
  if (name.includes('whatsapp')) 
    return { icon: SiWhatsapp, color: '#25d366', bgColor: '#f0fdf4' };
  
  // Social platforms
  if (name.includes('twitter') || name.includes('x.com')) 
    return { icon: SiTwitter, color: '#1da1f2', bgColor: '#eff6ff' };
  if (name.includes('facebook')) 
    return { icon: SiFacebook, color: '#1877f2', bgColor: '#eff6ff' };
  if (name.includes('linkedin')) 
    return { icon: SiLinkedin, color: '#0a66c2', bgColor: '#eff6ff' };
  if (name.includes('instagram')) 
    return { icon: SiInstagram, color: '#e4405f', bgColor: '#fef2f2' };
  if (name.includes('youtube')) 
    return { icon: SiYoutube, color: '#ff0000', bgColor: '#fef2f2' };
  if (name.includes('tiktok')) 
    return { icon: SiTiktok, color: '#000000', bgColor: '#f9fafb' };
  
  // Productivity platforms
  if (name.includes('notion')) 
    return { icon: SiNotion, color: '#000000', bgColor: '#f9fafb' };
  if (name.includes('airtable')) 
    return { icon: SiAirtable, color: '#18bfff', bgColor: '#eff6ff' };
  if (name.includes('trello')) 
    return { icon: SiTrello, color: '#0079bf', bgColor: '#eff6ff' };
  if (name.includes('asana')) 
    return { icon: SiAsana, color: '#f06a6a', bgColor: '#fef2f2' };
  if (name.includes('clickup')) 
    return { icon: SiClickup, color: '#7b68ee', bgColor: '#eef2ff' };
  
  // Development platforms
  if (name.includes('github')) 
    return { icon: SiGithub, color: '#181717', bgColor: '#f9fafb' };
  if (name.includes('gitlab')) 
    return { icon: SiGitlab, color: '#fc6d26', bgColor: '#fff7ed' };
  if (name.includes('bitbucket')) 
    return { icon: SiBitbucket, color: '#0052cc', bgColor: '#eff6ff' };
  if (name.includes('jira')) 
    return { icon: SiJira, color: '#0052cc', bgColor: '#eff6ff' };
  
  // Google services
  if (name.includes('google drive')) 
    return { icon: SiGoogledrive, color: '#4285f4', bgColor: '#eff6ff' };
  if (name.includes('google sheets')) 
    return { icon: SiGooglesheets, color: '#34a853', bgColor: '#f0fdf4' };
  if (name.includes('google docs')) 
    return { icon: SiGoogledocs, color: '#4285f4', bgColor: '#eff6ff' };
  if (name.includes('google calendar')) 
    return { icon: SiGooglecalendar, color: '#4285f4', bgColor: '#eff6ff' };
  if (name.includes('google')) 
    return { icon: SiGoogle, color: '#4285f4', bgColor: '#eff6ff' };
  
  // AI platforms
  if (name.includes('openai') || name.includes('gpt') || name.includes('chatgpt')) 
    return { icon: SiOpenai, color: '#10a37f', bgColor: '#f0fdf4' };
  if (name.includes('hugging') || name.includes('transformers')) 
    return { icon: SiHuggingface, color: '#ff9d00', bgColor: '#fff7ed' };
  
  // CRM/Sales platforms
  if (name.includes('hubspot')) 
    return { icon: SiHubspot, color: '#ff7a59', bgColor: '#fff7ed' };
  if (name.includes('salesforce')) 
    return { icon: SiSalesforce, color: '#00a1e0', bgColor: '#eff6ff' };
  
  // E-commerce platforms
  if (name.includes('shopify')) 
    return { icon: SiShopify, color: '#7ab55c', bgColor: '#f0fdf4' };
  if (name.includes('stripe')) 
    return { icon: SiStripe, color: '#635bff', bgColor: '#eef2ff' };
  if (name.includes('paypal')) 
    return { icon: SiPaypal, color: '#00457c', bgColor: '#eff6ff' };
  
  // File storage
  if (name.includes('dropbox')) 
    return { icon: SiDropbox, color: '#0061ff', bgColor: '#eff6ff' };
  if (name.includes('onedrive')) 
    return { icon: SiMicrosoftonedrive, color: '#0078d4', bgColor: '#eff6ff' };
  
  // Generic fallbacks based on action type
  if (actionType) {
    const action = actionType.toLowerCase();
    if (action.includes('ai') || action.includes('agent')) 
      return { icon: FaRobot, color: '#10b981', bgColor: '#f0fdf4' };
    if (action.includes('calendar')) 
      return { icon: FaCalendar, color: '#6366f1', bgColor: '#eef2ff' };
    if (action.includes('file')) 
      return { icon: FaFile, color: '#6b7280', bgColor: '#f9fafb' };
    if (action.includes('image')) 
      return { icon: FaImage, color: '#ec4899', bgColor: '#fdf2f8' };
    if (action.includes('video')) 
      return { icon: FaVideo, color: '#dc2626', bgColor: '#fef2f2' };
    if (action.includes('audio')) 
      return { icon: FaMusic, color: '#7c3aed', bgColor: '#f3e8ff' };
    if (action.includes('database')) 
      return { icon: FaDatabase, color: '#059669', bgColor: '#f0fdf4' };
    if (action.includes('webhook') || action.includes('api')) 
      return { icon: FaLink, color: '#9333ea', bgColor: '#f3e8ff' };
  }
  
  // Generic platform icons
  if (name.includes('cloud')) return { icon: FaCloud, color: '#0ea5e9', bgColor: '#eff6ff' };
  if (name.includes('store')) return { icon: FaStore, color: '#ea580c', bgColor: '#fff7ed' };
  if (name.includes('box')) return { icon: FaBox, color: '#6b7280', bgColor: '#f9fafb' };
  if (name.includes('folder')) return { icon: FaFolder, color: '#eab308', bgColor: '#fefce8' };
  
  // Default fallback
  return { icon: FaCog, color: '#6b7280', bgColor: '#f9fafb' };
};
