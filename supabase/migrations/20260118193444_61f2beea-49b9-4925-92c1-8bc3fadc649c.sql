
-- Fix security warnings and add missing employees table

-- 1. Fix update_updated_at_column function search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. Add employees table for payroll
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  employee_no TEXT UNIQUE,
  name TEXT NOT NULL,
  full_name TEXT,
  position TEXT,
  department TEXT,
  basic_salary DECIMAL(10,2) DEFAULT 0,
  salary DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'PHP',
  is_active BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Enable RLS on employees
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for employees
CREATE POLICY "Finance can view employees" ON public.employees
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'accounting') OR
    public.has_role(auth.uid(), 'finance')
  );

CREATE POLICY "Admin can manage employees" ON public.employees
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 5. Add trigger for employees updated_at
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Add status column to expenses if missing
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
