export interface MetaConnectionEntity {
  id: string
  user_id: string
  access_token: string
  expires_at: string | null
  created_at?: string
  updated_at?: string
}

export function isMetaConnectionActive(connection: MetaConnectionEntity | null): boolean {
  if (!connection?.access_token) return false
  if (!connection.expires_at) return true
  return new Date(connection.expires_at).getTime() > Date.now()
}
