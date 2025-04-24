import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  AlertCircle,
  Loader2,
  DollarSign,
  X,
  ShoppingCart,
  Clock,
  Search,
  Plus,
  Minus,
  Trash2,
  User,
  Grid,
  Zap,
  Percent,
  Tag,
  CreditCard,
  Wallet,
  Building2,
  QrCode,
  CheckCircle2,
  Share2,
  Printer
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { formatCurrency } from '../lib/utils'

interface Alert {
  type: 'success' | 'error'
  message: string
}

interface Caixa {
  id: string
  empresa_id: string
  usuario_id: string
  valor_inicial: number
  valor_final: number | null
  data_abertura: string
  data_fechamento: string | null
  status: 'aberto' | 'fechado'
  observacao: string | null
  created_at: string
  usuario_nome: string
}

interface Produto {
  id: string
  nome: string
  codigo: string
  valor: number
  estoque: number
}

interface ItemCarrinho {
  produto: Produto
  quantidade: number
  subtotal: number
}

interface Cliente {
  id: string
  nome: string
  cpf: string | null
  telefone: string | null
  email: string | null
}

interface Desconto {
  tipo: 'porcentagem' | 'valor'
  valor: number
}

interface FormData {
  nome: string
  descricao: string
  preco: string
  estoque: string
  estoque_inicial: string
  estoque_minimo: string
  codigo: string
  codigo_barras: string
  categoria: string
  empresa_id: string
}

interface FormaPagamento {
  id: string
  nome: string
  icone: React.ReactNode
}

interface Empresa {
  id: string
  nome: string
  cnpj: string | null
  telefone: string | null
  endereco: string | null
}

interface VendaCompleta {
  id: string
  numero_venda: number
  valor_total: number
  valor_final: number
  desconto_tipo: 'porcentagem' | 'valor' | null
  desconto_valor: number | null
  forma_pagamento: string
  created_at: string
  empresa: Empresa
  cliente: Cliente | null
  itens: {
    produto: {
      nome: string
      codigo: string
    }
    quantidade: number
    valor_unitario: number
    subtotal: number
  }[]
}

function AlertMessage({ type, message }: Alert) {
  const colors = {
    success: 'bg-green-50 text-green-700 border-green-200',
    error: 'bg-red-50 text-red-700 border-red-200'
  }

  return (
    <div className={`rounded-md ${colors[type]} p-4 border mb-4`}>
      <div className="flex">
        <AlertCircle className="h-5 w-5 mr-2" />
        <span className="text-sm">{message}</span>
      </div>
    </div>
  )
}

export function PDV() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState<Alert | null>(null)
  const [caixaAtual, setCaixaAtual] = useState<Caixa | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Produto[]>([])
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([])
  const [searching, setSearching] = useState(false)
  
  // Novos estados para cliente
  const [clienteSearchTerm, setClienteSearchTerm] = useState('')
  const [clienteSearchResults, setClienteSearchResults] = useState<Cliente[]>([])
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [searchingCliente, setSearchingCliente] = useState(false)

  const [showDescontoModal, setShowDescontoModal] = useState(false)
  const [desconto, setDesconto] = useState<Desconto | null>(null)
  const [descontoTemp, setDescontoTemp] = useState<Desconto>({
    tipo: 'porcentagem',
    valor: 0
  })

  // Estados para o cadastro de produto
  const [showProdutoModal, setShowProdutoModal] = useState(false)
  const [loadingCategorias, setLoadingCategorias] = useState(false)
  const [categorias, setCategorias] = useState<{ id: string; nome: string }[]>([])
  const [showCategoriaModal, setShowCategoriaModal] = useState(false)
  const [novaCategoria, setNovaCategoria] = useState('')
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    descricao: '',
    preco: '',
    estoque: '',
    estoque_inicial: '',
    estoque_minimo: '0',
    codigo: '',
    codigo_barras: '',
    categoria: '',
    empresa_id: user?.empresa_id || ''
  })

  const [showPagamentoModal, setShowPagamentoModal] = useState(false)
  const [formaPagamentoSelecionada, setFormaPagamentoSelecionada] = useState<string | null>(null)

  const [showVendaConcluidaModal, setShowVendaConcluidaModal] = useState(false)
  const [vendaAtual, setVendaAtual] = useState<{
    id: string;
    numero_venda: number;
    valor_final: number;
  } | null>(null)
  const [finalizandoVenda, setFinalizandoVenda] = useState(false)

  const formasPagamento: FormaPagamento[] = [
    {
      id: 'dinheiro',
      nome: 'Dinheiro',
      icone: <DollarSign className="h-6 w-6" />
    },
    {
      id: 'pix',
      nome: 'PIX',
      icone: <QrCode className="h-6 w-6" />
    },
    {
      id: 'credito',
      nome: 'Cartão de Crédito',
      icone: <CreditCard className="h-6 w-6" />
    },
    {
      id: 'debito',
      nome: 'Cartão de Débito',
      icone: <CreditCard className="h-6 w-6" />
    },
    {
      id: 'crediario',
      nome: 'Crediário',
      icone: <Building2 className="h-6 w-6" />
    }
  ]

  useEffect(() => {
    verificarCaixa()
  }, [])

  useEffect(() => {
    if (searchTerm.length >= 3) {
      buscarProdutos()
    } else {
      setSearchResults([])
    }
  }, [searchTerm])

  const verificarCaixa = async () => {
    try {
      setLoading(true)

      if (!user?.empresa_id) {
        setAlert({
          type: 'error',
          message: 'Empresa não identificada. Entre em contato com o administrador.'
        })
        return
      }

      const { data: caixa, error } = await supabase
        .from('vw_caixa')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .eq('usuario_id', user.id)
        .eq('status', 'aberto')
        .maybeSingle()

      if (error) throw error

      if (caixa) {
        setCaixaAtual(caixa)
      }
    } catch (error) {
      console.error('Erro ao verificar caixa:', error)
      setAlert({
        type: 'error',
        message: 'Erro ao verificar status do caixa. Tente novamente.'
      })
    } finally {
      setLoading(false)
    }
  }

  const buscarProdutos = async () => {
    try {
      if (!user?.empresa_id) {
        setAlert({
          type: 'error',
          message: 'Empresa não identificada. Entre em contato com o administrador.'
        })
        return
      }

      setSearching(true)
      const { data, error } = await supabase
        .from('vw_produtos_pdv')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .or('nome.ilike.%' + searchTerm + '%,codigo.ilike.%' + searchTerm + '%')
        .limit(5)

      if (error) throw error
      setSearchResults(data || [])
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
      setAlert({
        type: 'error',
        message: 'Erro ao buscar produtos. Tente novamente.'
      })
    } finally {
      setSearching(false)
    }
  }

  const adicionarAoCarrinho = (produto: Produto) => {
    setCarrinho(atual => {
      const itemExistente = atual.find(item => item.produto.id === produto.id)
      
      if (itemExistente) {
        return atual.map(item => 
          item.produto.id === produto.id
            ? { 
                ...item, 
                quantidade: item.quantidade + 1,
                subtotal: (item.quantidade + 1) * item.produto.valor
              }
            : item
        )
      }

      return [...atual, { 
        produto, 
        quantidade: 1,
        subtotal: produto.valor
      }]
    })

    setSearchTerm('')
    setSearchResults([])
  }

  const atualizarQuantidade = (produtoId: string, acao: 'aumentar' | 'diminuir') => {
    setCarrinho(atual => 
      atual.map(item => {
        if (item.produto.id === produtoId) {
          const novaQuantidade = acao === 'aumentar' 
            ? item.quantidade + 1 
            : Math.max(1, item.quantidade - 1)
          
          return {
            ...item,
            quantidade: novaQuantidade,
            subtotal: novaQuantidade * item.produto.valor
          }
        }
        return item
      })
    )
  }

  const removerDoCarrinho = (produtoId: string) => {
    setCarrinho(atual => atual.filter(item => item.produto.id !== produtoId))
  }

  const totalCarrinho = carrinho.reduce((total, item) => total + item.subtotal, 0)

  const buscarClientes = async () => {
    try {
      if (!user?.empresa_id || clienteSearchTerm.length < 3) return

      setSearchingCliente(true)
      const { data, error } = await supabase
        .from('vw_clientes')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .or(`nome.ilike.%${clienteSearchTerm}%,cpf.ilike.%${clienteSearchTerm}%,telefone.ilike.%${clienteSearchTerm}%`)
        .limit(5)

      if (error) throw error
      setClienteSearchResults(data || [])
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
      setAlert({
        type: 'error',
        message: 'Erro ao buscar clientes. Tente novamente.'
      })
    } finally {
      setSearchingCliente(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (clienteSearchTerm.length >= 3) {
        buscarClientes()
      } else {
        setClienteSearchResults([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [clienteSearchTerm])

  const selecionarCliente = (cliente: Cliente) => {
    setClienteSelecionado(cliente)
    setClienteSearchTerm('')
    setClienteSearchResults([])
  }

  const removerClienteSelecionado = () => {
    setClienteSelecionado(null)
  }

  // Função para calcular o valor do desconto
  const calcularDesconto = (total: number, desconto: Desconto | null): number => {
    if (!desconto || desconto.valor <= 0) return 0
    
    if (desconto.tipo === 'porcentagem') {
      return (total * desconto.valor) / 100
    }
    
    return Math.min(desconto.valor, total) // Não permite desconto maior que o total
  }

  // Função para formatar o valor do desconto para exibição
  const formatarDesconto = (desconto: Desconto | null): string => {
    if (!desconto || desconto.valor <= 0) return ''
    
    if (desconto.tipo === 'porcentagem') {
      return `${desconto.valor}%`
    }
    
    return formatCurrency(desconto.valor)
  }

  // Função para aplicar o desconto
  const aplicarDesconto = () => {
    setDesconto(descontoTemp)
    setShowDescontoModal(false)
  }

  // Função para remover o desconto
  const removerDesconto = () => {
    setDesconto(null)
    setDescontoTemp({
      tipo: 'porcentagem',
      valor: 0
    })
  }

  // Calcula o total com desconto
  const subtotalCarrinho = carrinho.reduce((total, item) => total + item.subtotal, 0)
  const valorDesconto = calcularDesconto(subtotalCarrinho, desconto)
  const totalComDesconto = subtotalCarrinho - valorDesconto

  // Função para buscar categorias
  const fetchCategorias = async () => {
    try {
      setLoadingCategorias(true)
      
      if (!user?.empresa_id) return

      const { data, error } = await supabase
        .from('vw_categorias')
        .select('id, nome')
        .eq('empresa_id', user.empresa_id)

      if (error) throw error
      setCategorias(data || [])
    } catch (error) {
      console.error('Erro ao buscar categorias:', error)
      setAlert({
        type: 'error',
        message: 'Erro ao carregar categorias. Tente novamente.'
      })
    } finally {
      setLoadingCategorias(false)
    }
  }

  // Carregar categorias quando o modal abrir
  useEffect(() => {
    if (showProdutoModal) {
      fetchCategorias()
    }
  }, [showProdutoModal])

  // Função para criar nova categoria
  const handleCreateCategoria = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.empresa_id) {
      setAlert({
        type: 'error',
        message: 'Empresa não identificada. Entre em contato com o administrador.'
      })
      return
    }

    try {
      const { error } = await supabase
        .from('categorias')
        .insert([{
          nome: novaCategoria,
          empresa_id: user.empresa_id
        }])

      if (error) throw error

      await fetchCategorias()
      setNovaCategoria('')
      setShowCategoriaModal(false)
      setAlert({
        type: 'success',
        message: 'Categoria criada com sucesso!'
      })
    } catch (error) {
      console.error('Erro ao criar categoria:', error)
      setAlert({
        type: 'error',
        message: 'Erro ao criar categoria. Tente novamente.'
      })
    }
  }

  // Função para formatar preço
  const formatPreco = (valor: string) => {
    const numbers = valor.replace(/[^\d.]/g, '')
    const parts = numbers.split('.')
    if (parts.length > 2) {
      parts[1] = parts.slice(1).join('')
    }
    const cleanNumber = parts.join('.')
    const numero = parseFloat(cleanNumber) || 0
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numero)
  }

  // Função para lidar com mudança no preço
  const handlePrecoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.replace(/[^\d.]/g, '')
    setFormData({ ...formData, preco: valor })
    e.target.value = formatPreco(valor)
  }

  // Função para cadastrar/editar produto
  const handleSubmitProduto = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.empresa_id) {
      setAlert({
        type: 'error',
        message: 'Empresa não identificada. Entre em contato com o administrador.'
      })
      return
    }

    try {
      const produtoData = {
        nome: formData.nome,
        codigo: formData.codigo,
        codigo_barras: formData.codigo_barras || null,
        valor: parseFloat(formData.preco.replace(/\./g, '').replace(',', '.')),
        estoque: parseInt(formData.estoque),
        estoque_minimo: parseInt(formData.estoque_minimo) || 0,
        estoque_inicial: parseInt(formData.estoque_inicial) || null,
        categoria: formData.categoria,
        descricao: formData.descricao || null,
        empresa_id: user.empresa_id
      }

      const { error } = await supabase
        .from('produtos')
        .insert([produtoData])

      if (error) throw error

      setAlert({
        type: 'success',
        message: 'Produto cadastrado com sucesso!'
      })
      
      setShowProdutoModal(false)
      resetForm()
      // Atualizar a busca se houver termo de pesquisa
      if (searchTerm.length >= 3) {
        buscarProdutos()
      }
    } catch (error) {
      console.error('Erro ao salvar produto:', error)
      setAlert({
        type: 'error',
        message: 'Erro ao salvar produto. Tente novamente.'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      preco: '',
      estoque: '',
      estoque_inicial: '',
      estoque_minimo: '0',
      codigo: '',
      codigo_barras: '',
      categoria: '',
      empresa_id: user?.empresa_id || ''
    })
  }

  const handleFinalizarVenda = () => {
    setShowPagamentoModal(true)
  }

  const handleSelecionarFormaPagamento = (id: string) => {
    setFormaPagamentoSelecionada(id)
  }

  const handleConfirmarPagamento = async () => {
    if (!formaPagamentoSelecionada || !user?.empresa_id || !user?.id || !caixaAtual?.id) {
      setAlert({
        type: 'error',
        message: 'Dados incompletos para finalizar a venda.'
      })
      return
    }

    try {
      setFinalizandoVenda(true)

      // Inserir a venda - versão simplificada sem data_abertura
      const { data: venda, error: vendaError } = await supabase
        .from('vendas')
        .insert({
          empresa_id: user.empresa_id,
          cliente_id: clienteSelecionado?.id || null,
          usuario_id: user.id,
          caixa_id: caixaAtual.id,
          valor_total: subtotalCarrinho,
          desconto_tipo: desconto?.tipo || null,
          desconto_valor: desconto?.valor || null,
          valor_final: totalComDesconto,
          forma_pagamento: formaPagamentoSelecionada,
          status: 'concluida'
        })
        .select('id, numero_venda, valor_final')
        .single()

      if (vendaError) {
        console.error('Erro ao criar venda:', vendaError)
        throw new Error('Erro ao criar venda. Por favor, tente novamente.')
      }

      if (!venda) {
        throw new Error('Erro ao criar venda: dados não retornados.')
      }

      // Inserir os itens da venda
      const itensVenda = carrinho.map(item => ({
        venda_id: venda.id,
        produto_id: item.produto.id,
        quantidade: item.quantidade,
        valor_unitario: item.produto.valor,
        subtotal: item.subtotal,
        empresa_id: user.empresa_id // Adicionando empresa_id para RLS
      }))

      const { error: itensError } = await supabase
        .from('vendas_itens')
        .insert(itensVenda)

      if (itensError) {
        console.error('Erro ao inserir itens:', itensError)
        // Tentar reverter a venda em caso de erro nos itens
        await supabase
          .from('vendas')
          .delete()
          .eq('id', venda.id)
          .eq('empresa_id', user.empresa_id)
        throw new Error('Erro ao registrar itens da venda. A operação foi cancelada.')
      }

      // Atualizar o estoque dos produtos
      for (const item of carrinho) {
        const { error: estoqueError } = await supabase
          .rpc('atualizar_estoque_produto', {
            p_produto_id: item.produto.id,
            p_empresa_id: user.empresa_id,
            p_quantidade: item.quantidade
          })

        if (estoqueError) {
          console.error('Erro ao atualizar estoque:', estoqueError)
          throw new Error('Erro ao atualizar estoque. Por favor, verifique o estoque manualmente.')
        }
      }

      // Limpar o carrinho e estados
      setVendaAtual(venda)
      setCarrinho([])
      setClienteSelecionado(null)
      setDesconto(null)
      setFormaPagamentoSelecionada(null)
      setShowPagamentoModal(false)
      setShowVendaConcluidaModal(true)

    } catch (error) {
      console.error('Erro ao finalizar venda:', error)
      setAlert({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erro ao finalizar venda. Tente novamente.'
      })
    } finally {
      setFinalizandoVenda(false)
    }
  }

  const handleNovaVenda = () => {
    setShowVendaConcluidaModal(false)
    setVendaAtual(null)
  }

  const handleImprimirRecibo = async () => {
    try {
      if (!vendaAtual?.id || !user?.empresa_id) return

      // Buscar dados da empresa
      const { data: empresa, error: empresaError } = await supabase
        .from('empresas')
        .select('nome, cnpj, telefone, endereco')
        .eq('id', user.empresa_id)
        .single()

      if (empresaError) throw empresaError

      // Buscar dados completos da venda
      const { data: venda, error: vendaError } = await supabase
        .from('vendas')
        .select(`
          *,
          cliente:clientes(
            nome,
            cpf,
            telefone
          )
        `)
        .eq('id', vendaAtual.id)
        .single()

      if (vendaError) throw vendaError

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
        .eq('venda_id', vendaAtual.id)

      if (itensError) throw itensError

      // Formatar o recibo
      const recibo = formatarRecibo({
        ...venda,
        empresa: {
          id: user.empresa_id,
          ...empresa
        },
        itens: itens
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

        ${venda.cliente ? `
          <div class="pagamento-info">
            <div class="bold">DADOS DO CLIENTE</div>
            <div class="small">
              <div>${venda.cliente.nome}</div>
              ${venda.cliente.cpf ? `<div>CPF: ${venda.cliente.cpf}</div>` : ''}
              ${venda.cliente.telefone ? `<div>Tel: ${venda.cliente.telefone}</div>` : ''}
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
            Status: APROVADO
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-600">Verificando status do caixa...</p>
        </div>
      </div>
    )
  }

  if (!caixaAtual) {
    return (
      <div className="container mx-auto px-4 py-8">
        <AlertMessage 
          type="error" 
          message="É necessário abrir o caixa para iniciar as vendas." 
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {alert && <AlertMessage type={alert.type} message={alert.message} />}

      <div className="flex h-screen">
        {/* Coluna da Esquerda - Produtos */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          {/* Barra Superior */}
          <div className="flex items-center space-x-3 mb-6">
            <div className="flex-1 relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar produtos por nome ou código..."
                className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
              />
            </div>
            <button 
              onClick={() => setShowProdutoModal(true)}
              className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors duration-200"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {/* Lista de Produtos */}
          <div className="flex-1 overflow-y-auto pr-2">
            {searching ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid gap-3">
                {searchResults.map(produto => (
                  <motion.button
                    key={produto.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 bg-white rounded-xl hover:bg-gray-50 text-left border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-md"
                    onClick={() => adicionarAoCarrinho(produto)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                        <span className="text-lg font-medium text-emerald-600">
                          {produto.nome.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{produto.nome}</h3>
                        <p className="text-sm text-gray-500">Código: {produto.codigo} • Estoque: {produto.estoque}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-semibold text-emerald-600 text-lg">
                        {formatCurrency(produto.valor)}
                      </span>
                      <span className="text-xs text-gray-400 mt-1">
                        Clique para adicionar
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Busque por produtos para iniciar a venda</p>
                <p className="text-gray-400 text-sm mt-2">Digite o nome ou código do produto</p>
              </div>
            )}
          </div>
        </div>

        {/* Coluna da Direita - Carrinho */}
        <div className="w-[420px] bg-white shadow-xl flex flex-col">
          {/* Cliente */}
          <div className="p-6 border-b">
            {clienteSelecionado ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Cliente</p>
                    <p className="text-sm text-gray-600">{clienteSelecionado.nome}</p>
                  </div>
                </div>
                <button
                  onClick={removerClienteSelecionado}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={clienteSearchTerm}
                  onChange={(e) => setClienteSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {clienteSearchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    {clienteSearchResults.map((cliente) => (
                      <button
                        key={cliente.id}
                        onClick={() => selecionarCliente(cliente)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 border-b last:border-b-0"
                      >
                        <p className="font-medium text-gray-900">{cliente.nome}</p>
                        <p className="text-sm text-gray-500">
                          {cliente.cpf && `CPF: ${cliente.cpf}`}
                          {cliente.telefone && ` • Tel: ${cliente.telefone}`}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Lista de Itens */}
          <div className="flex-1 overflow-y-auto p-6">
            {carrinho.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="h-10 w-10 text-gray-300" />
                </div>
                <p className="text-gray-500 text-lg">Seu carrinho está vazio</p>
                <p className="text-gray-400 text-sm mt-2">Adicione produtos para iniciar a venda</p>
              </div>
            ) : (
              <div className="space-y-4">
                {carrinho.map(item => (
                  <div key={item.produto.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => atualizarQuantidade(item.produto.id, 'diminuir')}
                          className="text-gray-400 hover:text-gray-600 p-1"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="font-medium text-gray-900 min-w-[20px] text-center">{item.quantidade}</span>
                        <button
                          onClick={() => atualizarQuantidade(item.produto.id, 'aumentar')}
                          className="text-gray-400 hover:text-gray-600 p-1"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.produto.nome}</p>
                        <p className="text-sm text-gray-500">{formatCurrency(item.produto.valor)} cada</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-gray-900">
                        {formatCurrency(item.subtotal)}
                      </span>
                      <button
                        onClick={() => removerDoCarrinho(item.produto.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rodapé do Carrinho */}
          <div className="border-t p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>{carrinho.length} {carrinho.length === 1 ? 'item' : 'itens'}</span>
                <button 
                  onClick={() => setShowDescontoModal(true)}
                  className="text-emerald-600 hover:text-emerald-700 flex items-center"
                >
                  <Percent className="h-4 w-4 mr-1" />
                  {desconto ? formatarDesconto(desconto) : 'Adicionar Desconto'}
                </button>
              </div>
              
              {desconto && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotalCarrinho)}</span>
                </div>
              )}
              
              {desconto && valorDesconto > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Desconto</span>
                  <span>- {formatCurrency(valorDesconto)}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="font-medium text-gray-900">Total</span>
                <span className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(totalComDesconto)}
                </span>
              </div>
            </div>

            <button
              disabled={carrinho.length === 0}
              onClick={handleFinalizarVenda}
              className="mt-6 w-full px-6 py-4 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-lg shadow-emerald-100"
            >
              Finalizar Venda
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Desconto */}
      {showDescontoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg w-full max-w-md"
          >
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Adicionar Desconto</h2>
              <button
                onClick={() => setShowDescontoModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Desconto
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDescontoTemp({ ...descontoTemp, tipo: 'porcentagem' })}
                    className={`px-4 py-2 rounded-lg flex items-center justify-center ${
                      descontoTemp.tipo === 'porcentagem'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Percent className="h-4 w-4 mr-2" />
                    Porcentagem
                  </button>
                  <button
                    onClick={() => setDescontoTemp({ ...descontoTemp, tipo: 'valor' })}
                    className={`px-4 py-2 rounded-lg flex items-center justify-center ${
                      descontoTemp.tipo === 'valor'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Valor Fixo
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {descontoTemp.tipo === 'porcentagem' ? 'Porcentagem' : 'Valor'}
                </label>
                <input
                  type="number"
                  min="0"
                  max={descontoTemp.tipo === 'porcentagem' ? '100' : undefined}
                  step={descontoTemp.tipo === 'porcentagem' ? '1' : '0.01'}
                  value={descontoTemp.valor}
                  onChange={(e) => setDescontoTemp({
                    ...descontoTemp,
                    valor: parseFloat(e.target.value) || 0
                  })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-between text-sm text-gray-600 mb-4">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotalCarrinho)}</span>
              </div>

              <div className="flex justify-between font-medium mb-6">
                <span>Total com Desconto</span>
                <span className="text-emerald-600">
                  {formatCurrency(subtotalCarrinho - calcularDesconto(subtotalCarrinho, descontoTemp))}
                </span>
              </div>

              <div className="flex space-x-2">
                {desconto && (
                  <button
                    onClick={removerDesconto}
                    className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                  >
                    Remover Desconto
                  </button>
                )}
                <button
                  onClick={aplicarDesconto}
                  disabled={descontoTemp.valor <= 0}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Aplicar Desconto
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de Cadastro de Produto */}
      {showProdutoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg w-full max-w-2xl"
          >
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Novo Produto
              </h2>
              <button
                onClick={() => setShowProdutoModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitProduto} className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Categoria
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowCategoriaModal(true)}
                        className="text-emerald-600 hover:text-emerald-800 text-sm flex items-center"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Nova Categoria
                      </button>
                    </div>
                    <select
                      value={formData.categoria}
                      onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    >
                      <option value="">Selecione uma categoria</option>
                      {loadingCategorias ? (
                        <option disabled>Carregando categorias...</option>
                      ) : (
                        categorias.map((cat) => (
                          <option key={cat.id} value={cat.nome}>
                            {cat.nome}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código Interno
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código de Barras
                    </label>
                    <input
                      type="text"
                      value={formData.codigo_barras}
                      onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.preco}
                      onChange={handlePrecoChange}
                      placeholder="0,00"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estoque Atual
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.estoque}
                      onChange={(e) => setFormData({ ...formData, estoque: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estoque Inicial
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.estoque_inicial}
                      onChange={(e) => setFormData({ ...formData, estoque_inicial: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alerta de Estoque Mínimo
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.estoque_minimo}
                      onChange={(e) => setFormData({ ...formData, estoque_minimo: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowProdutoModal(false)}
                  className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Cadastrar Produto
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal de Nova Categoria */}
      {showCategoriaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg w-full max-w-md p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Tag className="h-5 w-5 mr-2" />
                Nova Categoria
              </h3>
              <button
                onClick={() => setShowCategoriaModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateCategoria}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Categoria
                </label>
                <input
                  type="text"
                  value={novaCategoria}
                  onChange={(e) => setNovaCategoria(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                  placeholder="Digite o nome da categoria"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCategoriaModal(false)}
                  className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Criar Categoria
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal de Pagamento */}
      {showPagamentoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl w-full max-w-md overflow-hidden"
          >
            <div className="border-b p-4">
              <h2 className="text-xl font-semibold text-gray-900">Pagamento</h2>
            </div>

            <div className="p-4">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-600">Restante a pagar:</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {formatCurrency(totalComDesconto)}
                </p>
              </div>

              <p className="text-sm text-gray-600 mb-3">Selecionar forma de pagamento:</p>
              
              <div className="grid grid-cols-2 gap-3">
                {formasPagamento.map((forma) => (
                  <button
                    key={forma.id}
                    onClick={() => handleSelecionarFormaPagamento(forma.id)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${
                      formaPagamentoSelecionada === forma.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-emerald-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`mb-2 ${
                      formaPagamentoSelecionada === forma.id
                        ? 'text-emerald-600'
                        : 'text-gray-400'
                    }`}>
                      {forma.icone}
                    </div>
                    <span className={`text-sm font-medium ${
                      formaPagamentoSelecionada === forma.id
                        ? 'text-emerald-600'
                        : 'text-gray-600'
                    }`}>
                      {forma.nome}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t p-4">
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPagamentoModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmarPagamento}
                  disabled={!formaPagamentoSelecionada || finalizandoVenda}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {finalizandoVenda ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Processando...
                    </>
                  ) : (
                    'Confirmar Pagamento'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de Venda Concluída */}
      {showVendaConcluidaModal && vendaAtual && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>
              
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Venda concluída!
              </h2>
              
              <p className="text-gray-600 mb-1">
                #{vendaAtual.numero_venda}
              </p>
              
              <p className="text-3xl font-bold text-emerald-600 mb-6">
                {formatCurrency(vendaAtual.valor_final)}
              </p>

              <button
                onClick={handleImprimirRecibo}
                className="w-full mb-3 px-4 py-2 bg-white border-2 border-emerald-500 text-emerald-600 rounded-lg hover:bg-emerald-50 flex items-center justify-center"
              >
                <Printer className="h-5 w-5 mr-2" />
                Recibo
              </button>

              <button
                onClick={handleNovaVenda}
                className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center"
              >
                Nova Venda
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
} 