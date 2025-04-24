import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../lib/supabase';

interface FormData {
  nome: string;
  email: string;
  telefone: string;
  senha: string;
  confirmarSenha: string;
  empresa_nome: string;
  empresa_cnpj: string;
  empresa_telefone: string;
  empresa_endereco: string;
}

export function Cadastro() {
  const navigate = useNavigate();
  const { signUp } = useSupabaseAuth();
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    email: '',
    telefone: '',
    senha: '',
    confirmarSenha: '',
    empresa_nome: '',
    empresa_cnpj: '',
    empresa_telefone: '',
    empresa_endereco: ''
  });

  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validações básicas
    if (formData.senha !== formData.confirmarSenha) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    if (formData.senha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    // Validar CNPJ (formato básico)
    const cnpjRegex = /^\d{14}$/;
    if (!cnpjRegex.test(formData.empresa_cnpj.replace(/\D/g, ''))) {
      setError('CNPJ inválido');
      setLoading(false);
      return;
    }

    try {
      // Cadastrar usando o hook personalizado
      const { data, error } = await signUp(
        formData.email,
        formData.senha,
        {
          nome: formData.nome,
          telefone: formData.telefone,
          empresa_nome: formData.empresa_nome,
          empresa_cnpj: formData.empresa_cnpj,
          empresa_telefone: formData.empresa_telefone,
          empresa_endereco: formData.empresa_endereco
        }
      );

      if (error) throw error;

      setSuccess('Cadastro realizado com sucesso! Aguarde a aprovação do administrador.');
      
      // Limpar formulário
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        senha: '',
        confirmarSenha: '',
        empresa_nome: '',
        empresa_cnpj: '',
        empresa_telefone: '',
        empresa_endereco: ''
      });

      // Redirecionar para o login após 2 segundos
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err: any) {
      console.error('Erro no cadastro:', err);
      if (err.message === 'User already registered') {
        setError('Este e-mail já está cadastrado');
      } else {
        setError('Erro ao realizar cadastro. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Criar nova conta
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Dados do Usuário */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Dados do Usuário</h3>
              
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
                  Nome completo
                </label>
                <div className="mt-1">
                  <input
                    id="nome"
                    name="nome"
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  E-mail
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="telefone" className="block text-sm font-medium text-gray-700">
                  Telefone
                </label>
                <div className="mt-1">
                  <input
                    id="telefone"
                    name="telefone"
                    type="tel"
                    required
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="senha" className="block text-sm font-medium text-gray-700">
                  Senha
                </label>
                <div className="mt-1">
                  <input
                    id="senha"
                    name="senha"
                    type="password"
                    required
                    value={formData.senha}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmarSenha" className="block text-sm font-medium text-gray-700">
                  Confirmar Senha
                </label>
                <div className="mt-1">
                  <input
                    id="confirmarSenha"
                    name="confirmarSenha"
                    type="password"
                    required
                    value={formData.confirmarSenha}
                    onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Dados da Empresa */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Dados da Empresa</h3>
              
              <div>
                <label htmlFor="empresa_nome" className="block text-sm font-medium text-gray-700">
                  Nome da Empresa
                </label>
                <div className="mt-1">
                  <input
                    id="empresa_nome"
                    name="empresa_nome"
                    type="text"
                    required
                    value={formData.empresa_nome}
                    onChange={(e) => setFormData({ ...formData, empresa_nome: e.target.value })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="empresa_cnpj" className="block text-sm font-medium text-gray-700">
                  CNPJ
                </label>
                <div className="mt-1">
                  <input
                    id="empresa_cnpj"
                    name="empresa_cnpj"
                    type="text"
                    required
                    value={formData.empresa_cnpj}
                    onChange={(e) => setFormData({ ...formData, empresa_cnpj: e.target.value })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="empresa_telefone" className="block text-sm font-medium text-gray-700">
                  Telefone da Empresa
                </label>
                <div className="mt-1">
                  <input
                    id="empresa_telefone"
                    name="empresa_telefone"
                    type="tel"
                    required
                    value={formData.empresa_telefone}
                    onChange={(e) => setFormData({ ...formData, empresa_telefone: e.target.value })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="empresa_endereco" className="block text-sm font-medium text-gray-700">
                  Endereço da Empresa
                </label>
                <div className="mt-1">
                  <input
                    id="empresa_endereco"
                    name="empresa_endereco"
                    type="text"
                    required
                    value={formData.empresa_endereco}
                    onChange={(e) => setFormData({ ...formData, empresa_endereco: e.target.value })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {success && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="text-sm text-green-700">{success}</div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Cadastrando...' : 'Cadastrar'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Já tem uma conta?{' '}
                  <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                    Faça login
                  </a>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 