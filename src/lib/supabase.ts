import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not configured. Using mock client for development.')
}

export const supabase = createClient<Database>(supabaseUrl || 'http://localhost:54321', supabaseAnonKey || 'mock-key', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'mandoub-taiba-auth',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

export const createServerClient = () => {
  const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('Service role key not configured')
  }
  return createClient<Database>(supabaseUrl || '', serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const signUp = async (email: string, password: string, options?: { data?: Record<string, unknown> }) => {
  const { data, error } = await supabase.auth.signUp({ email, password, options })
  return { data, error }
}

export const sendOtp = async (phone: string) => {
  const { data, error } = await supabase.auth.signInWithOtp({ phone })
  return { data, error }
}

export const verifyOtp = async (phone: string, token: string) => {
  const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' })
  return { data, error }
}

export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  return { data, error }
}

export const updatePassword = async (password: string) => {
  const { data, error } = await supabase.auth.updateUser({ password })
  return { data, error }
}

export const updateProfile = async (data: { full_name?: string; phone?: string; avatar_url?: string }) => {
  const { data: userData, error } = await supabase.auth.updateUser({ data })
  return { data: userData, error }
}

export const onAuthStateChange = (callback: (event: string, session: unknown) => void) => {
  return supabase.auth.onAuthStateChange(callback)
}

export const uploadFile = async (bucket: string, path: string, file: File) => {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  return { data, error }
}

export const deleteFile = async (bucket: string, paths: string[]) => {
  const { data, error } = await supabase.storage.from(bucket).remove(paths)
  return { data, error }
}

export const updateOrderStatus = async (orderId: string, status: string, userId: string, rejectReason?: string) => {
  return supabase.from('vendor_orders').update({ status }).eq('id', orderId)
}

export const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export const subscribeToRealtime = <T extends Record<string, unknown>>(
  table: string,
  filter: string,
  callback: (payload: { new: T; old: T; eventType: string }) => void
) => {
  return supabase
    .channel(`realtime:${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table, filter }, callback)
    .subscribe()
}

export const unsubscribeFromRealtime = (channel: ReturnType<typeof supabase.channel>) => {
  return supabase.removeChannel(channel)
}