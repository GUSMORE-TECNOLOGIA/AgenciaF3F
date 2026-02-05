// Módulos do sistema (chave para permissões)
export type ModuloSistema =
  | 'dashboard'
  | 'clientes'
  | 'servicos'
  | 'planos'
  | 'financeiro'
  | 'ocorrencias'
  | 'atendimento'
  | 'equipe'

// Perfil de acesso (cadastrável pelo admin)
export interface Perfil {
  id: string
  nome: string
  descricao?: string
  slug?: string
  created_at: string
  updated_at: string
}

// Permissão por módulo (por perfil)
export interface PerfilPermissao {
  perfil_id: string
  modulo: ModuloSistema
  pode_visualizar: boolean
  pode_editar: boolean
  pode_excluir: boolean
  created_at?: string
  updated_at?: string
}

// Tipos de usuário
export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  perfil: 'admin' | 'gerente' | 'agente' | 'suporte'
  perfil_id?: string | null
  must_reset_password: boolean
  password_reset_at?: string
  created_at: string
  updated_at: string
}

// Tipos de cliente
export interface Cliente {
  id: string
  nome: string
  email?: string
  telefone?: string
  responsavel_id: string | null
  status: 'ativo' | 'inativo' | 'pausado'
  logo_url?: string
  created_at: string
  updated_at: string
  links_uteis?: LinksUteis // Legado - mantido para compatibilidade
  drive_url?: string // DEPRECATED: Use cliente_links com tipo "Google Drive" ao invés
  links?: ClienteLink[] // Novo campo para links dinâmicos
  /** Dados do responsável (enriquecido via join). */
  responsavel?: { id: string; name: string }
}

// Links úteis do cliente (legado - mantido para compatibilidade)
export interface LinksUteis {
  conta_anuncio_f3f?: string
  conta_anuncio_lt?: string
  instagram?: string
  business_suite?: string
  dashboard?: string
  planilha_dados?: string
  utmify?: string
  wordpress?: string
  pagina_vendas_lt?: string
  checkout?: string
}

// Link dinâmico do cliente (nova estrutura)
export interface ClienteLink {
  id: string
  cliente_id: string
  url: string
  tipo: string // Classificação: Instagram, Facebook, Dashboard, etc.
  pessoa?: string // Pessoa responsável pelo link (opcional)
  status: 'ativo' | 'inativo'
  created_at: string
  updated_at: string
  deleted_at?: string
}

// ============================================================================
// TIPOS DE SERVIÇOS E PLANOS
// ============================================================================

// Serviço mestre (cadastro de serviços disponíveis)
export interface Servico {
  id: string
  nome: string
  descricao?: string
  valor?: number // Valor individual do serviço (opcional)
  ativo: boolean
  created_at: string
  updated_at: string
  deleted_at?: string
}

// Plano (cadastro de planos - pacotes de serviços)
export interface Plano {
  id: string
  nome: string
  descricao?: string
  valor: number // Valor fixo do plano
  moeda: string // Default: 'BRL'
  ativo: boolean
  created_at: string
  updated_at: string
  deleted_at?: string
  // Serviços vinculados (enriquecido)
  servicos?: Servico[]
}

// Relação N:N entre plano e serviços
export interface PlanoServico {
  id: string
  plano_id: string
  servico_id: string
  ordem?: number
  created_at: string
  // Dados enriquecidos
  plano?: Plano
  servico?: Servico
}

// Contrato de cliente com plano
export interface ClientePlano {
  id: string
  cliente_id: string
  plano_id: string
  valor: number // Valor do contrato (pode ser diferente do plano)
  moeda: string // Default: 'BRL'
  status: 'ativo' | 'pausado' | 'cancelado' | 'finalizado'
  data_inicio?: string // DATE - Data de início do contrato
  data_fim?: string // DATE - Data de fim do contrato (opcional)
  observacoes?: string
  created_at: string
  updated_at: string
  deleted_at?: string
  // Dados enriquecidos
  cliente?: Cliente
  plano?: Plano
}

// Contrato de cliente com serviço avulso
export interface ClienteServico {
  id: string
  cliente_id: string
  servico_id: string
  valor: number // Valor do contrato (pode ser diferente do serviço)
  moeda: string // Default: 'BRL'
  status: 'ativo' | 'pausado' | 'cancelado' | 'finalizado'
  data_inicio?: string // DATE - Data de início do contrato
  data_fim?: string // DATE - Data de fim do contrato (opcional)
  observacoes?: string
  created_at: string
  updated_at: string
  deleted_at?: string
  // Dados enriquecidos
  cliente?: Cliente
  servico?: Servico
}

// Tipos financeiros (baseado em Organizacao10x)
export interface Transacao {
  id: string
  cliente_id: string
  servico_id?: string
  tipo: 'receita' | 'despesa'
  categoria: string // Ex: mensalidade, avulso, reembolso, etc
  valor: number
  moeda: string // Default: 'BRL'
  descricao: string
  metodo_pagamento?: string // Ex: pix, cartao, dinheiro, boleto, transferencia
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado' | 'reembolsado'
  data_vencimento: string // DATE
  data_pagamento?: string // TIMESTAMPTZ
  external_transaction_id?: string
  external_source?: string // Ex: eduzz, hotmart, stripe, etc
  metadata?: Record<string, any> // JSONB
  created_at: string
  updated_at: string
  deleted_at?: string
}

// Tipos de ocorrência (baseado em Organizacao10x)
export interface OcorrenciaGrupo {
  id: string
  nome: string
  descricao?: string
  is_active: boolean
  responsavel_id: string
  created_at: string
  updated_at: string
}

export interface OcorrenciaTipo {
  id: string
  grupo_id: string
  nome: string
  descricao?: string
  is_active: boolean
  responsavel_id: string
  created_at: string
  updated_at: string
}

export interface Ocorrencia {
  id: string
  cliente_id: string
  grupo_id: string
  tipo_id: string
  ocorreu_em: string // DATE
  notas: string
  responsavel_id: string
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente'
  is_sensitive: boolean
  status: 'aberta' | 'em_andamento' | 'resolvida' | 'cancelada'
  reminder_at?: string | null
  reminder_status?: 'pendente' | 'feito' | 'cancelado' | null
  created_at: string
  created_by?: string
  updated_at: string
  updated_by?: string
  deleted_at?: string
}

// Tipos de atendimento
export interface Atendimento {
  id: string
  cliente_id: string
  usuario_id: string
  tipo: 'email' | 'whatsapp' | 'telefone' | 'presencial'
  assunto: string
  descricao: string
  data_atendimento: string
  duracao_minutos?: number
  created_at: string
  updated_at: string
}

// Tipos de equipe (baseado em collaborators do Organizacao10x)
export interface EquipeMembro {
  id: string
  nome_completo: string
  email?: string
  telefone?: string
  perfil: 'admin' | 'gerente' | 'agente' | 'suporte'
  perfil_id?: string | null
  status: 'ativo' | 'inativo'
  user_id?: string
  responsavel_id: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

// Tipos de responsáveis de clientes (baseado em student_responsibles do Organizacao10x)
export interface ClienteResponsavel {
  id: string
  cliente_id: string
  responsavel_id: string
  roles: ('principal' | 'comercial' | 'suporte' | 'backup')[]
  observacao?: string
  created_at: string
  updated_at: string
  deleted_at?: string
  // Dados do responsável (enriquecido)
  responsavel?: {
    id: string
    name: string
    email: string
  }
}
