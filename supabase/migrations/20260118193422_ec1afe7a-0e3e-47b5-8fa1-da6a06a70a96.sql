
-- ============================================
-- SCHOOL MANAGEMENT SYSTEM - COMPLETE SCHEMA
-- ============================================

-- 1. ENUMS
-- ============================================
CREATE TYPE public.user_role AS ENUM (
  'admin', 
  'principal', 
  'registrar', 
  'accounting', 
  'teacher', 
  'student', 
  'finance',
  'parent'
);

CREATE TYPE public.enrollment_status AS ENUM (
  'enrolled', 
  'dropped', 
  'transferred', 
  'completed'
);

CREATE TYPE public.student_status AS ENUM (
  'active', 
  'inactive', 
  'graduated', 
  'transferred', 
  'dropped'
);

CREATE TYPE public.pending_enrollment_status AS ENUM (
  'pending', 
  'approved', 
  'rejected'
);

-- 2. SECURITY DEFINER FUNCTIONS (Created first to avoid dependency issues)
-- ============================================

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Function to check if user is admin or principal
CREATE OR REPLACE FUNCTION public.is_admin_or_principal(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'principal')
  )
$$;

-- 3. PROFILES TABLE
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role user_role,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. ACADEMIC STRUCTURE
-- ============================================

-- Academic Years / School Years
CREATE TABLE public.academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Grade Levels
CREATE TABLE public.grade_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  is_senior_high BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Strands (for Senior High School)
CREATE TABLE public.strands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  full_name TEXT,
  description TEXT,
  grade_level_id UUID REFERENCES public.grade_levels(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Sections
CREATE TABLE public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  grade_level_id UUID REFERENCES public.grade_levels(id) ON DELETE CASCADE NOT NULL,
  school_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE,
  adviser_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  capacity INTEGER DEFAULT 40,
  room TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. PEOPLE TABLES
-- ============================================

-- Students (Main student records table)
CREATE TABLE public.student_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  lrn TEXT UNIQUE,
  student_name TEXT NOT NULL,
  first_name TEXT,
  middle_name TEXT,
  last_name TEXT,
  suffix TEXT,
  birth_date DATE,
  age INTEGER,
  gender TEXT,
  email TEXT,
  phone_number TEXT,
  mother_contact TEXT,
  mother_maiden_name TEXT,
  father_contact TEXT,
  father_name TEXT,
  guardian_info TEXT,
  phil_address TEXT,
  uae_address TEXT,
  level TEXT,
  grade_level_id UUID REFERENCES public.grade_levels(id) ON DELETE SET NULL,
  strand_id UUID REFERENCES public.strands(id) ON DELETE SET NULL,
  section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
  previous_school TEXT,
  status student_status DEFAULT 'active',
  school_year TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Teachers
CREATE TABLE public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_no TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone_number TEXT,
  department TEXT,
  position TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Parents
CREATE TABLE public.parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone_number TEXT,
  occupation TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Student-Parent relationship
CREATE TABLE public.student_parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.student_records(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.parents(id) ON DELETE CASCADE NOT NULL,
  relationship TEXT,
  is_primary BOOLEAN DEFAULT false,
  UNIQUE (student_id, parent_id)
);

-- 6. ENROLLMENT & CURRICULUM
-- ============================================

-- Enrollments
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.student_records(id) ON DELETE CASCADE NOT NULL,
  section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE NOT NULL,
  school_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE NOT NULL,
  status enrollment_status DEFAULT 'enrolled',
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  dropped_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (student_id, section_id, school_year_id)
);

-- Pending Enrollments
CREATE TABLE public.pending_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.student_records(id) ON DELETE SET NULL,
  lrn TEXT,
  student_name TEXT NOT NULL,
  first_name TEXT,
  middle_name TEXT,
  last_name TEXT,
  birth_date DATE,
  age INTEGER,
  gender TEXT,
  grade_level_id UUID REFERENCES public.grade_levels(id),
  strand_id UUID REFERENCES public.strands(id),
  mother_contact TEXT,
  father_contact TEXT,
  phil_address TEXT,
  uae_address TEXT,
  previous_school TEXT,
  status pending_enrollment_status DEFAULT 'pending',
  submitted_by UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  validation_errors JSONB,
  is_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Subjects
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  units INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Subject Assignments (Teacher-Subject-Section)
CREATE TABLE public.subject_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
  section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE NOT NULL,
  school_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE,
  schedule TEXT,
  room TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (subject_id, section_id, school_year_id)
);

-- Classes (for classroom functionality)
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_name TEXT NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.academic_years(id),
  schedule TEXT,
  room TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. DOCUMENTS
-- ============================================
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.student_records(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  s3_key TEXT,
  s3_url TEXT,
  thumbnail_s3_key TEXT,
  thumbnail_s3_url TEXT,
  document_type TEXT,
  ai_extracted_text TEXT,
  ai_summary TEXT,
  ai_metadata JSONB,
  ai_processed_at TIMESTAMP WITH TIME ZONE,
  uploaded_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. FINANCE TABLES
-- ============================================

-- Fee Structures
CREATE TABLE public.fee_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  grade_level_id UUID REFERENCES public.grade_levels(id),
  school_year_id UUID REFERENCES public.academic_years(id),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.student_records(id) ON DELETE SET NULL,
  student_name TEXT,
  amount DECIMAL(10,2) NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  type TEXT,
  status TEXT DEFAULT 'completed',
  reference TEXT,
  payment_method TEXT,
  received_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Invoices
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no TEXT UNIQUE,
  student_id UUID REFERENCES public.student_records(id) ON DELETE SET NULL,
  student_name TEXT,
  amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  due_date DATE,
  status TEXT DEFAULT 'unpaid',
  items JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Expenses
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT,
  date DATE DEFAULT CURRENT_DATE,
  vendor TEXT,
  approved_by UUID REFERENCES auth.users(id),
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 9. COMMUNICATION & EVENTS
-- ============================================

-- School Events
CREATE TABLE public.school_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  event_type TEXT,
  location TEXT,
  is_all_day BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Announcements
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  priority TEXT DEFAULT 'normal',
  target_roles user_role[],
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 10. ACCESS CONTROL
-- ============================================

-- User Menu Permissions (for granular access control)
CREATE TABLE public.user_menu_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  menu_key TEXT NOT NULL,
  is_allowed BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, menu_key)
);

-- 11. SUGGESTIONS & REVIEWS
-- ============================================
CREATE TABLE public.suggestions_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  submitted_by TEXT,
  email TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_menu_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestions_reviews ENABLE ROW LEVEL SECURITY;

-- User Roles Policies
CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin_or_principal(auth.uid()));

CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Allow profile creation" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Academic Years Policies (readable by all authenticated)
CREATE POLICY "Anyone can view academic years" ON public.academic_years
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage academic years" ON public.academic_years
  FOR ALL USING (public.is_admin_or_principal(auth.uid()));

-- Grade Levels Policies
CREATE POLICY "Anyone can view grade levels" ON public.grade_levels
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage grade levels" ON public.grade_levels
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Strands Policies
CREATE POLICY "Anyone can view strands" ON public.strands
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage strands" ON public.strands
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Sections Policies
CREATE POLICY "Anyone can view sections" ON public.sections
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage sections" ON public.sections
  FOR ALL USING (public.is_admin_or_principal(auth.uid()));

-- Student Records Policies
CREATE POLICY "Staff can view all students" ON public.student_records
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'principal') OR
    public.has_role(auth.uid(), 'registrar') OR
    public.has_role(auth.uid(), 'teacher')
  );

CREATE POLICY "Students can view own record" ON public.student_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Registrars can manage students" ON public.student_records
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'registrar')
  );

-- Classes Policies
CREATE POLICY "Anyone can view classes" ON public.classes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage classes" ON public.classes
  FOR ALL USING (public.is_admin_or_principal(auth.uid()));

-- Subjects Policies
CREATE POLICY "Anyone can view subjects" ON public.subjects
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage subjects" ON public.subjects
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Teachers Policies
CREATE POLICY "Anyone can view teachers" ON public.teachers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage teachers" ON public.teachers
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Parents Policies
CREATE POLICY "Parents can view own record" ON public.parents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all parents" ON public.parents
  FOR SELECT USING (public.is_admin_or_principal(auth.uid()));

-- Student Parents Policies
CREATE POLICY "Staff can view student-parent links" ON public.student_parents
  FOR SELECT TO authenticated USING (true);

-- Enrollments Policies
CREATE POLICY "Staff can view enrollments" ON public.enrollments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Registrars can manage enrollments" ON public.enrollments
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'registrar')
  );

-- Pending Enrollments Policies
CREATE POLICY "Staff can view pending enrollments" ON public.pending_enrollments
  FOR SELECT USING (public.is_admin_or_principal(auth.uid()) OR public.has_role(auth.uid(), 'registrar'));

CREATE POLICY "Registrars can manage pending enrollments" ON public.pending_enrollments
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'registrar')
  );

-- Subject Assignments Policies
CREATE POLICY "Anyone can view subject assignments" ON public.subject_assignments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage subject assignments" ON public.subject_assignments
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Documents Policies
CREATE POLICY "Staff can view documents" ON public.documents
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'registrar')
  );

CREATE POLICY "Registrars can manage documents" ON public.documents
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'registrar')
  );

-- Fee Structures Policies
CREATE POLICY "Finance staff can view fees" ON public.fee_structures
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Finance can manage fees" ON public.fee_structures
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'accounting') OR
    public.has_role(auth.uid(), 'finance')
  );

-- Payments Policies
CREATE POLICY "Finance can view payments" ON public.payments
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'accounting') OR
    public.has_role(auth.uid(), 'finance')
  );

CREATE POLICY "Finance can manage payments" ON public.payments
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'accounting') OR
    public.has_role(auth.uid(), 'finance')
  );

-- Invoices Policies
CREATE POLICY "Finance can view invoices" ON public.invoices
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'accounting') OR
    public.has_role(auth.uid(), 'finance')
  );

CREATE POLICY "Finance can manage invoices" ON public.invoices
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'accounting') OR
    public.has_role(auth.uid(), 'finance')
  );

-- Expenses Policies
CREATE POLICY "Finance can view expenses" ON public.expenses
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'accounting') OR
    public.has_role(auth.uid(), 'finance')
  );

CREATE POLICY "Finance can manage expenses" ON public.expenses
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'accounting') OR
    public.has_role(auth.uid(), 'finance')
  );

-- School Events Policies
CREATE POLICY "Anyone can view events" ON public.school_events
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage events" ON public.school_events
  FOR ALL USING (public.is_admin_or_principal(auth.uid()));

-- Announcements Policies
CREATE POLICY "Users can view published announcements" ON public.announcements
  FOR SELECT USING (is_published = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage announcements" ON public.announcements
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- User Menu Permissions Policies
CREATE POLICY "Users can view own permissions" ON public.user_menu_permissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all permissions" ON public.user_menu_permissions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Suggestions Reviews Policies
CREATE POLICY "Anyone can submit suggestions" ON public.suggestions_reviews
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Admins can view suggestions" ON public.suggestions_reviews
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage suggestions" ON public.suggestions_reviews
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_academic_years_updated_at
  BEFORE UPDATE ON public.academic_years
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sections_updated_at
  BEFORE UPDATE ON public.sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_records_updated_at
  BEFORE UPDATE ON public.student_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at
  BEFORE UPDATE ON public.teachers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_menu_permissions_updated_at
  BEFORE UPDATE ON public.user_menu_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Create storage buckets for avatars and documents
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('student-avatars', 'student-avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('teacher-avatars', 'teacher-avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('registrar-avatars', 'registrar-avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('principal-avatars', 'principal-avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('accounting-avatars', 'accounting-avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Storage policies for avatars (public read)
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id IN ('avatars', 'student-avatars', 'teacher-avatars', 'registrar-avatars', 'principal-avatars', 'accounting-avatars'));

CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('avatars', 'student-avatars', 'teacher-avatars', 'registrar-avatars', 'principal-avatars', 'accounting-avatars'));

CREATE POLICY "Users can update their own avatars" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id IN ('avatars', 'student-avatars', 'teacher-avatars', 'registrar-avatars', 'principal-avatars', 'accounting-avatars'));

CREATE POLICY "Users can delete their own avatars" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id IN ('avatars', 'student-avatars', 'teacher-avatars', 'registrar-avatars', 'principal-avatars', 'accounting-avatars'));

-- Storage policies for documents (private)
CREATE POLICY "Staff can view documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents');

CREATE POLICY "Staff can upload documents" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents');
