import { supabase } from './supabase'

export interface CreateTeamUserInput {
  email: string
  name: string
  perfil?: 'admin' | 'gerente' | 'agente' | 'suporte'
}

export interface CreateTeamUserResult {
  id: string
  created: boolean
}

/**
 * Cria usuário no Auth + usuarios via Edge Function.
 * Senha padrão 123456; must_reset_password = true.
 * Requer usuário logado com role admin.
 */
export async function createTeamUser(input: CreateTeamUserInput): Promise<CreateTeamUserResult> {
  const { data, error } = await supabase.functions.invoke<CreateTeamUserResult | { error: string }>(
    'create-team-user',
    {
      body: {
        email: input.email.trim().toLowerCase(),
        name: (input.name || input.email.split('@')[0] || 'Usuário').trim(),
        perfil: input.perfil || 'agente',
      },
    }
  )

  if (error) {
    console.error('createTeamUser:', error)
    throw error
  }

  const parsed = data as { error?: string; id?: string; created?: boolean } | null
  if (parsed?.error) {
    throw new Error(parsed.error)
  }
  if (!parsed?.id) {
    throw new Error('Resposta inválida da função')
  }

  return { id: parsed.id, created: parsed.created ?? true }
}
