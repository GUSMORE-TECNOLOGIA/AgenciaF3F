import { z } from 'zod'

// Schema para Links Úteis (10 campos - pasta_drive removido, usando drive_url separado)
export const linksUteisSchema = z.object({
  conta_anuncio_f3f: z.string().url('URL inválida').optional().or(z.literal('')),
  conta_anuncio_lt: z.string().url('URL inválida').optional().or(z.literal('')),
  instagram: z.string().url('URL inválida').optional().or(z.literal('')),
  business_suite: z.string().url('URL inválida').optional().or(z.literal('')),
  dashboard: z.string().url('URL inválida').optional().or(z.literal('')),
  planilha_dados: z.string().url('URL inválida').optional().or(z.literal('')),
  utmify: z.string().url('URL inválida').optional().or(z.literal('')),
  wordpress: z.string().url('URL inválida').optional().or(z.literal('')),
  pagina_vendas_lt: z.string().url('URL inválida').optional().or(z.literal('')),
  checkout: z.string().url('URL inválida').optional().or(z.literal('')),
}).optional()

// Schema para criação de cliente
export const clienteCreateSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(255, 'Nome muito longo'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  responsavel_id: z.string().uuid('Responsável inválido'),
  status: z.enum(['ativo', 'inativo', 'pausado'], {
    errorMap: () => ({ message: 'Status inválido' }),
  }),
  logo_url: z.string().url('URL inválida').optional().or(z.literal('')),
  links_uteis: linksUteisSchema.optional(),
  drive_url: z.string().url('URL inválida').optional().or(z.literal('')),
})

// Schema para atualização de cliente (todos os campos opcionais exceto id)
export const clienteUpdateSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(255, 'Nome muito longo').optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  responsavel_id: z.string().uuid('Responsável inválido').optional(),
  status: z.enum(['ativo', 'inativo', 'pausado']).optional(),
  logo_url: z.string().url('URL inválida').optional().or(z.literal('')).nullable(),
  links_uteis: linksUteisSchema.optional(),
  drive_url: z.string().url('URL inválida').optional().or(z.literal('')),
})

// Schema para atualização apenas de links úteis
export const linksUteisUpdateSchema = z.object({
  links_uteis: linksUteisSchema,
})

// Schema para atualização apenas de status
export const clienteStatusUpdateSchema = z.object({
  status: z.enum(['ativo', 'inativo', 'pausado']),
})

// Tipos TypeScript inferidos dos schemas
export type ClienteCreateInput = z.infer<typeof clienteCreateSchema>
export type ClienteUpdateInput = z.infer<typeof clienteUpdateSchema>
export type LinksUteisInput = z.infer<typeof linksUteisSchema>

// Função helper para validar URL (permite string vazia)
export function validateUrl(value: string): boolean {
  if (!value || value.trim() === '') return true
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

// Função para limpar links úteis (remover strings vazias)
export function cleanLinksUteis(links: Record<string, string | undefined>): Record<string, string> {
  const cleaned: Record<string, string> = {}
  Object.entries(links).forEach(([key, value]) => {
    if (value && value.trim() !== '') {
      cleaned[key] = value.trim()
    }
  })
  return cleaned
}
