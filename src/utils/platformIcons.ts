
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
  PlayCircle,
  Send,
  Search,
  Users,
  Star,
  Hash,
  Image,
  Video,
  Music,
  Download,
  Upload,
  Link,
  Bell,
  Lock,
  Key,
  CreditCard,
  ShoppingCart,
  Truck,
  MapPin,
  Phone,
  Smartphone,
  Monitor,
  Tablet,
  Laptop,
  Server,
  Cloud,
  Code,
  Terminal,
  Package,
  Archive,
  Folder,
  File,
  Edit,
  Eye,
  Filter,
  Sort,
  BarChart,
  PieChart,
  TrendingUp,
  Activity,
  Target,
  Flag,
  Tag,
  Bookmark,
  Heart,
  ThumbsUp,
  Share,
  MessageCircle,
  AtSign,
  Paperclip,
  Printer,
  Save,
  Copy,
  Trash,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  HelpCircle,
  Plus,
  Minus,
  X,
  Check,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Stop,
  Volume,
  VolumeX,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  Power,
  Lightbulb,
  Home,
  Building,
  Store,
  Car,
  Plane,
  Train,
  Bus,
  Bike,
  Walk
} from 'lucide-react';

interface IconConfig {
  icon: any;
  color: string;
}

export const getPlatformIconConfig = (platform: string, method?: string): IconConfig => {
  const platformLower = platform?.toLowerCase()?.trim() || '';
  const methodLower = method?.toLowerCase()?.trim() || '';

  console.log('🎯 Getting platform icon for:', { platform: platformLower, method: methodLower });

  // Comprehensive platform mapping
  const platformMappings: Record<string, IconConfig> = {
    // Google Services
    'google': { icon: FileText, color: '#4285F4' },
    'google sheets': { icon: FileText, color: '#34A853' },
    'google sheet': { icon: FileText, color: '#34A853' },
    'google docs': { icon: FileText, color: '#4285F4' },
    'google drive': { icon: Folder, color: '#4285F4' },
    'google calendar': { icon: Calendar, color: '#4285F4' },
    'gmail': { icon: Mail, color: '#EA4335' },
    'google forms': { icon: FileText, color: '#673AB7' },
    'google slides': { icon: FileText, color: '#FF9800' },
    
    // Communication Platforms
    'slack': { icon: MessageSquare, color: '#4A154B' },
    'discord': { icon: MessageSquare, color: '#5865F2' },
    'microsoft teams': { icon: MessageSquare, color: '#6264A7' },
    'teams': { icon: MessageSquare, color: '#6264A7' },
    'zoom': { icon: Video, color: '#2D8CFF' },
    'skype': { icon: Video, color: '#00AFF0' },
    'telegram': { icon: MessageSquare, color: '#0088CC' },
    'whatsapp': { icon: MessageSquare, color: '#25D366' },
    
    // Productivity & Project Management
    'notion': { icon: FileText, color: '#000000' },
    'asana': { icon: Target, color: '#273347' },
    'trello': { icon: Target, color: '#0079BF' },
    'monday': { icon: Target, color: '#FF3D57' },
    'clickup': { icon: Target, color: '#7B68EE' },
    'jira': { icon: Target, color: '#0052CC' },
    'linear': { icon: Target, color: '#5E6AD2' },
    'airtable': { icon: Database, color: '#18BFFF' },
    'coda': { icon: FileText, color: '#F46A54' },
    
    // Email Services
    'email': { icon: Mail, color: '#EA4335' },
    'sendgrid': { icon: Mail, color: '#1A82E2' },
    'mailchimp': { icon: Mail, color: '#FFE01B' },
    'mailgun': { icon: Mail, color: '#F06B5D' },
    'postmark': { icon: Mail, color: '#FFDD00' },
    'ses': { icon: Mail, color: '#FF9900' },
    'amazon ses': { icon: Mail, color: '#FF9900' },
    
    // Social Media
    'twitter': { icon: MessageSquare, color: '#1DA1F2' },
    'x': { icon: MessageSquare, color: '#000000' },
    'facebook': { icon: Users, color: '#1877F2' },
    'instagram': { icon: Image, color: '#E4405F' },
    'linkedin': { icon: Users, color: '#0A66C2' },
    'youtube': { icon: Video, color: '#FF0000' },
    'tiktok': { icon: Video, color: '#000000' },
    'snapchat': { icon: Image, color: '#FFFC00' },
    'pinterest': { icon: Image, color: '#BD081C' },
    'reddit': { icon: MessageSquare, color: '#FF4500' },
    
    // Developer Tools
    'github': { icon: Code, color: '#181717' },
    'gitlab': { icon: Code, color: '#FC6D26' },
    'bitbucket': { icon: Code, color: '#0052CC' },
    'git': { icon: Code, color: '#F05032' },
    'docker': { icon: Package, color: '#2496ED' },
    'kubernetes': { icon: Server, color: '#326CE5' },
    'jenkins': { icon: Settings, color: '#D33833' },
    'circleci': { icon: Settings, color: '#343434' },
    'travis': { icon: Settings, color: '#3EAAAF' },
    
    // Cloud Providers
    'aws': { icon: Cloud, color: '#FF9900' },
    'amazon': { icon: Cloud, color: '#FF9900' },
    'azure': { icon: Cloud, color: '#0078D4' },
    'microsoft': { icon: Cloud, color: '#0078D4' },
    'gcp': { icon: Cloud, color: '#4285F4' },
    'google cloud': { icon: Cloud, color: '#4285F4' },
    'heroku': { icon: Cloud, color: '#430098' },
    'netlify': { icon: Cloud, color: '#00C7B7' },
    'vercel': { icon: Cloud, color: '#000000' },
    'digitalocean': { icon: Cloud, color: '#0080FF' },
    'linode': { icon: Cloud, color: '#00A95C' },
    'cloudflare': { icon: Cloud, color: '#F38020' },
    
    // Databases
    'database': { icon: Database, color: '#336791' },
    'sql': { icon: Database, color: '#336791' },
    'mysql': { icon: Database, color: '#4479A1' },
    'postgresql': { icon: Database, color: '#336791' },
    'postgres': { icon: Database, color: '#336791' },
    'mongodb': { icon: Database, color: '#47A248' },
    'redis': { icon: Database, color: '#DC382D' },
    'elasticsearch': { icon: Database, color: '#005571' },
    'firebase': { icon: Database, color: '#FFCA28' },
    'supabase': { icon: Database, color: '#3ECF8E' },
    'planetscale': { icon: Database, color: '#000000' },
    
    // E-commerce
    'shopify': { icon: ShoppingCart, color: '#7AB55C' },
    'woocommerce': { icon: ShoppingCart, color: '#96588A' },
    'magento': { icon: ShoppingCart, color: '#EE672F' },
    'prestashop': { icon: ShoppingCart, color: '#DF0067' },
    'bigcommerce': { icon: ShoppingCart, color: '#121118' },
    'square': { icon: CreditCard, color: '#3E4348' },
    'stripe': { icon: CreditCard, color: '#635BFF' },
    'paypal': { icon: CreditCard, color: '#00457C' },
    'venmo': { icon: CreditCard, color: '#3D95CE' },
    
    // CRM & Sales
    'salesforce': { icon: Users, color: '#00A1E0' },
    'hubspot': { icon: Users, color: '#FF7A59' },
    'pipedrive': { icon: Users, color: '#1F5C40' },
    'zoho': { icon: Users, color: '#C83E3E' },
    'freshworks': { icon: Users, color: '#E85D1C' },
    'intercom': { icon: MessageCircle, color: '#1F8DD6' },
    'zendesk': { icon: HelpCircle, color: '#03363D' },
    'freshdesk': { icon: HelpCircle, color: '#E85D1C' },
    
    // Analytics
    'google analytics': { icon: BarChart, color: '#E37400' },
    'mixpanel': { icon: BarChart, color: '#7856FF' },
    'amplitude': { icon: BarChart, color: '#1F5582' },
    'segment': { icon: BarChart, color: '#52BD94' },
    'hotjar': { icon: BarChart, color: '#FD3A5C' },
    'fullstory': { icon: BarChart, color: '#1E1E1E' },
    
    // Automation Tools
    'zapier': { icon: Zap, color: '#FF4A00' },
    'ifttt': { icon: Zap, color: '#000000' },
    'integromat': { icon: Zap, color: '#2F8CBB' },
    'make': { icon: Zap, color: '#6D3FF2' },
    'n8n': { icon: Zap, color: '#FF6D5A' },
    'automate': { icon: Zap, color: '#2F8CBB' },
    
    // AI Services
    'openai': { icon: Bot, color: '#00A67E' },
    'chatgpt': { icon: Bot, color: '#00A67E' },
    'gpt': { icon: Bot, color: '#00A67E' },
    'claude': { icon: Bot, color: '#D97706' },
    'anthropic': { icon: Bot, color: '#D97706' },
    'huggingface': { icon: Bot, color: '#FFD21E' },
    'cohere': { icon: Bot, color: '#39594C' },
    'stability': { icon: Bot, color: '#000000' },
    'midjourney': { icon: Image, color: '#000000' },
    'dall-e': { icon: Image, color: '#00A67E' },
    
    // Webhooks and APIs
    'webhook': { icon: Webhook, color: '#FF6B35' },
    'webhooks': { icon: Webhook, color: '#FF6B35' },
    'api': { icon: Globe, color: '#0066CC' },
    'rest api': { icon: Globe, color: '#0066CC' },
    'graphql': { icon: Globe, color: '#E10098' },
    'postman': { icon: Globe, color: '#FF6C37' },
    'insomnia': { icon: Globe, color: '#4000BF' },
    
    // File Storage
    'dropbox': { icon: Archive, color: '#0061FF' },
    'onedrive': { icon: Archive, color: '#0078D4' },
    'box': { icon: Archive, color: '#0061D5' },
    'aws s3': { icon: Archive, color: '#FF9900' },
    's3': { icon: Archive, color: '#FF9900' },
    
    // Content Management
    'wordpress': { icon: Edit, color: '#21759B' },
    'contentful': { icon: FileText, color: '#2478CC' },
    'strapi': { icon: FileText, color: '#2F2E8B' },
    'sanity': { icon: FileText, color: '#F03E2F' },
    'ghost': { icon: Edit, color: '#15171A' },
    'medium': { icon: Edit, color: '#000000' },
    
    // Calendar and Scheduling
    'calendly': { icon: Calendar, color: '#006BFF' },
    'acuity': { icon: Calendar, color: '#6B46C1' },
    'bookingcom': { icon: Calendar, color: '#003580' },
    'outlook': { icon: Calendar, color: '#0078D4' },
    'apple calendar': { icon: Calendar, color: '#007AFF' },
    'ical': { icon: Calendar, color: '#007AFF' },
    
    // Security & Auth
    'auth0': { icon: Shield, color: '#EB5424' },
    'okta': { icon: Shield, color: '#007DC1' },
    'onelogin': { icon: Shield, color: '#1DA1F2' },
    'lastpass': { icon: Lock, color: '#D32D27' },
    'bitwarden': { icon: Lock, color: '#175DDC' },
    '1password': { icon: Lock, color: '#0094F6' },
    
    // Monitoring & Observability
    'datadog': { icon: Activity, color: '#632CA6' },
    'newrelic': { icon: Activity, color: '#008C99' },
    'sentry': { icon: Activity, color: '#362D59' },
    'rollbar': { icon: Activity, color: '#FF6B35' },
    'bugsnag': { icon: Activity, color: '#4949E7' },
    'honeybadger': { icon: Activity, color: '#FF7A00' },
    
    // Marketing
    'klaviyo': { icon: Mail, color: '#000000' },
    'constant contact': { icon: Mail, color: '#1F5F99' },
    'aweber': { icon: Mail, color: '#77C442' },
    'convertkit': { icon: Mail, color: '#FB6970' },
    'activecampaign': { icon: Mail, color: '#356AE6' },
    'drip': { icon: Mail, color: '#EC3652' },
    
    // Survey & Forms
    'typeform': { icon: FileText, color: '#262627' },
    'surveymonkey': { icon: FileText, color: '#00BF6F' },
    'jotform': { icon: FileText, color: '#FF6100' },
    'formstack': { icon: FileText, color: '#4CAF50' },
    'wufoo': { icon: FileText, color: '#AD5700' },
    
    // Shipping & Logistics
    'fedex': { icon: Truck, color: '#4D148C' },
    'ups': { icon: Truck, color: '#8B4513' },
    'usps': { icon: Truck, color: '#004B87' },
    'dhl': { icon: Truck, color: '#FFCC00' },
    'shipstation': { icon: Truck, color: '#4A90E2' },
    'easypost': { icon: Truck, color: '#2ECC71' },
    
    // Location Services
    'google maps': { icon: MapPin, color: '#4285F4' },
    'mapbox': { icon: MapPin, color: '#000000' },
    'foursquare': { icon: MapPin, color: '#F94877' },
    'yelp': { icon: MapPin, color: '#D32323' },
    
    // Communication Hardware
    'twilio': { icon: Phone, color: '#F22F46' },
    'nexmo': { icon: Phone, color: '#00A2FF' },
    'vonage': { icon: Phone, color: '#00A2FF' },
    'plivo': { icon: Phone, color: '#2ECC71' },
    'messagebird': { icon: Phone, color: '#2481D7' },
    
    // Generic fallbacks
    'manual': { icon: PlayCircle, color: '#DC2626' },
    'trigger': { icon: PlayCircle, color: '#DC2626' },
    'default': { icon: Settings, color: '#6B7280' }
  };

  // Direct platform match
  if (platformMappings[platformLower]) {
    console.log('✅ Found direct platform match:', platformLower);
    return platformMappings[platformLower];
  }

  // Partial platform match
  for (const [key, config] of Object.entries(platformMappings)) {
    if (platformLower.includes(key) || key.includes(platformLower)) {
      console.log('✅ Found partial platform match:', key, 'for', platformLower);
      return config;
    }
  }

  // Method-based matching
  const methodMappings: Record<string, IconConfig> = {
    'email': { icon: Mail, color: '#EA4335' },
    'mail': { icon: Mail, color: '#EA4335' },
    'send': { icon: Send, color: '#EA4335' },
    'webhook': { icon: Webhook, color: '#FF6B35' },
    'post': { icon: Webhook, color: '#FF6B35' },
    'get': { icon: Download, color: '#0066CC' },
    'put': { icon: Upload, color: '#0066CC' },
    'delete': { icon: Trash, color: '#EF4444' },
    'patch': { icon: Edit, color: '#0066CC' },
    'ai': { icon: Bot, color: '#00A67E' },
    'gpt': { icon: Bot, color: '#00A67E' },
    'openai': { icon: Bot, color: '#00A67E' },
    'condition': { icon: GitBranch, color: '#F97316' },
    'branch': { icon: GitBranch, color: '#F97316' },
    'if': { icon: GitBranch, color: '#F97316' },
    'delay': { icon: Clock, color: '#64748B' },
    'wait': { icon: Clock, color: '#64748B' },
    'sleep': { icon: Clock, color: '#64748B' },
    'retry': { icon: RotateCcw, color: '#F59E0B' },
    'repeat': { icon: Repeat, color: '#F59E0B' },
    'loop': { icon: Repeat, color: '#8B5CF6' },
    'trigger': { icon: PlayCircle, color: '#DC2626' },
    'start': { icon: Play, color: '#DC2626' },
    'schedule': { icon: Calendar, color: '#4285F4' },
    'cron': { icon: Clock, color: '#64748B' },
    'search': { icon: Search, color: '#6B7280' },
    'find': { icon: Search, color: '#6B7280' },
    'create': { icon: Plus, color: '#10B981' },
    'add': { icon: Plus, color: '#10B981' },
    'update': { icon: Edit, color: '#F59E0B' },
    'modify': { icon: Edit, color: '#F59E0B' },
    'read': { icon: Eye, color: '#6B7280' },
    'view': { icon: Eye, color: '#6B7280' },
    'list': { icon: FileText, color: '#6B7280' },
    'save': { icon: Save, color: '#10B981' },
    'store': { icon: Archive, color: '#6B7280' },
    'upload': { icon: Upload, color: '#0066CC' },
    'download': { icon: Download, color: '#0066CC' },
    'sync': { icon: RefreshCw, color: '#6B7280' },
    'backup': { icon: Archive, color: '#6B7280' },
    'restore': { icon: RefreshCw, color: '#10B981' },
    'notify': { icon: Bell, color: '#F59E0B' },
    'alert': { icon: AlertCircle, color: '#EF4444' },
    'warn': { icon: AlertCircle, color: '#F59E0B' },
    'error': { icon: XCircle, color: '#EF4444' },
    'success': { icon: CheckCircle, color: '#10B981' },
    'info': { icon: Info, color: '#3B82F6' },
    'help': { icon: HelpCircle, color: '#6B7280' },
    'filter': { icon: Filter, color: '#6B7280' },
    'sort': { icon: Sort, color: '#6B7280' },
    'transform': { icon: RefreshCw, color: '#8B5CF6' },
    'convert': { icon: RefreshCw, color: '#8B5CF6' },
    'parse': { icon: Code, color: '#6B7280' },
    'format': { icon: Code, color: '#6B7280' },
    'validate': { icon: Shield, color: '#10B981' },
    'check': { icon: CheckCircle, color: '#10B981' },
    'test': { icon: Target, color: '#F59E0B' },
    'monitor': { icon: Activity, color: '#8B5CF6' },
    'track': { icon: Activity, color: '#8B5CF6' },
    'log': { icon: FileText, color: '#6B7280' },
    'record': { icon: FileText, color: '#6B7280' },
    'connect': { icon: Link, color: '#0066CC' },
    'disconnect': { icon: X, color: '#EF4444' },
    'join': { icon: Link, color: '#0066CC' },
    'merge': { icon: GitBranch, color: '#8B5CF6' },
    'split': { icon: GitBranch, color: '#8B5CF6' },
    'group': { icon: Users, color: '#6B7280' },
    'ungroup': { icon: Users, color: '#6B7280' },
    'copy': { icon: Copy, color: '#6B7280' },
    'duplicate': { icon: Copy, color: '#6B7280' },
    'move': { icon: ArrowRight, color: '#6B7280' },
    'transfer': { icon: ArrowRight, color: '#6B7280' },
    'import': { icon: Download, color: '#0066CC' },
    'export': { icon: Upload, color: '#0066CC' },
    'publish': { icon: Upload, color: '#10B981' },
    'deploy': { icon: Upload, color: '#10B981' },
    'build': { icon: Package, color: '#F59E0B' },
    'compile': { icon: Package, color: '#F59E0B' },
    'execute': { icon: Play, color: '#10B981' },
    'run': { icon: Play, color: '#10B981' },
    'stop': { icon: Stop, color: '#EF4444' },
    'pause': { icon: Pause, color: '#F59E0B' },
    'resume': { icon: Play, color: '#10B981' },
    'cancel': { icon: X, color: '#EF4444' },
    'abort': { icon: X, color: '#EF4444' },
    'complete': { icon: CheckCircle, color: '#10B981' },
    'finish': { icon: CheckCircle, color: '#10B981' },
    'end': { icon: Stop, color: '#EF4444' }
  };

  // Method-based matching
  for (const [key, config] of Object.entries(methodMappings)) {
    if (methodLower.includes(key) || key.includes(methodLower)) {
      console.log('✅ Found method match:', key, 'for', methodLower);
      return config;
    }
  }

  // Default fallback
  console.log('⚠️ No match found, using default for:', platformLower, methodLower);
  return { icon: Settings, color: '#6B7280' };
};

export const getStepTypeIcon = (stepType: string) => {
  const stepTypeLower = stepType?.toLowerCase()?.trim() || '';
  
  const stepTypeMap: Record<string, IconConfig> = {
    'trigger': { icon: PlayCircle, color: '#DC2626' },
    'webhook': { icon: Webhook, color: '#FF6B35' },
    'manual': { icon: PlayCircle, color: '#DC2626' },
    'action': { icon: Settings, color: '#6B7280' },
    'api_call': { icon: Globe, color: '#0066CC' },
    'condition': { icon: GitBranch, color: '#F97316' },
    'ai_agent_call': { icon: Bot, color: '#10B981' },
    'ai_agent': { icon: Bot, color: '#10B981' },
    'delay': { icon: Clock, color: '#64748B' },
    'wait': { icon: Clock, color: '#64748B' },
    'retry': { icon: RotateCcw, color: '#F59E0B' },
    'loop': { icon: Repeat, color: '#8B5CF6' },
    'fallback': { icon: Shield, color: '#6366F1' },
    'error_handler': { icon: Shield, color: '#EF4444' },
    'notification': { icon: Bell, color: '#F59E0B' },
    'email': { icon: Mail, color: '#EA4335' },
    'sms': { icon: Phone, color: '#F22F46' },
    'slack': { icon: MessageSquare, color: '#4A154B' },
    'discord': { icon: MessageSquare, color: '#5865F2' },
    'teams': { icon: MessageSquare, color: '#6264A7' },
    'database': { icon: Database, color: '#336791' },
    'file': { icon: FileText, color: '#6B7280' },
    'storage': { icon: Archive, color: '#6B7280' },
    'transform': { icon: RefreshCw, color: '#8B5CF6' },
    'filter': { icon: Filter, color: '#6B7280' },
    'sort': { icon: Sort, color: '#6B7280' },
    'validate': { icon: Shield, color: '#10B981' },
    'test': { icon: Target, color: '#F59E0B' },
    'monitor': { icon: Activity, color: '#8B5CF6' },
    'log': { icon: FileText, color: '#6B7280' },
    'analytics': { icon: BarChart, color: '#8B5CF6' },
    'report': { icon: PieChart, color: '#8B5CF6' },
    'schedule': { icon: Calendar, color: '#4285F4' },
    'cron': { icon: Clock, color: '#64748B' },
    'integration': { icon: Link, color: '#0066CC' },
    'sync': { icon: RefreshCw, color: '#6B7280' },
    'backup': { icon: Archive, color: '#6B7280' },
    'restore': { icon: RefreshCw, color: '#10B981' },
    'security': { icon: Lock, color: '#EF4444' },
    'auth': { icon: Key, color: '#F59E0B' },
    'payment': { icon: CreditCard, color: '#10B981' },
    'shipping': { icon: Truck, color: '#F59E0B' },
    'location': { icon: MapPin, color: '#3B82F6' },
    'search': { icon: Search, color: '#6B7280' },
    'recommendation': { icon: Star, color: '#F59E0B' },
    'personalization': { icon: Users, color: '#8B5CF6' },
    'optimization': { icon: TrendingUp, color: '#10B981' },
    'machine_learning': { icon: Bot, color: '#8B5CF6' },
    'ai': { icon: Bot, color: '#00A67E' },
    'nlp': { icon: Bot, color: '#00A67E' },
    'vision': { icon: Eye, color: '#8B5CF6' },
    'speech': { icon: Volume, color: '#8B5CF6' },
    'translation': { icon: Globe, color: '#3B82F6' },
    'content': { icon: FileText, color: '#6B7280' },
    'media': { icon: Image, color: '#8B5CF6' },
    'video': { icon: Video, color: '#EF4444' },
    'audio': { icon: Music, color: '#8B5CF6' },
    'image': { icon: Image, color: '#8B5CF6' },
    'document': { icon: FileText, color: '#6B7280' },
    'pdf': { icon: FileText, color: '#EF4444' },
    'spreadsheet': { icon: FileText, color: '#10B981' },
    'presentation': { icon: FileText, color: '#F59E0B' },
    'code': { icon: Code, color: '#6B7280' },
    'script': { icon: Terminal, color: '#6B7280' },
    'deploy': { icon: Upload, color: '#10B981' },
    'build': { icon: Package, color: '#F59E0B' },
    'test': { icon: Target, color: '#F59E0B' },
    'debug': { icon: Bug, color: '#EF4444' },
    'version': { icon: Tag, color: '#6B7280' },
    'release': { icon: Upload, color: '#10B981' },
    'rollback': { icon: RotateCcw, color: '#EF4444' },
    'default': { icon: Settings, color: '#6B7280' }
  };

  return stepTypeMap[stepTypeLower] || stepTypeMap['default'];
};
