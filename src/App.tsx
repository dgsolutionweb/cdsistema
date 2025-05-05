import { useState, useEffect } from 'react'
import { createBrowserRouter, RouterProvider, redirect, useRouteError, isRouteErrorResponse, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import Dashboard from './pages/Dashboard'
import Produtos from './pages/Produtos'
import Clientes from './pages/Clientes'
import Vendas from './pages/Vendas'
import PDV from './pages/PDV'
import Caixa from './pages/Caixa'
import Relatorios from './pages/Relatorios'
import Configuracoes from './pages/Configuracoes'
import GestaoUsuarios from './pages/GestaoUsuarios'

// Página de erro
function ErrorPage() {
  const error = useRouteError();
  let errorMessage: string;

  if (isRouteErrorResponse(error)) {
    errorMessage = `${error.status} - ${error.statusText || error.data}`;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    errorMessage = 'Ocorreu um erro desconhecido';
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <h1 className="text-4xl font-bold text-red-600 mb-4">Ops!</h1>
      <p className="text-gray-700 text-lg mb-6">Desculpe, ocorreu um erro inesperado.</p>
      <p className="bg-gray-100 p-3 rounded-md text-gray-600 max-w-md break-words text-sm">
        {errorMessage}
      </p>
      <button 
        onClick={() => window.location.href = '/'}
        className="mt-8 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
      >
        Voltar para a página inicial
      </button>
    </div>
  );
}

// Componente de autenticação para proteger rotas
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  // Se ainda está carregando, mostra um loader
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  // Se não há usuário autenticado, redireciona para login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// Rotas da aplicação
const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
    errorElement: <ErrorPage />
  },
  {
    path: '/login',
    element: <Login />,
    errorElement: <ErrorPage />
  },
  {
    path: '/cadastro',
    element: <Cadastro />,
    errorElement: <ErrorPage />
  },
  {
    path: '/dashboard',
    element: (
      <RequireAuth>
        <Dashboard />
      </RequireAuth>
    ),
    errorElement: <ErrorPage />
  },
  {
    path: '/produtos',
    element: (
      <RequireAuth>
        <Produtos />
      </RequireAuth>
    ),
    errorElement: <ErrorPage />
  },
  {
    path: '/clientes',
    element: (
      <RequireAuth>
        <Clientes />
      </RequireAuth>
    ),
    errorElement: <ErrorPage />
  },
  {
    path: '/vendas',
    element: (
      <RequireAuth>
        <Vendas />
      </RequireAuth>
    ),
    errorElement: <ErrorPage />
  },
  {
    path: '/pdv',
    element: (
      <RequireAuth>
        <PDV />
      </RequireAuth>
    ),
    errorElement: <ErrorPage />
  },
  {
    path: '/caixa',
    element: (
      <RequireAuth>
        <Caixa />
      </RequireAuth>
    ),
    errorElement: <ErrorPage />
  },
  {
    path: '/relatorios',
    element: (
      <RequireAuth>
        <Relatorios />
      </RequireAuth>
    ),
    errorElement: <ErrorPage />
  },
  {
    path: '/configuracoes',
    element: (
      <RequireAuth>
        <Configuracoes />
      </RequireAuth>
    ),
    errorElement: <ErrorPage />
  },
  {
    path: '/usuarios',
    element: (
      <RequireAuth>
        <GestaoUsuarios />
      </RequireAuth>
    ),
    errorElement: <ErrorPage />
  },
  {
    path: '*',
    element: <ErrorPage />
  }
], {
  // Usar o basename se a URL contém /cdsistemas/
  basename: window.location.pathname.includes('/cdsistemas') ? '/cdsistemas' : undefined
});

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
