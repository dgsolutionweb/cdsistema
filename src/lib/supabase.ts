import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vlckfgskenwwyxlofrbp.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsY2tmZ3NrZW53d3l4bG9mcmJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0NTIwNzAsImV4cCI6MjA2MTAyODA3MH0.-nsgW7MfwC8OkeiATdrTPMeY91OOwRNEf4d2gYnMiG4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Hook personalizado para autenticação
export const useSupabaseAuth = () => {
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signUp = async (email: string, password: string, userData: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return {
    signIn,
    signUp,
    signOut,
  }
} 