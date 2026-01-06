import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

type UserRole = 'admin' | 'teacher' | 'student' | 'finance' | 'principal' | null

interface Profile {
  id: string
  full_name: string
  role: UserRole
  avatar_url: string | null
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    // Listen for auth changes FIRST (prevents missing events)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        setTimeout(() => {
          if (active) void fetchProfile(session.user.id)
        }, 0)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        setTimeout(() => {
          if (active) void fetchProfile(session.user.id)
        }, 0)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, avatar_url')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      // Keep this silent in production; profile might not exist yet.
      setProfile(null)
      setLoading(false)
      return
    }

    setProfile((data as Profile) ?? null)
    setLoading(false)
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error as Error | null }
  }

  async function signUp(email: string, password: string, fullName: string, role: UserRole) {
    const emailRedirectTo = `${window.location.origin}/`

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: {
          full_name: fullName,
          role: role,
        },
      },
    })

    if (!error && data.user) {
      // Create profile
      await supabase.from('profiles').upsert({
        user_id: data.user.id,
        full_name: fullName,
        role: role,
        email: email,
      })
    }

    return { error: error as Error | null }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
