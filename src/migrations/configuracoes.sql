-- Tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS public.configuracoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_empresa VARCHAR(255) NOT NULL DEFAULT 'Minha Empresa',
    cnpj VARCHAR(20) NOT NULL DEFAULT '00.000.000/0000-00',
    endereco TEXT DEFAULT '',
    telefone VARCHAR(20) DEFAULT '',
    email VARCHAR(255) DEFAULT '',
    logo_url TEXT DEFAULT NULL,
    tema VARCHAR(20) NOT NULL DEFAULT 'claro',
    moeda VARCHAR(5) NOT NULL DEFAULT 'BRL',
    formato_data VARCHAR(20) NOT NULL DEFAULT 'DD/MM/YYYY',
    decimais_valores INTEGER NOT NULL DEFAULT 2,
    backup_automatico BOOLEAN NOT NULL DEFAULT false,
    intervalo_backup INTEGER NOT NULL DEFAULT 7,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verificar se já existe registro e inserir um padrão caso não exista
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.configuracoes) THEN
        INSERT INTO public.configuracoes (
            nome_empresa, 
            cnpj, 
            endereco, 
            telefone, 
            email, 
            tema, 
            moeda, 
            formato_data, 
            decimais_valores, 
            backup_automatico, 
            intervalo_backup
        ) VALUES (
            'Minha Empresa', 
            '00.000.000/0000-00', 
            'Endereço da empresa', 
            '(00) 0000-0000', 
            'contato@minhaempresa.com.br', 
            'claro', 
            'BRL', 
            'DD/MM/YYYY', 
            2, 
            false, 
            7
        );
    END IF;
END $$;

-- Criar extensão para storage se ainda não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar bucket para logos se não existir
-- Nota: Isso é executado no cliente Supabase, não via SQL direto
-- Você precisará criar o bucket 'logos' pelo cliente Supabase ou API 