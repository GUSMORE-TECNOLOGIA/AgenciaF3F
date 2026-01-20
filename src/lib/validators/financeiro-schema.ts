import { z } from 'zod'

// Schema para criação de transação
export const transacaoCreateSchema = z.object({
  cliente_id: z.string().uuid('ID do cliente inválido'),
  servico_id: z.string().uuid('ID do serviço inválido').optional().or(z.literal('')),
  tipo: z.literal('receita'),
  categoria: z.string().min(1, 'Categoria é obrigatória').max(100, 'Categoria muito longa'),
  valor: z.number().min(0.01, 'Valor deve ser maior que zero'),
  moeda: z.string().length(3, 'Moeda deve ter 3 caracteres').default('BRL'),
  descricao: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres').max(500, 'Descrição muito longa'),
  metodo_pagamento: z.string().max(50, 'Método de pagamento muito longo').optional().or(z.literal('')),
  status: z.enum(['pendente', 'pago', 'vencido', 'cancelado', 'reembolsado']).default('pendente'),
  data_vencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de vencimento inválida (formato: YYYY-MM-DD)'),
  data_pagamento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de pagamento inválida (formato: YYYY-MM-DD)').optional().or(z.literal('')),
  external_transaction_id: z.string().max(255, 'ID externo muito longo').optional().or(z.literal('')),
  external_source: z.string().max(100, 'Fonte externa muito longa').optional().or(z.literal('')),
})

// Schema para atualização de transação
export const transacaoUpdateSchema = z.object({
  cliente_id: z.string().uuid('ID do cliente inválido').optional(),
  servico_id: z.string().uuid('ID do serviço inválido').optional().or(z.literal('')).nullable(),
  tipo: z.literal('receita').optional(),
  categoria: z.string().min(1, 'Categoria é obrigatória').max(100, 'Categoria muito longa').optional(),
  valor: z.number().min(0.01, 'Valor deve ser maior que zero').optional(),
  moeda: z.string().length(3, 'Moeda deve ter 3 caracteres').optional(),
  descricao: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres').max(500, 'Descrição muito longa').optional(),
  metodo_pagamento: z.string().max(50, 'Método de pagamento muito longo').nullable().transform((val) => val ?? undefined).optional(),
  status: z.enum(['pendente', 'pago', 'vencido', 'cancelado', 'reembolsado']).optional(),
  data_vencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de vencimento inválida (formato: YYYY-MM-DD)').optional(),
  data_pagamento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de pagamento inválida (formato: YYYY-MM-DD)').optional().or(z.literal('')),
  external_transaction_id: z.string().max(255, 'ID externo muito longo').optional().or(z.literal('')).nullable(),
  external_source: z.string().max(100, 'Fonte externa muito longa').optional().or(z.literal('')).nullable(),
})

// Tipos TypeScript inferidos dos schemas
export type TransacaoCreateInput = z.infer<typeof transacaoCreateSchema>
export type TransacaoUpdateInput = z.infer<typeof transacaoUpdateSchema>
