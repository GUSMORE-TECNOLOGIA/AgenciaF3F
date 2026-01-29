import { supabase } from './supabase'
import { Cliente, LinksUteis } from '@/types'
import type { ClienteCreateInput, ClienteUpdateInput } from '@/lib/validators/cliente-schema'
import { cleanLinksUteis } from '@/lib/validators/cliente-schema'

// Tipos para filtros
export interface ClienteFilters {
  status?: 'ativo' | 'inativo' | 'pausado'
  responsavel_id?: string
  search?: string
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
 * Buscar lista de clientes com filtros opcionais
 */
export async function fetchClientes(filters?: ClienteFilters): Promise<ClientesResponse> {
  try {
    let query = supabase
      .from('clientes')
      .select('*, usuarios(id, name)', { count: 'exact' })
      .is('deleted_at', null)

    // Aplicar filtros
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.responsavel_id) {
      query = query.eq('responsavel_id', filters.responsavel_id)
    }

    if (filters?.search) {
      const searchTerm = `%${filters.search}%`
      query = query.or(`nome.ilike.${searchTerm},email.ilike.${searchTerm},telefone.ilike.${searchTerm}`)
    }

    // Ordenação padrão
    query = query.order('created_at', { ascending: false })

    // Paginação
    const limit = filters?.limit || 50
    const offset = filters?.offset || 0
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Erro ao buscar clientes:', error)
      throw error
    }

    const clientes: Cliente[] = (data || []).map((item: any) => {
      const usu = item.usuarios
      return {
        id: item.id,
        nome: item.nome,
        email: item.email || undefined,
        telefone: item.telefone || undefined,
        responsavel_id: item.responsavel_id,
        status: item.status,
        logo_url: item.logo_url || undefined,
        links_uteis: item.links_uteis || {},
        drive_url: item.drive_url || undefined,
        created_at: item.created_at,
        updated_at: item.updated_at,
        responsavel: usu && (usu.id != null || usu.name != null)
          ? { id: String(usu.id), name: String(usu.name || '') }
          : undefined,
      }
    })

    return {
      data: clientes,
      total: count || 0,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
    }
  } catch (error) {
    console.error('Erro em fetchClientes:', error)
    throw error
  }
}

/**
 * Buscar um cliente por ID
 */
export async function fetchClienteById(id: string): Promise<Cliente | null> {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*, usuarios(id, name)')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Erro ao buscar cliente:', error)
      throw error
    }

    const usu = (data as any).usuarios
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
      responsavel:
        usu && (usu.id != null || usu.name != null)
          ? { id: String(usu.id), name: String(usu.name || '') }
          : undefined,
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
        responsavel_id: input.responsavel_id,
        status: input.status,
        links_uteis: linksUteis,
        // drive_url removido - usar cliente_links com tipo "Google Drive" ao invés
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar cliente:', error)
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
    if (input.responsavel_id !== undefined) updateData.responsavel_id = input.responsavel_id
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
    // Usar função RPC para contornar RLS policies
    const { error } = await supabase.rpc('soft_delete_cliente', { cliente_id: id })

    if (error) {
      console.error('Erro ao deletar cliente:', error)
      throw error
    }
  } catch (error) {
    console.error('Erro em deleteCliente:', error)
    throw error
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
