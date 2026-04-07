export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      atendimentos: {
        Row: {
          assunto: string
          cliente_id: string
          created_at: string
          data_atendimento: string
          deleted_at: string | null
          descricao: string
          duracao_minutos: number | null
          id: string
          tipo: string
          updated_at: string
          usuario_id: string
        }
        Insert: {
          assunto: string
          cliente_id: string
          created_at?: string
          data_atendimento: string
          deleted_at?: string | null
          descricao: string
          duracao_minutos?: number | null
          id?: string
          tipo: string
          updated_at?: string
          usuario_id: string
        }
        Update: {
          assunto?: string
          cliente_id?: string
          created_at?: string
          data_atendimento?: string
          deleted_at?: string | null
          descricao?: string
          duracao_minutos?: number | null
          id?: string
          tipo?: string
          updated_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "atendimentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendimentos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_contratos: {
        Row: {
          cliente_id: string
          contrato_assinado: string
          created_at: string
          data_assinatura: string | null
          data_cancelamento: string | null
          data_fim: string | null
          data_inicio: string | null
          deleted_at: string | null
          id: string
          nome: string | null
          observacoes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          cliente_id: string
          contrato_assinado?: string
          created_at?: string
          data_assinatura?: string | null
          data_cancelamento?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          deleted_at?: string | null
          id?: string
          nome?: string | null
          observacoes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          contrato_assinado?: string
          created_at?: string
          data_assinatura?: string | null
          data_cancelamento?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          deleted_at?: string | null
          id?: string
          nome?: string | null
          observacoes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_contratos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_links: {
        Row: {
          cliente_id: string
          created_at: string
          deleted_at: string | null
          id: string
          pessoa: string | null
          status: string
          tipo: string
          updated_at: string
          url: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          pessoa?: string | null
          status?: string
          tipo: string
          updated_at?: string
          url: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          pessoa?: string | null
          status?: string
          tipo?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_links_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_planos: {
        Row: {
          cliente_id: string
          contrato_assinado: string
          contrato_id: string | null
          created_at: string
          data_assinatura: string | null
          data_cancelamento: string | null
          data_fim: string | null
          data_inicio: string | null
          deleted_at: string | null
          id: string
          moeda: string
          observacoes: string | null
          plano_id: string
          status: string
          updated_at: string
          valor: number
        }
        Insert: {
          cliente_id: string
          contrato_assinado?: string
          contrato_id?: string | null
          created_at?: string
          data_assinatura?: string | null
          data_cancelamento?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          deleted_at?: string | null
          id?: string
          moeda?: string
          observacoes?: string | null
          plano_id: string
          status?: string
          updated_at?: string
          valor: number
        }
        Update: {
          cliente_id?: string
          contrato_assinado?: string
          contrato_id?: string | null
          created_at?: string
          data_assinatura?: string | null
          data_cancelamento?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          deleted_at?: string | null
          id?: string
          moeda?: string
          observacoes?: string | null
          plano_id?: string
          status?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "cliente_planos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_planos_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "cliente_contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_planos_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_responsaveis: {
        Row: {
          cliente_id: string
          created_at: string
          deleted_at: string | null
          id: string
          observacao: string | null
          responsavel_id: string
          roles: string[]
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          observacao?: string | null
          responsavel_id: string
          roles?: string[]
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          observacao?: string | null
          responsavel_id?: string
          roles?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_responsaveis_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_responsaveis_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_servicos: {
        Row: {
          cliente_id: string
          contrato_assinado: string
          contrato_id: string | null
          created_at: string
          data_assinatura: string | null
          data_cancelamento: string | null
          data_fim: string | null
          data_inicio: string | null
          deleted_at: string | null
          id: string
          moeda: string
          observacoes: string | null
          servico_id: string
          status: string
          updated_at: string
          valor: number
        }
        Insert: {
          cliente_id: string
          contrato_assinado?: string
          contrato_id?: string | null
          created_at?: string
          data_assinatura?: string | null
          data_cancelamento?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          deleted_at?: string | null
          id?: string
          moeda?: string
          observacoes?: string | null
          servico_id: string
          status?: string
          updated_at?: string
          valor: number
        }
        Update: {
          cliente_id?: string
          contrato_assinado?: string
          contrato_id?: string | null
          created_at?: string
          data_assinatura?: string | null
          data_cancelamento?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          deleted_at?: string | null
          id?: string
          moeda?: string
          observacoes?: string | null
          servico_id?: string
          status?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "cliente_servicos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_servicos_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "cliente_contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_servicos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          created_at: string
          deleted_at: string | null
          drive_url: string | null
          email: string | null
          id: string
          links_uteis: Json | null
          logo_url: string | null
          nome: string
          responsavel_id: string | null
          status: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          drive_url?: string | null
          email?: string | null
          id?: string
          links_uteis?: Json | null
          logo_url?: string | null
          nome: string
          responsavel_id?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          drive_url?: string | null
          email?: string | null
          id?: string
          links_uteis?: Json | null
          logo_url?: string | null
          nome?: string
          responsavel_id?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      contrato_status_historico: {
        Row: {
          contrato_id: string
          created_at: string
          id: string
          metadata: Json | null
          observacoes: string | null
          status_anterior: string | null
          status_novo: string
          tipo_contrato: string
          usuario_id: string | null
        }
        Insert: {
          contrato_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          observacoes?: string | null
          status_anterior?: string | null
          status_novo: string
          tipo_contrato: string
          usuario_id?: string | null
        }
        Update: {
          contrato_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          observacoes?: string | null
          status_anterior?: string | null
          status_novo?: string
          tipo_contrato?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contrato_status_historico_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      equipe_membros: {
        Row: {
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          nome_completo: string
          perfil: string
          responsavel_id: string
          status: string
          telefone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          nome_completo: string
          perfil?: string
          responsavel_id: string
          status?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          nome_completo?: string
          perfil?: string
          responsavel_id?: string
          status?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipe_membros_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          created_at: string
          greeting: string
          id: string
          name: string
          ready_message: string
          user_id: string
        }
        Insert: {
          created_at?: string
          greeting?: string
          id?: string
          name: string
          ready_message?: string
          user_id: string
        }
        Update: {
          created_at?: string
          greeting?: string
          id?: string
          name?: string
          ready_message?: string
          user_id?: string
        }
        Relationships: []
      }
      meta_connections: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ocorrencia_grupos: {
        Row: {
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          is_active: boolean | null
          nome: string
          responsavel_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          is_active?: boolean | null
          nome: string
          responsavel_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          is_active?: boolean | null
          nome?: string
          responsavel_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ocorrencia_grupos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ocorrencia_grupos_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ocorrencia_grupos_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      ocorrencia_tipos: {
        Row: {
          created_at: string
          created_by: string | null
          descricao: string | null
          grupo_id: string
          id: string
          is_active: boolean | null
          nome: string
          responsavel_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          grupo_id: string
          id?: string
          is_active?: boolean | null
          nome: string
          responsavel_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          grupo_id?: string
          id?: string
          is_active?: boolean | null
          nome?: string
          responsavel_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ocorrencia_tipos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ocorrencia_tipos_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "ocorrencia_grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ocorrencia_tipos_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ocorrencia_tipos_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      ocorrencias: {
        Row: {
          cliente_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          grupo_id: string
          id: string
          is_sensitive: boolean | null
          notas: string
          ocorreu_em: string
          prioridade: string
          reminder_at: string | null
          reminder_status: string | null
          responsavel_id: string
          status: string
          tipo_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          cliente_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          grupo_id: string
          id?: string
          is_sensitive?: boolean | null
          notas: string
          ocorreu_em: string
          prioridade?: string
          reminder_at?: string | null
          reminder_status?: string | null
          responsavel_id: string
          status?: string
          tipo_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          cliente_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          grupo_id?: string
          id?: string
          is_sensitive?: boolean | null
          notas?: string
          ocorreu_em?: string
          prioridade?: string
          reminder_at?: string | null
          reminder_status?: string | null
          responsavel_id?: string
          status?: string
          tipo_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ocorrencias_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ocorrencias_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ocorrencias_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "ocorrencia_grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ocorrencias_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ocorrencias_tipo_id_fkey"
            columns: ["tipo_id"]
            isOneToOne: false
            referencedRelation: "ocorrencia_tipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ocorrencias_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      perfil_permissoes: {
        Row: {
          created_at: string
          modulo: string
          perfil_id: string
          pode_editar: boolean
          pode_excluir: boolean
          pode_visualizar: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          modulo: string
          perfil_id: string
          pode_editar?: boolean
          pode_excluir?: boolean
          pode_visualizar?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          modulo?: string
          perfil_id?: string
          pode_editar?: boolean
          pode_excluir?: boolean
          pode_visualizar?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfil_permissoes_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis: {
        Row: {
          created_at: string
          descricao: string | null
          escopo_visibilidade: string
          id: string
          nome: string
          slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          escopo_visibilidade?: string
          id?: string
          nome: string
          slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          escopo_visibilidade?: string
          id?: string
          nome?: string
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      plano_servicos: {
        Row: {
          created_at: string
          id: string
          ordem: number | null
          plano_id: string
          servico_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ordem?: number | null
          plano_id: string
          servico_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ordem?: number | null
          plano_id?: string
          servico_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plano_servicos_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plano_servicos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      planos: {
        Row: {
          ativo: boolean
          created_at: string
          deleted_at: string | null
          descricao: string | null
          id: string
          moeda: string
          nome: string
          recorrencia_meses: number
          updated_at: string
          valor: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          deleted_at?: string | null
          descricao?: string | null
          id?: string
          moeda?: string
          nome: string
          recorrencia_meses?: number
          updated_at?: string
          valor: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          deleted_at?: string | null
          descricao?: string | null
          id?: string
          moeda?: string
          nome?: string
          recorrencia_meses?: number
          updated_at?: string
          valor?: number
        }
        Relationships: []
      }
      publish_jobs: {
        Row: {
          created_at: string
          id: string
          request_json: Json
          response_json: Json | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          request_json?: Json
          response_json?: Json | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          request_json?: Json
          response_json?: Json | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      servicos: {
        Row: {
          ativo: boolean
          created_at: string
          deleted_at: string | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string
          valor: number | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          deleted_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
          valor?: number | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          deleted_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
          valor?: number | null
        }
        Relationships: []
      }
      servicos_prestados: {
        Row: {
          cliente_id: string
          created_at: string
          data_fim: string | null
          data_inicio: string
          deleted_at: string | null
          descricao: string | null
          id: string
          nome: string
          status: string
          tipo: string
          updated_at: string
          valor: number | null
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data_fim?: string | null
          data_inicio: string
          deleted_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          status?: string
          tipo: string
          updated_at?: string
          valor?: number | null
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          deleted_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          status?: string
          tipo?: string
          updated_at?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "servicos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      transacoes: {
        Row: {
          categoria: string
          cliente_id: string
          created_at: string
          data_pagamento: string | null
          data_vencimento: string
          deleted_at: string | null
          descricao: string
          external_source: string | null
          external_transaction_id: string | null
          id: string
          metadata: Json | null
          metodo_pagamento: string | null
          moeda: string
          servico_id: string | null
          status: string
          tipo: string
          updated_at: string
          valor: number
        }
        Insert: {
          categoria: string
          cliente_id: string
          created_at?: string
          data_pagamento?: string | null
          data_vencimento: string
          deleted_at?: string | null
          descricao: string
          external_source?: string | null
          external_transaction_id?: string | null
          id?: string
          metadata?: Json | null
          metodo_pagamento?: string | null
          moeda?: string
          servico_id?: string | null
          status?: string
          tipo: string
          updated_at?: string
          valor: number
        }
        Update: {
          categoria?: string
          cliente_id?: string
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string
          deleted_at?: string | null
          descricao?: string
          external_source?: string | null
          external_transaction_id?: string | null
          id?: string
          metadata?: Json | null
          metodo_pagamento?: string | null
          moeda?: string
          servico_id?: string | null
          status?: string
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos_prestados"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          created_at: string
          email: string
          id: string
          must_reset_password: boolean
          name: string
          nome_completo: string | null
          password_reset_at: string | null
          perfil: string
          perfil_id: string | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          must_reset_password?: boolean
          name: string
          nome_completo?: string | null
          password_reset_at?: string | null
          perfil?: string
          perfil_id?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          must_reset_password?: boolean
          name?: string
          nome_completo?: string | null
          password_reset_at?: string | null
          perfil?: string
          perfil_id?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _test_uid_inside_secdef: { Args: never; Returns: string }
      get_debug_visibilidade_clientes: { Args: never; Returns: Json }
      get_escopo_visibilidade_usuario: { Args: never; Returns: string }
      get_financeiro_fontes_cliente: {
        Args: { p_cliente_id: string }
        Returns: {
          cliente_plano_id: string
          contrato_id: string
          contrato_nome: string
          plano_id: string
          plano_nome: string
          plano_valor: number
        }[]
      }
      get_principais_para_lista: {
        Args: never
        Returns: {
          cliente_id: string
          responsavel_id: string
          responsavel_name: string
        }[]
      }
      get_responsaveis_para_dashboard: {
        Args: never
        Returns: {
          id: string
          name: string
        }[]
      }
      get_responsavel_name: { Args: { p_id: string }; Returns: string }
      get_usuario_id_by_email: { Args: { p_email: string }; Returns: string }
      get_usuarios_para_selecao_responsavel: {
        Args: never
        Returns: {
          email: string
          id: string
          nome_completo: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_responsavel_ativo: {
        Args: { p_cliente_id: string; p_user_id: string }
        Returns: boolean
      }
      is_responsavel_do_cliente: {
        Args: { p_cliente_id: string }
        Returns: boolean
      }
      list_clientes_filtrados: {
        Args: { p_conditions: Json; p_limit?: number; p_offset?: number }
        Returns: {
          created_at: string
          drive_url: string
          email: string
          id: string
          links_uteis: Json
          logo_url: string
          nome: string
          responsavel_id: string
          status: string
          telefone: string
          total_count: number
          updated_at: string
        }[]
      }
      pode_visualizar_cliente: {
        Args: { p_cliente_id: string }
        Returns: boolean
      }
      soft_delete_atendimento: {
        Args: { atendimento_id: string }
        Returns: undefined
      }
      soft_delete_cliente: { Args: { cliente_id: string }; Returns: undefined }
      soft_delete_cliente_contrato: {
        Args: { cascata?: boolean; contrato_id: string }
        Returns: undefined
      }
      soft_delete_cliente_link: {
        Args: { link_id: string }
        Returns: undefined
      }
      soft_delete_cliente_plano:
        | { Args: { contrato_id: string }; Returns: undefined }
        | {
            Args: { cancelar_lancamentos?: boolean; contrato_id: string }
            Returns: undefined
          }
      soft_delete_cliente_servico:
        | { Args: { contrato_id: string }; Returns: undefined }
        | {
            Args: { cancelar_lancamentos?: boolean; contrato_id: string }
            Returns: undefined
          }
      soft_delete_equipe_membro: {
        Args: { membro_id: string }
        Returns: undefined
      }
      soft_delete_ocorrencia: {
        Args: { ocorrencia_id: string }
        Returns: undefined
      }
      soft_delete_ocorrencia_grupo: {
        Args: { grupo_id: string }
        Returns: undefined
      }
      soft_delete_ocorrencia_tipo: {
        Args: { tipo_id: string }
        Returns: undefined
      }
      soft_delete_plano: { Args: { plano_id: string }; Returns: undefined }
      soft_delete_servico: { Args: { servico_id: string }; Returns: undefined }
      soft_delete_transacao: {
        Args: { transacao_id: string }
        Returns: undefined
      }
      user_pode_editar_modulo: { Args: { p_modulo: string }; Returns: boolean }
      user_pode_visualizar_modulo: {
        Args: { p_modulo: string }
        Returns: boolean
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

