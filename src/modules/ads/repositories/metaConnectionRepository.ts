import { supabase } from '@/services/supabase'
import type { MetaConnectionEntity } from '@/modules/ads/entities/metaConnection'

async function getCurrentUserId() {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Não autenticado')
  }

  return user.id
}

export async function fetchCurrentUserMetaConnection(): Promise<MetaConnectionEntity | null> {
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('meta_connections')
    .select('id, user_id, access_token, expires_at, created_at, updated_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data as MetaConnectionEntity | null) ?? null
}

export async function deleteCurrentUserMetaConnection() {
  const userId = await getCurrentUserId()
  const { error } = await supabase.from('meta_connections').delete().eq('user_id', userId)
  if (error) throw new Error(error.message)
}
