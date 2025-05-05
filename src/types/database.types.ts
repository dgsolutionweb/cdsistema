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
      caixas: {
        Row: {
          created_at: string | null
          data_abertura: string | null
          data_fechamento: string | null
          empresa_id: string
          id: string
          status: string
          usuario_id: string
          valor_final: number | null
          valor_inicial: number
        }
        Insert: {
          created_at?: string | null
          data_abertura?: string | null
          data_fechamento?: string | null
          empresa_id: string
          id?: string
          status?: string
          usuario_id: string
          valor_final?: number | null
          valor_inicial: number
        }
        Update: {
          created_at?: string | null
          data_abertura?: string | null
          data_fechamento?: string | null
          empresa_id?: string
          id?: string
          status?: string
          usuario_id?: string
          valor_final?: number | null
          valor_inicial?: number
        }
        Relationships: [
          {
            foreignKeyName: "caixas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caixas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          cpf: string
          created_at: string | null
          email: string | null
          empresa_id: string
          id: string
          nome: string
          telefone: string | null
        }
        Insert: {
          cpf: string
          created_at?: string | null
          email?: string | null
          empresa_id: string
          id?: string
          nome: string
          telefone?: string | null
        }
        Update: {
          cpf?: string
          created_at?: string | null
          email?: string | null
          empresa_id?: string
          id?: string
          nome?: string
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          cnpj: string
          created_at: string | null
          endereco: string | null
          id: string
          nome: string
          status: string
          telefone: string | null
        }
        Insert: {
          cnpj: string
          created_at?: string | null
          endereco?: string | null
          id?: string
          nome: string
          status?: string
          telefone?: string | null
        }
        Update: {
          cnpj?: string
          created_at?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          status?: string
          telefone?: string | null
        }
        Relationships: []
      }
      movimentos_caixa: {
        Row: {
          caixa_id: string
          created_at: string | null
          descricao: string
          empresa_id: string
          forma_pagamento: string
          id: string
          tipo: string
          usuario_id: string
          valor: number
          venda_id: string | null
        }
        Insert: {
          caixa_id: string
          created_at?: string | null
          descricao: string
          empresa_id: string
          forma_pagamento: string
          id?: string
          tipo: string
          usuario_id: string
          valor: number
          venda_id?: string | null
        }
        Update: {
          caixa_id?: string
          created_at?: string | null
          descricao?: string
          empresa_id?: string
          forma_pagamento?: string
          id?: string
          tipo?: string
          usuario_id?: string
          valor?: number
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimentos_caixa_caixa_id_fkey"
            columns: ["caixa_id"]
            isOneToOne: false
            referencedRelation: "caixas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentos_caixa_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentos_caixa_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentos_caixa_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          categoria: string
          codigo: string
          created_at: string | null
          empresa_id: string
          estoque: number
          estoque_minimo: number
          id: string
          nome: string
          valor: number
        }
        Insert: {
          categoria: string
          codigo: string
          created_at?: string | null
          empresa_id: string
          estoque?: number
          estoque_minimo?: number
          id?: string
          nome: string
          valor: number
        }
        Update: {
          categoria?: string
          codigo?: string
          created_at?: string | null
          empresa_id?: string
          estoque?: number
          estoque_minimo?: number
          id?: string
          nome?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "produtos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          empresa_id: string | null
          id: string
          nome: string
          role: string
          status: string
          tipo: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          empresa_id?: string | null
          id: string
          nome: string
          role?: string
          status?: string
          tipo?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          empresa_id?: string | null
          id?: string
          nome?: string
          role?: string
          status?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          desconto: number
          empresa_id: string
          forma_pagamento: string
          id: string
          numero_venda: number
          status: string
          usuario_id: string
          valor_final: number | null
          valor_total: number
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          desconto?: number
          empresa_id: string
          forma_pagamento: string
          id?: string
          numero_venda?: number
          status?: string
          usuario_id: string
          valor_final?: number | null
          valor_total: number
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          desconto?: number
          empresa_id?: string
          forma_pagamento?: string
          id?: string
          numero_venda?: number
          status?: string
          usuario_id?: string
          valor_final?: number | null
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "vendas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas_itens: {
        Row: {
          empresa_id: string
          id: string
          produto_id: string
          quantidade: number
          subtotal: number | null
          valor_unitario: number
          venda_id: string
        }
        Insert: {
          empresa_id: string
          id?: string
          produto_id: string
          quantidade: number
          subtotal?: number | null
          valor_unitario: number
          venda_id: string
        }
        Update: {
          empresa_id?: string
          id?: string
          produto_id?: string
          quantidade?: number
          subtotal?: number | null
          valor_unitario?: number
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendas_itens_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_itens_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      vw_clientes_destaque: {
        Row: {
          empresa_id: string | null
          id: string | null
          nome: string | null
          total_compras: number | null
          ultima_compra: string | null
          valor_total: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_evolucao_vendas_diarias: {
        Row: {
          data: string | null
          empresa_id: string | null
          total_vendas: number | null
          valor_total: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_produtos_estoque_baixo: {
        Row: {
          codigo: string | null
          diferenca: number | null
          empresa_id: string | null
          estoque: number | null
          estoque_minimo: number | null
          id: string | null
          nome: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_produtos_mais_vendidos: {
        Row: {
          codigo: string | null
          data_venda: string | null
          empresa_id: string | null
          id: string | null
          nome: string | null
          quantidade_total: number | null
          valor_total: number | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_resumo_vendas_periodo: {
        Row: {
          data: string | null
          empresa_id: string | null
          ticket_medio: number | null
          total_vendas: number | null
          valor_total: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_vendas_dashboard: {
        Row: {
          cliente_nome: string | null
          created_at: string | null
          empresa_id: string | null
          forma_pagamento: string | null
          id: string | null
          numero_venda: number | null
          status: string | null
          usuario_nome: string | null
          valor_final: number | null
          valor_total: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_vendas_por_pagamento: {
        Row: {
          empresa_id: string | null
          forma_pagamento: string | null
          mes: string | null
          total_vendas: number | null
          valor_total: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      abrir_caixa: {
        Args: {
          p_usuario_id: string
          p_valor_inicial: number
          p_empresa_id: string
        }
        Returns: string
      }
      fechar_caixa: {
        Args: {
          p_caixa_id: string
          p_valor_final: number
          p_usuario_id: string
        }
        Returns: boolean
      }
      registrar_venda: {
        Args: {
          p_cliente_id: string
          p_valor_total: number
          p_desconto: number
          p_forma_pagamento: string
          p_usuario_id: string
          p_empresa_id: string
          p_itens: Json
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 