export type AcademicYear = {
  id: string
  name: string
  start_date: string
  end_date: string
  is_active: boolean | null
  created_at: string | null
  updated_at?: string | null
}

export type AdminKpis = {
  total_enrolled_students: number
  total_teachers: number
  active_classes: number
  sections_with_rooms: number
}

export type GenderRatio = {
  male_count: number
  female_count: number
  other_count: number
}

export type AttendanceMonth = {
  month: string
  total_marks: number
  present_marks: number
  present_rate_pct: number
}

export type UserRole = 'admin' | 'teacher' | 'student' | 'finance' | 'principal' | 'registrar' | 'accounting' | 'parent'

export type Profile = {
  id: string
  user_id: string
  role: UserRole | null
  full_name: string | null
  email: string | null
  phone?: string | null
  avatar_url: string | null
  is_active: boolean | null
  created_at: string | null
  updated_at: string | null
  last_login_at?: string | null
}

export type MenuPermission = {
  id: string
  user_id: string
  menu_key: string
  is_allowed: boolean | null
  created_at: string | null
  updated_at: string | null
}

export type TeacherKpis = {
  teacher_id: string
  my_classes: number
  submissions_to_check: number
}

export type Submission = {
  id: string
  assignment_id: string
  student_id: string
  status: 'draft' | 'submitted' | 'late' | 'returned' | 'missing'
  submitted_at: string | null
  late: boolean
  score: number | null
  teacher_feedback: string | null
  graded_at: string | null
  created_at: string
  updated_at: string
  // Joined fields
  assignment_title?: string
  student_name?: string
  class_name?: string
}

export type Class = {
  id: string
  academic_year_id?: string | null
  section_id: string | null
  subject_name: string
  description?: string | null
  class_code?: string | null
  color?: string | null
  is_active?: boolean | null
  created_at: string | null
  teacher_id?: string | null
  school_year_id?: string | null
  schedule?: string | null
  room?: string | null
}

export type StudentKpis = {
  student_id: string
  enrolled_subjects: number
  pending_assignments: number
}

export type Assignment = {
  id: string
  class_id: string
  title: string
  instructions: string | null
  points: number
  due_at: string | null
  published_at: string | null
  created_at: string
  // Joined fields
  class_name?: string
  class_color?: string
}

export type Announcement = {
  id: string
  class_id?: string | null
  title: string | null
  content: string | null
  author_id?: string | null
  published_at?: string | null
  created_at: string | null
  priority?: string | null
  target_roles?: UserRole[] | null
  is_published?: boolean | null
  expires_at?: string | null
  created_by?: string | null
  // Joined fields
  author_name?: string
  class_name?: string
}

export type FinanceKpis = {
  collected_this_month: number
  outstanding_total: number
  expenses_this_month: number
}

export type AgingBuckets = {
  bucket_0_30: number
  bucket_31_60: number
  bucket_60_plus: number
}

export type Transaction = {
  id: string
  type: 'payment' | 'expense'
  amount: number
  description: string
  date: string
  reference?: string
  student_name?: string
  category?: string
}

export type PayrollRun = {
  id: string
  period_month: number
  period_year: number
  status: 'draft' | 'processing' | 'paid' | 'void'
  currency: string
  total_amount: number
  created_at: string
}

export type Employee = {
  id: string
  employee_no: string | null
  name: string
  full_name?: string | null
  position: string | null
  department?: string | null
  basic_salary: number | null
  salary: number | null
  currency: string | null
  is_active: boolean | null
  status?: string | null
  created_at: string | null
}

export type Payment = {
  id: string
  student_id?: string | null
  student_name: string | null
  amount: number
  date: string | null
  type: string | null
  status: string | null
  reference: string | null
  payment_method?: string | null
  received_by?: string | null
  notes?: string | null
  created_at: string | null
}

export type Invoice = {
  id: string
  invoice_no: string | null
  student_id?: string | null
  student_name: string | null
  amount: number
  paid_amount: number | null
  due_date: string | null
  status: string | null
  items?: unknown
  created_at: string | null
}

export type Expense = {
  id: string
  description: string
  amount: number
  category: string | null
  date: string | null
  vendor?: string | null
  approved_by: string | null
  status: string | null
  receipt_url?: string | null
  notes?: string | null
  created_at: string | null
}

export type SchoolEvent = {
  id: string
  title: string
  description?: string | null
  start_date: string
  end_date?: string | null
  event_type?: string | null
  location?: string | null
  is_all_day?: boolean | null
  created_by?: string | null
  created_at?: string | null
}

export type StudentRecord = {
  id: string
  user_id?: string | null
  lrn?: string | null
  student_name: string
  first_name?: string | null
  middle_name?: string | null
  last_name?: string | null
  suffix?: string | null
  birth_date?: string | null
  age?: number | null
  gender?: string | null
  email?: string | null
  phone_number?: string | null
  mother_contact?: string | null
  mother_maiden_name?: string | null
  father_contact?: string | null
  father_name?: string | null
  guardian_info?: string | null
  phil_address?: string | null
  uae_address?: string | null
  level?: string | null
  grade_level_id?: string | null
  strand_id?: string | null
  section_id?: string | null
  previous_school?: string | null
  status?: string | null
  school_year?: string | null
  avatar_url?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type GradeLevel = {
  id: string
  name: string
  short_name: string
  order_index: number
  is_senior_high?: boolean | null
  is_active?: boolean | null
  created_at?: string | null
}

export type Section = {
  id: string
  name: string
  grade_level_id: string
  school_year_id?: string | null
  adviser_id?: string | null
  capacity?: number | null
  room?: string | null
  created_at?: string | null
  updated_at?: string | null
  grade_levels?: GradeLevel
}
