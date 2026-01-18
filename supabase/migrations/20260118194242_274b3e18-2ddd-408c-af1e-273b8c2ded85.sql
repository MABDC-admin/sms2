
-- Add missing phone column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Create notification_settings table
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_announcements BOOLEAN DEFAULT true,
  email_grades BOOLEAN DEFAULT true,
  email_attendance BOOLEAN DEFAULT false,
  email_payments BOOLEAN DEFAULT true,
  sms_urgent BOOLEAN DEFAULT true,
  sms_reminders BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timezone TEXT DEFAULT 'Asia/Manila',
  currency TEXT DEFAULT 'PHP',
  date_format TEXT DEFAULT 'MM/DD/YYYY',
  grading_system TEXT DEFAULT 'percentage',
  attendance_threshold INTEGER DEFAULT 80,
  late_payment_penalty INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create submissions table for teacher dashboard
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID,
  student_id UUID REFERENCES public.student_records(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE,
  score INTEGER,
  teacher_feedback TEXT,
  graded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can manage notification_settings" ON public.notification_settings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage system_settings" ON public.system_settings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can view submissions" ON public.submissions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Students can manage own submissions" ON public.submissions
  FOR ALL USING (auth.uid() = student_id);

-- Insert default settings
INSERT INTO public.notification_settings (email_announcements, email_grades, email_attendance, email_payments, sms_urgent, sms_reminders)
VALUES (true, true, false, true, true, false)
ON CONFLICT DO NOTHING;

INSERT INTO public.system_settings (timezone, currency, date_format, grading_system, attendance_threshold, late_payment_penalty)
VALUES ('Asia/Manila', 'PHP', 'MM/DD/YYYY', 'percentage', 80, 5)
ON CONFLICT DO NOTHING;
