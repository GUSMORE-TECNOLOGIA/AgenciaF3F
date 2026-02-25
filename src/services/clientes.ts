import { supabase } from './supabase'
import { Cliente, LinksUteis } from '@/types'
import type { ClienteCreateInput, ClienteUpdateInput } from '@/lib/validators/cliente-schema'
import { cleanLinksUteis } from '@/lib/validators/cliente-schema'
import { createClienteResponsavel } from './cliente-responsaveis'

// Condição de filtro inteligente (Campo + Operador + Valor)
export interface SmartFilterCondition {
  id?: string
  field: string
  operator: string
  value?: string | string[]
  logicalOperator?: 'AND' | 'OR'
}

// Filtro salvo com nome (lista no modal)
export interface SmartFilter {
  id: string
  name: string
  conditions: SmartFilterCondition[]
  createdAt: string
}

// Tipos para filtros
export interface ClienteFilters {
  status?: 'ativo' | 'inativo' | 'pausado'
  responsavel_id?: string
  search?: string
  smartConditions?: SmartFilterCondition[]
  limit?: number
  offset?: number
}

// Interface para resposta paginada
export interface ClientesResponse {
  data: Cliente[]
  total: number
  page: number
  pageSize: number
}

/**
 * Buscar lista de clientes com filtros opcionais.
 * Usa sempre RPC list_clientes_filtrados (visibilidade por is_responsavel_do_cliente no servidor).
 */
export async function fetchClientes(filters?: ClienteFilters): Promise<ClientesResponse> {
  try {
    const limit = filters?.limit || 50
    const offset = filters?.offset || 0

    // Usar sempre RPC list_clientes_filtrados: aplica is_responsavel_do_cliente no servidor e evita
    // diferenças de comportamento da RLS na tabela (ex.: agente vendo 0 clientes no dashboard).
    const conditions: Record<string, unknown>[] = (filters?.smartConditions ?? []).map((c) => ({
      field: c.field,
      operator: c.operator,
      value: c.value,
      logicalOperator: c.logicalOperator,
    }))
    if (filters?.search?.trim()) {
      conditions.unshift({
        field: 'search',
        operator: 'contains',
        value: filters.search.trim(),
      })
    }
    if (filters?.status) {
      conditions.push({
        field: 'status',
        operator: 'equals',
        value: filters.status,
        logicalOperator: 'AND',
      })
    }
    if (filters?.responsavel_id) {
      conditions.push({
        field: 'responsavel_id',
        operator: 'equals',
        value: filters.responsavel_id,
        logicalOperator: 'AND',
      })
    }

    const { data, error } = await supabase.rpc('list_clientes_filtrados', {
      p_conditions: conditions,
      p_limit: limit,
      p_offset: offset,
    })
    if (error) {
      console.error('Erro ao buscar clientes (RPC):', error)
      throw error
    }
    const rows = (data as any[]) || []
    // RPC retorna total na coluna "t" (cnt.t no SQL)
    const total = rows[0]?.t ?? rows[0]?.total_count ?? 0
    const clientes: Cliente[] = rows.map((item: any) => ({
      id: item.id,
      nome: item.nome,
      email: item.email || undefined,
      telefone: item.telefone || undefined,
      responsavel_id: item.responsavel_id ?? null,
      status: item.status,
      logo_url: item.logo_url || undefined,
      links_uteis: item.links_uteis || {},
      drive_url: item.drive_url || undefined,
      created_at: item.created_at,
      updated_at: item.updated_at,
      responsavel: undefined,
    }))
    return {
      data: clientes,
      total: Number(total),
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
    }
  } catch (error) {
    console.error('Erro em fetchClientes:', error)
    throw error
  }
}

const FETCH_CLIENTE_TIMEOUT_MS = 12_000

function withTimeout<T>(promise: Promise<T>, ms: number, msg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(msg)), ms)),
  ])
}

/**
 * Buscar um cliente por ID
 */
export async function fetchClienteById(id: string): Promise<Cliente | null> {
  try {
    const promise = supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle() as unknown as Promise<{ data: unknown; error: unknown }>

    const { data, error } = await withTimeout(
      promise,
      FETCH_CLIENTE_TIMEOUT_MS,
      'Timeout ao carregar cliente. Verifique sua conexão e tente novamente.'
    )

    if (error) {
      console.error('Erro ao buscar cliente:', error)
      throw error
    }
    if (!data) return null

    const d = data as Record<string, unknown>
    return {
      id: d.id as string,
      nome: d.nome as string,
      email: (d.email as string) || undefined,
      telefone: (d.telefone as string) || undefined,
      responsavel_id: (d.responsavel_id as string) ?? null,
      status: d.status as 'ativo' | 'inativo' | 'pausado',
      logo_url: (d.logo_url as string) || undefined,
      links_uteis: (d.links_uteis as Record<string, unknown>) || {},
      drive_url: (d.drive_url as string) || undefined,
      created_at: d.created_at as string,
      updated_at: d.updated_at as string,
      responsavel: undefined,
    }
  } catch (error) {
    console.error('Erro em fetchClienteById:', error)
    throw error
  }
}

/**
 * Criar novo cliente
 */
export async function createCliente(input: ClienteCreateInput): Promise<Cliente> {
  try {
    // Limpar links úteis (remover strings vazias)
    const linksUteis = input.links_uteis ? cleanLinksUteis(input.links_uteis) : {}

    const { data, error } = await supabase
      .from('clientes')
      .insert({
        nome: input.nome,
        email: input.email || null,
        telefone: input.telefone || null,
        status: input.status,
        links_uteis: linksUteis,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar cliente:', error)
      throw error
    }

    if (input.responsavel_id) {
      try {
        await createClienteResponsavel({
          cliente_id: data.id,
          responsavel_id: input.responsavel_id,
          roles: ['principal'],
        })
      } catch (err) {
        console.error('Erro ao vincular responsável principal ao novo cliente:', err)
      }
    }

    return {
      id: data.id,
      nome: data.nome,
      email: data.email || undefined,
      telefone: data.telefone || undefined,
      responsavel_id: input.responsavel_id ?? data.responsavel_id ?? null,
      status: data.status,
      logo_url: data.logo_url || undefined,
      links_uteis: data.links_uteis || {},
      drive_url: data.drive_url || undefined,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  } catch (error) {
    console.error('Erro em createCliente:', error)
    throw error
  }
}

/**
 * Atualizar cliente existente
 */
export async function updateCliente(id: string, input: ClienteUpdateInput): Promise<Cliente> {
  try {
    const updateData: any = {}

    if (input.nome !== undefined) updateData.nome = input.nome
    if (input.email !== undefined) updateData.email = input.email || null
    if (input.telefone !== undefined) updateData.telefone = input.telefone || null
    if (input.status !== undefined) updateData.status = input.status
    // drive_url removido - usar cliente_links com tipo "Google Drive" ao invés

    // Limpar links úteis se fornecidos
    if (input.links_uteis !== undefined) {
      updateData.links_uteis = cleanLinksUteis(input.links_uteis)
    }

    const { data, error } = await supabase
      .from('clientes')
      .update(updateData)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar cliente:', error)
      throw error
    }

    return {
      id: data.id,
      nome: data.nome,
      email: data.email || undefined,
      telefone: data.telefone || undefined,
      responsavel_id: data.responsavel_id,
      status: data.status,
      logo_url: data.logo_url || undefined,
      links_uteis: data.links_uteis || {},
      drive_url: data.drive_url || undefined,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  } catch (error) {
    console.error('Erro em updateCliente:', error)
    throw error
  }
}

/**
 * Atualizar apenas links úteis de um cliente
 */
export async function updateLinksUteis(id: string, links: LinksUteis): Promise<Cliente> {
  try {
    const cleanedLinks = cleanLinksUteis(links as Record<string, string | undefined>)

    const { data, error } = await supabase
      .from('clientes')
      .update({ links_uteis: cleanedLinks })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar links úteis:', error)
      throw error
    }

    return {
      id: data.id,
      nome: data.nome,
      email: data.email || undefined,
      telefone: data.telefone || undefined,
      responsavel_id: data.responsavel_id,
      status: data.status,
      logo_url: data.logo_url || undefined,
      links_uteis: data.links_uteis || {},
      drive_url: data.drive_url || undefined,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  } catch (error) {
    console.error('Erro em updateLinksUteis:', error)
    throw error
  }
}

/**
 * Atualizar apenas status de um cliente
 */
export async function updateClienteStatus(id: string, status: 'ativo' | 'inativo' | 'pausado'): Promise<Cliente> {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .update({ status })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar status:', error)
      throw error
    }

    return {
      id: data.id,
      nome: data.nome,
      email: data.email || undefined,
      telefone: data.telefone || undefined,
      responsavel_id: data.responsavel_id,
      status: data.status,
      logo_url: data.logo_url || undefined,
      links_uteis: data.links_uteis || {},
      drive_url: data.drive_url || undefined,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  } catch (error) {
    console.error('Erro em updateClienteStatus:', error)
    throw error
  }
}

/**
 * Soft delete de um cliente (marcar como deletado)
 */
export async function deleteCliente(id: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('soft_delete_cliente', { cliente_id: id })
    if (error) {
      console.error('Erro ao deletar cliente:', error)
      const err = error as { message?: string; details?: string; hint?: string }
      const msg = [err.message, err.details, err.hint].filter(Boolean).join(' · ') || 'Erro ao excluir cliente. Tente novamente.'
      throw new Error(msg)
    }
  } catch (e) {
    if (e instanceof Error) throw e
    console.error('Erro em deleteCliente:', e)
    throw new Error('Erro ao excluir cliente. Tente novamente.')
  }
}

/**
 * Restaurar cliente deletado (soft delete reverso)
 */
export async function restoreCliente(id: string): Promise<Cliente> {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .update({ deleted_at: null })
      .eq('id', id)
      .not('deleted_at', 'is', null)
      .select()
      .single()

    if (error) {
      console.error('Erro ao restaurar cliente:', error)
      throw error
    }

    return {
      id: data.id,
      nome: data.nome,
      email: data.email || undefined,
      telefone: data.telefone || undefined,
      responsavel_id: data.responsavel_id,
      status: data.status,
      logo_url: data.logo_url || undefined,
      links_uteis: data.links_uteis || {},
      drive_url: data.drive_url || undefined,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  } catch (error) {
    console.error('Erro em restoreCliente:', error)
    throw error
  }
}
