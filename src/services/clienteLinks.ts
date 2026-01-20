import { supabase } from './supabase'
import { ClienteLink } from '@/types'

/**
 * Buscar todos os links de um cliente
 */
export async function fetchClienteLinks(clienteId: string): Promise<ClienteLink[]> {
  try {
    const { data, error } = await supabase
      .from('cliente_links')
      .select('*')
      .eq('cliente_id', clienteId)
      .is('deleted_at', null)
      .order('tipo', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar links do cliente:', error)
      throw error
    }

    return (data || []).map((item) => ({
      id: item.id,
      cliente_id: item.cliente_id,
      url: item.url,
      tipo: item.tipo,
      pessoa: item.pessoa || undefined,
      status: item.status,
      created_at: item.created_at,
      updated_at: item.updated_at,
      deleted_at: item.deleted_at || undefined,
    }))
  } catch (error) {
    console.error('Erro em fetchClienteLinks:', error)
    throw error
  }
}

/**
 * Criar novo link para um cliente
 */
export async function createClienteLink(input: {
  cliente_id: string
  url: string
  tipo: string
  pessoa?: string
  status?: 'ativo' | 'inativo'
}): Promise<ClienteLink> {
  try {
    const { data, error } = await supabase
      .from('cliente_links')
      .insert({
        cliente_id: input.cliente_id,
        url: input.url.trim(),
        tipo: input.tipo.trim(),
        pessoa: input.pessoa?.trim() || null,
        status: input.status || 'ativo',
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar link do cliente:', error)
      throw error
    }

    return {
      id: data.id,
      cliente_id: data.cliente_id,
      url: data.url,
      tipo: data.tipo,
      pessoa: data.pessoa || undefined,
      status: data.status,
      created_at: data.created_at,
      updated_at: data.updated_at,
      deleted_at: data.deleted_at || undefined,
    }
  } catch (error) {
    console.error('Erro em createClienteLink:', error)
    throw error
  }
}

/**
 * Atualizar link de um cliente
 */
export async function updateClienteLink(
  id: string,
  input: {
    url?: string
    tipo?: string
    pessoa?: string
    status?: 'ativo' | 'inativo'
  }
): Promise<ClienteLink> {
  try {
    const updateData: any = {}
    
    if (input.url !== undefined) {
      updateData.url = input.url.trim()
    }
    if (input.tipo !== undefined) {
      updateData.tipo = input.tipo.trim()
    }
    if (input.pessoa !== undefined) {
      updateData.pessoa = input.pessoa?.trim() || null
    }
    if (input.status !== undefined) {
      updateData.status = input.status
    }

    const { data, error } = await supabase
      .from('cliente_links')
      .update(updateData)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar link do cliente:', error)
      throw error
    }

    return {
      id: data.id,
      cliente_id: data.cliente_id,
      url: data.url,
      tipo: data.tipo,
      pessoa: data.pessoa || undefined,
      status: data.status,
      created_at: data.created_at,
      updated_at: data.updated_at,
      deleted_at: data.deleted_at || undefined,
    }
  } catch (error) {
    console.error('Erro em updateClienteLink:', error)
    throw error
  }
}

/**
 * Soft delete de um link (usar função RPC)
 */
export async function deleteClienteLink(id: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('soft_delete_cliente_link', { link_id: id })

    if (error) {
      console.error('Erro ao deletar link do cliente:', error)
      throw error
    }
  } catch (error) {
    console.error('Erro em deleteClienteLink:', error)
    throw error
  }
}
