import { supabase } from './supabase'
import { User } from '@/types'

/**
 * Lista de usuários para dropdown "Responsável" (ocorrências, etc.) com nome completo (equipe).
 */
export async function fetchUsuariosParaSelecaoResponsavel(): Promise<Array<{ id: string; email: string; name: string }>> {
  try {
    const { data, error } = await supabase.rpc('get_usuarios_para_selecao_responsavel')
    if (error) {
      console.error('Erro ao buscar usuários para seleção:', error)
      throw error
    }
    const rows = Array.isArray(data) ? data : []
    return rows.map((r: { id: string; email: string | null; nome_completo: string | null }) => ({
      id: String(r.id),
      email: r.email ?? '',
      name: r.nome_completo ?? '',
    }))
  } catch (error) {
    console.error('Erro em fetchUsuariosParaSelecaoResponsavel:', error)
    throw error
  }
}

/**
 * Buscar lista de usuários
 */
export async function fetchUsuarios(): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Erro ao buscar usuários:', error)
      throw error
    }

    return (data || []).map((item) => ({
      id: item.id,
      email: item.email,
      name: item.name,
      role: item.role,
      perfil: item.perfil,
      perfil_id: item.perfil_id ?? undefined,
      must_reset_password: item.must_reset_password,
      password_reset_at: item.password_reset_at || undefined,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }))
  } catch (error) {
    console.error('Erro em fetchUsuarios:', error)
    throw error
  }
}

/**
 * Buscar um usuário por ID
 */
export async function fetchUsuarioById(id: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('Erro ao buscar usuário:', error)
      throw error
    }
    if (!data) return null

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      perfil: data.perfil,
      perfil_id: data.perfil_id ?? undefined,
      must_reset_password: data.must_reset_password,
      password_reset_at: data.password_reset_at || undefined,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  } catch (error) {
    console.error('Erro em fetchUsuarioById:', error)
    throw error
  }
}

/**
 * Listar responsáveis visíveis (id + name) para o dashboard.
 * Via RPC; contorna RLS em usuarios.
 */
export async function fetchResponsaveisParaDashboard(): Promise<Array<{ id: string; name: string }>> {
  try {
    const { data, error } = await supabase.rpc('get_responsaveis_para_dashboard')

    if (error) {
      console.error('Erro ao buscar responsáveis para dashboard:', error)
      return []
    }
    const rows = Array.isArray(data) ? data : []
    return rows.map((r: { id: string; name: string }) => ({ id: String(r.id), name: String(r.name || '') }))
  } catch (error) {
    console.error('Erro em fetchResponsaveisParaDashboard:', error)
    return []
  }
}

/**
 * Principais por cliente (cliente_responsaveis com role 'principal').
 * Para lista de clientes; uso apenas da aba Responsáveis.
 */
export async function fetchPrincipaisParaLista(): Promise<Array<{ cliente_id: string; responsavel_id: string; responsavel_name: string }>> {
  try {
    const { data, error } = await supabase.rpc('get_principais_para_lista')
    if (error) {
      console.error('Erro ao buscar principais para lista:', error)
      return []
    }
    const rows = Array.isArray(data) ? data : []
    return rows.map((r: { cliente_id: string; responsavel_id: string; responsavel_name: string }) => ({
      cliente_id: String(r.cliente_id),
      responsavel_id: String(r.responsavel_id),
      responsavel_name: String(r.responsavel_name ?? ''),
    }))
  } catch (error) {
    console.error('Erro em fetchPrincipaisParaLista:', error)
    return []
  }
}

/**
 * Atualiza o perfil (perfil_id) de um usuário. Apenas admin pode alterar outros usuários.
 */
export async function updateUsuarioPerfil(userId: string, perfilId: string | null): Promise<void> {
  const { error } = await supabase
    .from('usuarios')
    .update({ perfil_id: perfilId, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) {
    console.error('Erro ao atualizar perfil do usuário:', error)
    throw error
  }
}

/**
 * Atualiza nome e/ou perfil do usuário (uso em Configurações > Equipe). Apenas admin.
 */
export async function updateUsuarioNameAndPerfil(
  userId: string,
  payload: { name?: string; perfil_id?: string | null }
): Promise<void> {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (payload.name !== undefined) updates.name = payload.name
  if (payload.perfil_id !== undefined) updates.perfil_id = payload.perfil_id

  const { error } = await supabase.from('usuarios').update(updates).eq('id', userId)

  if (error) {
    console.error('Erro ao atualizar nome/perfil do usuário:', error)
    throw error
  }
}

/**
 * Buscar apenas o nome do responsável por ID (via RPC).
 * Contorna RLS em usuarios; use para exibir responsável na aba Responsáveis.
 */
export async function fetchResponsavelName(id: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('get_responsavel_name', {
      p_id: id,
    })

    if (error) {
      console.error('Erro ao buscar nome do responsável:', error)
      return null
    }
    return typeof data === 'string' ? data : null
  } catch (error) {
    console.error('Erro em fetchResponsavelName:', error)
    return null
  }
}
