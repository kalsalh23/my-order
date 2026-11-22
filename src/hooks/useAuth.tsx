import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { supabase, getCurrentUser, onAuthStateChange } from '@/lib/supabase'
import type { User, UserRole } from '@/types'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single()

      if (profile) {
        setUser({
          id: profile.id,
          email: profile.email,
          phone: profile.phone,
          full_name: profile.full_name,
          role: profile.role,
          avatar_url: profile.avatar_url,
          is_active: profile.is_active,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        })
      } else {
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          phone: supabaseUser.phone,
          full_name: supabaseUser.user_metadata?.full_name || '',
          role: (supabaseUser.user_metadata?.role as UserRole) || 'customer',
          avatar_url: supabaseUser.user_metadata?.avatar_url,
          is_active: true,
          created_at: supabaseUser.created_at,
          updated_at: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setUser(null)
    }
  }

  const refreshUser = async () => {
    const currentUser = await getCurrentUser()
    if (currentUser) {
      await fetchUserProfile(currentUser)
    } else {
      setUser(null)
      setSession(null)
    }
  }

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        setSession(currentSession)
        if (currentSession?.user) {
          await fetchUserProfile(currentSession.user)
        }
      } catch (error) {
        console.error('Auth init error:', error)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    let unsubscribeFn: (() => void) | undefined
    try {
      const { data: { subscription } } = onAuthStateChange(async (event, newSession) => {
        setSession(newSession)
        if (newSession?.user) {
          await fetchUserProfile(newSession.user)
        } else {
          setUser(null)
        }
        setLoading(false)
      })
      if (subscription) {
        unsubscribeFn = () => subscription.unsubscribe()
      }
    } catch (error) {
      console.error('Auth subscription error:', error)
    }

    return () => {
      if (unsubscribeFn) unsubscribeFn()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}