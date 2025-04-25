export interface Configuracao {
  id: string;
  nome_empresa: string;
  cnpj: string;
  endereco: string;
  telefone: string;
  email: string;
  logo_url: string | null;
  tema: 'claro' | 'escuro' | 'sistema';
  moeda: string;
  formato_data: string;
  decimais_valores: number;
  backup_automatico: boolean;
  intervalo_backup: number;
  criado_em: string;
  atualizado_em: string;
  usuario_id: string;
  empresa_id: string;
}

export interface ConfiguracaoInsert extends Omit<Configuracao, 'id' | 'criado_em' | 'atualizado_em'> {}

export interface ConfiguracaoUpdate extends Partial<ConfiguracaoInsert> {
  atualizado_em?: string;
} 