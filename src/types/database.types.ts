export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      empresas: {
        Row: {
          id: string
          created_at: string
          nome: string
          status: 'ativa' | 'bloqueada' | 'pendente'
          cnpj: string
          endereco: string | null
          telefone: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          nome: string
          status?: 'ativa' | 'bloqueada' | 'pendente'
          cnpj: string
          endereco?: string | null
          telefone?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          nome?: string
          status?: 'ativa' | 'bloqueada' | 'pendente'
          cnpj?: string
          endereco?: string | null
          telefone?: string | null
        }
      }
      usuarios: {
        Row: {
          id: string
          created_at: string
          email: string
          nome: string
          tipo: 'super_admin' | 'admin_empresa' | 'operador'
          empresa_id: string | null
          avatar_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          email: string
          nome: string
          tipo?: 'super_admin' | 'admin_empresa' | 'operador'
          empresa_id?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          nome?: string
          tipo?: 'super_admin' | 'admin_empresa' | 'operador'
          empresa_id?: string | null
          avatar_url?: string | null
        }
      }
      produtos: {
        Row: {
          id: string
          created_at: string
          nome: string
          codigo: string
          valor: number
          estoque: number
          categoria: string
          empresa_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          nome: string
          codigo: string
          valor: number
          estoque: number
          categoria: string
          empresa_id: string
        }
        Update: {
          id?: string
          created_at?: string
          nome?: string
          codigo?: string
          valor?: number
          estoque?: number
          categoria?: string
          empresa_id?: string
        }
      }
      clientes: {
        Row: {
          id: string
          created_at: string
          nome: string
          cpf: string
          email: string | null
          telefone: string | null
          empresa_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          nome: string
          cpf: string
          email?: string | null
          telefone?: string | null
          empresa_id: string
        }
        Update: {
          id?: string
          created_at?: string
          nome?: string
          cpf?: string
          email?: string | null
          telefone?: string | null
          empresa_id?: string
        }
      }
      vendas: {
        Row: {
          id: string
          created_at: string
          cliente_id: string | null
          valor_total: number
          desconto: number
          forma_pagamento: 'dinheiro' | 'cartao' | 'pix'
          empresa_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          cliente_id?: string | null
          valor_total: number
          desconto?: number
          forma_pagamento: 'dinheiro' | 'cartao' | 'pix'
          empresa_id: string
        }
        Update: {
          id?: string
          created_at?: string
          cliente_id?: string | null
          valor_total?: number
          desconto?: number
          forma_pagamento?: 'dinheiro' | 'cartao' | 'pix'
          empresa_id?: string
        }
      }
      itens_venda: {
        Row: {
          id: string
          venda_id: string
          produto_id: string
          quantidade: number
          valor_unitario: number
          empresa_id: string
        }
        Insert: {
          id?: string
          venda_id: string
          produto_id: string
          quantidade: number
          valor_unitario: number
          empresa_id: string
        }
        Update: {
          id?: string
          venda_id?: string
          produto_id?: string
          quantidade?: number
          valor_unitario?: number
          empresa_id?: string
        }
      }
      caixas: {
        Row: {
          id: string
          created_at: string
          usuario_id: string
          valor_inicial: number
          valor_final: number | null
          status: 'aberto' | 'fechado'
          empresa_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          usuario_id: string
          valor_inicial: number
          valor_final?: number | null
          status?: 'aberto' | 'fechado'
          empresa_id: string
        }
        Update: {
          id?: string
          created_at?: string
          usuario_id?: string
          valor_inicial?: number
          valor_final?: number | null
          status?: 'aberto' | 'fechado'
          empresa_id?: string
        }
      }
    }
  }
} 