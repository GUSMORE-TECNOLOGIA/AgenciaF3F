import { z } from 'zod'

// Schema para criação de atendimento
export const atendimentoCreateSchema = z.object({
  cliente_id: z.string().uuid('ID do cliente inválido'),
  usuario_id: z.string().uuid('ID do usuário inválido'),
  tipo: z.enum(['email', 'whatsapp', 'telefone', 'presencial'], {
    errorMap: () => ({ message: 'Tipo de atendimento inválido' }),
  }),
  assunto: z.string().min(3, 'Assunto deve ter pelo menos 3 caracteres').max(200, 'Assunto muito longo'),
  descricao: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres').max(5000, 'Descrição muito longa'),
  data_atendimento: z.string().min(1, 'Data/hora de atendimento é obrigatória'),
  duracao_minutos: z.number().int().min(0, 'Duração deve ser positiva').optional().nullable(),
})

// Schema para atualização de atendimento
export const atendimentoUpdateSchema = z.object({
  tipo: z.enum(['email', 'whatsapp', 'telefone', 'presencial']).optional(),
  assunto: z.string().min(3, 'Assunto deve ter pelo menos 3 caracteres').max(200, 'Assunto muito longo').optional(),
  descricao: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres').max(5000, 'Descrição muito longa').optional(),
  data_atendimento: z.string().min(1, 'Data/hora de atendimento é obrigatória').optional(),
  duracao_minutos: z.number().int().min(0, 'Duração deve ser positiva').optional().nullable(),
})

// Tipos TypeScript inferidos dos schemas
export type AtendimentoCreateInput = z.infer<typeof atendimentoCreateSchema>
export type AtendimentoUpdateInput = z.infer<typeof atendimentoUpdateSchema>
