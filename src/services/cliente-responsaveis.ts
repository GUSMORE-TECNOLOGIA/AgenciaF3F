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

const ROLES_VALIDOS = ['principal', 'comercial', 'suporte', 'backup'] as const

export interface CreateClienteResponsavelInput {
  cliente_id: string
  responsavel_id: string
  roles: string[]
  observacao?: string
}

/**
 * Inserir ou restaurar responsável no cliente (cliente_responsaveis).
 * Se já existir linha (cliente_id, responsavel_id) — inclusive soft-deleted — faz UPDATE (restaura).
 * Caso contrário faz INSERT. Respeita unique_principal_per_cliente.
 */
export async function createClienteResponsavel(input: CreateClienteResponsavelInput): Promise<ClienteResponsavel> {
  const roles = input.roles.filter((r) => ROLES_VALIDOS.includes(r as (typeof ROLES_VALIDOS)[number]))
  if (roles.length === 0) {
    throw new Error('Selecione pelo menos um papel válido: principal, comercial, suporte ou backup.')
  }

  const now = new Date().toISOString()

  try {
    // Verificar se já existe registro (ativo ou soft-deleted) para este par cliente/responsável.
    // Se existir, fazer UPDATE (restaurar); caso contrário, INSERT.
    // Isso evita que a política RLS cr_insert bloqueie upserts quando o cliente já tem responsáveis.
    const { data: existing } = await supabase
      .from('cliente_responsaveis')
      .select('id')
      .eq('cliente_id', input.cliente_id)
      .eq('responsavel_id', input.responsavel_id)
      .maybeSingle()

    let data: { id: string; cliente_id: string; responsavel_id: string; roles: string[]; observacao: string | null; created_at: string; updated_at: string } | null = null
    let error: { message: string } | null = null

    if (existing?.id) {
      // Registro já existe — UPDATE (restaura se estava soft-deleted)
      const result = await supabase
        .from('cliente_responsaveis')
        .update({
          roles,
          observacao: input.observacao?.trim() || null,
          deleted_at: null,
          updated_at: now,
        })
        .eq('id', existing.id)
        .select('id, cliente_id, responsavel_id, roles, observacao, created_at, updated_at')
        .single()
      data = result.data
      error = result.error
    } else {
      // Registro novo — INSERT
      const result = await supabase
        .from('cliente_responsaveis')
        .insert({
          cliente_id: input.cliente_id,
          responsavel_id: input.responsavel_id,
          roles,
          observacao: input.observacao?.trim() || null,
          deleted_at: null,
          updated_at: now,
        })
        .select('id, cliente_id, responsavel_id, roles, observacao, created_at, updated_at')
        .single()
      data = result.data
      error = result.error
    }

    if (error || !data) {
      console.error('Erro ao adicionar responsável:', error)
      throw error ?? new Error('Nenhum dado retornado ao adicionar responsável.')
    }

    const name = await fetchResponsavelName(data.responsavel_id)
    return {
      id: data.id,
      cliente_id: data.cliente_id,
      responsavel_id: data.responsavel_id,
      roles: data.roles as ('principal' | 'comercial' | 'suporte' | 'backup')[],
      observacao: data.observacao ?? undefined,
      created_at: data.created_at,
      updated_at: data.updated_at,
      responsavel: {
        id: data.responsavel_id,
        name: name ?? 'Responsável',
        email: '',
      },
    }
  } catch (error) {
    console.error('Erro em createClienteResponsavel:', error)
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
