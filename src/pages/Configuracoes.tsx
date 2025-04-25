import { useState } from 'react';
import { Key, Save, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const Configuracoes = () => {
  const { user } = useAuth();
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false);
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);

  const alterarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('Você precisa estar logado para alterar a senha.');
      return;
    }
    
    // Validações
    if (!senhaAtual) {
      setError('Informe sua senha atual.');
      return;
    }
    
    if (!novaSenha) {
      setError('Informe a nova senha.');
      return;
    }
    
    if (novaSenha.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    
    if (novaSenha !== confirmarSenha) {
      setError('As senhas não coincidem.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      console.log('Iniciando processo de alteração de senha...');
      
      // Verificar se a senha atual está correta
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: senhaAtual
      });
      
      if (loginError) {
        console.error('Erro ao validar senha atual:', loginError);
        throw new Error('Senha atual incorreta.');
      }
      
      // Atualizar senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: novaSenha
      });
      
      if (updateError) {
        console.error('Erro ao atualizar senha:', updateError);
        throw updateError;
      }
      
      // Limpar formulário
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      
      setSuccess('Senha alterada com sucesso!');
      
      // Limpar mensagem de sucesso após 5 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (erro: any) {
      console.error('Erro ao alterar senha:', erro);
      setError(erro.message || 'Não foi possível alterar a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <Key className="mr-2" size={28} />
          Alterar Senha
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="text-red-500 mr-2" size={20} />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
          <div className="flex items-center">
            <CheckCircle className="text-green-500 mr-2" size={20} />
            <p className="text-green-700">{success}</p>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md mb-6">
        <div className="flex items-center">
          <AlertCircle className="text-blue-500 mr-2" size={20} />
          <div>
            <p className="text-blue-700 font-medium">Novas funcionalidades em breve!</p>
            <p className="text-blue-600">Estamos trabalhando em novas implementações para as configurações do sistema. Em breve você terá acesso a mais opções de personalização.</p>
          </div>
        </div>
      </div>

      <form onSubmit={alterarSenha} className="bg-white shadow-md rounded-lg p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Alterar sua senha</h2>
            <p className="text-gray-600 mb-4">
              Para sua segurança, recomendamos usar uma senha forte com pelo menos 8 caracteres, incluindo letras, números e símbolos.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha Atual
                </label>
                <div className="relative">
                  <input
                    type={mostrarSenhaAtual ? "text" : "password"}
                    value={senhaAtual}
                    onChange={(e) => setSenhaAtual(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenhaAtual(!mostrarSenhaAtual)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {mostrarSenhaAtual ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nova Senha
                </label>
                <div className="relative">
                  <input
                    type={mostrarNovaSenha ? "text" : "password"}
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {mostrarNovaSenha ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  A senha deve ter pelo menos 6 caracteres.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <input
                    type={mostrarConfirmacao ? "text" : "password"}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarConfirmacao(!mostrarConfirmacao)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {mostrarConfirmacao ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Alterando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Alterar Senha
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Configuracoes; 