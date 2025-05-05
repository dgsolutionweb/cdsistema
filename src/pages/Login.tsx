import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { motion } from 'framer-motion'
import { LogIn, UserPlus, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

function Alert({ message, type = 'error' }: { message: string, type?: 'error' | 'warning' | 'success' }) {
  const colors = {
    error: 'bg-red-50 text-red-700 border-red-200',
    warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    success: 'bg-green-50 text-green-700 border-green-200'
  }

  return (
    <div className={`rounded-md ${colors[type]} p-4 border`}>
      <div className="flex">
        <AlertCircle className="h-5 w-5 mr-2" />
        <span className="text-sm">{message}</span>
      </div>
    </div>
  )
}

export default function Login() {
  const [email, setEmail] = useState('novo@admin.com')
  const [password, setPassword] = useState('Admin2025')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [detailedError, setDetailedError] = useState<any>(null)
  
  const navigate = useNavigate()
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setDetailedError(null)
    setLoading(true)

    try {
      // Testa diretamente com a API do Supabase para ver detalhes do erro
      const resposta = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (resposta.error) {
        // Armazenar o erro detalhado para visualização
        console.error('Erro detalhado:', resposta.error)
        setDetailedError(resposta.error)
        throw resposta.error
      }

      // Se chegou aqui, login funcionou, continue com fluxo normal
      await signIn(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      if (err.message?.includes('pendente')) {
        setError('Sua conta está pendente de aprovação. Por favor, aguarde o administrador ativar seu acesso.')
      } else if (err.message?.includes('bloqueado')) {
        setError('Sua conta está bloqueada. Entre em contato com o administrador do sistema.')
      } else if (err.message?.includes('Invalid login credentials')) {
        setError('Email ou senha incorretos.')
      } else {
        setError(`Ocorreu um erro ao fazer login: ${err.message || 'Erro desconhecido'}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            C&D Sistemas
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Faça login para acessar o sistema
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <Alert message={error} type="error" />
          )}

          {detailedError && (
            <div className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-32">
              <p className="font-semibold">Detalhes do erro (para debug):</p>
              <pre>{JSON.stringify(detailedError, null, 2)}</pre>
            </div>
          )}

          <div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <LogIn className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" />
              </span>
              {loading ? 'Entrando...' : 'Entrar'}
            </motion.button>
          </div>

          <div>
            <Link to="/cadastro">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                className="group relative w-full flex justify-center py-2 px-4 border-2 border-indigo-600 text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <UserPlus className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" />
                </span>
                Criar nova conta
              </motion.button>
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  )
} 