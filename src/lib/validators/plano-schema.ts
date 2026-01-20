import { z } from 'zod'

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
export const planoCreateSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(255, 'Nome muito longo'),
  descricao: z.string().max(1000, 'Descrição muito longa').optional().or(z.literal('')),
  valor: z.number().min(0, 'Valor deve ser positivo'),
  moeda: z.string().length(3, 'Moeda deve ter 3 caracteres').default('BRL'),
  ativo: z.boolean().default(true),
})

// Schema para atualização de plano
export const planoUpdateSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(255, 'Nome muito longo').optional(),
  descricao: z.string().max(1000, 'Descrição muito longa').optional().or(z.literal('')).nullable(),
  valor: z.number().min(0, 'Valor deve ser positivo').optional(),
  moeda: z.string().length(3, 'Moeda deve ter 3 caracteres').optional(),
  ativo: z.boolean().optional(),
})

// Schema para relação plano-serviço (N:N)
export const planoServicoCreateSchema = z.object({
  plano_id: z.string().uuid('ID do plano inválido'),
  servico_id: z.string().uuid('ID do serviço inválido'),
  ordem: z.number().int().min(0).default(0),
})

// Schema para contrato de cliente com plano
export const clientePlanoCreateSchema = z.object({
  cliente_id: z.string().uuid('ID do cliente inválido'),
  plano_id: z.string().uuid('ID do plano inválido'),
  valor: z.number().min(0, 'Valor deve ser positivo'),
  moeda: z.string().length(3, 'Moeda deve ter 3 caracteres').default('BRL'),
  status: z.enum(['ativo', 'pausado', 'cancelado', 'finalizado']).default('ativo'),
  data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de início inválida (formato: YYYY-MM-DD)'),
  data_fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de fim inválida (formato: YYYY-MM-DD)').optional().or(z.literal('')),
  observacoes: z.string().max(2000, 'Observações muito longas').optional().or(z.literal('')),
})

// Schema para atualização de contrato de cliente com plano
export const clientePlanoUpdateSchema = z.object({
  valor: z.number().min(0, 'Valor deve ser positivo').optional(),
  moeda: z.string().length(3, 'Moeda deve ter 3 caracteres').optional(),
  status: z.enum(['ativo', 'pausado', 'cancelado', 'finalizado']).optional(),
  data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de início inválida (formato: YYYY-MM-DD)').optional(),
  data_fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de fim inválida (formato: YYYY-MM-DD)').optional().or(z.literal('')).nullable(),
  observacoes: z.string().max(2000, 'Observações muito longas').optional().or(z.literal('')).nullable(),
})

// Schema para contrato de cliente com serviço avulso
export const clienteServicoCreateSchema = z.object({
  cliente_id: z.string().uuid('ID do cliente inválido'),
  servico_id: z.string().uuid('ID do serviço inválido'),
  valor: z.number().min(0, 'Valor deve ser positivo'),
  moeda: z.string().length(3, 'Moeda deve ter 3 caracteres').default('BRL'),
  status: z.enum(['ativo', 'pausado', 'cancelado', 'finalizado']).default('ativo'),
  data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de início inválida (formato: YYYY-MM-DD)'),
  data_fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de fim inválida (formato: YYYY-MM-DD)').optional().or(z.literal('')),
  observacoes: z.string().max(2000, 'Observações muito longas').optional().or(z.literal('')),
})

// Schema para atualização de contrato de cliente com serviço avulso
export const clienteServicoUpdateSchema = z.object({
  valor: z.number().min(0, 'Valor deve ser positivo').optional(),
  moeda: z.string().length(3, 'Moeda deve ter 3 caracteres').optional(),
  status: z.enum(['ativo', 'pausado', 'cancelado', 'finalizado']).optional(),
  data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de início inválida (formato: YYYY-MM-DD)').optional(),
  data_fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de fim inválida (formato: YYYY-MM-DD)').optional().or(z.literal('')).nullable(),
  observacoes: z.string().max(2000, 'Observações muito longas').optional().or(z.literal('')).nullable(),
})

// Tipos TypeScript inferidos dos schemas
export type ServicoCreateInput = z.infer<typeof servicoCreateSchema>
export type ServicoUpdateInput = z.infer<typeof servicoUpdateSchema>
export type PlanoCreateInput = z.infer<typeof planoCreateSchema>
export type PlanoUpdateInput = z.infer<typeof planoUpdateSchema>
export type PlanoServicoCreateInput = z.infer<typeof planoServicoCreateSchema>
export type ClientePlanoCreateInput = z.infer<typeof clientePlanoCreateSchema>
export type ClientePlanoUpdateInput = z.infer<typeof clientePlanoUpdateSchema>
export type ClienteServicoCreateInput = z.infer<typeof clienteServicoCreateSchema>
export type ClienteServicoUpdateInput = z.infer<typeof clienteServicoUpdateSchema>
