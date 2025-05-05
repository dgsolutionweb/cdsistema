import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { Database } from '../types/database.types'

export interface AuthUser {
  id: string
  email: string
  nome: string
  tipo: 'super_admin' | 'admin_empresa' | 'operador'
  status: 'pendente' | 'ativo' | 'bloqueado'
  empresa_id: string | null
  avatar_url?: string | null
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
        .select('nome, tipo, status, empresa_id, avatar_url')
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
        nome: userData.nome,
        tipo: userData.tipo,
        status: userData.status,
        empresa_id: userData.empresa_id,
        avatar_url: userData.avatar_url
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
      if (!user) throw new Error('Usuário não encontrado')

      // Verificar status do usuário
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('status, tipo')
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