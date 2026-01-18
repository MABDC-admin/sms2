
-- Add missing school_settings table
CREATE TABLE IF NOT EXISTS public.school_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'My School',
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  principal TEXT,
  founded_year INTEGER,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;

-- Policies for school_settings
CREATE POLICY "Anyone can view school settings" ON public.school_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage school settings" ON public.school_settings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Insert default school settings
INSERT INTO public.school_settings (name, address, phone, email, website, principal)
VALUES ('My School', '123 School Street', '+1 234 567 8900', 'admin@school.edu', 'www.school.edu', 'Dr. Principal')
ON CONFLICT DO NOTHING;
