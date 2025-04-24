import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  Loader2, 
  PlusCircle, 
  DollarSign, 
  QrCode, 
  CreditCard, 
  BadgeCheck, 
  X,
  Download,
  FileText
} from 'lucide-react'
import { motion } from 'framer-motion'

interface CaixaRegistro {
  id: string
  valor_inicial: number
  valor_final: number | null
  data_abertura: string
  data_fechamento: string | null
  status: 'aberto' | 'fechado'
  usuario_nome: string
}

interface MovimentoCaixa {
  id: string
  tipo: 'abertura' | 'venda' | 'despesa' | 'retirada' | 'suprimento'
  descricao: string
  valor: number
  forma_pagamento: string | null
  numero_venda: number | null
  created_at: string
}

interface ResumoVendas {
  total: number
  dinheiro: number
  pix: number
  credito: number
  debito: number
  crediario: number
}

export function Caixa() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [savingOpen, setSavingOpen] = useState(false)
  const [savingClose, setSavingClose] = useState(false)
  const [caixaAtual, setCaixaAtual] = useState<CaixaRegistro | null>(null)
  const [valorInicial, setValorInicial] = useState('')
  const [valorFinal, setValorFinal] = useState('')
  const [movimentos, setMovimentos] = useState<MovimentoCaixa[]>([])
  const [resumoVendas, setResumoVendas] = useState<ResumoVendas>({
    total: 0,
    dinheiro: 0,
    pix: 0,
    credito: 0,
    debito: 0,
    crediario: 0
  })
  const [caixasAnteriores, setCaixasAnteriores] = useState<CaixaRegistro[]>([])
  const [activeTab, setActiveTab] = useState<'atual' | 'anteriores'>('atual')
  const [showNovoLancamento, setShowNovoLancamento] = useState(false)
  const [novoLancamento, setNovoLancamento] = useState({
    tipo: 'suprimento' as 'suprimento' | 'retirada' | 'despesa',
    descricao: '',
    valor: '',
  })
  
  // Novos estados para o modal de detalhes do caixa anterior
  const [showDetalhesCaixa, setShowDetalhesCaixa] = useState(false)
  const [caixaSelecionado, setCaixaSelecionado] = useState<CaixaRegistro | null>(null)
  const [movimentosCaixaAnterior, setMovimentosCaixaAnterior] = useState<MovimentoCaixa[]>([])
  const [loadingMovimentos, setLoadingMovimentos] = useState(false)
  const [resumoCaixaAnterior, setResumoCaixaAnterior] = useState<ResumoVendas>({
    total: 0,
    dinheiro: 0,
    pix: 0,
    credito: 0,
    debito: 0,
    crediario: 0
  })

  useEffect(() => {
    if (user) {
      loadCaixaAtual()
      loadCaixasAnteriores()
    }
  }, [user])

  useEffect(() => {
    if (caixaAtual) {
      loadMovimentos()
    }
  }, [caixaAtual])

  async function loadCaixaAtual() {
    try {
      setLoading(true)
      
      // Debug info
      console.log('User atual:', user)
      console.log('Empresa ID:', user?.empresa_id)
      
      // Remover .single() para ver todos os resultados possíveis
      const { data, error } = await supabase
        .from('vw_caixa')
        .select('id, valor_inicial, valor_final, data_abertura, data_fechamento, status, usuario_nome')
        .eq('empresa_id', user?.empresa_id)
        .eq('status', 'aberto')
        
      console.log('Resultado da consulta:', data)

      if (error) throw error

      // Se encontrar algum caixa, use o primeiro (pode haver mais de um aberto por empresa)
      setCaixaAtual(data && data.length > 0 ? data[0] : null)
    } catch (error: any) {
      console.error('Erro ao carregar caixa:', error.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadCaixasAnteriores() {
    try {
      const { data, error } = await supabase
        .from('vw_caixa')
        .select('id, valor_inicial, valor_final, data_abertura, data_fechamento, status, usuario_nome')
        .eq('empresa_id', user?.empresa_id)
        .eq('status', 'fechado')
        .order('data_fechamento', { ascending: false })
        .limit(10)

      if (error) throw error

      setCaixasAnteriores(data || [])
    } catch (error: any) {
      console.error('Erro ao carregar caixas anteriores:', error.message)
    }
  }

  async function loadMovimentos() {
    try {
      if (!caixaAtual?.id) return

      const { data, error } = await supabase
        .from('movimentacoes_caixa')
        .select('*')
        .eq('caixa_id', caixaAtual.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setMovimentos(data || [])
      
      // Calcular resumo de vendas por forma de pagamento
      const resumo: ResumoVendas = {
        total: 0,
        dinheiro: 0,
        pix: 0,
        credito: 0,
        debito: 0,
        crediario: 0
      }

      data?.forEach(movimento => {
        if (movimento.tipo === 'venda') {
          resumo.total += Number(movimento.valor)
          
          switch (movimento.forma_pagamento) {
            case 'dinheiro':
              resumo.dinheiro += Number(movimento.valor)
              break
            case 'pix':
              resumo.pix += Number(movimento.valor)
              break
            case 'credito':
              resumo.credito += Number(movimento.valor)
              break
            case 'debito':
              resumo.debito += Number(movimento.valor)
              break
            case 'crediario':
              resumo.crediario += Number(movimento.valor)
              break
          }
        }
      })

      setResumoVendas(resumo)
    } catch (error: any) {
      console.error('Erro ao carregar movimentos:', error.message)
    }
  }

  async function handleAbrirCaixa() {
    try {
      if (!valorInicial || isNaN(parseFloat(valorInicial))) {
        alert('Informe um valor inicial válido')
        return
      }

      if (!user) {
        alert('Usuário não autenticado')
        return
      }

      setSavingOpen(true)
      const { error } = await supabase
        .from('caixa')
        .insert({
          empresa_id: user.empresa_id,
          usuario_id: user.id,
          valor_inicial: parseFloat(valorInicial),
          status: 'aberto'
        })

      if (error) throw error

      alert('Caixa aberto com sucesso!')

      setValorInicial('')
      loadCaixaAtual()
    } catch (error: any) {
      console.error('Erro ao abrir caixa:', error.message)
      alert('Erro ao abrir caixa. Tente novamente.')
    } finally {
      setSavingOpen(false)
    }
  }

  async function handleFecharCaixa() {
    try {
      if (!valorFinal || isNaN(parseFloat(valorFinal))) {
        alert('Informe um valor final válido')
        return
      }

      setSavingClose(true)
      const { error } = await supabase
        .from('caixa')
        .update({
          valor_final: parseFloat(valorFinal),
          data_fechamento: new Date().toISOString(),
          status: 'fechado'
        })
        .eq('id', caixaAtual?.id)

      if (error) throw error

      alert('Caixa fechado com sucesso!')

      setValorFinal('')
      loadCaixaAtual()
      loadCaixasAnteriores()
    } catch (error: any) {
      console.error('Erro ao fechar caixa:', error.message)
      alert('Erro ao fechar caixa. Tente novamente.')
    } finally {
      setSavingClose(false)
    }
  }

  async function handleNovoLancamento() {
    try {
      if (!novoLancamento.descricao || !novoLancamento.valor || isNaN(parseFloat(novoLancamento.valor))) {
        alert('Preencha todos os campos corretamente')
        return
      }

      if (!user) {
        alert('Usuário não autenticado')
        return
      }

      const valorNumerico = parseFloat(novoLancamento.valor)
      
      const { error } = await supabase
        .from('movimentacoes_caixa')
        .insert({
          empresa_id: user.empresa_id,
          caixa_id: caixaAtual?.id,
          tipo: novoLancamento.tipo,
          descricao: novoLancamento.descricao,
          valor: novoLancamento.tipo === 'retirada' || novoLancamento.tipo === 'despesa' 
            ? -Math.abs(valorNumerico) // Valor negativo para retiradas e despesas
            : Math.abs(valorNumerico),
        })

      if (error) throw error

      alert('Lançamento registrado com sucesso!')
      setNovoLancamento({
        tipo: 'suprimento',
        descricao: '',
        valor: '',
      })
      setShowNovoLancamento(false)
      loadMovimentos()
    } catch (error: any) {
      console.error('Erro ao registrar lançamento:', error.message)
      alert('Erro ao registrar lançamento. Tente novamente.')
    }
  }

  function formatarData(data: string) {
    return format(new Date(data), 'EEE - dd/MM', { locale: ptBR })
  }

  function getIconForPaymentMethod(metodoPagamento: string | null) {
    switch (metodoPagamento) {
      case 'dinheiro':
        return <DollarSign className="h-5 w-5 text-green-600" />
      case 'pix':
        return <QrCode className="h-5 w-5 text-violet-600" />
      case 'credito':
      case 'debito':
        return <CreditCard className="h-5 w-5 text-blue-600" />
      default:
        return null
    }
  }

  function getSaldoCaixa() {
    if (!caixaAtual) return 0
    
    // Saldo inicial + soma de todos os movimentos (positivos e negativos)
    const totalMovimentos = movimentos.reduce((acc, mov) => acc + Number(mov.valor), 0)
    return caixaAtual.valor_inicial + totalMovimentos
  }

  async function loadMovimentosCaixaAnterior(caixaId: string) {
    try {
      setLoadingMovimentos(true)
      
      const { data, error } = await supabase
        .from('movimentacoes_caixa')
        .select('*')
        .eq('caixa_id', caixaId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setMovimentosCaixaAnterior(data || [])
      
      // Calcular resumo de vendas por forma de pagamento
      const resumo: ResumoVendas = {
        total: 0,
        dinheiro: 0,
        pix: 0,
        credito: 0,
        debito: 0,
        crediario: 0
      }

      data?.forEach(movimento => {
        if (movimento.tipo === 'venda') {
          resumo.total += Number(movimento.valor)
          
          switch (movimento.forma_pagamento) {
            case 'dinheiro':
              resumo.dinheiro += Number(movimento.valor)
              break
            case 'pix':
              resumo.pix += Number(movimento.valor)
              break
            case 'credito':
              resumo.credito += Number(movimento.valor)
              break
            case 'debito':
              resumo.debito += Number(movimento.valor)
              break
            case 'crediario':
              resumo.crediario += Number(movimento.valor)
              break
          }
        }
      })

      setResumoCaixaAnterior(resumo)
    } catch (error: any) {
      console.error('Erro ao carregar movimentos do caixa anterior:', error.message)
    } finally {
      setLoadingMovimentos(false)
    }
  }
  
  function handleShowDetalhesCaixa(caixa: CaixaRegistro) {
    setCaixaSelecionado(caixa)
    loadMovimentosCaixaAnterior(caixa.id)
    setShowDetalhesCaixa(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (!caixaAtual) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Abrir Caixa</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor Inicial
            </label>
            <input
              type="number"
              step="0.01"
              value={valorInicial}
              onChange={(e) => setValorInicial(e.target.value)}
              placeholder="0,00"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <button 
            onClick={handleAbrirCaixa} 
            disabled={savingOpen}
            className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
          >
            {savingOpen ? (
              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
            ) : (
              'Abrir Caixa'
            )}
          </button>
        </div>
      </div>
    )
  }

  // Componente principal - Caixa aberto
  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex space-x-8">
          <button
            className={`pb-4 px-1 ${
              activeTab === 'atual'
                ? 'text-emerald-600 border-b-2 border-emerald-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('atual')}
          >
            Caixa Atual
          </button>
          <button
            className={`pb-4 px-1 ${
              activeTab === 'anteriores'
                ? 'text-emerald-600 border-b-2 border-emerald-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('anteriores')}
          >
            Caixas Anteriores
          </button>
        </div>
      </div>

      {activeTab === 'atual' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna da esquerda - Lista de Movimentos */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Movimentos do Caixa</h2>
              <button
                onClick={() => setShowNovoLancamento(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg flex items-center"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Novo Lançamento
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descrição
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Meio Pg.
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {movimentos.map((movimento) => (
                      <tr key={movimento.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {movimento.descricao}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatarData(movimento.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getIconForPaymentMethod(movimento.forma_pagamento)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                          Number(movimento.valor) >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(movimento.valor)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <BadgeCheck className="h-5 w-5 text-emerald-600 inline" />
                        </td>
                      </tr>
                    ))}
                    
                    {movimentos.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                          Nenhum movimento registrado neste caixa
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Coluna da direita - Resumo */}
          <div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Resumo do caixa</h3>
              
              <div className="text-sm text-gray-500 mb-4">
                Caixa #{caixaAtual.id.substring(0, 8)} aberto em {format(new Date(caixaAtual.data_abertura), 'dd/MM/yyyy', { locale: ptBR })}
              </div>
              
              <div className="space-y-4 mb-6">
                <h4 className="text-sm font-medium text-gray-700">Movimento de caixa</h4>
                
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Saldo de abertura</span>
                  <span className="font-medium">{formatCurrency(caixaAtual.valor_inicial)}</span>
                </div>
                
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Total das vendas</span>
                  <span className="font-medium">{formatCurrency(resumoVendas.total)}</span>
                </div>
                
                <div className="flex justify-between py-4 border-b">
                  <span className="text-lg font-medium">Saldo do Caixa</span>
                  <span className="text-xl font-bold text-emerald-600">
                    {formatCurrency(getSaldoCaixa())}
                  </span>
                </div>
                
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Total a prazo</span>
                  <span className="font-medium">{formatCurrency(resumoVendas.crediario)}</span>
                </div>
              </div>
              
              <div className="space-y-4 mb-8">
                <h4 className="text-sm font-medium text-gray-700">Total por meio de pagamento</h4>
                
                <div className="flex justify-between items-center py-2">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-gray-400 mr-2" />
                    <span>Dinheiro</span>
                  </div>
                  <span className="font-medium">{formatCurrency(resumoVendas.dinheiro)}</span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <div className="flex items-center">
                    <QrCode className="h-5 w-5 text-gray-400 mr-2" />
                    <span>Pix</span>
                  </div>
                  <span className="font-medium">{formatCurrency(resumoVendas.pix)}</span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
                    <span>Cartão</span>
                  </div>
                  <span className="font-medium">{formatCurrency(resumoVendas.credito + resumoVendas.debito)}</span>
                </div>
              </div>
              
              <button
                onClick={() => {
                  const valorSugerido = getSaldoCaixa().toFixed(2)
                  setValorFinal(valorSugerido)
                  document.getElementById('modalFecharCaixa')?.classList.remove('hidden')
                }}
                className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
              >
                Fechar Caixa
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Tab de Caixas Anteriores
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Abertura
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fechamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Operador
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor Inicial
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor Final
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {caixasAnteriores.map((caixa) => (
                  <tr key={caixa.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {caixa.id.substring(0, 8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(caixa.data_abertura), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {caixa.data_fechamento && format(new Date(caixa.data_fechamento), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {caixa.usuario_nome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-emerald-600">
                      {formatCurrency(caixa.valor_inicial)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-emerald-600">
                      {caixa.valor_final ? formatCurrency(caixa.valor_final) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <button 
                        onClick={() => handleShowDetalhesCaixa(caixa)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <FileText className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                
                {caixasAnteriores.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                      Nenhum caixa anterior encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Fechar Caixa */}
      <div id="modalFecharCaixa" className="fixed inset-0 bg-black bg-opacity-50 hidden flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Fechar Caixa</h3>
            <button onClick={() => document.getElementById('modalFecharCaixa')?.classList.add('hidden')}>
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor Final
              </label>
              <input
                type="number"
                step="0.01"
                value={valorFinal}
                onChange={(e) => setValorFinal(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => document.getElementById('modalFecharCaixa')?.classList.add('hidden')}
              className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                handleFecharCaixa()
                document.getElementById('modalFecharCaixa')?.classList.add('hidden')
              }}
              disabled={savingClose}
              className="flex-1 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              {savingClose ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              ) : (
                'Confirmar'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Novo Lançamento */}
      {showNovoLancamento && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Novo Lançamento</h3>
              <button onClick={() => setShowNovoLancamento(false)}>
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Lançamento
                </label>
                <select
                  value={novoLancamento.tipo}
                  onChange={(e) => setNovoLancamento({...novoLancamento, tipo: e.target.value as any})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="suprimento">Suprimento (Entrada)</option>
                  <option value="retirada">Retirada (Sangria)</option>
                  <option value="despesa">Despesa</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  value={novoLancamento.descricao}
                  onChange={(e) => setNovoLancamento({...novoLancamento, descricao: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Descrição do lançamento"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={novoLancamento.valor}
                  onChange={(e) => setNovoLancamento({...novoLancamento, valor: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="0,00"
                />
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowNovoLancamento(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleNovoLancamento}
                className="flex-1 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Confirmar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Modal de Detalhes do Caixa Anterior */}
      {showDetalhesCaixa && caixaSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
              <h3 className="text-xl font-semibold text-gray-900">
                Detalhes do Caixa #{caixaSelecionado.id.substring(0, 8)}
              </h3>
              <button onClick={() => setShowDetalhesCaixa(false)}>
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna da esquerda - Informações do Caixa */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Informações do Caixa</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Data de Abertura</p>
                        <p className="font-medium">
                          {format(new Date(caixaSelecionado.data_abertura), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Data de Fechamento</p>
                        <p className="font-medium">
                          {caixaSelecionado.data_fechamento && 
                            format(new Date(caixaSelecionado.data_fechamento), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Operador</p>
                        <p className="font-medium">{caixaSelecionado.usuario_nome}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <p className="font-medium">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            caixaSelecionado.status === 'aberto' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {caixaSelecionado.status === 'aberto' ? 'Aberto' : 'Fechado'}
                          </span>
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Valor Inicial</p>
                        <p className="font-medium text-emerald-600">
                          {formatCurrency(caixaSelecionado.valor_inicial)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Valor Final</p>
                        <p className="font-medium text-emerald-600">
                          {caixaSelecionado.valor_final ? formatCurrency(caixaSelecionado.valor_final) : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <h4 className="text-lg font-semibold text-gray-800 p-6 pb-3">Movimentos do Caixa</h4>
                    
                    {loadingMovimentos ? (
                      <div className="flex justify-center items-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Descrição
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Data
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Meio Pg.
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Valor
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tipo
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {movimentosCaixaAnterior.map((movimento) => (
                              <tr key={movimento.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {movimento.descricao}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {format(new Date(movimento.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {getIconForPaymentMethod(movimento.forma_pagamento)}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                                  Number(movimento.valor) >= 0 ? 'text-emerald-600' : 'text-red-600'
                                }`}>
                                  {formatCurrency(movimento.valor)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    movimento.tipo === 'venda' 
                                      ? 'bg-blue-100 text-blue-800'
                                      : movimento.tipo === 'abertura'
                                        ? 'bg-gray-100 text-gray-800'
                                        : movimento.tipo === 'suprimento'
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-red-100 text-red-800'
                                  }`}>
                                    {movimento.tipo}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            
                            {movimentosCaixaAnterior.length === 0 && (
                              <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                                  Nenhum movimento registrado neste caixa
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Coluna da direita - Resumo */}
                <div>
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold mb-4">Resumo do caixa</h3>
                    
                    <div className="space-y-4 mb-6">
                      <h4 className="text-sm font-medium text-gray-700">Movimento de caixa</h4>
                      
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Saldo de abertura</span>
                        <span className="font-medium">{formatCurrency(caixaSelecionado.valor_inicial)}</span>
                      </div>
                      
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Total das vendas</span>
                        <span className="font-medium">{formatCurrency(resumoCaixaAnterior.total)}</span>
                      </div>
                      
                      <div className="flex justify-between py-4 border-b">
                        <span className="text-lg font-medium">Saldo Final</span>
                        <span className="text-xl font-bold text-emerald-600">
                          {caixaSelecionado.valor_final ? formatCurrency(caixaSelecionado.valor_final) : '-'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Total a prazo</span>
                        <span className="font-medium">{formatCurrency(resumoCaixaAnterior.crediario)}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-4 mb-8">
                      <h4 className="text-sm font-medium text-gray-700">Total por meio de pagamento</h4>
                      
                      <div className="flex justify-between items-center py-2">
                        <div className="flex items-center">
                          <DollarSign className="h-5 w-5 text-gray-400 mr-2" />
                          <span>Dinheiro</span>
                        </div>
                        <span className="font-medium">{formatCurrency(resumoCaixaAnterior.dinheiro)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2">
                        <div className="flex items-center">
                          <QrCode className="h-5 w-5 text-gray-400 mr-2" />
                          <span>Pix</span>
                        </div>
                        <span className="font-medium">{formatCurrency(resumoCaixaAnterior.pix)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2">
                        <div className="flex items-center">
                          <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
                          <span>Cartão</span>
                        </div>
                        <span className="font-medium">{formatCurrency(resumoCaixaAnterior.credito + resumoCaixaAnterior.debito)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 sticky bottom-0">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowDetalhesCaixa(false)}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                >
                  Fechar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
} 