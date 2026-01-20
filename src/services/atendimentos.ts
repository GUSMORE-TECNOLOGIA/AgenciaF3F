import { supabase } from './supabase'
import { Atendimento } from '@/types'

export interface AtendimentoCreateInput {
  cliente_id: string
  usuario_id: string
  tipo: 'email' | 'whatsapp' | 'telefone' | 'presencial'
  assunto: string
  descricao: string
  data_atendimento: string // TIMESTAMPTZ
  duracao_minutos?: number
}

export interface AtendimentoUpdateInput {
  tipo?: 'email' | 'whatsapp' | 'telefone' | 'presencial'
  assunto?: string
  descricao?: string
  data_atendimento?: string
  duracao_minutos?: number
}

export interface AtendimentoFilters {
  cliente_id?: string
  usuario_id?: string
  tipo?: 'email' | 'whatsapp' | 'telefone' | 'presencial'
  dataInicio?: string
  dataFim?: string
}

/**
 * Buscar lista de atendimentos com filtros
 */
export async function fetchAtendimentos(filtros?: AtendimentoFilters): Promise<Atendimento[]> {
  try {
    let query = supabase
      .from('atendimentos')
      .select('*')
      .is('deleted_at', null)
      .order('data_atendimento', { ascending: false })

    if (filtros?.cliente_id) {
      query = query.eq('cliente_id', filtros.cliente_id)
    }

    if (filtros?.usuario_id) {
      query = query.eq('usuario_id', filtros.usuario_id)
    }

    if (filtros?.tipo) {
      query = query.eq('tipo', filtros.tipo)
    }

    if (filtros?.dataInicio) {
      query = query.gte('data_atendimento', filtros.dataInicio)
    }

    if (filtros?.dataFim) {
      query = query.lte('data_atendimento', filtros.dataFim)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar atendimentos:', error)
      throw error
    }

    return (data || []).map((item) => ({
      id: item.id,
      cliente_id: item.cliente_id,
      usuario_id: item.usuario_id,
      tipo: item.tipo,
      assunto: item.assunto,
      descricao: item.descricao,
      data_atendimento: item.data_atendimento,
      duracao_minutos: item.duracao_minutos || undefined,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }))
  } catch (error) {
    console.error('Erro em fetchAtendimentos:', error)
    throw error
  }
}

/**
 * Buscar um atendimento por ID
 */
export async function fetchAtendimentoById(id: string): Promise<Atendimento | null> {
  try {
    const { data, error } = await supabase
      .from('atendimentos')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Erro ao buscar atendimento:', error)
      throw error
    }

    return {
      id: data.id,
      cliente_id: data.cliente_id,
      usuario_id: data.usuario_id,
      tipo: data.tipo,
      assunto: data.assunto,
      descricao: data.descricao,
      data_atendimento: data.data_atendimento,
      duracao_minutos: data.duracao_minutos || undefined,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  } catch (error) {
    console.error('Erro em fetchAtendimentoById:', error)
    throw error
  }
}

/**
 * Criar novo atendimento
 */
export async function createAtendimento(input: AtendimentoCreateInput): Promise<Atendimento> {
  try {
    const { data, error } = await supabase
      .from('atendimentos')
      .insert({
        cliente_id: input.cliente_id,
        usuario_id: input.usuario_id,
        tipo: input.tipo,
        assunto: input.assunto,
        descricao: input.descricao,
        data_atendimento: input.data_atendimento,
        duracao_minutos: input.duracao_minutos || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar atendimento:', error)
      throw error
    }

    return {
      id: data.id,
      cliente_id: data.cliente_id,
      usuario_id: data.usuario_id,
      tipo: data.tipo,
      assunto: data.assunto,
      descricao: data.descricao,
      data_atendimento: data.data_atendimento,
      duracao_minutos: data.duracao_minutos || undefined,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  } catch (error) {
    console.error('Erro em createAtendimento:', error)
    throw error
  }
}

/**
 * Atualizar atendimento existente
 */
export async function updateAtendimento(id: string, input: AtendimentoUpdateInput): Promise<Atendimento> {
  try {
    const updateData: any = {}

    if (input.tipo !== undefined) updateData.tipo = input.tipo
    if (input.assunto !== undefined) updateData.assunto = input.assunto
    if (input.descricao !== undefined) updateData.descricao = input.descricao
    if (input.data_atendimento !== undefined) updateData.data_atendimento = input.data_atendimento
    if (input.duracao_minutos !== undefined) updateData.duracao_minutos = input.duracao_minutos || null

    const { data, error } = await supabase
      .from('atendimentos')
      .update(updateData)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar atendimento:', error)
      throw error
    }

    return {
      id: data.id,
      cliente_id: data.cliente_id,
      usuario_id: data.usuario_id,
      tipo: data.tipo,
      assunto: data.assunto,
      descricao: data.descricao,
      data_atendimento: data.data_atendimento,
      duracao_minutos: data.duracao_minutos || undefined,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  } catch (error) {
    console.error('Erro em updateAtendimento:', error)
    throw error
  }
}

/**
 * Soft delete de um atendimento
 */
export async function deleteAtendimento(id: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('soft_delete_atendimento', { atendimento_id: id })

    if (error) {
      console.error('Erro ao deletar atendimento:', error)
      throw error
    }
  } catch (error) {
    console.error('Erro em deleteAtendimento:', error)
    throw error
  }
}
