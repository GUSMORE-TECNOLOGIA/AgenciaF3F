import { supabase } from './supabase'
import type { Perfil, PerfilPermissao, ModuloSistema } from '@/types'

export const MODULOS_SISTEMA: { value: ModuloSistema; label: string }[] = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'clientes', label: 'Clientes' },
  { value: 'servicos', label: 'Serviços' },
  { value: 'planos', label: 'Planos' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'ocorrencias', label: 'Ocorrências' },
  { value: 'atendimento', label: 'Atendimento' },
  { value: 'equipe', label: 'Equipe' },
]

function mapPerfil(row: Record<string, unknown>): Perfil {
  return {
    id: row.id as string,
    nome: row.nome as string,
    descricao: (row.descricao as string) ?? undefined,
    slug: (row.slug as string) ?? undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }
}

function mapPermissao(row: Record<string, unknown>): PerfilPermissao {
  return {
    perfil_id: row.perfil_id as string,
    modulo: row.modulo as ModuloSistema,
    pode_visualizar: !!row.pode_visualizar,
    pode_editar: !!row.pode_editar,
    pode_excluir: !!row.pode_excluir,
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
  }
}

export async function fetchPerfis(): Promise<Perfil[]> {
  const { data, error } = await supabase
    .from('perfis')
    .select('*')
    .order('nome')

  if (error) {
    console.error('Erro ao buscar perfis:', error)
    throw error
  }
  return (data || []).map(mapPerfil)
}

export async function fetchPermissoesByPerfil(perfilId: string): Promise<PerfilPermissao[]> {
  const { data, error } = await supabase
    .from('perfil_permissoes')
    .select('*')
    .eq('perfil_id', perfilId)

  if (error) {
    console.error('Erro ao buscar permissões do perfil:', error)
    throw error
  }
  return (data || []).map(mapPermissao)
}

export async function createPerfil(input: { nome: string; descricao?: string; slug?: string }): Promise<Perfil> {
  const { data, error } = await supabase
    .from('perfis')
    .insert({
      nome: input.nome,
      descricao: input.descricao ?? null,
      slug: input.slug ?? null,
    })
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar perfil:', error)
    throw error
  }
  return mapPerfil(data)
}

export async function updatePerfil(
  id: string,
  input: { nome: string; descricao?: string; slug?: string }
): Promise<Perfil> {
  const { data, error } = await supabase
    .from('perfis')
    .update({
      nome: input.nome,
      descricao: input.descricao ?? null,
      slug: input.slug ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Erro ao atualizar perfil:', error)
    throw error
  }
  return mapPerfil(data)
}

export async function deletePerfil(id: string): Promise<void> {
  const { error } = await supabase.from('perfis').delete().eq('id', id)
  if (error) {
    console.error('Erro ao excluir perfil:', error)
    throw error
  }
}

/** Salva todas as permissões de um perfil (upsert por perfil_id + modulo). */
export async function savePermissoes(perfilId: string, permissoes: PerfilPermissao[]): Promise<void> {
  const rows = permissoes.map((p) => ({
    perfil_id: perfilId,
    modulo: p.modulo,
    pode_visualizar: p.pode_visualizar,
    pode_editar: p.pode_editar,
    pode_excluir: p.pode_excluir,
  }))

  const { error } = await supabase.from('perfil_permissoes').upsert(rows, {
    onConflict: 'perfil_id,modulo',
  })

  if (error) {
    console.error('Erro ao salvar permissões:', error)
    throw error
  }
}

/** Retorna permissões do usuário por módulo (a partir do perfil do usuário). */
export async function fetchPermissoesUsuario(userId: string): Promise<PerfilPermissao[]> {
  const { data: user, error: userError } = await supabase
    .from('usuarios')
    .select('perfil_id')
    .eq('id', userId)
    .single()

  if (userError || !user?.perfil_id) {
    return []
  }

  return fetchPermissoesByPerfil(user.perfil_id)
}
