
-- Create AI Section Configurations table for admin control
CREATE TABLE public.ai_section_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_name text NOT NULL UNIQUE,
  custom_instructions text DEFAULT '',
  rules text[] DEFAULT '{}',
  examples text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_section_configurations ENABLE ROW LEVEL SECURITY;

-- Create policies - only admins can manage these configurations
CREATE POLICY "Admins can manage AI section configurations" 
  ON public.ai_section_configurations 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN ('chaffanjutt313@gmail.com', 'admin@yusrai.com', 'support@yusrai.com')
    )
  );

-- Insert default configurations for all 7 sections
INSERT INTO public.ai_section_configurations (section_name, custom_instructions, is_active) VALUES
('summary', 'Keep summary concise, business-focused, and under 3 lines', true),
('steps', 'Provide clear, numbered steps with data transformation details', true),
('platforms', 'Use exact platform names and real credential field names', true),
('clarification_questions', 'Ask specific, actionable questions, maximum 5 per response', true),
('agents', 'Recommend agents for complex decision-making and data processing', true),
('test_payloads', 'Include base_url, test_endpoint, success/error indicators, validation_rules', true),
('execution_blueprint', 'Include base_url, exact endpoints, methods, headers for each workflow step', true);
