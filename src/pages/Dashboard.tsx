import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Calendar,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  User,
  CreditCard,
  Wallet,
  QrCode,
  Info,
  ArrowRight,
  Loader2,
  BarChart2,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/utils'
import { format, subDays, startOfMonth, endOfMonth, isToday, isYesterday, parseISO, startOfToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

// Interfaces dos dados
interface DashboardStats {
  clientesTotal: number
  produtosTotal: number
  vendasMes: number
  vendasHoje: number
  faturamentoMes: number
  faturamentoHoje: number
  ticketMedio: number
  produtosBaixoEstoque: number
}

interface VendaRecente {
  id: string
  numero_venda: number
  valor_final: number
  forma_pagamento: string
  created_at: string
  cliente_nome: string | null
}

interface ProdutoMaisVendido {
  id: string
  nome: string
  codigo: string
  quantidade_total: number
  valor_total: number
}

interface ClienteDestaque {
  id: string
  nome: string
  total_compras: number
  valor_total: number
  ultima_compra: string
}

interface EstoqueAlerta {
  id: string
  nome: string
  codigo: string
  estoque: number
  estoque_minimo: number
}

interface VendasPorFormaPagamento {
  dinheiro: number
  pix: number
  credito: number
  debito: number
  crediario: number
}

interface EvolucaoVendas {
  data: string
  total_vendas: number
  valor_total: number
}

// Componente para os cards de resumo
function SummaryCard({ title, value, icon: Icon, color, trend, trendValue, info }: {
  title: string
  value: string | number
  icon: any
  color: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  info?: string
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-10 ${color}`} />
      
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center text-xs font-medium rounded-full px-2 py-1 ${
            trend === 'up' ? 'text-green-700 bg-green-50' :
            trend === 'down' ? 'text-red-700 bg-red-50' :
            'text-gray-700 bg-gray-50'
          }`}>
            {trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : 
             trend === 'down' ? <TrendingDown className="h-3 w-3 mr-1" /> : null}
            {trendValue}
          </div>
        )}
      </div>
      
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
        {info && <p className="text-xs text-gray-500">{info}</p>}
      </div>
    </motion.div>
  )
}

// Componente para as vendas recentes
function RecentSales({ vendas }: { vendas: VendaRecente[] }) {
  const navigate = useNavigate();

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'dinheiro':
        return <Wallet className="h-4 w-4 text-green-500" />;
      case 'pix':
        return <QrCode className="h-4 w-4 text-purple-500" />;
      case 'credito':
      case 'debito':
        return <CreditCard className="h-4 w-4 text-blue-500" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return `Hoje, ${format(date, 'HH:mm')}`;
    } else if (isYesterday(date)) {
      return `Ontem, ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'dd/MM/yyyy, HH:mm');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Vendas Recentes</h3>
        <motion.button 
          onClick={() => navigate('/vendas')}
          className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Ver todas <ChevronRight className="h-4 w-4 ml-1" />
        </motion.button>
      </div>
      
      <div className="space-y-4">
        {vendas.length > 0 ? (
          vendas.map((venda) => (
            <motion.div 
              key={venda.id} 
              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
              whileHover={{ scale: 1.01, backgroundColor: 'rgba(249, 250, 251, 1)' }}
              onClick={() => navigate(`/vendas`, { state: { visualizarVenda: venda.id } })}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mr-3">
                  {getPaymentIcon(venda.forma_pagamento)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {venda.cliente_nome ? venda.cliente_nome : 'Cliente não identificado'} 
                    <span className="text-gray-500 ml-1">#{venda.numero_venda}</span>
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(venda.created_at)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{formatCurrency(venda.valor_final)}</p>
                <p className="text-xs text-gray-500 capitalize">{venda.forma_pagamento}</p>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-8 text-center text-gray-500">
            <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>Nenhuma venda recente</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Componente para os produtos com alerta de estoque
function StockAlerts({ produtos }: { produtos: EstoqueAlerta[] }) {
  const navigate = useNavigate();

  const handleRepor = (produto: EstoqueAlerta) => {
    navigate(`/produtos`, { 
      state: { 
        action: 'repor', 
        produtoId: produto.id,
        produtoNome: produto.nome,
        produtoCodigo: produto.codigo,
        produtoEstoque: produto.estoque
      } 
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Alertas de Estoque</h3>
        <motion.button 
          onClick={() => navigate('/produtos', { state: { filter: 'baixo_estoque' } })}
          className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Ver todos <ChevronRight className="h-4 w-4 ml-1" />
        </motion.button>
      </div>
      
      <div className="space-y-4">
        {produtos.length > 0 ? (
          produtos.map((produto, index) => (
            <motion.div 
              key={`estoque-${produto.id}-${index}`} 
              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
              whileHover={{ scale: 1.01, backgroundColor: 'rgba(249, 250, 251, 1)' }}
            >
              <div className="flex items-center">
                <div className={`w-10 h-10 flex items-center justify-center mr-3 rounded-full 
                  ${produto.estoque < produto.estoque_minimo / 2 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`
                }>
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{produto.nome}</p>
                  <p className="text-xs text-gray-500">
                    <span className={produto.estoque < produto.estoque_minimo / 2 ? 'text-red-600 font-medium' : ''}>
                      {produto.estoque} em estoque
                    </span> 
                    {' '}(mín: {produto.estoque_minimo})
                  </p>
                </div>
              </div>
              <div className="text-right">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRepor(produto);
                  }}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Repor
                </motion.button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-8 text-center text-gray-500">
            <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>Nenhum produto com estoque baixo</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Componente para os produtos mais vendidos
function TopProducts({ produtos }: { produtos: ProdutoMaisVendido[] }) {
  const navigate = useNavigate();
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Produtos Mais Vendidos</h3>
        <motion.button 
          onClick={() => navigate('/produtos', { state: { filter: 'mais_vendidos' } })}
          className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Ver todos <ChevronRight className="h-4 w-4 ml-1" />
        </motion.button>
      </div>
      
      <div className="space-y-4">
        {produtos.length > 0 ? (
          produtos.map((produto) => (
            <motion.div 
              key={produto.id} 
              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
              whileHover={{ scale: 1.01, backgroundColor: 'rgba(249, 250, 251, 1)' }}
              onClick={() => navigate(`/produtos`, { state: { visualizarProduto: produto.id } })}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mr-3">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{produto.nome}</p>
                  <p className="text-xs text-gray-500">Cód: {produto.codigo}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{produto.quantidade_total} un.</p>
                <p className="text-xs text-gray-500">{formatCurrency(produto.valor_total)}</p>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-8 text-center text-gray-500">
            <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>Nenhum produto vendido ainda</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Componente para os clientes destaque
function TopCustomers({ clientes }: { clientes: ClienteDestaque[] }) {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Sem compras';
    const date = parseISO(dateString);
    if (isToday(date)) {
      return `Hoje, ${format(date, 'HH:mm')}`;
    } else if (isYesterday(date)) {
      return `Ontem, ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'dd/MM/yyyy');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Clientes em Destaque</h3>
        <motion.button 
          onClick={() => navigate('/clientes', { state: { filter: 'destaques' } })}
          className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Ver todos <ChevronRight className="h-4 w-4 ml-1" />
        </motion.button>
      </div>
      
      <div className="space-y-4">
        {clientes.length > 0 ? (
          clientes.map((cliente) => (
            <motion.div 
              key={cliente.id} 
              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
              whileHover={{ scale: 1.01, backgroundColor: 'rgba(249, 250, 251, 1)' }}
              onClick={() => navigate(`/clientes`, { state: { visualizarCliente: cliente.id } })}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center mr-3">
                  <User className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{cliente.nome}</p>
                  <p className="text-xs text-gray-500">{cliente.total_compras} compras</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{formatCurrency(cliente.valor_total)}</p>
                <p className="text-xs text-gray-500">{formatDate(cliente.ultima_compra)}</p>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-8 text-center text-gray-500">
            <User className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>Nenhum cliente com compras ainda</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Componente de gráfico para a evolução de vendas
function SalesEvolutionChart({ dados }: { dados: EvolucaoVendas[] }) {
  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr)
    return format(date, 'dd/MM', { locale: ptBR })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Evolução de Vendas</h3>
      <p className="text-sm text-gray-500 mb-4">Últimos 7 dias</p>
      
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={dados}
            margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="data" 
              tick={{ fontSize: 12 }}
              tickFormatter={formatXAxis}
            />
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value}`}
              domain={[0, 'dataMax + 2']}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatCurrency(value).replace('R$', '')}
              domain={[0, 'dataMax + 100']}
            />
            <Tooltip formatter={(value, name) => {
              if (name === 'Vendas') return value;
              return formatCurrency(value as number);
            }} />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="total_vendas"
              name="Vendas"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="valor_total"
              name="Faturamento"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// Componente de gráfico para vendas por forma de pagamento
function PaymentMethodsChart({ data }: { data: VendasPorFormaPagamento }) {
  const COLORS = ['#10b981', '#8b5cf6', '#3b82f6', '#6366f1', '#f59e0b']
  
  const chartData = [
    { name: 'Dinheiro', value: data.dinheiro },
    { name: 'Pix', value: data.pix },
    { name: 'Crédito', value: data.credito },
    { name: 'Débito', value: data.debito },
    { name: 'Crediário', value: data.crediario }
  ].filter(item => item.value > 0)
  
  const total = chartData.reduce((sum, item) => sum + item.value, 0)
  
  const renderLabel = (entry: any) => {
    const percent = Math.round((entry.value / total) * 100)
    return `${percent}%`
  }
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Formas de Pagamento</h3>
      <p className="text-sm text-gray-500 mb-4">Distribuição das vendas do mês</p>
      
      <div className="h-72 flex flex-col items-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              label={renderLabel}
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(value as number)} />
          </PieChart>
        </ResponsiveContainer>
        
        <div className="grid grid-cols-3 gap-2 mt-4 w-full">
          {chartData.map((entry, index) => (
            <div key={index} className="flex items-center text-xs">
              <div 
                className="w-3 h-3 mr-2 rounded-full" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }} 
              />
              {entry.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Componente principal do Dashboard
export function Dashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    clientesTotal: 0,
    produtosTotal: 0,
    vendasMes: 0,
    vendasHoje: 0,
    faturamentoMes: 0,
    faturamentoHoje: 0,
    ticketMedio: 0,
    produtosBaixoEstoque: 0
  })
  const [vendasRecentes, setVendasRecentes] = useState<VendaRecente[]>([])
  const [produtosMaisVendidos, setProdutosMaisVendidos] = useState<ProdutoMaisVendido[]>([])
  const [clientesDestaque, setClientesDestaque] = useState<ClienteDestaque[]>([])
  const [produtosBaixoEstoque, setProdutosBaixoEstoque] = useState<EstoqueAlerta[]>([])
  const [vendasPorFormaPagamento, setVendasPorFormaPagamento] = useState<VendasPorFormaPagamento>({
    dinheiro: 0,
    pix: 0,
    credito: 0,
    debito: 0,
    crediario: 0
  })
  const [evolucaoVendas, setEvolucaoVendas] = useState<EvolucaoVendas[]>([])

  // Função para carregar estatísticas do dashboard
  async function loadDashboardStats() {
    setLoading(true)
    try {
      if (!user?.empresa_id) return
      
      // Total de clientes
      const { count: clientesCount, error: clientesError } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', user.empresa_id)
      
      if (clientesError) throw clientesError
      
      // Total de produtos
      const { count: produtosCount, error: produtosError } = await supabase
        .from('produtos')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', user.empresa_id)
      
      if (produtosError) throw produtosError
      
      // Início do mês atual
      const inicioMes = startOfMonth(new Date()).toISOString()
      
      // Vendas do mês
      const { count: vendasMesCount, error: vendasMesError } = await supabase
        .from('vendas')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', user.empresa_id)
        .gte('created_at', inicioMes)
      
      if (vendasMesError) throw vendasMesError
      
      // Início do dia atual
      const inicioHoje = startOfToday().toISOString()
      
      // Vendas do dia
      const { count: vendasHojeCount, error: vendasHojeError } = await supabase
        .from('vendas')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', user.empresa_id)
        .gte('created_at', inicioHoje)
      
      if (vendasHojeError) throw vendasHojeError
      
      // Faturamento do mês
      const { data: faturamentoMesData, error: faturamentoMesError } = await supabase
        .from('vendas')
        .select('valor_final')
        .eq('empresa_id', user.empresa_id)
        .gte('created_at', inicioMes)
      
      if (faturamentoMesError) throw faturamentoMesError
      
      const faturamentoMes = faturamentoMesData?.reduce(
        (total, venda) => total + Number(venda.valor_final), 0
      ) || 0
      
      // Faturamento do dia
      const { data: faturamentoHojeData, error: faturamentoHojeError } = await supabase
        .from('vendas')
        .select('valor_final')
        .eq('empresa_id', user.empresa_id)
        .gte('created_at', inicioHoje)
      
      if (faturamentoHojeError) throw faturamentoHojeError
      
      const faturamentoHoje = faturamentoHojeData?.reduce(
        (total, venda) => total + Number(venda.valor_final), 0
      ) || 0
      
      const ticketMedio = faturamentoMes > 0 && (vendasMesCount ?? 0) > 0
        ? faturamentoMes / (vendasMesCount ?? 0)
        : 0
      
      // Produtos com estoque baixo
      const { data: produtosBaixoEstoqueData, error: estoqueBaixoError } = await supabase
        .from('produtos')
        .select('id, estoque, estoque_minimo')
        .eq('empresa_id', user.empresa_id)
      
      if (estoqueBaixoError) throw estoqueBaixoError
      
      const estoqueBaixoCount = produtosBaixoEstoqueData?.filter(
        produto => produto.estoque < produto.estoque_minimo
      ).length || 0
      
      setStats({
        clientesTotal: clientesCount || 0,
        produtosTotal: produtosCount || 0,
        vendasMes: vendasMesCount || 0,
        vendasHoje: vendasHojeCount || 0,
        faturamentoMes,
        faturamentoHoje,
        ticketMedio,
        produtosBaixoEstoque: estoqueBaixoCount || 0
      })
      
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Função para carregar vendas recentes
  async function loadVendasRecentes() {
    try {
      if (!user?.empresa_id) return
      
      const { data, error } = await supabase
        .from('vw_vendas_dashboard')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (error) throw error
      
      setVendasRecentes(data || [])
    } catch (error) {
      console.error('Erro ao carregar vendas recentes:', error)
    }
  }
  
  // Função para carregar produtos mais vendidos
  async function loadProdutosMaisVendidos() {
    try {
      if (!user?.empresa_id) return
      
      // Início do mês atual
      const inicioMes = startOfMonth(new Date()).toISOString()
      
      const { data, error } = await supabase
        .from('vw_produtos_mais_vendidos')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .gte('data_venda', inicioMes)
        .order('quantidade_total', { ascending: false })
        .limit(5)
      
      if (error) throw error
      
      setProdutosMaisVendidos(data || [])
    } catch (error) {
      console.error('Erro ao carregar produtos mais vendidos:', error)
    }
  }
  
  // Função para carregar melhores clientes
  async function loadClientesDestaque() {
    try {
      if (!user?.empresa_id) return
      
      const { data, error } = await supabase
        .from('vw_clientes_destaque')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .order('valor_total', { ascending: false })
        .limit(5)
      
      if (error) throw error
      
      setClientesDestaque(data || [])
    } catch (error) {
      console.error('Erro ao carregar melhores clientes:', error)
    }
  }
  
  // Função para carregar produtos com estoque baixo
  async function loadProdutosBaixoEstoque() {
    try {
      if (!user?.empresa_id) return
      
      const { data, error } = await supabase
        .from('produtos')
        .select('id, nome, codigo, estoque, estoque_minimo')
        .eq('empresa_id', user.empresa_id)
      
      if (error) throw error
      
      // Filtrar produtos com estoque abaixo do mínimo
      const produtosFiltrados = data
        ?.filter(produto => produto.estoque < produto.estoque_minimo)
        .sort((a, b) => a.estoque - b.estoque)
        .slice(0, 5) || []
      
      setProdutosBaixoEstoque(produtosFiltrados)
    } catch (error) {
      console.error('Erro ao carregar produtos com estoque baixo:', error)
    }
  }
  
  // Função para carregar vendas por forma de pagamento
  async function loadVendasPorFormaPagamento() {
    try {
      if (!user?.empresa_id) return
      
      // Início do mês atual
      const inicioMes = startOfMonth(new Date()).toISOString()
      
      const { data, error } = await supabase
        .from('vendas')
        .select('forma_pagamento, valor_final')
        .eq('empresa_id', user.empresa_id)
        .gte('created_at', inicioMes)
      
      if (error) throw error
      
      const resumo: VendasPorFormaPagamento = {
        dinheiro: 0,
        pix: 0,
        credito: 0,
        debito: 0,
        crediario: 0
      }
      
      data?.forEach(venda => {
        const formaPagamento = venda.forma_pagamento as keyof VendasPorFormaPagamento
        if (formaPagamento in resumo) {
          resumo[formaPagamento] += Number(venda.valor_final)
        }
      })
      
      setVendasPorFormaPagamento(resumo)
    } catch (error) {
      console.error('Erro ao carregar vendas por forma de pagamento:', error)
    }
  }
  
  // Função para carregar evolução de vendas
  async function loadEvolucaoVendas() {
    try {
      if (!user?.empresa_id) return
      
      // Últimos 7 dias
      const dataFinal = new Date()
      const dataInicial = subDays(dataFinal, 6)
      
      const { data, error } = await supabase
        .from('vw_evolucao_vendas_diarias')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .gte('data', dataInicial.toISOString())
        .lte('data', dataFinal.toISOString())
        .order('data', { ascending: true })
      
      if (error) throw error
      
      // Preencher dias sem vendas
      const resultado: EvolucaoVendas[] = []
      for (let i = 0; i <= 6; i++) {
        const currentDate = subDays(dataFinal, 6 - i)
        const formattedDate = format(currentDate, 'yyyy-MM-dd')
        
        const diaEncontrado = data?.find(item => 
          format(new Date(item.data), 'yyyy-MM-dd') === formattedDate
        )
        
        resultado.push({
          data: formattedDate,
          total_vendas: diaEncontrado ? diaEncontrado.total_vendas : 0,
          valor_total: diaEncontrado ? diaEncontrado.valor_total : 0
        })
      }
      
      setEvolucaoVendas(resultado)
    } catch (error) {
      console.error('Erro ao carregar evolução de vendas:', error)
    }
  }
  
  // Carregar dados ao inicializar
  useEffect(() => {
    if (user) {
      loadDashboardStats()
      loadVendasRecentes()
      loadProdutosMaisVendidos()
      loadClientesDestaque()
      loadProdutosBaixoEstoque()
      loadVendasPorFormaPagamento()
      loadEvolucaoVendas()
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando dados do dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
        <p className="text-gray-500">Resumo dos principais indicadores do seu negócio</p>
      </div>
      
      {/* Grid de cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Total de Clientes"
          value={stats.clientesTotal}
          icon={Users}
          color="bg-blue-500"
          info="Base de clientes cadastrados"
        />
        <SummaryCard
          title="Vendas do Mês"
          value={stats.vendasMes}
          icon={ShoppingCart}
          color="bg-green-500"
          trend="up"
          trendValue={`${stats.vendasHoje} hoje`}
          info={`${formatCurrency(stats.faturamentoMes)} em vendas`}
        />
        <SummaryCard
          title="Faturamento de Hoje"
          value={formatCurrency(stats.faturamentoHoje)}
          icon={DollarSign}
          color="bg-amber-500"
          info={`Ticket médio: ${formatCurrency(stats.ticketMedio)}`}
        />
        <SummaryCard
          title="Estoque Crítico"
          value={stats.produtosBaixoEstoque}
          icon={AlertTriangle}
          color="bg-red-500"
          trend={stats.produtosBaixoEstoque > 0 ? 'down' : 'neutral'}
          trendValue={stats.produtosBaixoEstoque > 0 ? 'Atenção' : 'Normalizado'}
          info="Produtos abaixo do mínimo"
        />
      </div>

      {/* Seção de gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <SalesEvolutionChart dados={evolucaoVendas} />
        <PaymentMethodsChart data={vendasPorFormaPagamento} />
      </div>

      {/* Grid de painéis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1 */}
        <div className="space-y-6">
          <RecentSales vendas={vendasRecentes} />
          <StockAlerts produtos={produtosBaixoEstoque} />
        </div>
        
        {/* Coluna 2 */}
        <div className="space-y-6">
          <TopProducts produtos={produtosMaisVendidos} />
        </div>
        
        {/* Coluna 3 */}
        <div className="space-y-6">
          <TopCustomers clientes={clientesDestaque} />
        </div>
      </div>
    </div>
  )
} 