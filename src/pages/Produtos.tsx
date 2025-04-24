import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X,
  Loader2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Tag
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Produto {
  id: string
  nome: string
  descricao: string
  valor: number
  estoque: number
  estoque_inicial: number
  estoque_minimo: number
  codigo: string
  codigo_barras: string
  categoria: string
  empresa_id: string
  created_at: string
}

interface Alert {
  type: 'success' | 'error'
  message: string
}

interface SortConfig {
  field: keyof Produto | null
  direction: 'asc' | 'desc'
}

interface Categoria {
  id: string
  nome: string
  empresa_id: string
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

export function Produtos() {
  const { user } = useAuth()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null)
  const [alert, setAlert] = useState<Alert | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: null, direction: 'asc' })
  const itemsPerPage = 10
  const [totalItems, setTotalItems] = useState(0)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [showCategoriaModal, setShowCategoriaModal] = useState(false)
  const [novaCategoria, setNovaCategoria] = useState('')
  const [loadingCategorias, setLoadingCategorias] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    preco: '',
    estoque: '',
    estoque_inicial: '',
    estoque_minimo: '',
    codigo: '',
    codigo_barras: '',
    categoria: '',
    empresa_id: ''
  })

  useEffect(() => {
    fetchProdutos()
  }, [currentPage, sortConfig])

  useEffect(() => {
    // Atualiza o empresa_id no formData quando o user for carregado
    if (user?.empresa_id) {
      setFormData(prev => ({
        ...prev,
        empresa_id: user.empresa_id
      }))
    }
  }, [user])

  useEffect(() => {
    if (user?.empresa_id) {
      fetchCategorias()
    }
  }, [user?.empresa_id])

  const fetchProdutos = async () => {
    try {
      setLoading(true)

      // Verifica se temos um empresa_id válido
      if (!user?.empresa_id) {
        setProdutos([])
        setTotalItems(0)
        setAlert({
          type: 'error',
          message: 'Empresa não identificada. Entre em contato com o administrador.'
        })
        return
      }
      
      // Primeiro, vamos buscar o total de registros
      const { count } = await supabase
        .from('vw_produtos')
        .select('id', { count: 'exact', head: true })
        .eq('empresa_id', user.empresa_id)

      // Agora buscamos os dados paginados
      let query = supabase
        .from('vw_produtos')
        .select(`
          id,
          nome,
          descricao,
          valor,
          estoque,
          estoque_inicial,
          estoque_minimo,
          codigo,
          codigo_barras,
          categoria,
          empresa_id,
          empresa_nome,
          created_at
        `)
        .eq('empresa_id', user.empresa_id)

      // Aplicar ordenação
      if (sortConfig.field) {
        query = query.order(sortConfig.field, { ascending: sortConfig.direction === 'asc' })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      // Aplicar paginação
      query = query
        .range(
          (currentPage - 1) * itemsPerPage, 
          (currentPage * itemsPerPage) - 1
        )

      const { data, error } = await query

      if (error) throw error

      setProdutos(data || [])
      setTotalItems(count || 0)
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
      setAlert({
        type: 'error',
        message: 'Erro ao carregar produtos. Tente novamente.'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCategorias = async () => {
    try {
      setLoadingCategorias(true)

      // Verifica se temos um empresa_id válido
      if (!user?.empresa_id) {
        setCategorias([])
        setAlert({
          type: 'error',
          message: 'Empresa não identificada. Entre em contato com o administrador.'
        })
        return
      }

      const { data, error } = await supabase
        .from('vw_categorias')
        .select(`
          id,
          nome,
          empresa_id,
          empresa_nome
        `)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.empresa_id) {
      setAlert({
        type: 'error',
        message: 'Empresa não identificada. Entre em contato com o administrador.'
      })
      return
    }

    try {
      setSaving(true)
      
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

      let error
      if (editingProduto) {
        const { error: updateError } = await supabase
          .from('produtos')
          .update(produtoData)
          .eq('id', editingProduto.id)
          .eq('empresa_id', user.empresa_id)
          .single()
        error = updateError
      } else {
        const { error: insertError } = await supabase
          .from('produtos')
          .insert([produtoData])
        error = insertError
      }

      if (error) throw error

      setAlert({
        type: 'success',
        message: `Produto ${editingProduto ? 'atualizado' : 'cadastrado'} com sucesso!`
      })
      
      setShowModal(false)
      fetchProdutos()
      resetForm()
    } catch (error) {
      console.error('Erro ao salvar produto:', error)
      setAlert({
        type: 'error',
        message: 'Erro ao salvar produto. Tente novamente.'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (produto: Produto) => {
    setEditingProduto(produto)
    setFormData({
      nome: produto.nome,
      descricao: produto.descricao || '',
      preco: produto.valor.toString(),
      estoque: produto.estoque.toString(),
      estoque_inicial: produto.estoque_inicial?.toString() || '',
      estoque_minimo: produto.estoque_minimo?.toString() || '0',
      codigo: produto.codigo,
      codigo_barras: produto.codigo_barras || '',
      categoria: produto.categoria,
      empresa_id: produto.empresa_id
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) return

    try {
      const { error } = await supabase
        .from('produtos')
        .delete()
        .match({ id: id, empresa_id: user?.empresa_id })

      if (error) throw error

      setAlert({
        type: 'success',
        message: 'Produto excluído com sucesso!'
      })
      fetchProdutos()
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
      setAlert({
        type: 'error',
        message: 'Erro ao excluir produto. Tente novamente.'
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
    setEditingProduto(null)
  }

  const filteredProdutos = produtos.filter(produto =>
    produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSort = (field: keyof Produto) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const getEstoqueStatus = (estoque: number, estoque_minimo: number) => {
    if (estoque <= 0) return { color: 'text-red-600', icon: <AlertTriangle className="h-4 w-4" /> }
    if (estoque <= estoque_minimo) return { color: 'text-yellow-600', icon: <AlertCircle className="h-4 w-4" /> }
    return { color: 'text-green-600', icon: null }
  }

  const formatPreco = (valor: string) => {
    // Remove tudo que não for número ou ponto
    const numbers = valor.replace(/[^\d.]/g, '')
    
    // Garante que só tem um ponto decimal
    const parts = numbers.split('.')
    if (parts.length > 2) {
      parts[1] = parts.slice(1).join('')
    }
    const cleanNumber = parts.join('.')
    
    // Converte para número e formata como moeda
    const numero = parseFloat(cleanNumber) || 0
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numero)
  }

  const handlePrecoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.replace(/[^\d.]/g, '')
    setFormData({ ...formData, preco: valor })
    e.target.value = formatPreco(valor)
  }

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

  return (
    <div className="container mx-auto px-4 py-8">
      {alert && (
        <AlertMessage type={alert.type} message={alert.message} />
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            if (window.confirm('Deseja adicionar um novo produto?')) {
              resetForm()
              setShowModal(true)
            }
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Novo Produto
        </motion.button>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, código ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  onClick={() => handleSort('codigo')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    Código
                    {sortConfig.field === 'codigo' && (
                      sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('nome')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    Nome
                    {sortConfig.field === 'nome' && (
                      sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('categoria')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    Categoria
                    {sortConfig.field === 'categoria' && (
                      sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('valor')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    Preço
                    {sortConfig.field === 'valor' && (
                      sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('estoque')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    Estoque
                    {sortConfig.field === 'estoque' && (
                      sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-600" />
                  </td>
                </tr>
              ) : filteredProdutos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Nenhum produto encontrado
                  </td>
                </tr>
              ) : (
                filteredProdutos.map((produto) => {
                  const estoqueStatus = getEstoqueStatus(produto.estoque, produto.estoque_minimo)
                  return (
                    <tr key={produto.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {produto.codigo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {produto.nome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {produto.categoria}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(produto.valor)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className={`flex items-center ${estoqueStatus.color}`}>
                          {estoqueStatus.icon}
                          <span className="ml-1">{produto.estoque}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            if (window.confirm('Deseja editar este produto?')) {
                              handleEdit(produto)
                            }
                          }}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(produto.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 border-t">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} produtos
              </div>
              <div className="flex space-x-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded ${
                      currentPage === page
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg w-full max-w-2xl"
          >
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingProduto ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
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
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                        className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Nova Categoria
                      </button>
                    </div>
                    <select
                      value={formData.categoria}
                      onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {editingProduto ? 'Salvar Alterações' : 'Cadastrar Produto'}
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
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Criar Categoria
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
} 