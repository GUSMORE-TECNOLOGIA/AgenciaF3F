import { supabase } from './supabase'

/**
 * Altera a senha de um usuário (Auth). Apenas administradores.
 * Chamada via Edge Function com session do admin.
 */
export async function adminUpdateUserPassword(userId: string, newPassword: string): Promise<void> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()
  if (sessionError || !session?.access_token) {
    throw new Error('Sessão expirada ou inválida. Faça login novamente.')
  }

  const { data, error } = await supabase.functions.invoke<{ ok?: boolean; error?: string }>(
    'admin-update-user-password',
    {
      body: {
        userId: userId.trim(),
        newPassword,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    }
  )

  if (error) {
    console.error('adminUpdateUserPassword:', error)
    const msg = error?.message ?? ''
    let parsedError = (data as { error?: string } | null)?.error
    if (!parsedError && error && typeof (error as { context?: Response }).context?.json === 'function') {
      try {
        const body = await (error as { context: Response }).context.json()
        parsedError = body?.error
      } catch {
        /* ignorar */
      }
    }
    if (
      msg.includes('401') ||
      parsedError === 'Token inválido ou expirado' ||
      parsedError === 'Token ausente'
    ) {
      throw new Error('Sessão expirada ou inválida. Faça login novamente.')
    }
    if (parsedError && typeof parsedError === 'string') {
      throw new Error(parsedError)
    }
    if (msg.includes('non-2xx')) {
      throw new Error('Erro ao alterar senha. Verifique os dados e tente novamente.')
    }
    if (/failed to send|fetch failed|network error/i.test(msg) || msg.includes('Failed to send a request')) {
      throw new Error(
        'Não foi possível conectar à função de alteração de senha. Verifique sua conexão ou tente novamente em instantes.'
      )
    }
    throw error
  }

  const parsed = data as { error?: string } | null
  if (parsed?.error) {
    throw new Error(parsed.error)
  }
}
