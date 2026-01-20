import { z } from 'zod'

// Schema para criação de ocorrência
export const ocorrenciaCreateSchema = z.object({
  cliente_id: z.string().uuid('ID do cliente inválido'),
  grupo_id: z.string().uuid('ID do grupo inválido'),
  tipo_id: z.string().uuid('ID do tipo inválido'),
  ocorreu_em: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (formato: YYYY-MM-DD)'),
  notas: z.string().min(3, 'Notas devem ter pelo menos 3 caracteres').max(2000, 'Notas muito longas'),
  responsavel_id: z.string().uuid('ID do responsável inválido'),
  prioridade: z.enum(['baixa', 'media', 'alta', 'urgente']).default('media'),
  is_sensitive: z.boolean().default(false),
  status: z.enum(['aberta', 'em_andamento', 'resolvida', 'cancelada']).default('aberta'),
})

// Schema para atualização de ocorrência
export const ocorrenciaUpdateSchema = z.object({
  grupo_id: z.string().uuid('ID do grupo inválido').optional(),
  tipo_id: z.string().uuid('ID do tipo inválido').optional(),
  ocorreu_em: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (formato: YYYY-MM-DD)').optional(),
  notas: z.string().min(3, 'Notas devem ter pelo menos 3 caracteres').max(2000, 'Notas muito longas').optional(),
  responsavel_id: z.string().uuid('ID do responsável inválido').optional(),
  prioridade: z.enum(['baixa', 'media', 'alta', 'urgente']).optional(),
  is_sensitive: z.boolean().optional(),
  status: z.enum(['aberta', 'em_andamento', 'resolvida', 'cancelada']).optional(),
})

// Tipos TypeScript inferidos dos schemas
export type OcorrenciaCreateInput = z.infer<typeof ocorrenciaCreateSchema>
export type OcorrenciaUpdateInput = z.infer<typeof ocorrenciaUpdateSchema>
