import { supabase } from './supabase'
import { fetchResponsavelName } from './usuarios'
import type { ClienteResponsavel } from '@/types'

/**
 * Buscar responsáveis do cliente (cliente_responsaveis, excl. soft-deleted).
 * Resolve nome via RPC; email não preenchido.
 */
export async function fetchClienteResponsaveis(clienteId: string): Promise<ClienteResponsavel[]> {
  try {
    const { data, error } = await supabase
      .from('cliente_responsaveis')
      .select('id, cliente_id, responsavel_id, roles, observacao, created_at, updated_at')
      .eq('cliente_id', clienteId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Erro ao buscar responsáveis do cliente:', error)
      throw error
    }

    const rows = (data || []) as Array<{
      id: string
      cliente_id: string
      responsavel_id: string
      roles: string[]
      observacao: string | null
      created_at: string
      updated_at: string
    }>

    const withNames = await Promise.all(
      rows.map(async (r) => {
        const name = await fetchResponsavelName(r.responsavel_id)
        return {
          id: r.id,
          cliente_id: r.cliente_id,
          responsavel_id: r.responsavel_id,
          roles: r.roles as ('principal' | 'comercial' | 'suporte' | 'backup')[],
          observacao: r.observacao ?? undefined,
          created_at: r.created_at,
          updated_at: r.updated_at,
          responsavel: {
            id: r.responsavel_id,
            name: name ?? 'Responsável',
            email: '',
          },
        }
      })
    )

    return withNames
  } catch (error) {
    console.error('Erro em fetchClienteResponsaveis:', error)
    throw error
  }
}

/**
 * Soft-delete de um responsável (cliente_responsaveis).
 */
export async function softDeleteClienteResponsavel(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('cliente_responsaveis')
      .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Erro ao desvincular responsável:', error)
      throw error
    }
  } catch (error) {
    console.error('Erro em softDeleteClienteResponsavel:', error)
    throw error
  }
}
