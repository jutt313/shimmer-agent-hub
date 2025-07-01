
-- Create documentation categories table
CREATE TABLE public.documentation_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create documentation articles table
CREATE TABLE public.documentation_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.documentation_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  tags TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  read_count INTEGER DEFAULT 0,
  rating_sum INTEGER DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user progress tracking table
CREATE TABLE public.documentation_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  article_id UUID REFERENCES public.documentation_articles(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT false,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create feedback table
CREATE TABLE public.documentation_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  article_id UUID REFERENCES public.documentation_articles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_helpful BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.documentation_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentation_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentation_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentation_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for documentation_categories (public read)
CREATE POLICY "Anyone can view documentation categories" 
  ON public.documentation_categories 
  FOR SELECT 
  USING (is_active = true);

-- Create policies for documentation_articles (public read)
CREATE POLICY "Anyone can view published documentation articles" 
  ON public.documentation_articles 
  FOR SELECT 
  USING (is_published = true);

-- Create policies for documentation_progress (user-specific)
CREATE POLICY "Users can view their own progress" 
  ON public.documentation_progress 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" 
  ON public.documentation_progress 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" 
  ON public.documentation_progress 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policies for documentation_feedback (user-specific)
CREATE POLICY "Users can view their own feedback" 
  ON public.documentation_feedback 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback" 
  ON public.documentation_feedback 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback" 
  ON public.documentation_feedback 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Insert initial documentation categories
INSERT INTO public.documentation_categories (name, description, icon, sort_order) VALUES
('Getting Started', 'Everything you need to know to get started with automations', 'rocket', 1),
('Automations', 'Creating and managing your automation workflows', 'bot', 2),
('Webhooks', 'Setting up webhooks for real-time automation triggers', 'webhook', 3),
('AI Agents', 'Configuring and using AI assistants in your workflows', 'brain', 4),
('Platform Integrations', 'Connecting external services and platforms', 'plug', 5),
('Troubleshooting', 'Common issues and their solutions', 'help-circle', 6),
('Best Practices', 'Tips and patterns for effective automation', 'star', 7);

-- Insert sample documentation articles
INSERT INTO public.documentation_articles (category_id, title, slug, content, excerpt, tags, sort_order) VALUES
(
  (SELECT id FROM public.documentation_categories WHERE name = 'Getting Started'),
  'Welcome to Your Automation Platform',
  'welcome',
  '# Welcome to Your Automation Platform

Welcome to your powerful automation platform! This guide will help you get started with creating your first automation workflows.

## What You Can Do

With this platform, you can:
- Create automated workflows that connect different services
- Set up webhooks to trigger automations in real-time
- Use AI agents to make intelligent decisions in your workflows
- Monitor and manage all your automations from one place

## Your First Steps

1. **Explore the Dashboard**: Take a look around the main automations page
2. **Create Your First Automation**: Click the "Create Automation" button
3. **Set Up Webhooks**: Configure webhooks for real-time triggers
4. **Add AI Agents**: Enhance your workflows with intelligent assistants

Ready to get started? Let''s create your first automation!',
  'Get started with your automation platform and create your first workflow',
  ARRAY['getting-started', 'welcome', 'first-steps'],
  1
),
(
  (SELECT id FROM public.documentation_categories WHERE name = 'Webhooks'),
  'Understanding Webhooks',
  'understanding-webhooks',
  '# Understanding Webhooks

Webhooks are a powerful way to trigger your automations in real-time when events happen in external systems.

## What Are Webhooks?

A webhook is an HTTP callback that occurs when something happens in a system. Instead of polling for changes, webhooks push data to your automation platform immediately when an event occurs.

## How Webhooks Work

1. **Event Occurs**: Something happens in an external system (like a new order, user signup, etc.)
2. **HTTP Request**: The system sends an HTTP POST request to your webhook URL
3. **Automation Triggers**: Your automation receives the data and processes it
4. **Action Taken**: Your workflow performs the configured actions

## Setting Up Webhooks

To create a webhook:

1. Go to your automation settings
2. Click "Add Webhook"
3. Choose the events you want to listen for
4. Copy the generated webhook URL
5. Configure it in your external system

## Webhook Security

- Each webhook has a unique secret for verification
- Always validate webhook signatures
- Use HTTPS for secure communication

Your webhooks are automatically secured and monitored for reliability.',
  'Learn how webhooks work and how to set them up for real-time automation triggers',
  ARRAY['webhooks', 'real-time', 'triggers', 'integration'],
  1
);
