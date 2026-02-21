import { supabase } from './supabase'

/**
 * Altera a senha de um usuário (Auth). Apenas administradores.
 * Chamada via Edge Function com session do admin.
 */
export async function adminUpdateUserPassword(userId: string, newPassword: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ ok?: boolean; error?: string }>(
    'admin-update-user-password',
    {
      body: {
        userId: userId.trim(),
        newPassword,
      },
    }
  )

  if (error) {
    console.error('adminUpdateUserPassword:', error)
    throw error
  }

  const parsed = data as { error?: string } | null
  if (parsed?.error) {
    throw new Error(parsed.error)
  }
}
