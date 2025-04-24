import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, CheckCircle, XCircle, Edit2, Trash2, UserX, UserCheck } from 'lucide-react';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  status: 'pendente' | 'ativo' | 'bloqueado';
  role: 'user' | 'admin' | 'superadmin';
  created_at: string;
  ativado_em: string | null;
  bloqueado_em: string | null;
}

export function GestaoUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const { user } = useAuth();

  // Carregar usuários
  const carregarUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsuarios(data || []);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
      setError('Falha ao carregar a lista de usuários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  // Ativar usuário
  const ativarUsuario = async (id: string) => {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({
          status: 'ativo',
          ativado_em: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      setSuccess('Usuário ativado com sucesso!');
      carregarUsuarios();
    } catch (err) {
      console.error('Erro ao ativar usuário:', err);
      setError('Falha ao ativar usuário.');
    }
  };

  // Bloquear usuário
  const bloquearUsuario = async (id: string) => {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({
          status: 'bloqueado',
          bloqueado_em: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      setSuccess('Usuário bloqueado com sucesso!');
      carregarUsuarios();
    } catch (err) {
      console.error('Erro ao bloquear usuário:', err);
      setError('Falha ao bloquear usuário.');
    }
  };

  // Excluir usuário
  const excluirUsuario = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSuccess('Usuário excluído com sucesso!');
      carregarUsuarios();
    } catch (err) {
      console.error('Erro ao excluir usuário:', err);
      setError('Falha ao excluir usuário.');
    }
  };

  // Atualizar usuário
  const atualizarUsuario = async (dadosAtualizados: Partial<Usuario>) => {
    if (!usuarioSelecionado) return;

    try {
      const { error } = await supabase
        .from('usuarios')
        .update(dadosAtualizados)
        .eq('id', usuarioSelecionado.id);

      if (error) throw error;
      setSuccess('Usuário atualizado com sucesso!');
      setShowEditModal(false);
      carregarUsuarios();
    } catch (err) {
      console.error('Erro ao atualizar usuário:', err);
      setError('Falha ao atualizar usuário.');
    }
  };

  const StatusBadge = ({ status }: { status: Usuario['status'] }) => {
    const badges = {
      pendente: 'bg-yellow-100 text-yellow-800',
      ativo: 'bg-green-100 text-green-800',
      bloqueado: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Gestão de Usuários</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gerencie todos os usuários do sistema, incluindo ativação, bloqueio e edição.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <p className="ml-3 text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mt-4 bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <p className="ml-3 text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                      Nome
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Email
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Função
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Data de Cadastro
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                        {usuario.nome}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{usuario.email}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <StatusBadge status={usuario.status} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {usuario.role}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(usuario.created_at).toLocaleDateString()}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="flex justify-end gap-2">
                          {usuario.status === 'pendente' && (
                            <button
                              onClick={() => ativarUsuario(usuario.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Ativar"
                            >
                              <UserCheck className="h-5 w-5" />
                            </button>
                          )}
                          {usuario.status !== 'bloqueado' && (
                            <button
                              onClick={() => bloquearUsuario(usuario.id)}
                              className="text-orange-600 hover:text-orange-900"
                              title="Bloquear"
                            >
                              <UserX className="h-5 w-5" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setUsuarioSelecionado(usuario);
                              setShowEditModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar"
                          >
                            <Edit2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => excluirUsuario(usuario.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Excluir"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Edição */}
      {showEditModal && usuarioSelecionado && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Editar Usuário</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              atualizarUsuario({
                nome: formData.get('nome') as string,
                telefone: formData.get('telefone') as string,
                role: formData.get('role') as 'user' | 'admin' | 'superadmin'
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
                    Nome
                  </label>
                  <input
                    type="text"
                    name="nome"
                    id="nome"
                    defaultValue={usuarioSelecionado.nome}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="telefone" className="block text-sm font-medium text-gray-700">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    name="telefone"
                    id="telefone"
                    defaultValue={usuarioSelecionado.telefone}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                    Função
                  </label>
                  <select
                    name="role"
                    id="role"
                    defaultValue={usuarioSelecionado.role}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="user">Usuário</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 