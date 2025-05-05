import React from 'react'
import { useState, useEffect } from 'react'
import { 
  Search,
  Calendar,
  Sliders,
  Plus,
  Settings2,
  ChevronRight,
  Eye,
  CreditCard,
  DollarSign,
  QrCode,
  Building2,
  Wallet,
  Info,
  Loader2,
  ArrowLeft,
  Share2,
  Printer,
  X,
  AlertTriangle
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { formatCurrency } from '../lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertMessage } from '../components/AlertMessage'

interface Venda {
  id: string
  numero_venda: number
  cliente_nome: string | null
  forma_pagamento: string
  valor_final: number
  created_at: string
  status: 'concluida' | 'cancelada'
  valor_total: number
  desconto_tipo: 'porcentagem' | 'valor' | null
  desconto_valor: number | null
  cliente: {
    nome: string | null
    cpf: string | null
  } | null
  usuario_nome: string
  empresa_nome: string
}

interface VendaCompleta extends Venda {
  empresa: {
    id: string
    nome: string
    cnpj: string | null
    telefone: string | null
    endereco: string | null
  }
  itens: {
    quantidade: number
    valor_unitario: number
    subtotal: number
    produto: {
      nome: string
      codigo: string
    }
  }[]
}

interface Filtros {
  dataInicio: string
  dataFim: string
  status: string
  formaPagamento: string
}

interface Estatisticas {
  total: number
  quantidade: number
  ticketMedio: number
}

interface Alert {
  type: 'success' | 'error'
  message: string
}

const formasPagamentoIcones: Record<string, JSX.Element> = {
  dinheiro: <DollarSign className="h-5 w-5" />,
  pix: <QrCode className="h-5 w-5" />,
  credito: <CreditCard className="h-5 w-5" />,
  debito: <CreditCard className="h-5 w-5" />,
  crediario: <Building2 className="h-5 w-5" />
}

export default function Vendas() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [vendas, setVendas] = useState<Venda[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showFiltros, setShowFiltros] = useState(false)
  const [vendaSelecionada, setVendaSelecionada] = useState<Venda | null>(null)
  const [showDetalhesModal, setShowDetalhesModal] = useState(false)
  const [showConfirmCancelar, setShowConfirmCancelar] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [filtros, setFiltros] = useState<Filtros>({
    dataInicio: new Date(new Date().setHours(0, 0, 0, 0)).toISOString().split('T')[0],
    dataFim: new Date(new Date().setHours(23, 59, 59, 999)).toISOString().split('T')[0],
    status: 'todas',
    formaPagamento: 'todas'
  })
  const [estatisticas, setEstatisticas] = useState<Estatisticas>({
    total: 0,
    quantidade: 0,
    ticketMedio: 0
  })
  const [alert, setAlert] = useState<Alert | null>(null)
  const [filteredVendas, setFilteredVendas] = useState<Venda[]>([])
  const [statusAtivo, setStatusAtivo] = useState<'todas' | 'concluida' | 'cancelada'>('todas')

  useEffect(() => {
    if (user?.empresa_id) {
      buscarVendas()
    }
  }, [user, statusAtivo])

  useEffect(() => {
    if (searchTerm) {
      const filtered = vendas.filter(venda => 
        venda.numero_venda.toString().includes(searchTerm) ||
        venda.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venda.cliente?.cpf?.includes(searchTerm) ||
        venda.usuario_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatCurrency(venda.valor_final).includes(searchTerm)
      )
      setFilteredVendas(filtered)
    } else {
      setFilteredVendas(vendas)
    }
  }, [searchTerm, vendas])

  const buscarVendas = async () => {
    try {
      setLoading(true)

      if (!user?.empresa_id) return

      let query = supabase
        .from('vw_vendas')
        .select('*')
        .eq('empresa_id', user.empresa_id)

      // Aplicar filtro de data se não for hoje
      const hoje = new Date().toISOString().split('T')[0]
      if (filtros.dataInicio !== hoje || filtros.dataFim !== hoje) {
        query = query
          .gte('created_at', `${filtros.dataInicio}T00:00:00`)
          .lte('created_at', `${filtros.dataFim}T23:59:59`)
      }

      // Aplicar filtro de status
      if (statusAtivo !== 'todas') {
        query = query.eq('status', statusAtivo)
      }

      // Aplicar filtro de forma de pagamento
      if (filtros.formaPagamento !== 'todas') {
        query = query.eq('forma_pagamento', filtros.formaPagamento)
      }

      // Ordenar por data mais recente e número da venda
      query = query.order('created_at', { ascending: false })
                  .order('numero_venda', { ascending: false })

      const { data, error } = await query

      if (error) throw error

      console.log('Vendas encontradas:', data?.length || 0)
      setVendas(data || [])
      setFilteredVendas(data || [])

      // Calcular estatísticas
      const total = data?.reduce((acc, venda) => acc + venda.valor_final, 0) || 0
      const quantidade = data?.length || 0
      const ticketMedio = quantidade > 0 ? total / quantidade : 0

      setEstatisticas({
        total,
        quantidade,
        ticketMedio
      })

    } catch (error) {
      console.error('Erro ao buscar vendas:', error)
      setAlert({
        type: 'error',
        message: 'Erro ao carregar vendas. Tente novamente.'
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePeriodoChange = (dataInicio: string, dataFim: string) => {
    setFiltros(prev => ({
      ...prev,
      dataInicio: dataInicio.split('T')[0],
      dataFim: dataFim.split('T')[0]
    }))
  }

  const formatarData = (data: string) => {
    return format(new Date(data), "EEE - dd/MM", { locale: ptBR })
  }

  const formatarDesconto = (venda: Venda): string => {
    if (!venda.desconto_valor || venda.desconto_valor <= 0) return '-'
    
    if (venda.desconto_tipo === 'porcentagem') {
      return `${venda.desconto_valor}%`
    }
    
    return formatCurrency(venda.desconto_valor)
  }

  const formatarRecibo = (venda: VendaCompleta) => {
    const dataVenda = new Date(venda.created_at).toLocaleString('pt-BR')
    const descontoFormatado = venda.desconto_valor 
      ? venda.desconto_tipo === 'porcentagem'
        ? `${venda.desconto_valor}%`
        : formatCurrency(venda.desconto_valor)
      : null

    // Gerar código de barras da venda
    const codigoVenda = `${venda.numero_venda}`.padStart(6, '0')
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Cupom Fiscal</title>
        <style>
          @page { 
            margin: 0mm;
            size: 80mm 297mm;
          }
          body {
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 15px;
            width: 80mm;
            font-size: 12px;
            color: #333;
          }
          .center { text-align: center; }
          .divider { 
            border-top: 1px dashed #999; 
            margin: 8px 0;
          }
          .bold { font-weight: bold; }
          .item {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
          }
          .small { font-size: 10px; }
          .empresa-nome {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 4px;
          }
          .empresa-info {
            font-size: 10px;
            color: #666;
            margin-bottom: 2px;
          }
          .cupom-header {
            font-size: 14px;
            font-weight: bold;
            margin: 8px 0;
          }
          .codigo-venda {
            font-family: 'Courier New', monospace;
            font-size: 14px;
            letter-spacing: 2px;
            margin: 4px 0;
          }
          .item-produto {
            margin: 6px 0;
          }
          .item-nome {
            font-weight: bold;
            margin-bottom: 2px;
          }
          .item-detalhes {
            display: flex;
            justify-content: space-between;
            color: #666;
            font-size: 10px;
          }
          .totais {
            margin: 10px 0;
            padding: 8px;
            background-color: #f8f8f8;
            border-radius: 4px;
          }
          .total-final {
            font-size: 16px;
            font-weight: bold;
            color: #000;
            margin-top: 6px;
            padding-top: 6px;
            border-top: 1px solid #ddd;
          }
          .pagamento-info {
            background-color: #f0f0f0;
            padding: 8px;
            border-radius: 4px;
            margin: 8px 0;
          }
          .codigo-barras {
            margin: 15px 0;
            text-align: center;
          }
          .rodape {
            margin-top: 15px;
            text-align: center;
            font-size: 10px;
            color: #666;
          }
          @media print {
            body {
              padding: 5mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="empresa-nome">
            ${venda.empresa.nome}
          </div>
          ${venda.empresa.cnpj ? `
            <div class="empresa-info">
              CNPJ: ${venda.empresa.cnpj}
            </div>
          ` : ''}
          ${venda.empresa.endereco ? `
            <div class="empresa-info">
              ${venda.empresa.endereco}
            </div>
          ` : ''}
          ${venda.empresa.telefone ? `
            <div class="empresa-info">
              Tel: ${venda.empresa.telefone}
            </div>
          ` : ''}
        </div>
        
        <div class="divider"></div>
        
        <div class="center">
          <div class="cupom-header">CUPOM NÃO FISCAL</div>
          <div class="codigo-venda">#${codigoVenda}</div>
          <div class="small">${dataVenda}</div>
        </div>

        <div class="divider"></div>

        ${venda.cliente_nome ? `
          <div class="pagamento-info">
            <div class="bold">DADOS DO CLIENTE</div>
            <div class="small">
              <div>${venda.cliente_nome}</div>
              ${venda.cliente?.cpf ? `<div>CPF: ${venda.cliente.cpf}</div>` : ''}
            </div>
          </div>
        ` : ''}

        <div class="bold">ITENS DO PEDIDO</div>
        ${venda.itens.map(item => `
          <div class="item-produto">
            <div class="item-nome">
              ${item.produto.nome}
            </div>
            <div class="item-detalhes">
              <span>Cód: ${item.produto.codigo}</span>
              <span>${item.quantidade}x ${formatCurrency(item.valor_unitario)}</span>
              <span>${formatCurrency(item.subtotal)}</span>
            </div>
          </div>
        `).join('')}

        <div class="divider"></div>

        <div class="totais">
          <div class="item">
            <span>Subtotal</span>
            <span>${formatCurrency(venda.valor_total)}</span>
          </div>

          ${descontoFormatado ? `
            <div class="item" style="color: #d32f2f;">
              <span>Desconto (${descontoFormatado})</span>
              <span>-${formatCurrency(venda.valor_total - venda.valor_final)}</span>
            </div>
          ` : ''}

          <div class="item total-final">
            <span>TOTAL</span>
            <span>${formatCurrency(venda.valor_final)}</span>
          </div>
        </div>

        <div class="pagamento-info">
          <div class="bold">PAGAMENTO</div>
          <div class="small">
            Forma: ${venda.forma_pagamento.toUpperCase()}
            <br>
            Status: ${venda.status === 'concluida' ? 'APROVADO' : 'CANCELADO'}
            <br>
            Data/Hora: ${dataVenda}
          </div>
        </div>

        <div class="codigo-barras">
          <img src="https://bwipjs-api.metafloor.com/?bcid=code128&text=${codigoVenda}&scale=2&height=10&includetext&textxalign=center" alt="Código de barras" />
        </div>

        <div class="divider"></div>

        <div class="rodape">
          <p>
            Obrigado pela preferência!
            <br>
            ${venda.empresa.nome}
            <br>
            Venda processada em ${dataVenda}
          </p>
        </div>
      </body>
      </html>
    `
  }

  const handleImprimirRecibo = async (venda: Venda) => {
    try {
      // Buscar dados da empresa
      const { data: empresa, error: empresaError } = await supabase
        .from('empresas')
        .select('nome, cnpj, telefone, endereco')
        .eq('id', user?.empresa_id)
        .single()

      if (empresaError) throw empresaError

      // Buscar itens da venda
      const { data: itens, error: itensError } = await supabase
        .from('vendas_itens')
        .select(`
          quantidade,
          valor_unitario,
          subtotal,
          produto:produtos(
            nome,
            codigo
          )
        `)
        .eq('venda_id', venda.id)

      if (itensError) throw itensError

      // Formatar o recibo
      const recibo = formatarRecibo({
        ...venda,
        empresa: {
          id: user?.empresa_id || '',
          ...empresa
        },
        itens: itens.map(item => ({
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
          subtotal: item.subtotal,
          produto: item.produto
        }))
      })

      // Criar elemento temporário para impressão
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      document.body.appendChild(iframe)
      
      // Escrever conteúdo no iframe
      iframe.contentDocument?.write(recibo)
      iframe.contentDocument?.close()

      // Imprimir e remover iframe
      iframe.contentWindow?.print()
      setTimeout(() => {
        document.body.removeChild(iframe)
      }, 1000)

    } catch (error) {
      console.error('Erro ao gerar recibo:', error)
      setAlert({
        type: 'error',
        message: 'Erro ao gerar recibo. Tente novamente.'
      })
    }
  }

  const handleCancelarVenda = async () => {
    if (!vendaSelecionada || !user?.empresa_id) return

    try {
      setCancelando(true)

      // Buscar itens da venda antes de cancelar
      const { data: itens, error: itensError } = await supabase
        .from('vendas_itens')
        .select('produto_id, quantidade')
        .eq('venda_id', vendaSelecionada.id)

      if (itensError) {
        console.error('Erro ao buscar itens:', itensError)
        throw new Error('Erro ao buscar itens da venda')
      }

      // Atualizar status da venda usando RPC para garantir a atualização
      const { error: updateError } = await supabase
        .rpc('cancelar_venda', {
          p_venda_id: vendaSelecionada.id,
          p_empresa_id: user.empresa_id
        })

      if (updateError) {
        console.error('Erro ao atualizar venda:', updateError)
        throw new Error('Erro ao cancelar venda')
      }

      // Retornar produtos ao estoque
      for (const item of itens || []) {
        const { error: estoqueError } = await supabase
          .rpc('atualizar_estoque_produto', {
            p_produto_id: item.produto_id,
            p_empresa_id: user.empresa_id,
            p_quantidade: item.quantidade // Quantidade positiva para retornar ao estoque
          })

        if (estoqueError) {
          console.error('Erro ao atualizar estoque:', estoqueError)
          throw new Error('Erro ao atualizar estoque')
        }
      }

      // Buscar dados atualizados da venda
      const { data: vendaAtualizada, error: selectError } = await supabase
        .from('vw_vendas')
        .select('*')
        .eq('id', vendaSelecionada.id)
        .single()

      if (selectError || !vendaAtualizada) {
        console.error('Erro ao buscar venda atualizada:', selectError)
        throw new Error('Erro ao buscar dados atualizados da venda')
      }

      // Atualizar estados locais
      const vendaAtualizadaFormatada: Venda = {
        ...vendaAtualizada,
        status: 'cancelada' as const,
        cliente: vendaAtualizada.cliente_nome ? {
          nome: vendaAtualizada.cliente_nome,
          cpf: vendaAtualizada.cliente_cpf
        } : null
      }

      // Atualizar o estado local da venda selecionada
      setVendaSelecionada(vendaAtualizadaFormatada)

      // Atualizar a lista de vendas no estado
      setVendas(prevVendas => 
        prevVendas.map(venda => 
          venda.id === vendaSelecionada.id 
            ? vendaAtualizadaFormatada
            : venda
        )
      )

      // Atualizar a lista filtrada de vendas
      setFilteredVendas(prevVendas => 
        prevVendas.map(venda => 
          venda.id === vendaSelecionada.id 
            ? vendaAtualizadaFormatada
            : venda
        )
      )

      setAlert({
        type: 'success',
        message: 'Venda cancelada com sucesso!'
      })
      
      setShowConfirmCancelar(false)
      setShowDetalhesModal(false)
      setVendaSelecionada(null)

    } catch (error) {
      console.error('Erro ao cancelar venda:', error)
      setAlert({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erro ao cancelar venda. Tente novamente.'
      })
    } finally {
      setCancelando(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-600">Carregando vendas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {alert && (
        <AlertMessage type={alert.type} message={alert.message} />
      )}

      <div className="flex items-center justify-between mb-8">
        <div className="flex-1 flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Pesquisar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            onClick={() => setShowFiltros(true)}
            className="px-4 py-2 bg-white border rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
          >
            <Calendar className="h-5 w-5 mr-2" />
            Período
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.location.href = '/pdv'}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nova Venda
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm">Total</h3>
            <Info className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {formatCurrency(estatisticas.total)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm">Vendas realizadas</h3>
            <Info className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {estatisticas.quantidade}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm">Ticket Médio</h3>
            <Info className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {formatCurrency(estatisticas.ticketMedio)}
          </p>
        </div>
      </div>

      <div className="border-b mb-6">
        <nav className="flex space-x-8">
          <button 
            onClick={() => setStatusAtivo('todas')}
            className={`px-1 py-4 font-medium border-b-2 transition-colors duration-200 ${
              statusAtivo === 'todas'
                ? 'text-emerald-600 border-emerald-600'
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Todas
          </button>
          <button 
            onClick={() => setStatusAtivo('concluida')}
            className={`px-1 py-4 font-medium border-b-2 transition-colors duration-200 ${
              statusAtivo === 'concluida'
                ? 'text-emerald-600 border-emerald-600'
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Vendas
          </button>
          <button 
            onClick={() => setStatusAtivo('cancelada')}
            className={`px-1 py-4 font-medium border-b-2 transition-colors duration-200 ${
              statusAtivo === 'cancelada'
                ? 'text-emerald-600 border-emerald-600'
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Canceladas
          </button>
        </nav>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nº Venda
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Forma de Pagamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Desconto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Final
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVendas.map((venda) => (
                <tr key={venda.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{String(venda.numero_venda).padStart(6, '0')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatarData(venda.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {venda.cliente_nome || 'Cliente não identificado'}
                    {venda.cliente?.cpf && (
                      <span className="block text-xs text-gray-400">
                        CPF: {venda.cliente.cpf}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {venda.usuario_nome}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {venda.forma_pagamento}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatarDesconto(venda)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600">
                    {formatCurrency(venda.valor_final)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      venda.status === 'concluida' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {venda.status === 'concluida' ? 'Concluída' : 'Cancelada'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setVendaSelecionada(venda)
                        setShowDetalhesModal(true)
                      }}
                      className="text-indigo-600 hover:text-indigo-900 p-2 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredVendas.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Nenhuma venda encontrada</p>
            <p className="text-gray-400 text-sm mt-2">
              {searchTerm ? 'Tente uma busca diferente' : 'Faça sua primeira venda no PDV'}
            </p>
          </div>
        )}
      </div>

      {showFiltros && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Filtros</h2>
              <button
                onClick={() => setShowFiltros(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Settings2 className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Período
                </label>
                <input
                  type="date"
                  value={filtros.dataInicio.split('T')[0]}
                  onChange={(e) => handlePeriodoChange(
                    new Date(e.target.value).toISOString(),
                    filtros.dataFim
                  )}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="date"
                  value={filtros.dataFim.split('T')[0]}
                  onChange={(e) => handlePeriodoChange(
                    filtros.dataInicio,
                    new Date(e.target.value).toISOString()
                  )}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 mt-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filtros.status}
                  onChange={(e) => setFiltros(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="todas">Todas</option>
                  <option value="concluida">Concluídas</option>
                  <option value="cancelada">Canceladas</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Forma de Pagamento
                </label>
                <select
                  value={filtros.formaPagamento}
                  onChange={(e) => setFiltros(prev => ({ ...prev, formaPagamento: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="todas">Todas</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="pix">PIX</option>
                  <option value="credito">Cartão de Crédito</option>
                  <option value="debito">Cartão de Débito</option>
                  <option value="crediario">Crediário</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowFiltros(false)}
                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  buscarVendas()
                  setShowFiltros(false)
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes da Venda */}
      {showDetalhesModal && vendaSelecionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    Venda #{String(vendaSelecionada.numero_venda).padStart(6, '0')}
                  </h2>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                    vendaSelecionada.status === 'concluida' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {vendaSelecionada.status === 'concluida' ? 'Concluída' : 'Cancelada'}
                  </span>
                </div>
                <span className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(vendaSelecionada.valor_final)}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Data</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(vendaSelecionada.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Cliente</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {vendaSelecionada.cliente_nome || 'Cliente não identificado'}
                    {vendaSelecionada.cliente?.cpf && (
                      <span className="block text-xs text-gray-500">
                        CPF: {vendaSelecionada.cliente.cpf}
                      </span>
                    )}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Vendedor</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {vendaSelecionada.usuario_nome}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Forma de Pagamento</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {vendaSelecionada.forma_pagamento}
                  </p>
                </div>

                {vendaSelecionada.desconto_valor && vendaSelecionada.desconto_valor > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Desconto</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatarDesconto(vendaSelecionada)}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-8 space-y-3">
                <button
                  onClick={() => handleImprimirRecibo(vendaSelecionada)}
                  className="w-full px-4 py-2 bg-white border-2 border-emerald-500 text-emerald-600 rounded-lg hover:bg-emerald-50 flex items-center justify-center"
                >
                  <Printer className="h-5 w-5 mr-2" />
                  Recibo
                </button>

                {vendaSelecionada.status === 'concluida' && (
                  <button
                    onClick={() => setShowConfirmCancelar(true)}
                    className="w-full px-4 py-2 bg-white border-2 border-red-500 text-red-600 rounded-lg hover:bg-red-50 flex items-center justify-center"
                  >
                    <X className="h-5 w-5 mr-2" />
                    Cancelar
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowDetalhesModal(false)
                    setVendaSelecionada(null)
                  }}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Voltar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Cancelamento */}
      {showConfirmCancelar && vendaSelecionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Confirmar Cancelamento
              </h2>
              
              <p className="text-gray-500 mb-6">
                Tem certeza que deseja cancelar esta venda? Esta ação não pode ser desfeita.
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmCancelar(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Não, manter
                </button>
                <button
                  onClick={handleCancelarVenda}
                  disabled={cancelando}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {cancelando ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Cancelando...
                    </>
                  ) : (
                    'Sim, cancelar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 