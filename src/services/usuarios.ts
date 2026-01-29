import { supabase } from './supabase'
import { User } from '@/types'

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
