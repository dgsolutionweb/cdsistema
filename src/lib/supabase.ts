import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database.types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Variáveis de ambiente do Supabase não configuradas corretamente.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Hook de autenticação
export const useSupabaseAuth = () => {
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signUp = async (email: string, password: string, userData: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return {
    signIn,
    signUp,
    signOut,
  }
}

// Hooks para Empresas
export const useEmpresas = (empresaId?: string) => {
  const getEmpresa = async (id: string) => {
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  };

  const getEmpresas = async () => {
    const { data, error } = await supabase
      .from('empresas')
      .select('*');
    
    if (error) throw error;
    return data;
  };

  const createEmpresa = async (empresa: Database['public']['Tables']['empresas']['Insert']) => {
    const { data, error } = await supabase
      .from('empresas')
      .insert(empresa)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  };

  const updateEmpresa = async ({ id, ...empresa }: Database['public']['Tables']['empresas']['Update'] & { id: string }) => {
    const { data, error } = await supabase
      .from('empresas')
      .update(empresa)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  };

  // Hook React Query para obter uma empresa específica
  const useEmpresa = (id?: string) => {
    return useQuery({
      queryKey: ['empresa', id],
      queryFn: () => getEmpresa(id!),
      enabled: !!id,
    });
  };

  // Hook React Query para obter todas as empresas
  const useListEmpresas = () => {
    return useQuery({
      queryKey: ['empresas'],
      queryFn: getEmpresas,
    });
  };

  // Hook React Query para criar empresa
  const useCreateEmpresa = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: createEmpresa,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['empresas'] });
        toast.success('Empresa criada com sucesso!');
      },
      onError: (error: any) => {
        toast.error(`Erro ao criar empresa: ${error.message}`);
      },
    });
  };

  // Hook React Query para atualizar empresa
  const useUpdateEmpresa = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: updateEmpresa,
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['empresas'] });
        queryClient.invalidateQueries({ queryKey: ['empresa', data.id] });
        toast.success('Empresa atualizada com sucesso!');
      },
      onError: (error: any) => {
        toast.error(`Erro ao atualizar empresa: ${error.message}`);
      },
    });
  };

  return {
    useEmpresa,
    useListEmpresas,
    useCreateEmpresa,
    useUpdateEmpresa
  };
};

// Hooks para Produtos
export const useProdutos = (empresaId?: string) => {
  const getProduto = async (id: string) => {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  };

  const getProdutosPorEmpresa = async (empresaId: string) => {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('empresa_id', empresaId);
    
    if (error) throw error;
    return data;
  };

  const createProduto = async (produto: Database['public']['Tables']['produtos']['Insert']) => {
    const { data, error } = await supabase
      .from('produtos')
      .insert(produto)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  };

  const updateProduto = async ({ id, ...produto }: Database['public']['Tables']['produtos']['Update'] & { id: string }) => {
    const { data, error } = await supabase
      .from('produtos')
      .update(produto)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  };

  const deleteProduto = async (id: string) => {
    const { error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  };

  // Hook React Query para obter um produto específico
  const useProduto = (id?: string) => {
    return useQuery({
      queryKey: ['produto', id],
      queryFn: () => getProduto(id!),
      enabled: !!id,
    });
  };

  // Hook React Query para obter produtos de uma empresa
  const useListProdutosPorEmpresa = (empresaId?: string) => {
    return useQuery({
      queryKey: ['produtos', empresaId],
      queryFn: () => getProdutosPorEmpresa(empresaId!),
      enabled: !!empresaId,
    });
  };

  // Hook React Query para criar produto
  const useCreateProduto = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: createProduto,
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['produtos', data.empresa_id] });
        toast.success('Produto criado com sucesso!');
      },
      onError: (error: any) => {
        toast.error(`Erro ao criar produto: ${error.message}`);
      },
    });
  };

  // Hook React Query para atualizar produto
  const useUpdateProduto = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: updateProduto,
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['produtos', data.empresa_id] });
        queryClient.invalidateQueries({ queryKey: ['produto', data.id] });
        toast.success('Produto atualizado com sucesso!');
      },
      onError: (error: any) => {
        toast.error(`Erro ao atualizar produto: ${error.message}`);
      },
    });
  };

  // Hook React Query para deletar produto
  const useDeleteProduto = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: deleteProduto,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['produtos'] });
        toast.success('Produto excluído com sucesso!');
      },
      onError: (error: any) => {
        toast.error(`Erro ao excluir produto: ${error.message}`);
      },
    });
  };

  return {
    useProduto,
    useListProdutosPorEmpresa,
    useCreateProduto,
    useUpdateProduto,
    useDeleteProduto
  };
};

// Hooks para Clientes
export const useClientes = (empresaId?: string) => {
  const getCliente = async (id: string) => {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  };

  const getClientesPorEmpresa = async (empresaId: string) => {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('empresa_id', empresaId);
    
    if (error) throw error;
    return data;
  };

  const createCliente = async (cliente: Database['public']['Tables']['clientes']['Insert']) => {
    const { data, error } = await supabase
      .from('clientes')
      .insert(cliente)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  };

  const updateCliente = async ({ id, ...cliente }: Database['public']['Tables']['clientes']['Update'] & { id: string }) => {
    const { data, error } = await supabase
      .from('clientes')
      .update(cliente)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  };

  const deleteCliente = async (id: string) => {
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  };

  // Hook React Query para obter um cliente específico
  const useCliente = (id?: string) => {
    return useQuery({
      queryKey: ['cliente', id],
      queryFn: () => getCliente(id!),
      enabled: !!id,
    });
  };

  // Hook React Query para obter clientes de uma empresa
  const useListClientesPorEmpresa = (empresaId?: string) => {
    return useQuery({
      queryKey: ['clientes', empresaId],
      queryFn: () => getClientesPorEmpresa(empresaId!),
      enabled: !!empresaId,
    });
  };

  // Hook React Query para criar cliente
  const useCreateCliente = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: createCliente,
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['clientes', data.empresa_id] });
        toast.success('Cliente criado com sucesso!');
      },
      onError: (error: any) => {
        toast.error(`Erro ao criar cliente: ${error.message}`);
      },
    });
  };

  // Hook React Query para atualizar cliente
  const useUpdateCliente = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: updateCliente,
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['clientes', data.empresa_id] });
        queryClient.invalidateQueries({ queryKey: ['cliente', data.id] });
        toast.success('Cliente atualizado com sucesso!');
      },
      onError: (error: any) => {
        toast.error(`Erro ao atualizar cliente: ${error.message}`);
      },
    });
  };

  // Hook React Query para deletar cliente
  const useDeleteCliente = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: deleteCliente,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['clientes'] });
        toast.success('Cliente excluído com sucesso!');
      },
      onError: (error: any) => {
        toast.error(`Erro ao excluir cliente: ${error.message}`);
      },
    });
  };

  return {
    useCliente,
    useListClientesPorEmpresa,
    useCreateCliente,
    useUpdateCliente,
    useDeleteCliente
  };
};

// Hooks para Vendas
export const useVendas = (empresaId?: string) => {
  const getVenda = async (id: string) => {
    const { data: venda, error: vendaError } = await supabase
      .from('vendas')
      .select('*, clientes:cliente_id(*)')
      .eq('id', id)
      .single();
    
    if (vendaError) throw vendaError;
    
    const { data: itens, error: itensError } = await supabase
      .from('vendas_itens')
      .select('*, produtos:produto_id(*)')
      .eq('venda_id', id);
    
    if (itensError) throw itensError;
    
    return { ...venda, itens };
  };

  const getVendasPorEmpresa = async (empresaId: string) => {
    const { data, error } = await supabase
      .from('vw_vendas_dashboard')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  };

  const registrarVenda = async (venda: {
    cliente_id?: string;
    valor_total: number;
    desconto: number;
    forma_pagamento: string;
    usuario_id: string;
    empresa_id: string;
    itens: Array<{
      produto_id: string;
      quantidade: number;
      valor_unitario: number;
    }>;
  }) => {
    const { data, error } = await supabase
      .rpc('registrar_venda', {
        p_cliente_id: venda.cliente_id || null,
        p_valor_total: venda.valor_total,
        p_desconto: venda.desconto,
        p_forma_pagamento: venda.forma_pagamento,
        p_usuario_id: venda.usuario_id,
        p_empresa_id: venda.empresa_id,
        p_itens: venda.itens
      });
    
    if (error) throw error;
    return data;
  };

  const cancelarVenda = async (id: string) => {
    const { data, error } = await supabase
      .from('vendas')
      .update({ status: 'cancelada' })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  };

  // Hook React Query para obter uma venda específica
  const useVenda = (id?: string) => {
    return useQuery({
      queryKey: ['venda', id],
      queryFn: () => getVenda(id!),
      enabled: !!id,
    });
  };

  // Hook React Query para obter vendas de uma empresa
  const useListVendasPorEmpresa = (empresaId?: string) => {
    return useQuery({
      queryKey: ['vendas', empresaId],
      queryFn: () => getVendasPorEmpresa(empresaId!),
      enabled: !!empresaId,
    });
  };

  // Hook React Query para registrar venda
  const useRegistrarVenda = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: registrarVenda,
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['vendas', variables.empresa_id] });
        queryClient.invalidateQueries({ queryKey: ['produtos', variables.empresa_id] });
        queryClient.invalidateQueries({ queryKey: ['caixas', variables.empresa_id] });
        toast.success('Venda registrada com sucesso!');
      },
      onError: (error: any) => {
        toast.error(`Erro ao registrar venda: ${error.message}`);
      },
    });
  };

  // Hook React Query para cancelar venda
  const useCancelarVenda = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: cancelarVenda,
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['vendas', data.empresa_id] });
        queryClient.invalidateQueries({ queryKey: ['venda', data.id] });
        toast.success('Venda cancelada com sucesso!');
      },
      onError: (error: any) => {
        toast.error(`Erro ao cancelar venda: ${error.message}`);
      },
    });
  };

  return {
    useVenda,
    useListVendasPorEmpresa,
    useRegistrarVenda,
    useCancelarVenda
  };
};

// Hooks para Caixa
export const useCaixas = (empresaId?: string) => {
  const getCaixa = async (id: string) => {
    const { data: caixa, error: caixaError } = await supabase
      .from('caixas')
      .select('*, usuarios:usuario_id(*)')
      .eq('id', id)
      .single();
    
    if (caixaError) throw caixaError;
    
    const { data: movimentos, error: movimentosError } = await supabase
      .from('movimentos_caixa')
      .select('*')
      .eq('caixa_id', id)
      .order('created_at', { ascending: false });
    
    if (movimentosError) throw movimentosError;
    
    return { ...caixa, movimentos };
  };

  const getCaixaAbertoPorUsuario = async (usuarioId: string) => {
    const { data, error } = await supabase
      .from('caixas')
      .select('*')
      .eq('usuario_id', usuarioId)
      .eq('status', 'aberto')
      .single();
    
    if (error && error.code !== 'PGRST116') { // Ignora erro "não encontrado"
      throw error;
    }
    
    return data;
  };

  const getCaixasPorEmpresa = async (empresaId: string) => {
    const { data, error } = await supabase
      .from('caixas')
      .select('*, usuarios:usuario_id(nome)')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  };

  const abrirCaixa = async (params: {
    usuario_id: string;
    valor_inicial: number;
    empresa_id: string;
  }) => {
    const { data, error } = await supabase
      .rpc('abrir_caixa', {
        p_usuario_id: params.usuario_id,
        p_valor_inicial: params.valor_inicial,
        p_empresa_id: params.empresa_id
      });
    
    if (error) throw error;
    return data;
  };

  const fecharCaixa = async (params: {
    caixa_id: string;
    valor_final: number;
    usuario_id: string;
  }) => {
    const { data, error } = await supabase
      .rpc('fechar_caixa', {
        p_caixa_id: params.caixa_id,
        p_valor_final: params.valor_final,
        p_usuario_id: params.usuario_id
      });
    
    if (error) throw error;
    return data;
  };

  const registrarMovimentoCaixa = async (movimento: Database['public']['Tables']['movimentos_caixa']['Insert']) => {
    const { data, error } = await supabase
      .from('movimentos_caixa')
      .insert(movimento)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  };

  // Hook React Query para obter um caixa específico
  const useCaixa = (id?: string) => {
    return useQuery({
      queryKey: ['caixa', id],
      queryFn: () => getCaixa(id!),
      enabled: !!id,
    });
  };

  // Hook React Query para obter caixa aberto pelo usuário
  const useCaixaAbertoPorUsuario = (usuarioId?: string) => {
    return useQuery({
      queryKey: ['caixa-aberto', usuarioId],
      queryFn: () => getCaixaAbertoPorUsuario(usuarioId!),
      enabled: !!usuarioId,
    });
  };

  // Hook React Query para obter caixas de uma empresa
  const useListCaixasPorEmpresa = (empresaId?: string) => {
    return useQuery({
      queryKey: ['caixas', empresaId],
      queryFn: () => getCaixasPorEmpresa(empresaId!),
      enabled: !!empresaId,
    });
  };

  // Hook React Query para abrir caixa
  const useAbrirCaixa = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: abrirCaixa,
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['caixas', variables.empresa_id] });
        queryClient.invalidateQueries({ queryKey: ['caixa-aberto', variables.usuario_id] });
        toast.success('Caixa aberto com sucesso!');
      },
      onError: (error: any) => {
        toast.error(`Erro ao abrir caixa: ${error.message}`);
      },
    });
  };

  // Hook React Query para fechar caixa
  const useFecharCaixa = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: fecharCaixa,
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['caixas'] });
        queryClient.invalidateQueries({ queryKey: ['caixa', variables.caixa_id] });
        queryClient.invalidateQueries({ queryKey: ['caixa-aberto', variables.usuario_id] });
        toast.success('Caixa fechado com sucesso!');
      },
      onError: (error: any) => {
        toast.error(`Erro ao fechar caixa: ${error.message}`);
      },
    });
  };

  // Hook React Query para registrar movimento de caixa
  const useRegistrarMovimentoCaixa = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: registrarMovimentoCaixa,
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['caixa', data.caixa_id] });
        toast.success('Movimento registrado com sucesso!');
      },
      onError: (error: any) => {
        toast.error(`Erro ao registrar movimento: ${error.message}`);
      },
    });
  };

  return {
    useCaixa,
    useCaixaAbertoPorUsuario,
    useListCaixasPorEmpresa,
    useAbrirCaixa,
    useFecharCaixa,
    useRegistrarMovimentoCaixa
  };
};

// Hooks para Dashboard
export const useDashboard = (empresaId?: string) => {
  const getDadosDashboard = async (empresaId: string, dataInicio?: string, dataFim?: string) => {
    // Produtos mais vendidos
    const { data: produtosMaisVendidos, error: produtosError } = await supabase
      .from('vw_produtos_mais_vendidos')
      .select('*')
      .eq('empresa_id', empresaId)
      .limit(10);
    
    if (produtosError) throw produtosError;
    
    // Clientes destaque
    const { data: clientesDestaque, error: clientesError } = await supabase
      .from('vw_clientes_destaque')
      .select('*')
      .eq('empresa_id', empresaId)
      .limit(10);
    
    if (clientesError) throw clientesError;
    
    // Resumo vendas por período
    let query = supabase
      .from('vw_resumo_vendas_periodo')
      .select('*')
      .eq('empresa_id', empresaId);
    
    if (dataInicio) {
      query = query.gte('data', dataInicio);
    }
    
    if (dataFim) {
      query = query.lte('data', dataFim);
    }
    
    const { data: resumoVendas, error: resumoError } = await query;
    
    if (resumoError) throw resumoError;
    
    // Vendas por forma de pagamento
    const { data: vendasPorPagamento, error: pagamentoError } = await supabase
      .from('vw_vendas_por_pagamento')
      .select('*')
      .eq('empresa_id', empresaId);
    
    if (pagamentoError) throw pagamentoError;
    
    // Produtos com estoque baixo
    const { data: produtosEstoqueBaixo, error: estoqueBaixoError } = await supabase
      .from('vw_produtos_estoque_baixo')
      .select('*')
      .eq('empresa_id', empresaId);
    
    if (estoqueBaixoError) throw estoqueBaixoError;
    
    // Evolução vendas diárias
    const { data: evolucaoVendas, error: evolucaoError } = await supabase
      .from('vw_evolucao_vendas_diarias')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('data', { ascending: true });
    
    if (evolucaoError) throw evolucaoError;
    
    return {
      produtosMaisVendidos,
      clientesDestaque,
      resumoVendas,
      vendasPorPagamento,
      produtosEstoqueBaixo,
      evolucaoVendas
    };
  };

  // Hook React Query para obter dados do dashboard
  const useDadosDashboard = (empresaId?: string, dataInicio?: string, dataFim?: string) => {
    return useQuery({
      queryKey: ['dashboard', empresaId, dataInicio, dataFim],
      queryFn: () => getDadosDashboard(empresaId!, dataInicio, dataFim),
      enabled: !!empresaId,
    });
  };

  return {
    useDadosDashboard
  };
}; 