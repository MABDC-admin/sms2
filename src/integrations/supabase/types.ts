export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      academic_years: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          is_active: boolean | null
          name: string
          start_date: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          name: string
          start_date: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          name?: string
          start_date?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          content: string | null
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          is_published: boolean | null
          priority: string | null
          published_at: string | null
          target_roles: Database["public"]["Enums"]["user_role"][] | null
          title: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_published?: boolean | null
          priority?: string | null
          published_at?: string | null
          target_roles?: Database["public"]["Enums"]["user_role"][] | null
          title: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_published?: boolean | null
          priority?: string | null
          published_at?: string | null
          target_roles?: Database["public"]["Enums"]["user_role"][] | null
          title?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
          created_at: string | null
          id: string
          room: string | null
          schedule: string | null
          school_year_id: string | null
          section_id: string | null
          subject_name: string
          teacher_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          room?: string | null
          schedule?: string | null
          school_year_id?: string | null
          section_id?: string | null
          subject_name: string
          teacher_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          room?: string | null
          schedule?: string | null
          school_year_id?: string | null
          section_id?: string | null
          subject_name?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          ai_extracted_text: string | null
          ai_metadata: Json | null
          ai_processed_at: string | null
          ai_summary: string | null
          created_at: string | null
          document_type: string | null
          file_name: string
          file_size: number | null
          id: string
          mime_type: string | null
          notes: string | null
          s3_key: string | null
          s3_url: string | null
          student_id: string
          thumbnail_s3_key: string | null
          thumbnail_s3_url: string | null
          uploaded_by: string | null
        }
        Insert: {
          ai_extracted_text?: string | null
          ai_metadata?: Json | null
          ai_processed_at?: string | null
          ai_summary?: string | null
          created_at?: string | null
          document_type?: string | null
          file_name: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          notes?: string | null
          s3_key?: string | null
          s3_url?: string | null
          student_id: string
          thumbnail_s3_key?: string | null
          thumbnail_s3_url?: string | null
          uploaded_by?: string | null
        }
        Update: {
          ai_extracted_text?: string | null
          ai_metadata?: Json | null
          ai_processed_at?: string | null
          ai_summary?: string | null
          created_at?: string | null
          document_type?: string | null
          file_name?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          notes?: string | null
          s3_key?: string | null
          s3_url?: string | null
          student_id?: string
          thumbnail_s3_key?: string | null
          thumbnail_s3_url?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_records"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          basic_salary: number | null
          created_at: string | null
          currency: string | null
          department: string | null
          employee_no: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          name: string
          position: string | null
          profile_id: string | null
          salary: number | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          basic_salary?: number | null
          created_at?: string | null
          currency?: string | null
          department?: string | null
          employee_no?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          position?: string | null
          profile_id?: string | null
          salary?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          basic_salary?: number | null
          created_at?: string | null
          currency?: string | null
          department?: string | null
          employee_no?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          position?: string | null
          profile_id?: string | null
          salary?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          created_at: string | null
          dropped_at: string | null
          enrolled_at: string | null
          id: string
          school_year_id: string
          section_id: string
          status: Database["public"]["Enums"]["enrollment_status"] | null
          student_id: string
        }
        Insert: {
          created_at?: string | null
          dropped_at?: string | null
          enrolled_at?: string | null
          id?: string
          school_year_id: string
          section_id: string
          status?: Database["public"]["Enums"]["enrollment_status"] | null
          student_id: string
        }
        Update: {
          created_at?: string | null
          dropped_at?: string | null
          enrolled_at?: string | null
          id?: string
          school_year_id?: string
          section_id?: string
          status?: Database["public"]["Enums"]["enrollment_status"] | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_records"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approved_by: string | null
          category: string | null
          created_at: string | null
          date: string | null
          description: string
          id: string
          notes: string | null
          receipt_url: string | null
          status: string | null
          vendor: string | null
        }
        Insert: {
          amount: number
          approved_by?: string | null
          category?: string | null
          created_at?: string | null
          date?: string | null
          description: string
          id?: string
          notes?: string | null
          receipt_url?: string | null
          status?: string | null
          vendor?: string | null
        }
        Update: {
          amount?: number
          approved_by?: string | null
          category?: string | null
          created_at?: string | null
          date?: string | null
          description?: string
          id?: string
          notes?: string | null
          receipt_url?: string | null
          status?: string | null
          vendor?: string | null
        }
        Relationships: []
      }
      fee_structures: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          grade_level_id: string | null
          id: string
          is_active: boolean | null
          name: string
          school_year_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          grade_level_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          school_year_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          grade_level_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          school_year_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_structures_grade_level_id_fkey"
            columns: ["grade_level_id"]
            isOneToOne: false
            referencedRelation: "grade_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      grade_levels: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          is_senior_high: boolean | null
          name: string
          order_index: number
          short_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_senior_high?: boolean | null
          name: string
          order_index: number
          short_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_senior_high?: boolean | null
          name?: string
          order_index?: number
          short_name?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          created_at: string | null
          due_date: string | null
          id: string
          invoice_no: string | null
          items: Json | null
          paid_amount: number | null
          status: string | null
          student_id: string | null
          student_name: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          due_date?: string | null
          id?: string
          invoice_no?: string | null
          items?: Json | null
          paid_amount?: number | null
          status?: string | null
          student_id?: string | null
          student_name?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          due_date?: string | null
          id?: string
          invoice_no?: string | null
          items?: Json | null
          paid_amount?: number | null
          status?: string | null
          student_id?: string | null
          student_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_records"
            referencedColumns: ["id"]
          },
        ]
      }
      parents: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          occupation: string | null
          phone_number: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          occupation?: string | null
          phone_number?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          occupation?: string | null
          phone_number?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          date: string | null
          id: string
          notes: string | null
          payment_method: string | null
          received_by: string | null
          reference: string | null
          status: string | null
          student_id: string | null
          student_name: string | null
          type: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          date?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          received_by?: string | null
          reference?: string | null
          status?: string | null
          student_id?: string | null
          student_name?: string | null
          type?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          received_by?: string | null
          reference?: string | null
          status?: string | null
          student_id?: string | null
          student_name?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_records"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_enrollments: {
        Row: {
          age: number | null
          birth_date: string | null
          created_at: string | null
          father_contact: string | null
          first_name: string | null
          gender: string | null
          grade_level_id: string | null
          id: string
          is_complete: boolean | null
          last_name: string | null
          lrn: string | null
          middle_name: string | null
          mother_contact: string | null
          phil_address: string | null
          previous_school: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status:
            | Database["public"]["Enums"]["pending_enrollment_status"]
            | null
          strand_id: string | null
          student_id: string | null
          student_name: string
          submitted_at: string | null
          submitted_by: string | null
          uae_address: string | null
          validation_errors: Json | null
        }
        Insert: {
          age?: number | null
          birth_date?: string | null
          created_at?: string | null
          father_contact?: string | null
          first_name?: string | null
          gender?: string | null
          grade_level_id?: string | null
          id?: string
          is_complete?: boolean | null
          last_name?: string | null
          lrn?: string | null
          middle_name?: string | null
          mother_contact?: string | null
          phil_address?: string | null
          previous_school?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?:
            | Database["public"]["Enums"]["pending_enrollment_status"]
            | null
          strand_id?: string | null
          student_id?: string | null
          student_name: string
          submitted_at?: string | null
          submitted_by?: string | null
          uae_address?: string | null
          validation_errors?: Json | null
        }
        Update: {
          age?: number | null
          birth_date?: string | null
          created_at?: string | null
          father_contact?: string | null
          first_name?: string | null
          gender?: string | null
          grade_level_id?: string | null
          id?: string
          is_complete?: boolean | null
          last_name?: string | null
          lrn?: string | null
          middle_name?: string | null
          mother_contact?: string | null
          phil_address?: string | null
          previous_school?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?:
            | Database["public"]["Enums"]["pending_enrollment_status"]
            | null
          strand_id?: string | null
          student_id?: string | null
          student_name?: string
          submitted_at?: string | null
          submitted_by?: string | null
          uae_address?: string | null
          validation_errors?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_enrollments_grade_level_id_fkey"
            columns: ["grade_level_id"]
            isOneToOne: false
            referencedRelation: "grade_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_enrollments_strand_id_fkey"
            columns: ["strand_id"]
            isOneToOne: false
            referencedRelation: "strands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_records"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      school_events: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          event_type: string | null
          id: string
          is_all_day: boolean | null
          location: string | null
          start_date: string
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          id?: string
          is_all_day?: boolean | null
          location?: string | null
          start_date: string
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          id?: string
          is_all_day?: boolean | null
          location?: string | null
          start_date?: string
          title?: string
        }
        Relationships: []
      }
      school_settings: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          founded_year: number | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          principal: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          founded_year?: number | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          principal?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          founded_year?: number | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          principal?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      sections: {
        Row: {
          adviser_id: string | null
          capacity: number | null
          created_at: string | null
          grade_level_id: string
          id: string
          name: string
          room: string | null
          school_year_id: string | null
          updated_at: string | null
        }
        Insert: {
          adviser_id?: string | null
          capacity?: number | null
          created_at?: string | null
          grade_level_id: string
          id?: string
          name: string
          room?: string | null
          school_year_id?: string | null
          updated_at?: string | null
        }
        Update: {
          adviser_id?: string | null
          capacity?: number | null
          created_at?: string | null
          grade_level_id?: string
          id?: string
          name?: string
          room?: string | null
          school_year_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sections_adviser_id_fkey"
            columns: ["adviser_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_grade_level_id_fkey"
            columns: ["grade_level_id"]
            isOneToOne: false
            referencedRelation: "grade_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      strands: {
        Row: {
          created_at: string | null
          description: string | null
          full_name: string | null
          grade_level_id: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          full_name?: string | null
          grade_level_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          full_name?: string | null
          grade_level_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "strands_grade_level_id_fkey"
            columns: ["grade_level_id"]
            isOneToOne: false
            referencedRelation: "grade_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      student_parents: {
        Row: {
          id: string
          is_primary: boolean | null
          parent_id: string
          relationship: string | null
          student_id: string
        }
        Insert: {
          id?: string
          is_primary?: boolean | null
          parent_id: string
          relationship?: string | null
          student_id: string
        }
        Update: {
          id?: string
          is_primary?: boolean | null
          parent_id?: string
          relationship?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_parents_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_parents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_records"
            referencedColumns: ["id"]
          },
        ]
      }
      student_records: {
        Row: {
          age: number | null
          avatar_url: string | null
          birth_date: string | null
          created_at: string | null
          email: string | null
          father_contact: string | null
          father_name: string | null
          first_name: string | null
          gender: string | null
          grade_level_id: string | null
          guardian_info: string | null
          id: string
          last_name: string | null
          level: string | null
          lrn: string | null
          middle_name: string | null
          mother_contact: string | null
          mother_maiden_name: string | null
          phil_address: string | null
          phone_number: string | null
          previous_school: string | null
          school_year: string | null
          section_id: string | null
          status: Database["public"]["Enums"]["student_status"] | null
          strand_id: string | null
          student_name: string
          suffix: string | null
          uae_address: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string | null
          email?: string | null
          father_contact?: string | null
          father_name?: string | null
          first_name?: string | null
          gender?: string | null
          grade_level_id?: string | null
          guardian_info?: string | null
          id?: string
          last_name?: string | null
          level?: string | null
          lrn?: string | null
          middle_name?: string | null
          mother_contact?: string | null
          mother_maiden_name?: string | null
          phil_address?: string | null
          phone_number?: string | null
          previous_school?: string | null
          school_year?: string | null
          section_id?: string | null
          status?: Database["public"]["Enums"]["student_status"] | null
          strand_id?: string | null
          student_name: string
          suffix?: string | null
          uae_address?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string | null
          email?: string | null
          father_contact?: string | null
          father_name?: string | null
          first_name?: string | null
          gender?: string | null
          grade_level_id?: string | null
          guardian_info?: string | null
          id?: string
          last_name?: string | null
          level?: string | null
          lrn?: string | null
          middle_name?: string | null
          mother_contact?: string | null
          mother_maiden_name?: string | null
          phil_address?: string | null
          phone_number?: string | null
          previous_school?: string | null
          school_year?: string | null
          section_id?: string | null
          status?: Database["public"]["Enums"]["student_status"] | null
          strand_id?: string | null
          student_name?: string
          suffix?: string | null
          uae_address?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_records_grade_level_id_fkey"
            columns: ["grade_level_id"]
            isOneToOne: false
            referencedRelation: "grade_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_records_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_records_strand_id_fkey"
            columns: ["strand_id"]
            isOneToOne: false
            referencedRelation: "strands"
            referencedColumns: ["id"]
          },
        ]
      }
      subject_assignments: {
        Row: {
          created_at: string | null
          id: string
          room: string | null
          schedule: string | null
          school_year_id: string | null
          section_id: string
          subject_id: string
          teacher_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          room?: string | null
          schedule?: string | null
          school_year_id?: string | null
          section_id: string
          subject_id: string
          teacher_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          room?: string | null
          schedule?: string | null
          school_year_id?: string | null
          section_id?: string
          subject_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subject_assignments_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_assignments_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          units: number | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          units?: number | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          units?: number | null
        }
        Relationships: []
      }
      suggestions_reviews: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          email: string | null
          id: string
          message: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          subject: string | null
          submitted_by: string | null
          type: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          message: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          subject?: string | null
          submitted_by?: string | null
          type: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          message?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          subject?: string | null
          submitted_by?: string | null
          type?: string
        }
        Relationships: []
      }
      teachers: {
        Row: {
          created_at: string | null
          department: string | null
          email: string | null
          employee_no: string | null
          first_name: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          phone_number: string | null
          position: string | null
          profile_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email?: string | null
          employee_no?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          phone_number?: string | null
          position?: string | null
          profile_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string | null
          employee_no?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          phone_number?: string | null
          position?: string | null
          profile_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_menu_permissions: {
        Row: {
          created_at: string | null
          id: string
          is_allowed: boolean | null
          menu_key: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_allowed?: boolean | null
          menu_key: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_allowed?: boolean | null
          menu_key?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_principal: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      enrollment_status: "enrolled" | "dropped" | "transferred" | "completed"
      pending_enrollment_status: "pending" | "approved" | "rejected"
      student_status:
        | "active"
        | "inactive"
        | "graduated"
        | "transferred"
        | "dropped"
      user_role:
        | "admin"
        | "principal"
        | "registrar"
        | "accounting"
        | "teacher"
        | "student"
        | "finance"
        | "parent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      enrollment_status: ["enrolled", "dropped", "transferred", "completed"],
      pending_enrollment_status: ["pending", "approved", "rejected"],
      student_status: [
        "active",
        "inactive",
        "graduated",
        "transferred",
        "dropped",
      ],
      user_role: [
        "admin",
        "principal",
        "registrar",
        "accounting",
        "teacher",
        "student",
        "finance",
        "parent",
      ],
    },
  },
} as const
