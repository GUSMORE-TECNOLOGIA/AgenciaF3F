import { supabase } from './supabase'
import { Ocorrencia, OcorrenciaGrupo, OcorrenciaTipo } from '@/types'

export interface OcorrenciaCreateInput {
  cliente_id: string
  grupo_id: string
  tipo_id: string
  ocorreu_em: string // DATE format: YYYY-MM-DD
  notas: string
  responsavel_id: string
  prioridade?: 'baixa' | 'media' | 'alta' | 'urgente'
  is_sensitive?: boolean
  status?: 'aberta' | 'em_andamento' | 'resolvida' | 'cancelada'
}

export interface OcorrenciaUpdateInput {
  grupo_id?: string
  tipo_id?: string
  ocorreu_em?: string
  notas?: string
  responsavel_id?: string
  prioridade?: 'baixa' | 'media' | 'alta' | 'urgente'
  is_sensitive?: boolean
  status?: 'aberta' | 'em_andamento' | 'resolvida' | 'cancelada'
}

export interface OcorrenciaFilters {
  cliente_id?: string
  grupo_id?: string
  tipo_id?: string
  responsavel_id?: string
  prioridade?: 'baixa' | 'media' | 'alta' | 'urgente'
  status?: 'aberta' | 'em_andamento' | 'resolvida' | 'cancelada'
  dataInicio?: string
  dataFim?: string
}

/**
 * Buscar lista de ocorrências com filtros
 */
export async function fetchOcorrencias(filtros?: OcorrenciaFilters): Promise<Ocorrencia[]> {
  try {
    let query = supabase
      .from('ocorrencias')
      .select('*')
      .is('deleted_at', null)
      .order('ocorreu_em', { ascending: false })
      .order('created_at', { ascending: false })

    if (filtros?.cliente_id) {
      query = query.eq('cliente_id', filtros.cliente_id)
    }

    if (filtros?.grupo_id) {
      query = query.eq('grupo_id', filtros.grupo_id)
    }

    if (filtros?.tipo_id) {
      query = query.eq('tipo_id', filtros.tipo_id)
    }

    if (filtros?.responsavel_id) {
      query = query.eq('responsavel_id', filtros.responsavel_id)
    }

    if (filtros?.prioridade) {
      query = query.eq('prioridade', filtros.prioridade)
    }

    if (filtros?.status) {
      query = query.eq('status', filtros.status)
    }

    if (filtros?.dataInicio) {
      query = query.gte('ocorreu_em', filtros.dataInicio)
    }

    if (filtros?.dataFim) {
      query = query.lte('ocorreu_em', filtros.dataFim)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar ocorrências:', error)
      throw error
    }

    return (data || []).map((item) => ({
      id: item.id,
      cliente_id: item.cliente_id,
      grupo_id: item.grupo_id,
      tipo_id: item.tipo_id,
      ocorreu_em: item.ocorreu_em,
      notas: item.notas,
      responsavel_id: item.responsavel_id,
      prioridade: item.prioridade,
      is_sensitive: item.is_sensitive,
      status: item.status,
      created_at: item.created_at,
      created_by: item.created_by || undefined,
      updated_at: item.updated_at,
      updated_by: item.updated_by || undefined,
      deleted_at: item.deleted_at || undefined,
    }))
  } catch (error) {
    console.error('Erro em fetchOcorrencias:', error)
    throw error
  }
}

/**
 * Buscar uma ocorrência por ID
 */
export async function fetchOcorrenciaById(id: string): Promise<Ocorrencia | null> {
  try {
    const { data, error } = await supabase
      .from('ocorrencias')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Erro ao buscar ocorrência:', error)
      throw error
    }

    return {
      id: data.id,
      cliente_id: data.cliente_id,
      grupo_id: data.grupo_id,
      tipo_id: data.tipo_id,
      ocorreu_em: data.ocorreu_em,
      notas: data.notas,
      responsavel_id: data.responsavel_id,
      prioridade: data.prioridade,
      is_sensitive: data.is_sensitive,
      status: data.status,
      created_at: data.created_at,
      created_by: data.created_by || undefined,
      updated_at: data.updated_at,
      updated_by: data.updated_by || undefined,
      deleted_at: data.deleted_at || undefined,
    }
  } catch (error) {
    console.error('Erro em fetchOcorrenciaById:', error)
    throw error
  }
}

/**
 * Criar nova ocorrência
 */
export async function createOcorrencia(input: OcorrenciaCreateInput): Promise<Ocorrencia> {
  try {
    const { data, error } = await supabase
      .from('ocorrencias')
      .insert({
        cliente_id: input.cliente_id,
        grupo_id: input.grupo_id,
        tipo_id: input.tipo_id,
        ocorreu_em: input.ocorreu_em,
        notas: input.notas,
        responsavel_id: input.responsavel_id,
        prioridade: input.prioridade || 'media',
        is_sensitive: input.is_sensitive || false,
        status: input.status || 'aberta',
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar ocorrência:', error)
      throw error
    }

    return {
      id: data.id,
      cliente_id: data.cliente_id,
      grupo_id: data.grupo_id,
      tipo_id: data.tipo_id,
      ocorreu_em: data.ocorreu_em,
      notas: data.notas,
      responsavel_id: data.responsavel_id,
      prioridade: data.prioridade,
      is_sensitive: data.is_sensitive,
      status: data.status,
      created_at: data.created_at,
      created_by: data.created_by || undefined,
      updated_at: data.updated_at,
      updated_by: data.updated_by || undefined,
      deleted_at: data.deleted_at || undefined,
    }
  } catch (error) {
    console.error('Erro em createOcorrencia:', error)
    throw error
  }
}

/**
 * Atualizar ocorrência existente
 */
export async function updateOcorrencia(id: string, input: OcorrenciaUpdateInput): Promise<Ocorrencia> {
  try {
    const updateData: any = {}

    if (input.grupo_id !== undefined) updateData.grupo_id = input.grupo_id
    if (input.tipo_id !== undefined) updateData.tipo_id = input.tipo_id
    if (input.ocorreu_em !== undefined) updateData.ocorreu_em = input.ocorreu_em
    if (input.notas !== undefined) updateData.notas = input.notas
    if (input.responsavel_id !== undefined) updateData.responsavel_id = input.responsavel_id
    if (input.prioridade !== undefined) updateData.prioridade = input.prioridade
    if (input.is_sensitive !== undefined) updateData.is_sensitive = input.is_sensitive
    if (input.status !== undefined) updateData.status = input.status

    const { data, error } = await supabase
      .from('ocorrencias')
      .update(updateData)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar ocorrência:', error)
      throw error
    }

    return {
      id: data.id,
      cliente_id: data.cliente_id,
      grupo_id: data.grupo_id,
      tipo_id: data.tipo_id,
      ocorreu_em: data.ocorreu_em,
      notas: data.notas,
      responsavel_id: data.responsavel_id,
      prioridade: data.prioridade,
      is_sensitive: data.is_sensitive,
      status: data.status,
      created_at: data.created_at,
      created_by: data.created_by || undefined,
      updated_at: data.updated_at,
      updated_by: data.updated_by || undefined,
      deleted_at: data.deleted_at || undefined,
    }
  } catch (error) {
    console.error('Erro em updateOcorrencia:', error)
    throw error
  }
}

/**
 * Soft delete de uma ocorrência
 */
export async function deleteOcorrencia(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('ocorrencias')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null)

    if (error) {
      console.error('Erro ao deletar ocorrência:', error)
      throw error
    }
  } catch (error) {
    console.error('Erro em deleteOcorrencia:', error)
    throw error
  }
}

/**
 * Buscar grupos de ocorrências
 */
export async function fetchOcorrenciaGrupos(responsavelId?: string): Promise<OcorrenciaGrupo[]> {
  try {
    let query = supabase
      .from('ocorrencia_grupos')
      .select('*')
      .eq('is_active', true)
      .order('nome', { ascending: true })

    if (responsavelId) {
      query = query.eq('responsavel_id', responsavelId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar grupos de ocorrências:', error)
      throw error
    }

    return (data || []).map((item) => ({
      id: item.id,
      nome: item.nome,
      descricao: item.descricao || undefined,
      is_active: item.is_active,
      responsavel_id: item.responsavel_id,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }))
  } catch (error) {
    console.error('Erro em fetchOcorrenciaGrupos:', error)
    throw error
  }
}

/**
 * Buscar tipos de ocorrências
 */
export async function fetchOcorrenciaTipos(grupoId?: string): Promise<OcorrenciaTipo[]> {
  try {
    let query = supabase
      .from('ocorrencia_tipos')
      .select('*')
      .eq('is_active', true)
      .order('nome', { ascending: true })

    if (grupoId) {
      query = query.eq('grupo_id', grupoId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar tipos de ocorrências:', error)
      throw error
    }

    return (data || []).map((item) => ({
      id: item.id,
      grupo_id: item.grupo_id,
      nome: item.nome,
      descricao: item.descricao || undefined,
      is_active: item.is_active,
      responsavel_id: item.responsavel_id,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }))
  } catch (error) {
    console.error('Erro em fetchOcorrenciaTipos:', error)
    throw error
  }
}
