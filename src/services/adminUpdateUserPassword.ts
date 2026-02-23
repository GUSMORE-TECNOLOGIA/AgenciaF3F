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
    if (msg.includes('Failed to send') || msg.includes('fetch')) {
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
