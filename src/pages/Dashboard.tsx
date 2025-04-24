import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Package, 
  Bell,
  ChevronDown,
  LogOut
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

// Componente para os cards de resumo
function SummaryCard({ title, value, icon: Icon, color }: {
  title: string
  value: string | number
  icon: any
  color: string
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-white p-6 rounded-lg shadow-sm border border-gray-100`}
    >
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </motion.div>
  )
}

// Componente para a lista de atividades recentes
function RecentActivity() {
  const activities = [
    {
      id: 1,
      description: 'Nova venda registrada',
      time: 'Há 5 minutos',
      type: 'venda'
    },
    {
      id: 2,
      description: 'Novo cliente cadastrado',
      time: 'Há 15 minutos',
      type: 'cliente'
    },
    {
      id: 3,
      description: 'Produto atualizado',
      time: 'Há 30 minutos',
      type: 'produto'
    }
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividades Recentes</h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-indigo-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Componente principal do Dashboard
export function Dashboard() {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Grid de cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Total de Clientes"
          value="156"
          icon={Users}
          color="bg-blue-500"
        />
        <SummaryCard
          title="Vendas do Mês"
          value="32"
          icon={ShoppingCart}
          color="bg-green-500"
        />
        <SummaryCard
          title="Faturamento"
          value="R$ 24.550,00"
          icon={DollarSign}
          color="bg-yellow-500"
        />
        <SummaryCard
          title="Produtos"
          value="89"
          icon={Package}
          color="bg-purple-500"
        />
      </div>

      {/* Seção de gráficos e atividades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Área para gráficos (2/3 do espaço) */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Visão Geral das Vendas</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
            <p className="text-gray-500">Gráfico de vendas será implementado aqui</p>
          </div>
        </div>

        {/* Atividades recentes (1/3 do espaço) */}
        <div className="lg:col-span-1">
          <RecentActivity />
        </div>
      </div>
    </div>
  )
} 