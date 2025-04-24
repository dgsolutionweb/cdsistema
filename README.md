# Sistema de Gestão Comercial (SGC)

Sistema web moderno e completo para gestão de estabelecimentos comerciais com suporte a múltiplas empresas.

## 🚀 Tecnologias

- Vite + React
- TypeScript
- Tailwind CSS
- Framer Motion
- Supabase (Backend e Autenticação)
- PostgreSQL

## 📋 Pré-requisitos

- Node.js 18+
- NPM ou Yarn
- Conta no Supabase

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone [url-do-repositorio]
cd cdsistema
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
- Crie um arquivo `.env` na raiz do projeto
- Copie o conteúdo de `.env.example`
- Preencha com suas credenciais do Supabase

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## 🏗️ Estrutura do Projeto

```
src/
  ├── components/     # Componentes reutilizáveis
  ├── contexts/      # Contextos React (Auth, etc)
  ├── lib/           # Configurações (Supabase, etc)
  ├── pages/         # Páginas da aplicação
  ├── types/         # Tipos TypeScript
  └── utils/         # Funções utilitárias
```

## 🔐 Autenticação e Segurança

- Autenticação integrada com Supabase
- Row Level Security (RLS) para isolamento de dados
- Políticas de acesso por empresa

## 📱 Mobile First

O sistema é totalmente responsivo e otimizado para dispositivos móveis, com interface adaptativa para diferentes tamanhos de tela.

## 🛠️ Módulos Principais

1. Cadastro e Controle de Produtos
2. Cadastro e Controle de Clientes
3. PDV Completo
4. Relatórios e Dashboards
5. Gestão Multiempresa
6. Painel Super Admin

## 👥 Níveis de Acesso

- Super Admin: Acesso total ao sistema
- Admin Empresa: Acesso à sua empresa
- Operador: Acesso limitado aos módulos designados

## 📄 Licença

Este projeto está sob a licença [sua-licença]. Consulte o arquivo LICENSE para mais detalhes.
