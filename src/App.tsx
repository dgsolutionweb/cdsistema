import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Login } from './pages/Login'
import { Cadastro } from './pages/Cadastro'
import { GestaoUsuarios } from './pages/GestaoUsuarios'
import { DashboardLayout } from './components/DashboardLayout'
import { useAuth } from './contexts/AuthContext'
import { Dashboard } from './pages/Dashboard'
import { Produtos } from './pages/Produtos'
import { Clientes } from './pages/Clientes'
import { Loader2 } from 'lucide-react'
import { PDV } from './pages/PDV'
import { Vendas } from './pages/Vendas'
import { Caixa } from './pages/Caixa'
import { Relatorios } from './pages/Relatorios'
import Configuracoes from './pages/Configuracoes'

// Componente de loading
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
        <p className="mt-2 text-sm text-gray-600">Carregando...</p>
      </div>
    </div>
  )
}

// Componente de proteção de rota
function PrivateRoute({ children, requireSuperAdmin = false }: { children: React.ReactNode, requireSuperAdmin?: boolean }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  // Verificar se o usuário é superadmin quando necessário
  if (requireSuperAdmin && user.role !== 'superadmin') {
    return <Navigate to="/dashboard" />
  }

  return <>{children}</>
}

// Página temporária para desenvolvimento
// function Configuracoes() {
//   return <h1>Configurações</h1>
// }

export function App() {
  return (
    <BrowserRouter basename="/cdsistemas">
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          
          {/* Rota de Gestão de Usuários (apenas superadmin) */}
          <Route
            path="/usuarios"
            element={
              <PrivateRoute requireSuperAdmin>
                <DashboardLayout>
                  <GestaoUsuarios />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          
          {/* Rotas protegidas */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          
          <Route
            path="/produtos"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <Produtos />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          
          <Route
            path="/clientes"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <Clientes />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          
          <Route
            path="/pdv"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <PDV />
                </DashboardLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/vendas"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <Vendas />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          
          <Route
            path="/caixa"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <Caixa />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          
          <Route
            path="/relatorios"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <Relatorios />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          
          <Route
            path="/configuracoes"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <Configuracoes />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          
          {/* Redireciona para o dashboard por padrão */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
