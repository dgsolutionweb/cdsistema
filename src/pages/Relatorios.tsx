import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { formatCurrency as utilsFormatCurrency, formatDate } from '../lib/utils'
import { format, subDays, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "../components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../components/ui/select"
import { Button } from '../components/ui/button'
import { Calendar as CalendarIcon, Download, Filter, Loader2, FileText, BarChart3, Users, ShoppingBag, DollarSign, ArrowDownUp, Search } from 'lucide-react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table"
import { DatePicker } from "../components/DatePicker"

// Interfaces
interface RelatorioVendas {
  id?: string
  data?: string
  cliente?: string
  valor_total?: number
  forma_pagamento?: string
  status?: string
  itens?: number
  periodo: string
  quantidade: number
  faturamento: number
}

interface RelatorioProdutos {
  id: string
  nome: string
  codigo: string
  quantidade_total: number
  valor_total: number
}

interface RelatorioClientes {
  id: string
  nome: string
  email: string
  telefone: string
  cidade: string
  total_compras: number
  ultima_compra: string
  valor_total_gasto?: number
  valor_total?: number
}

interface RelatorioEstoque {
  id: string
  produto?: string
  nome: string
  codigo: string
  quantidade?: number
  estoque_atual: number
  estoque_minimo: number
  preco_custo?: number
  preco_venda?: number
  categoria?: string
  valor_total_estoque?: number
  status: string
}

interface RelatorioFormaPagamento {
  forma_pagamento: string
  valor_total: number
  percentual: number
}

interface Filtros {
  dataInicio: string
  dataFim: string
  agrupamento: 'diario' | 'semanal' | 'mensal'
  ordenacao: 'maior_valor' | 'menor_valor' | 'maior_quantidade' | 'menor_quantidade'
  limite: number
}

// Função para garantir formatação segura de valores monetários
const formatCurrency = (value: number | string | null | undefined): string => {
  // Log para debug
  console.log('Valor antes da formatação:', value, typeof value);
  
  // Se for null ou undefined, retorna "R$ 0,00"
  if (value === null || value === undefined) {
    return 'R$ 0,00';
  }
  
  // Se for string, tenta converter para número sem perder a precisão
  if (typeof value === 'string') {
    // Remove possíveis caracteres não numéricos exceto ponto decimal
    const cleanValue = value.replace(/[^\d.-]/g, '');
    value = parseFloat(cleanValue);
  }
  
  // Se for NaN após as conversões, retorna zero formatado
  if (typeof value === 'number' && isNaN(value)) {
    return 'R$ 0,00';
  }
  
  // Utiliza a função de formatação existente
  return utilsFormatCurrency(value);
}

export default function Relatorios() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('vendas')
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Estados de dados
  const [relatorioVendas, setRelatorioVendas] = useState<RelatorioVendas[]>([])
  const [relatorioProdutos, setRelatorioProdutos] = useState<RelatorioProdutos[]>([])
  const [relatorioClientes, setRelatorioClientes] = useState<RelatorioClientes[]>([])
  const [relatorioEstoque, setRelatorioEstoque] = useState<RelatorioEstoque[]>([])
  const [relatorioFormaPagamento, setRelatorioFormaPagamento] = useState<RelatorioFormaPagamento[]>([])

  // Estado dos filtros
  const [filtros, setFiltros] = useState<Filtros>({
    dataInicio: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    dataFim: format(new Date(), 'yyyy-MM-dd'),
    agrupamento: 'diario',
    ordenacao: 'maior_valor',
    limite: 20
  })

  useEffect(() => {
    if (user?.empresa_id) {
      carregarDados()
    }
  }, [user, filtros, activeTab])

  const carregarDados = async () => {
    setLoading(true)
    try {
      switch (activeTab) {
        case 'vendas':
          await carregarRelatorioVendas()
          await carregarRelatorioFormaPagamento()
          break
        case 'produtos':
          await carregarRelatorioProdutos()
          break
        case 'clientes':
          await carregarRelatorioClientes()
          break
        case 'estoque':
          await carregarRelatorioEstoque()
          break
      }
    } finally {
      setLoading(false)
    }
  }

  const carregarRelatorioVendas = async () => {
    if (!user?.empresa_id) return

    try {
      const { data, error } = await supabase
        .from('vw_vendas')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .eq('status', 'concluida')
        .gte('created_at', `${filtros.dataInicio}T00:00:00`)
        .lte('created_at', `${filtros.dataFim}T23:59:59`)
        .order('created_at', { ascending: true })

      if (error) throw error

      console.log('Dados originais de vendas:', data);

      // Agrupamento manual por data_venda
      const agrupado: Record<string, {quantidade: number, faturamento: number}> = {}
      
      data.forEach(venda => {
        // Usar uma data padrão se não houver data_venda
        let dataVenda = venda.data_venda;
        if (!dataVenda && venda.created_at) {
          dataVenda = venda.created_at.split('T')[0]; // Pega só a parte da data
        }
        
        // Se ainda não tiver data válida, usar a data atual formatada
        if (!dataVenda) {
          dataVenda = format(new Date(), 'yyyy-MM-dd');
        }
        
        if (!agrupado[dataVenda]) {
          agrupado[dataVenda] = { quantidade: 0, faturamento: 0 }
        }
        agrupado[dataVenda].quantidade += 1
        agrupado[dataVenda].faturamento += Number(venda.valor_final)
      })
      
      const resultado = Object.entries(agrupado).map(([data, valores]) => {
        let periodoFormatado;
        
        try {
          // Verificar se a data existe e tentar formatar de diferentes maneiras
          if (data) {
            // Verificar se a data já está no formato ISO (YYYY-MM-DD)
            if (/^\d{4}-\d{2}-\d{2}/.test(data)) {
              periodoFormatado = format(parseISO(data), 'dd/MM/yyyy');
            } else {
              // Tenta outras abordagens caso não seja ISO
              const dataObj = new Date(data);
              if (!isNaN(dataObj.getTime())) {
                periodoFormatado = format(dataObj, 'dd/MM/yyyy');
              } else {
                // Caso a data seja realmente inválida, usar uma data fictícia mas formatada corretamente
                periodoFormatado = format(new Date(), 'dd/MM/yyyy') + '*';
              }
            }
          } else {
            // Se não tiver data, usar data atual com indicador
            periodoFormatado = format(new Date(), 'dd/MM/yyyy') + '*';
          }
        } catch (err) {
          console.error('Erro ao formatar data:', data, err);
          // Em caso de erro, usar data atual como fallback, mas com indicador
          periodoFormatado = format(new Date(), 'dd/MM/yyyy') + '*';
        }
        
        return {
          periodo: periodoFormatado,
          quantidade: valores.quantidade,
          faturamento: valores.faturamento
        }
      });

      console.log('Resultado formatado:', resultado);
      
      setRelatorioVendas(resultado)
    } catch (error) {
      console.error('Erro ao carregar relatório de vendas:', error)
    }
  }

  const carregarRelatorioFormaPagamento = async () => {
    if (!user?.empresa_id) return

    try {
      const { data, error } = await supabase
        .from('vendas')
        .select('forma_pagamento, valor_final')
        .eq('empresa_id', user.empresa_id)
        .eq('status', 'concluida')
        .gte('created_at', `${filtros.dataInicio}T00:00:00`)
        .lte('created_at', `${filtros.dataFim}T23:59:59`)

      if (error) throw error

      const agrupado: Record<string, number> = {}
      
      data.forEach(venda => {
        const formaPagamento = venda.forma_pagamento
        agrupado[formaPagamento] = (agrupado[formaPagamento] || 0) + Number(venda.valor_final)
      })

      const total = Object.values(agrupado).reduce((acc, valor) => acc + valor, 0)
      
      const resultado = Object.entries(agrupado).map(([forma, valor]) => ({
        forma_pagamento: forma,
        valor_total: valor,
        percentual: (valor / total) * 100
      }))

      setRelatorioFormaPagamento(resultado)
    } catch (error) {
      console.error('Erro ao carregar relatório de formas de pagamento:', error)
    }
  }

  const carregarRelatorioProdutos = async () => {
    if (!user?.empresa_id) return

    try {
      const { data, error } = await supabase
        .from('vw_produtos_mais_vendidos')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        // Filtros de data temporariamente removidos
        .order(filtros.ordenacao === 'maior_valor' ? 'valor_total' : 
               filtros.ordenacao === 'menor_valor' ? 'valor_total' :
               filtros.ordenacao === 'maior_quantidade' ? 'quantidade_total' : 'quantidade_total', 
              { ascending: filtros.ordenacao === 'menor_valor' || filtros.ordenacao === 'menor_quantidade' })
        .limit(filtros.limite)

      if (error) throw error

      // Se conseguir dados, verificar as colunas disponíveis
      if (data && data.length > 0) {
        console.log('Colunas disponíveis em vw_produtos_mais_vendidos:', Object.keys(data[0]))
      }

      setRelatorioProdutos(data || [])
    } catch (error) {
      console.error('Erro ao carregar relatório de produtos:', error)
    }
  }

  const carregarRelatorioClientes = async () => {
    if (!user?.empresa_id) return

    try {
      const { data, error } = await supabase
        .from('vw_clientes_destaque')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        // Filtros de data temporariamente removidos
        .order(filtros.ordenacao === 'maior_valor' ? 'valor_total' : 
               filtros.ordenacao === 'menor_valor' ? 'valor_total' :
               filtros.ordenacao === 'maior_quantidade' ? 'total_compras' : 'total_compras', 
              { ascending: filtros.ordenacao === 'menor_valor' || filtros.ordenacao === 'menor_quantidade' })
        .limit(filtros.limite)

      if (error) throw error

      // Se conseguir dados, verificar as colunas disponíveis
      if (data && data.length > 0) {
        console.log('Colunas disponíveis em vw_clientes_destaque:', Object.keys(data[0]))
      }

      setRelatorioClientes(data || [])
    } catch (error) {
      console.error('Erro ao carregar relatório de clientes:', error)
    }
  }

  const carregarRelatorioEstoque = async () => {
    if (!user?.empresa_id) return

    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('id, nome, codigo, estoque, estoque_minimo')
        .eq('empresa_id', user.empresa_id)
        .order('estoque', { ascending: true })
        .limit(filtros.limite)

      if (error) throw error

      const resultado = data.map(produto => ({
        id: produto.id,
        nome: produto.nome,
        codigo: produto.codigo,
        estoque_atual: produto.estoque,
        estoque_minimo: produto.estoque_minimo,
        status: produto.estoque <= produto.estoque_minimo ? 'Crítico' : 
                produto.estoque <= produto.estoque_minimo * 1.5 ? 'Baixo' : 'Normal'
      }))

      setRelatorioEstoque(resultado)
    } catch (error) {
      console.error('Erro ao carregar relatório de estoque:', error)
    }
  }

  const exportarCSV = () => {
    let dadosCSV = ''
    let nomeArquivo = ''

    switch (activeTab) {
      case 'vendas':
        dadosCSV = 'Período,Quantidade,Faturamento\n'
        dadosCSV += relatorioVendas.map(venda => 
          `${venda.periodo},${venda.quantidade},${venda.faturamento}`
        ).join('\n')
        nomeArquivo = 'relatorio-vendas.csv'
        break
      
      case 'produtos':
        dadosCSV = 'Nome,Código,Quantidade,Valor Total\n'
        dadosCSV += relatorioProdutos.map(produto => 
          `${produto.nome},${produto.codigo},${produto.quantidade_total},${produto.valor_total}`
        ).join('\n')
        nomeArquivo = 'relatorio-produtos.csv'
        break
      
      case 'clientes':
        dadosCSV = 'Nome,Total Compras,Valor Total,Última Compra\n'
        dadosCSV += relatorioClientes.map(cliente => 
          `${cliente.nome},${cliente.total_compras},${cliente.valor_total_gasto},${cliente.ultima_compra}`
        ).join('\n')
        nomeArquivo = 'relatorio-clientes.csv'
        break
      
      case 'estoque':
        dadosCSV = 'Nome,Código,Estoque Atual,Estoque Mínimo,Status\n'
        dadosCSV += relatorioEstoque.map(produto => 
          `${produto.nome},${produto.codigo},${produto.estoque_atual},${produto.estoque_minimo},${produto.status}`
        ).join('\n')
        nomeArquivo = 'relatorio-estoque.csv'
        break
    }

    const blob = new Blob([dadosCSV], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', nomeArquivo)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleFiltroChange = (campo: keyof Filtros, valor: any) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }))
  }

  const CORES = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  // Função para formatar data e hora
  const formatarDataHora = (dataString: string) => {
    if (!dataString) return '-';
    try {
      // Verificar se é um formato ISO completo com data e hora
      if (dataString.includes('T')) {
        return format(parseISO(dataString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
      }
      // Se for apenas data
      return format(parseISO(dataString), 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      console.error('Erro ao formatar data/hora:', dataString, error);
      return dataString; // Retorna a string original se não conseguir formatar
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Relatórios</h1>
        <p className="text-gray-500">Visualize e exporte relatórios do seu negócio</p>
      </div>

      <Tabs defaultValue="vendas" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList className="grid grid-cols-4 w-auto">
            <TabsTrigger value="vendas" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Vendas
            </TabsTrigger>
            <TabsTrigger value="produtos" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Produtos
            </TabsTrigger>
            <TabsTrigger value="clientes" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="estoque" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Estoque
            </TabsTrigger>
          </TabsList>

          <Button variant="outline" className="flex items-center gap-2" onClick={exportarCSV}>
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>

        {/* Filtros comuns */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-md flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataInicio">Data Inicial</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={filtros.dataInicio}
                  onChange={(e) => handleFiltroChange('dataInicio', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataFim">Data Final</Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={filtros.dataFim}
                  onChange={(e) => handleFiltroChange('dataFim', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agrupamento">Agrupamento</Label>
                <Select 
                  value={filtros.agrupamento} 
                  onValueChange={(value: 'diario' | 'semanal' | 'mensal') => handleFiltroChange('agrupamento', value)}
                >
                  <SelectTrigger id="agrupamento">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diario">Diário</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ordenacao">Ordenação</Label>
                <Select 
                  value={filtros.ordenacao} 
                  onValueChange={(value: 'maior_valor' | 'menor_valor' | 'maior_quantidade' | 'menor_quantidade') => handleFiltroChange('ordenacao', value)}
                >
                  <SelectTrigger id="ordenacao">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maior_valor">Maior Valor</SelectItem>
                    <SelectItem value="menor_valor">Menor Valor</SelectItem>
                    <SelectItem value="maior_quantidade">Maior Quantidade</SelectItem>
                    <SelectItem value="menor_quantidade">Menor Quantidade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="limite">Limite de Itens</Label>
                <Select 
                  value={String(filtros.limite)} 
                  onValueChange={(value: string) => handleFiltroChange('limite', Number(value))}
                >
                  <SelectTrigger id="limite">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 itens</SelectItem>
                    <SelectItem value="20">20 itens</SelectItem>
                    <SelectItem value="50">50 itens</SelectItem>
                    <SelectItem value="100">100 itens</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <span className="ml-2 text-gray-600">Carregando dados...</span>
          </div>
        ) : (
          <>
            <TabsContent value="vendas" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Evolução de Vendas</CardTitle>
                  <CardDescription>Visualização do faturamento e quantidade de vendas no período selecionado</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={relatorioVendas} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="periodo" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="quantidade" 
                          name="Quantidade de Vendas" 
                          stroke="#4f46e5" 
                          activeDot={{ r: 8 }} 
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="faturamento" 
                          name="Faturamento (R$)" 
                          stroke="#10b981" 
                          activeDot={{ r: 8 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Formas de Pagamento</CardTitle>
                    <CardDescription>Distribuição de vendas por forma de pagamento</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={relatorioFormaPagamento}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="valor_total"
                            nameKey="forma_pagamento"
                          >
                            {relatorioFormaPagamento.map((entry, index) => (
                              <Cell key={`cell-${index}-${entry.forma_pagamento}`} fill={CORES[index % CORES.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tabela de Vendas</CardTitle>
                    <CardDescription>Resumo de vendas por período</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-64 overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Período</TableHead>
                            <TableHead>Quantidade</TableHead>
                            <TableHead className="text-right">Faturamento</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {relatorioVendas.map((venda, index) => (
                            <TableRow key={index}>
                              <TableCell>{venda.periodo}</TableCell>
                              <TableCell>{venda.quantidade}</TableCell>
                              <TableCell className="text-right">{formatCurrency(venda.faturamento)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="produtos" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Produtos Mais Vendidos</CardTitle>
                  <CardDescription>Os produtos com melhor desempenho no período selecionado</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={relatorioProdutos.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="nome" type="category" width={100} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="quantidade_total" name="Quantidade" fill="#4f46e5" />
                        <Bar dataKey="valor_total" name="Valor Total (R$)" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Lista de Produtos</CardTitle>
                    <CardDescription>Desempenho detalhado de cada produto</CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input 
                      placeholder="Buscar produto..." 
                      className="pl-8" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead className="text-right">Quantidade</TableHead>
                          <TableHead className="text-right">Valor Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {relatorioProdutos
                          .filter(produto => 
                            produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            produto.codigo.toLowerCase().includes(searchTerm.toLowerCase())
                          )
                          .map((produto) => (
                            <TableRow key={produto.id}>
                              <TableCell>{produto.codigo}</TableCell>
                              <TableCell>{produto.nome}</TableCell>
                              <TableCell className="text-right">{produto.quantidade_total}</TableCell>
                              <TableCell className="text-right">{formatCurrency(produto.valor_total)}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="clientes" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Melhores Clientes</CardTitle>
                  <CardDescription>Os clientes que mais contribuíram no período selecionado</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={relatorioClientes.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="nome" type="category" width={100} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="total_compras" name="Total de Compras" fill="#4f46e5" />
                        <Bar dataKey="valor_total_gasto" name="Valor Total (R$)" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Lista de Clientes</CardTitle>
                    <CardDescription>Desempenho detalhado de cada cliente</CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input 
                      placeholder="Buscar cliente..." 
                      className="pl-8" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead className="text-right">Total de Compras</TableHead>
                          <TableHead className="text-right">Valor Total</TableHead>
                          <TableHead className="text-right">Última Compra</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {relatorioClientes
                          .filter(cliente => 
                            cliente.nome.toLowerCase().includes(searchTerm.toLowerCase())
                          )
                          .map((cliente) => (
                            <TableRow key={cliente.id}>
                              <TableCell>{cliente.nome}</TableCell>
                              <TableCell className="text-right">{cliente.total_compras}</TableCell>
                              <TableCell className="text-right">
                                {/* Log do objeto cliente completo para identificar o campo correto */}
                                {console.log('Cliente completo:', cliente)}
                                {cliente.valor_total ? formatCurrency(cliente.valor_total) : 
                                 cliente.valor_total_gasto ? formatCurrency(cliente.valor_total_gasto) : 'R$ 0,00'}
                              </TableCell>
                              <TableCell className="text-right">{formatarDataHora(cliente.ultima_compra)}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="estoque" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-red-600">Produtos Críticos</CardTitle>
                    <CardDescription>Abaixo do estoque mínimo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {relatorioEstoque.filter(p => p.status === 'Crítico').length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-amber-600">Produtos Baixos</CardTitle>
                    <CardDescription>Próximos ao estoque mínimo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {relatorioEstoque.filter(p => p.status === 'Baixo').length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-green-600">Produtos Normais</CardTitle>
                    <CardDescription>Estoque adequado</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {relatorioEstoque.filter(p => p.status === 'Normal').length}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Situação de Estoque</CardTitle>
                    <CardDescription>Status do estoque de produtos</CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input 
                      placeholder="Buscar produto..." 
                      className="pl-8" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead className="text-right">Estoque Atual</TableHead>
                          <TableHead className="text-right">Estoque Mínimo</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {relatorioEstoque
                          .filter(produto => 
                            produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            produto.codigo.toLowerCase().includes(searchTerm.toLowerCase())
                          )
                          .map((produto) => (
                            <TableRow key={produto.id}>
                              <TableCell>{produto.codigo}</TableCell>
                              <TableCell>{produto.nome}</TableCell>
                              <TableCell className="text-right">{produto.estoque_atual}</TableCell>
                              <TableCell className="text-right">{produto.estoque_minimo}</TableCell>
                              <TableCell className="text-right">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  produto.status === 'Crítico' ? 'bg-red-100 text-red-800' : 
                                  produto.status === 'Baixo' ? 'bg-amber-100 text-amber-800' : 
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {produto.status}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
} 