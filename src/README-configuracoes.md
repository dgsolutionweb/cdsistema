# Página de Configurações do Sistema

## Visão Geral

A página de Configurações permite aos administradores do sistema configurar diversos aspectos do sistema, incluindo:

- Informações da empresa (nome, CNPJ, endereço, contato, logo, etc.)
- Preferências do sistema (tema, moeda, formato de data, casas decimais)
- Opções de backup e segurança

## Estrutura de Arquivos

- `src/pages/Configuracoes.tsx` - Componente principal da página
- `src/types/configuracoes.ts` - Interfaces TypeScript para os dados de configuração
- `src/migrations/configuracoes.sql` - Script SQL para criar a tabela no banco de dados

## Funcionalidades

### Dados da Empresa
- Nome da empresa
- CNPJ
- Endereço
- Telefone
- E-mail
- Logo da empresa (com upload de imagem)

### Preferências do Sistema
- Tema (Claro, Escuro, Sistema)
- Moeda (Real, Dólar, Euro)
- Formato de Data
- Casas decimais para valores monetários

### Backup e Segurança
- Opção para backup automático
- Configuração do intervalo de backup (em dias)
- Funcionalidade de backup manual

## Requisitos de Backend

### Tabela no Supabase

A página de configurações requer a criação de uma tabela `configuracoes` no banco de dados.
Um script SQL para criar essa tabela está disponível em `src/migrations/configuracoes.sql`.

### Bucket de Storage

Para o upload do logo da empresa, é necessário criar um bucket chamado 'logos' no Storage do Supabase.
Para criar o bucket, acesse o dashboard do Supabase:

1. Navegue até a seção "Storage"
2. Clique em "Criar novo bucket"
3. Nomeie o bucket como "logos"
4. Configure as permissões apropriadas (recomendado: acesso público para leitura, acesso autenticado para escrita)

## Instalação e Configuração

1. Certifique-se de que as variáveis de ambiente para o Supabase estão configuradas no seu arquivo `.env`:

```
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

2. Execute a migração do banco de dados:
   - Copie o conteúdo do arquivo `src/migrations/configuracoes.sql`
   - Cole e execute no editor SQL do Supabase

3. Crie o bucket de storage para os logos conforme descrito acima

## Uso

A página de Configurações está disponível apenas para usuários autenticados. Para acessá-la:

1. Faça login no sistema
2. Acesse a opção "Configurações" no menu lateral
3. Preencha ou atualize as informações conforme necessário
4. Clique em "Salvar Configurações" para aplicar as alterações

## Configurações Iniciais

As configurações iniciais padrão serão automaticamente criadas no banco de dados quando você executar o script de migração SQL. Essas configurações podem ser alteradas a qualquer momento através da interface do sistema. 