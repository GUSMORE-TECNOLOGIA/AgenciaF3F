import { supabase } from './supabase'
import { EquipeMembro } from '@/types'

export interface EquipeMembroInput {
  nome_completo: string
  email?: string
  telefone?: string
  perfil: EquipeMembro['perfil']
  /** ID do perfil (prioridade para vincular ao usuário). */
  perfil_id?: string | null
  status: EquipeMembro['status']
  user_id?: string | null
}

function mapEquipeMembro(data: any): EquipeMembro {
  return {
    id: data.id,
    nome_completo: data.nome_completo,
    email: data.email || undefined,
    telefone: data.telefone || undefined,
    perfil: data.cargo ?? data.perfil,
    status: data.status,
    user_id: data.user_id || undefined,
    responsavel_id: data.responsavel_id,
    created_at: data.created_at,
    updated_at: data.updated_at,
    deleted_at: data.deleted_at || undefined,
  }
}

export async function fetchEquipeMembros(): Promise<EquipeMembro[]> {
  const { data, error } = await supabase
    .from('equipe_membros')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar membros da equipe:', error)
    throw error
  }

  return (data || []).map(mapEquipeMembro)
}

export async function createEquipeMembro(
  input: EquipeMembroInput,
  responsavelId: string
): Promise<EquipeMembro> {
  const { data, error } = await supabase
    .from('equipe_membros')
    .insert({
      nome_completo: input.nome_completo,
      email: input.email || null,
      telefone: input.telefone || null,
      cargo: input.perfil,
      status: input.status,
      user_id: input.user_id || null,
      responsavel_id: responsavelId,
    })
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar membro da equipe:', error)
    throw error
  }

  return mapEquipeMembro(data)
}

export async function updateEquipeMembro(id: string, input: EquipeMembroInput): Promise<EquipeMembro> {
  const { data, error } = await supabase
    .from('equipe_membros')
    .update({
      nome_completo: input.nome_completo,
      email: input.email || null,
      telefone: input.telefone || null,
      cargo: input.perfil,
      status: input.status,
      user_id: input.user_id || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) {
    console.error('Erro ao atualizar membro da equipe:', error)
    throw error
  }

  return mapEquipeMembro(data)
}

export async function deleteEquipeMembro(id: string): Promise<void> {
  const { error } = await supabase.rpc('soft_delete_equipe_membro', { membro_id: id })

  if (error) {
    console.error('Erro ao excluir membro da equipe:', error)
    throw error
  }
}
