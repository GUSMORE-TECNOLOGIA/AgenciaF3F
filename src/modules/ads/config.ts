/**
 * URLs e constantes do módulo Meta Ads (`/ads`).
 * OAuth: o mesmo valor deve existir no app Meta (Redirect URI) e em META_OAUTH_REDIRECT_URI (Edge).
 */
export function getAdsMetaOAuthRedirectUri(): string {
  const env = import.meta.env.VITE_ADS_META_OAUTH_REDIRECT_URI as string | undefined
  if (env && env.trim().length > 0) return env.trim()
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/ads/auth/meta/callback`
  }
  return 'https://agenciaf3f.app/ads/auth/meta/callback'
}
