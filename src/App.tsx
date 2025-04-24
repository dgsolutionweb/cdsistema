import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Login } from './pages/Login'
import { Cadastro } from './pages/Cadastro'
import { GestaoUsuarios } from './pages/GestaoUsuarios'
import { DashboardLayout } from './components/DashboardLayout'
import { useAuth } from './contexts/AuthContext'

// Componente de proteção de rota
function PrivateRoute({ children, requireSuperAdmin = false }: { children: React.ReactNode, requireSuperAdmin?: boolean }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Carregando...</div>
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

// Páginas temporárias para desenvolvimento
function Dashboard() {
  return <h1>Dashboard</h1>
}

function Produtos() {
  return <h1>Produtos</h1>
}

function Clientes() {
  return <h1>Clientes</h1>
}

function PDV() {
  return <h1>PDV</h1>
}

function Relatorios() {
  return <h1>Relatórios</h1>
}

function Configuracoes() {
  return <h1>Configurações</h1>
}

export function App() {
  return (
    <BrowserRouter>
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
