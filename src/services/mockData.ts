// Mock data temporário até o Supabase estar configurado
import { Cliente, Servico, Transacao, Ocorrencia, OcorrenciaGrupo, OcorrenciaTipo, Atendimento, EquipeMembro, ClienteResponsavel } from '@/types'

// Mock de clientes
export const mockClientes: Cliente[] = [
  {
    id: '1',
    nome: 'Cliente Exemplo 1',
    email: 'cliente1@exemplo.com',
    telefone: '(11) 99999-9999',
    responsavel_id: 'user-1',
    status: 'ativo',
    links_uteis: {
      conta_anuncio_f3f: 'https://example.com/f3f',
      instagram: 'https://instagram.com/cliente1',
    },
    drive_url: 'https://drive.google.com/example',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// Mock de serviços
export const mockServicos: Servico[] = [
  {
    id: '1',
    cliente_id: '1',
    nome: 'Gestão de Redes Sociais',
    descricao: 'Gestão completa de Instagram e Facebook',
    tipo: 'social_media',
    status: 'ativo',
    valor: 1500.00,
    data_inicio: '2026-01-01',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// Mock de transações
export const mockTransacoes: Transacao[] = [
  {
    id: '1',
    cliente_id: '1',
    servico_id: '1',
    tipo: 'receita',
    categoria: 'mensalidade',
    valor: 1500.00,
    moeda: 'BRL',
    descricao: 'Mensalidade Janeiro 2026',
    metodo_pagamento: 'pix',
    status: 'pago',
    data_vencimento: '2026-01-10',
    data_pagamento: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// Mock de grupos de ocorrências
export const mockOcorrenciaGrupos: OcorrenciaGrupo[] = [
  {
    id: '1',
    nome: 'Suporte Técnico',
    descricao: 'Problemas técnicos e bugs',
    is_active: true,
    responsavel_id: 'user-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    nome: 'Melhorias',
    descricao: 'Sugestões de melhorias',
    is_active: true,
    responsavel_id: 'user-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// Mock de tipos de ocorrências
export const mockOcorrenciaTipos: OcorrenciaTipo[] = [
  {
    id: '1',
    grupo_id: '1',
    nome: 'Bug no Sistema',
    descricao: 'Problemas e erros no sistema',
    is_active: true,
    responsavel_id: 'user-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    grupo_id: '1',
    nome: 'Dúvida de Uso',
    descricao: 'Dúvidas sobre como usar o sistema',
    is_active: true,
    responsavel_id: 'user-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// Mock de ocorrências
export const mockOcorrencias: Ocorrencia[] = [
  {
    id: '1',
    cliente_id: '1',
    grupo_id: '1',
    tipo_id: '1',
    ocorreu_em: '2026-01-15',
    notas: 'Cliente relatou problema ao acessar dashboard',
    responsavel_id: 'user-1',
    prioridade: 'alta',
    is_sensitive: false,
    status: 'aberta',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// Mock de atendimentos
export const mockAtendimentos: Atendimento[] = [
  {
    id: '1',
    cliente_id: '1',
    usuario_id: 'user-1',
    tipo: 'whatsapp',
    assunto: 'Dúvida sobre relatório',
    descricao: 'Cliente perguntou sobre como gerar relatório mensal',
    data_atendimento: new Date().toISOString(),
    duracao_minutos: 15,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// Funções helper para simular delay de API
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Simular fetch de clientes
export async function fetchClientes(): Promise<Cliente[]> {
  await delay(500)
  return [...mockClientes]
}

// Simular fetch de serviços
export async function fetchServicos(clienteId?: string): Promise<Servico[]> {
  await delay(500)
  if (clienteId) {
    return mockServicos.filter(s => s.cliente_id === clienteId)
  }
  return [...mockServicos]
}

// Simular fetch de transações
export async function fetchTransacoes(clienteId?: string): Promise<Transacao[]> {
  await delay(500)
  if (clienteId) {
    return mockTransacoes.filter(t => t.cliente_id === clienteId)
  }
  return [...mockTransacoes]
}

// Simular fetch de ocorrências
export async function fetchOcorrencias(clienteId?: string): Promise<Ocorrencia[]> {
  await delay(500)
  if (clienteId) {
    return mockOcorrencias.filter(o => o.cliente_id === clienteId)
  }
  return [...mockOcorrencias]
}

// Simular fetch de grupos de ocorrências
export async function fetchOcorrenciaGrupos(): Promise<OcorrenciaGrupo[]> {
  await delay(300)
  return [...mockOcorrenciaGrupos]
}

// Simular fetch de tipos de ocorrências
export async function fetchOcorrenciaTipos(grupoId?: string): Promise<OcorrenciaTipo[]> {
  await delay(300)
  if (grupoId) {
    return mockOcorrenciaTipos.filter(t => t.grupo_id === grupoId)
  }
  return [...mockOcorrenciaTipos]
}

// Simular fetch de atendimentos
export async function fetchAtendimentos(clienteId?: string): Promise<Atendimento[]> {
  await delay(500)
  if (clienteId) {
    return mockAtendimentos.filter(a => a.cliente_id === clienteId)
  }
  return [...mockAtendimentos]
}

// Mock de membros da equipe
export const mockEquipeMembros: EquipeMembro[] = [
  {
    id: 'membro-1',
    nome_completo: 'João Silva',
    email: 'joao@agenciaf3f.com',
    telefone: '(11) 99999-9999',
    cargo: 'gerente',
    status: 'ativo',
    responsavel_id: 'user-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'membro-2',
    nome_completo: 'Maria Santos',
    email: 'maria@agenciaf3f.com',
    telefone: '(11) 88888-8888',
    cargo: 'agente',
    status: 'ativo',
    responsavel_id: 'user-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// Mock de responsáveis de clientes
export const mockClienteResponsaveis: ClienteResponsavel[] = [
  {
    id: 'resp-1',
    cliente_id: '1',
    responsavel_id: 'membro-1',
    roles: ['principal'],
    observacao: 'Responsável principal do cliente',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    responsavel: {
      id: 'membro-1',
      name: 'João Silva',
      email: 'joao@agenciaf3f.com',
    },
  },
]

// Simular fetch de membros da equipe
export async function fetchEquipeMembros(): Promise<EquipeMembro[]> {
  await delay(300)
  return [...mockEquipeMembros]
}

// Simular fetch de responsáveis de clientes
export async function fetchClienteResponsaveis(clienteId: string): Promise<ClienteResponsavel[]> {
  await delay(300)
  return mockClienteResponsaveis.filter((r) => r.cliente_id === clienteId)
}
