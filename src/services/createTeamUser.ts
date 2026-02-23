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
    let parsedError = (data as { error?: string } | null)?.error
    // Resposta non-2xx: body pode vir em error.context (supabase-js)
    if (!parsedError && error && typeof (error as { context?: Response }).context?.json === 'function') {
      try {
        const body = await (error as { context: Response }).context.json()
        parsedError = body?.error
      } catch {
        // ignorar falha ao parsear
      }
    }
    // Só 401: token ausente ou inválido (não confundir com 400 = dados inválidos)
    if (
      msg.includes('401') ||
      parsedError === 'Token inválido ou expirado' ||
      parsedError === 'Token ausente'
    ) {
      throw new Error('Sessão expirada ou inválida. Faça login novamente e tente criar o usuário.')
    }
    // 400/403/500: mostrar a mensagem que a função devolveu (ex.: "Email inválido")
    if (parsedError && typeof parsedError === 'string') {
      throw new Error(parsedError)
    }
    // Resposta de erro sem body legível (ex.: 400 genérico)
    if (msg.includes('non-2xx')) {
      throw new Error('Erro ao criar usuário. Verifique o e-mail e tente novamente.')
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
