import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export interface AuthUser {
  id: string
  email: string
  user_metadata: {
    name: string
  }
  role: 'user' | 'admin' | 'superadmin'
  status: 'pendente' | 'ativo' | 'bloqueado'
  empresa_id: string
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        updateUserData(session.user)
      } else {
        setLoading(false)
      }
    })

    // Escutar mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        updateUserData(session.user)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const updateUserData = async (authUser: User) => {
    try {
      // Buscar dados adicionais do usuário do banco
      const { data: userData, error } = await supabase
        .from('usuarios')
        .select('role, status, empresa_id')
        .eq('id', authUser.id)
        .single()

      if (error) {
        console.error('Erro ao buscar dados do usuário:', error)
        setLoading(false)
        return
      }

      setUser({
        id: authUser.id,
        email: authUser.email!,
        user_metadata: {
          name: authUser.user_metadata.name || ''
        },
        role: userData.role,
        status: userData.status,
        empresa_id: userData.empresa_id
      })
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      if (!user) throw new Error('No user found')

      // Verificar status do usuário
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('status, role')
        .eq('id', user.id)
        .single()

      if (userError) throw userError

      if (userData.status === 'pendente') {
        await signOut()
        throw new Error('Usuário pendente de aprovação')
      }

      if (userData.status === 'bloqueado') {
        await signOut()
        throw new Error('Usuário bloqueado')
      }
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      await supabase.auth.signOut()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 