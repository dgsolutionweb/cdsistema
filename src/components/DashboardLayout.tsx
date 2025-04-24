import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  Package,
  Users,
  ShoppingCart,
  BarChart2,
  Settings,
  LogOut,
  Menu,
  X,
  UserCog,
  Receipt
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface SidebarItemProps {
  icon: React.ReactNode
  text: string
  to: string
  active: boolean
}

function SidebarItem({ icon, text, to, active }: SidebarItemProps) {
  return (
    <Link to={to}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`flex items-center space-x-3 px-4 py-3 rounded-lg cursor-pointer ${
          active
            ? 'bg-indigo-500 text-white'
            : 'text-gray-600 hover:bg-indigo-50'
        }`}
      >
        {icon}
        <span className="font-medium">{text}</span>
      </motion.div>
    </Link>
  )
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const { signOut, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const menuItems = [
    { icon: <Home size={20} />, text: 'Dashboard', path: '/dashboard' },
    { icon: <Package size={20} />, text: 'Produtos', path: '/produtos' },
    { icon: <Users size={20} />, text: 'Clientes', path: '/clientes' },
    { icon: <ShoppingCart size={20} />, text: 'PDV', path: '/pdv' },
    { icon: <Receipt size={20} />, text: 'Vendas', path: '/vendas' },
    { icon: <BarChart2 size={20} />, text: 'Relatórios', path: '/relatorios' },
    { icon: <Settings size={20} />, text: 'Configurações', path: '/configuracoes' },
    ...(user?.role === 'superadmin' ? [
      { icon: <UserCog size={20} />, text: 'Gestão de Usuários', path: '/usuarios' }
    ] : [])
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="w-64 bg-white shadow-lg"
          >
            <div className="p-4">
              <h1 className="text-2xl font-bold text-indigo-600">SGC</h1>
            </div>

            <nav className="mt-8 px-2 space-y-1">
              {menuItems.map((item) => (
                <SidebarItem
                  key={item.path}
                  icon={item.icon}
                  text={item.text}
                  to={item.path}
                  active={location.pathname === item.path}
                />
              ))}
            </nav>

            <div className="fixed bottom-0 left-0 w-64 p-4 bg-white border-t">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSignOut}
                className="flex items-center space-x-3 text-gray-600 hover:text-red-500 w-full px-4 py-3 rounded-lg hover:bg-gray-50"
              >
                <LogOut size={20} />
                <span className="font-medium">Sair</span>
              </motion.button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm">
          <div className="px-4 py-4 flex items-center justify-between">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  )
} 