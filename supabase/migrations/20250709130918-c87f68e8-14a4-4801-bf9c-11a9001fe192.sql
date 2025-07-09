
-- Remove the problematic foreign key constraint that references public.users
ALTER TABLE public.platform_credentials 
DROP CONSTRAINT IF EXISTS platform_credentials_user_id_fkey;

-- Create a profiles table if it doesn't exist (for user data synchronization)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  email text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY IF NOT EXISTS "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Backfill existing auth users into profiles table
INSERT INTO public.profiles (id, email, full_name)
SELECT 
  id, 
  email,
  COALESCE(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Update platform_credentials RLS policies to ensure they work with auth.uid()
DROP POLICY IF EXISTS "Users can create their own credentials" ON public.platform_credentials;
DROP POLICY IF EXISTS "Users can view their own credentials" ON public.platform_credentials;
DROP POLICY IF EXISTS "Users can update their own credentials" ON public.platform_credentials;
DROP POLICY IF EXISTS "Users can delete their own credentials" ON public.platform_credentials;

CREATE POLICY "Users can create their own credentials" 
  ON public.platform_credentials 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own credentials" 
  ON public.platform_credentials 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own credentials" 
  ON public.platform_credentials 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credentials" 
  ON public.platform_credentials 
  FOR DELETE 
  USING (auth.uid() = user_id);
