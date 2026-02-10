import { z } from 'zod'

/** Limites de ano para campos de data (evitar anos inválidos como 325252). Usar em inputs type="date" (min/max) e na validação. */
export const DATE_MIN = '1900-01-01'
export const DATE_MAX = '2099-12-31'

function isValidDateYear(s: string): boolean {
  if (!s || s.length < 4) return true
  const y = parseInt(s.slice(0, 4), 10)
  return !Number.isNaN(y) && y >= 1900 && y <= 2099
}

const dateSchemaRaw = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (YYYY-MM-DD)')
const dateSchemaRefined = dateSchemaRaw.refine(isValidDateYear, 'Ano deve estar entre 1900 e 2099')
const dateSchema = dateSchemaRefined.optional().or(z.literal(''))

// Schema para criação de serviço mestre
export const servicoCreateSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(255, 'Nome muito longo'),
  descricao: z.string().max(1000, 'Descrição muito longa').optional().or(z.literal('')),
  valor: z.number().min(0, 'Valor deve ser positivo').optional().nullable(),
  ativo: z.boolean().default(true),
})

// Schema para atualização de serviço mestre
export const servicoUpdateSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(255, 'Nome muito longo').optional(),
  descricao: z.string().max(1000, 'Descrição muito longa').optional().or(z.literal('')).nullable(),
  valor: z.number().min(0, 'Valor deve ser positivo').optional().nullable(),
  ativo: z.boolean().optional(),
})

// Schema para criação de plano
const recorrenciaMesesSchema = z.number().int('Recorrência deve ser um número inteiro').min(1, 'Mínimo 1 mês').max(99, 'Máximo 99 meses')

export const planoCreateSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(255, 'Nome muito longo'),
  descricao: z.string().max(1000, 'Descrição muito longa').optional().or(z.literal('')),
  valor: z.number().min(0, 'Valor deve ser positivo'),
  moeda: z.string().length(3, 'Moeda deve ter 3 caracteres').default('BRL'),
  ativo: z.boolean().default(true),
  recorrencia_meses: recorrenciaMesesSchema.default(12),
})

// Schema para atualização de plano
export const planoUpdateSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(255, 'Nome muito longo').optional(),
  descricao: z.string().max(1000, 'Descrição muito longa').optional().or(z.literal('')).nullable(),
  valor: z.number().min(0, 'Valor deve ser positivo').optional(),
  moeda: z.string().length(3, 'Moeda deve ter 3 caracteres').optional(),
  ativo: z.boolean().optional(),
  recorrencia_meses: recorrenciaMesesSchema.optional(),
})

// Schema para relação plano-serviço (N:N)
export const planoServicoCreateSchema = z.object({
  plano_id: z.string().uuid('ID do plano inválido'),
  servico_id: z.string().uuid('ID do serviço inválido'),
  ordem: z.number().int().min(0).default(0),
})

const dateSchemaNullable = dateSchemaRefined.optional().or(z.literal('')).nullable()

// Schema para entidade Contrato do cliente (agrupa planos/serviços)
export const clienteContratoCreateSchema = z.object({
  cliente_id: z.string().uuid('ID do cliente inválido'),
  nome: z.string().max(255, 'Nome muito longo').optional().or(z.literal('')),
  status: z.enum(['ativo', 'pausado', 'cancelado', 'finalizado']).default('ativo'),
  contrato_assinado: z.enum(['assinado', 'nao_assinado', 'cancelado']).default('nao_assinado'),
  data_inicio: dateSchema,
  data_fim: dateSchema,
  data_assinatura: dateSchema,
  data_cancelamento: dateSchema,
  observacoes: z.string().max(2000, 'Observações muito longas').optional().or(z.literal('')),
})
export const clienteContratoUpdateSchema = z.object({
  nome: z.string().max(255, 'Nome muito longo').optional().or(z.literal('')).nullable(),
  status: z.enum(['ativo', 'pausado', 'cancelado', 'finalizado']).optional(),
  contrato_assinado: z.enum(['assinado', 'nao_assinado', 'cancelado']).optional(),
  data_inicio: dateSchemaNullable,
  data_fim: dateSchemaNullable,
  data_assinatura: dateSchemaNullable,
  data_cancelamento: dateSchemaNullable,
  observacoes: z.string().max(2000, 'Observações muito longas').optional().or(z.literal('')).nullable(),
})

// Schema para contrato de cliente com plano
export const clientePlanoCreateSchema = z.object({
  cliente_id: z.string().uuid('ID do cliente inválido'),
  plano_id: z.string().uuid('ID do plano inválido'),
  contrato_id: z.string().uuid('ID do contrato inválido').optional().nullable(),
  valor: z.number().min(0, 'Valor deve ser positivo'),
  moeda: z.string().length(3, 'Moeda deve ter 3 caracteres').default('BRL'),
  status: z.enum(['ativo', 'pausado', 'cancelado', 'finalizado']).default('ativo'),
  contrato_assinado: z.enum(['assinado', 'nao_assinado', 'cancelado']).default('nao_assinado'),
  data_inicio: dateSchemaRefined,
  data_fim: dateSchema,
  data_assinatura: dateSchema,
  data_cancelamento: dateSchema,
  observacoes: z.string().max(2000, 'Observações muito longas').optional().or(z.literal('')),
})

// Schema para atualização de contrato de cliente com plano
export const clientePlanoUpdateSchema = z.object({
  contrato_id: z.string().uuid('ID do contrato inválido').optional().nullable(),
  valor: z.number().min(0, 'Valor deve ser positivo').optional(),
  moeda: z.string().length(3, 'Moeda deve ter 3 caracteres').optional(),
  status: z.enum(['ativo', 'pausado', 'cancelado', 'finalizado']).optional(),
  contrato_assinado: z.enum(['assinado', 'nao_assinado', 'cancelado']).optional(),
  data_inicio: dateSchemaRefined.optional(),
  data_fim: dateSchemaNullable,
  data_assinatura: dateSchemaNullable,
  data_cancelamento: dateSchemaNullable,
  observacoes: z.string().max(2000, 'Observações muito longas').optional().or(z.literal('')).nullable(),
})

// Schema para contrato de cliente com serviço avulso
export const clienteServicoCreateSchema = z.object({
  cliente_id: z.string().uuid('ID do cliente inválido'),
  servico_id: z.string().uuid('ID do serviço inválido'),
  contrato_id: z.string().uuid('ID do contrato inválido').optional().nullable(),
  valor: z.number().min(0, 'Valor deve ser positivo'),
  moeda: z.string().length(3, 'Moeda deve ter 3 caracteres').default('BRL'),
  status: z.enum(['ativo', 'pausado', 'cancelado', 'finalizado']).default('ativo'),
  contrato_assinado: z.enum(['assinado', 'nao_assinado', 'cancelado']).default('nao_assinado'),
  data_inicio: dateSchemaRefined,
  data_fim: dateSchema,
  data_assinatura: dateSchema,
  data_cancelamento: dateSchema,
  observacoes: z.string().max(2000, 'Observações muito longas').optional().or(z.literal('')),
})

// Schema para atualização de contrato de cliente com serviço avulso
export const clienteServicoUpdateSchema = z.object({
  contrato_id: z.string().uuid('ID do contrato inválido').optional().nullable(),
  valor: z.number().min(0, 'Valor deve ser positivo').optional(),
  moeda: z.string().length(3, 'Moeda deve ter 3 caracteres').optional(),
  status: z.enum(['ativo', 'pausado', 'cancelado', 'finalizado']).optional(),
  contrato_assinado: z.enum(['assinado', 'nao_assinado', 'cancelado']).optional(),
  data_inicio: dateSchemaRefined.optional(),
  data_fim: dateSchemaNullable,
  data_assinatura: dateSchemaNullable,
  data_cancelamento: dateSchemaNullable,
  observacoes: z.string().max(2000, 'Observações muito longas').optional().or(z.literal('')).nullable(),
})

// Tipos TypeScript inferidos dos schemas
export type ServicoCreateInput = z.infer<typeof servicoCreateSchema>
export type ServicoUpdateInput = z.infer<typeof servicoUpdateSchema>
export type PlanoCreateInput = z.infer<typeof planoCreateSchema>
export type PlanoUpdateInput = z.infer<typeof planoUpdateSchema>
export type PlanoServicoCreateInput = z.infer<typeof planoServicoCreateSchema>
export type ClienteContratoCreateInput = z.infer<typeof clienteContratoCreateSchema>
export type ClienteContratoUpdateInput = z.infer<typeof clienteContratoUpdateSchema>
export type ClientePlanoCreateInput = z.infer<typeof clientePlanoCreateSchema>
export type ClientePlanoUpdateInput = z.infer<typeof clientePlanoUpdateSchema>
export type ClienteServicoCreateInput = z.infer<typeof clienteServicoCreateSchema>
export type ClienteServicoUpdateInput = z.infer<typeof clienteServicoUpdateSchema>
