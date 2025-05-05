import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  X,
  Loader2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Tag,
  FileDown,
  PlusCircle
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useProdutos } from '../lib/supabase'
import { Database } from '../types/database.types'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { DashboardLayout } from '../components/DashboardLayout'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

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

// Esquema Zod para validação do formulário de produtos
const produtoSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  codigo: z.string().min(1, 'Código do produto é obrigatório'),
  valor: z.coerce.number().min(0, 'Valor deve ser maior que 0'),
  estoque: z.coerce.number().min(0, 'Estoque não pode ser negativo'),
  estoque_minimo: z.coerce.number().min(0, 'Estoque mínimo não pode ser negativo'),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
})

type ProdutoFormData = z.infer<typeof produtoSchema>
type ProdutoData = Database['public']['Tables']['produtos']['Row']

export default function Produtos() {
  const { user } = useAuth()
  const empresaId = user?.empresa_id || ''
  
  // Estado local
  const [searchTerm, setSearchTerm] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduto, setEditingProduto] = useState<ProdutoData | null>(null)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [produtoToDelete, setProdutoToDelete] = useState<ProdutoData | null>(null)
  
  // Hook Form
  const form = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      nome: '',
      codigo: '',
      valor: 0,
      estoque: 0,
      estoque_minimo: 0,
      categoria: '',
    },
  })
  
  // Hooks do Supabase
  const { useListProdutosPorEmpresa, useCreateProduto, useUpdateProduto, useDeleteProduto } = useProdutos()
  const { data: produtos, isLoading, isError } = useListProdutosPorEmpresa(empresaId)
  const createProdutoMutation = useCreateProduto()
  const updateProdutoMutation = useUpdateProduto()
  const deleteProdutoMutation = useDeleteProduto()
  
  // Produtos filtrados
  const filteredProdutos = produtos?.filter(produto => 
    produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  // Funções
  const openAddModal = () => {
    form.reset({
      nome: '',
      codigo: '',
      valor: 0,
      estoque: 0,
      estoque_minimo: 0,
      categoria: '',
    })
    setEditingProduto(null)
    setModalOpen(true)
  }
  
  const openEditModal = (produto: ProdutoData) => {
    form.reset({
      nome: produto.nome,
      codigo: produto.codigo,
      valor: produto.valor,
      estoque: produto.estoque,
      estoque_minimo: produto.estoque_minimo,
      categoria: produto.categoria,
    })
    setEditingProduto(produto)
    setModalOpen(true)
  }
  
  const openDeleteModal = (produto: ProdutoData) => {
    setProdutoToDelete(produto)
    setConfirmDeleteOpen(true)
  }
  
  const handleSubmit = async (data: ProdutoFormData) => {
    try {
      if (editingProduto) {
        // Atualizar produto existente
        await updateProdutoMutation.mutateAsync({
          id: editingProduto.id,
          ...data,
        })
      } else {
        // Criar novo produto
        await createProdutoMutation.mutateAsync({
          ...data,
          empresa_id: empresaId,
        })
      }
      setModalOpen(false)
    } catch (error) {
      console.error('Erro ao salvar produto:', error)
    }
  }
  
  const handleDelete = async () => {
    if (produtoToDelete) {
      try {
        await deleteProdutoMutation.mutateAsync(produtoToDelete.id)
        setConfirmDeleteOpen(false)
        setProdutoToDelete(null)
      } catch (error) {
        console.error('Erro ao excluir produto:', error)
      }
    }
  }
  
  const exportToCSV = () => {
    if (!produtos || produtos.length === 0) {
      toast.error('Não existem produtos para exportar')
      return
    }
    
    const headers = 'Nome,Código,Valor,Estoque,Estoque Mínimo,Categoria\n'
    const csv = produtos.map(p => 
      `"${p.nome}","${p.codigo}",${p.valor},${p.estoque},${p.estoque_minimo},"${p.categoria}"`
    ).join('\n')
    
    const blob = new Blob([headers + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `produtos-${format(new Date(), 'yyyy-MM-dd')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p>Carregando produtos...</p>
        </div>
      </DashboardLayout>
    )
  }
  
  if (isError) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p>Erro ao carregar produtos. Tente novamente mais tarde.</p>
        </div>
      </DashboardLayout>
    )
  }
  
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gestão de Produtos</h1>
          <div className="flex space-x-2">
            <Button onClick={exportToCSV} variant="outline">
              <FileDown className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button onClick={openAddModal}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-4">
            <Search className="h-5 w-5 text-gray-400 mr-2" />
            <Input
              placeholder="Buscar por nome, código ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
          
          <Tabs defaultValue="todos" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="estoque-baixo">Estoque Baixo</TabsTrigger>
            </TabsList>
            
            <TabsContent value="todos">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                      <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                      <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                      <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estoque</th>
                      <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                      <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProdutos && filteredProdutos.length > 0 ? (
                      filteredProdutos.map((produto) => (
                        <tr key={produto.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 text-sm">{produto.codigo}</td>
                          <td className="p-3 text-sm">{produto.nome}</td>
                          <td className="p-3 text-sm">R$ {produto.valor.toFixed(2)}</td>
                          <td className="p-3 text-sm">
                            <span className={produto.estoque <= produto.estoque_minimo ? 'text-red-500' : ''}>
                              {produto.estoque}
                            </span>
                          </td>
                          <td className="p-3 text-sm">{produto.categoria}</td>
                          <td className="p-3 text-sm">
                            <div className="flex space-x-2">
                              <Button size="sm" variant="ghost" onClick={() => openEditModal(produto)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => openDeleteModal(produto)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-3 text-center text-sm text-gray-500">
                          Nenhum produto encontrado
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            
            <TabsContent value="estoque-baixo">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                      <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                      <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                      <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estoque</th>
                      <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estoque Mínimo</th>
                      <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProdutos?.filter(p => p.estoque <= p.estoque_minimo).length ? (
                      filteredProdutos
                        .filter(p => p.estoque <= p.estoque_minimo)
                        .map((produto) => (
                          <tr key={produto.id} className="border-b hover:bg-gray-50">
                            <td className="p-3 text-sm">{produto.codigo}</td>
                            <td className="p-3 text-sm">{produto.nome}</td>
                            <td className="p-3 text-sm">R$ {produto.valor.toFixed(2)}</td>
                            <td className="p-3 text-sm text-red-500">{produto.estoque}</td>
                            <td className="p-3 text-sm">{produto.estoque_minimo}</td>
                            <td className="p-3 text-sm">
                              <div className="flex space-x-2">
                                <Button size="sm" variant="ghost" onClick={() => openEditModal(produto)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => openDeleteModal(produto)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-3 text-center text-sm text-gray-500">
                          Nenhum produto com estoque baixo
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Modal de Produto */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProduto ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nome" className="text-right">
                  Nome
                </Label>
                <Input
                  id="nome"
                  className="col-span-3"
                  {...form.register('nome')}
                />
                {form.formState.errors.nome && (
                  <p className="col-span-3 col-start-2 text-sm text-red-500">
                    {form.formState.errors.nome.message}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="codigo" className="text-right">
                  Código
                </Label>
                <Input
                  id="codigo"
                  className="col-span-3"
                  {...form.register('codigo')}
                />
                {form.formState.errors.codigo && (
                  <p className="col-span-3 col-start-2 text-sm text-red-500">
                    {form.formState.errors.codigo.message}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="valor" className="text-right">
                  Valor (R$)
                </Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  className="col-span-3"
                  {...form.register('valor')}
                />
                {form.formState.errors.valor && (
                  <p className="col-span-3 col-start-2 text-sm text-red-500">
                    {form.formState.errors.valor.message}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="estoque" className="text-right">
                  Estoque
                </Label>
                <Input
                  id="estoque"
                  type="number"
                  className="col-span-3"
                  {...form.register('estoque')}
                />
                {form.formState.errors.estoque && (
                  <p className="col-span-3 col-start-2 text-sm text-red-500">
                    {form.formState.errors.estoque.message}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="estoque_minimo" className="text-right">
                  Estoque Mínimo
                </Label>
                <Input
                  id="estoque_minimo"
                  type="number"
                  className="col-span-3"
                  {...form.register('estoque_minimo')}
                />
                {form.formState.errors.estoque_minimo && (
                  <p className="col-span-3 col-start-2 text-sm text-red-500">
                    {form.formState.errors.estoque_minimo.message}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="categoria" className="text-right">
                  Categoria
                </Label>
                <Input
                  id="categoria"
                  className="col-span-3"
                  {...form.register('categoria')}
                />
                {form.formState.errors.categoria && (
                  <p className="col-span-3 col-start-2 text-sm text-red-500">
                    {form.formState.errors.categoria.message}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createProdutoMutation.isPending || updateProdutoMutation.isPending}>
                {createProdutoMutation.isPending || updateProdutoMutation.isPending
                  ? 'Salvando...'
                  : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Tem certeza que deseja excluir o produto "{produtoToDelete?.nome}"?</p>
            <p className="text-sm text-gray-500 mt-2">Esta ação não pode ser desfeita.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteProdutoMutation.isPending}>
              {deleteProdutoMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
} 