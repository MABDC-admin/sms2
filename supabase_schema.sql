-- SMS2 School Management System - Database Schema
-- Run this in your Supabase SQL Editor to create all required tables

-- ============================================
-- SCHOOL SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS school_settings (
  id SERIAL PRIMARY KEY,
  name TEXT DEFAULT '',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  website TEXT DEFAULT '',
  principal TEXT DEFAULT '',
  founded_year TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default school settings
INSERT INTO school_settings (id, name, address, phone, email, website, principal, founded_year)
VALUES (1, 'Green Valley Academy', '123 Education Lane, Metro City', '+1 (555) 123-4567', 'admin@greenvalley.edu', 'www.greenvalley.edu', 'Dr. Maria Santos', '1995')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ACADEMIC YEARS TABLE (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FEE STRUCTURE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS fee_structure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  grade_level TEXT DEFAULT 'All',
  description TEXT DEFAULT '',
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GRADE LEVELS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS grade_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add is_active column if table exists but column doesn't
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grade_levels' AND column_name = 'is_active') THEN
    ALTER TABLE grade_levels ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Insert default grade levels
INSERT INTO grade_levels (name, order_index, is_active) VALUES
  ('Kinder 1', 1, true),
  ('Kinder 2', 2, true),
  ('Grade 1', 3, true),
  ('Grade 2', 4, true),
  ('Grade 3', 5, true),
  ('Grade 4', 6, true),
  ('Grade 5', 7, true),
  ('Grade 6', 8, true),
  ('Grade 7', 9, true),
  ('Grade 8', 10, true),
  ('Grade 9', 11, true),
  ('Grade 10', 12, true),
  ('Grade 11', 13, true),
  ('Grade 12', 14, true)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- NOTIFICATION SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notification_settings (
  id SERIAL PRIMARY KEY,
  email_announcements BOOLEAN DEFAULT true,
  email_grades BOOLEAN DEFAULT true,
  email_attendance BOOLEAN DEFAULT false,
  email_payments BOOLEAN DEFAULT true,
  sms_urgent BOOLEAN DEFAULT true,
  sms_reminders BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default notification settings
INSERT INTO notification_settings (id, email_announcements, email_grades, email_attendance, email_payments, sms_urgent, sms_reminders)
VALUES (1, true, true, false, true, true, false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SYSTEM SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  timezone TEXT DEFAULT 'Asia/Manila',
  currency TEXT DEFAULT 'PHP',
  date_format TEXT DEFAULT 'MM/DD/YYYY',
  grading_system TEXT DEFAULT 'percentage',
  attendance_threshold INTEGER DEFAULT 80,
  late_payment_penalty INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default system settings
INSERT INTO system_settings (id, timezone, currency, date_format, grading_system, attendance_threshold, late_payment_penalty)
VALUES (1, 'Asia/Manila', 'PHP', 'MM/DD/YYYY', 'percentage', 80, 5)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT DEFAULT 'Tuition',
  status TEXT DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue')),
  reference TEXT UNIQUE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ============================================
-- INVOICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no TEXT UNIQUE NOT NULL,
  student_name TEXT NOT NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue', 'partial')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- ============================================
-- EXPENSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL DEFAULT 'Other',
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  approved_by TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('approved', 'pending', 'rejected')),
  receipt_url TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- ============================================
-- EMPLOYEES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  employee_no TEXT UNIQUE,
  name TEXT NOT NULL,
  position TEXT DEFAULT '',
  department TEXT DEFAULT '',
  salary DECIMAL(12,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
  hire_date DATE DEFAULT CURRENT_DATE,
  bank_account TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);

-- ============================================
-- PAYROLL RECORDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payroll_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  basic_salary DECIMAL(12,2) DEFAULT 0,
  deductions DECIMAL(12,2) DEFAULT 0,
  bonuses DECIMAL(12,2) DEFAULT 0,
  net_pay DECIMAL(12,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'paid')),
  paid_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structure ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all authenticated users for now - adjust based on your needs)
CREATE POLICY "Allow all for authenticated users" ON school_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON fee_structure FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON grade_levels FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON notification_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON system_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON employees FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON payroll_records FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Also allow anon access for demo purposes (remove in production)
CREATE POLICY "Allow anon read" ON school_settings FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon all" ON school_settings FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all" ON fee_structure FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all" ON grade_levels FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all" ON notification_settings FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all" ON system_settings FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all" ON payments FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all" ON invoices FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all" ON expenses FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all" ON employees FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all" ON payroll_records FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
-- All tables created successfully!
-- Tables created:
-- 1. school_settings - School information
-- 2. academic_years - Academic year management
-- 3. fee_structure - Fee types and amounts
-- 4. grade_levels - Available grade levels
-- 5. notification_settings - Email/SMS notification preferences
-- 6. system_settings - System configuration
-- 7. payments - Payment records
-- 8. invoices - Student invoices
-- 9. expenses - Expense tracking
-- 10. employees - Employee/staff records
-- 11. payroll_records - Payroll history
