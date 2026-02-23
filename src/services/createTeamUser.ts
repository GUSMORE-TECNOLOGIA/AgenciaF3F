import { supabase } from './supabase'

export interface CreateTeamUserInput {
  email: string
  name: string
  /** Slug do perfil (admin, gerente, agente, suporte, financeiro). Usado se perfil_id não for informado. */
  perfil?: 'admin' | 'gerente' | 'agente' | 'suporte' | 'financeiro'
  /** ID do perfil em perfis (prioridade sobre perfil). */
  perfil_id?: string
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
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()
  if (sessionError || !session?.access_token) {
    throw new Error('Sessão expirada ou inválida. Faça login novamente e tente criar o usuário.')
  }

  const { data, error } = await supabase.functions.invoke<CreateTeamUserResult | { error: string }>(
    'create-team-user',
    {
      body: {
        email: input.email.trim().toLowerCase(),
        name: (input.name || input.email.split('@')[0] || 'Usuário').trim(),
        perfil: input.perfil || 'agente',
        perfil_id: input.perfil_id ?? undefined,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    }
  )

  if (error) {
    console.error('createTeamUser:', error)
    const msg = error?.message ?? ''
    const parsed = (data as { error?: string } | null)?.error
    // 401 ou token inválido: função respondeu, mas sessão não aceita
    if (
      msg.includes('401') ||
      msg.includes('non-2xx') ||
      parsed === 'Token inválido ou expirado' ||
      parsed === 'Token ausente'
    ) {
      throw new Error('Sessão expirada ou inválida. Faça login novamente e tente criar o usuário.')
    }
    // Falha de rede/conexão (função não alcançada)
    if (/failed to send|fetch failed|network error/i.test(msg) || msg.includes('Failed to send a request')) {
      throw new Error(
        'Não foi possível conectar à função de criação de usuário. Verifique se a Edge Function "create-team-user" está implantada no Supabase (Dashboard > Edge Functions ou: supabase functions deploy create-team-user).'
      )
    }
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
