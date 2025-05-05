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
  Phone,
  MapPin
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Cliente {
  id: string
  nome: string
  whatsapp: string
  telefone: string
  cpf: string
  cep: string
  endereco: string
  numero: string
  bairro: string
  cidade: string
  estado: string
  empresa_id: string
  created_at: string
}

interface Alert {
  type: 'success' | 'error'
  message: string
}

interface SortConfig {
  field: keyof Cliente | null
  direction: 'asc' | 'desc'
}

interface EnderecoViaCEP {
  logradouro: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
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

export default function Clientes() {
  const { user } = useAuth()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [alert, setAlert] = useState<Alert | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: null, direction: 'asc' })
  const itemsPerPage = 10
  const [totalItems, setTotalItems] = useState(0)
  const [loadingCEP, setLoadingCEP] = useState(false)
  const [showEndereco, setShowEndereco] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    whatsapp: '',
    telefone: '',
    cpf: '',
    cep: '',
    endereco: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    empresa_id: ''
  })

  useEffect(() => {
    fetchClientes()
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

  const fetchClientes = async () => {
    try {
      setLoading(true)

      // Verifica se temos um empresa_id válido
      if (!user?.empresa_id) {
        setClientes([])
        setTotalItems(0)
        setAlert({
          type: 'error',
          message: 'Empresa não identificada. Entre em contato com o administrador.'
        })
        return
      }
      
      // Primeiro, vamos buscar o total de registros
      const { count } = await supabase
        .from('vw_clientes')
        .select('id', { count: 'exact', head: true })
        .eq('empresa_id', user.empresa_id)

      // Agora buscamos os dados paginados
      let query = supabase
        .from('vw_clientes')
        .select(`
          id,
          nome,
          whatsapp,
          telefone,
          cpf,
          cep,
          endereco,
          numero,
          bairro,
          cidade,
          estado,
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

      setClientes(data || [])
      setTotalItems(count || 0)
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
      setAlert({
        type: 'error',
        message: 'Erro ao carregar clientes. Tente novamente.'
      })
    } finally {
      setLoading(false)
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
      const cliente = {
        nome: formData.nome,
        whatsapp: formData.whatsapp,
        telefone: formData.telefone,
        cpf: formData.cpf,
        cep: formData.cep,
        endereco: formData.endereco,
        numero: formData.numero,
        bairro: formData.bairro,
        cidade: formData.cidade,
        estado: formData.estado,
        empresa_id: user.empresa_id
      }

      if (editingCliente) {
        const { error } = await supabase
          .from('clientes')
          .update(cliente)
          .match({ id: editingCliente.id, empresa_id: user.empresa_id })

        if (error) throw error

        setAlert({
          type: 'success',
          message: 'Cliente atualizado com sucesso!'
        })
      } else {
        const { error } = await supabase
          .from('clientes')
          .insert([cliente])

        if (error) throw error

        setAlert({
          type: 'success',
          message: 'Cliente cadastrado com sucesso!'
        })
      }

      setShowModal(false)
      resetForm()
      fetchClientes()
    } catch (error) {
      console.error('Erro ao salvar cliente:', error)
      setAlert({
        type: 'error',
        message: 'Erro ao salvar cliente. Tente novamente.'
      })
    }
  }

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente)
    setFormData({
      nome: cliente.nome,
      whatsapp: cliente.whatsapp || '',
      telefone: cliente.telefone || '',
      cpf: cliente.cpf || '',
      cep: cliente.cep || '',
      endereco: cliente.endereco || '',
      numero: cliente.numero || '',
      bairro: cliente.bairro || '',
      cidade: cliente.cidade || '',
      estado: cliente.estado || '',
      empresa_id: cliente.empresa_id
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este cliente?')) return

    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .match({ id: id, empresa_id: user?.empresa_id })

      if (error) throw error

      setAlert({
        type: 'success',
        message: 'Cliente excluído com sucesso!'
      })
      fetchClientes()
    } catch (error) {
      console.error('Erro ao excluir cliente:', error)
      setAlert({
        type: 'error',
        message: 'Erro ao excluir cliente. Tente novamente.'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      whatsapp: '',
      telefone: '',
      cpf: '',
      cep: '',
      endereco: '',
      numero: '',
      bairro: '',
      cidade: '',
      estado: '',
      empresa_id: user?.empresa_id || ''
    })
    setEditingCliente(null)
    setShowEndereco(false)
  }

  const filteredClientes = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.cpf?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.whatsapp?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSort = (field: keyof Cliente) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const formatCPF = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, '')
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, '$1.$2.$3-$4')
  }

  const formatPhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '')
    if (numbers.length === 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/g, '($1) $2-$3')
    }
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/g, '($1) $2-$3')
  }

  const formatCEP = (cep: string) => {
    const numbers = cep.replace(/\D/g, '')
    return numbers.replace(/(\d{5})(\d{3})/g, '$1-$2')
  }

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length <= 11) {
      setFormData({ ...formData, cpf: formatCPF(value) })
    }
  }

  const handlePhoneChange = (field: 'telefone' | 'whatsapp', e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length <= 11) {
      setFormData({ ...formData, [field]: formatPhone(value) })
    }
  }

  const handleCEPChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length <= 8) {
      setFormData({ ...formData, cep: formatCEP(value) })
      
      // Buscar endereço quando CEP estiver completo
      if (value.length === 8) {
        try {
          setLoadingCEP(true)
          const response = await fetch(`https://viacep.com.br/ws/${value}/json/`)
          const data: EnderecoViaCEP = await response.json()
          
          if (!data.erro) {
            setFormData(prev => ({
              ...prev,
              endereco: data.logradouro,
              bairro: data.bairro,
              cidade: data.localidade,
              estado: data.uf
            }))
          }
        } catch (error) {
          console.error('Erro ao buscar CEP:', error)
        } finally {
          setLoadingCEP(false)
        }
      }
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {alert && (
        <AlertMessage type={alert.type} message={alert.message} />
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            if (window.confirm('Deseja adicionar um novo cliente?')) {
              resetForm()
              setShowModal(true)
            }
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Novo Cliente
        </motion.button>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, CPF ou WhatsApp..."
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  WhatsApp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CPF
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cidade/UF
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-600" />
                  </td>
                </tr>
              ) : filteredClientes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Nenhum cliente encontrado
                  </td>
                </tr>
              ) : (
                filteredClientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cliente.nome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cliente.whatsapp && (
                        <a 
                          href={`https://wa.me/${cliente.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800 flex items-center"
                        >
                          {cliente.whatsapp}
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cliente.cpf}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cliente.cidade && cliente.estado ? `${cliente.cidade}/${cliente.estado}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          if (window.confirm('Deseja editar este cliente?')) {
                            handleEdit(cliente)
                          }
                        }}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cliente.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 border-t">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} clientes
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
                {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      WhatsApp
                    </label>
                    <input
                      type="text"
                      value={formData.whatsapp}
                      onChange={(e) => handlePhoneChange('whatsapp', e)}
                      placeholder="(00) 00000-0000"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone
                    </label>
                    <input
                      type="text"
                      value={formData.telefone}
                      onChange={(e) => handlePhoneChange('telefone', e)}
                      placeholder="(00) 0000-0000"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CPF
                  </label>
                  <input
                    type="text"
                    value={formData.cpf}
                    onChange={handleCPFChange}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEndereco(!showEndereco)}
                    className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 focus:outline-none"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    {showEndereco ? 'Ocultar campos de endereço' : 'Adicionar endereço'}
                  </button>
                </div>

                {showEndereco && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 pt-4 border-t"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CEP
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={formData.cep}
                            onChange={handleCEPChange}
                            placeholder="00000-000"
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          {loadingCEP && (
                            <Loader2 className="h-5 w-5 animate-spin absolute right-3 top-2.5 text-gray-400" />
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Número
                        </label>
                        <input
                          type="text"
                          value={formData.numero}
                          onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Endereço
                      </label>
                      <input
                        type="text"
                        value={formData.endereco}
                        onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bairro
                      </label>
                      <input
                        type="text"
                        value={formData.bairro}
                        onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cidade
                        </label>
                        <input
                          type="text"
                          value={formData.cidade}
                          onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Estado
                        </label>
                        <input
                          type="text"
                          value={formData.estado}
                          onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          maxLength={2}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
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
                  {editingCliente ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
} 